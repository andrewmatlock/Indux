// Compilation methods
// Main compilation logic and utility generation

// Generate utilities from CSS variables
TailwindCompiler.prototype.generateUtilitiesFromVars = function(cssText, usedData) {
    try {
        const utilities = [];
        const generatedRules = new Set(); // Track generated rules to prevent duplicates
        const variables = this.extractThemeVariables(cssText);
        const { classes: usedClasses, variableSuffixes } = usedData;

        if (variables.size === 0) {
            return '';
        }

        // Helper to escape special characters in class names
        const escapeClassName = (className) => {
            return className.replace(/[^a-zA-Z0-9-]/g, '\\$&');
        };

        // Helper to generate a single utility with its variants
        const generateUtility = (baseClass, css) => {
            // Find all variants of this base class that are actually used
            const usedVariants = usedClasses
                .filter(cls => {
                    const parts = cls.split(':');
                    const basePart = parts[parts.length - 1];
                    return basePart === baseClass || (basePart.startsWith('!') && basePart.slice(1) === baseClass);
                });

            // Generate base utility if it's used directly
            if (usedClasses.includes(baseClass)) {
                const rule = `.${escapeClassName(baseClass)} { ${css} }`;
                if (!generatedRules.has(rule)) {
                    utilities.push(rule);
                    generatedRules.add(rule);
                }
            }
            // Generate important version if used
            if (usedClasses.includes('!' + baseClass)) {
                const importantCss = css.includes(';') ? 
                    css.replace(/;/g, ' !important;') : 
                    css + ' !important';
                const rule = `.${escapeClassName('!' + baseClass)} { ${importantCss} }`;
                if (!generatedRules.has(rule)) {
                    utilities.push(rule);
                    generatedRules.add(rule);
                }
            }

            // Generate each variant as a separate class
            for (const variantClass of usedVariants) {
                if (variantClass === baseClass) continue;

                const parsed = this.parseClassName(variantClass);

                // Check if this is an important variant
                const isImportant = parsed.important;
                const cssContent = isImportant ? 
                    (css.includes(';') ? css.replace(/;/g, ' !important;') : css + ' !important') : 
                    css;

                // Build selector by applying variants
                let selector = `.${escapeClassName(variantClass)}`;
                let hasMediaQuery = false;
                let mediaQueryRule = '';

                for (const variant of parsed.variants) {
                    if (variant.isArbitrary) {
                        // Handle arbitrary selectors like [&_figure] or [&_fieldset:has(legend):not(.whatever)]
                        // Convert underscores to spaces, but be careful with complex selectors
                        let arbitrarySelector = variant.selector;
                        
                        arbitrarySelector = arbitrarySelector.replace(/_/g, ' ');
                        selector = { baseClass: selector, arbitrarySelector };
                    } else if (variant.selector.includes('&')) {
                        let nestedSelector = variant.selector;
                        if (nestedSelector.includes(',')) {
                            nestedSelector = nestedSelector
                                .split(',')
                                .map(s => {
                                    const trimmed = s.trim();
                                    if (trimmed.includes('&')) {
                                        return '&' + trimmed.replace(/\s*&\s*/g, '');
                                    }
                                    return '&' + trimmed;
                                })
                                .join(', ');
                        } else {
                            nestedSelector = nestedSelector.replace(/\s*&\s*/g, '');
                            if (!nestedSelector.startsWith('&')) {
                                nestedSelector = '&' + nestedSelector;
                            } else {
                                nestedSelector = nestedSelector.replace(/^&\s*/, '&');
                            }
                        }
                        selector = { baseClass: selector, arbitrarySelector: nestedSelector };
                    } else if (variant.selector.startsWith(':')) {
                        // For pseudo-classes, append to selector
                        selector = `${selector}${variant.selector}`;
                    } else if (variant.selector.startsWith('@')) {
                        // For media queries, wrap the whole rule
                        hasMediaQuery = true;
                        mediaQueryRule = variant.selector;
                    }
                }

                // Generate the final rule
                let rule;
                if (typeof selector === 'object' && selector.arbitrarySelector) {
                    // Handle arbitrary selectors with nested CSS
                    rule = `${selector.baseClass} {\n    ${selector.arbitrarySelector} {\n        ${cssContent}\n    }\n}`;
                } else {
                    // Regular selector
                    rule = `${selector} { ${cssContent} }`;
                }
                
                const finalRule = hasMediaQuery ? 
                    `${mediaQueryRule} { ${rule} }` : 
                    rule;

                if (!generatedRules.has(finalRule)) {
                    utilities.push(finalRule);
                    generatedRules.add(finalRule);
                }
            }
        };

        // Generate utilities based on variable prefix
        for (const [varName, varValue] of variables.entries()) {
            if (!varName.match(this.regexPatterns.tailwindPrefix)) {
                continue;
            }

            const suffix = varName.split('-').slice(1).join('-');
            const value = `var(--${varName})`;
            const prefix = varName.split('-')[0] + '-';
            const generator = this.utilityGenerators[prefix];

            if (generator) {
                const utilityPairs = generator(suffix, value);
                for (const [className, css] of utilityPairs) {
                    // Check if this specific utility class is actually used (including variants and important)
                    const isUsed = usedClasses.some(cls => {
                        // Parse the class to extract the base utility name
                        const parsed = this.parseClassName(cls);
                        const baseClass = parsed.baseClass;
                        
                        // Check both normal and important versions
                        return baseClass === className || 
                               baseClass === '!' + className ||
                               (baseClass.startsWith('!') && baseClass.slice(1) === className);
                    });
                    if (isUsed) {
                        generateUtility(className, css);
                    }

                    // Check for opacity variants of this utility
                    const opacityVariants = usedClasses.filter(cls => {
                        // Parse the class to extract the base utility name
                        const parsed = this.parseClassName(cls);
                        const baseClass = parsed.baseClass;
                        
                        // Check if this class has an opacity modifier and matches our base class
                        if (baseClass.includes('/')) {
                            const baseWithoutOpacity = baseClass.split('/')[0];
                            if (baseWithoutOpacity === className) {
                                const opacity = baseClass.split('/')[1];
                                // Validate that the opacity is a number between 0-100
                                return !isNaN(opacity) && opacity >= 0 && opacity <= 100;
                            }
                        }
                        return false;
                    });

                    // Generate opacity utilities for each variant found
                    for (const variant of opacityVariants) {
                        const opacity = variant.split('/')[1];
                        const opacityValue = `color-mix(in oklch, ${value} ${opacity}%, transparent)`;
                        const opacityCss = css.replace(value, opacityValue);
                        generateUtility(variant, opacityCss);
                    }
                }
            }
        }

        return utilities.join('\n');
    } catch (error) {
        console.error('Error generating utilities:', error);
        return '';
    }
};

// Generate custom utilities from discovered custom utility classes
TailwindCompiler.prototype.generateCustomUtilities = function(usedData) {
    try {
        const utilities = [];
        const generatedRules = new Set();
        const { classes: usedClasses } = usedData;

        if (this.customUtilities.size === 0) {
            return '';
        }

        // Helper to escape special characters in class names
        const escapeClassName = (className) => {
            return className.replace(/[^a-zA-Z0-9-]/g, '\\$&');
        };

        // Helper to generate a single utility with its variants
        const generateUtility = (baseClass, css, selectorInfo) => {
            // Find all variants of this base class that are actually used
            const usedVariants = usedClasses
                .filter(cls => {
                    const parts = cls.split(':');
                    const basePart = parts[parts.length - 1];
                    const isMatch = basePart === baseClass || (basePart.startsWith('!') && basePart.slice(1) === baseClass);
                    return isMatch;
                });

            // Skip generating base utility - it already exists in the CSS
            // Only generate variants and important versions
            
            // Generate important version if used
            if (usedClasses.includes('!' + baseClass)) {
                const importantCss = css.includes(';') ? 
                    css.replace(/;/g, ' !important;') : 
                    css + ' !important';
                let rule;
                if (selectorInfo && selectorInfo.selector) {
                    const variantSel = `.${escapeClassName('!' + baseClass)}`;
                    let contextual = selectorInfo.selector.replace(new RegExp(`\\.${baseClass}(?=[^a-zA-Z0-9_-]|$)`), variantSel);
                    if (contextual === selectorInfo.selector) {
                        // Fallback: append class to the end if base token not found
                        contextual = `${selectorInfo.selector}${variantSel}`;
                    }
                    rule = `${contextual} { ${importantCss} }`;
                } else {
                    rule = `.${escapeClassName('!' + baseClass)} { ${importantCss} }`;
                }
                if (!generatedRules.has(rule)) {
                    utilities.push(rule);
                    generatedRules.add(rule);
                }
            }

            // Generate each variant as a separate class
            for (const variantClass of usedVariants) {
                if (variantClass === baseClass) continue;

                const parsed = this.parseClassName(variantClass);

                // Check if this is an important variant
                const isImportant = parsed.important;
                const cssContent = isImportant ? 
                    (css.includes(';') ? css.replace(/;/g, ' !important;') : css + ' !important') : 
                    css;

                // Build selector by applying variants
                let selector = `.${escapeClassName(variantClass)}`;
                let hasMediaQuery = false;
                let mediaQueryRule = '';

                for (const variant of parsed.variants) {
                    if (variant.isArbitrary) {
                        // Handle arbitrary selectors like [&_figure] or [&_fieldset:has(legend):not(.whatever)]
                        let arbitrarySelector = variant.selector;
                        
                        // Replace underscores with spaces, but preserve them inside parentheses
                        arbitrarySelector = arbitrarySelector.replace(/_/g, ' ');
                        
                        selector = { baseClass: selector, arbitrarySelector };
                    } else if (variant.selector.includes('&')) {
                        let nestedSelector = variant.selector;
                        if (nestedSelector.includes(',')) {
                            nestedSelector = nestedSelector
                                .split(',')
                                .map(s => {
                                    const trimmed = s.trim();
                                    if (trimmed.includes('&')) {
                                        return '&' + trimmed.replace(/\s*&\s*/g, '');
                                    }
                                    return '&' + trimmed;
                                })
                                .join(', ');
                        } else {
                            nestedSelector = nestedSelector.replace(/\s*&\s*/g, '');
                            if (!nestedSelector.startsWith('&')) {
                                nestedSelector = '&' + nestedSelector;
                            } else {
                                nestedSelector = nestedSelector.replace(/^&\s*/, '&');
                            }
                        }
                        selector = { baseClass: selector, arbitrarySelector: nestedSelector };
                    } else if (variant.selector.startsWith(':')) {
                        // For pseudo-classes, append to selector
                        selector = `${selector}${variant.selector}`;
                    } else if (variant.selector.startsWith('@')) {
                        // For media queries, wrap the whole rule
                        hasMediaQuery = true;
                        mediaQueryRule = variant.selector;
                    }
                }

                // Generate the final rule
                let rule;
                if (typeof selector === 'object' && selector.arbitrarySelector) {
                    // Handle arbitrary selectors with nested CSS
                    rule = `${selector.baseClass} {\n    ${selector.arbitrarySelector} {\n        ${cssContent}\n    }\n}`;
                } else {
                    // Regular selector or contextual replacement using original selector info
                    if (selectorInfo && selectorInfo.selector) {
                        const contextualRe = new RegExp(`\\.${baseClass}(?=[^a-zA-Z0-9_-]|$)`);
                        let contextual = selectorInfo.selector.replace(contextualRe, selector);
                        if (contextual === selectorInfo.selector) {
                            // Fallback when base token not directly present
                            contextual = `${selectorInfo.selector}${selector}`;
                        }
                        rule = `${contextual} { ${cssContent} }`;
                    } else {
                        rule = `${selector} { ${cssContent} }`;
                    }
                }
                
                let finalRule;
                if (hasMediaQuery) {
                    // Wrap once for responsive variants unless the rule already contains @media
                    if (typeof rule === 'string' && rule.trim().startsWith('@media')) {
                        finalRule = rule;
                    } else {
                        finalRule = `${mediaQueryRule} { ${rule} }`;
                    }
                } else {
                    finalRule = rule;
                }

                if (!generatedRules.has(finalRule)) {
                    utilities.push(finalRule);
                    generatedRules.add(finalRule);
                }
            }
        };

        // Generate utilities for each custom class that's actually used
        for (const [className, cssOrSelector] of this.customUtilities.entries()) {
            // Check if this specific utility class is actually used (including variants and important)
            const isUsed = usedClasses.some(cls => {
                // Parse the class to extract the base utility name
                const parsed = this.parseClassName(cls);
                const baseClass = parsed.baseClass;
                
                // Check both normal and important versions
                return baseClass === className || 
                       baseClass === '!' + className ||
                       (baseClass.startsWith('!') && baseClass.slice(1) === className);
            });

            if (isUsed) {
                if (typeof cssOrSelector === 'string') {
                    generateUtility(className, cssOrSelector, null);
                } else if (Array.isArray(cssOrSelector)) {
                    for (const entry of cssOrSelector) {
                        if (entry && entry.css && entry.selector) {
                            generateUtility(className, entry.css, { selector: entry.selector });
                        }
                    }
                } else if (cssOrSelector && cssOrSelector.css && cssOrSelector.selector) {
                    generateUtility(className, cssOrSelector.css, { selector: cssOrSelector.selector });
                }
            }
        }

        return utilities.join('\n');
    } catch (error) {
        console.error('Error generating custom utilities:', error);
        return '';
    }
};

// Main compilation method
TailwindCompiler.prototype.compile = async function() {
    const compileStart = performance.now();
    if (this.debug) {
        console.log(`[Indux Utilities] Compile started at ${(compileStart - this.startTime).toFixed(2)}ms`);
    }

    try {
        // Prevent too frequent compilations
        const now = Date.now();
        if (now - this.lastCompileTime < this.minCompileInterval) {
            return;
        }
        this.lastCompileTime = now;

        if (this.isCompiling) {
            return;
        }
        this.isCompiling = true;

        // On first run, scan static classes and CSS variables
        if (!this.hasScannedStatic) {
            await this.scanStaticClasses();
            
            // Fetch CSS content once for initial compilation
            const themeCss = await this.fetchThemeContent();
            if (themeCss) {
                // Extract and cache custom utilities
                const discoveredCustomUtilities = this.extractCustomUtilities(themeCss);
                for (const [name, value] of discoveredCustomUtilities.entries()) {
                    this.customUtilities.set(name, value);
                }

                const variables = this.extractThemeVariables(themeCss);
                for (const [name, value] of variables.entries()) {
                    this.currentThemeVars.set(name, value);
                }
                
                // Generate utilities for all static classes
                const staticUsedData = {
                    classes: Array.from(this.staticClassCache),
                    variableSuffixes: []
                };
                // Process static classes for variable suffixes
                for (const cls of this.staticClassCache) {
                    const parts = cls.split(':');
                    const baseClass = parts[parts.length - 1];
                    const classParts = baseClass.split('-');
                    if (classParts.length > 1) {
                        staticUsedData.variableSuffixes.push(classParts.slice(1).join('-'));
                    }
                }
                
                // Generate both variable-based and custom utilities
                const varUtilities = this.generateUtilitiesFromVars(themeCss, staticUsedData);
                const customUtilitiesGenerated = this.generateCustomUtilities(staticUsedData);
                
                const allUtilities = [varUtilities, customUtilitiesGenerated].filter(Boolean).join('\n\n');
                if (allUtilities) {
                    const finalCss = `@layer utilities {\n${allUtilities}\n}`;
                    
                    // Read critical styles BEFORE clearing (they'll be merged into final CSS)
                    const criticalCss = this.criticalStyleElement && this.criticalStyleElement.textContent ? 
                        `\n\n/* Critical utilities (non-layer, will be overridden by layer utilities) */\n${this.criticalStyleElement.textContent}` : 
                        '';
                    
                    this.styleElement.textContent = finalCss + criticalCss;
                    
                    // Clear critical styles AFTER merging, but wait for paint to ensure no flash
                    // Use requestAnimationFrame to ensure styles are painted before clearing
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // Double RAF ensures paint has occurred
                            if (this.criticalStyleElement && this.criticalStyleElement.textContent) {
                                if (this.debug) {
                                    console.log(`[Indux Utilities] Clearing critical styles after paint`);
                                }
                                this.criticalStyleElement.textContent = '';
                            }
                        });
                    });
                    this.lastClassesHash = staticUsedData.classes.sort().join(',');
                    
                    // Save to cache for next page load
                    const themeHash = this.generateThemeHash(themeCss);
                    const cacheKey = `${this.lastClassesHash}-${themeHash}`;
                    this.cache.set(cacheKey, {
                        css: finalCss,
                        timestamp: Date.now(),
                        themeHash: themeHash
                    });
                    this.savePersistentCache();
                }
            }
            
            this.hasInitialized = true;
            this.isCompiling = false;
            return;
        }

        // For subsequent compilations, check for new dynamic classes
        const usedData = this.getUsedClasses();
        const dynamicClasses = Array.from(this.dynamicClassCache);
        
        // Create a hash of current dynamic classes to detect changes
        const dynamicClassesHash = dynamicClasses.sort().join(',');
        
        // Check if dynamic classes have actually changed
        if (dynamicClassesHash !== this.lastClassesHash || !this.hasInitialized) {
            // Fetch CSS content for dynamic compilation
            const themeCss = await this.fetchThemeContent();
            if (!themeCss) {
                this.isCompiling = false;
                return;
            }

            // Update custom utilities cache if needed
            const discoveredCustomUtilities = this.extractCustomUtilities(themeCss);
            for (const [name, value] of discoveredCustomUtilities.entries()) {
                this.customUtilities.set(name, value);
            }
            
            // Check for variable changes
            const variables = this.extractThemeVariables(themeCss);
            let hasVariableChanges = false;
            for (const [name, value] of variables.entries()) {
                const currentValue = this.currentThemeVars.get(name);
                if (currentValue !== value) {
                    hasVariableChanges = true;
                    this.currentThemeVars.set(name, value);
                }
            }

            // Generate utilities for all classes (static + dynamic) if needed
            if (hasVariableChanges || dynamicClassesHash !== this.lastClassesHash) {
                
                // Generate both variable-based and custom utilities
                const varUtilities = this.generateUtilitiesFromVars(themeCss, usedData);
                const customUtilitiesGenerated = this.generateCustomUtilities(usedData);
                
                const allUtilities = [varUtilities, customUtilitiesGenerated].filter(Boolean).join('\n\n');
                if (allUtilities) {
                    const finalCss = `@layer utilities {\n${allUtilities}\n}`;
                    
                    // Read critical styles BEFORE clearing (they'll be merged into final CSS)
                    const criticalCss = this.criticalStyleElement && this.criticalStyleElement.textContent ? 
                        `\n\n/* Critical utilities (non-layer, will be overridden by layer utilities) */\n${this.criticalStyleElement.textContent}` : 
                        '';
                    
                    this.styleElement.textContent = finalCss + criticalCss;
                    
                    // Clear critical styles AFTER merging, but wait for paint to ensure no flash
                    // Use requestAnimationFrame to ensure styles are painted before clearing
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // Double RAF ensures paint has occurred
                            if (this.criticalStyleElement && this.criticalStyleElement.textContent) {
                                if (this.debug) {
                                    console.log(`[Indux Utilities] Clearing critical styles after paint`);
                                }
                                this.criticalStyleElement.textContent = '';
                            }
                        });
                    });
                    this.lastClassesHash = dynamicClassesHash;
                    
                    // Save to cache for next page load
                    const themeHash = this.generateThemeHash(themeCss);
                    const cacheKey = `${this.lastClassesHash}-${themeHash}`;
                    this.cache.set(cacheKey, {
                        css: finalCss,
                        timestamp: Date.now(),
                        themeHash: themeHash
                    });
                    this.savePersistentCache();
                }
            }
        }

    } catch (error) {
        console.error('[Indux Utilities] Error compiling Tailwind CSS:', error);
    } finally {
        this.isCompiling = false;
        if (this.debug) {
            console.log(`[Indux Utilities] Compile completed in ${(performance.now() - compileStart).toFixed(2)}ms`);
        }
    }
};


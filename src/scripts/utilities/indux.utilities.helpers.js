// Helper methods
// Utility functions for extracting, parsing, and processing CSS and classes

// Discover CSS files from stylesheets and imports
TailwindCompiler.prototype.discoverCssFiles = function() {
    try {
        // Get all stylesheets from the document
        const stylesheets = Array.from(document.styleSheets);

        // Process each stylesheet
        for (const sheet of stylesheets) {
            try {
                // Process local files and @indux CDN files
                if (sheet.href && (
                    sheet.href.startsWith(window.location.origin) ||
                    sheet.href.includes('@indux') ||
                    (sheet.href.includes('jsdelivr') && sheet.href.includes('@indux')) ||
                    (sheet.href.includes('unpkg') && sheet.href.includes('@indux'))
                )) {
                    this.cssFiles.add(sheet.href);
                }

                // Get all @import rules (local and @indux CDN)
                const rules = Array.from(sheet.cssRules || []);
                for (const rule of rules) {
                    if (rule.type === CSSRule.IMPORT_RULE && rule.href && (
                        rule.href.startsWith(window.location.origin) ||
                        rule.href.includes('@indux') ||
                        (rule.href.includes('jsdelivr') && rule.href.includes('@indux')) ||
                        (rule.href.includes('unpkg') && rule.href.includes('@indux'))
                    )) {
                        this.cssFiles.add(rule.href);
                    }
                }
            } catch (e) {
                // Skip stylesheets that can't be accessed (external CDN files, CORS, etc.)
            }
        }

        // Add any inline styles (exclude generated styles)
        const styleElements = document.querySelectorAll('style:not(#utility-styles)');
        for (const style of styleElements) {
            if (style.textContent && style.textContent.trim()) {
                const id = style.id || `inline-style-${Array.from(styleElements).indexOf(style)}`;
                this.cssFiles.add('inline:' + id);
            }
        }
    } catch (error) {
        console.warn('Error discovering CSS files:', error);
    }
};

// Scan static HTML files and components for classes
TailwindCompiler.prototype.scanStaticClasses = async function() {
    if (this.staticScanPromise) {
        return this.staticScanPromise;
    }

    this.staticScanPromise = (async () => {
        try {
            const staticClasses = new Set();

            // 1. Scan index.html content
            const htmlContent = document.documentElement.outerHTML;
            this.extractClassesFromHTML(htmlContent, staticClasses);

            // 2. Scan component files from manifest
            const registry = window.InduxComponentsRegistry;
            const componentUrls = [];
            
            if (registry && registry.manifest) {
                // Get all component paths from manifest
                const allComponents = [
                    ...(registry.manifest.preloadedComponents || []),
                    ...(registry.manifest.components || [])
                ];
                componentUrls.push(...allComponents);
            }

            const componentPromises = componentUrls.map(async (url) => {
                try {
                    const response = await fetch('/' + url);
                    if (response.ok) {
                        const html = await response.text();
                        this.extractClassesFromHTML(html, staticClasses);
                    }
                } catch (error) {
                    // Silently ignore missing components
                }
            });

            await Promise.all(componentPromises);

            // Cache static classes
            for (const cls of staticClasses) {
                this.staticClassCache.add(cls);
            }

            this.hasScannedStatic = true;

            return staticClasses;
        } catch (error) {
            console.warn('[TailwindCompiler] Error scanning static classes:', error);
            this.hasScannedStatic = true;
            return new Set();
        }
    })();

    return this.staticScanPromise;
};

// Extract classes from HTML content
TailwindCompiler.prototype.extractClassesFromHTML = function(html, classSet) {
    // Match class attributes: class="..." or class='...'
    const classRegex = /class=["']([^"']+)["']/g;
    let match;
    
    while ((match = classRegex.exec(html)) !== null) {
        const classString = match[1];
        const classes = classString.split(/\s+/).filter(Boolean);
        for (const cls of classes) {
            if (cls && !cls.startsWith('x-') && !cls.startsWith('$')) {
                classSet.add(cls);
            }
        }
    }

    // Also check for x-data and other Alpine directives that might contain classes
    const alpineRegex = /x-(?:data|bind:class|class)=["']([^"']+)["']/g;
    while ((match = alpineRegex.exec(html)) !== null) {
        // Simple extraction - could be enhanced for complex Alpine expressions
        const content = match[1];
        const classMatches = content.match(/['"`]([^'"`\s]+)['"`]/g);
        if (classMatches) {
            for (const classMatch of classMatches) {
                const cls = classMatch.replace(/['"`]/g, '');
                if (cls && !cls.startsWith('$') && !cls.includes('(')) {
                    classSet.add(cls);
                }
            }
        }
    }
};

// Get all used classes from static and dynamic sources
TailwindCompiler.prototype.getUsedClasses = function() {
    try {
        const allClasses = new Set();
        const usedVariableSuffixes = new Set();

        // Add static classes (pre-scanned)
        for (const cls of this.staticClassCache) {
            allClasses.add(cls);
        }

        // Scan current DOM for dynamic classes only
        const elements = document.getElementsByTagName('*');
        for (const element of elements) {
            let classes = [];
            if (typeof element.className === 'string') {
                classes = element.className.split(/\s+/).filter(Boolean);
            } else if (element.classList) {
                classes = Array.from(element.classList);
            }

            for (const cls of classes) {
                if (!cls) continue;

                // Skip classes using configurable patterns
                const isIgnoredClass = this.ignoredClassPatterns.some(pattern => 
                    pattern.test(cls)
                );
                
                if (isIgnoredClass) {
                    continue;
                }

                // Add all classes (static + dynamic)
                allClasses.add(cls);

                // Track dynamic classes separately
                if (!this.staticClassCache.has(cls)) {
                    this.dynamicClassCache.add(cls);
                }
            }
        }

        // Process all classes for variable suffixes
        for (const cls of allClasses) {
            // Extract base class and variants
            const parts = cls.split(':');
            const baseClass = parts[parts.length - 1];

            // Extract suffix for variable matching
            const classParts = baseClass.split('-');
            if (classParts.length > 1) {
                let suffix = classParts.slice(1).join('-');

                // Handle opacity modifiers (like /90, /50)
                let baseSuffix = suffix;
                if (suffix.includes('/')) {
                    const parts = suffix.split('/');
                    baseSuffix = parts[0];
                    const opacity = parts[1];

                    // Add both the base suffix and the full suffix with opacity
                    usedVariableSuffixes.add(baseSuffix);
                    usedVariableSuffixes.add(suffix); // Keep the full suffix with opacity
                } else {
                    usedVariableSuffixes.add(suffix);
                }

                // For compound classes like text-content-subtle, also add the full suffix
                if (classParts.length > 2) {
                    const fullSuffix = classParts.slice(1).join('-');
                    if (fullSuffix.includes('/')) {
                        usedVariableSuffixes.add(fullSuffix.split('/')[0]);
                    } else {
                        usedVariableSuffixes.add(fullSuffix);
                    }
                }
            }
        }

        const result = {
            classes: Array.from(allClasses),
            variableSuffixes: Array.from(usedVariableSuffixes)
        };

        return result;
    } catch (error) {
        console.error('Error getting used classes:', error);
        return { classes: [], variableSuffixes: [] };
    }
};

// Fetch theme content from CSS files
TailwindCompiler.prototype.fetchThemeContent = async function() {
    const themeContents = new Set();
    const fetchPromises = [];

    // If we haven't discovered CSS files yet, do it now
    if (this.cssFiles.size === 0) {
        this.discoverCssFiles();
    }

    // Process all files concurrently
    for (const source of this.cssFiles) {
        const fetchPromise = (async () => {
            try {
                let content = '';
                let needsFetch = true;

                if (source.startsWith('inline:')) {
                    const styleId = source.replace('inline:', '');
                    const styleElement = styleId ?
                        document.getElementById(styleId) :
                        document.querySelector('style');
                    if (styleElement) {
                        content = styleElement.textContent;
                    }
                    needsFetch = false;
                } else {
                    // Smart caching: use session storage + timestamp approach
                    const cacheKey = source;
                    const cached = this.cssContentCache.get(cacheKey);
                    const now = Date.now();
                    
                    // Different cache times based on file source
                    let cacheTime;
                    if (source.includes('@indux') || source.includes('jsdelivr') || source.includes('unpkg')) {
                        // CDN files: cache longer (5 minutes for static, 1 minute for dynamic)
                        cacheTime = this.hasScannedStatic ? 60000 : 300000;
                    } else {
                        // Local files: shorter cache (5 seconds for dynamic, 30 seconds for static)
                        cacheTime = this.hasScannedStatic ? 5000 : 30000;
                    }
                    
                    if (cached && (now - cached.timestamp) < cacheTime) {
                        content = cached.content;
                        needsFetch = false;
                    }

                    if (needsFetch) {
                        // Add timestamp for development cache busting, but keep it minimal
                        const timestamp = Math.floor(now / 1000); // Only changes every second
                        const url = `${source}?t=${timestamp}`;

                        const response = await fetch(url);

                        if (!response.ok) {
                            console.warn('Failed to fetch stylesheet:', url);
                            return;
                        }

                        content = await response.text();
                        
                        // Cache the content with timestamp
                        this.cssContentCache.set(cacheKey, {
                            content: content,
                            timestamp: now
                        });
                    }
                }

                if (content) {
                    themeContents.add(content);
                }
            } catch (error) {
                console.warn(`Error fetching CSS from ${source}:`, error);
            }
        })();
        fetchPromises.push(fetchPromise);
    }

    // Wait for all fetches to complete
    await Promise.all(fetchPromises);

    return Array.from(themeContents).join('\n');
};

// Extract CSS variables from CSS text
TailwindCompiler.prototype.extractThemeVariables = function(cssText) {
    const variables = new Map();

    // Extract ALL CSS custom properties from ANY declaration block
    const varRegex = /--([\w-]+):\s*([^;]+);/g;

    let varMatch;
    while ((varMatch = varRegex.exec(cssText)) !== null) {
        const name = varMatch[1];
        const value = varMatch[2].trim();
        variables.set(name, value);
    }

    return variables;
};

// Extract custom utilities from CSS text
TailwindCompiler.prototype.extractCustomUtilities = function(cssText) {
    const utilities = new Map();

    // Extract custom utility classes from CSS
    // Match: .classname or .!classname (where classname can contain word chars and hyphens)
    const utilityRegex = /(?:@layer\s+utilities\s*{[^}]*}|^)(?:[^{}]*?)(?:^|\s)(\.!?[\w-]+)\s*{([^}]+)}/gm;

    let match;
    while ((match = utilityRegex.exec(cssText)) !== null) {
        const className = match[1].substring(1); // Remove the leading dot
        const cssRules = match[2].trim();
        
        // Skip if it's a Tailwind-generated class (check base name without !)
        const baseClassName = className.startsWith('!') ? className.slice(1) : className;
        if (this.isTailwindGeneratedClass(baseClassName)) {
            continue;
        }

        // Check if CSS rules contain !important
        const hasImportant = /\s!important/.test(cssRules);
        const classHasImportantPrefix = className.startsWith('!');
        
        // Determine final CSS rules
        let finalCssRules = cssRules;
        if (classHasImportantPrefix) {
            // Class has ! prefix, ensure CSS has !important
            if (!hasImportant) {
                finalCssRules = cssRules.includes(';') ? 
                    cssRules.replace(/;/g, ' !important;') : 
                    cssRules + ' !important';
            }
        } else {
            // Class doesn't have ! prefix, remove !important if present
            if (hasImportant) {
                finalCssRules = cssRules.replace(/\s!important/g, '');
            }
        }

        // Store the utility class with its full name (including ! prefix) as the key
        // This ensures !col is stored separately from col
        if (utilities.has(className)) {
            const existingRules = utilities.get(className);
            utilities.set(className, `${existingRules}; ${finalCssRules}`);
        } else {
            utilities.set(className, finalCssRules);
        }
    }

    // Also look for :where() selectors which are common in Indux utilities
    // Handle both single class and multiple class selectors
    const whereRegex = /:where\(([^)]+)\)\s*{([^}]+)}/g;
    while ((match = whereRegex.exec(cssText)) !== null) {
        const selectorContent = match[1];
        const cssRules = match[2].trim();
        
        // Check if CSS rules contain !important
        const hasImportant = /\s!important/.test(cssRules);
        
        // Extract individual class names from the selector, including those with ! prefix
        // Match: .classname or .!classname (where classname can contain word chars and hyphens)
        const classMatches = selectorContent.match(/\.(!?[\w-]+)/g);
        if (classMatches) {
            for (const classMatch of classMatches) {
                const className = classMatch.substring(1); // Remove the leading dot
                
                // Skip if it's a Tailwind-generated class (but check base name without !)
                const baseClassName = className.startsWith('!') ? className.slice(1) : className;
                if (this.isTailwindGeneratedClass(baseClassName)) {
                    continue;
                }
                
                // Determine if this class should have !important
                // Only apply !important if the class name itself starts with ! (e.g., !col)
                const classHasImportantPrefix = className.startsWith('!');
                let finalCssRules = cssRules;
                
                if (classHasImportantPrefix) {
                    // Class has ! prefix, ensure CSS has !important
                    if (!hasImportant) {
                        finalCssRules = cssRules.includes(';') ? 
                            cssRules.replace(/;/g, ' !important;') : 
                            cssRules + ' !important';
                    }
                } else {
                    // Class doesn't have ! prefix, remove !important if present
                    if (hasImportant) {
                        finalCssRules = cssRules.replace(/\s!important/g, '');
                    }
                }
                
                // Store the class with its full name (including ! prefix) as the key
                // This ensures !col is stored separately from col
                const storageKey = className;
                
                // Combine CSS rules if the class already exists
                if (utilities.has(storageKey)) {
                    const existing = utilities.get(storageKey);
                    // If existing is a string, combine
                    if (typeof existing === 'string') {
                        utilities.set(storageKey, `${existing}; ${finalCssRules}`);
                    } else if (Array.isArray(existing)) {
                        // For array format, we need to handle this differently
                        // For now, convert to string format
                        const existingCss = existing.map(e => e.css || e).join('; ');
                        utilities.set(storageKey, `${existingCss}; ${finalCssRules}`);
                    } else {
                        utilities.set(storageKey, `${existing.css || existing}; ${finalCssRules}`);
                    }
                } else {
                    utilities.set(storageKey, finalCssRules);
                }
            }
        }
    }

    // Fallback: detect classes inside compound selectors (e.g., aside[popover].appear-start { ... })
    try {
        const compoundRegex = /([^{}]+)\{([^}]+)\}/gm;
        let compoundMatch;
        while ((compoundMatch = compoundRegex.exec(cssText)) !== null) {
            const selector = compoundMatch[1].trim();
            const cssRules = compoundMatch[2].trim();

            // Skip at-rules and keyframes/selectors without classes
            if (selector.startsWith('@')) continue;

            // Match: .classname or .!classname
            const classMatches = selector.match(/\.!?[A-Za-z0-9_-]+/g);
            if (!classMatches) continue;

            // Check if CSS rules contain !important
            const hasImportant = /\s!important/.test(cssRules);

            for (const classToken of classMatches) {
                const className = classToken.substring(1); // Remove the leading dot

                // Skip Tailwind-generated or already captured classes (check base name without !)
                const baseClassName = className.startsWith('!') ? className.slice(1) : className;
                if (this.isTailwindGeneratedClass(baseClassName)) continue;

                // Determine if this class should have !important
                const classHasImportantPrefix = className.startsWith('!');
                let finalCssRules = cssRules;
                
                if (classHasImportantPrefix) {
                    // Class has ! prefix, ensure CSS has !important
                    if (!hasImportant) {
                        finalCssRules = cssRules.includes(';') ? 
                            cssRules.replace(/;/g, ' !important;') : 
                            cssRules + ' !important';
                    }
                } else {
                    // Class doesn't have ! prefix, remove !important if present
                    if (hasImportant) {
                        finalCssRules = cssRules.replace(/\s!important/g, '');
                    }
                }

                // Store the class with its full name (including ! prefix) as the key
                if (utilities.has(className)) {
                    const existingRules = utilities.get(className);
                    utilities.set(className, `${existingRules}; ${finalCssRules}`);
                } else {
                    utilities.set(className, finalCssRules);
                }
            }
        }
    } catch (e) {
        // Be tolerant: this is a best-effort extractor
    }

    // Universal fallback with basic nesting resolution for selectors using '&'
    // Captures context like :where(aside[popover]) &.appear-start &:not(:popover-open)
    try {
        const rules = [];

        // Minimal nested CSS resolver: scans and builds combined selectors
        const resolveNested = (text, parentSelector = '') => {
            let i = 0;
            while (i < text.length) {
                // Skip whitespace
                while (i < text.length && /\s/.test(text[i])) i++;
                if (i >= text.length) break;

                // Capture selector up to '{'
                let selStart = i;
                while (i < text.length && text[i] !== '{') i++;
                if (i >= text.length) break;
                const rawSelector = text.slice(selStart, i).trim();

                // Find matching '}' with brace depth
                i++; // skip '{'
                let depth = 1;
                let blockStart = i;
                while (i < text.length && depth > 0) {
                    if (text[i] === '{') depth++;
                    else if (text[i] === '}') depth--;
                    i++;
                }
                const block = text.slice(blockStart, i - 1);

                // Build combined selector by replacing '&' with parentSelector
                const combinedSelector = parentSelector
                    ? rawSelector.replace(/&/g, parentSelector).trim()
                    : rawSelector.trim();

                // Extract immediate declarations (ignore nested blocks and at-rules)
                const extractTopLevelDecls = (content) => {
                    let decl = '';
                    let depth = 0;
                    let i2 = 0;
                    while (i2 < content.length) {
                        const ch = content[i2];
                        if (ch === '{') { depth++; i2++; continue; }
                        if (ch === '}') { depth--; i2++; continue; }
                        if (depth === 0) {
                            decl += ch;
                        }
                        i2++;
                    }
                    // Remove comments and trim whitespace
                    decl = decl.replace(/\/\*[^]*?\*\//g, '').trim();
                    // Remove at-rules at top-level within block (e.g., @starting-style)
                    decl = decl.split(';')
                        .map(s => s.trim())
                        .filter(s => s && !s.startsWith('@') && s.includes(':'))
                        .join('; ');
                    if (decl && !decl.endsWith(';')) decl += ';';
                    return decl;
                };

                const declText = extractTopLevelDecls(block);
                if (declText) {
                    rules.push({ selector: combinedSelector, css: declText });
                }

                // Recurse into nested blocks with current selector as parent
                resolveNested(block, combinedSelector);
            }
        };

        resolveNested(cssText, '');

        // Map resolved rules to utilities by class token presence
        for (const rule of rules) {
            // Clean selector: strip comments and normalize whitespace
            let cleanedSelector = rule.selector.replace(/\/\*[^]*?\*\//g, '').replace(/\s+/g, ' ').trim();
            // Match: .classname or .!classname
            const classTokens = cleanedSelector.match(/\.!?[A-Za-z0-9_-]+/g);
            if (!classTokens) continue;

            // Check if CSS rules contain !important
            const hasImportant = /\s!important/.test(rule.css);

            for (const token of classTokens) {
                const className = token.slice(1); // Remove the leading dot
                
                // Skip Tailwind-generated classes (check base name without !)
                const baseClassName = className.startsWith('!') ? className.slice(1) : className;
                if (this.isTailwindGeneratedClass(baseClassName)) continue;

                // Determine if this class should have !important
                const classHasImportantPrefix = className.startsWith('!');
                let finalCss = rule.css;
                
                if (classHasImportantPrefix) {
                    // Class has ! prefix, ensure CSS has !important
                    if (!hasImportant) {
                        finalCss = rule.css.includes(';') ? 
                            rule.css.replace(/;/g, ' !important;') : 
                            rule.css + ' !important';
                    }
                } else {
                    // Class doesn't have ! prefix, remove !important if present
                    if (hasImportant) {
                        finalCss = rule.css.replace(/\s!important/g, '');
                    }
                }

                // Store selector-aware utility so variants preserve context and pseudos
                // Use full className (including !) as the key
                const value = { selector: cleanedSelector, css: finalCss };
                if (utilities.has(className)) {
                    const existing = utilities.get(className);
                    if (typeof existing === 'string') {
                        utilities.set(className, [ { selector: `.${className}`, css: existing }, value ]);
                    } else if (Array.isArray(existing)) {
                        const found = existing.find(e => e.selector === value.selector);
                        if (found) {
                            found.css = `${found.css}; ${value.css}`;
                        } else {
                            existing.push(value);
                        }
                    } else if (existing && existing.selector) {
                        if (existing.selector === value.selector) {
                            existing.css = `${existing.css}; ${value.css}`;
                            utilities.set(className, [ existing ]);
                        } else {
                            utilities.set(className, [ existing, value ]);
                        }
                    }
                } else {
                    utilities.set(className, [ value ]);
                }
            }
        }
    } catch (e) {
        // Tolerate parsing errors; this is best-effort
    }

    return utilities;
};

// Check if a class name looks like a Tailwind-generated class
TailwindCompiler.prototype.isTailwindGeneratedClass = function(className) {
    // Check if this looks like a Tailwind-generated class
    const tailwindPatterns = [
        /^[a-z]+-\d+$/, // spacing, sizing classes like p-4, w-10
        /^[a-z]+-\[/, // arbitrary values like w-[100px]
        /^(text|bg|border|ring|shadow|opacity|scale|rotate|translate|skew|origin|transform|transition|duration|delay|ease|animate|backdrop|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|filter|backdrop-)/, // common Tailwind prefixes
        /^(sm|md|lg|xl|2xl):/, // responsive prefixes
        /^(hover|focus|active|disabled|group-hover|group-focus|peer-hover|peer-focus):/, // state prefixes
        /^(dark|light):/, // theme prefixes
        /^!/, // important modifier
        /^\[/, // arbitrary selectors
    ];

    return tailwindPatterns.some(pattern => pattern.test(className));
};

// Parse a class name into its components (variants, base class, important)
TailwindCompiler.prototype.parseClassName = function(className) {
    // Check cache first
    if (this.classCache.has(className)) {
        return this.classCache.get(className);
    }

    const result = {
        important: className.startsWith('!'),
        variants: [],
        baseClass: className
    };

    // Remove important modifier if present
    if (result.important) {
        className = className.slice(1);
    }

    // Split by variant separator, but preserve content within brackets
    const parts = [];
    let current = '';
    let bracketDepth = 0;
    
    for (let i = 0; i < className.length; i++) {
        const char = className[i];
        
        if (char === '[') {
            bracketDepth++;
        } else if (char === ']') {
            bracketDepth--;
        }
        
        if (char === ':' && bracketDepth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current); // Add the last part
    
    result.baseClass = parts.pop(); // Last part is always the base class

    // Process variants in order (left to right)
    result.variants = parts.map(variant => {
        // Check for arbitrary selector variants [&_selector]
        if (variant.startsWith('[') && variant.endsWith(']')) {
            const arbitrarySelector = variant.slice(1, -1); // Remove brackets
            if (arbitrarySelector.startsWith('&')) {
                return {
                    name: variant,
                    selector: arbitrarySelector,
                    isArbitrary: true
                };
            }
        }
        
        const selector = this.variants[variant];
        if (!selector) {
            console.warn(`Unknown variant: ${variant}`);
            return null;
        }
        return {
            name: variant,
            selector: selector,
            isArbitrary: false
        };
    }).filter(Boolean);

    // Cache the result
    this.classCache.set(className, result);
    return result;
};


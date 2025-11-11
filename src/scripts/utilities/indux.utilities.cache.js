// Cache management
// Methods for loading, saving, and managing cached utilities

// Load and apply cached utilities
TailwindCompiler.prototype.loadAndApplyCache = function() {
    const cacheStart = performance.now();
    if (this.debug) {
        console.log(`[Indux Utilities] Loading cache at ${(cacheStart - this.startTime).toFixed(2)}ms`);
    }
    try {
        const cached = localStorage.getItem('tailwind-cache');
        if (cached) {
            if (this.debug) {
                console.log(`[Indux Utilities] Cache found, size: ${cached.length} chars`);
            }
            const parsed = JSON.parse(cached);
            this.cache = new Map(Object.entries(parsed));

            // Try to find the best matching cache entry
            // First, try to get a quick scan of current classes
            let currentClasses = new Set();
            try {
                // Quick scan of HTML source for classes
                if (document.documentElement) {
                    const htmlSource = document.documentElement.outerHTML;
                    const classRegex = /class=["']([^"']+)["']/gi;
                    let classMatch;
                    while ((classMatch = classRegex.exec(htmlSource)) !== null) {
                        const classes = classMatch[1].split(/\s+/).filter(Boolean);
                        classes.forEach(cls => {
                            if (!cls.startsWith('x-') && !cls.startsWith('$')) {
                                currentClasses.add(cls);
                            }
                        });
                    }
                }
            } catch (e) {
                // If HTML parsing fails, just use most recent
            }

            let bestMatch = null;
            let bestScore = 0;

            // Score cache entries by how many classes they match
            if (currentClasses.size > 0) {
                for (const [key, value] of this.cache.entries()) {
                    // Extract classes from cache key (format: "class1,class2-themeHash")
                    // Find the last occurrence of '-' followed by 8 chars (theme hash length)
                    const lastDashIndex = key.lastIndexOf('-');
                    const classesPart = lastDashIndex > 0 ? key.substring(0, lastDashIndex) : key;
                    const cachedClasses = classesPart ? classesPart.split(',') : [];
                    const cachedSet = new Set(cachedClasses);
                    
                    // Count how many current classes are in cache
                    let matches = 0;
                    for (const cls of currentClasses) {
                        if (cachedSet.has(cls)) {
                            matches++;
                        }
                    }
                    
                    // Score based on match ratio and recency
                    const matchRatio = matches / currentClasses.size;
                    const recencyScore = (Date.now() - value.timestamp) / (24 * 60 * 60 * 1000); // Days since cache
                    const score = matchRatio * 0.7 + (1 - Math.min(recencyScore, 1)) * 0.3; // 70% match, 30% recency
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = value;
                    }
                }
            }

            // Use best match, or fall back to most recent
            const cacheToUse = bestMatch || Array.from(this.cache.entries())
                .sort((a, b) => b[1].timestamp - a[1].timestamp)[0]?.[1];

            if (cacheToUse && cacheToUse.css) {
                const applyCacheStart = performance.now();
                this.styleElement.textContent = cacheToUse.css;
                this.lastThemeHash = cacheToUse.themeHash;
                
                // Also apply cache to critical style element
                // Extract utilities from @layer utilities block and apply directly (no @layer)
                if (this.criticalStyleElement && !this.criticalStyleElement.textContent) {
                    let criticalCss = cacheToUse.css;
                    // Remove @layer utilities wrapper if present
                    criticalCss = criticalCss.replace(/@layer\s+utilities\s*\{/g, '').replace(/\}\s*$/, '').trim();
                    if (criticalCss) {
                        this.criticalStyleElement.textContent = criticalCss;
                        if (this.debug) {
                            console.log(`[Indux Utilities] Applied cached CSS to critical style element (${criticalCss.length} chars) to prevent flash`);
                        }
                    }
                }
                
                if (this.debug) {
                    console.log(`[Indux Utilities] Applied cached CSS at ${(applyCacheStart - this.startTime).toFixed(2)}ms`);
                    console.log(`[Indux Utilities] Cached CSS length: ${cacheToUse.css.length} chars`);
                    console.log(`[Indux Utilities] Cache age: ${((Date.now() - cacheToUse.timestamp) / 1000).toFixed(2)}s`);
                }
                
                // Don't clear critical styles yet - keep them until full compilation completes
                if (this.debug) {
                    const hasUtilities = cacheToUse.css.includes('border-') || cacheToUse.css.includes('@layer utilities');
                    console.log(`[Indux Utilities] Cache loaded - has utilities: ${hasUtilities}`);
                    console.log(`[Indux Utilities] Keeping critical styles until full compilation verifies cache`);
                }
            } else {
                if (this.debug) {
                    console.log(`[Indux Utilities] No suitable cache entry found`);
                }
            }
        } else {
            if (this.debug) {
                console.log(`[Indux Utilities] No cache in localStorage`);
            }
        }
    } catch (error) {
        console.warn('[Indux Utilities] Failed to load cached styles:', error);
    } finally {
        if (this.debug) {
            console.log(`[Indux Utilities] Cache loading completed in ${(performance.now() - cacheStart).toFixed(2)}ms`);
        }
    }
};

// Save cache to localStorage
TailwindCompiler.prototype.savePersistentCache = function() {
    try {
        const serialized = JSON.stringify(Object.fromEntries(this.cache));
        localStorage.setItem('tailwind-cache', serialized);
    } catch (error) {
        console.warn('Failed to save cached styles:', error);
    }
};

// Load cache from localStorage
TailwindCompiler.prototype.loadPersistentCache = function() {
    try {
        const cached = localStorage.getItem('tailwind-cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            this.cache = new Map(Object.entries(parsed));
        }
    } catch (error) {
        console.warn('Failed to load cached styles:', error);
    }
};

// Generate a hash of the theme variables to detect changes
TailwindCompiler.prototype.generateThemeHash = function(themeCss) {
    // Use encodeURIComponent to handle non-Latin1 characters safely
    return encodeURIComponent(themeCss).slice(0, 8); // Simple hash of theme content
};

// Clean up old cache entries
TailwindCompiler.prototype.cleanupCache = function() {
    const now = Date.now();
    const maxAge = this.options.maxCacheAge;
    const entriesToDelete = [];

    for (const [key, value] of this.cache.entries()) {
        if (value.timestamp && (now - value.timestamp > maxAge)) {
            entriesToDelete.push(key);
        }
    }

    for (const key of entriesToDelete) {
        this.cache.delete(key);
    }

    if (entriesToDelete.length > 0) {
        this.savePersistentCache();
    }
};


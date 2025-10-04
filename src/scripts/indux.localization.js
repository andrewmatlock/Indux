/* Indux Localization */

function initializeLocalizationPlugin() {
    // Environment detection for debug logging
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' || 
                         window.location.hostname.includes('dev') ||
                         window.location.search.includes('debug=true');
    
    // Debug logging helper (disabled in production)
    const debugLog = () => {};
    
    // RTL language codes - using Set for O(1) lookups
    const rtlLanguages = new Set([
        // Arabic script
        'ar',     // Arabic
        'az-Arab',// Azerbaijani (Arabic script)
        'bal',    // Balochi
        'ckb',    // Central Kurdish (Sorani)
        'fa',     // Persian (Farsi)
        'glk',    // Gilaki
        'ks',     // Kashmiri
        'ku-Arab',// Kurdish (Arabic script)
        'lrc',    // Northern Luri
        'mzn',    // Mazanderani
        'pnb',    // Western Punjabi (Shahmukhi)
        'ps',     // Pashto
        'sd',     // Sindhi
        'ur',     // Urdu
      
        // Hebrew script
        'he',     // Hebrew
        'yi',     // Yiddish
        'jrb',    // Judeo-Arabic
        'jpr',    // Judeo-Persian
        'lad-Hebr',// Ladino (Hebrew script)
      
        // Thaana script
        'dv',     // Dhivehi (Maldivian)
      
        // N’Ko script
        'nqo',    // N’Ko (West Africa)
      
        // Syriac script
        'syr',    // Syriac
        'aii',    // Assyrian Neo-Aramaic
        'arc',    // Aramaic
        'sam',    // Samaritan Aramaic
      
        // Mandaic script
        'mid',    // Mandaic
      
        // Other RTL minority/obscure scripts
        'uga',    // Ugaritic
        'phn',    // Phoenician
        'xpr',    // Parthian (ancient)
        'peo',    // Old Persian (cuneiform, but RTL)
        'pal',    // Middle Persian (Pahlavi)
        'avst',   // Avestan
        'man',    // Manding (N'Ko variants)
    ]);
    
    // Detect if a language is RTL
    function isRTL(lang) {
        return rtlLanguages.has(lang);
    }
    
    // Input validation for language codes
    function isValidLanguageCode(lang) {
        if (typeof lang !== 'string' || lang.length === 0) return false;
        // Allow alphanumeric, hyphens, and underscores
        return /^[a-zA-Z0-9_-]+$/.test(lang);
    }
    
    // Safe localStorage operations with error handling
    const safeStorage = {
        get: (key) => {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (error) {
                return false;
            }
        }
    };
    
    // Initialize empty localization store
    Alpine.store('locale', {
        current: 'en',
        available: [],
        direction: 'ltr',
        _initialized: false
    });

    // Cache for manifest data
    let manifestCache = null;
    
    // Get available locales from manifest with caching
    async function getAvailableLocales() {
        // Return cached data if available
        if (manifestCache) {
            return manifestCache;
        }
        
        try {
            const response = await fetch('/manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const manifest = await response.json();

            // Validate manifest structure
            if (!manifest || typeof manifest !== 'object') {
                throw new Error('Invalid manifest structure');
            }

            // Get unique locales from data sources
            const locales = new Set();
            if (manifest.data && typeof manifest.data === 'object') {
                Object.values(manifest.data).forEach(collection => {
                    if (collection && typeof collection === 'object') {
                        Object.keys(collection).forEach(key => {
                            // Validate and accept language codes
                            if (isValidLanguageCode(key) && 
                                key !== 'url' && 
                                key !== 'headers' && 
                                key !== 'params' && 
                                key !== 'transform' && 
                                key !== 'defaultValue') {
                                locales.add(key);
                            }
                        });
                    }
                });
            }

            // If no locales found, fallback to HTML lang or 'en'
            if (locales.size === 0) {
                const htmlLang = document.documentElement.lang;
                const fallbackLang = htmlLang && isValidLanguageCode(htmlLang) ? htmlLang : 'en';
                locales.add(fallbackLang);
            }

            const availableLocales = Array.from(locales);
            
            // Cache the result
            manifestCache = availableLocales;
            return availableLocales;
        } catch (error) {
            console.error('[Indux Localization] Error loading manifest:', error);
            // Fallback to HTML lang or 'en'
            const htmlLang = document.documentElement.lang;
            const fallbackLang = htmlLang && isValidLanguageCode(htmlLang) ? htmlLang : 'en';
            return [fallbackLang];
        }
    }

    // Detect initial locale
    function detectInitialLocale(availableLocales) {
        
        // 1. Check URL path first (highest priority for direct links)
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts[0] && isValidLanguageCode(pathParts[0]) && availableLocales.includes(pathParts[0])) {
            return pathParts[0];
        }

        // 2. Check localStorage (user preference from UI toggles)
        const storedLang = safeStorage.get('lang');
        if (storedLang && isValidLanguageCode(storedLang) && availableLocales.includes(storedLang)) {
            return storedLang;
        }

        // 3. Check HTML lang attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang && isValidLanguageCode(htmlLang) && availableLocales.includes(htmlLang)) {
            return htmlLang;
        }

        // 4. Check browser language
        if (navigator.language) {
            const browserLang = navigator.language.split('-')[0];
            if (isValidLanguageCode(browserLang) && availableLocales.includes(browserLang)) {
                return browserLang;
            }
        }

        // Default to first available locale
        const defaultLang = availableLocales[0] || 'en';
        return defaultLang;
    }

    // Update locale
    async function setLocale(newLang, updateUrl = false) {
        // Validate input
        if (!isValidLanguageCode(newLang)) {
            console.error('[Indux Localization] Invalid language code:', newLang);
            return false;
        }
        
        const store = Alpine.store('locale');
        
        // If available locales aren't loaded yet, load them first
        if (!store.available || store.available.length === 0) {
            const availableLocales = await getAvailableLocales();
            if (!availableLocales.includes(newLang)) {
                return false;
            }
        } else if (!store.available.includes(newLang)) {
            return false;
        }
        
        if (newLang === store.current) {
            return false;
        }

        try {
            // Update store
            store.current = newLang;
            store.direction = isRTL(newLang) ? 'rtl' : 'ltr';
            store._initialized = true;

            // Update HTML safely
            try {
                document.documentElement.lang = newLang;
                document.documentElement.dir = store.direction;
            } catch (domError) {
                console.error('[Indux Localization] DOM update error:', domError);
            }

            // Update localStorage safely
            safeStorage.set('lang', newLang);

            // Update URL based on current URL state and updateUrl parameter
            try {
                const currentUrl = new URL(window.location.href);
                const pathParts = currentUrl.pathname.split('/').filter(Boolean);
                const hasLanguageInUrl = pathParts[0] && store.available.includes(pathParts[0]);

                if (updateUrl || hasLanguageInUrl) {
                    // Update URL if:
                    // 1. updateUrl is explicitly true (router navigation, initialization)
                    // 2. OR there's already a language code in the URL (user expects URL to update)
                    
                    if (hasLanguageInUrl) {
                        // Replace existing language code
                        if (pathParts[0] !== newLang) {
                            pathParts[0] = newLang;
                            currentUrl.pathname = '/' + pathParts.join('/');
                            window.history.replaceState({}, '', currentUrl);
                        }
                    } else if (updateUrl && pathParts.length > 0) {
                        // Add language code only if explicitly requested (router/init)
                        pathParts.unshift(newLang);
                        currentUrl.pathname = '/' + pathParts.join('/');
                        window.history.replaceState({}, '', currentUrl);
                    }
                }
            } catch (urlError) {
                console.error('[Indux Localization] URL update error:', urlError);
            }

            // Trigger locale change event
            try {
                window.dispatchEvent(new CustomEvent('localechange', {
                    detail: { locale: newLang }
                }));
            } catch (eventError) {
                console.error('[Indux Localization] Event dispatch error:', eventError);
            }

            return true;

        } catch (error) {
            console.error('[Indux Localization] Error setting locale:', error);
            // Restore previous state safely
            const fallbackLang = safeStorage.get('lang') || store.available[0] || 'en';
            store.current = fallbackLang;
            store.direction = isRTL(fallbackLang) ? 'rtl' : 'ltr';
            try {
                document.documentElement.lang = store.current;
                document.documentElement.dir = store.direction;
            } catch (domError) {
                console.error('[Indux Localization] DOM restore error:', domError);
            }
            return false;
        }
    }

    // Add $locale magic method
    Alpine.magic('locale', () => {
        const store = Alpine.store('locale');

        return new Proxy({}, {
            get(target, prop) {
                if (prop === 'current') return store.current;
                if (prop === 'available') return store.available;
                if (prop === 'direction') return store.direction;
                if (prop === 'set') return setLocale;
                if (prop === 'toggle') {
                    return () => {
                        const currentIndex = store.available.indexOf(store.current);
                        const nextIndex = (currentIndex + 1) % store.available.length;
                        setLocale(store.available[nextIndex], false);
                    };
                }
                return undefined;
            }
        });
    });

    // Event listener cleanup tracking
    let routeChangeListener = null;
    
    // Initialize with manifest data
    (async () => {
        try {
            const availableLocales = await getAvailableLocales();
            const store = Alpine.store('locale');
            store.available = availableLocales;

            const initialLocale = detectInitialLocale(availableLocales);
            
            const success = await setLocale(initialLocale, true);
            // Locale initialization complete
        } catch (error) {
            console.error('[Indux Localization] Initialization error:', error);
        }
    })();

    // Listen for router navigation to detect locale changes
    routeChangeListener = async (event) => {
        try {
            const newPath = event.detail.to;
            
            // Extract locale from new path
            const pathParts = newPath.split('/').filter(Boolean);
            const store = Alpine.store('locale');
            
            if (pathParts[0] && isValidLanguageCode(pathParts[0]) && store.available.includes(pathParts[0])) {
                const newLocale = pathParts[0];
                
                // Only change if it's different from current locale
                if (newLocale !== store.current) {
                    await setLocale(newLocale, true);
                }
            }
        } catch (error) {
            console.error('[Indux Localization] Router navigation error:', error);
        }
    };
    
    window.addEventListener('indux:route-change', routeChangeListener);
    
    // Cleanup function for memory management
    const cleanup = () => {
        if (routeChangeListener) {
            window.removeEventListener('indux:route-change', routeChangeListener);
            routeChangeListener = null;
        }
        manifestCache = null;
    };
    
    // Expose cleanup for external use
    window.__induxLocalizationCleanup = cleanup;
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeLocalizationPlugin();
    });
}

document.addEventListener('alpine:init', initializeLocalizationPlugin); 
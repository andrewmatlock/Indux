/*! Indux Collections 1.0.0 - MIT License */

// Initialize plugin when either DOM is ready or Alpine is ready
async function initializeCollectionsPlugin() {
    // Initialize empty collections store
    const initialStore = {
        all: [], // Global content array for cross-collection access
        _initialized: false
    };
    Alpine.store('collections', initialStore);

    // Cache for loaded collections with persistence
    const collectionCache = new Map();
    const loadingPromises = new Map();
    const CACHE_PREFIX = 'indux_collection_';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Track initialization state
    let isInitializing = false;
    let initializationComplete = false;

    // Load from persistent cache
    function loadFromCache(key) {
        try {
            const cached = localStorage.getItem(CACHE_PREFIX + key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data;
                }
            }
        } catch (error) {
            console.warn('[Indux] Cache read failed:', error);
        }
        return null;
    }

    // Save to persistent cache
    function saveToCache(key, data) {
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('[Indux] Cache write failed:', error);
        }
    }

    // Parse content path with array support
    function parseContentPath(path) {
        const parts = [];
        let currentPart = '';
        let inBrackets = false;

        for (let i = 0; i < path.length; i++) {
            const char = path[i];
            if (char === '[') {
                if (currentPart) {
                    parts.push(currentPart);
                    currentPart = '';
                }
                inBrackets = true;
            } else if (char === ']') {
                if (currentPart) {
                    parts.push(parseInt(currentPart));
                    currentPart = '';
                }
                inBrackets = false;
            } else if (char === '.' && !inBrackets) {
                if (currentPart) {
                    parts.push(currentPart);
                    currentPart = '';
                }
            } else {
                currentPart += char;
            }
        }

        if (currentPart) {
            parts.push(currentPart);
        }

        return parts;
    }

    // Load manifest if not already loaded
    async function ensureManifest() {
        if (window.manifest) return window.manifest;

        try {
            const response = await fetch('/manifest.json');
            window.manifest = await response.json();
            return window.manifest;
        } catch (error) {
            console.error('[Indux] Failed to load manifest:', error);
            return null;
        }
    }

    // Load collection data
    async function loadCollection(collectionName, locale = 'en') {
        const cacheKey = `${collectionName}:${locale}`;

        // Check memory cache first
        if (collectionCache.has(cacheKey)) {
            const cachedData = collectionCache.get(cacheKey);
            if (!isInitializing) {
                updateStore(collectionName, cachedData);
            }
            return cachedData;
        }

        // Check persistent cache
        const cachedData = loadFromCache(cacheKey);
        if (cachedData) {
            collectionCache.set(cacheKey, cachedData);
            if (!isInitializing) {
                updateStore(collectionName, cachedData);
            }
            return cachedData;
        }

        // If already loading, return existing promise
        if (loadingPromises.has(cacheKey)) {
            return loadingPromises.get(cacheKey);
        }

        const loadPromise = (async () => {
            try {
                const manifest = await ensureManifest();
                if (!manifest?.collections) {
                    return null;
                }

                const collection = manifest.collections[collectionName];
                if (!collection) {
                    console.warn(`[Indux] Collection "${collectionName}" not found in manifest`);
                    return null;
                }

                // Handle both string paths and localized objects
                let source;
                if (typeof collection === 'string') {
                    // Direct string path for non-localized collections
                    source = collection;
                } else if (collection[locale]) {
                    // Localized collection with locale-specific path
                    source = collection[locale];
                } else {
                    console.warn(`[Indux] No source found for collection "${collectionName}" in locale "${locale}"`);
                    return null;
                }

                const response = await fetch(source);
                const contentType = response.headers.get('content-type');
                let data;

                // Handle different content types
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                } else if (contentType?.includes('text/yaml') || source.endsWith('.yaml') || source.endsWith('.yml')) {
                    const text = await response.text();
                    data = jsyaml.load(text);
                } else {
                    console.warn(`[Indux] Unsupported content type for "${source}": ${contentType}`);
                    return null;
                }

                // Enhance data with metadata
                let enhancedData;
                if (Array.isArray(data)) {
                    enhancedData = data.map(item => ({
                        ...item,
                        contentType: collectionName,
                        _loadedFrom: source,
                        _locale: locale
                    }));
                } else if (typeof data === 'object') {
                    enhancedData = {
                        ...data,
                        contentType: collectionName,
                        _loadedFrom: source,
                        _locale: locale
                    };
                }

                // Update caches
                collectionCache.set(cacheKey, enhancedData);
                saveToCache(cacheKey, enhancedData);

                // Update store only if not initializing
                if (!isInitializing) {
                    updateStore(collectionName, enhancedData);
                }

                return enhancedData;
            } catch (error) {
                console.error(`[Indux] Failed to load collection "${collectionName}":`, error);
                return null;
            } finally {
                loadingPromises.delete(cacheKey);
            }
        })();

        loadingPromises.set(cacheKey, loadPromise);
        return loadPromise;
    }

    // Update store with new data
    function updateStore(collectionName, data) {
        if (isInitializing) return;

        const store = Alpine.store('collections');
        const all = store.all.filter(item => item.contentType !== collectionName);

        if (Array.isArray(data)) {
            all.push(...data);
        } else {
            all.push(data);
        }

        Alpine.store('collections', {
            ...store,
            [collectionName]: data,
            all,
            _initialized: true
        });
    }

    // Create a safe proxy for loading state
    function createLoadingProxy() {
        return new Proxy({}, {
            get(target, key) {
                // Handle special keys
                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                    return undefined;
                }

                // Handle toPrimitive for text content
                if (key === Symbol.toPrimitive) {
                    return function () { return ''; };
                }

                // Handle numeric keys for array access
                if (typeof key === 'string' && !isNaN(Number(key))) {
                    return createLoadingProxy();
                }

                // Return empty object for nested properties
                return createLoadingProxy();
            }
        });
    }

    // Create a proxy for array items
    function createArrayItemProxy(item) {
        return new Proxy(item, {
            get(target, key) {
                // Handle special keys
                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                    return undefined;
                }

                // Handle toPrimitive for text content
                if (key === Symbol.toPrimitive) {
                    return function () {
                        return target[key] || '';
                    };
                }

                return target[key];
            }
        });
    }

    // Add $x magic method first
    Alpine.magic('x', () => {
        const pendingLoads = new Map();
        const store = Alpine.store('collections');

        // Listen for locale changes
        window.addEventListener('localechange', async (event) => {
            const newLocale = event.detail.locale;

            // Clear existing collections and cache
            const currentStore = Alpine.store('collections');
            collectionCache.clear();
            Alpine.store('collections', {
                all: [],
                _initialized: true
            });

            // Collections will be reloaded on-demand when accessed
        });

        return new Proxy({}, {
            get(target, prop) {
                // Handle special keys
                if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
                    return undefined;
                }

                // Get current value from store
                const value = store[prop];
                const currentLocale = Alpine.store('locale').current;

                // If not in store, try to load it
                if (!value && !pendingLoads.has(prop)) {
                    // Start loading
                    const loadPromise = loadCollection(prop, currentLocale);
                    pendingLoads.set(prop, loadPromise);
                    return createLoadingProxy();
                }

                // If we have a value, return a reactive proxy
                if (value) {
                    return new Proxy(value, {
                        get(target, key) {
                            // Handle special keys
                            if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                                return undefined;
                            }

                            // Handle toPrimitive for text content
                            if (key === Symbol.toPrimitive) {
                                return function () { return ''; };
                            }

                            // Handle array-like behavior
                            if (Array.isArray(target)) {
                                if (key === 'length') {
                                    return target.length;
                                }
                                // Handle numeric keys for array access
                                if (typeof key === 'string' && !isNaN(Number(key))) {
                                    const index = Number(key);
                                    if (index >= 0 && index < target.length) {
                                        return createArrayItemProxy(target[index]);
                                    }
                                    return createLoadingProxy();
                                }
                            }

                            // Handle nested objects
                            const nestedValue = target[key];
                            if (nestedValue) {
                                if (Array.isArray(nestedValue)) {
                                    return new Proxy(nestedValue, {
                                        get(target, nestedKey) {
                                            if (nestedKey === 'length') {
                                                return target.length;
                                            }
                                            if (typeof nestedKey === 'string' && !isNaN(Number(nestedKey))) {
                                                const index = Number(nestedKey);
                                                if (index >= 0 && index < target.length) {
                                                    return createArrayItemProxy(target[index]);
                                                }
                                                return createLoadingProxy();
                                            }
                                            return createLoadingProxy();
                                        }
                                    });
                                }
                                return new Proxy(nestedValue, {
                                    get(target, nestedKey) {
                                        // Handle toPrimitive for text content
                                        if (nestedKey === Symbol.toPrimitive) {
                                            return function () {
                                                return target[nestedKey] || '';
                                            };
                                        }
                                        return target[nestedKey];
                                    }
                                });
                            }
                            return createLoadingProxy();
                        }
                    });
                }

                return createLoadingProxy();
            }
        });
    });

    // Initialize collections after magic method is registered
    if (isInitializing || initializationComplete) return;
    isInitializing = true;

    try {
        // Initialize store without loading all collections
        Alpine.store('collections', {
            all: [],
            _initialized: true
        });

        // Collections will be loaded on-demand when accessed via $x
    } finally {
        isInitializing = false;
        initializationComplete = true;
    }
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeCollectionsPlugin();
    });
}

document.addEventListener('alpine:init', initializeCollectionsPlugin);
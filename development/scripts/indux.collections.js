/*! Indux Collections 1.0.0 - MIT License */

// Dynamic js-yaml loader
let jsyaml = null;
let yamlLoadingPromise = null;

async function loadYamlLibrary() {
    if (jsyaml) return jsyaml;
    if (yamlLoadingPromise) return yamlLoadingPromise;
    
    yamlLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/js-yaml/dist/js-yaml.min.js';
        script.onload = () => {
            if (typeof window.jsyaml !== 'undefined') {
                jsyaml = window.jsyaml;
                resolve(jsyaml);
            } else {
                console.error('[Indux Collections] js-yaml failed to load - jsyaml is undefined');
                yamlLoadingPromise = null; // Reset so we can try again
                reject(new Error('js-yaml failed to load'));
            }
        };
        script.onerror = (error) => {
            console.error('[Indux Collections] Script failed to load:', error);
            yamlLoadingPromise = null; // Reset so we can try again
            reject(error);
        };
        document.head.appendChild(script);
    });
    
    return yamlLoadingPromise;
}

// Initialize plugin when either DOM is ready or Alpine is ready
async function initializeCollectionsPlugin() {
    // Initialize empty collections store
    const initialStore = {
        all: [], // Global content array for cross-collection access
        _initialized: false,
        _currentUrl: window.location.pathname
    };
    Alpine.store('collections', initialStore);

    // Cache for loaded collections
    const collectionCache = new Map();
    const loadingPromises = new Map();

    // Track initialization state
    let isInitializing = false;
    let initializationComplete = false;

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
        if (window.InduxComponentsRegistry?.manifest) {
            return window.InduxComponentsRegistry.manifest;
        }

        try {
            const response = await fetch('/manifest.json');
            return await response.json();
        } catch (error) {
            console.error('[Indux Collections] Failed to load manifest:', error);
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

        // If already loading, return existing promise
        if (loadingPromises.has(cacheKey)) {
            return loadingPromises.get(cacheKey);
        }

        const loadPromise = (async () => {
            try {
                const manifest = await ensureManifest();
                if (!manifest?.collections) {
                    console.warn('[Indux Collections] No collections defined in manifest.json');
                    return null;
                }

                const collection = manifest.collections[collectionName];
                if (!collection) {
                    // Only warn for collections that are actually being accessed
                    // This prevents warnings for test references that might exist in HTML
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
                    console.warn(`[Indux Collections] No source found for collection "${collectionName}" in locale "${locale}"`);
                    return null;
                }

                const response = await fetch(source);
                const contentType = response.headers.get('content-type');
                let data;

                // Handle different content types
                if (contentType?.includes('application/json') || source.endsWith('.json')) {
                    data = await response.json();
                                } else if (contentType?.includes('text/yaml') || source.endsWith('.yaml') || source.endsWith('.yml')) {
                    const text = await response.text();
                    
                    // Load js-yaml library dynamically
                    const yamlLib = await loadYamlLibrary();
                    data = yamlLib.load(text);
                } else {
                    // Try JSON first, then YAML
                    try {
                        const text = await response.text();
                        data = JSON.parse(text);
                    } catch (e) {
                        const yamlLib = await loadYamlLibrary();
                        data = yamlLib.load(text);
                    }
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

                // Update cache
                collectionCache.set(cacheKey, enhancedData);

                // Update store only if not initializing
                if (!isInitializing) {
                    updateStore(collectionName, enhancedData);
                }

                return enhancedData;
            } catch (error) {
                console.error(`[Indux Collections] Failed to load collection "${collectionName}":`, error);
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

                // Handle route() function - always available
                if (key === 'route') {
                    return function(pathKey) {
                        // Return a safe fallback proxy that returns empty strings for all properties
                        return new Proxy({}, {
                            get(target, prop) {
                                // Return empty string for any property to prevent expression display
                                if (typeof prop === 'string') {
                                    return '';
                                }
                                return undefined;
                            }
                        });
                    };
                }

                // Handle toPrimitive for text content
                if (key === Symbol.toPrimitive) {
                    return function () { return ''; };
                }

                // Handle valueOf for text content
                if (key === 'valueOf') {
                    return function () { return ''; };
                }

                // Handle toString for text content
                if (key === 'toString') {
                    return function () { return ''; };
                }

                // Handle numeric keys for array access
                if (typeof key === 'string' && !isNaN(Number(key))) {
                    return createLoadingProxy();
                }

                // Return empty string for most properties to prevent expression display
                if (typeof key === 'string') {
                    return '';
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

    // Create proxy for route-specific lookups
    function createRouteProxy(collectionData, pathKey, collectionName) {
        return new Proxy({}, {
            get(target, prop) {
                try {
                    // Get current URL from store (reactive)
                    const store = Alpine.store('collections');
                    const currentPath = store?._currentUrl || window.location.pathname;
                    const pathSegments = currentPath.split('/').filter(segment => segment);
                    
                    // If collection data is not loaded yet, return empty string for string properties
                    if (!collectionData || typeof collectionData !== 'object') {
                        return typeof prop === 'string' ? '' : undefined;
                    }
                    
                    // Search through collection data recursively
                    const foundItem = findItemByPath(collectionData, pathKey, pathSegments);
                    
                    if (foundItem && prop in foundItem) {
                        return foundItem[prop];
                    }
                    
                    // Return empty string for string properties to prevent expression display
                    return typeof prop === 'string' ? '' : undefined;
                } catch (error) {
                    // Return empty string for string properties, undefined otherwise
                    return typeof prop === 'string' ? '' : undefined;
                }
            }
        });
    }

    // Listen for URL changes to trigger reactivity
    let currentUrl = window.location.pathname;
    window.addEventListener('popstate', () => {
        if (window.location.pathname !== currentUrl) {
            currentUrl = window.location.pathname;
            // Update store to trigger Alpine reactivity
            const store = Alpine.store('collections');
            if (store && store._initialized) {
                store._currentUrl = window.location.pathname;
            }
        }
    });

    // Also listen for pushstate/replacestate (for SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
        originalPushState.apply(history, args);
        if (window.location.pathname !== currentUrl) {
            currentUrl = window.location.pathname;
            const store = Alpine.store('collections');
            if (store && store._initialized) {
                store._currentUrl = window.location.pathname;
            }
        }
    };
    
    history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        if (window.location.pathname !== currentUrl) {
            currentUrl = window.location.pathname;
            const store = Alpine.store('collections');
            if (store && store._initialized) {
                store._currentUrl = window.location.pathname;
            }
        }
    };

    // Recursively search for items with matching path
    function findItemByPath(data, pathKey, pathSegments) {
        if (Array.isArray(data)) {
            for (const item of data) {
                if (typeof item === 'object' && item !== null) {
                    // Check if this item has the path key
                    if (pathKey in item) {
                        const itemPath = item[pathKey];
                        // Check if any path segment matches this item's path
                        if (pathSegments.some(segment => segment === itemPath)) {
                            return item;
                        }
                    }
                    
                    // Recursively search nested objects
                    const found = findItemByPath(item, pathKey, pathSegments);
                    if (found) return found;
                }
            }
        } else if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                const found = findItemByPath(data[key], pathKey, pathSegments);
                if (found) return found;
            }
        }
        
        return null;
    }

    // Add $x magic method
    Alpine.magic('x', () => {
        const pendingLoads = new Map();
        const store = Alpine.store('collections');
        const accessCache = new Map(); // Cache for frequently accessed collections

        return new Proxy({}, {
            get(target, prop) {
                // Handle special keys
                if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
                    return undefined;
                }

                // Check access cache first for better performance
                if (accessCache.has(prop)) {
                    return accessCache.get(prop);
                }

                // Get current value from store
                const value = store[prop];
                const currentLocale = 'en'; // Default locale

                // If not in store, try to load it
                if (!value && !pendingLoads.has(prop)) {
                    // Batch collection loading to reduce simultaneous requests
                    const loadPromise = loadCollection(prop, currentLocale);
                    pendingLoads.set(prop, loadPromise);
                    
                    // Cache the loading proxy
                    const proxy = createLoadingProxy();
                    accessCache.set(prop, proxy);
                    
                    // Clear cache when loaded
                    loadPromise.finally(() => {
                        accessCache.delete(prop);
                        pendingLoads.delete(prop);
                    });
                    
                    return proxy;
                }

                // If we have a value, return a reactive proxy
                if (value) {
                    return new Proxy(value, {
                        get(target, key) {
                            // Handle special keys
                            if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                                return undefined;
                            }

                            // Handle route() function for route-specific lookups
                            if (key === 'route') {
                                return function(pathKey) {
                                    // Only create route proxy if we have valid data
                                    if (target && typeof target === 'object') {
                                        return createRouteProxy(target, pathKey, prop);
                                    }
                                    // Return a safe fallback proxy
                                    return new Proxy({}, {
                                        get() { return undefined; }
                                    });
                                };
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
                                // Add essential array methods
                                if (key === 'filter' || key === 'map' || key === 'find' || 
                                    key === 'findIndex' || key === 'some' || key === 'every' ||
                                    key === 'reduce' || key === 'forEach' || key === 'slice') {
                                    return target[key].bind(target);
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
                                            // Add essential array methods
                                            if (nestedKey === 'filter' || nestedKey === 'map' || nestedKey === 'find' || 
                                                nestedKey === 'findIndex' || nestedKey === 'some' || nestedKey === 'every' ||
                                                nestedKey === 'reduce' || nestedKey === 'forEach' || nestedKey === 'slice') {
                                                return target[nestedKey].bind(target);
                                            }
                                            return createLoadingProxy();
                                        }
                                    });
                                }
                                // Only create proxy for objects, return primitives directly
                                if (typeof nestedValue === 'object' && nestedValue !== null) {
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
                                // Return primitive values directly (strings, numbers, booleans)
                                return nestedValue;
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

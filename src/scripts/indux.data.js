/* Indux Data Sources */

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
                console.error('[Indux Data] js-yaml failed to load - jsyaml is undefined');
                yamlLoadingPromise = null; // Reset so we can try again
                reject(new Error('js-yaml failed to load'));
            }
        };
        script.onerror = (error) => {
            console.error('[Indux Data] Script failed to load:', error);
            yamlLoadingPromise = null; // Reset so we can try again
            reject(error);
        };
        document.head.appendChild(script);
    });
    
    return yamlLoadingPromise;
}

// Initialize plugin when either DOM is ready or Alpine is ready
async function initializeDataSourcesPlugin() {
    // Initialize empty data sources store
    const initialStore = {
        all: [], // Global content array for cross-dataSource access
        _initialized: false,
        _currentUrl: window.location.pathname
    };
    Alpine.store('data', initialStore);

    // Cache for loaded data sources
    const dataSourceCache = new Map();
    const loadingPromises = new Map();

    // Listen for locale changes to reload data
    window.addEventListener('localechange', async (event) => {
        const newLocale = event.detail.locale;
        
        // Set loading state to prevent flicker
        const store = Alpine.store('data');
        if (store) {
            Alpine.store('data', {
                ...store,
                _localeChanging: true
            });
        }
        
        try {
            // Get manifest to identify localized data sources
            const manifest = await ensureManifest();
            if (!manifest?.data) return;
            
            // Find localized data sources (those with locale keys)
            const localizedDataSources = [];
            Object.entries(manifest.data).forEach(([name, config]) => {
                if (typeof config === 'object' && !config.url) {
                    // Check if it has locale keys (2-letter codes)
                    const hasLocaleKeys = Object.keys(config).some(key => 
                        key.length === 2 && typeof config[key] === 'string'
                    );
                    if (hasLocaleKeys) {
                        localizedDataSources.push(name);
                    }
                }
            });
            
            // Only clear cache for localized data sources
            localizedDataSources.forEach(dataSourceName => {
                // Clear all locale variants of this data source
                const keysToDelete = [];
                for (const key of dataSourceCache.keys()) {
                    if (key.startsWith(`${dataSourceName}:`)) {
                        keysToDelete.push(key);
                    }
                }
                keysToDelete.forEach(key => dataSourceCache.delete(key));
                
                // Clear loading promises for this data source
                const promisesToDelete = [];
                for (const key of loadingPromises.keys()) {
                    if (key.startsWith(`${dataSourceName}:`)) {
                        promisesToDelete.push(key);
                    }
                }
                promisesToDelete.forEach(key => loadingPromises.delete(key));
            });
            
            // Only remove localized data from store, keep non-localized data
            const store = Alpine.store('data');
            if (store && store.all) {
                const filteredAll = store.all.filter(item => 
                    !localizedDataSources.includes(item.contentType)
                );
                
                // Remove localized data sources from store
                const newStore = { ...store, all: filteredAll };
                localizedDataSources.forEach(dataSourceName => {
                    delete newStore[dataSourceName];
                });
                
                Alpine.store('data', {
                    ...newStore,
                    _localeChanging: false
                });
            }
            
        } catch (error) {
            console.error('[Indux Data] Error handling locale change:', error);
            // Fallback to full reload if something goes wrong
            dataSourceCache.clear();
            loadingPromises.clear();
            Alpine.store('data', {
                all: [],
                _initialized: true,
                _localeChanging: false
            });
        }
    });

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
            console.error('[Indux Data] Failed to load manifest:', error);
            return null;
        }
    }

    // Helper to interpolate environment variables
    function interpolateEnvVars(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            // Check for environment variables (in browser, these would be set by build process)
            if (typeof process !== 'undefined' && process.env && process.env[varName]) {
                return process.env[varName];
            }
            // Check for window.env (common pattern for client-side env vars)
            if (typeof window !== 'undefined' && window.env && window.env[varName]) {
                return window.env[varName];
            }
            // Return original if not found
            return match;
        });
    }

    // Helper to get nested value from object
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    // Load from API endpoint
    async function loadFromAPI(dataSource) {
        try {
            const url = new URL(interpolateEnvVars(dataSource.url));
            
            // Add query parameters
            if (dataSource.params) {
                Object.entries(dataSource.params).forEach(([key, value]) => {
                    url.searchParams.set(key, interpolateEnvVars(value));
                });
            }
            
            // Prepare headers
            const headers = {};
            if (dataSource.headers) {
                Object.entries(dataSource.headers).forEach(([key, value]) => {
                    headers[key] = interpolateEnvVars(value);
                });
            }
            
            const response = await fetch(url, {
                method: dataSource.method || 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            let data = await response.json();
            
            // Transform data if needed
            if (dataSource.transform) {
                data = getNestedValue(data, dataSource.transform);
            }
            
            return data;
        } catch (error) {
            console.error(`[Indux Data] Failed to load API dataSource:`, error);
            // Return empty array/object to prevent breaking the UI
            return Array.isArray(dataSource.defaultValue) ? dataSource.defaultValue : (dataSource.defaultValue || []);
        }
    }

    // Load dataSource data
    async function loadDataSource(dataSourceName, locale = 'en') {
        const cacheKey = `${dataSourceName}:${locale}`;

        // Check memory cache first
        if (dataSourceCache.has(cacheKey)) {
            const cachedData = dataSourceCache.get(cacheKey);
            if (!isInitializing) {
                updateStore(dataSourceName, cachedData);
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
                if (!manifest?.data) {
                    console.warn('[Indux Data] No data sources defined in manifest.json');
                    return null;
                }

                const dataSource = manifest.data[dataSourceName];
                if (!dataSource) {
                    // Only warn for dataSources that are actually being accessed
                    // This prevents warnings for test references that might exist in HTML
                    return null;
                }

                let data;
                
                // Auto-detect dataSource type based on structure
                if (typeof dataSource === 'string') {
                    // Local file - load from filesystem
                    const response = await fetch(dataSource);
                    const contentType = response.headers.get('content-type');

                    // Handle different content types
                    if (contentType?.includes('application/json') || dataSource.endsWith('.json')) {
                        data = await response.json();
                    } else if (contentType?.includes('text/yaml') || dataSource.endsWith('.yaml') || dataSource.endsWith('.yml')) {
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
                } else if (dataSource.url) {
                    // Cloud API - load from HTTP endpoint
                    data = await loadFromAPI(dataSource);
                } else if (dataSource[locale]) {
                    // Localized dataSource
                    const localizedDataSource = dataSource[locale];
                    if (typeof localizedDataSource === 'string') {
                        // Localized local file
                        const response = await fetch(localizedDataSource);
                        const contentType = response.headers.get('content-type');

                        if (contentType?.includes('application/json') || localizedDataSource.endsWith('.json')) {
                            data = await response.json();
                        } else if (contentType?.includes('text/yaml') || localizedDataSource.endsWith('.yaml') || localizedDataSource.endsWith('.yml')) {
                            const text = await response.text();
                            const yamlLib = await loadYamlLibrary();
                            data = yamlLib.load(text);
                        } else {
                            try {
                                const text = await response.text();
                                data = JSON.parse(text);
                            } catch (e) {
                                const yamlLib = await loadYamlLibrary();
                                data = yamlLib.load(text);
                            }
                        }
                    } else if (localizedDataSource.url) {
                        // Localized cloud API
                        data = await loadFromAPI(localizedDataSource);
                    } else {
                        console.warn(`[Indux Data] No valid source found for dataSource "${dataSourceName}" in locale "${locale}"`);
                        return null;
                    }
                } else {
                    console.warn(`[Indux Data] No valid source found for dataSource "${dataSourceName}"`);
                    return null;
                }

                // Enhance data with metadata
                let enhancedData;
                const sourceType = typeof dataSource === 'string' ? 'local' : 'api';
                const sourcePath = typeof dataSource === 'string' ? dataSource : dataSource.url;
                
                if (Array.isArray(data)) {
                    enhancedData = data.map(item => ({
                        ...item,
                        contentType: dataSourceName,
                        _loadedFrom: sourcePath,
                        _sourceType: sourceType,
                        _locale: locale
                    }));
                } else if (typeof data === 'object') {
                    enhancedData = {
                        ...data,
                        contentType: dataSourceName,
                        _loadedFrom: sourcePath,
                        _sourceType: sourceType,
                        _locale: locale
                    };
                }

                // Update cache
                dataSourceCache.set(cacheKey, enhancedData);

                // Update store only if not initializing
                if (!isInitializing) {
                    updateStore(dataSourceName, enhancedData);
                }

                return enhancedData;
            } catch (error) {
                console.error(`[Indux Data] Failed to load dataSource "${dataSourceName}":`, error);
                return null;
            } finally {
                loadingPromises.delete(cacheKey);
            }
        })();

        loadingPromises.set(cacheKey, loadPromise);
        return loadPromise;
    }

    // Update store with new data
    function updateStore(dataSourceName, data) {
        if (isInitializing) return;

        const store = Alpine.store('data');
        const all = store.all.filter(item => item.contentType !== dataSourceName);

        if (Array.isArray(data)) {
            all.push(...data);
        } else {
            all.push(data);
        }

        Alpine.store('data', {
            ...store,
            [dataSourceName]: data,
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
                    // For known array properties, return a special proxy with route() function
                    // This prevents infinite recursion while providing route() functionality
                    if (key === 'legal' || key === 'docs' || key === 'features' || key === 'items') {
                        return new Proxy({}, {
                            get(target, prop) {
                                if (prop === 'route') {
                                    return function(pathKey) {
                                        // Return a safe fallback proxy that returns empty strings
                                        return new Proxy({}, {
                                            get() { return ''; }
                                        });
                                    };
                                }
                                if (prop === 'length') return 0;
                                if (typeof prop === 'string' && !isNaN(Number(prop))) {
                                    return createLoadingProxy();
                                }
                                return '';
                            }
                        });
                    }
                    // For other string properties that might be nested objects/arrays, return loading proxy
                    // This allows chaining like $x.nested.stuff.people.route('path')
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

    // Create a proxy for arrays with route() support
    function createArrayProxyWithRoute(arrayTarget) {
        return new Proxy(arrayTarget, {
            get(target, key) {
                // Handle special keys
                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
                    return undefined;
                }

                // Handle route() function for route-specific lookups on arrays
                if (key === 'route') {
                    return function(pathKey) {
                        // Only create route proxy if we have valid data
                        if (target && typeof target === 'object') {
                            // Get data source name from the first item's contentType metadata
                            return createRouteProxy(
                                target, 
                                pathKey, 
                                (Array.isArray(target) && target.length > 0 && target[0] && target[0].contentType) 
                                    ? target[0].contentType 
                                    : undefined
                            );
                        }
                        // Return a safe fallback proxy
                        return new Proxy({}, {
                            get() { return undefined; }
                        });
                    };
                }

                if (key === 'length') {
                    return target.length;
                }
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
                return createLoadingProxy();
            }
        });
    }

    // Create a proxy for nested objects that properly handles arrays and further nesting
    function createNestedObjectProxy(objTarget) {
        return new Proxy(objTarget, {
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

                const value = target[key];
                
                // If the property is an array, wrap it in the array proxy with route() support
                if (Array.isArray(value)) {
                    return createArrayProxyWithRoute(value);
                }
                
                // If the property is an object, wrap it recursively for further nesting
                if (typeof value === 'object' && value !== null) {
                    return createNestedObjectProxy(value);
                }
                
                // If value is undefined, return a loading proxy to maintain chain and prevent errors
                if (value === undefined) {
                    return createLoadingProxy();
                }
                
                // Return primitive values directly
                return value;
            }
        });
    }

    // Create proxy for route-specific lookups
    function createRouteProxy(dataSourceData, pathKey, dataSourceName) {
        // First check if we have a valid route
        let foundItem = null;
        try {
            const store = Alpine.store('data');
            const currentPath = store?._currentUrl || window.location.pathname;
            let pathSegments = currentPath.split('/').filter(segment => segment);
            
            // Filter out language codes from path segments for route matching
            const localeStore = Alpine.store('locale');
            if (localeStore && localeStore.available && pathSegments.length > 0) {
                const firstSegment = pathSegments[0];
                if (localeStore.available.includes(firstSegment)) {
                    pathSegments = pathSegments.slice(1);
                }
            }
            
            if (dataSourceData && typeof dataSourceData === 'object') {
                foundItem = findItemByPath(dataSourceData, pathKey, pathSegments);
            }
        } catch (error) {
            // Error finding route
        }
        
        // Return a proxy for the found item (or safe proxy if no route found)
        return new Proxy({}, {
            get(target, prop) {
                try {
                    // If no route found, return safe values
                    if (!foundItem) {
                        // Return empty string for text properties to prevent errors
                        if (typeof prop === 'string') {
                            return '';
                        }
                        return undefined;
                    }
                    
                    if (prop in foundItem) {
                        return foundItem[prop];
                    }
                    
                    // Special handling for 'group' property - find the group containing the matched item
                    if (prop === 'group') {
                        const groupItem = findGroupContainingItem(dataSourceData, foundItem);
                        return groupItem?.group || '';
                    }
                    
                    return undefined;
                } catch (error) {
                    return undefined;
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
            const store = Alpine.store('data');
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
            const store = Alpine.store('data');
            if (store && store._initialized) {
                store._currentUrl = window.location.pathname;
            }
        }
    };
    
    history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        if (window.location.pathname !== currentUrl) {
            currentUrl = window.location.pathname;
            const store = Alpine.store('data');
            if (store && store._initialized) {
                store._currentUrl = window.location.pathname;
            }
        }
    };

    // Recursively search for items with matching path
    function findItemByPath(data, pathKey, pathSegments) {
        if (!pathSegments || pathSegments.length === 0) {
            return null;
        }
        
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

    // Find the group that contains a specific item
    function findGroupContainingItem(data, targetItem) {
        if (Array.isArray(data)) {
            for (const item of data) {
                if (typeof item === 'object' && item !== null) {
                    // Check if this is a group with items
                    if (item.group && Array.isArray(item.items)) {
                        // Check if the target item is in this group's items
                        if (item.items.includes(targetItem)) {
                            return item;
                        }
                    }
                    
                    // Recursively search in nested objects
                    const found = findGroupContainingItem(item, targetItem);
                    if (found) return found;
                }
            }
        } else if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                const found = findGroupContainingItem(data[key], targetItem);
                if (found) return found;
            }
        }
        
        return null;
    }

    // Add $x magic method
    Alpine.magic('x', () => {
        const pendingLoads = new Map();
        const store = Alpine.store('data');
        const accessCache = new Map(); // Cache for frequently accessed dataSources

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
                // Use HTML lang as source of truth, fallback to Alpine store, then 'en'
                const currentLocale = document.documentElement.lang || Alpine.store('locale')?.current || 'en';

                // If not in store, try to load it
                if (!value && !pendingLoads.has(prop)) {
                    // Wait a tick to ensure localization plugin has initialized
                    const loadPromise = new Promise(resolve => {
                        setTimeout(() => {
                            // Re-check locale after delay
                            const finalLocale = document.documentElement.lang || Alpine.store('locale')?.current || 'en';
                            resolve(loadDataSource(prop, finalLocale));
                        }, 0);
                    });
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
                                    // Use helper function for arrays with route() support
                                    return createArrayProxyWithRoute(nestedValue);
                                }
                                // Only create proxy for objects, return primitives directly
                                if (typeof nestedValue === 'object' && nestedValue !== null) {
                                    // Handle nested objects - use helper function for proper array/object handling
                                    return createNestedObjectProxy(nestedValue);
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

    // Initialize dataSources after magic method is registered
    if (isInitializing || initializationComplete) return;
    isInitializing = true;

    try {
        // Initialize store without loading all dataSources
        Alpine.store('data', {
            all: [],
            _initialized: true
        });

        // Data sources will be loaded on-demand when accessed via $x
    } finally {
        isInitializing = false;
        initializationComplete = true;
    }
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeDataSourcesPlugin();
    });
}

document.addEventListener('alpine:init', initializeDataSourcesPlugin);

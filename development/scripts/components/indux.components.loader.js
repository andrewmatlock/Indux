/*! Indux Components Loader 1.0.0 - MIT License */
window.InduxComponentsLoader = {
    cache: {},
    initialize() {
        this.cache = {};
        // Preload components listed in registry.preloaded
        const registry = window.InduxComponentsRegistry;
        if (registry && Array.isArray(registry.preloaded)) {
            registry.preloaded.forEach(name => {
                this.loadComponent(name).then(() => {
                    // Preloaded component
                });
            });
        }
    },
    async loadComponent(name) {
        if (this.cache[name]) {
            return this.cache[name];
        }
        const registry = window.InduxComponentsRegistry;
        if (!registry || !registry.manifest) {
            console.warn('[Indux] Manifest not loaded, cannot load component:', name);
            return null;
        }
        const path = (registry.manifest.preloadedComponents || []).concat(registry.manifest.components || [])
            .find(p => p.split('/').pop().replace('.html', '') === name);
        if (!path) {
            console.warn('[Indux] Component', name, 'not found in manifest.');
            return null;
        }
        try {
            const response = await fetch('/' + path);
            if (!response.ok) {
                console.warn('[Indux] HTML file not found for component', name, 'at path:', path, '(HTTP', response.status + ')');
                return null;
            }
            const content = await response.text();
            this.cache[name] = content;
            return content;
        } catch (error) {
            console.warn('[Indux] Failed to load component', name, 'from', path + ':', error.message);
            return null;
        }
    }
}; 
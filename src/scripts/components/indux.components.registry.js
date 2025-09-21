/*! Indux Components Registry 1.0.0 - MIT License */
window.InduxComponentsRegistry = {
    manifest: null,
    registered: new Set(),
    preloaded: [],
    initialize() {
        // Load manifest.json synchronously
        try {
            const req = new XMLHttpRequest();
            req.open('GET', '/manifest.json?t=' + Date.now(), false);
            req.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            req.setRequestHeader('Pragma', 'no-cache');
            req.setRequestHeader('Expires', '0');
            req.send(null);
            if (req.status === 200) {
                this.manifest = JSON.parse(req.responseText);
                // Register all components from manifest
                const allComponents = [
                    ...(this.manifest?.preloadedComponents || []),
                    ...(this.manifest?.components || [])
                ];
                allComponents.forEach(path => {
                    const name = path.split('/').pop().replace('.html', '');
                    this.registered.add(name);
                });
                this.preloaded = (this.manifest?.preloadedComponents || []).map(path => path.split('/').pop().replace('.html', ''));
            } else {
                console.warn('[Indux] Failed to load manifest.json (HTTP', req.status + ')');
            }
        } catch (e) {
            console.warn('[Indux] Failed to load manifest.json:', e.message);
        }
    }
}; 
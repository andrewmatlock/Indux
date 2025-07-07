/*! Indux Components 1.0.0 - MIT License */



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

window.InduxComponentsProcessor = {
    async processComponent(element, instanceId) {
        const name = element.tagName.toLowerCase().replace('x-', '');
        const registry = window.InduxComponentsRegistry;
        const loader = window.InduxComponentsLoader;
        if (!registry || !loader) {
            return;
        }
        if (!registry.registered.has(name)) {
            return;
        }
        if (element.hasAttribute('data-pre-rendered') || element.hasAttribute('data-processed')) {
            return;
        }
        const content = await loader.loadComponent(name);
        if (!content) {
            element.replaceWith(document.createComment(` Failed to load component: ${name} `));
            return;
        }
        const container = document.createElement('div');
        container.innerHTML = content.trim();
        const topLevelElements = Array.from(container.children);
        if (topLevelElements.length === 0) {
            element.replaceWith(document.createComment(` Empty component: ${name} `));
            return;
        }
        // Collect properties from placeholder attributes
        const props = {};
        Array.from(element.attributes).forEach(attr => {
            if (attr.name !== name && attr.name !== 'class' && !attr.name.startsWith('data-')) {
                props[attr.name.toLowerCase()] = attr.value;
            }
        });
        // Process $attribute usage in all elements
        const processElementProps = (el) => {
            Array.from(el.attributes).forEach(attr => {
                const value = attr.value.trim();
                if (value.includes('$attribute(')) {
                    const propMatch = value.match(/\$attribute\(['"]([^'"]+)['"]\)/);
                    if (propMatch) {
                        const propName = propMatch[1].toLowerCase();
                        const propValue = props[propName] || '';
                        if (attr.name === 'class') {
                            const existingClasses = el.getAttribute('class') || '';
                            const newClasses = existingClasses
                                .replace(new RegExp(`\$attribute\(['"]${propName}['"]\)`, 'i'), propValue)
                                .split(' ')
                                .filter(Boolean)
                                .join(' ');
                            el.setAttribute('class', newClasses);
                        } else if (
                            attr.name.startsWith('x-') ||
                            attr.name.startsWith(':') ||
                            attr.name.startsWith('@') ||
                            attr.name.startsWith('x-bind:') ||
                            attr.name.startsWith('x-on:')
                        ) {
                            const escapedValue = propValue
                                .replace(/\\/g, '\\\\')
                                .replace(/'/g, "\\'")
                                .replace(/\"/g, '\\"')
                                .replace(/`/g, '\\`');
                            if (value !== `$attribute('${propName}')`) {
                                const newValue = value.replace(
                                    /\$attribute\(['"]([^'"]+)['"]\)/g,
                                    (_, name) => `\`${props[name.toLowerCase()] || ''}\``
                                );
                                el.setAttribute(attr.name, newValue);
                            } else {
                                el.setAttribute(attr.name, `\`${escapedValue}\``);
                            }
                        } else {
                            el.setAttribute(attr.name, propValue);
                        }
                    }
                }
            });
            Array.from(el.children).forEach(processElementProps);
        };
        topLevelElements.forEach(processElementProps);
        // Apply attributes from placeholder to root elements
        topLevelElements.forEach(rootElement => {
            Array.from(element.attributes).forEach(attr => {
                if (attr.name === 'class') {
                    const existingClass = rootElement.getAttribute('class') || '';
                    const newClasses = `${existingClass} ${attr.value}`.trim();
                    rootElement.setAttribute('class', newClasses);
                } else if (attr.name.startsWith('x-') || attr.name.startsWith(':') || attr.name.startsWith('@')) {
                    rootElement.setAttribute(attr.name, attr.value);
                } else if (attr.name !== name && !attr.name.startsWith('data-')) {
                    rootElement.setAttribute(attr.name, attr.value);
                }
                // Preserve important data attributes including data-order
                else if (attr.name === 'data-order' || attr.name === 'x-route' || attr.name === 'data-head') {
                    rootElement.setAttribute(attr.name, attr.value);
                }
            });
            // Set data-component=instanceId if provided
            if (instanceId) {
                rootElement.setAttribute('data-component', instanceId);
            }
        });
        // After rendering, copy all attributes from the original placeholder to the first top-level element
        if (topLevelElements.length > 0) {
            const firstRoot = topLevelElements[0];
            Array.from(element.attributes).forEach(attr => {
                // Preserve important attributes including data-order, x-route, and other routing/data attributes
                const preserveAttributes = [
                    'data-order', 'x-route', 'data-component', 'data-head',
                    'x-route-*', 'data-route-*'
                ];
                const shouldPreserve = preserveAttributes.some(preserveAttr =>
                    attr.name === preserveAttr || attr.name.startsWith(preserveAttr.replace('*', ''))
                );

                if (!['data-original-placeholder', 'data-pre-rendered', 'data-processed'].includes(attr.name) || shouldPreserve) {
                    firstRoot.setAttribute(attr.name, attr.value);
                }
            });
        }
        const parent = element.parentElement;
        if (!parent || !document.contains(element)) {
            return;
        }
        // Replace the placeholder element with the component content
        const fragment = document.createDocumentFragment();
        topLevelElements.forEach(el => fragment.appendChild(el));
        parent.replaceChild(fragment, element);
    },
    initialize() {
    }
}; 

(function () {
    let componentInstanceCounters = {};
    const swappedInstances = new Set();
    const instanceRouteMap = new Map();
    const placeholderMap = new Map();

    function getComponentInstanceId(name) {
        if (!componentInstanceCounters[name]) componentInstanceCounters[name] = 1;
        else componentInstanceCounters[name]++;
        return `${name}-${componentInstanceCounters[name]}`;
    }

    function logSiblings(parent, context) {
        if (!parent) return;
        const siblings = Array.from(parent.children).map(el => `${el.tagName}[data-component=${el.getAttribute('data-component') || ''}]`).join(', ');
    }

    window.InduxComponentsSwapping = {
        // Swap in source code for a placeholder
        async swapIn(placeholder) {
            if (placeholder.hasAttribute('data-swapped')) return;
            const processor = window.InduxComponentsProcessor;
            if (!processor) return;
            const name = placeholder.tagName.toLowerCase().replace('x-', '');
            let instanceId = placeholder.getAttribute('data-component');
            if (!instanceId) {
                instanceId = getComponentInstanceId(name);
                placeholder.setAttribute('data-component', instanceId);
            }
            // Save placeholder for reversion in the map
            if (!placeholderMap.has(instanceId)) {
                const clone = placeholder.cloneNode(true);
                clone.setAttribute('data-original-placeholder', '');
                clone.setAttribute('data-component', instanceId);
                placeholderMap.set(instanceId, clone);
            }
            // Log before swap
            logSiblings(placeholder.parentNode, `Before swapIn for ${instanceId}`);
            // Process and swap in source code, passing instanceId
            await processor.processComponent(placeholder, instanceId);
            swappedInstances.add(instanceId);
            // Track the route for this instance
            const xRoute = placeholder.getAttribute('x-route');
            instanceRouteMap.set(instanceId, xRoute);
            // Log after swap
            logSiblings(placeholder.parentNode || document.body, `After swapIn for ${instanceId}`);
        },
        // Revert to placeholder
        revert(instanceId) {
            if (!swappedInstances.has(instanceId)) return;
            // Remove all elements with data-component=instanceId
            const rendered = Array.from(document.querySelectorAll(`[data-component="${instanceId}"]`));
            if (rendered.length === 0) return;
            const first = rendered[0];
            const parent = first.parentNode;
            // Retrieve the original placeholder from the map
            const placeholder = placeholderMap.get(instanceId);
            // Log before revert
            logSiblings(parent, `Before revert for ${instanceId}`);
            // Remove all rendered elements
            rendered.forEach(el => {
                el.remove();
            });
            // Restore the placeholder at the correct position if not present
            if (placeholder && parent && !parent.contains(placeholder)) {
                const targetPosition = parseInt(placeholder.getAttribute('data-order')) || 0;
                let inserted = false;

                // Find the correct position based on data-order
                for (let i = 0; i < parent.children.length; i++) {
                    const child = parent.children[i];
                    const childPosition = parseInt(child.getAttribute('data-order')) || 0;

                    if (targetPosition < childPosition) {
                        parent.insertBefore(placeholder, child);
                        inserted = true;
                        break;
                    }
                }

                // If not inserted (should be at the end), append to parent
                if (!inserted) {
                    parent.appendChild(placeholder);
                }

            }
            swappedInstances.delete(instanceId);
            instanceRouteMap.delete(instanceId);
            placeholderMap.delete(instanceId);
            // Log after revert
            logSiblings(parent, `After revert for ${instanceId}`);
        },
        // Main swapping logic
        async processAll() {
            componentInstanceCounters = {};
            const registry = window.InduxComponentsRegistry;
            if (!registry) return;
            const routing = window.InduxRouting;
            const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
                el.tagName.toLowerCase().startsWith('x-') &&
                !el.hasAttribute('data-pre-rendered') &&
                !el.hasAttribute('data-processed')
            );
            // First pass: revert any swapped-in instances that no longer match
            if (routing) {
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                for (const instanceId of Array.from(swappedInstances)) {
                    const xRoute = instanceRouteMap.get(instanceId);
                    const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                    if (!matches) {
                        this.revert(instanceId);
                    }
                }
            }
            // Second pass: swap in any placeholders that match
            for (const placeholder of placeholders) {
                const name = placeholder.tagName.toLowerCase().replace('x-', '');
                let instanceId = placeholder.getAttribute('data-component');
                if (!instanceId) {
                    instanceId = getComponentInstanceId(name);
                    placeholder.setAttribute('data-component', instanceId);
                }
                const xRoute = placeholder.getAttribute('x-route');
                if (!routing) {
                    // No routing: always swap in
                    await this.swapIn(placeholder);
                } else {
                    // Routing present: check route
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                    const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                    if (matches) {
                        await this.swapIn(placeholder);
                    }
                }
            }
        },
        initialize() {
            // On init, process all
            this.processAll().then(() => {
                // Dispatch event when components are fully processed
                window.dispatchEvent(new CustomEvent('indux:components-processed'));
            });
            // If routing is present, listen for route changes
            if (window.InduxRouting) {
                window.addEventListener('indux:route-change', () => {
                    this.processAll().then(() => {
                        // Dispatch event when components are fully processed after route change
                        window.dispatchEvent(new CustomEvent('indux:components-processed'));
                    });
                });
            }
        }
    };
})(); 

window.InduxComponentsMutation = {
    async processAllPlaceholders() {
        const processor = window.InduxComponentsProcessor;
        const routing = window.InduxRouting;
        if (!processor) return;
        const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
            el.tagName.toLowerCase().startsWith('x-') &&
            !el.hasAttribute('data-pre-rendered') &&
            !el.hasAttribute('data-processed')
        );
        for (const el of placeholders) {
            if (routing) {
                // Only process if route matches
                const xRoute = el.getAttribute('x-route');
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                if (!matches) continue;
            }
            await processor.processComponent(el);
        }
    },
    initialize() {
        const processor = window.InduxComponentsProcessor;
        const routing = window.InduxRouting;
        if (!processor) return;
        // Initial scan
        this.processAllPlaceholders();
        // Mutation observer for new placeholders
        const observer = new MutationObserver(async mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.tagName.toLowerCase().startsWith('x-')) {
                        if (!node.hasAttribute('data-pre-rendered') && !node.hasAttribute('data-processed')) {
                            if (routing) {
                                const xRoute = node.getAttribute('x-route');
                                const currentPath = window.location.pathname;
                                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                                const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                                if (!matches) continue;
                            }
                            await processor.processComponent(node);
                        }
                    }
                    // Also check for any <x-*> descendants
                    if (node.nodeType === 1) {
                        const descendants = Array.from(node.querySelectorAll('*')).filter(el =>
                            el.tagName.toLowerCase().startsWith('x-') &&
                            !el.hasAttribute('data-pre-rendered') &&
                            !el.hasAttribute('data-processed')
                        );
                        for (const el of descendants) {
                            if (routing) {
                                const xRoute = el.getAttribute('x-route');
                                const currentPath = window.location.pathname;
                                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                                const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                                if (!matches) continue;
                            }
                            await processor.processComponent(el);
                        }
                    }
                }
            }
        });

        // Ensure document.body exists before observing
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            // Wait for body to be available
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    }
}; 


// Main initialization for Indux Components
function initializeComponents() {
    if (window.InduxComponentsRegistry) window.InduxComponentsRegistry.initialize();
    if (window.InduxComponentsLoader) window.InduxComponentsLoader.initialize();
    if (window.InduxComponentsProcessor) window.InduxComponentsProcessor.initialize();
    if (window.InduxComponentsSwapping) window.InduxComponentsSwapping.initialize();
    if (window.InduxComponentsMutation) window.InduxComponentsMutation.initialize();
    if (window.InduxComponentsUtils) window.InduxComponentsUtils.initialize?.();
    window.__induxComponentsInitialized = true;
    window.dispatchEvent(new CustomEvent('indux:components-ready'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponents);
} else {
    initializeComponents();
}

window.InduxComponents = {
    initialize: initializeComponents
};

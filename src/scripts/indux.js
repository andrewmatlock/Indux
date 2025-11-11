/*  Indux JS
/*  By Andrew Matlock under MIT license
/*  https://github.com/andrewmatlock/Indux
/*
/*  Contains all Indux plugins bundled with Iconify (iconify.design)
/*
/*  With on-demand reference to:
/*  - js-yaml (https://nodeca.github.io/js-yaml)
/*  - Marked JS (https://marked.js.org)
/*
/*  Requires Alpine JS (alpinejs.dev) to operate.
/*  Some plugins use Indux CSS styles.
*/


var Indux = (function (exports) {
    'use strict';

    var indux_components = {};

    /* Indux Components */

    var hasRequiredIndux_components;

    function requireIndux_components () {
    	if (hasRequiredIndux_components) return indux_components;
    	hasRequiredIndux_components = 1;
    	// Components registry
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

    	// Components loader
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

    	// Components processor
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

    	        // Extract and prepare scripts for execution
    	        const scripts = [];
    	        const processScripts = (el) => {
    	            if (el.tagName.toLowerCase() === 'script') {
    	                scripts.push({
    	                    content: el.textContent,
    	                    type: el.getAttribute('type') || 'text/javascript',
    	                    src: el.getAttribute('src'),
    	                    async: el.hasAttribute('async'),
    	                    defer: el.hasAttribute('defer')
    	                });
    	                // Remove script from DOM to avoid duplication
    	                el.remove();
    	            } else {
    	                Array.from(el.children).forEach(processScripts);
    	            }
    	        };
    	        topLevelElements.forEach(processScripts);
    	        // Collect properties from placeholder attributes
    	        const props = {};
    	        Array.from(element.attributes).forEach(attr => {
    	            if (attr.name !== name && attr.name !== 'class' && !attr.name.startsWith('data-')) {
    	                // Store both original case and lowercase for flexibility
    	                props[attr.name] = attr.value;
    	                props[attr.name.toLowerCase()] = attr.value;
    	                // For Alpine bindings (starting with :), also store without the : prefix
    	                if (attr.name.startsWith(':')) {
    	                    const keyWithoutColon = attr.name.substring(1);
    	                    props[keyWithoutColon] = attr.value;
    	                    props[keyWithoutColon.toLowerCase()] = attr.value;
    	                }
    	            }
    	        });
    	        // Process $modify usage in all elements
    	        const processElementProps = (el) => {
    	            Array.from(el.attributes).forEach(attr => {
    	                const value = attr.value.trim();
    	                if (value.includes('$modify(')) {
    	                    const propMatch = value.match(/\$modify\(['"]([^'"]+)['"]\)/);
    	                    if (propMatch) {
    	                        const propName = propMatch[1].toLowerCase();
    	                        const propValue = props[propName] || '';
    	                        if (attr.name === 'class') {
    	                            const existingClasses = el.getAttribute('class') || '';
    	                            const newClasses = existingClasses
    	                                .replace(new RegExp(`\$modify\(['"]${propName}['"]\)`, 'i'), propValue)
    	                                .split(' ')
    	                                .filter(Boolean)
    	                                .join(' ');
    	                            el.setAttribute('class', newClasses);
    	                        } else if (attr.name === 'x-icon') {
    	                            // x-icon should get the raw value, not wrapped for Alpine evaluation
    	                            el.setAttribute(attr.name, propValue);
    	                        } else if (attr.name === 'x-show' || attr.name === 'x-if') {
    	                            // x-show and x-if expect boolean expressions, convert string to boolean check
    	                            if (value !== `$modify('${propName}')`) {
    	                                const newValue = value.replace(
    	                                    /\$modify\(['"]([^'"]+)['"]\)/g,
    	                                    (_, name) => {
    	                                        const val = props[name.toLowerCase()] || '';
    	                                        // Convert to boolean check - true if value exists and is not empty
    	                                        return val ? 'true' : 'false';
    	                                    }
    	                                );
    	                                el.setAttribute(attr.name, newValue);
    	                            } else {
    	                                // Simple replacement - check if prop exists and is not empty
    	                                const booleanValue = propValue && propValue.trim() !== '' ? 'true' : 'false';
    	                                el.setAttribute(attr.name, booleanValue);
    	                            }
    	                        } else if (
    	                            attr.name.startsWith('x-') ||
    	                            attr.name.startsWith(':') ||
    	                            attr.name.startsWith('@') ||
    	                            attr.name.startsWith('x-bind:') ||
    	                            attr.name.startsWith('x-on:')
    	                        ) {
    	                            // For Alpine directives, properly quote string values
    	                            if (value !== `$modify('${propName}')`) {
    	                                // Handle mixed content with multiple $modify() calls
    	                                const newValue = value.replace(
    	                                    /\$modify\(['"]([^'"]+)['"]\)/g,
    	                                    (_, name) => {
    	                                        const val = props[name.toLowerCase()] || '';
    	                                        // For expressions with fallbacks (||), use null for empty/whitespace values
    	                                        if (!val || val.trim() === '' || /^[\r\n\t\s]+$/.test(val)) {
    	                                            return value.includes('||') ? 'null' : "''";
    	                                        }
    	                                        // If value starts with $, it's an Alpine expression - don't quote
    	                                        if (val.startsWith('$')) {
    	                                            // Special handling for x-for, x-if, and x-show with $x data source expressions
    	                                            // Add safe fallbacks to prevent errors during initial render when data source hasn't loaded yet
    	                                            if ((attr.name === 'x-for' || attr.name === 'x-if' || attr.name === 'x-show') && val.startsWith('$x') && !val.includes('??')) {
    	                                                // Convert regular property access dots to optional chaining for safe navigation
    	                                                let safeVal = val.replace(/\./g, '?.');
    	                                                // Add fallback based on directive type (only if user hasn't already provided one)
    	                                                if (attr.name === 'x-for') {
    	                                                    // x-for needs an iterable, so fallback to empty array
    	                                                    return `${safeVal} ?? []`;
    	                                                } else {
    	                                                    // x-if and x-show evaluate to boolean, fallback to false
    	                                                    return `${safeVal} ?? false`;
    	                                                }
    	                                            }
    	                                            return val;
    	                                        }
    	                                        // Special handling for x-for, x-if, and x-show - these can contain expressions
    	                                        // that reference data sources or other dynamic content
    	                                        if (attr.name === 'x-for' || attr.name === 'x-if' || attr.name === 'x-show') {
    	                                            // For these directives, preserve the value as-is to allow Alpine to evaluate it
    	                                            // This is critical for x-for expressions like "card in $x.data.items"
    	                                            return val;
    	                                        }
    	                                        // Always quote string values to ensure they're treated as strings, not variables
    	                                        return `'${val.replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}'`;
    	                                    }
    	                                );
    	                                el.setAttribute(attr.name, newValue);
    	                            } else {
    	                                // Simple $modify() replacement
    	                                if (!propValue || propValue.trim() === '' || /^[\r\n\t\s]+$/.test(propValue)) {
    	                                    // For empty/whitespace values, remove the attribute
    	                                    el.removeAttribute(attr.name);
    	                                } else {
    	                                    // If value starts with $, it's an Alpine expression - don't quote
    	                                    if (propValue.startsWith('$')) {
    	                                        el.setAttribute(attr.name, propValue);
    	                                    } else {
    	                                        // Always quote string values and escape special characters
    	                                        const quotedValue = `'${propValue.replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}'`;
    	                                        el.setAttribute(attr.name, quotedValue);
    	                                    }
    	                                }
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
    	                    'x-route-*', 'data-route-*', 'x-tabpanel'
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

    	        // Execute scripts after component is rendered
    	        if (scripts.length > 0) {
    	            // Use a small delay to ensure DOM is updated
    	            setTimeout(() => {
    	                scripts.forEach(script => {
    	                    if (script.src) {
    	                        // External script - create and append to head
    	                        const scriptEl = document.createElement('script');
    	                        scriptEl.src = script.src;
    	                        scriptEl.type = script.type;
    	                        if (script.async) scriptEl.async = true;
    	                        if (script.defer) scriptEl.defer = true;
    	                        document.head.appendChild(scriptEl);
    	                    } else if (script.content) {
    	                        // Inline script - execute directly
    	                        try {
    	                            // Create a function to execute the script in the global scope
    	                            const executeScript = new Function(script.content);
    	                            executeScript();
    	                        } catch (error) {
    	                            console.error(`[Indux] Error executing script in component ${name}:`, error);
    	                        }
    	                    }
    	                });
    	            }, 0);
    	        }
    	    },
    	    initialize() {
    	    }
    	}; 

    	// Components swapping
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
    	        Array.from(parent.children).map(el => `${el.tagName}[data-component=${el.getAttribute('data-component') || ''}]`).join(', ');
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
    	            logSiblings(placeholder.parentNode);
    	            // Process and swap in source code, passing instanceId
    	            await processor.processComponent(placeholder, instanceId);
    	            swappedInstances.add(instanceId);
    	            // Track the route for this instance
    	            const xRoute = placeholder.getAttribute('x-route');
    	            instanceRouteMap.set(instanceId, xRoute);
    	            // Log after swap
    	            logSiblings(placeholder.parentNode || document.body);
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
    	            logSiblings(parent);
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
    	            logSiblings(parent);
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

    	// Components mutation observer
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
    	return indux_components;
    }

    requireIndux_components();

    var indux_appwrite_auth = {};

    /* Auth config */

    var hasRequiredIndux_appwrite_auth;

    function requireIndux_appwrite_auth () {
    	if (hasRequiredIndux_appwrite_auth) return indux_appwrite_auth;
    	hasRequiredIndux_appwrite_auth = 1;
    	// Load manifest if not already loaded
    	async function ensureManifest() {
    	    if (window.InduxComponentsRegistry?.manifest) {
    	        return window.InduxComponentsRegistry.manifest;
    	    }

    	    try {
    	        const response = await fetch('/manifest.json');
    	        return await response.json();
    	    } catch (error) {
    	        return null;
    	    }
    	}

    	// Get Appwrite config from manifest
    	async function getAppwriteConfig() {
    	    const manifest = await ensureManifest();
    	    if (!manifest?.appwrite) {
    	        return null;
    	    }

    	    const appwriteConfig = manifest.appwrite;
    	    const endpoint = appwriteConfig.endpoint;
    	    const projectId = appwriteConfig.projectId;
    	    const devKey = appwriteConfig.devKey; // Optional dev key to bypass rate limits in development

    	    if (!endpoint || !projectId) {
    	        return null;
    	    }

    	    // Get auth methods from config (defaults to ["magic", "oauth"] if not specified)
    	    const authMethods = appwriteConfig.auth?.methods || ["magic", "oauth"];
    	    
    	    // Guest session support: "guest-auto" = automatic, "guest-manual" = manual only
    	    const guestAuto = authMethods.includes("guest-auto");
    	    const guestManual = authMethods.includes("guest-manual");
    	    const hasGuest = guestAuto || guestManual;
    	    
    	    const magicEnabled = authMethods.includes("magic");
    	    const oauthEnabled = authMethods.includes("oauth");
    	    
    	    // Teams support: presence of teams object enables it
    	    const teamsEnabled = !!appwriteConfig.auth?.teams;
    	    const permanentTeams = appwriteConfig.auth?.teams?.permanent || null; // Array of team names (immutable)
    	    const templateTeams = appwriteConfig.auth?.teams?.template || null; // Array of team names (can be deleted and reapplied)
    	    const teamsPollInterval = appwriteConfig.auth?.teams?.pollInterval || null; // Polling interval in milliseconds (null = disabled)
    	    
    	    // Default roles: permanent (cannot be deleted) and template (can be deleted)
    	    // These are objects mapping role names to permissions: { "Admin": ["inviteMembers", ...] }
    	    const permanentRoles = appwriteConfig.auth?.roles?.permanent || null; // Object: { "RoleName": ["permission1", ...] }
    	    const templateRoles = appwriteConfig.auth?.roles?.template || null; // Object: { "RoleName": ["permission1", ...] }
    	    
    	    // Member roles: derived from permanent and template roles (merged)
    	    // This is used for role normalization, permission checking, and creatorRole logic
    	    const memberRoles = permanentRoles || templateRoles 
    	        ? { ...(permanentRoles || {}), ...(templateRoles || {}) }
    	        : (appwriteConfig.auth?.memberRoles || null); // Fallback to legacy memberRoles if roles not defined
    	    
    	    // Creator role: string reference to a role in memberRoles (role creator gets by default)
    	    const creatorRole = appwriteConfig.auth?.creatorRole || null;
    	    
    	    return {
    	        endpoint,
    	        projectId,
    	        devKey, // Optional dev key for development
    	        authMethods,
    	        guest: hasGuest,
    	        guestAuto: guestAuto,
    	        guestManual: guestManual,
    	        anonymous: guestAuto, // For backwards compatibility with existing code
    	        magic: magicEnabled,
    	        oauth: oauthEnabled,
    	        teams: teamsEnabled,
    	        permanentTeams: permanentTeams, // Array of team names (cannot be deleted)
    	        templateTeams: templateTeams, // Array of team names (can be deleted and reapplied)
    	        teamsPollInterval: teamsPollInterval, // Polling interval in milliseconds (null = disabled)
    	        memberRoles: memberRoles, // Role definitions: { "RoleName": ["permission1", "permission2"] }
    	        permanentRoles: permanentRoles, // Object: { "RoleName": ["permission1", ...] } (cannot be deleted)
    	        templateRoles: templateRoles, // Object: { "RoleName": ["permission1", ...] } (can be deleted)
    	        creatorRole: creatorRole // String reference to memberRoles key
    	    };
    	}

    	// Initialize Appwrite client (assumes SDK loaded separately)
    	let appwriteClient = null;
    	let appwriteAccount = null;
    	let appwriteTeams = null;
    	let appwriteUsers = null;

    	async function getAppwriteClient() {
    	    // Check if Appwrite SDK is loaded
    	    if (!window.Appwrite || !window.Appwrite.Client || !window.Appwrite.Account) {
    	        return null;
    	    }

    	    if (!appwriteClient) {
    	        const config = await getAppwriteConfig();
    	        if (!config) {
    	            return null;
    	        }

    	        appwriteClient = new window.Appwrite.Client()
    	            .setEndpoint(config.endpoint)
    	            .setProject(config.projectId);
    	        
    	        // Add dev key header if provided (bypasses rate limits in development)
    	        // See: https://appwrite.io/docs/advanced/platform/rate-limits#dev-keys
    	        if (config.devKey) {
    	            appwriteClient.headers['X-Appwrite-Dev-Key'] = config.devKey;
    	        }

    	        appwriteAccount = new window.Appwrite.Account(appwriteClient);
    	        appwriteTeams = new window.Appwrite.Teams(appwriteClient);
    	        
    	        // Initialize Users service if available (for fetching user details)
    	        if (window.Appwrite.Users) {
    	            appwriteUsers = new window.Appwrite.Users(appwriteClient);
    	        }
    	    }

    	    return {
    	        client: appwriteClient,
    	        account: appwriteAccount,
    	        teams: appwriteTeams,
    	        users: appwriteUsers, // Add users service for fetching user details
    	        realtime: window.Appwrite?.Realtime ? new window.Appwrite.Realtime(appwriteClient) : null // Realtime service for subscriptions
    	    };
    	}

    	// Export configuration interface
    	window.InduxAppwriteAuthConfig = {
    	    getAppwriteConfig,
    	    getAppwriteClient,
    	    ensureManifest
    	};

    	/* Auth store */

    	// Initialize auth store
    	function initializeAuthStore() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Cross-tab synchronization using localStorage events
    	    const STORAGE_KEY = 'indux:auth:state';
    	    
    	    // Listen for storage events from other tabs
    	    window.addEventListener('storage', (e) => {
    	        if (e.key === STORAGE_KEY && e.newValue) {
    	            try {
    	                const state = JSON.parse(e.newValue);
    	                const store = Alpine.store('auth');
    	                if (store) {
    	                    // Update store state from other tab
    	                    store.isAuthenticated = state.isAuthenticated;
    	                    store.isAnonymous = state.isAnonymous;
    	                    store.user = state.user;
    	                    store.session = state.session;
    	                    store.magicLinkSent = state.magicLinkSent || false;
    	                    store.magicLinkExpired = state.magicLinkExpired || false;
    	                    store.error = state.error;
    	                }
    	            } catch (error) {
    	                // Failed to sync state from other tab
    	            }
    	        }
    	    });

    	    // Helper to sync state to localStorage (for cross-tab communication)
    	    function syncStateToStorage(store) {
    	        try {
    	            const state = {
    	                isAuthenticated: store.isAuthenticated,
    	                isAnonymous: store.isAnonymous,
    	                user: store.user,
    	                session: store.session,
    	                magicLinkSent: store.magicLinkSent,
    	                magicLinkExpired: store.magicLinkExpired,
    	                error: store.error
    	            };
    	            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    	        } catch (error) {
    	            // Failed to sync state to storage
    	        }
    	    }

    	    const authStore = {
    	        user: null,
    	        session: null,
    	        isAuthenticated: false,
    	        isAnonymous: false,
    	        inProgress: false,
    	        error: null,
    	        magicLinkSent: false,
    	        magicLinkExpired: false,
    	        teams: [], // List of user's teams
    	        currentTeam: null, // Currently selected/active team
    	        _teamsPollInterval: null, // Interval ID for teams polling (deprecated, use realtime instead)
    	        _teamsRealtimeUnsubscribe: null, // Realtime subscription cleanup function (may be array of unsubscribes)
    	        _teamsRealtimeSubscribing: false, // Flag to prevent recursive subscription during refresh
    	        // Team management properties (reactive, no x-data needed)
    	        newTeamName: '',
    	        updateTeamNameInput: '',
    	        inviteEmail: '',
    	        inviteRoles: [], // Array of selected roles for checkboxes
    	        currentTeamMemberships: [],
    	        deletedTemplateTeams: [],
    	        deletedTemplateRoles: [], // Deleted template roles (can be reapplied)
    	        _teamImmutableCache: {},
    	        // User-generated roles properties
    	        newRoleName: '',
    	        newRolePermissions: [], // Array of selected permissions for checkboxes
    	        allAvailablePermissions: [], // Cached list of all available permissions for autocomplete
    	        editingRole: null, // Current role being edited: { teamId, oldRoleName, newRoleName, permissions }
    	        editingMember: null, // Current member being edited: { teamId, membershipId, roles }
    	        _initialized: false,
    	        _initializing: false,
    	        _appwrite: null,
    	        _guestAuto: false,
    	        _guestManual: false,
    	        guestManualEnabled: false,
    	        _oauthProvider: null, // Store OAuth provider name (google, github, etc.) when login is initiated
    	        _syncStateToStorage: syncStateToStorage,
    	        
    	        // Permission cache properties (initialized early for Alpine reactivity)
    	        _permissionCache: {},
    	        _userRoleCache: null,
    	        _allRolesCache: null,
    	        _allRolesCacheByTeam: {}, // Cache roles per team ID
    	        _rolePermanentCache: {}, // Cache permanent role status per team: { teamId: { roleName: true/false } }
    	        _userGeneratedRolesCache: {},
    	        
    	        // Permission cache methods (always available, return safe defaults)
    	        canInviteMembers() {
    	            return (this._permissionCache && this._permissionCache.inviteMembers) || false;
    	        },
    	        canRemoveMembers() {
    	            return (this._permissionCache && this._permissionCache.removeMembers) || false;
    	        },
    	        canRenameTeam() {
    	            return (this._permissionCache && this._permissionCache.renameTeam) || false;
    	        },
    	        // Check if user can authenticate (not already authenticated as non-anonymous or in progress)
    	        canAuthenticate() {
    	            return !((this.isAuthenticated && !this.isAnonymous) || this.inProgress);
    	        },
    	        canDeleteTeam() {
    	            return (this._permissionCache && this._permissionCache.deleteTeam) || false;
    	        },
    	        currentUserRole() {
    	            return this._userRoleCache || null;
    	        },
    	        allTeamRoles(team) {
    	            // If team is provided, get roles for that specific team
    	            if (team && team.$id) {
    	                // Return cached roles for this specific team
    	                return this._allRolesCacheByTeam[team.$id] || {};
    	            }
    	            // Fallback: return roles for current team
    	            if (this.currentTeam && this.currentTeam.$id) {
    	                return this._allRolesCacheByTeam[this.currentTeam.$id] || this._allRolesCache || {};
    	            }
    	            return this._allRolesCache || {};
    	        },
    	        isUserGeneratedRoleCached(roleName) {
    	            return (this._userGeneratedRolesCache && this._userGeneratedRolesCache[roleName]) || false;
    	        },
    	        // Fallback for canManageRoles (will be overridden by roles module if available)
    	        async canManageRoles() {
    	            // If no custom roles defined, owner has manageRoles permission
    	            const config = window.InduxAppwriteAuthConfig;
    	            if (config) {
    	                try {
    	                    const appwriteConfig = await config.getAppwriteConfig();
    	                    const memberRoles = appwriteConfig?.memberRoles;
    	                    if (!memberRoles || Object.keys(memberRoles).length === 0) {
    	                        // No custom roles - owner has all permissions including manageRoles
    	                        if (this.isCurrentTeamOwner) {
    	                            return await this.isCurrentTeamOwner();
    	                        }
    	                        return false;
    	                    }
    	                    // Custom roles defined - check if user has manageRoles permission
    	                    if (this.hasTeamPermission) {
    	                        return await this.hasTeamPermission('manageRoles');
    	                    }
    	                } catch (error) {
    	                    return false;
    	                }
    	            }
    	            return false;
    	        },
    	        
    	        // Alias for backwards compatibility
    	        async canCreateRoles() {
    	            return await this.canManageRoles();
    	        },

    	        // Get personal team (convenience getter - returns first default team)
    	        get personalTeam() {
    	            // This is async, so we can't use a getter directly
    	            // Return null and let users call getPersonalTeam() or getDefaultTeams() directly
    	            return null;
    	        },

    	        // Get authentication method (oauth, magic, anonymous)
    	        getMethod() {
    	            if (!this.session) return null;
    	            const provider = this.session.provider;
    	            if (provider === 'anonymous') return 'anonymous';
    	            if (provider === 'magic-url') return 'magic';
    	            // OAuth providers return their name (google, github, etc.)
    	            if (provider && provider !== 'anonymous' && provider !== 'magic-url') return 'oauth';
    	            return null;
    	        },

    	        // Get OAuth provider name (google, github, etc.) or null for non-OAuth methods
    	        // Uses stored provider from loginOAuth() call, or falls back to session.provider
    	        // For existing sessions without stored provider, triggers async fetch from Appwrite identities
    	        getProvider() {
    	            if (!this.session) {
    	                return null;
    	            }
    	            const sessionProvider = this.session.provider;
    	            
    	            // For OAuth, return the stored provider name (google, github, etc.)
    	            // session.provider returns "oauth2" generically, so we use _oauthProvider
    	            if (sessionProvider && sessionProvider !== 'anonymous' && sessionProvider !== 'magic-url') {
    	                // Try to get from store first, then localStorage, then sessionStorage
    	                let provider = this._oauthProvider;
    	                if (!provider) {
    	                    try {
    	                        // Try localStorage first (persists across redirects)
    	                        provider = localStorage.getItem('indux:oauth:provider');
    	                        if (!provider) {
    	                            // Fallback to sessionStorage
    	                            provider = sessionStorage.getItem('indux:oauth:provider');
    	                        }
    	                        if (provider) {
    	                            this._oauthProvider = provider; // Cache it in store
    	                        }
    	                    } catch (e) {
    	                        // Storage error
    	                    }
    	                }
    	                
    	                // If still no provider, trigger async fetch from Appwrite identities (for existing sessions)
    	                // This runs in background and updates _oauthProvider when complete
    	                if (!provider && this._appwrite && this._appwrite.account && !this._fetchingProvider) {
    	                    this._fetchingProvider = true; // Prevent multiple simultaneous fetches
    	                    this._appwrite.account.listIdentities().then(identities => {
    	                        if (identities && identities.identities && identities.identities.length > 0) {
    	                            // Find OAuth identity (provider will be google, github, etc.)
    	                            const oauthIdentity = identities.identities.find(id => 
    	                                id.provider && 
    	                                id.provider !== 'anonymous' && 
    	                                id.provider !== 'magic-url' &&
    	                                id.provider !== 'oauth2'
    	                            );
    	                            if (oauthIdentity && oauthIdentity.provider) {
    	                                this._oauthProvider = oauthIdentity.provider; // Cache it
    	                                // Store in localStorage for future use
    	                                try {
    	                                    localStorage.setItem('indux:oauth:provider', oauthIdentity.provider);
    	                                    // Trigger Alpine reactivity by accessing store
    	                                    const store = Alpine.store('auth');
    	                                    if (store) {
    	                                        void store._oauthProvider;
    	                                    }
    	                                } catch (e) {
    	                                    // Ignore storage errors
    	                                }
    	                            }
    	                        }
    	                        this._fetchingProvider = false;
    	                    }).catch(error => {
    	                        this._fetchingProvider = false;
    	                    });
    	                }
    	                
    	                const finalProvider = provider || sessionProvider;
    	                return finalProvider;
    	            }
    	            return null;
    	        },

    	        // Initialize auth state - simple session restoration
    	        async init() {
    	            if (this._initializing) {
    	                return;
    	            }
    	            
    	            if (this._initialized) {
    	                return;
    	            }

    	            this._initializing = true;
    	            this.inProgress = true;
    	            this.error = null;

    	            try {
    	                const appwrite = await config.getAppwriteClient();
    	                if (!appwrite) {
    	                    this._initialized = true;
    	                    this._initializing = false;
    	                    this.inProgress = false;
    	                    return;
    	                }

    	                this._appwrite = appwrite;

    	                // Get auth methods config from manifest
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                this._guestAuto = appwriteConfig?.guestAuto === true;
    	                this._guestManual = appwriteConfig?.guestManual === true;
    	                this.guestManualEnabled = appwriteConfig?.guestManual === true;

    	                // Try to restore existing session
    	                try {
    	                    this.user = await appwrite.account.get();
    	                    const sessionsResponse = await appwrite.account.listSessions();
    	                    const allSessions = sessionsResponse.sessions || [];
    	                    const currentSession = allSessions.find(s => s.current === true) || allSessions[0];
    	                    
    	                    if (currentSession) {
    	                        this.session = currentSession;
    	                        this.isAuthenticated = true;
    	                        this.isAnonymous = currentSession.provider === 'anonymous';
    	                        
    	                        // Restore OAuth provider from localStorage if available (persists across redirects)
    	                        // This ensures provider name persists across page refreshes
    	                        if (!this.isAnonymous && currentSession.provider !== 'magic-url') {
    	                            try {
    	                                // Try localStorage first (persists across redirects), fallback to sessionStorage
    	                                let storedProvider = localStorage.getItem('indux:oauth:provider');
    	                                if (!storedProvider) {
    	                                    storedProvider = sessionStorage.getItem('indux:oauth:provider');
    	                                }
    	                                if (storedProvider) {
    	                                    this._oauthProvider = storedProvider;
    	                                }
    	                            } catch (e) {
    	                                // Storage error
    	                            }
    	                        }
    	                        
    	                        // If guest is disabled but we have anonymous session, clear it
    	                        if (this.isAnonymous && !this._guestAuto && !this._guestManual) {
    	                            try {
    	                                await appwrite.account.deleteSession(this.session.$id);
    	                                this.isAuthenticated = false;
    	                                this.isAnonymous = false;
    	                                this.user = null;
    	                                this.session = null;
    	                            } catch (deleteError) {
    	                                // Failed to delete guest session
    	                            }
    	                        }
    	                    } else {
    	                        this.isAuthenticated = true; // User exists, session might be managed by cookies
    	                        this.isAnonymous = false;
    	                    }
    	                    
    	                    // Load teams if enabled and user is authenticated
    	                    if (this.isAuthenticated && appwriteConfig?.teams && this.listTeams) {
    	                        try {
    	                            await this.listTeams();
    	                            // Auto-create default teams if enabled
    	                            if ((appwriteConfig.permanentTeams || appwriteConfig.templateTeams) && window.InduxAppwriteAuthTeamsDefaults?.ensureDefaultTeams) {
    	                                await window.InduxAppwriteAuthTeamsDefaults.ensureDefaultTeams(this);
    	                            }
    	                        } catch (teamsError) {
    	                            // Don't fail initialization if teams fail to load
    	                        }
    	                    }
    	                } catch (error) {
    	                    // No existing session - this is expected
    	                    this.isAuthenticated = false;
    	                    this.isAnonymous = false;
    	                    this.user = null;
    	                    this.session = null;
    	                }

    	                // Sync state to localStorage
    	                syncStateToStorage(this);
    	            } catch (error) {
    	                this.error = error.message;
    	                this.isAuthenticated = false;
    	                this.isAnonymous = false;
    	            } finally {
    	                this.inProgress = false;
    	                this._initialized = true;
    	                this._initializing = false;

    	                // Dispatch initialized event - let callback handlers process after
    	                window.dispatchEvent(new CustomEvent('indux:auth:initialized', {
    	                    detail: {
    	                        isAuthenticated: this.isAuthenticated,
    	                        isAnonymous: this.isAnonymous
    	                    }
    	                }));
    	            }
    	        },

    	        // Manually create guest session (only works if guest-manual is enabled)
    	        async createGuest() {
    	            if (!this._guestManual) {
    	                return { success: false, error: 'Manual guest creation is not enabled' };
    	            }

    	            if (this.isAuthenticated && !this.isAnonymous) {
    	                return { success: false, error: 'Already signed in. Please logout first.' };
    	            }

    	            if (this.isAnonymous) {
    	                return { success: true, user: this.user, message: 'Already a guest' };
    	            }

    	            // Use the internal method if available, otherwise create it inline
    	            if (this._createAnonymousSession) {
    	                return await this._createAnonymousSession();
    	            }

    	            // Fallback: create anonymous session directly
    	            if (!this._appwrite) {
    	                this._appwrite = await config.getAppwriteClient();
    	            }
    	            if (!this._appwrite) {
    	                return { success: false, error: 'Appwrite not configured' };
    	            }

    	            this.inProgress = true;

    	            try {
    	                const session = await this._appwrite.account.createAnonymousSession();
    	                this.session = session;
    	                this.user = await this._appwrite.account.get();
    	                this.isAuthenticated = true;
    	                this.isAnonymous = true;
    	                this._oauthProvider = null;
    	                try {
    	                    localStorage.removeItem('indux:oauth:provider');
    	                    sessionStorage.removeItem('indux:oauth:provider');
    	                } catch (e) {
    	                    // Ignore
    	                }
    	                
    	                // Clear teams for guest sessions (guests don't have teams)
    	                this.teams = [];
    	                this.currentTeam = null;
    	                
    	                syncStateToStorage(this);
    	                window.dispatchEvent(new CustomEvent('indux:auth:anonymous', {
    	                    detail: { user: this.user }
    	                }));

    	                return { success: true, user: this.user };
    	            } catch (error) {
    	                this.error = error.message;
    	                this.isAuthenticated = false;
    	                this.isAnonymous = false;
    	                return { success: false, error: error.message };
    	            } finally {
    	                this.inProgress = false;
    	            }
    	        },

    	        // Convenience method: request guest session with automatic error handling
    	        async requestGuest() {
    	            const result = await this.createGuest();
    	            
    	            // Automatically handle errors
    	            if (!result.success) {
    	                this.error = result.error;
    	            } else {
    	                this.error = null;
    	            }
    	            
    	            return result;
    	        },

    	        // Logout from current session (works for both guest and authenticated sessions)
    	        async logout() {
    	            if (!this._appwrite) {
    	                return { success: false, error: 'Appwrite not configured' };
    	            }

    	            // If not authenticated, nothing to logout from
    	            if (!this.isAuthenticated) {
    	                return { success: true };
    	            }

    	            this.inProgress = true;

    	            try {
    	                // Delete current session (works for guest, magic link, and OAuth sessions)
    	                if (this.session) {
    	                    await this._appwrite.account.deleteSession(this.session.$id);
    	                }

    	                // Clear OAuth provider on logout
    	                this._oauthProvider = null;
    	                try {
    	                    localStorage.removeItem('indux:oauth:provider');
    	                    sessionStorage.removeItem('indux:oauth:provider');
    	                } catch (e) {
    	                    // Ignore
    	                }
    	                
    	                // Clear magic link flags
    	                this.magicLinkSent = false;
    	                this.magicLinkExpired = false;
    	                
    	                // Stop teams realtime subscription if active
    	                if (this.stopTeamsRealtime) {
    	                    this.stopTeamsRealtime();
    	                }
    	                
    	                // Stop teams polling if active (fallback)
    	                if (this.stopTeamsPolling) {
    	                    this.stopTeamsPolling();
    	                }
    	                
    	                // Clear teams on logout
    	                this.teams = [];
    	                this.currentTeam = null;
    	                
    	                // Clear deleted teams tracking for this user (optional - uncomment if you want to clear on logout)
    	                // try {
    	                //     const userId = this.user?.$id;
    	                //     if (userId) {
    	                //         localStorage.removeItem(`indux:deleted-teams:${userId}`);
    	                //     }
    	                // } catch (e) {
    	                //     // Ignore
    	                // }
    	                
    	                // Restore to guest state after logout (if guest-auto is enabled)
    	                // This only applies to non-guest sessions - if logging out from guest, don't create a new guest
    	                if (!this.isAnonymous && this._guestAuto && this._createAnonymousSession) {
    	                    await this._createAnonymousSession();
    	                } else {
    	                    // Clear auth state completely
    	                    this.isAuthenticated = false;
    	                    this.isAnonymous = false;
    	                    this.user = null;
    	                    this.session = null;
    	                }
    	                
    	                syncStateToStorage(this);
    	                window.dispatchEvent(new CustomEvent('indux:auth:logout'));
    	                return { success: true };
    	            } catch (error) {
    	                this.error = error.message;
    	                // If guest-auto is enabled and we were logged out from a non-guest session, try to restore guest
    	                if (!this.isAnonymous && this._guestAuto && this._createAnonymousSession) {
    	                    try {
    	                        await this._createAnonymousSession();
    	                    } catch (guestError) {
    	                        // Fall through to clear state
    	                        this.isAuthenticated = false;
    	                        this.isAnonymous = false;
    	                        this.user = null;
    	                        this.session = null;
    	                    }
    	                } else {
    	                    // Clear auth state completely
    	                    this.isAuthenticated = false;
    	                    this.isAnonymous = false;
    	                    this.user = null;
    	                    this.session = null;
    	                }
    	                // Stop teams realtime subscription if active
    	                if (this.stopTeamsRealtime) {
    	                    this.stopTeamsRealtime();
    	                }
    	                
    	                // Stop teams polling if active (fallback)
    	                if (this.stopTeamsPolling) {
    	                    this.stopTeamsPolling();
    	                }
    	                
    	                // Clear teams on logout error too
    	                this.teams = [];
    	                this.currentTeam = null;
    	                return { success: false, error: error.message };
    	            } finally {
    	                this.inProgress = false;
    	            }
    	        },

    	        // Clear current session
    	        async clearSession() {
    	            if (!this._appwrite) {
    	                return { success: false, error: 'Appwrite not configured' };
    	            }

    	            this.inProgress = true;

    	            try {
    	                if (this.session) {
    	                    await this._appwrite.account.deleteSession(this.session.$id);
    	                }

    	                this.isAuthenticated = false;
    	                this.isAnonymous = false;
    	                this.user = null;
    	                this.session = null;
    	                this.magicLinkSent = false;
    	                this.magicLinkExpired = false;
    	                this.error = null;
    	                this._oauthProvider = null;
    	                
    	                // Clear teams
    	                this.teams = [];
    	                this.currentTeam = null;
    	                
    	                // Clear OAuth provider from storage
    	                try {
    	                    localStorage.removeItem('indux:oauth:provider');
    	                    sessionStorage.removeItem('indux:oauth:provider');
    	                } catch (e) {
    	                    // Ignore
    	                }
    	                
    	                syncStateToStorage(this);
    	                window.dispatchEvent(new CustomEvent('indux:auth:session-cleared'));
    	                return { success: true };
    	            } catch (error) {
    	                this.error = error.message;
    	                this.isAuthenticated = false;
    	                this.isAnonymous = false;
    	                this.user = null;
    	                this.session = null;
    	                this.magicLinkSent = false;
    	                this.magicLinkExpired = false;
    	                return { success: false, error: error.message };
    	            } finally {
    	                this.inProgress = false;
    	            }
    	        },

    	        // Refresh user data
    	        async refresh() {
    	            if (!this._appwrite) {
    	                throw new Error('Appwrite not configured');
    	            }

    	            try {
    	                this.user = await this._appwrite.account.get();
    	                syncStateToStorage(this);
    	                return this.user;
    	            } catch (error) {
    	                // Session may have expired
    	                this.isAuthenticated = false;
    	                this.isAnonymous = false;
    	                this.user = null;
    	                this.session = null;
    	                syncStateToStorage(this);
    	                throw error;
    	            }
    	        }
    	    };
    	    
    	    Alpine.store('auth', authStore);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeAuthStore();
    	    } catch (error) {
    	        // Failed to initialize store
    	    }
    	});

    	// Export store interface
    	window.InduxAppwriteAuthStore = {
    	    initialize: initializeAuthStore
    	};

    	/*  Indux Appwrite Auth
    	/*  By Andrew Matlock under MIT license
    	/*  https://github.com/andrewmatlock/Indux
    	/*
    	/*  Supports authentication with an Appwrite project
    	/*  Requires Alpine JS (alpinejs.dev) to operate
    	*/

    	// Initialize auth plugin - orchestrates all modules
    	let _pluginInitializing = false;
    	async function initializeAppwriteAuthPlugin() {
    	    if (_pluginInitializing) {
    	        return;
    	    }

    	    // Wait for dependencies
    	    if (!window.InduxAppwriteAuthConfig) {
    	        return;
    	    }

    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    _pluginInitializing = true;

    	    // Wait for store to be ready
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store) {
    	            // Initialize store first
    	            if (!store._initialized && !store._initializing) {
    	                store.init();
    	            }
    	            
    	            // After store init, process callbacks and validate config
    	            window.addEventListener('indux:auth:initialized', async () => {
    	                // Validate role configuration if roles module is loaded
    	                if (store.validateRoleConfig) {
    	                    const validation = await store.validateRoleConfig();
    	                    if (!validation.valid) ; else if (validation.warnings && validation.warnings.length > 0) ;
    	                }
    	                
    	                // Process callbacks after store is initialized
    	                if (window.InduxAppwriteAuthCallbacks) {
    	                    const callbackInfo = window.InduxAppwriteAuthCallbacks.detect();
    	                    if (callbackInfo.hasCallback || callbackInfo.hasExpired) {
    	                        window.InduxAppwriteAuthCallbacks.process(callbackInfo);
    	                    }
    	                }
    	                
    	                // If no session and guest-auto is enabled, create guest session
    	                if (!store.isAuthenticated && store._guestAuto && store._createAnonymousSession) {
    	                    store._createAnonymousSession();
    	                }
    	            }, { once: true });
    	            
    	            _pluginInitializing = false;
    	        } else {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    // Start waiting after a short delay
    	    setTimeout(waitForStore, 150);
    	}

    	// Handle initialization
    	if (document.readyState === 'loading') {
    	    document.addEventListener('DOMContentLoaded', () => {
    	        if (window.Alpine) initializeAppwriteAuthPlugin();
    	    });
    	}

    	document.addEventListener('alpine:init', initializeAppwriteAuthPlugin);

    	// Export main interface
    	window.InduxAppwriteAuth = {
    	    initialize: initializeAppwriteAuthPlugin
    	};

    	/* Auth frontend */

    	// Initialize $auth magic method
    	function initializeAuthMagic() {
    	    if (typeof Alpine === 'undefined') {
    	        return false;
    	    }

    	    // Add $auth magic method (like $locale, $theme)
    	    Alpine.magic('auth', () => {
    	        const store = Alpine.store('auth');
    	        if (!store) {
    	            return {};
    	        }
    	        
    	        return new Proxy({}, {
    	            get(target, prop) {
    	                // Handle special keys
    	                if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
    	                    return undefined;
    	                }

    	                // Direct store property access
    	                if (prop in store) {
    	                    const value = store[prop];
    	                    // If it's a function, bind it to store context
    	                    if (typeof value === 'function') {
    	                        return value.bind(store);
    	                    }
    	                    return value;
    	                }
    	                
    	                // Special handling for computed properties
    	                if (prop === 'method') {
    	                    return store.getMethod();
    	                }
    	                
    	                if (prop === 'provider') {
    	                    // getProvider() is synchronous but may trigger async fetch in background
    	                    return store.getProvider();
    	                }
    	                
    	                return undefined;
    	            },
    	            set(target, prop, value) {
    	                // Forward assignments to the store for two-way binding (x-model)
    	                if (prop in store) {
    	                    store[prop] = value;
    	                    return true;
    	                }
    	                // Allow setting new properties (though they won't persist)
    	                target[prop] = value;
    	                return true;
    	            }
    	        });
    	    });
    	    
    	    return true;
    	}

    	// Handle both DOMContentLoaded and alpine:init
    	if (document.readyState === 'loading') {
    	    document.addEventListener('DOMContentLoaded', () => {
    	        if (window.Alpine) {
    	            initializeAuthMagic();
    	        }
    	    });
    	}

    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeAuthMagic();
    	    } catch (error) {
    	        // Failed to initialize magic method
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeAuthMagic();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export magic interface
    	window.InduxAppwriteAuthMagic = {
    	    initialize: initializeAuthMagic
    	};

    	/* Auth teams - Core operations */

    	// Add core team methods to auth store
    	function initializeTeamsCore() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.createTeam) {
    	            // Team creation
    	            store.createTeam = async function(teamId, name, roles = []) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                // Check if teams are enabled
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (appwriteConfig && !appwriteConfig.teams) {
    	                    return { success: false, error: 'Teams are not enabled' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to create a team' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Generate unique teamId if not provided
    	                    let finalTeamId = teamId;
    	                    if (!finalTeamId) {
    	                        if (window.Appwrite && window.Appwrite.ID && window.Appwrite.ID.unique) {
    	                            finalTeamId = window.Appwrite.ID.unique();
    	                        } else {
    	                            finalTeamId = 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    	                        }
    	                    }
    	                    
    	                    // Determine initial roles for team creator
    	                    let creatorRoles = roles;
    	                    if (creatorRoles.length === 0) {
    	                        // If no roles specified, use creatorRole from config
    	                        const memberRoles = appwriteConfig?.memberRoles;
    	                        const creatorRoleName = appwriteConfig?.creatorRole;
    	                        
    	                        if (memberRoles && creatorRoleName && memberRoles[creatorRoleName]) {
    	                            // Use specified creatorRole
    	                            creatorRoles = [creatorRoleName];
    	                        } else if (memberRoles && Object.keys(memberRoles).length > 0) {
    	                            // No creatorRole specified, find role with all owner permissions or use first
    	                            let foundRole = null;
    	                            for (const [roleName, permissions] of Object.entries(memberRoles)) {
    	                                if (this.roleHasAllOwnerPermissions && await this.roleHasAllOwnerPermissions(roleName)) {
    	                                    foundRole = roleName;
    	                                    break;
    	                                }
    	                            }
    	                            // If no role has all permissions, use first role
    	                            creatorRoles = [foundRole || Object.keys(memberRoles)[0]];
    	                        } else {
    	                            // No memberRoles defined - use Appwrite default (owner)
    	                            creatorRoles = ['owner'];
    	                        }
    	                    }
    	                    
    	                    // Normalize custom roles for Appwrite (add "owner" if needed)
    	                    if (this.normalizeRolesForAppwrite) {
    	                        creatorRoles = await this.normalizeRolesForAppwrite(creatorRoles);
    	                    }
    	                    
    	                    const result = await this._appwrite.teams.create(finalTeamId, name, creatorRoles);

    	                    // Apply default roles to the newly created team
    	                    if (window.InduxAppwriteAuthTeamsRolesDefaults && this.ensureDefaultRoles) {
    	                        await this.ensureDefaultRoles(finalTeamId);
    	                    }

    	                    // Refresh teams list
    	                    await this.listTeams();

    	                    return { success: true, team: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // List user's teams
    	            store.listTeams = async function(queries = [], search = '') {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    console.warn('[Indux Appwrite Auth] listTeams: User not authenticated');
    	                    return { success: false, error: 'You must be signed in to list teams' };
    	                }

    	                try {
    	                    const params = {
    	                        queries: queries
    	                    };
    	                    if (search && search.trim().length > 0) {
    	                        params.search = search;
    	                    }
    	                    const result = await this._appwrite.teams.list(params);

    	                    // Update store with teams
    	                    this.teams = result.teams || [];
    	                    
    	                    // Update currentTeam if it exists and was updated
    	                    if (this.currentTeam && this.currentTeam.$id) {
    	                        const updatedCurrentTeam = this.teams?.find(t => t.$id === this.currentTeam.$id);
    	                        if (updatedCurrentTeam) {
    	                            // Only update if name changed (to avoid unnecessary reactivity triggers)
    	                            if (updatedCurrentTeam.name !== this.currentTeam.name) {
    	                                this.currentTeam = { ...updatedCurrentTeam };
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Cache immutable status for all teams (if defaults module is loaded)
    	                    if (window.InduxAppwriteAuthTeamsDefaults && this.isTeamImmutable) {
    	                        for (const team of this.teams) {
    	                            if (!this._teamImmutableCache[team.$id]) {
    	                                this._teamImmutableCache[team.$id] = await this.isTeamImmutable(team.$id);
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Load deleted template teams (if defaults module is loaded)
    	                    if (window.InduxAppwriteAuthTeamsDefaults && this.getDeletedTemplateTeams) {
    	                        this.deletedTemplateTeams = await this.getDeletedTemplateTeams();
    	                    }
    	                    
    	                    // Clean up duplicate default teams (permanent/template) if any exist
    	                    if (window.InduxAppwriteAuthTeamsDefaults && this.cleanupDuplicateDefaultTeams) {
    	                        const cleanupResult = await this.cleanupDuplicateDefaultTeams();
    	                        if (cleanupResult.cleaned > 0) {
    	                            if (cleanupResult.errors && cleanupResult.errors.length > 0) {
    	                                console.warn('[Indux Appwrite Auth] Some duplicate teams could not be deleted:', cleanupResult.errors);
    	                            }
    	                            // Refresh teams list after cleanup
    	                            if (this.listTeams) {
    	                                await this.listTeams();
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Load deleted template roles for current team (if roles defaults module is loaded)
    	                    if (this.currentTeam && this.currentTeam.$id && window.InduxAppwriteAuthTeamsRolesDefaults && this.getDeletedTemplateRoles) {
    	                        this.deletedTemplateRoles = await this.getDeletedTemplateRoles(this.currentTeam.$id);
    	                    }
    	                    
    	                    // Set currentTeam to first default team if available and not already set
    	                    if (!this.currentTeam && this.teams.length > 0) {
    	                        const appwriteConfig = await config.getAppwriteConfig();
    	                        const hasDefaultTeams = (appwriteConfig?.permanentTeams && Array.isArray(appwriteConfig.permanentTeams) && appwriteConfig.permanentTeams.length > 0) ||
    	                                               (appwriteConfig?.templateTeams && Array.isArray(appwriteConfig.templateTeams) && appwriteConfig.templateTeams.length > 0);
    	                        
    	                        if (hasDefaultTeams && window.InduxAppwriteAuthTeamsDefaults && this.getDefaultTeams) {
    	                            const defaultTeams = await this.getDefaultTeams();
    	                            if (defaultTeams.length > 0) {
    	                                this.currentTeam = defaultTeams[0];
    	                            } else {
    	                                this.currentTeam = this.teams[0];
    	                            }
    	                        } else {
    	                            this.currentTeam = this.teams[0];
    	                        }
    	                    }
    	                    
    	                    // Auto-load memberships for current team (if members module is loaded)
    	                    if (this.currentTeam && this.currentTeam.$id && window.InduxAppwriteAuthTeamsMembers && this.listMemberships) {
    	                        try {
    	                            const membershipsResult = await this.listMemberships(this.currentTeam.$id);
    	                            if (membershipsResult.success) {
    	                                this.currentTeamMemberships = membershipsResult.memberships || [];
    	                            }
    	                        } catch (error) {
    	                            // Silently handle errors (e.g., team was deleted)
    	                            // listMemberships already handles "team not found" gracefully
    	                            this.currentTeamMemberships = [];
    	                        }
    	                    }
    	                    
    	                    // Start teams realtime subscription if available (only if not already subscribed)
    	                    // Also skip if we're in the middle of a realtime-triggered refresh
    	                    // Check for any truthy value (function, object, or true flag)
    	                    if (!this._teamsRealtimeUnsubscribe && !this._teamsRealtimeSubscribing) {
    	                        const appwriteConfig = await config.getAppwriteConfig();
    	                        if (this._appwrite?.realtime && this.startTeamsRealtime) {
    	                            this.startTeamsRealtime();
    	                        } else if (appwriteConfig?.teamsPollInterval && typeof appwriteConfig.teamsPollInterval === 'number' && appwriteConfig.teamsPollInterval > 0) {
    	                            // Fallback to polling if realtime not available
    	                            console.warn('[Indux Appwrite Auth] Realtime not available, falling back to polling');
    	                            if (this.startTeamsPolling) {
    	                                this.startTeamsPolling(appwriteConfig.teamsPollInterval);
    	                            }
    	                        }
    	                    }
    	                    
    	                    return { success: true, teams: result.teams || [], total: result.total || 0 };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                }
    	            };

    	            // Get team by ID
    	            store.getTeam = async function(teamId) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to get team details' };
    	                }

    	                try {
    	                    const result = await this._appwrite.teams.get({
    	                        teamId: teamId
    	                    });

    	                    return { success: true, team: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                }
    	            };

    	            // Update team name
    	            store.updateTeamName = async function(teamId, name) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to update team name' };
    	                }

    	                if (!teamId) {
    	                    return { success: false, error: 'Team ID is required' };
    	                }

    	                if (!name || !name.trim()) {
    	                    return { success: false, error: 'Team name is required' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    const result = await this._appwrite.teams.updateName(teamId, name.trim());
    	                    
    	                    // Use the result directly (it has the updated name from Appwrite)
    	                    const updatedTeam = result;

    	                    // Refresh teams list (this will update the teams array)
    	                    await this.listTeams();
    	                    
    	                    // Update currentTeam reference if it was the updated team
    	                    // Reassign the entire object to trigger Alpine reactivity
    	                    if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                        // Use the result from Appwrite, or find it from the refreshed teams list
    	                        const refreshedTeam = this.teams?.find(t => t.$id === teamId) || updatedTeam;
    	                        
    	                        if (refreshedTeam) {
    	                            // Force Alpine reactivity by creating a new object reference
    	                            // Alpine needs to see a new reference to trigger updates
    	                            this.currentTeam = { ...refreshedTeam };
    	                            
    	                            // Also update the teams array reference in case it's being watched
    	                            const teamIndex = this.teams?.findIndex(t => t.$id === teamId);
    	                            if (teamIndex !== undefined && teamIndex >= 0 && this.teams) {
    	                                // Create new array to trigger reactivity
    	                                this.teams = [
    	                                    ...this.teams.slice(0, teamIndex),
    	                                    { ...refreshedTeam },
    	                                    ...this.teams.slice(teamIndex + 1)
    	                                ];
    	                            }
    	                            
    	                            // Use Alpine's nextTick if available to ensure reactivity is triggered
    	                            if (typeof Alpine !== 'undefined' && Alpine.nextTick) {
    	                                Alpine.nextTick(() => {
    	                                    // Ensure the update is visible
    	                                    this.currentTeam = refreshedTeam;
    	                                });
    	                            }
    	                        }
    	                    }

    	                    return { success: true, team: updatedTeam };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Delete team
    	            store.deleteTeam = async function(teamId) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to delete a team' };
    	                }

    	                // Check if team is immutable
    	                if (this.isTeamImmutable) {
    	                    const isImmutable = await this.isTeamImmutable(teamId);
    	                    if (isImmutable) {
    	                        return { success: false, error: 'This team cannot be deleted' };
    	                    }
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Get team name before deletion (for tracking)
    	                    const team = this.teams?.find(t => t.$id === teamId);
    	                    const teamName = team?.name;
    	                    
    	                    await this._appwrite.teams.delete({
    	                        teamId: teamId
    	                    });

    	                    // Track deleted template team (don't recreate it, but allow reapplying)
    	                    if (teamName && window.InduxAppwriteAuthTeamsDefaults) {
    	                        const config = await window.InduxAppwriteAuthConfig.getAppwriteConfig();
    	                        if (config?.templateTeams && Array.isArray(config.templateTeams)) {
    	                            const resolvePersonalTeamName = window.InduxAppwriteAuthTeamsDefaults.resolvePersonalTeamName;
    	                            // Check if this was a template team
    	                            for (const nameConfig of config.templateTeams) {
    	                                const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                                if (resolvedName === teamName) {
    	                                    // Store deletion in localStorage (keyed by user ID)
    	                                    try {
    	                                        const userId = this.user?.$id;
    	                                        if (userId) {
    	                                            const key = `indux:deleted-teams:${userId}`;
    	                                            const deleted = JSON.parse(localStorage.getItem(key) || '[]');
    	                                            if (!deleted.includes(teamName)) {
    	                                                deleted.push(teamName);
    	                                                localStorage.setItem(key, JSON.stringify(deleted));
    	                                            }
    	                                        }
    	                                    } catch (e) {
    	                                        console.warn('[Indux Appwrite Auth] Failed to track deleted team:', e);
    	                                    }
    	                                    break;
    	                                }
    	                            }
    	                        }
    	                    }

    	                    // Clear current team if it was deleted (before refreshing list to avoid loading memberships for deleted team)
    	                    if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                        this.currentTeam = null;
    	                        this.currentTeamMemberships = [];
    	                    }

    	                    // Refresh teams list
    	                    await this.listTeams();

    	                    return { success: true };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Get team preferences
    	            store.getTeamPrefs = async function(teamId) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to get team preferences' };
    	                }

    	                try {
    	                    const result = await this._appwrite.teams.getPrefs({
    	                        teamId: teamId
    	                    });

    	                    return { success: true, prefs: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                }
    	            };

    	            // Start realtime subscription for all auth entities (teams, memberships, account, roles/permissions)
    	            store.startTeamsRealtime = function() {
    	                // Don't subscribe if already subscribed (check for function, object, array, or true flag)
    	                if (this._teamsRealtimeUnsubscribe) {
    	                    return;
    	                }
    	                
    	                // Only subscribe if authenticated and realtime is available
    	                if (!this.isAuthenticated || !this._appwrite?.realtime) {
    	                    return;
    	                }
    	                
    	                try {
    	                    // Subscribe to teams channel (covers: team create/update/delete, team preferences/roles)
    	                    const teamsSubscription = this._appwrite.realtime.subscribe('teams', (response) => {
    	                        // Prevent recursive subscription (don't subscribe again when refreshing)
    	                        if (this._teamsRealtimeSubscribing) {
    	                            return;
    	                        }
    	                        
    	                        // Handle different event types
    	                        if (response.events && Array.isArray(response.events)) {
    	                            let shouldRefreshTeams = false;
    	                            
    	                            for (const event of response.events) {
    	                                // Event format can be: "teams.update", "teams.create", "teams.delete", 
    	                                // "teams.{teamId}", "teams *", etc.
    	                                const parts = event.split(/[.\s]+/);
    	                                const eventType = parts[0]; // 'teams', etc.
    	                                const action = parts[1]; // 'update', 'create', 'delete', or teamId
    	                                
    	                                if (eventType === 'teams') {
    	                                    // Check if it's an action (update, create, delete) or a team-specific event
    	                                    // Note: team preferences (roles/permissions) updates trigger teams.update
    	                                    if (action === 'update' || action === 'create' || action === 'delete' || action === '*') {
    	                                        shouldRefreshTeams = true;
    	                                    } else if (action && action.length > 10) {
    	                                        // Likely a teamId (Appwrite IDs are long), treat as update
    	                                        shouldRefreshTeams = true;
    	                                    }
    	                                }
    	                            }
    	                            
    	                            // Refresh teams list if needed (only once per event batch)
    	                            // This also refreshes roles/permissions since they're stored in team preferences
    	                            if (shouldRefreshTeams && !this._teamsRealtimeSubscribing) {
    	                                this._teamsRealtimeSubscribing = true;
    	                                if (this.listTeams) {
    	                                    this.listTeams().finally(() => {
    	                                        this._teamsRealtimeSubscribing = false;
    	                                    });
    	                                } else {
    	                                    this._teamsRealtimeSubscribing = false;
    	                                }
    	                            }
    	                        }
    	                    });
    	                    
    	                    // Subscribe to memberships channel (covers: invite, accept, update roles, delete)
    	                    // Also subscribe to team-specific membership channels for better reactivity
    	                    const membershipsSubscription = this._appwrite.realtime.subscribe('memberships', (response) => {
    	                        // Prevent recursive subscription
    	                        if (this._teamsRealtimeSubscribing) {
    	                            return;
    	                        }
    	                        
    	                        if (response.events && Array.isArray(response.events)) {
    	                            let shouldRefreshMemberships = false;
    	                            let affectedTeamId = null;
    	                            
    	                            // First, check payload for teamId (most reliable source)
    	                            if (response.payload) {
    	                                // Check various possible payload structures
    	                                if (response.payload.teamId) {
    	                                    affectedTeamId = response.payload.teamId;
    	                                } else if (response.payload.team && response.payload.team.$id) {
    	                                    affectedTeamId = response.payload.team.$id;
    	                                } else if (response.payload.membership && response.payload.membership.teamId) {
    	                                    affectedTeamId = response.payload.membership.teamId;
    	                                }
    	                            }
    	                            
    	                            for (const event of response.events) {
    	                                // Handle different event formats:
    	                                // - "memberships.update" (legacy format)
    	                                // - "memberships.delete" (legacy format)
    	                                // - "teams.{teamId}.memberships.{membershipId}.delete" (current format)
    	                                // - "teams.*.memberships.*.delete" (wildcard format)
    	                                // - "teams.{teamId}.memberships.*" (team-specific wildcard)
    	                                const parts = event.split(/[.\s]+/);
    	                                const eventType = parts[0]; // 'teams' or 'memberships'
    	                                
    	                                // Check for both legacy format (memberships.*) and current format (teams.*.memberships.*)
    	                                if (eventType === 'memberships') {
    	                                    // Legacy format: "memberships.update", "memberships.delete", etc.
    	                                    const action = parts[1];
    	                                    
    	                                    // Check if second part is a teamId (long alphanumeric string)
    	                                    const possibleTeamId = parts[1];
    	                                    if (possibleTeamId && possibleTeamId.length > 10 && /^[a-f0-9]+$/i.test(possibleTeamId)) {
    	                                        // This is a team-specific event
    	                                        if (!affectedTeamId) {
    	                                            affectedTeamId = possibleTeamId;
    	                                        }
    	                                        const actionFromTeamId = parts[2];
    	                                        if (actionFromTeamId === 'create' || actionFromTeamId === 'update' || actionFromTeamId === 'delete' || actionFromTeamId === '*' || !actionFromTeamId) {
    	                                            shouldRefreshMemberships = true;
    	                                        }
    	                                    } else if (action === 'create' || action === 'update' || action === 'delete' || action === '*') {
    	                                        // Global membership event
    	                                        shouldRefreshMemberships = true;
    	                                    }
    	                                } else if (eventType === 'teams' && parts.length >= 3 && parts[2] === 'memberships') {
    	                                    // Current format: "teams.{teamId}.memberships.{membershipId}.delete"
    	                                    // or "teams.*.memberships.*.delete"
    	                                    const teamIdPart = parts[1]; // teamId or '*'
    	                                    const membershipIdPart = parts[3]; // membershipId or '*'
    	                                    const action = parts[4]; // 'create', 'update', 'delete', or undefined
    	                                    
    	                                    // Extract teamId if it's not a wildcard
    	                                    if (teamIdPart && teamIdPart !== '*' && teamIdPart.length > 10 && /^[a-f0-9]+$/i.test(teamIdPart)) {
    	                                        if (!affectedTeamId) {
    	                                            affectedTeamId = teamIdPart;
    	                                        }
    	                                    }
    	                                    
    	                                    // Check if this is a create, update, or delete action
    	                                    if (action === 'create' || action === 'update' || action === 'delete' || action === '*' || !action) {
    	                                        shouldRefreshMemberships = true;
    	                                    }
    	                                }
    	                            }
    	                            
    	                            // Refresh memberships for current team if viewing one
    	                            // This ensures the UI updates immediately when a member is updated/deleted
    	                            if (shouldRefreshMemberships) {
    	                                // If we know which team was affected, only refresh if it's the current team
    	                                // Otherwise, refresh for current team if viewing one
    	                                const shouldRefreshCurrentTeam = !affectedTeamId || 
    	                                    (this.currentTeam && this.currentTeam.$id === affectedTeamId);
    	                                
    	                                if (shouldRefreshCurrentTeam && this.currentTeam && this.currentTeam.$id && this.listMemberships) {
    	                                    // Use async/await to ensure memberships are refreshed
    	                                    this.listMemberships(this.currentTeam.$id).then((result) => {
    	                                        // Force reactivity by ensuring new array reference
    	                                        if (this.currentTeamMemberships) {
    	                                            this.currentTeamMemberships = [...this.currentTeamMemberships];
    	                                        }
    	                                    }).catch(err => {
    	                                        // Failed to refresh memberships after realtime event
    	                                    });
    	                                }
    	                                
    	                                // Also refresh teams list (membership changes affect team member counts)
    	                                if (!this._teamsRealtimeSubscribing) {
    	                                    this._teamsRealtimeSubscribing = true;
    	                                    if (this.listTeams) {
    	                                        this.listTeams().finally(() => {
    	                                            this._teamsRealtimeSubscribing = false;
    	                                        });
    	                                    } else {
    	                                        this._teamsRealtimeSubscribing = false;
    	                                    }
    	                                }
    	                            }
    	                        }
    	                    });
    	                    
    	                    // Subscribe to account channel (covers: user profile updates, account status changes)
    	                    const accountSubscription = this._appwrite.realtime.subscribe('account', (response) => {
    	                        if (response.events && Array.isArray(response.events)) {
    	                            let shouldRefreshUser = false;
    	                            
    	                            for (const event of response.events) {
    	                                const parts = event.split(/[.\s]+/);
    	                                const eventType = parts[0]; // 'account'
    	                                const action = parts[1]; // 'update', 'delete', etc.
    	                                
    	                                if (eventType === 'account') {
    	                                    if (action === 'update' || action === 'delete' || action === '*') {
    	                                        shouldRefreshUser = true;
    	                                    }
    	                                }
    	                            }
    	                            
    	                            // Refresh user data if account was updated
    	                            if (shouldRefreshUser && this.getAccount) {
    	                                this.getAccount();
    	                            }
    	                        }
    	                    });
    	                    
    	                    // Store unsubscribe functions/objects
    	                    const subscriptions = [teamsSubscription, membershipsSubscription, accountSubscription];
    	                    const unsubscribeFunctions = [];
    	                    
    	                    for (const sub of subscriptions) {
    	                        if (typeof sub === 'function') {
    	                            unsubscribeFunctions.push(sub);
    	                        } else if (sub && typeof sub.unsubscribe === 'function') {
    	                            unsubscribeFunctions.push(() => sub.unsubscribe());
    	                        } else if (sub) {
    	                            unsubscribeFunctions.push(sub);
    	                        }
    	                    }
    	                    
    	                    // Store as array if multiple, or single value if only one
    	                    if (unsubscribeFunctions.length > 1) {
    	                        this._teamsRealtimeUnsubscribe = unsubscribeFunctions;
    	                    } else if (unsubscribeFunctions.length === 1) {
    	                        this._teamsRealtimeUnsubscribe = unsubscribeFunctions[0];
    	                    } else {
    	                        this._teamsRealtimeUnsubscribe = true; // Mark as subscribed
    	                    }
    	                } catch (error) {
    	                    // Failed to start realtime subscriptions
    	                }
    	            };
    	            
    	            // Stop realtime subscriptions
    	            store.stopTeamsRealtime = function() {
    	                if (!this._teamsRealtimeUnsubscribe) {
    	                    return;
    	                }
    	                
    	                try {
    	                    // Handle array of unsubscribe functions (multiple channels)
    	                    if (Array.isArray(this._teamsRealtimeUnsubscribe)) {
    	                        for (const unsubscribe of this._teamsRealtimeUnsubscribe) {
    	                            if (typeof unsubscribe === 'function') {
    	                                unsubscribe();
    	                            } else if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
    	                                unsubscribe.unsubscribe();
    	                            }
    	                        }
    	                    } else if (typeof this._teamsRealtimeUnsubscribe === 'function') {
    	                        // Direct unsubscribe function
    	                        this._teamsRealtimeUnsubscribe();
    	                    } else if (this._teamsRealtimeUnsubscribe === true) {
    	                        // Subscription active but no unsubscribe method available
    	                    } else {
    	                        // Subscription object - try to call unsubscribe if it exists
    	                        if (typeof this._teamsRealtimeUnsubscribe.unsubscribe === 'function') {
    	                            this._teamsRealtimeUnsubscribe.unsubscribe();
    	                        }
    	                    }
    	                } catch (error) {
    	                    console.warn('[Indux Appwrite Auth] Error stopping realtime subscriptions:', error);
    	                } finally {
    	                    this._teamsRealtimeUnsubscribe = null;
    	                }
    	            };
    	            
    	            // Start polling teams for updates (optional, configured via teamsPollInterval) - DEPRECATED: Use realtime instead
    	            store.startTeamsPolling = function(intervalMs) {
    	                // Clear existing interval if any
    	                if (this._teamsPollInterval) {
    	                    clearInterval(this._teamsPollInterval);
    	                }
    	                
    	                // Only poll if authenticated
    	                if (!this.isAuthenticated) {
    	                    return;
    	                }
    	                
    	                this._teamsPollInterval = setInterval(async () => {
    	                    if (this.isAuthenticated && this.listTeams) {
    	                        try {
    	                            await this.listTeams();
    	                        } catch (error) {
    	                            console.warn('[Indux Appwrite Auth] Teams polling error:', error);
    	                        }
    	                    } else {
    	                        // Stop polling if user logs out
    	                        if (this.stopTeamsPolling) {
    	                            this.stopTeamsPolling();
    	                        }
    	                    }
    	                }, intervalMs);
    	            };
    	            
    	            // Stop polling teams
    	            store.stopTeamsPolling = function() {
    	                if (this._teamsPollInterval) {
    	                    clearInterval(this._teamsPollInterval);
    	                    this._teamsPollInterval = null;
    	                }
    	            };
    	            
    	            // Update team preferences
    	            store.updateTeamPrefs = async function(teamId, prefs) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to update team preferences' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    const result = await this._appwrite.teams.updatePrefs({
    	                        teamId: teamId,
    	                        prefs: prefs
    	                    });

    	                    return { success: true, prefs: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeTeamsCore();
    	    } catch (error) {
    	        // Failed to initialize teams core
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsCore();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export core teams interface
    	window.InduxAppwriteAuthTeamsCore = {
    	    initialize: initializeTeamsCore
    	};



    	/* Auth teams - Default teams (permanent and template) */

    	// Helper function to resolve personal team name (handles static strings and $x paths)
    	async function resolvePersonalTeamName(nameConfig) {
    	    if (!nameConfig || typeof nameConfig !== 'string') {
    	        return null;
    	    }
    	    
    	    // If it starts with $x., resolve via Indux data source
    	    if (nameConfig.startsWith('$x.')) {
    	        try {
    	            // Remove '$x.' prefix and resolve path
    	            const path = nameConfig.substring(3);
    	            
    	            // Use Alpine's $x magic method if available
    	            if (typeof Alpine !== 'undefined' && Alpine.magic && Alpine.magic('x')) {
    	                const $x = Alpine.magic('x');
    	                // Split path and navigate through $x proxy
    	                const parts = path.split('.');
    	                let value = $x;
    	                for (const part of parts) {
    	                    if (value && typeof value === 'object' && part in value) {
    	                        value = value[part];
    	                        // If value is a Promise, wait for it
    	                        if (value && typeof value.then === 'function') {
    	                            value = await value;
    	                        }
    	                    } else {
    	                        // Data source may not be loaded yet - silently return null
    	                        return null;
    	                    }
    	                }
    	                return value || null;
    	            } else {
    	                // Fallback: try data store directly
    	                const dataStore = Alpine.store('data');
    	                if (dataStore) {
    	                    const parts = path.split('.');
    	                    let value = dataStore;
    	                    for (const part of parts) {
    	                        if (value && typeof value === 'object' && part in value) {
    	                            value = value[part];
    	                        } else {
    	                            return null;
    	                        }
    	                    }
    	                    return value || null;
    	                }
    	            }
    	        } catch (error) {
    	            // Data source may not be loaded yet - silently return null
    	            return null;
    	        }
    	    }
    	    
    	    // Otherwise, treat as static string
    	    return nameConfig;
    	}

    	// Add default teams methods to auth store
    	function initializeTeamsDefaults() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.isTeamImmutable) {
    	            // Check if a team is immutable (cannot be deleted)
    	            store.isTeamImmutable = async function(teamId) {
    	                const team = this.teams?.find(t => t.$id === teamId);
    	                if (!team) return false;
    	                
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig?.permanentTeams || !Array.isArray(appwriteConfig.permanentTeams)) {
    	                    return false;
    	                }
    	                
    	                // Check if this team matches any permanent team
    	                for (const nameConfig of appwriteConfig.permanentTeams) {
    	                    const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                    if (resolvedName === team.name) {
    	                        return true; // Immutable
    	                    }
    	                }
    	                return false;
    	            };
    	            
    	            // Get deleted template teams (teams that can be reapplied)
    	            store.getDeletedTemplateTeams = async function() {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig?.templateTeams || !Array.isArray(appwriteConfig.templateTeams)) {
    	                    return [];
    	                }
    	                
    	                // Get list of deleted template teams for this user
    	                let deletedTeams = [];
    	                try {
    	                    const userId = this.user?.$id;
    	                    if (userId) {
    	                        const key = `indux:deleted-teams:${userId}`;
    	                        deletedTeams = JSON.parse(localStorage.getItem(key) || '[]');
    	                    }
    	                } catch (e) {
    	                    return [];
    	                }
    	                
    	                // Resolve all template team names and filter to only deleted ones
    	                const deletedTemplateTeams = [];
    	                for (const nameConfig of appwriteConfig.templateTeams) {
    	                    const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                    if (resolvedName && deletedTeams.includes(resolvedName)) {
    	                        deletedTemplateTeams.push(resolvedName);
    	                    }
    	                }
    	                
    	                return deletedTemplateTeams;
    	            };
    	            
    	            // Track deleted template team (internal helper)
    	            store.trackDeletedTemplateTeam = async function(teamName) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (appwriteConfig?.templateTeams && Array.isArray(appwriteConfig.templateTeams)) {
    	                    // Check if this was a template team
    	                    for (const nameConfig of appwriteConfig.templateTeams) {
    	                        const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                        if (resolvedName === teamName) {
    	                            // Store deletion in localStorage (keyed by user ID)
    	                            try {
    	                                const userId = this.user?.$id;
    	                                if (userId) {
    	                                    const key = `indux:deleted-teams:${userId}`;
    	                                    const deleted = JSON.parse(localStorage.getItem(key) || '[]');
    	                                    if (!deleted.includes(teamName)) {
    	                                        deleted.push(teamName);
    	                                        localStorage.setItem(key, JSON.stringify(deleted));
    	                                    }
    	                                }
    	                            } catch (e) {
    	                                console.warn('[Indux Appwrite Auth] Failed to track deleted team:', e);
    	                            }
    	                            break;
    	                        }
    	                    }
    	                }
    	            };
    	            
    	            // Get default teams (teams matching configured default team names - both permanent and template)
    	            store.getDefaultTeams = async function() {
    	                if (!this.teams || this.teams.length === 0) {
    	                    return [];
    	                }
    	                
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const allDefaultTeamNames = [];
    	                
    	                // Resolve permanent teams
    	                if (appwriteConfig?.permanentTeams && Array.isArray(appwriteConfig.permanentTeams)) {
    	                    for (const nameConfig of appwriteConfig.permanentTeams) {
    	                        const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                        if (resolvedName) {
    	                            allDefaultTeamNames.push(resolvedName);
    	                        }
    	                    }
    	                }
    	                
    	                // Resolve template teams
    	                if (appwriteConfig?.templateTeams && Array.isArray(appwriteConfig.templateTeams)) {
    	                    for (const nameConfig of appwriteConfig.templateTeams) {
    	                        const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                        if (resolvedName) {
    	                            allDefaultTeamNames.push(resolvedName);
    	                        }
    	                    }
    	                }
    	                
    	                // Find teams matching default team names
    	                const defaultTeams = this.teams.filter(team => allDefaultTeamNames.includes(team.name));
    	                return defaultTeams;
    	            };
    	            
    	            // Clean up duplicate permanent/template teams (keeps the oldest one, deletes the rest)
    	            // This bypasses the immutable check for duplicates only
    	            store.cleanupDuplicateDefaultTeams = async function() {
    	                if (!this.teams || this.teams.length === 0) {
    	                    return { success: true, cleaned: 0 };
    	                }
    	                
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig) {
    	                    return { success: false, error: 'Appwrite config not available' };
    	                }
    	                
    	                const allDefaultTeamNames = [];
    	                
    	                // Resolve permanent teams
    	                if (appwriteConfig?.permanentTeams && Array.isArray(appwriteConfig.permanentTeams)) {
    	                    for (const nameConfig of appwriteConfig.permanentTeams) {
    	                        const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                        if (resolvedName) {
    	                            allDefaultTeamNames.push(resolvedName);
    	                        }
    	                    }
    	                }
    	                
    	                // Resolve template teams
    	                if (appwriteConfig?.templateTeams && Array.isArray(appwriteConfig.templateTeams)) {
    	                    for (const nameConfig of appwriteConfig.templateTeams) {
    	                        const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                        if (resolvedName) {
    	                            allDefaultTeamNames.push(resolvedName);
    	                        }
    	                    }
    	                }
    	                
    	                let cleanedCount = 0;
    	                const errors = [];
    	                
    	                // For each default team name, find duplicates and delete all but the oldest
    	                for (const teamName of allDefaultTeamNames) {
    	                    const matchingTeams = this.teams.filter(team => team.name === teamName);
    	                    
    	                    if (matchingTeams.length > 1) {
    	                        // Sort by creation date (oldest first) and keep the first one
    	                        const sortedTeams = matchingTeams.sort((a, b) => {
    	                            const dateA = new Date(a.$createdAt || 0);
    	                            const dateB = new Date(b.$createdAt || 0);
    	                            return dateA - dateB;
    	                        });
    	                        
    	                        sortedTeams[0];
    	                        const teamsToDelete = sortedTeams.slice(1);
    	                        
    	                        // Delete all duplicates (bypass immutable check for duplicates)
    	                        for (const team of teamsToDelete) {
    	                            try {
    	                                if (!this._appwrite) {
    	                                    this._appwrite = await config.getAppwriteClient();
    	                                }
    	                                if (this._appwrite && this._appwrite.teams) {
    	                                    // Directly delete via Appwrite API (bypassing our deleteTeam method which checks immutable)
    	                                    await this._appwrite.teams.delete({ teamId: team.$id });
    	                                    cleanedCount++;
    	                                }
    	                            } catch (error) {
    	                                const errorMsg = `Error deleting duplicate team ${team.$id}: ${error.message}`;
    	                                errors.push(errorMsg);
    	                            }
    	                        }
    	                    }
    	                }
    	                
    	                // Refresh teams list after cleanup
    	                if (cleanedCount > 0 && this.listTeams) {
    	                    await this.listTeams();
    	                }
    	                
    	                return {
    	                    success: errors.length === 0,
    	                    cleaned: cleanedCount,
    	                    errors: errors.length > 0 ? errors : undefined
    	                };
    	            };
    	            
    	            // Get personal team (first default team, or first team as fallback)
    	            // Kept for backwards compatibility
    	            store.getPersonalTeam = async function() {
    	                const defaultTeams = await this.getDefaultTeams();
    	                if (defaultTeams.length > 0) {
    	                    return defaultTeams[0];
    	                }
    	                // Fallback to first team if no default teams
    	                return this.teams && this.teams.length > 0 ? this.teams[0] : null;
    	            };
    	            
    	            // Reapply a template team (create it if it was previously deleted)
    	            store.reapplyTemplateTeam = async function(teamName) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to reapply a template team' };
    	                }

    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig?.templateTeams || !Array.isArray(appwriteConfig.templateTeams)) {
    	                    return { success: false, error: 'Template teams are not configured' };
    	                }

    	                // Verify this is a valid template team name
    	                let isTemplateTeam = false;
    	                for (const nameConfig of appwriteConfig.templateTeams) {
    	                    const resolvedName = await resolvePersonalTeamName(nameConfig);
    	                    if (resolvedName === teamName) {
    	                        isTemplateTeam = true;
    	                        break;
    	                    }
    	                }

    	                if (!isTemplateTeam) {
    	                    return { success: false, error: 'This is not a valid template team' };
    	                }

    	                // Check if team already exists
    	                if (this.teams && this.teams.some(team => team.name === teamName)) {
    	                    return { success: false, error: 'This team already exists' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Create the template team (pass empty array to use creatorRole logic)
    	                    const result = await this.createTeam(null, teamName, []);
    	                    
    	                    if (result.success) {
    	                        // Remove from deleted teams list
    	                        try {
    	                            const userId = this.user?.$id;
    	                            if (userId) {
    	                                const key = `indux:deleted-teams:${userId}`;
    	                                const deleted = JSON.parse(localStorage.getItem(key) || '[]');
    	                                const updated = deleted.filter(name => name !== teamName);
    	                                localStorage.setItem(key, JSON.stringify(updated));
    	                            }
    	                        } catch (e) {
    	                            console.warn('[Indux Appwrite Auth] Failed to update deleted teams list:', e);
    	                        }
    	                        
    	                        // Refresh teams list (this will also update deletedTemplateTeams)
    	                        if (this.listTeams) {
    	                            await this.listTeams();
    	                        }
    	                        
    	                        // Update deletedTemplateTeams property
    	                        if (this.getDeletedTemplateTeams) {
    	                            this.deletedTemplateTeams = await this.getDeletedTemplateTeams();
    	                        }
    	                        
    	                        return { success: true, team: result.team };
    	                    } else {
    	                        return { success: false, error: result.error };
    	                    }
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Auto-create default teams if enabled - mandatory for all users
    	async function ensureDefaultTeams(store) {
    	    const appwriteConfig = await window.InduxAppwriteAuthConfig.getAppwriteConfig();
    	    
    	    // Check if default teams are enabled
    	    const hasPermanent = appwriteConfig?.permanentTeams && Array.isArray(appwriteConfig.permanentTeams) && appwriteConfig.permanentTeams.length > 0;
    	    const hasTemplate = appwriteConfig?.templateTeams && Array.isArray(appwriteConfig.templateTeams) && appwriteConfig.templateTeams.length > 0;
    	    
    	    if ((!hasPermanent && !hasTemplate) || !appwriteConfig?.teams) {
    	        return { success: true, created: false, teams: [] };
    	    }
    	    
    	    // Ensure teams list is loaded
    	    if (!store.teams || store.teams.length === 0) {
    	        if (store.listTeams) {
    	            await store.listTeams();
    	        }
    	    }
    	    
    	    const createdTeams = [];
    	    const existingTeams = [];
    	    
    	    // Get list of deleted template teams for this user (don't recreate them)
    	    let deletedTeams = [];
    	    try {
    	        const userId = store.user?.$id;
    	        if (userId) {
    	            const key = `indux:deleted-teams:${userId}`;
    	            deletedTeams = JSON.parse(localStorage.getItem(key) || '[]');
    	        }
    	    } catch (e) {
    	        console.warn('[Indux Appwrite Auth] Failed to load deleted teams list:', e);
    	    }
    	    
    	    // Process permanent teams (always create if missing)
    	    if (hasPermanent) {
    	        for (const nameConfig of appwriteConfig.permanentTeams) {
    	            // Resolve team name (static or $x path)
    	            const teamName = await resolvePersonalTeamName(nameConfig);
    	            if (!teamName) {
    	                // Data source may not be loaded yet - skip for now, will retry on next load
    	                continue;
    	            }
    	            
    	            // Check if user already has this permanent team (by name matching)
    	            // Find ALL teams with this name to detect duplicates
    	            const matchingTeams = store.teams?.filter(team => team.name === teamName) || [];
    	            if (matchingTeams.length > 0) {
    	                // If there are duplicates, log a warning and use the first one
    	                if (matchingTeams.length > 1) {
    	                    console.warn(`[Indux Appwrite Auth] Found ${matchingTeams.length} duplicate permanent teams with name "${teamName}". Using the first one.`);
    	                    console.warn('[Indux Appwrite Auth] Duplicate team IDs:', matchingTeams.map(t => t.$id));
    	                }
    	                existingTeams.push(matchingTeams[0]);
    	                continue;
    	            }
    	            
    	            // Permanent team doesn't exist - create it (mandatory for all users)
    	            try {
    	                // Pass empty array to use creatorRole logic from config
    	                const result = await store.createTeam(null, teamName, []);
    	                
    	                if (result.success) {
    	                    createdTeams.push(result.team);
    	                }
    	            } catch (error) {
    	                // Error creating permanent team
    	            }
    	        }
    	    }
    	    
    	    // Process template teams (only create if not deleted)
    	    if (hasTemplate) {
    	        for (const nameConfig of appwriteConfig.templateTeams) {
    	            // Resolve team name (static or $x path)
    	            const teamName = await resolvePersonalTeamName(nameConfig);
    	            if (!teamName) {
    	                // Data source may not be loaded yet - skip for now, will retry on next load
    	                continue;
    	            }
    	            
    	            // Skip if this template team was previously deleted by the user
    	            if (deletedTeams.includes(teamName)) {
    	                continue;
    	            }
    	            
    	            // Check if user already has this template team (by name matching)
    	            // Find ALL teams with this name to detect duplicates
    	            const matchingTeams = store.teams?.filter(team => team.name === teamName) || [];
    	            if (matchingTeams.length > 0) {
    	                // If there are duplicates, log a warning and use the first one
    	                if (matchingTeams.length > 1) {
    	                    console.warn(`[Indux Appwrite Auth] Found ${matchingTeams.length} duplicate template teams with name "${teamName}". Using the first one.`);
    	                    console.warn('[Indux Appwrite Auth] Duplicate team IDs:', matchingTeams.map(t => t.$id));
    	                }
    	                existingTeams.push(matchingTeams[0]);
    	                continue;
    	            }
    	            
    	            // Template team doesn't exist - create it (mandatory for all users)
    	            try {
    	                // Pass empty array to use creatorRole logic from config
    	                const result = await store.createTeam(null, teamName, []);
    	                
    	                if (result.success) {
    	                    createdTeams.push(result.team);
    	                }
    	            } catch (error) {
    	                // Error creating template team
    	            }
    	        }
    	    }
    	    
    	    // Set currentTeam to first default team if not already set
    	    if (!store.currentTeam) {
    	        const allDefaultTeams = [...existingTeams, ...createdTeams];
    	        if (allDefaultTeams.length > 0) {
    	            store.currentTeam = allDefaultTeams[0];
    	        }
    	    }
    	    
    	    return {
    	        success: true,
    	        created: createdTeams.length > 0,
    	        teams: [...existingTeams, ...createdTeams],
    	        createdCount: createdTeams.length
    	    };
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeTeamsDefaults();
    	    } catch (error) {
    	        // Failed to initialize teams defaults
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsDefaults();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export defaults interface
    	window.InduxAppwriteAuthTeamsDefaults = {
    	    initialize: initializeTeamsDefaults,
    	    ensureDefaultTeams: ensureDefaultTeams,
    	    resolvePersonalTeamName: resolvePersonalTeamName
    	};



    	/* Auth teams - Default roles (permanent and template) */

    	// Add default roles methods to auth store
    	function initializeTeamsRolesDefaults() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.isRolePermanent) {
    	            // Initialize cache if needed
    	            if (!store._rolePermanentCache) store._rolePermanentCache = {};
    	            
    	            // Check if a role is permanent (cannot be deleted)
    	            store.isRolePermanent = async function(teamId, roleName) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                // permanentRoles is now an object: { "RoleName": ["permission1", ...] }
    	                if (!appwriteConfig?.permanentRoles || typeof appwriteConfig.permanentRoles !== 'object') {
    	                    return false;
    	                }
    	                const isPermanent = roleName in appwriteConfig.permanentRoles;
    	                // Cache the result
    	                if (!this._rolePermanentCache[teamId]) this._rolePermanentCache[teamId] = {};
    	                this._rolePermanentCache[teamId][roleName] = isPermanent;
    	                return isPermanent;
    	            };
    	            
    	            // Synchronous check using cache (for Alpine reactivity)
    	            store.isRolePermanentSync = function(teamId, roleName) {
    	                if (!teamId || !roleName || !this._rolePermanentCache) return false;
    	                return this._rolePermanentCache[teamId]?.[roleName] === true;
    	            };
    	            
    	            // Check if a role is a template role (can be deleted)
    	            store.isRoleTemplate = async function(teamId, roleName) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                // templateRoles is now an object: { "RoleName": ["permission1", ...] }
    	                if (!appwriteConfig?.templateRoles || typeof appwriteConfig.templateRoles !== 'object') {
    	                    return false;
    	                }
    	                return roleName in appwriteConfig.templateRoles;
    	            };
    	            
    	            // Get deleted template roles for a team
    	            // NOTE: Deleted template roles are stored in team preferences (not localStorage) so they're shared across all team members
    	            store.getDeletedTemplateRoles = async function(teamId) {
    	                if (!teamId) {
    	                    return [];
    	                }
    	                
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig?.templateRoles || typeof appwriteConfig.templateRoles !== 'object') {
    	                    return [];
    	                }
    	                
    	                // Get list of deleted template roles from team preferences (shared across all team members)
    	                let deletedRoles = [];
    	                try {
    	                    if (this._appwrite && this._appwrite.teams) {
    	                        const prefs = await this._appwrite.teams.getPrefs({ teamId });
    	                        // Deleted template roles are stored in team preferences under 'deletedTemplateRoles'
    	                        if (prefs && prefs.deletedTemplateRoles && Array.isArray(prefs.deletedTemplateRoles)) {
    	                            deletedRoles = prefs.deletedTemplateRoles;
    	                        }
    	                    }
    	                } catch (e) {
    	                    // If team was deleted (404), silently return empty array (expected behavior)
    	                    if (e.message && e.message.includes('could not be found')) {
    	                        return [];
    	                    }
    	                    // For other errors, fall back to localStorage (for backwards compatibility)
    	                    try {
    	                        const userId = this.user?.$id;
    	                        if (userId) {
    	                            const key = `indux:deleted-roles:${userId}:${teamId}`;
    	                            deletedRoles = JSON.parse(localStorage.getItem(key) || '[]');
    	                        }
    	                    } catch (e2) {
    	                        // Silently ignore localStorage errors
    	                    }
    	                }
    	                
    	                // Filter to only include roles that are actually template roles
    	                const templateRoleNames = Object.keys(appwriteConfig.templateRoles);
    	                return deletedRoles.filter(roleName => templateRoleNames.includes(roleName));
    	            };
    	            
    	            // Reapply a deleted template role
    	            store.reapplyTemplateRole = async function(teamId, roleName) {
    	                if (!teamId || !roleName) {
    	                    return { success: false, error: 'Team ID and role name are required' };
    	                }
    	                
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig?.templateRoles || typeof appwriteConfig.templateRoles !== 'object') {
    	                    return { success: false, error: 'Template roles are not configured' };
    	                }
    	                
    	                const templateRole = appwriteConfig.templateRoles[roleName];
    	                if (!templateRole || !Array.isArray(templateRole)) {
    	                    return { success: false, error: `Template role "${roleName}" does not exist` };
    	                }
    	                
    	                try {
    	                    // Get current team preferences
    	                    const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                    const currentRoles = currentPrefs?.roles ? { ...currentPrefs.roles } : {};
    	                    
    	                    // Check if role already exists
    	                    if (currentRoles[roleName]) {
    	                        return { success: false, error: 'This role already exists' };
    	                    }
    	                    
    	                    // Add the template role
    	                    const updatedRoles = {
    	                        ...currentRoles,
    	                        [roleName]: templateRole
    	                    };
    	                    
    	                    // Remove from deleted list in team preferences (shared across all team members)
    	                    let deletedRoles = [];
    	                    if (currentPrefs && currentPrefs.deletedTemplateRoles && Array.isArray(currentPrefs.deletedTemplateRoles)) {
    	                        deletedRoles = currentPrefs.deletedTemplateRoles.filter(r => r !== roleName);
    	                    }
    	                    
    	                    const updatedPrefs = {
    	                        ...currentPrefs,
    	                        roles: updatedRoles,
    	                        deletedTemplateRoles: deletedRoles // Update deleted list in team preferences
    	                    };
    	                    await this._appwrite.teams.updatePrefs({
    	                        teamId: teamId,
    	                        prefs: updatedPrefs
    	                    });
    	                    
    	                    // Also remove from localStorage for backwards compatibility (if it exists)
    	                    try {
    	                        const userId = this.user?.$id;
    	                        if (userId) {
    	                            const key = `indux:deleted-roles:${userId}:${teamId}`;
    	                            const deleted = JSON.parse(localStorage.getItem(key) || '[]');
    	                            const updated = deleted.filter(name => name !== roleName);
    	                            localStorage.setItem(key, JSON.stringify(updated));
    	                        }
    	                    } catch (e) {
    	                        // Ignore localStorage errors (team preferences is the source of truth)
    	                    }
    	                    
    	                    // Refresh cache for this team
    	                    if (this.getAllRoles) {
    	                        const allRoles = await this.getAllRoles(teamId);
    	                        const rolesCopy = allRoles ? { ...allRoles } : {};
    	                        if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                        this._allRolesCacheByTeam[teamId] = { ...rolesCopy };
    	                        
    	                        // Pre-cache permanent role status
    	                        if (!this._rolePermanentCache) this._rolePermanentCache = {};
    	                        if (!this._rolePermanentCache[teamId]) this._rolePermanentCache[teamId] = {};
    	                        for (const rName of Object.keys(rolesCopy)) {
    	                            if (this.isRolePermanent) {
    	                                await this.isRolePermanent(teamId, rName);
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Refresh permission cache
    	                    if (this.refreshPermissionCache) {
    	                        await this.refreshPermissionCache();
    	                    }
    	                    
    	                    return { success: true };
    	                } catch (error) {
    	                    return { success: false, error: error.message };
    	                }
    	            };
    	            
    	            // Ensure default roles are applied to a team
    	            store.ensureDefaultRoles = async function(teamId) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (!appwriteConfig || !teamId) {
    	                    return { success: false, error: 'Invalid config or team ID' };
    	                }
    	                
    	                // permanentRoles and templateRoles are now objects: { "RoleName": ["permission1", ...] }
    	                const permanentRoles = appwriteConfig.permanentRoles || {};
    	                const templateRoles = appwriteConfig.templateRoles || {};
    	                
    	                // Get list of deleted template roles for this team (don't recreate them)
    	                // Use getDeletedTemplateRoles which reads from team preferences (shared across all team members)
    	                let deletedRoles = [];
    	                if (this.getDeletedTemplateRoles) {
    	                    try {
    	                        deletedRoles = await this.getDeletedTemplateRoles(teamId);
    	                    } catch (e) {
    	                        // Failed to load deleted roles list
    	                    }
    	                }
    	                
    	                // Merge permanent and template roles into one object
    	                const allDefaultRoles = { ...permanentRoles };
    	                // Only include template roles that haven't been deleted
    	                for (const [roleName, permissions] of Object.entries(templateRoles)) {
    	                    if (!deletedRoles.includes(roleName)) {
    	                        allDefaultRoles[roleName] = permissions;
    	                    }
    	                }
    	                
    	                if (Object.keys(allDefaultRoles).length === 0) {
    	                    return { success: true, applied: false };
    	                }
    	                
    	                try {
    	                    // Get current team preferences
    	                    const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                    const currentRoles = currentPrefs?.roles ? { ...currentPrefs.roles } : {};
    	                    
    	                    let rolesUpdated = false;
    	                    const updatedRoles = { ...currentRoles };
    	                    
    	                    // Apply default roles that don't already exist
    	                    for (const [roleName, permissions] of Object.entries(allDefaultRoles)) {
    	                        if (!updatedRoles[roleName] && Array.isArray(permissions)) {
    	                            updatedRoles[roleName] = permissions;
    	                            rolesUpdated = true;
    	                        }
    	                    }
    	                    
    	                    // Only update if roles were added
    	                    if (rolesUpdated) {
    	                        const updatedPrefs = {
    	                            ...currentPrefs,
    	                            roles: updatedRoles
    	                        };
    	                        await this._appwrite.teams.updatePrefs({
    	                            teamId: teamId,
    	                            prefs: updatedPrefs
    	                        });
    	                        
    	                        // Refresh cache for this team
    	                        if (this.getAllRoles) {
    	                            const allRoles = await this.getAllRoles(teamId);
    	                            const rolesCopy = allRoles ? { ...allRoles } : {};
    	                            if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                            this._allRolesCacheByTeam[teamId] = rolesCopy;
    	                            
    	                            // Pre-cache permanent role status for all roles
    	                            if (!this._rolePermanentCache) this._rolePermanentCache = {};
    	                            if (!this._rolePermanentCache[teamId]) this._rolePermanentCache[teamId] = {};
    	                            for (const roleName of Object.keys(rolesCopy)) {
    	                                if (this.isRolePermanent) {
    	                                    await this.isRolePermanent(teamId, roleName);
    	                                }
    	                            }
    	                        }
    	                        
    	                        return { success: true, applied: true };
    	                    }
    	                    
    	                    return { success: true, applied: false };
    	                } catch (error) {
    	                    return { success: false, error: error.message };
    	                }
    	            };
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    initializeTeamsRolesDefaults();
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsRolesDefaults();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export for use in other modules
    	window.InduxAppwriteAuthTeamsRolesDefaults = {
    	    initialize: initializeTeamsRolesDefaults
    	};



    	/* Auth teams - Role abstraction layer */

    	// Valid owner permission values (must map precisely to Appwrite owner capabilities)
    	const OWNER_PERMISSIONS = [
    	    'inviteMembers',   // Can invite team members
    	    'updateMembers',   // Can update member roles
    	    'removeMembers',   // Can remove team members
    	    'renameTeam',      // Can rename the team
    	    'deleteTeam',      // Can delete the team
    	    'manageRoles'      // Can create, update, rename, and delete custom roles
    	];

    	// Get all owner permissions
    	function getOwnerPermissions() {
    	    return [...OWNER_PERMISSIONS];
    	}

    	// Validate role configuration from manifest
    	function validateRoleConfig(memberRoles, creatorRole) {
    	    const errors = [];
    	    const warnings = [];

    	    // If teams not enabled, roles are ignored (graceful degradation)
    	    // This validation assumes teams are enabled

    	    // Validate memberRoles structure
    	    if (memberRoles && typeof memberRoles !== 'object') {
    	        errors.push('memberRoles must be an object');
    	        return { valid: false, errors, warnings };
    	    }

    	    if (!memberRoles || Object.keys(memberRoles).length === 0) {
    	        // No roles defined - this is valid (will use Appwrite default: everyone is owner)
    	        return { valid: true, errors: [], warnings: [] };
    	    }

    	    // Validate each role
    	    for (const [roleName, permissions] of Object.entries(memberRoles)) {
    	        if (!Array.isArray(permissions)) {
    	            errors.push(`Role "${roleName}" must have a permissions array`);
    	            continue;
    	        }

    	        // Validate owner permissions (warn about invalid ones, but allow custom permissions)
    	        for (const permission of permissions) {
    	            if (typeof permission !== 'string') {
    	                errors.push(`Role "${roleName}" has invalid permission type. Permissions must be strings.`);
    	            }
    	        }
    	    }

    	    // Validate creatorRole reference
    	    if (creatorRole) {
    	        if (typeof creatorRole !== 'string') {
    	            errors.push('creatorRole must be a string reference to a memberRoles key');
    	        } else if (!memberRoles || !memberRoles[creatorRole]) {
    	            errors.push(`creatorRole "${creatorRole}" does not exist in memberRoles`);
    	        }
    	    }

    	    if (errors.length > 0) {
    	        return { valid: false, errors, warnings };
    	    }

    	    return { valid: true, errors: [], warnings };
    	}

    	// Check if a role requires owner permissions (has any owner permission)
    	function roleRequiresOwner(roleName, memberRoles) {
    	    if (!memberRoles || !memberRoles[roleName]) {
    	        return false;
    	    }

    	    const permissions = memberRoles[roleName] || [];
    	    
    	    // If role has any owner permission, it requires owner role
    	    return permissions.some(perm => OWNER_PERMISSIONS.includes(perm));
    	}

    	// Check if a role has ALL owner permissions (effectively replaces "owner" in UI)
    	function roleHasAllOwnerPermissions(roleName, memberRoles) {
    	    if (!memberRoles || !memberRoles[roleName]) {
    	        return false;
    	    }

    	    const permissions = memberRoles[roleName] || [];
    	    
    	    // Check if role has all owner permissions
    	    return OWNER_PERMISSIONS.every(perm => permissions.includes(perm));
    	}

    	// Get user-generated roles from team preferences
    	async function getUserGeneratedRoles(teamId, appwrite) {
    	    if (!appwrite || !appwrite.teams) {
    	        return null;
    	    }

    	    try {
    	        const prefs = await appwrite.teams.getPrefs({ teamId });
    	        return prefs?.roles || null;
    	    } catch (error) {
    	        // Team preferences might not have roles yet, or team might be deleted (404)
    	        // Silently return null for deleted teams (expected behavior)
    	        if (error.message && error.message.includes('could not be found')) {
    	            return null;
    	        }
    	        // For other errors, also return null (team preferences might not exist yet)
    	        return null;
    	    }
    	}

    	// Merge manifest roles with user-generated roles (user-generated overrides manifest)
    	function mergeRoles(manifestRoles, userGeneratedRoles) {
    	    if (!manifestRoles && !userGeneratedRoles) {
    	        return null;
    	    }

    	    // Start with manifest roles
    	    const merged = manifestRoles ? { ...manifestRoles } : {};

    	    // Override with user-generated roles (if enabled)
    	    if (userGeneratedRoles && typeof userGeneratedRoles === 'object') {
    	        Object.assign(merged, userGeneratedRoles);
    	    }

    	    return merged;
    	}

    	// Normalize custom roles for Appwrite (add "owner" if any role requires it)
    	function normalizeRolesForAppwrite(customRoles, memberRoles, userGeneratedRoles = null) {
    	    if (!Array.isArray(customRoles)) {
    	        return customRoles;
    	    }

    	    // Merge manifest and user-generated roles
    	    const allRoles = mergeRoles(memberRoles, userGeneratedRoles);

    	    // If no roles config, return as-is (will use Appwrite's default behavior)
    	    if (!allRoles || Object.keys(allRoles).length === 0) {
    	        return customRoles;
    	    }

    	    // Check if any custom role requires owner
    	    const requiresOwner = customRoles.some(role => roleRequiresOwner(role, allRoles));
    	    
    	    // If owner is already in the list, don't duplicate
    	    if (requiresOwner && !customRoles.includes('owner')) {
    	        return [...customRoles, 'owner'];
    	    }

    	    return customRoles;
    	}

    	// Normalize Appwrite roles for display (filter "owner" if a custom role replaces it)
    	function normalizeRolesForDisplay(appwriteRoles, memberRoles, userGeneratedRoles = null) {
    	    if (!Array.isArray(appwriteRoles)) {
    	        return appwriteRoles;
    	    }

    	    // Merge manifest and user-generated roles
    	    const allRoles = mergeRoles(memberRoles, userGeneratedRoles);

    	    // If custom roles are defined, always filter out "owner" (it's a background Appwrite role)
    	    // "owner" is automatically added by Appwrite for permissions, but shouldn't be displayed
    	    if (allRoles && Object.keys(allRoles).length > 0) {
    	        return appwriteRoles.filter(role => role !== 'owner');
    	    }

    	    // If no custom roles config, show "owner" as-is (legacy behavior)
    	    return appwriteRoles;
    	}

    	// Get the primary role for display (first custom role, or "owner" if no custom roles)
    	function getPrimaryDisplayRole(appwriteRoles, memberRoles, userGeneratedRoles = null) {
    	    const displayRoles = normalizeRolesForDisplay(appwriteRoles, memberRoles, userGeneratedRoles);
    	    
    	    if (displayRoles.length === 0) {
    	        return null;
    	    }

    	    // Return first role (typically the most important)
    	    return displayRoles[0];
    	}

    	// Check if a user has a specific permission based on their roles
    	function hasPermission(userRoles, permission, memberRoles, userGeneratedRoles = null) {
    	    if (!Array.isArray(userRoles)) {
    	        return false;
    	    }

    	    // Merge manifest and user-generated roles
    	    const allRoles = mergeRoles(memberRoles, userGeneratedRoles);

    	    // If no custom roles config, owner has all permissions (including manageRoles)
    	    if (!allRoles || Object.keys(allRoles).length === 0) {
    	        // Owner always has all permissions when no custom roles are defined
    	        return userRoles.includes('owner');
    	    }

    	    // IMPORTANT: When custom roles are defined, we ONLY check custom roles, NOT the owner role.
    	    // This is because Appwrite automatically grants "owner" role to users with custom roles
    	    // that have native permissions, but we want to restrict them to ONLY the permissions
    	    // explicitly defined in their custom role(s).
    	    
    	    // Get user's custom roles (excluding "owner")
    	    const customRoles = userRoles.filter(role => role !== 'owner');
    	    
    	    // If user has no custom roles (only "owner" or empty), grant all permissions
    	    // This handles edge cases where:
    	    // - User's role was deleted
    	    // - User was never assigned a custom role
    	    if (customRoles.length === 0) {
    	        // User has no custom roles, so they should have all owner permissions
    	        return true;
    	    }
    	    
    	    // Check if any of the user's custom roles has this permission
    	    for (const roleName of customRoles) {
    	        const rolePermissions = allRoles[roleName];
    	        if (rolePermissions && Array.isArray(rolePermissions) && rolePermissions.includes(permission)) {
    	            return true;
    	        }
    	    }

    	    // User has custom roles but none of them grant this permission
    	    return false;
    	}

    	// Get creator role permissions (with fallback logic)
    	function getCreatorRolePermissions(memberRoles, creatorRole) {
    	    // If creatorRole specified and exists in memberRoles
    	    if (creatorRole && memberRoles && memberRoles[creatorRole]) {
    	        return memberRoles[creatorRole];
    	    }

    	    // If no creatorRole specified, find role with all owner permissions
    	    if (memberRoles) {
    	        for (const [roleName, permissions] of Object.entries(memberRoles)) {
    	            if (roleHasAllOwnerPermissions(roleName, memberRoles)) {
    	                return permissions;
    	            }
    	        }
    	        // If no role has all permissions, use first role
    	        const firstRole = Object.keys(memberRoles)[0];
    	        if (firstRole) {
    	            return memberRoles[firstRole];
    	        }
    	    }

    	    // Fallback: return empty array (will use Appwrite default: owner)
    	    return [];
    	}

    	// Initialize role abstraction
    	function initializeTeamsRoles() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store._rolesInitialized) {
    	            // Add role abstraction methods to store
    	            store.getOwnerPermissions = function() {
    	                return getOwnerPermissions();
    	            };

    	            store.validateRoleConfig = async function() {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                const creatorRole = appwriteConfig?.creatorRole || null;
    	                return validateRoleConfig(memberRoles, creatorRole);
    	            };

    	            store.roleRequiresOwner = async function(roleName) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                return roleRequiresOwner(roleName, memberRoles);
    	            };

    	            store.roleHasAllOwnerPermissions = async function(roleName) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                return roleHasAllOwnerPermissions(roleName, memberRoles);
    	            };

    	            store.getUserGeneratedRoles = async function(teamId) {
    	                if (!this._appwrite) {
    	                    return null;
    	                }
    	                return await getUserGeneratedRoles(teamId, this._appwrite);
    	            };

    	            store.getAllRoles = async function(teamId) {
    	                // Check if team still exists before trying to access preferences
    	                if (teamId && this.teams && !this.teams.find(t => t.$id === teamId)) {
    	                    // Team was deleted, return only memberRoles (no user-generated roles)
    	                    const appwriteConfig = await config.getAppwriteConfig();
    	                    return appwriteConfig?.memberRoles || null;
    	                }
    	                
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                let memberRoles = appwriteConfig?.memberRoles || null;
    	                
    	                // Filter out deleted template roles from memberRoles
    	                if (memberRoles && teamId && window.InduxAppwriteAuthTeamsRolesDefaults && this.getDeletedTemplateRoles) {
    	                    const deletedRoles = await this.getDeletedTemplateRoles(teamId);
    	                    if (deletedRoles && deletedRoles.length > 0) {
    	                        // Create a filtered copy of memberRoles without deleted template roles
    	                        const filteredMemberRoles = { ...memberRoles };
    	                        for (const deletedRoleName of deletedRoles) {
    	                            delete filteredMemberRoles[deletedRoleName];
    	                        }
    	                        memberRoles = filteredMemberRoles;
    	                    }
    	                }
    	                
    	                // Always check for user-generated roles (stored in team preferences)
    	                let userRoles = null;
    	                if (teamId && this._appwrite) {
    	                    userRoles = await this.getUserGeneratedRoles(teamId);
    	                }
    	                
    	                return mergeRoles(memberRoles, userRoles);
    	            };

    	            store.normalizeRolesForAppwrite = async function(customRoles, teamId = null) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                
    	                // Always check for user-generated roles (stored in team preferences)
    	                let userRoles = null;
    	                if (teamId && this._appwrite) {
    	                    userRoles = await this.getUserGeneratedRoles(teamId);
    	                }
    	                
    	                return normalizeRolesForAppwrite(customRoles, memberRoles, userRoles);
    	            };

    	            store.normalizeRolesForDisplay = async function(appwriteRoles, teamId = null) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                
    	                // Always check for user-generated roles (stored in team preferences)
    	                let userRoles = null;
    	                if (teamId && this._appwrite) {
    	                    userRoles = await this.getUserGeneratedRoles(teamId);
    	                }
    	                
    	                return normalizeRolesForDisplay(appwriteRoles, memberRoles, userRoles);
    	            };

    	            store.getPrimaryDisplayRole = async function(appwriteRoles, teamId = null) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                
    	                // Always check for user-generated roles (stored in team preferences)
    	                let userRoles = null;
    	                if (teamId && this._appwrite) {
    	                    userRoles = await this.getUserGeneratedRoles(teamId);
    	                }
    	                
    	                return getPrimaryDisplayRole(appwriteRoles, memberRoles, userRoles);
    	            };

    	            store.hasPermission = async function(userRoles, permission, teamId = null) {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                
    	                // Always check for user-generated roles (stored in team preferences)
    	                let userGenRoles = null;
    	                if (teamId && this._appwrite) {
    	                    userGenRoles = await this.getUserGeneratedRoles(teamId);
    	                }
    	                
    	                return hasPermission(userRoles, permission, memberRoles, userGenRoles);
    	            };

    	            store.getCreatorRolePermissions = async function() {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                const creatorRole = appwriteConfig?.creatorRole || null;
    	                return getCreatorRolePermissions(memberRoles, creatorRole);
    	            };

    	            // Check if custom roles are configured
    	            store.hasCustomRoles = async function() {
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                const memberRoles = appwriteConfig?.memberRoles || null;
    	                return memberRoles && Object.keys(memberRoles).length > 0;
    	            };

    	            // Check if user can manage roles (has manageRoles permission)
    	            store.canManageRoles = async function() {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return false;
    	                }
    	                return await this.hasTeamPermission('manageRoles');
    	            };
    	            
    	            // Alias for backwards compatibility
    	            store.canCreateRoles = store.canManageRoles;

    	            store._rolesInitialized = true;
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeTeamsRoles();
    	    } catch (error) {
    	        // Failed to initialize teams roles
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsRoles();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export roles interface
    	window.InduxAppwriteAuthTeamsRoles = {
    	    initialize: initializeTeamsRoles,
    	    getOwnerPermissions,
    	    validateRoleConfig,
    	    roleRequiresOwner,
    	    roleHasAllOwnerPermissions,
    	    getUserGeneratedRoles,
    	    mergeRoles,
    	    normalizeRolesForAppwrite,
    	    normalizeRolesForDisplay,
    	    getPrimaryDisplayRole,
    	    hasPermission,
    	    getCreatorRolePermissions
    	};


    	/* Auth teams - User-generated roles management */

    	// Add user-generated role methods to auth store
    	function initializeTeamsUserRoles() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.createUserRole) {
    	            // Create user-generated role
    	            store.createUserRole = async function(teamId, roleName, permissions) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to create roles' };
    	                }

    	                // Check if user has manageRoles permission
    	                if (!this.hasTeamPermission || !await this.hasTeamPermission('manageRoles')) {
    	                    return { success: false, error: 'You do not have permission to create roles' };
    	                }

    	                if (!roleName || !roleName.trim()) {
    	                    return { success: false, error: 'Role name is required' };
    	                }

    	                if (!Array.isArray(permissions)) {
    	                    return { success: false, error: 'Permissions must be an array' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Get current team preferences (preserve all existing prefs)
    	                    const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                    // Ensure we have a fresh copy of roles, not a shared reference
    	                    const currentRoles = currentPrefs?.roles ? { ...currentPrefs.roles } : {};

    	                    // Check if role already exists
    	                    if (currentRoles[roleName]) {
    	                        return { success: false, error: `Role "${roleName}" already exists` };
    	                    }

    	                    // Add new role
    	                    const updatedRoles = {
    	                        ...currentRoles,
    	                        [roleName]: permissions
    	                    };

    	                    // Update team preferences (preserve all other preferences)
    	                    const updatedPrefs = {
    	                        ...currentPrefs,
    	                        roles: updatedRoles
    	                    };
    	                    await this._appwrite.teams.updatePrefs({
    	                        teamId: teamId,
    	                        prefs: updatedPrefs
    	                    });

    	                    // Refresh permission cache to update UI
    	                    if (this.refreshPermissionCache) {
    	                        await this.refreshPermissionCache();
    	                    }
    	                    
    	                    // Also update per-team cache for this specific team
    	                    if (this.getAllRoles) {
    	                        const allRoles = await this.getAllRoles(teamId);
    	                        const rolesCopy = allRoles ? { ...allRoles } : {};
    	                        if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                        this._allRolesCacheByTeam[teamId] = rolesCopy;
    	                    }

    	                    return { success: true, role: { name: roleName, permissions } };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };
    	            
    	            // Convenience method: create role using newRoleName and newRolePermissions properties
    	            store.createRoleFromInputs = async function(teamId) {
    	                if (!teamId) {
    	                    return { success: false, error: 'Team ID is required' };
    	                }
    	                
    	                // Ensure role name is a string
    	                const roleName = String(this.newRoleName || '').trim();
    	                // newRolePermissions is now an array (from checkboxes)
    	                const permissions = Array.isArray(this.newRolePermissions) 
    	                    ? this.newRolePermissions.filter(p => p && typeof p === 'string')
    	                    : [];
    	                
    	                if (!roleName) {
    	                    return { success: false, error: 'Role name is required' };
    	                }
    	                
    	                const result = await this.createUserRole(teamId, roleName, permissions);
    	                if (result.success) {
    	                    this.newRoleName = ''; // Clear inputs
    	                    this.newRolePermissions = []; // Clear permissions array
    	                }
    	                return result;
    	            };

    	            // Update user-generated role (permissions only)
    	            store.updateUserRole = async function(teamId, roleName, permissions) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to update roles' };
    	                }

    	                // Check if user has manageRoles permission
    	                if (!this.hasTeamPermission || !await this.hasTeamPermission('manageRoles')) {
    	                    return { success: false, error: 'You do not have permission to update roles' };
    	                }

    	                if (!roleName || !roleName.trim()) {
    	                    return { success: false, error: 'Role name is required' };
    	                }

    	                if (!Array.isArray(permissions)) {
    	                    return { success: false, error: 'Permissions must be an array' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Get current team preferences (preserve all existing prefs)
    	                    const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                    // Ensure we have a fresh copy of roles, not a shared reference
    	                    const currentRoles = currentPrefs?.roles ? { ...currentPrefs.roles } : {};

    	                    // Check if role exists
    	                    if (!currentRoles[roleName]) {
    	                        return { success: false, error: `Role "${roleName}" does not exist` };
    	                    }

    	                    // Update role permissions
    	                    const updatedRoles = {
    	                        ...currentRoles,
    	                        [roleName]: permissions
    	                    };

    	                    // Update team preferences (preserve all other preferences)
    	                    const updatedPrefs = {
    	                        ...currentPrefs,
    	                        roles: updatedRoles
    	                    };
    	                    await this._appwrite.teams.updatePrefs({
    	                        teamId: teamId,
    	                        prefs: updatedPrefs
    	                    });

    	                    // Refresh permission cache to update UI
    	                    if (this.refreshPermissionCache) {
    	                        await this.refreshPermissionCache();
    	                    }
    	                    
    	                    // Also update per-team cache for this specific team (create new object reference for reactivity)
    	                    if (this.getAllRoles) {
    	                        const allRoles = await this.getAllRoles(teamId);
    	                        const rolesCopy = allRoles ? { ...allRoles } : {};
    	                        if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                        this._allRolesCacheByTeam[teamId] = { ...rolesCopy };
    	                        
    	                        // Also update _allRolesCache if this is the current team
    	                        if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                            this._allRolesCache = { ...rolesCopy };
    	                        }
    	                    }

    	                    return { success: true, role: { name: roleName, permissions } };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };
    	            
    	            // Rename a user-generated role
    	            store.renameUserRole = async function(teamId, oldRoleName, newRoleName) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to rename roles' };
    	                }

    	                // Check if user has manageRoles permission
    	                if (!this.hasTeamPermission || !await this.hasTeamPermission('manageRoles')) {
    	                    return { success: false, error: 'You do not have permission to rename roles' };
    	                }

    	                oldRoleName = String(oldRoleName || '').trim();
    	                newRoleName = String(newRoleName || '').trim();

    	                if (!oldRoleName || !newRoleName) {
    	                    return { success: false, error: 'Both old and new role names are required' };
    	                }

    	                if (oldRoleName === newRoleName) {
    	                    return { success: false, error: 'New role name must be different from the current name' };
    	                }

    	                // Check if role is permanent (cannot be renamed)
    	                if (this.isRolePermanent && await this.isRolePermanent(teamId, oldRoleName)) {
    	                    return { success: false, error: 'Permanent roles cannot be renamed' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Get current team preferences (preserve all existing prefs)
    	                    const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                    // Ensure we have a fresh copy of roles, not a shared reference
    	                    const currentRoles = currentPrefs?.roles ? { ...currentPrefs.roles } : {};

    	                    // Check if old role exists
    	                    if (!currentRoles[oldRoleName]) {
    	                        return { success: false, error: `Role "${oldRoleName}" does not exist` };
    	                    }

    	                    // Check if new role name already exists
    	                    if (currentRoles[newRoleName]) {
    	                        return { success: false, error: `Role "${newRoleName}" already exists` };
    	                    }

    	                    // Get permissions from old role
    	                    const permissions = Array.isArray(currentRoles[oldRoleName]) 
    	                        ? [...currentRoles[oldRoleName]] 
    	                        : [];

    	                    // Create updated roles object: remove old, add new
    	                    const updatedRoles = { ...currentRoles };
    	                    delete updatedRoles[oldRoleName];
    	                    updatedRoles[newRoleName] = permissions;

    	                    // Update team preferences (preserve all other preferences)
    	                    const updatedPrefs = {
    	                        ...currentPrefs,
    	                        roles: updatedRoles
    	                    };
    	                    await this._appwrite.teams.updatePrefs({
    	                        teamId: teamId,
    	                        prefs: updatedPrefs
    	                    });

    	                    // Update all memberships that have the old role name to use the new role name
    	                    // This prevents data drift where role names in memberships don't match role definitions
    	                    try {
    	                        if (this.listMemberships) {
    	                            const membershipsResult = await this.listMemberships(teamId);
    	                            if (membershipsResult && membershipsResult.success && membershipsResult.memberships) {
    	                                const memberships = membershipsResult.memberships;
    	                                let updatedCount = 0;
    	                                
    	                                for (const membership of memberships) {
    	                                    if (membership.roles && Array.isArray(membership.roles)) {
    	                                        // Check if membership has the old role name
    	                                        const hasOldRole = membership.roles.includes(oldRoleName);
    	                                        
    	                                        if (hasOldRole) {
    	                                            // Replace old role name with new role name
    	                                            const updatedRoles = membership.roles.map(role => 
    	                                                role === oldRoleName ? newRoleName : role
    	                                            );
    	                                            
    	                                            // Update membership with new roles
    	                                            if (this.updateMembership) {
    	                                                await this.updateMembership(teamId, membership.$id, updatedRoles);
    	                                                updatedCount++;
    	                                            }
    	                                        }
    	                                    }
    	                                }
    	                            }
    	                        }
    	                    } catch (membershipError) {
    	                        // Log error but don't fail the rename operation
    	                    }

    	                    // Refresh permission cache to update UI
    	                    if (this.refreshPermissionCache) {
    	                        await this.refreshPermissionCache();
    	                    }
    	                    
    	                    // Refresh memberships to update UI with new role names
    	                    if (this.listMemberships && this.currentTeam && this.currentTeam.$id === teamId) {
    	                        await this.listMemberships(teamId);
    	                    }
    	                    
    	                    // Also update per-team cache for this specific team (create new object reference for reactivity)
    	                    if (this.getAllRoles) {
    	                        const allRoles = await this.getAllRoles(teamId);
    	                        const rolesCopy = allRoles ? { ...allRoles } : {};
    	                        if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                        this._allRolesCacheByTeam[teamId] = { ...rolesCopy };
    	                        
    	                        // Also update _allRolesCache if this is the current team
    	                        if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                            this._allRolesCache = { ...rolesCopy };
    	                        }
    	                    }

    	                    return { success: true, role: { name: newRoleName, permissions } };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Delete user-generated role
    	            store.deleteUserRole = async function(teamId, roleName) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to delete roles' };
    	                }

    	                // Check if user has manageRoles permission
    	                if (!this.hasTeamPermission || !await this.hasTeamPermission('manageRoles')) {
    	                    return { success: false, error: 'You do not have permission to delete roles' };
    	                }

    	                if (!roleName || !roleName.trim()) {
    	                    return { success: false, error: 'Role name is required' };
    	                }
    	                
    	                // Check if role is permanent (cannot be deleted)
    	                if (this.isRolePermanent && await this.isRolePermanent(teamId, roleName)) {
    	                    return { success: false, error: 'This role cannot be deleted' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Check if role is assigned to any members (UI/platform requirement)
    	                    if (this.listMemberships) {
    	                        const membershipsResult = await this.listMemberships(teamId);
    	                        if (membershipsResult.success) {
    	                            const memberships = membershipsResult.memberships || [];
    	                            const roleInUse = memberships.some(m => 
    	                                m.roles && Array.isArray(m.roles) && m.roles.includes(roleName)
    	                            );
    	                            
    	                            if (roleInUse) {
    	                                return { 
    	                                    success: false, 
    	                                    error: `Cannot delete role "${roleName}" - it is assigned to one or more team members. Please reassign members to other roles first.` 
    	                                };
    	                            }
    	                        }
    	                    }

    	                    // Get current team preferences (preserve all existing prefs)
    	                    const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                    // Ensure we have a fresh copy of roles, not a shared reference
    	                    const currentRoles = currentPrefs?.roles ? { ...currentPrefs.roles } : {};

    	                    // Check if role exists in team preferences OR if it's a template role (which might only exist in manifest)
    	                    const roleExistsInPrefs = !!currentRoles[roleName];
    	                    let isTemplateRole = false;
    	                    if (!roleExistsInPrefs && window.InduxAppwriteAuthTeamsRolesDefaults && this.isRoleTemplate) {
    	                        isTemplateRole = await this.isRoleTemplate(teamId, roleName);
    	                    }
    	                    
    	                    if (!roleExistsInPrefs && !isTemplateRole) {
    	                        return { success: false, error: `Role "${roleName}" does not exist` };
    	                    }

    	                    // Track deleted template role (don't recreate it, but allow reapplying)
    	                    // Note: isTemplateRole was already checked above if role doesn't exist in prefs
    	                    if (!isTemplateRole && window.InduxAppwriteAuthTeamsRolesDefaults && this.isRoleTemplate) {
    	                        isTemplateRole = await this.isRoleTemplate(teamId, roleName);
    	                    }
    	                    if (isTemplateRole) {
    	                        // Store deletion in team preferences (shared across all team members)
    	                        // This ensures all team members see the role as deleted, not just the user who deleted it
    	                        try {
    	                            // Get current team preferences
    	                            const currentPrefs = await this._appwrite.teams.getPrefs({ teamId });
    	                            
    	                            // Get existing deleted template roles list
    	                            let deletedRoles = [];
    	                            if (currentPrefs && currentPrefs.deletedTemplateRoles && Array.isArray(currentPrefs.deletedTemplateRoles)) {
    	                                deletedRoles = [...currentPrefs.deletedTemplateRoles];
    	                            }
    	                            
    	                            // Add role to deleted list if not already there
    	                            if (!deletedRoles.includes(roleName)) {
    	                                deletedRoles.push(roleName);
    	                                
    	                                // Update team preferences with deleted roles list
    	                                const updatedPrefs = {
    	                                    ...currentPrefs,
    	                                    deletedTemplateRoles: deletedRoles
    	                                };
    	                                
    	                                await this._appwrite.teams.updatePrefs({
    	                                    teamId: teamId,
    	                                    prefs: updatedPrefs
    	                                });
    	                            }
    	                        } catch (e) {
    	                            // Fallback to localStorage for backwards compatibility
    	                            try {
    	                                const userId = this.user?.$id;
    	                                if (userId) {
    	                                    const key = `indux:deleted-roles:${userId}:${teamId}`;
    	                                    const deleted = JSON.parse(localStorage.getItem(key) || '[]');
    	                                    if (!deleted.includes(roleName)) {
    	                                        deleted.push(roleName);
    	                                        localStorage.setItem(key, JSON.stringify(deleted));
    	                                    }
    	                                }
    	                            } catch (e2) {
    	                                // Failed to track deleted role in localStorage
    	                            }
    	                        }
    	                    }

    	                    // Remove role from team preferences (if it exists there)
    	                    const updatedRoles = { ...currentRoles };
    	                    if (roleExistsInPrefs) {
    	                        delete updatedRoles[roleName];
    	                    }

    	                    // Update team preferences only if role existed in prefs (preserve all other preferences)
    	                    if (roleExistsInPrefs) {
    	                        const updatedPrefs = {
    	                            ...currentPrefs,
    	                            roles: updatedRoles
    	                        };
    	                        await this._appwrite.teams.updatePrefs({
    	                            teamId: teamId,
    	                            prefs: updatedPrefs
    	                        });
    	                    }

    	                    // Update per-team cache for this specific team (create new object reference for reactivity)
    	                    if (this.getAllRoles) {
    	                        const allRoles = await this.getAllRoles(teamId);
    	                        const rolesCopy = allRoles ? { ...allRoles } : {};
    	                        if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                        // Create new object reference to ensure Alpine reactivity
    	                        this._allRolesCacheByTeam[teamId] = { ...rolesCopy };
    	                        
    	                        // Also update _allRolesCache if this is the current team
    	                        if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                            this._allRolesCache = { ...rolesCopy };
    	                        }
    	                        
    	                        // Update permanent role cache for remaining roles
    	                        if (!this._rolePermanentCache) this._rolePermanentCache = {};
    	                        if (!this._rolePermanentCache[teamId]) this._rolePermanentCache[teamId] = {};
    	                        if (this.isRolePermanent) {
    	                            for (const rName of Object.keys(rolesCopy)) {
    	                                await this.isRolePermanent(teamId, rName);
    	                            }
    	                            // Remove deleted role from cache
    	                            if (this._rolePermanentCache[teamId][roleName] !== undefined) {
    	                                delete this._rolePermanentCache[teamId][roleName];
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Refresh permission cache to update UI (after cache updates)
    	                    if (this.refreshPermissionCache) {
    	                        await this.refreshPermissionCache();
    	                    }

    	                    return { success: true };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Check if role is user-generated (stored in team preferences, not in manifest)
    	            store.isUserGeneratedRole = async function(teamId, roleName) {
    	                if (!this._appwrite) {
    	                    return false;
    	                }

    	                try {
    	                    const userRoles = await this.getUserGeneratedRoles(teamId);
    	                    return userRoles && userRoles[roleName] !== undefined;
    	                } catch (error) {
    	                    return false;
    	                }
    	            };
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeTeamsUserRoles();
    	    } catch (error) {
    	        // Failed to initialize teams user roles
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsUserRoles();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export user roles interface
    	window.InduxAppwriteAuthTeamsUserRoles = {
    	    initialize: initializeTeamsUserRoles
    	};



    	/* Auth teams - Membership operations */

    	// Add membership methods to auth store
    	function initializeTeamsMembers() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.inviteMember) {
    	            // Invite member to team
    	            store.inviteMember = async function(teamId, roles, email = null, userId = null, phone = null, url = null, name = null) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to invite members' };
    	                }

    	                if (!email && !userId && !phone) {
    	                    return { success: false, error: 'You must provide email, userId, or phone' };
    	                }

    	                // Use current URL as default redirect if not provided
    	                if (!url) {
    	                    const currentUrl = new URL(window.location.href);
    	                    url = `${currentUrl.origin}${currentUrl.pathname}`;
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Ensure roles is an array
    	                    let rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);
    	                    
    	                    // Normalize roles for Appwrite (add "owner" if custom roles require it)
    	                    let normalizedRoles = rolesArray;
    	                    if (this.normalizeRolesForAppwrite && rolesArray.length > 0) {
    	                        normalizedRoles = await this.normalizeRolesForAppwrite(rolesArray, teamId);
    	                    }
    	                    
    	                    // If no roles provided, use default "owner" role (Appwrite requires at least one role)
    	                    if (!normalizedRoles || normalizedRoles.length === 0) {
    	                        normalizedRoles = ['owner'];
    	                    }

    	                    // Build the membership creation params (only include defined values)
    	                    const membershipParams = {
    	                        teamId: teamId,
    	                        roles: normalizedRoles
    	                    };
    	                    
    	                    // Only include email, userId, or phone if provided (not empty strings)
    	                    if (email && email.trim()) {
    	                        membershipParams.email = email.trim();
    	                    } else if (userId && userId.trim()) {
    	                        membershipParams.userId = userId.trim();
    	                    } else if (phone && phone.trim()) {
    	                        membershipParams.phone = phone.trim();
    	                    }
    	                    
    	                    // Include optional parameters if provided
    	                    if (url && url.trim()) {
    	                        membershipParams.url = url.trim();
    	                    }
    	                    if (name && name.trim()) {
    	                        membershipParams.name = name.trim();
    	                    }

    	                    const result = await this._appwrite.teams.createMembership(membershipParams);

    	                    return { success: true, membership: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // List team memberships
    	            store.listMemberships = async function(teamId, queries = [], search = '') {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to list memberships' };
    	                }

    	                try {
    	                    const params = {
    	                        teamId: teamId,
    	                        queries: queries
    	                    };
    	                    if (search && search.trim().length > 0) {
    	                        params.search = search;
    	                    }
    	                    const result = await this._appwrite.teams.listMemberships(params);
    	                    let memberships = result.memberships || [];
    	                    
    	                    // Enhance memberships with user email if missing
    	                    // Appwrite membership objects have 'email' for pending invites, confirmed members need user lookup
    	                    for (const membership of memberships) {
    	                        // Log all membership properties to debug
    	                        const allProps = Object.keys(membership);
    	                        const allPropValues = {};
    	                        allProps.forEach(prop => {
    	                            const value = membership[prop];
    	                            // Only log string/number values, skip objects/arrays
    	                            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    	                                allPropValues[prop] = value;
    	                            } else if (value && typeof value === 'object') {
    	                                allPropValues[prop] = Array.isArray(value) ? `[Array(${value.length})]` : '[Object]';
    	                            }
    	                        });
    	                        
    	                        // For pending invites, email should already be in membership.email
    	                        // For confirmed members, we need to look it up
    	                        if (!membership.email && !membership.userEmail) {
    	                            try {
    	                                // For the current user, use the auth store's user object
    	                                if (this.user && this.user.$id === membership.userId && this.user.email) {
    	                                    membership.email = this.user.email;
    	                                    membership.userEmail = this.user.email;
    	                                } else if (membership.userId && membership.confirm === true) {
    	                                    // For confirmed members, try to fetch user details
    	                                    // Note: This requires 'users.read' permission
    	                                    try {
    	                                        // Check if users service is available
    	                                        if (!this._appwrite || !this._appwrite.users || typeof this._appwrite.users.get !== 'function') {
    	                                            console.warn('[Indux Appwrite Auth] Users service not available on Appwrite client');
    	                                        } else {
    	                                            const user = await this._appwrite.users.get({ userId: membership.userId });
    	                                            if (user && user.email) {
    	                                                membership.email = user.email;
    	                                                membership.userEmail = user.email;
    	                                            } else {
    	                                                console.warn('[Indux Appwrite Auth] User fetched but no email found');
    	                                            }
    	                                        }
    	                                    } catch (e) {
    	                                        console.warn('[Indux Appwrite Auth] Failed to fetch user:', e.message);
    	                                        // Silently fail if we can't fetch user (permission issue or user deleted)
    	                                    }
    	                                } else if (membership.confirm === false) {
    	                                    // For pending invites, try to get email from membership object
    	                                    // Appwrite may store it in different properties
    	                                    const possibleEmailProps = ['email', 'userEmail', 'inviteeEmail', 'invitedEmail', 'userName'];
    	                                    let foundEmail = null;
    	                                    for (const prop of possibleEmailProps) {
    	                                        const value = membership[prop];
    	                                        if (value && typeof value === 'string' && value.includes('@')) {
    	                                            foundEmail = value;
    	                                            break;
    	                                        }
    	                                    }
    	                                    if (foundEmail) {
    	                                        membership.email = foundEmail;
    	                                        membership.userEmail = foundEmail;
    	                                    } else {
    	                                        // If still not found and we have userId, try fetching user
    	                                        if (membership.userId) {
    	                                            try {
    	                                                // Check if users service is available
    	                                                if (!this._appwrite || !this._appwrite.users || typeof this._appwrite.users.get !== 'function') {
    	                                                    console.warn('[Indux Appwrite Auth] Users service not available for pending invite lookup');
    	                                                } else {
    	                                                    const user = await this._appwrite.users.get({ userId: membership.userId });
    	                                                    if (user && user.email) {
    	                                                        membership.email = user.email;
    	                                                        membership.userEmail = user.email;
    	                                                    }
    	                                                }
    	                                            } catch (e) {
    	                                                console.warn('[Indux Appwrite Auth] Failed to fetch user for pending invite:', e.message);
    	                                            }
    	                                        } else {
    	                                            console.warn('[Indux Appwrite Auth] Pending invite has no email and no userId');
    	                                        }
    	                                    }
    	                                }
    	                            } catch (e) {
    	                                // Silently continue if user lookup fails
    	                            }
    	                        }
    	                        // Ensure both properties are set for consistency
    	                        if (membership.email && !membership.userEmail) {
    	                            membership.userEmail = membership.email;
    	                        }
    	                        if (membership.userEmail && !membership.email) {
    	                            membership.email = membership.userEmail;
    	                        }
    	                    }
    	                    
    	                    // Normalize roles for display (filter "owner" if custom role replaces it)
    	                    if (this.normalizeRolesForDisplay) {
    	                        for (const membership of memberships) {
    	                            if (membership.roles && Array.isArray(membership.roles)) {
    	                                membership.displayRoles = await this.normalizeRolesForDisplay(membership.roles, teamId);
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Update currentTeamMemberships if this is the current team
    	                    // Use spread operator to create new array reference for Alpine reactivity
    	                    if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                        this.currentTeamMemberships = [...memberships];
    	                        // Refresh permission cache after loading memberships
    	                        if (this.refreshPermissionCache) {
    	                            await this.refreshPermissionCache();
    	                        }
    	                    }

    	                    return { success: true, memberships: memberships, total: result.total || 0 };
    	                } catch (error) {
    	                    // Handle "team not found" errors gracefully (e.g., team was just deleted)
    	                    if (error.message && error.message.includes('could not be found')) {
    	                        // Silently return empty memberships for deleted teams
    	                        if (this.currentTeam && this.currentTeam.$id === teamId) {
    	                            this.currentTeamMemberships = [];
    	                        }
    	                        return { success: true, memberships: [], total: 0 };
    	                    }
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                }
    	            };

    	            // Get membership
    	            store.getMembership = async function(teamId, membershipId) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to get membership details' };
    	                }

    	                try {
    	                    const result = await this._appwrite.teams.getMembership({
    	                        teamId: teamId,
    	                        membershipId: membershipId
    	                    });

    	                    return { success: true, membership: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                }
    	            };

    	            // Update membership roles
    	            store.updateMembership = async function(teamId, membershipId, roles) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to update membership' };
    	                }

    	                // Check if user has updateMembers permission (required for updating other members' roles)
    	                // Users can always update their own roles
    	                const isUpdatingSelf = this.user && this.currentTeamMemberships?.some(
    	                    m => m.$id === membershipId && m.userId === this.user.$id
    	                );
    	                
    	                if (!isUpdatingSelf) {
    	                    // Updating another member - requires permission
    	                    if (!this.hasTeamPermission || !await this.hasTeamPermission('updateMembers')) {
    	                        return { success: false, error: 'You do not have permission to update member roles' };
    	                    }
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Normalize roles for Appwrite (add "owner" if custom roles require it)
    	                    let normalizedRoles = roles;
    	                    if (this.normalizeRolesForAppwrite) {
    	                        normalizedRoles = await this.normalizeRolesForAppwrite(roles, teamId);
    	                    }

    	                    const result = await this._appwrite.teams.updateMembership({
    	                        teamId: teamId,
    	                        membershipId: membershipId,
    	                        roles: normalizedRoles
    	                    });

    	                    // Check if this was the current user's membership (before refreshing)
    	                    const isCurrentUser = this.user && result.membership && result.membership.userId === this.user.$id;

    	                    // Refresh memberships if this was the current team
    	                    if (this.currentTeam && this.currentTeam.$id === teamId && this.listMemberships) {
    	                        await this.listMemberships(teamId);
    	                    }
    	                    
    	                    // Refresh permission cache if this was the current user's membership
    	                    // (This must happen after listMemberships so currentTeamMemberships is updated)
    	                    if (isCurrentUser && this.currentTeam && this.currentTeam.$id === teamId && this.refreshPermissionCache) {
    	                        await this.refreshPermissionCache();
    	                    }

    	                    return { success: true, membership: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Accept team invitation
    	            store.acceptInvite = async function(teamId, membershipId, userId, secret) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    console.warn('[Indux Appwrite Auth] acceptInvite: User not authenticated');
    	                    return { success: false, error: 'You must be signed in to accept an invitation' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    const result = await this._appwrite.teams.updateMembershipStatus({
    	                        teamId: teamId,
    	                        membershipId: membershipId,
    	                        userId: userId,
    	                        secret: secret
    	                    });

    	                    // Refresh teams list to ensure the new team appears
    	                    if (this.listTeams) {
    	                        await this.listTeams();
    	                    } else {
    	                        console.warn('[Indux Appwrite Auth] acceptInvite: listTeams method not available');
    	                    }
    	                    
    	                    // If this is now the current team, refresh memberships
    	                    if (this.currentTeam && this.currentTeam.$id === teamId && this.listMemberships) {
    	                        await this.listMemberships(teamId);
    	                    }

    	                    return { success: true, membership: result };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Delete membership (leave team or remove member)
    	            store.deleteMembership = async function(teamId, membershipId) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                if (!this.isAuthenticated) {
    	                    return { success: false, error: 'You must be signed in to delete membership' };
    	                }

    	                // Check if user has removeMembers permission (unless removing themselves)
    	                // Note: Users can always leave a team themselves, but need permission to remove others
    	                const isRemovingSelf = this.user && this.currentTeamMemberships?.some(
    	                    m => m.$id === membershipId && m.userId === this.user.$id
    	                );
    	                
    	                if (!isRemovingSelf) {
    	                    // Removing another member - requires permission
    	                    if (!this.hasTeamPermission || !await this.hasTeamPermission('removeMembers')) {
    	                        return { success: false, error: 'You do not have permission to remove members' };
    	                    }
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    await this._appwrite.teams.deleteMembership({
    	                        teamId: teamId,
    	                        membershipId: membershipId
    	                    });

    	                    // Refresh memberships if this was the current team (do this first to update UI immediately)
    	                    if (this.currentTeam && this.currentTeam.$id === teamId && this.listMemberships) {
    	                        await this.listMemberships(teamId);
    	                    }
    	                    
    	                    // Refresh teams list (this will also trigger realtime updates for other users)
    	                    if (this.listTeams) {
    	                        await this.listTeams();
    	                    }

    	                    return { success: true };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeTeamsMembers();
    	    } catch (error) {
    	        // Failed to initialize teams members
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsMembers();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export members interface
    	window.InduxAppwriteAuthTeamsMembers = {
    	    initialize: initializeTeamsMembers
    	};



    	/* Auth teams - Callback handlers */

    	// Handle team invitation callbacks via events
    	function handleTeamCallbacks() {
    	    // Handle team invitation callback
    	    window.addEventListener('indux:auth:callback:team', async (event) => {
    	        const store = Alpine.store('auth');
    	        if (!store) {
    	            return;
    	        }
    	        
    	        const callbackInfo = event.detail;
    	        
    	        store.inProgress = true;
    	        store.error = null;

    	        try {
    	            // Accept the invitation
    	            if (store.acceptInvite) {
    	                const result = await store.acceptInvite(
    	                    callbackInfo.teamId,
    	                    callbackInfo.membershipId,
    	                    callbackInfo.userId,
    	                    callbackInfo.secret
    	                );

    	                if (result.success) {
    	                    window.dispatchEvent(new CustomEvent('indux:auth:team:invite-accepted', {
    	                        detail: { membership: result.membership }
    	                    }));
    	                } else {
    	                    store.error = result.error;
    	                }
    	            }
    	        } catch (error) {
    	            store.error = error.message;
    	        } finally {
    	            store.inProgress = false;
    	        }
    	    });
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        handleTeamCallbacks();
    	    } catch (error) {
    	        // Failed to initialize team callbacks
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        handleTeamCallbacks();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export callbacks interface
    	window.InduxAppwriteAuthTeamsCallbacks = {
    	    handleCallbacks: handleTeamCallbacks
    	};



    	/* Auth teams - Convenience methods for UI */

    	// Add convenience methods to auth store
    	function initializeTeamsConvenience() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store) {
    	            // Ensure cache properties are initialized (methods are already in store)
    	            if (!store._permissionCache) store._permissionCache = {};
    	            if (store._userRoleCache === undefined) store._userRoleCache = null;
    	            if (!store._allRolesCache) store._allRolesCache = null;
    	            if (!store._allRolesCacheByTeam) store._allRolesCacheByTeam = {};
    	            if (!store._userGeneratedRolesCache) store._userGeneratedRolesCache = {};
    	            
    	            // Update permission cache when team changes
    	            const updatePermissionCache = async function() {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    this._permissionCache = {};
    	                    this._userRoleCache = null;
    	                    this._allRolesCache = null;
    	                    this._userGeneratedRolesCache = {};
    	                    // Don't clear _allRolesCacheByTeam - keep cached roles for all teams
    	                    return;
    	                }
    	                
    	                const teamId = this.currentTeam.$id;
    	                const permissions = ['inviteMembers', 'updateMembers', 'removeMembers', 'renameTeam', 'deleteTeam', 'manageRoles'];
    	                
    	                // Cache permissions
    	                for (const perm of permissions) {
    	                    if (this.hasTeamPermission) {
    	                        const hasPerm = await this.hasTeamPermission(perm);
    	                        this._permissionCache[perm] = hasPerm;
    	                    } else {
    	                        this._permissionCache[perm] = false;
    	                    }
    	                }
    	                
    	                // Cache user role
    	                if (this.getUserRole) {
    	                    this._userRoleCache = await this.getUserRole();
    	                } else {
    	                    this._userRoleCache = null;
    	                }
    	                
    	                // Cache all roles
    	                if (this.getAllRoles) {
    	                    const allRoles = await this.getAllRoles(teamId);
    	                    // Create new object reference to ensure Alpine reactivity
    	                    const rolesCopy = allRoles ? { ...allRoles } : {};
    	                    this._allRolesCache = rolesCopy;
    	                    // Also cache by team ID for per-team lookups (create new object reference)
    	                    if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                    this._allRolesCacheByTeam[teamId] = { ...rolesCopy };
    	                    
    	                    // Pre-populate permanent role cache for all roles (for isRoleDeletable to work)
    	                    if (!this._rolePermanentCache) this._rolePermanentCache = {};
    	                    if (!this._rolePermanentCache[teamId]) this._rolePermanentCache[teamId] = {};
    	                    if (this.isRolePermanent) {
    	                        for (const roleName of Object.keys(rolesCopy)) {
    	                            // Pre-cache permanent status for all roles
    	                            await this.isRolePermanent(teamId, roleName);
    	                        }
    	                    }
    	                    
    	                    // Cache which roles are user-generated (always check, no feature flag needed)
    	                    this._userGeneratedRolesCache = {};
    	                    if (this._allRolesCache && this.isUserGeneratedRole) {
    	                        for (const roleName of Object.keys(this._allRolesCache)) {
    	                            this._userGeneratedRolesCache[roleName] = await this.isUserGeneratedRole(teamId, roleName);
    	                        }
    	                    }
    	                } else {
    	                    this._allRolesCache = {};
    	                    if (!this._allRolesCacheByTeam) this._allRolesCacheByTeam = {};
    	                    this._allRolesCacheByTeam[teamId] = {};
    	                }
    	            };
    	            
    	            // Public method to refresh permission cache
    	            if (!store.refreshPermissionCache) {
    	                store.refreshPermissionCache = async function() {
    	                    await updatePermissionCache.call(this);
    	                };
    	            }
    	            
    	            if (!store.createTeamFromName) {
    	            // Convenience method: create team using newTeamName property
    	            store.createTeamFromName = async function() {
    	                // Ensure newTeamName is a string and has content
    	                const teamNameValue = String(this.newTeamName || '').trim();
    	                if (!teamNameValue) {
    	                    return { success: false, error: 'Team name is required' };
    	                }
    	                
    	                const result = await this.createTeam(null, teamNameValue, []);
    	                if (result.success) {
    	                    this.newTeamName = ''; // Clear input
    	                }
    	                return result;
    	            };
    	            
    	            // Convenience method: update current team name using updateTeamNameInput property
    	            store.updateCurrentTeamName = async function() {
    	                if (!this.currentTeam || !this.currentTeam.$id) {
    	                    return { success: false, error: 'No team selected' };
    	                }
    	                
    	                // Ensure updateTeamNameInput is a string and has content
    	                const teamNameValue = String(this.updateTeamNameInput || '').trim();
    	                if (!teamNameValue) {
    	                    return { success: false, error: 'Team name is required' };
    	                }
    	                
    	                const teamId = this.currentTeam.$id;
    	                const result = await this.updateTeamName(teamId, teamNameValue);
    	                
    	                if (result.success) {
    	                    this.updateTeamNameInput = ''; // Clear input
    	                    // Note: updateTeamName() already calls listTeams() and updates currentTeam
    	                }
    	                return result;
    	            };
    	            
    	            // Convenience method: invite to current team using inviteEmail and inviteRoles properties
    	            store.inviteToCurrentTeam = async function() {
    	                if (!this.currentTeam) {
    	                    return { success: false, error: 'No team selected' };
    	                }
    	                
    	                // Ensure email is a string
    	                const email = String(this.inviteEmail || '').trim();
    	                
    	                // Email is required for invitations
    	                if (!email) {
    	                    return { success: false, error: 'Email is required' };
    	                }
    	                
    	                // Use inviteRoles array directly (already an array)
    	                const roles = Array.isArray(this.inviteRoles) 
    	                    ? this.inviteRoles.filter(r => r && typeof r === 'string')
    	                    : [];
    	                
    	                // If no roles specified, use empty array (will default to "owner" in inviteMember)
    	                const result = await this.inviteMember(this.currentTeam.$id, roles, email);
    	                if (result.success) {
    	                    this.inviteEmail = ''; // Clear inputs
    	                    this.inviteRoles = []; // Clear roles array
    	                    if (this.listMemberships) {
    	                        await this.listMemberships(this.currentTeam.$id); // Refresh memberships
    	                    }
    	                }
    	                return result;
    	            };
    	            
    	            // Role management methods for invite (similar to permission management)
    	            store.toggleInviteRole = function(roleName) {
    	                if (!roleName || typeof roleName !== 'string') return;
    	                if (!this.inviteRoles) this.inviteRoles = [];
    	                const index = this.inviteRoles.indexOf(roleName);
    	                if (index === -1) {
    	                    // Add role (create new array for reactivity)
    	                    this.inviteRoles = [...this.inviteRoles, roleName];
    	                } else {
    	                    // Remove role (create new array for reactivity)
    	                    this.inviteRoles = this.inviteRoles.filter(r => r !== roleName);
    	                }
    	            };
    	            
    	            store.isInviteRoleSelected = function(roleName) {
    	                if (!this.inviteRoles || !Array.isArray(this.inviteRoles)) return false;
    	                return this.inviteRoles.includes(roleName);
    	            };
    	            
    	            store.addCustomInviteRoles = function(inputValue) {
    	                if (!inputValue || typeof inputValue !== 'string') return;
    	                if (!this.inviteRoles) this.inviteRoles = [];
    	                
    	                // Parse comma-separated roles
    	                const newRoles = inputValue.split(',')
    	                    .map(r => r.trim())
    	                    .filter(r => r && typeof r === 'string');
    	                
    	                // Add each role if not already present
    	                const updated = [...this.inviteRoles];
    	                for (const role of newRoles) {
    	                    if (!updated.includes(role)) {
    	                        updated.push(role);
    	                    }
    	                }
    	                
    	                // Create new array reference for reactivity
    	                this.inviteRoles = updated;
    	            };
    	            
    	            store.clearInviteRoles = function() {
    	                this.inviteRoles = [];
    	            };
    	            
    	            // Member editing methods (for existing members)
    	            store.startEditingMember = async function(teamId, membershipId, currentRoles) {
    	                if (!teamId || !membershipId) return;
    	                
    	                // Initialize editing state
    	                this.editingMember = {
    	                    teamId: teamId,
    	                    membershipId: membershipId,
    	                    roles: Array.isArray(currentRoles) ? [...currentRoles] : []
    	                };
    	                
    	                // Initialize role selection with current roles
    	                this.inviteRoles = Array.isArray(currentRoles) ? [...currentRoles] : [];
    	            };
    	            
    	            store.cancelEditingMember = function() {
    	                this.editingMember = null;
    	                this.inviteRoles = [];
    	            };
    	            
    	            store.saveEditingMember = async function() {
    	                if (!this.editingMember) {
    	                    return { success: false, error: 'No member being edited' };
    	                }
    	                
    	                const { teamId, membershipId } = this.editingMember;
    	                const roles = Array.isArray(this.inviteRoles) 
    	                    ? this.inviteRoles.filter(r => r && typeof r === 'string')
    	                    : [];
    	                
    	                // Update membership roles (this will refresh memberships and permission cache if needed)
    	                const result = await this.updateMembership(teamId, membershipId, roles);
    	                
    	                if (result.success) {
    	                    this.cancelEditingMember();
    	                    // Note: updateMembership already refreshes memberships and permission cache
    	                }
    	                
    	                return result;
    	            };
    	            
    	            // Convenience method: delete/remove a member
    	            store.deleteMember = async function(teamId, membershipId) {
    	                if (!teamId || !membershipId) {
    	                    return { success: false, error: 'Team ID and membership ID are required' };
    	                }
    	                
    	                // Check permission
    	                if (!this.hasTeamPermissionSync || !this.hasTeamPermissionSync('removeMembers')) {
    	                    return { success: false, error: 'You do not have permission to remove members' };
    	                }
    	                
    	                const result = await this.deleteMembership(teamId, membershipId);
    	                return result;
    	            };
    	            
    	            // Convenience method: leave a team (user removes themselves)
    	            store.leaveTeam = async function(teamId, membershipId) {
    	                if (!teamId || !membershipId) {
    	                    return { success: false, error: 'Team ID and membership ID are required' };
    	                }
    	                
    	                // Verify this is the current user's membership
    	                const isCurrentUser = this.user && this.currentTeamMemberships?.some(
    	                    m => m.$id === membershipId && m.userId === this.user.$id
    	                );
    	                
    	                if (!isCurrentUser) {
    	                    return { success: false, error: 'You can only leave teams you are a member of' };
    	                }
    	                
    	                // Delete membership (users can always leave themselves)
    	                const result = await this.deleteMembership(teamId, membershipId);
    	                
    	                // If leaving the current team, clear it and select another team if available
    	                if (result.success && this.currentTeam && this.currentTeam.$id === teamId) {
    	                    this.currentTeam = null;
    	                    this.currentTeamMemberships = [];
    	                    
    	                    // Select the first available team if any remain
    	                    if (this.teams && this.teams.length > 0) {
    	                        const remainingTeam = this.teams.find(t => t.$id !== teamId);
    	                        if (remainingTeam) {
    	                            if (this.viewTeam) {
    	                                await this.viewTeam(remainingTeam);
    	                            } else {
    	                                this.currentTeam = remainingTeam;
    	                            }
    	                        }
    	                    }
    	                }
    	                
    	                return result;
    	            };
    	            
    	            // Convenience method: view team (sets current team and loads memberships)
    	            store.viewTeam = async function(team) {
    	                this.currentTeam = team;
    	                // Reset rename input to current team name when viewing a team
    	                if (team && team.name) {
    	                    this.updateTeamNameInput = team.name;
    	                } else {
    	                    this.updateTeamNameInput = '';
    	                }
    	                if (team && team.$id && this.listMemberships) {
    	                    const result = await this.listMemberships(team.$id);
    	                    if (result.success) {
    	                        this.currentTeamMemberships = result.memberships || [];
    	                    }
    	                }
    	                return { success: true };
    	            };
    	            
    	            // Check if current user is an owner of the current team
    	            store.isCurrentTeamOwner = function() {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return false;
    	                }
    	                const userMembership = this.currentTeamMemberships.find(
    	                    m => m.userId === this.user.$id
    	                );
    	                return userMembership && userMembership.roles && userMembership.roles.includes('owner');
    	            };
    	            
    	            // Check if a team can be deleted (checks both immutable status and permissions)
    	            store.isTeamDeletable = function(team) {
    	                if (!team || !team.$id) {
    	                    return false;
    	                }
    	                // Check if team is immutable/permanent
    	                if (this._teamImmutableCache && this._teamImmutableCache[team.$id]) {
    	                    return false;
    	                }
    	                // If checking current team, also check permissions
    	                if (this.currentTeam && this.currentTeam.$id === team.$id) {
    	                    return (this._permissionCache && this._permissionCache.deleteTeam) || false;
    	                }
    	                // For other teams, assume deletable if not immutable
    	                return true;
    	            };
    	            
    	            // Check if a team can be renamed (checks permissions for current team)
    	            store.isTeamRenamable = function(team) {
    	                if (!team || !team.$id) {
    	                    return false;
    	                }
    	                // If checking current team, check permissions
    	                if (this.currentTeam && this.currentTeam.$id === team.$id) {
    	                    return (this._permissionCache && this._permissionCache.renameTeam) || false;
    	                }
    	                // For other teams, assume renamable (permissions will be checked when team becomes current)
    	                return true;
    	            };
    	            
    	            // Check if a role can be deleted (checks if it's permanent) - synchronous version for Alpine
    	            store.isRoleDeletable = function(teamId, roleName) {
    	                if (!teamId || !roleName) {
    	                    return false;
    	                }
    	                // Permanent roles cannot be deleted
    	                if (this.isRolePermanentSync && this.isRolePermanentSync(teamId, roleName)) {
    	                    return false;
    	                }
    	                // Template roles and user-generated roles can be deleted
    	                return true;
    	            };
    	            
    	            // Check if a role is currently being edited - cleaner state check
    	            store.isRoleBeingEdited = function(teamId, roleName) {
    	                if (!this.editingRole || !teamId || !roleName) {
    	                    return false;
    	                }
    	                return this.editingRole.teamId === teamId && 
    	                       this.editingRole.oldRoleName === roleName;
    	            };
    	            
    	            // Permission convenience methods (synchronous for Alpine bindings)
    	            // Note: These override async versions from roles.js for use in Alpine bindings
    	            store.canManageRolesSync = function() {
    	                return this.hasTeamPermissionSync && this.hasTeamPermissionSync('manageRoles');
    	            };
    	            
    	            // Alias for cleaner HTML (overrides async version for Alpine bindings)
    	            store.canManageRoles = store.canManageRolesSync;
    	            
    	            store.canInviteMembers = function() {
    	                return this.hasTeamPermissionSync && this.hasTeamPermissionSync('inviteMembers');
    	            };
    	            
    	            store.canUpdateMembers = function() {
    	                return this.hasTeamPermissionSync && this.hasTeamPermissionSync('updateMembers');
    	            };
    	            
    	            store.canRemoveMembers = function() {
    	                return this.hasTeamPermissionSync && this.hasTeamPermissionSync('removeMembers');
    	            };
    	            
    	            store.canRenameTeam = function() {
    	                return this.hasTeamPermissionSync && this.hasTeamPermissionSync('renameTeam');
    	            };
    	            
    	            store.canDeleteTeam = function() {
    	                return this.hasTeamPermissionSync && this.hasTeamPermissionSync('deleteTeam');
    	            };
    	            
    	            // Combined action disabled check (combines inProgress and permission)
    	            store.isActionDisabled = function(permission) {
    	                if (this.inProgress) return true;
    	                if (permission && this.hasTeamPermissionSync) {
    	                    return !this.hasTeamPermissionSync(permission);
    	                }
    	                return false;
    	            };
    	            
    	            // Get member display name (extracts complex logic)
    	            store.getMemberDisplayName = function(membership) {
    	                if (!membership) return 'Unknown user';
    	                if (membership.userId === this.user?.$id) {
    	                    return this.user?.name || this.user?.email || 'You';
    	                }
    	                return membership.userName || 
    	                       membership.email || 
    	                       membership.userEmail || 
    	                       (membership.confirm === false ? 'Pending invitation' : 'Unknown user');
    	            };
    	            
    	            // Get member email (extracts complex logic)
    	            store.getMemberEmail = function(membership) {
    	                if (!membership) return 'No email';
    	                return membership.email || 
    	                       membership.userEmail || 
    	                       (membership.userId === this.user?.$id ? (this.user?.email || '') : '') || 
    	                       'No email';
    	            };
    	            
    	            // Get all available permissions (standard + custom from existing roles)
    	            store.getAllAvailablePermissions = async function(teamId) {
    	                const permissions = new Set();
    	                
    	                // Add standard owner permissions (from roles module)
    	                // These are defined in indux.appwrite.auth.teams.roles.js
    	                const standardPermissions = [
    	                    'inviteMembers',
    	                    'removeMembers',
    	                    'renameTeam',
    	                    'deleteTeam',
    	                    'manageRoles'
    	                ];
    	                standardPermissions.forEach(p => permissions.add(p));
    	                
    	                // Add permissions from existing roles in this team
    	                if (teamId && this.getAllRoles) {
    	                    const allRoles = await this.getAllRoles(teamId);
    	                    if (allRoles && typeof allRoles === 'object') {
    	                        for (const rolePermissions of Object.values(allRoles)) {
    	                            if (Array.isArray(rolePermissions)) {
    	                                rolePermissions.forEach(p => permissions.add(p));
    	                            }
    	                        }
    	                    }
    	                }
    	                
    	                // Also check permanent and template roles from config
    	                const config = window.InduxAppwriteAuthConfig;
    	                if (config) {
    	                    const appwriteConfig = await config.getAppwriteConfig();
    	                    const permanentRoles = appwriteConfig?.permanentRoles || {};
    	                    const templateRoles = appwriteConfig?.templateRoles || {};
    	                    
    	                    for (const rolePermissions of Object.values(permanentRoles)) {
    	                        if (Array.isArray(rolePermissions)) {
    	                            rolePermissions.forEach(p => permissions.add(p));
    	                        }
    	                    }
    	                    
    	                    for (const rolePermissions of Object.values(templateRoles)) {
    	                        if (Array.isArray(rolePermissions)) {
    	                            rolePermissions.forEach(p => permissions.add(p));
    	                        }
    	                    }
    	                }
    	                
    	                return Array.from(permissions).sort();
    	            };
    	            
    	            // Permission management methods for role creation
    	            store.togglePermission = function(permission) {
    	                if (!permission || typeof permission !== 'string') return;
    	                if (!this.newRolePermissions) this.newRolePermissions = [];
    	                const index = this.newRolePermissions.indexOf(permission);
    	                if (index === -1) {
    	                    // Add permission (create new array for reactivity)
    	                    this.newRolePermissions = [...this.newRolePermissions, permission];
    	                } else {
    	                    // Remove permission (create new array for reactivity)
    	                    this.newRolePermissions = this.newRolePermissions.filter(p => p !== permission);
    	                }
    	            };
    	            
    	            store.isPermissionSelected = function(permission) {
    	                if (!this.newRolePermissions || !Array.isArray(this.newRolePermissions)) return false;
    	                return this.newRolePermissions.includes(permission);
    	            };
    	            
    	            store.addCustomPermissions = function(inputValue) {
    	                if (!inputValue || typeof inputValue !== 'string') return;
    	                if (!this.newRolePermissions) this.newRolePermissions = [];
    	                
    	                // Parse comma-separated permissions
    	                const newPerms = inputValue.split(',')
    	                    .map(p => p.trim())
    	                    .filter(p => p && typeof p === 'string');
    	                
    	                // Add each permission if not already present
    	                const updated = [...this.newRolePermissions];
    	                for (const perm of newPerms) {
    	                    if (!updated.includes(perm)) {
    	                        updated.push(perm);
    	                    }
    	                }
    	                
    	                // Create new array reference for reactivity
    	                this.newRolePermissions = updated;
    	            };
    	            
    	            store.removePermission = function(permission) {
    	                if (!permission || !this.newRolePermissions || !Array.isArray(this.newRolePermissions)) return;
    	                this.newRolePermissions = this.newRolePermissions.filter(p => p !== permission);
    	            };
    	            
    	            store.clearPermissions = function() {
    	                this.newRolePermissions = [];
    	            };
    	            
    	            // Role editing methods (for existing roles)
    	            store.startEditingRole = async function(teamId, roleName) {
    	                if (!teamId || !roleName) return;
    	                
    	                // Get current role permissions
    	                const allRoles = this.allTeamRoles({ $id: teamId });
    	                const permissions = allRoles && allRoles[roleName] ? [...allRoles[roleName]] : [];
    	                
    	                // Ensure allAvailablePermissions is populated (for dropdown)
    	                if (!this.allAvailablePermissions || this.allAvailablePermissions.length === 0) {
    	                    if (this.getAllAvailablePermissions) {
    	                        await this.getAllAvailablePermissions(teamId);
    	                    }
    	                }
    	                
    	                // Set editing state
    	                this.editingRole = {
    	                    teamId: teamId,
    	                    oldRoleName: roleName,
    	                    newRoleName: roleName,
    	                    permissions: permissions
    	                };
    	                
    	                // Initialize permission selection with current permissions
    	                this.newRolePermissions = [...permissions];
    	            };
    	            
    	            store.cancelEditingRole = function() {
    	                this.editingRole = null;
    	                this.newRolePermissions = [];
    	            };
    	            
    	            store.saveEditingRole = async function() {
    	                if (!this.editingRole) {
    	                    return { success: false, error: 'No role being edited' };
    	                }
    	                
    	                const { teamId, oldRoleName, newRoleName } = this.editingRole;
    	                const permissions = Array.isArray(this.newRolePermissions) 
    	                    ? this.newRolePermissions.filter(p => p && typeof p === 'string')
    	                    : [];
    	                
    	                let result;
    	                
    	                // If name changed, rename the role
    	                if (oldRoleName !== newRoleName && newRoleName.trim()) {
    	                    result = await this.renameUserRole(teamId, oldRoleName, newRoleName.trim());
    	                    if (!result.success) {
    	                        return result;
    	                    }
    	                }
    	                
    	                // Update permissions (use new name if renamed, otherwise old name)
    	                const roleNameToUpdate = newRoleName.trim() || oldRoleName;
    	                result = await this.updateUserRole(teamId, roleNameToUpdate, permissions);
    	                
    	                if (result.success) {
    	                    this.cancelEditingRole();
    	                }
    	                
    	                return result;
    	            };
    	            
    	            // Format team date (createdAt or updatedAt)
    	            store.formatTeamDate = function(dateString) {
    	                if (!dateString) return '';
    	                try {
    	                    const date = new Date(dateString);
    	                    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    	                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    	                } catch (e) {
    	                    return dateString; // Return original if parsing fails
    	                }
    	            };
    	            
    	            // Get formatted createdAt for a team
    	            store.teamCreatedAt = function(team) {
    	                if (!team) return '';
    	                return this.formatTeamDate(team.$createdAt || team.createdAt);
    	            };
    	            
    	            // Get formatted updatedAt for a team
    	            store.teamUpdatedAt = function(team) {
    	                if (!team) return '';
    	                return this.formatTeamDate(team.$updatedAt || team.updatedAt);
    	            };
    	            
    	            // Get current user's roles in the current team
    	            store.getCurrentTeamRoles = function() {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return [];
    	                }
    	                const userMembership = this.currentTeamMemberships.find(
    	                    m => m.userId === this.user.$id
    	                );
    	                return userMembership?.roles || [];
    	            };
    	            
    	            // Check if current user has a specific permission in the current team
    	            // Uses role abstraction layer to check permissions based on custom roles
    	            store.hasTeamPermission = async function(permission) {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return false;
    	                }
    	                
    	                const userRoles = this.getCurrentTeamRoles();
    	                const teamId = this.currentTeam?.$id;
    	                if (this.hasPermission) {
    	                    return await this.hasPermission(userRoles, permission, teamId);
    	                }
    	                
    	                // Fallback: check owner role directly
    	                return userRoles.includes('owner');
    	            };
    	            
    	            // Synchronous version for Alpine.js bindings (uses permission cache)
    	            store.hasTeamPermissionSync = function(permission) {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return false;
    	                }
    	                
    	                // Use cached permissions if available (updated by updatePermissionCache)
    	                if (this._permissionCache && typeof this._permissionCache[permission] === 'boolean') {
    	                    return this._permissionCache[permission];
    	                }
    	                
    	                // Fallback: check if user has no custom roles (should have all permissions)
    	                // This matches the logic in hasPermission: if customRoles.length === 0, return true
    	                const userRoles = this.getCurrentTeamRoles();
    	                const customRoles = userRoles.filter(role => role !== 'owner');
    	                
    	                // If user has no custom roles (only "owner" or empty), grant all permissions
    	                // This handles users with "No Role" who should have all owner permissions
    	                if (customRoles.length === 0) {
    	                    return true;
    	                }
    	                
    	                // If user has custom roles but cache is missing, return false (shouldn't happen if cache is working)
    	                return false;
    	            };

    	            // Check if current user has a specific role
    	            store.hasRole = function(roleName) {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return false;
    	                }
    	                const userRoles = this.getCurrentTeamRoles();
    	                return userRoles.includes(roleName);
    	            };

    	            // Get current user's primary role in current team
    	            store.getUserRole = async function() {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return null;
    	                }
    	                const userRoles = this.getCurrentTeamRoles();
    	                const teamId = this.currentTeam?.$id;
    	                if (this.getPrimaryDisplayRole) {
    	                    return await this.getPrimaryDisplayRole(userRoles, teamId);
    	                }
    	                return userRoles[0] || null;
    	            };

    	            // Get current user's all roles in current team
    	            store.getUserRoles = async function() {
    	                if (!this.currentTeam || !this.currentTeamMemberships || !this.user) {
    	                    return [];
    	                }
    	                const userRoles = this.getCurrentTeamRoles();
    	                const teamId = this.currentTeam?.$id;
    	                if (this.normalizeRolesForDisplay) {
    	                    return await this.normalizeRolesForDisplay(userRoles, teamId);
    	                }
    	                return userRoles;
    	            };

    	            } // End of if (!store.createTeamFromName)
    	            
    	            // Note: hasPermission from roles module takes (userRoles, permission, teamId)
    	            // hasTeamPermission is the convenience wrapper for current team
    	            
    	            // Update cache when team is viewed (wrap existing viewTeam if it exists)
    	            if (store.viewTeam && !store._viewTeamWrapped) {
    	                const originalViewTeam = store.viewTeam;
    	                store.viewTeam = async function(team) {
    	                    const result = await originalViewTeam.call(this, team);
    	                    // Update cache after viewing team (which loads memberships)
    	                    if (updatePermissionCache) {
    	                        await updatePermissionCache.call(this);
    	                    }
    	                    // Update available permissions for autocomplete
    	                    if (this.getAllAvailablePermissions && team && team.$id) {
    	                        this.allAvailablePermissions = await this.getAllAvailablePermissions(team.$id);
    	                    }
    	                    return result;
    	                };
    	                store._viewTeamWrapped = true; // Prevent double-wrapping
    	            }
    	        } else if (!store) {
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeTeamsConvenience();
    	    } catch (error) {
    	        // Failed to initialize teams convenience
    	    }
    	});

    	// Also try immediately if Alpine is already available
    	if (typeof Alpine !== 'undefined') {
    	    try {
    	        initializeTeamsConvenience();
    	    } catch (error) {
    	        // Alpine might not be fully initialized yet, that's okay
    	    }
    	}

    	// Export convenience interface
    	window.InduxAppwriteAuthTeamsConvenience = {
    	    initialize: initializeTeamsConvenience
    	};



    	/* Auth anonymous */

    	// Add anonymous session methods to auth store
    	function initializeAnonymous() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store._createAnonymousSession) {
    	            // Add anonymous session method to store (internal, used by store itself)
    	            store._createAnonymousSession = async function() {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                // Check if guest sessions are enabled (auto or manual)
    	                if (!this._guestAuto && !this._guestManual) {
    	                    return { success: false, error: 'Guest sessions are not enabled' };
    	                }

    	                try {
    	                    const session = await this._appwrite.account.createAnonymousSession();
    	                    this.session = session;
    	                    this.user = await this._appwrite.account.get();
    	                    this.isAuthenticated = true;
    	                    this.isAnonymous = true;
    	                    
    	                    // Sync state to localStorage for cross-tab synchronization
    	                    if (this._syncStateToStorage) {
    	                        this._syncStateToStorage(this);
    	                    }

    	                    window.dispatchEvent(new CustomEvent('indux:auth:anonymous', {
    	                        detail: { user: this.user }
    	                    }));

    	                    return { success: true, user: this.user };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    this.isAuthenticated = false;
    	                    this.isAnonymous = false;
    	                    return { success: false, error: error.message };
    	                }
    	            };
    	        } else if (!store) {
    	            // Wait a bit more for store to initialize
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    // Start waiting after a short delay to ensure store is ready
    	    setTimeout(waitForStore, 100);
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeAnonymous();
    	    } catch (error) {
    	        // Failed to initialize anonymous
    	    }
    	});

    	// Export anonymous interface
    	window.InduxAppwriteAuthAnonymous = {
    	    initialize: initializeAnonymous
    	};

    	/* Auth magic links */

    	// Add magic link methods to auth store
    	function initializeMagicLinks() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.createMagicLink) {
    	            // Add magic link methods to store
    	            store.createMagicLink = async function(email, redirectUrl = window.location.href) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                // Don't allow magic link request if already signed in (non-anonymous)
    	                if (this.isAuthenticated && !this.isAnonymous) {
    	                    return { success: false, error: 'Already signed in. Please logout first.' };
    	                }

    	                // Check if magic links are enabled
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (appwriteConfig && !appwriteConfig.magic) {
    	                    return { success: false, error: 'Magic link authentication is not enabled' };
    	                }

    	                // Use origin + pathname for redirect URL to avoid query params
    	                // This prevents Appwrite from adding parameters to URLs that already have query strings
    	                const currentUrl = new URL(window.location.href);
    	                const cleanRedirectUrl = redirectUrl === window.location.href 
    	                    ? `${currentUrl.origin}${currentUrl.pathname}` 
    	                    : redirectUrl;

    	                this.inProgress = true;
    	                this.error = null;
    	                // Clear expired flag when requesting new link
    	                this.magicLinkExpired = false;

    	                try {
    	                    // Check if account method exists
    	                    if (!this._appwrite || !this._appwrite.account) {
    	                        return { success: false, error: 'Account instance not available' };
    	                    }

    	                    const account = this._appwrite.account;

    	                    // Try createMagicURLSession first (standard method)
    	                    if (typeof account.createMagicURLSession === 'function') {
    	                        const token = await account.createMagicURLSession('unique()', email, cleanRedirectUrl);
    	                        this.magicLinkSent = true;
    	                        this.magicLinkExpired = false;
    	                        this.error = null;
    	                        window.dispatchEvent(new CustomEvent('indux:auth:magic-link-sent', {
    	                            detail: { email }
    	                        }));
    	                        return { success: true, message: 'Magic link sent to email', token };
    	                    }
    	                    
    	                    // Fallback: try createMagicURLToken (alternative method name)
    	                    if (typeof account.createMagicURLToken === 'function') {
    	                        const token = await account.createMagicURLToken('unique()', email, redirectUrl);
    	                        this.magicLinkSent = true;
    	                        this.magicLinkExpired = false;
    	                        this.error = null;
    	                        window.dispatchEvent(new CustomEvent('indux:auth:magic-link-sent', {
    	                            detail: { email }
    	                        }));
    	                        return { success: true, message: 'Magic link sent to email', token };
    	                    }

    	                    // If neither method exists, return helpful error
    	                    return { 
    	                        success: false, 
    	                        error: 'Magic link method not available. Please ensure you are using the latest Appwrite SDK.' 
    	                    };
    	                } catch (error) {
    	                    this.error = error.message;
    	                    this.magicLinkSent = false;
    	                    this.magicLinkExpired = false;
    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };

    	            // Convenience method: send magic link and automatically clear email on success
    	            // Accepts: email input element, selector string, Alpine reactive object {email}, email string, or nothing (auto-find)
    	            store.sendMagicLink = async function(emailInputOrRef, redirectUrl = window.location.href) {
    	                let email = null;
    	                let emailInputElement = null;
    	                let emailDataObj = null;
    	                
    	                // If no argument provided, try to auto-find the email input
    	                if (emailInputOrRef === undefined || emailInputOrRef === null) {
    	                    // Try to find the email input in the current context
    	                    // First, try to find the closest email input relative to the event target
    	                    let eventTarget = null;
    	                    if (typeof window !== 'undefined' && window.event) {
    	                        eventTarget = window.event.target;
    	                    }
    	                    
    	                    // If we have an event target, look for email input in the same form/parent
    	                    if (eventTarget) {
    	                        const form = eventTarget.closest('form');
    	                        if (form) {
    	                            emailInputElement = form.querySelector('input[type="email"]');
    	                            if (emailInputElement) {
    	                                email = emailInputElement.value;
    	                            }
    	                        } else {
    	                            // Look for email input in the same parent container
    	                            const parent = eventTarget.parentElement;
    	                            if (parent) {
    	                                emailInputElement = parent.querySelector('input[type="email"]');
    	                                if (emailInputElement) {
    	                                    email = emailInputElement.value;
    	                                }
    	                            }
    	                        }
    	                    }
    	                    
    	                    // Fallback: find first email input in document
    	                    if (!emailInputElement) {
    	                        emailInputElement = document.querySelector('input[type="email"]');
    	                        if (emailInputElement) {
    	                            email = emailInputElement.value;
    	                        }
    	                    }
    	                }
    	                // Handle different input types
    	                else if (typeof emailInputOrRef === 'string') {
    	                    // Could be a selector or direct email string
    	                    // Try as selector first (most common case)
    	                    try {
    	                        const element = document.querySelector(emailInputOrRef);
    	                        if (element && (element.tagName === 'INPUT' && element.type === 'email')) {
    	                            emailInputElement = element;
    	                            email = element.value;
    	                        } else {
    	                            // Treat as direct email string
    	                            email = emailInputOrRef;
    	                        }
    	                    } catch (e) {
    	                        // Invalid selector, treat as email string
    	                        email = emailInputOrRef;
    	                    }
    	                } else if (emailInputOrRef && typeof emailInputOrRef === 'object') {
    	                    // Could be DOM element or Alpine reactive object
    	                    if (emailInputOrRef.tagName === 'INPUT' || emailInputOrRef.matches?.('input[type="email"]')) {
    	                        // DOM input element
    	                        emailInputElement = emailInputOrRef;
    	                        email = emailInputElement.value;
    	                    } else if ('email' in emailInputOrRef) {
    	                        // Alpine reactive object { email }
    	                        email = emailInputOrRef.email;
    	                        emailDataObj = emailInputOrRef;
    	                    } else {
    	                        return { success: false, error: 'Invalid email input. Provide an input element, selector, {email} object, email string, or nothing (auto-find).' };
    	                    }
    	                }
    	                
    	                if (!email || !email.trim()) {
    	                    return { success: false, error: 'Email is required' };
    	                }
    	                
    	                const result = await this.createMagicLink(email.trim(), redirectUrl);
    	                
    	                // Clear email on success
    	                if (result.success) {
    	                    // Use a microtask to ensure Alpine processes the update smoothly
    	                    Promise.resolve().then(() => {
    	                        if (emailInputElement) {
    	                            // Clear DOM input element
    	                            emailInputElement.value = '';
    	                            // Trigger input event for Alpine reactivity (if x-model is bound, it will update)
    	                            emailInputElement.dispatchEvent(new Event('input', { bubbles: true }));
    	                        } else if (emailDataObj) {
    	                            // Clear Alpine reactive object
    	                            emailDataObj.email = '';
    	                        }
    	                        // If we auto-found the input and it has x-model, the input event will update Alpine
    	                        // This handles the case where x-model="email" is bound to the input
    	                    });
    	                }
    	                
    	                return result;
    	            };

    	            // Handle magic link callback
    	            store.handleMagicLinkCallback = async function(userId, secret) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                this.inProgress = true;
    	                this.error = null;
    	                this.magicLinkExpired = false;
    	                this.magicLinkSent = false;

    	                try {
    	                    // Delete any existing anonymous sessions first
    	                    if (this.session && this.isAnonymous) {
    	                        try {
    	                            await this._appwrite.account.deleteSession(this.session.$id);
    	                        } catch (deleteError) {
    	                            // Could not delete anonymous session
    	                        }
    	                    }

    	                    // Create session from magic link credentials
    	                    const session = await this._appwrite.account.createSession(userId, secret);
    	                    this.session = session;
    	                    this.user = await this._appwrite.account.get();
    	                    this.isAuthenticated = true;
    	                    this.isAnonymous = false;
    	                    this.magicLinkSent = false;
    	                    this.magicLinkExpired = false;
    	                    this.error = null;

    	                    // Clear stored callback on success
    	                    try {
    	                        sessionStorage.removeItem('indux:magic-link:callback');
    	                    } catch (e) {
    	                        // Ignore
    	                    }

    	                    // Sync state
    	                    if (this._syncStateToStorage) {
    	                        this._syncStateToStorage(this);
    	                    }

    	                    // Load teams if enabled
    	                    const appwriteConfig = await config.getAppwriteConfig();
    	                    if (appwriteConfig?.teams && this.listTeams) {
    	                        try {
    	                            await this.listTeams();
    	                            // Auto-create default teams if enabled
    	                            if ((appwriteConfig.permanentTeams || appwriteConfig.templateTeams) && window.InduxAppwriteAuthTeamsDefaults?.ensureDefaultTeams) {
    	                                await window.InduxAppwriteAuthTeamsDefaults.ensureDefaultTeams(this);
    	                            }
    	                        } catch (teamsError) {
    	                            console.warn('[Indux Appwrite Auth] Failed to load teams after magic link login:', teamsError);
    	                            // Don't fail login if teams fail to load
    	                        }
    	                    }

    	                    window.dispatchEvent(new CustomEvent('indux:auth:login', {
    	                        detail: { user: this.user }
    	                    }));

    	                    return { success: true, user: this.user };
    	                } catch (error) {
    	                    // Categorize errors
    	                    const errorMessage = error.message || '';
    	                    const errorCode = error.code || error.statusCode || '';
    	                    const isRateLimit = errorCode === 429 || errorMessage.includes('Rate limit') || errorMessage.includes('429');
    	                    const isExpiredOrInvalid = !isRateLimit && errorMessage && (
    	                        errorMessage.includes('expired') ||
    	                        errorMessage.includes('Invalid token') ||
    	                        errorMessage.includes('invalid') ||
    	                        errorMessage.includes('not found') ||
    	                        errorMessage.includes('404') ||
    	                        errorMessage.includes('prohibited') ||
    	                        errorCode === 404
    	                    );

    	                    if (isRateLimit) {
    	                        // Store callback for retry
    	                        try {
    	                            sessionStorage.setItem('indux:magic-link:callback', JSON.stringify({ userId, secret }));
    	                        } catch (e) {
    	                            // Ignore
    	                        }
    	                        this.error = 'Rate limit exceeded. Please wait a moment and refresh the page.';
    	                        this.isAuthenticated = false;
    	                        this.isAnonymous = false;
    	                        this.magicLinkExpired = false;
    	                    } else if (isExpiredOrInvalid) {
    	                        try {
    	                            sessionStorage.removeItem('indux:magic-link:callback');
    	                        } catch (e) {
    	                            // Ignore
    	                        }
    	                        this.magicLinkExpired = true;
    	                        this.magicLinkSent = false;
    	                        this.error = null;
    	                    } else {
    	                        try {
    	                            sessionStorage.removeItem('indux:magic-link:callback');
    	                        } catch (e) {
    	                            // Ignore
    	                        }
    	                        this.error = error.message;
    	                        this.magicLinkExpired = false;
    	                        this.magicLinkSent = false;
    	                    }

    	                    this.isAuthenticated = false;
    	                    this.isAnonymous = false;
    	                    
    	                    // Sync state
    	                    if (this._syncStateToStorage) {
    	                        this._syncStateToStorage(this);
    	                    }

    	                    return { success: false, error: error.message };
    	                } finally {
    	                    this.inProgress = false;
    	                }
    	            };
    	        } else if (!store) {
    	            // Wait a bit more for store to initialize
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    // Start waiting after a short delay to ensure store is ready
    	    setTimeout(waitForStore, 100);
    	}

    	// Handle magic link callbacks via events
    	function handleMagicLinkCallbacks() {
    	    // Handle expired magic link
    	    window.addEventListener('indux:auth:callback:expired', async (event) => {
    	        const store = Alpine.store('auth');
    	        if (!store) return;
    	        
    	        event.detail;
    	        
    	        // Check if user is already authenticated - preserve session
    	        let hasExistingSession = false;
    	        if (store.isAuthenticated && store.user) {
    	            hasExistingSession = true;
    	        } else if (store._appwrite) {
    	            // Only check if we don't have existing state (prevents rate limits)
    	            try {
    	                const user = await store._appwrite.account.get();
    	                if (user) {
    	                    hasExistingSession = true;
    	                    store.user = user;
    	                    store.isAuthenticated = true;
    	                    // Try to get session info
    	                    try {
    	                        const sessionsResponse = await store._appwrite.account.listSessions();
    	                        const allSessions = sessionsResponse.sessions || [];
    	                        const currentSession = allSessions.find(s => s.current === true) || allSessions[0];
    	                        if (currentSession) {
    	                            store.session = currentSession;
    	                            store.isAnonymous = currentSession.provider === 'anonymous';
    	                        }
    	                    } catch (sessionError) {
    	                        // Session fetch failed, but user exists
    	                        console.warn('[Indux Appwrite Auth] Could not get session info:', sessionError);
    	                    }
    	                }
    	            } catch (userError) {
    	                // No existing session
    	                hasExistingSession = false;
    	            }
    	        }
    	        
    	        // Set expired flag (always true for expired links)
    	        store.magicLinkExpired = true;
    	        store.magicLinkSent = false;
    	        store.error = null;
    	        
    	        // Only clear state if no existing session
    	        if (!hasExistingSession) {
    	            store.isAuthenticated = false;
    	            store.isAnonymous = false;
    	            store.user = null;
    	            store.session = null;
    	        }
    	        
    	            store.inProgress = false;
    	        
    	        // Sync state
    	        if (store._syncStateToStorage) {
    	            store._syncStateToStorage(store);
    	        }
    	        
    	        // Force Alpine reactivity
    	        requestAnimationFrame(() => {
    	            const authStore = Alpine.store('auth');
    	            if (authStore) {
    	                void authStore.isAuthenticated;
    	                void authStore.magicLinkExpired;
    	                void authStore.user;
    	            }
    	        });
    	    });
    	    
    	    // Handle valid magic link callback
    	    window.addEventListener('indux:auth:callback:magic', async (event) => {
    	        const store = Alpine.store('auth');
    	        if (!store) return;
    	        
    	        const callbackInfo = event.detail;
    	        
    	        // Store callback for retry if rate limited
    	        try {
    	            sessionStorage.setItem('indux:magic-link:callback', JSON.stringify({ 
    	                userId: callbackInfo.userId, 
    	                secret: callbackInfo.secret 
    	            }));
    	        } catch (e) {
    	            console.warn('[Indux Appwrite Auth] Could not store callback:', e);
    	        }
    	        
    	        // Handle the callback
    	        await store.handleMagicLinkCallback(callbackInfo.userId, callbackInfo.secret);
    	    });
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeMagicLinks();
    	        handleMagicLinkCallbacks();
    	    } catch (error) {
    	        // Failed to initialize magic links
    	    }
    	});

    	// Export magic links interface
    	window.InduxAppwriteAuthMagicLinks = {
    	    initialize: initializeMagicLinks,
    	    handleCallbacks: handleMagicLinkCallbacks
    	};

    	/* Auth OAuth */

    	// Add OAuth methods to auth store
    	function initializeOAuth() {
    	    if (typeof Alpine === 'undefined') {
    	        return;
    	    }

    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Wait for store to be initialized
    	    const waitForStore = () => {
    	        const store = Alpine.store('auth');
    	        if (store && !store.loginOAuth) {
    	            // Add OAuth method to store
    	            // Note: Appwrite accepts any provider string (google, github, etc.) and validates on their side
    	            // No need to maintain a registry of supported providers
    	            store.loginOAuth = async function(provider, successUrl = window.location.href, failureUrl = window.location.href) {
    	                if (!this._appwrite) {
    	                    this._appwrite = await config.getAppwriteClient();
    	                }
    	                if (!this._appwrite) {
    	                    return { success: false, error: 'Appwrite not configured' };
    	                }

    	                // Check if OAuth is enabled
    	                const appwriteConfig = await config.getAppwriteConfig();
    	                if (appwriteConfig && !appwriteConfig.oauth) {
    	                    return { success: false, error: 'OAuth authentication is not enabled' };
    	                }

    	                // Use origin + pathname for success/failure URLs to avoid query params
    	                const currentUrl = new URL(window.location.href);
    	                const cleanSuccessUrl = `${currentUrl.origin}${currentUrl.pathname}`;
    	                const cleanFailureUrl = `${currentUrl.origin}${currentUrl.pathname}`;

    	                // Delete any existing anonymous sessions before OAuth
    	                // This prevents conflicts where anonymous sessions might interfere with OAuth
    	                // Appwrite will create a new account for OAuth if needed
    	                if (this.isAnonymous && this.session) {
    	                    try {
    	                        await this._appwrite.account.deleteSession(this.session.$id);
    	                        this.session = null;
    	                        this.user = null;
    	                        this.isAuthenticated = false;
    	                        this.isAnonymous = false;
    	                    } catch (error) {
    	                        console.warn('[Indux Appwrite Auth] Failed to delete anonymous session before OAuth:', error);
    	                        // Continue anyway - OAuth should still work
    	                    }
    	                }

    	                // Set flag in sessionStorage to detect OAuth callback (cleared after callback)
    	                sessionStorage.setItem('indux:oauth:redirect', 'true');
    	                
    	                // Store the provider name so we can retrieve it after callback
    	                // session.provider returns "oauth2" generically, but we know the specific provider
    	                this._oauthProvider = provider;
    	                // Use localStorage for provider (persists across redirects, cleared on logout)
    	                // sessionStorage can be cleared by some browsers during OAuth redirects
    	                try {
    	                    localStorage.setItem('indux:oauth:provider', provider);
    	                } catch (e) {
    	                    // Fallback to sessionStorage if localStorage fails
    	                    sessionStorage.setItem('indux:oauth:provider', provider);
    	                }

    	                this.inProgress = true;
    	                this.error = null;

    	                try {
    	                    // Use createOAuth2Token (like the working implementation)
    	                    // This returns a token/redirect URL that we manually navigate to
    	                    // After OAuth, Appwrite redirects back with userId and secret in URL params
    	                    const token = await this._appwrite.account.createOAuth2Token(
    	                        provider,
    	                        cleanSuccessUrl,
    	                        cleanFailureUrl,
    	                        ['email'] // Scopes
    	                    );
    	                    
    	                    // Check for redirectUrl - Appwrite may return it in various formats
    	                    // Try multiple property names and formats
    	                    let redirectUrl = null;
    	                    
    	                    if (typeof token === 'string') {
    	                        redirectUrl = token;
    	                    } else if (token?.redirectUrl) {
    	                        redirectUrl = token.redirectUrl;
    	                    } else if (token?.url) {
    	                        redirectUrl = token.url;
    	                    } else if (token && typeof token === 'object') {
    	                        // Try to find any URL-like property in the object
    	                        const possibleUrl = Object.values(token).find(v => typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')));
    	                        if (possibleUrl) {
    	                            redirectUrl = possibleUrl;
    	                        }
    	                    }
    	                    
    	                    // Clear error state before redirect (whether we found URL or not)
    	                    // This prevents any error flash before redirect
    	                    this.error = null;
    	                    
    	                    if (redirectUrl) {
    	                        // Use requestAnimationFrame to ensure Alpine processes the error clearing
    	                        // before redirect happens, preventing error flash
    	                        requestAnimationFrame(() => {
    	                            window.location.href = redirectUrl;
    	                        });
    	                        // Return immediately - redirect will happen asynchronously
    	                        return { success: true, redirectUrl: redirectUrl };
    	                    } else {
    	                        // If we can't find redirect URL, log it but don't show error to user
    	                        // The redirect might still work via Appwrite's internal handling
    	                        console.warn('[Indux Appwrite Auth] Could not extract redirect URL from token:', token);
    	                        // Don't set error - just return failure silently
    	                        // This prevents error flash when redirect might still succeed
    	                        this.inProgress = false;
    	                        return { success: false, error: 'Could not extract redirect URL' };
    	                    }
    	                } catch (error) {
    	                    // Don't show "No redirect URL" errors - they're usually false positives
    	                    // Only show other meaningful errors
    	                    if (!error.message.includes('No redirect URL') && !error.message.includes('redirect')) {
    	                        this.error = error.message;
    	                        this.inProgress = false;
    	                    } else {
    	                        // For redirect-related errors, just log and don't show to user
    	                        console.warn('[Indux Appwrite Auth] OAuth redirect error (suppressed from UI):', error.message);
    	                        this.error = null;
    	                        this.inProgress = false;
    	                    }
    	                    return { success: false, error: error.message };
    	                }
    	            };
    	        } else if (!store) {
    	            // Wait a bit more for store to initialize
    	            setTimeout(waitForStore, 50);
    	        }
    	    };

    	    // Start waiting after a short delay to ensure store is ready
    	    setTimeout(waitForStore, 100);
    	}

    	// Handle OAuth callbacks via events
    	function handleOAuthCallbacks() {
    	    // Handle OAuth callback
    	    window.addEventListener('indux:auth:callback:oauth', async (event) => {
    	        const store = Alpine.store('auth');
    	        if (!store) return;
    	        
    	        const callbackInfo = event.detail;
    	        
    	        // Clear OAuth redirect flag
    	        sessionStorage.removeItem('indux:oauth:redirect');
    	        
    	        // Restore OAuth provider name from localStorage (set during loginOAuth)
    	        // Try localStorage first (persists across redirects), fallback to sessionStorage
    	        let storedProvider = null;
    	        try {
    	            storedProvider = localStorage.getItem('indux:oauth:provider');
    	        } catch (e) {
    	            // If localStorage fails, try sessionStorage
    	            storedProvider = sessionStorage.getItem('indux:oauth:provider');
    	        }
    	        if (storedProvider) {
    	            store._oauthProvider = storedProvider;
    	            // Keep it in localStorage (cleared on logout)
    	            // This allows us to show the correct provider name even after page refresh
    	        } else {
    	            console.warn('[Indux Appwrite Auth] No OAuth provider found in storage');
    	        }
    	        
    	        // OAuth uses userId/secret just like magic links - create session manually
    	        // The "prohibited" error means session already exists, so try to fetch user first
    	        if (!store._appwrite) {
    	            store._appwrite = await window.InduxAppwriteAuthConfig.getAppwriteClient();
    	        }
    	        
    	        if (!store._appwrite) {
    	            store.error = 'Appwrite not configured';
    	            return;
    	        }
    	        
    	        store.inProgress = true;
    	        store.error = null;
    	        store.magicLinkExpired = false;
    	        store.magicLinkSent = false;
    	        
    	        try {
    	            // Delete any existing anonymous sessions first
    	            if (store.session && store.isAnonymous) {
    	                try {
    	                    await store._appwrite.account.deleteSession(store.session.$id);
    	                } catch (deleteError) {
    	                    // Could not delete anonymous session
    	                }
    	            }
    	            
    	            // Try to create session from OAuth credentials
    	            try {
    	                const session = await store._appwrite.account.createSession(callbackInfo.userId, callbackInfo.secret);
    	                store.session = session;
    	                store.user = await store._appwrite.account.get();
    	                store.isAuthenticated = true;
    	                store.isAnonymous = false;
    	                store.magicLinkSent = false;
    	                store.magicLinkExpired = false;
    	                store.error = null;
    	            } catch (createError) {
    	                // If "prohibited" error, session already exists - just fetch user
    	                const isProhibited = createError.message?.includes('prohibited');
    	                if (isProhibited) {
    	                    store.user = await store._appwrite.account.get();
    	                    try {
    	                        const sessionsResponse = await store._appwrite.account.listSessions();
    	                        const allSessions = sessionsResponse.sessions || [];
    	                        const oauthSession = allSessions.find(s => s.provider !== 'anonymous' && s.provider !== 'magic-url') || allSessions.find(s => s.current === true);
    	                        if (oauthSession) {
    	                            store.session = oauthSession;
    	                        } else if (allSessions.length > 0) {
    	                            store.session = allSessions[0];
    	                        } else {
    	                            store.session = await store._appwrite.account.getSession('current');
    	                        }
    	                    } catch (sessionError) {
    	                        console.warn('[Indux Appwrite Auth] Could not get session info:', sessionError);
    	                    }
    	                    store.isAuthenticated = true;
    	                    store.isAnonymous = false;
    	                    store.magicLinkSent = false;
    	                    store.magicLinkExpired = false;
    	                    store.error = null;
    	                } else {
    	                    throw createError;
    	                }
    	            }
    	            
    	            // Sync state
    	            if (store._syncStateToStorage) {
    	                store._syncStateToStorage(store);
    	            }
    	            
    	            // Load teams if enabled
    	            const appwriteConfig = await window.InduxAppwriteAuthConfig.getAppwriteConfig();
    	            if (appwriteConfig?.teams && store.listTeams) {
    	                try {
    	                    await store.listTeams();
    	                    // Auto-create default teams if enabled
    	                    if ((appwriteConfig.permanentTeams || appwriteConfig.templateTeams) && window.InduxAppwriteAuthTeamsDefaults?.ensureDefaultTeams) {
    	                        await window.InduxAppwriteAuthTeamsDefaults.ensureDefaultTeams(store);
    	                    }
    	                } catch (teamsError) {
    	                    console.warn('[Indux Appwrite Auth] Failed to load teams after OAuth login:', teamsError);
    	                    // Don't fail login if teams fail to load
    	                }
    	            }
    	            
    	            window.dispatchEvent(new CustomEvent('indux:auth:login', {
    	                detail: { user: store.user }
    	            }));
    	        } catch (error) {
    	            store.error = error.message;
    	            store.isAuthenticated = false;
    	            store.isAnonymous = false;
    	            
    	            // Sync state
    	            if (store._syncStateToStorage) {
    	                store._syncStateToStorage(store);
    	            }
    	        } finally {
    	            store.inProgress = false;
    	        }
    	    });
    	}

    	// Initialize when Alpine is ready
    	document.addEventListener('alpine:init', () => {
    	    try {
    	        initializeOAuth();
    	        handleOAuthCallbacks();
    	    } catch (error) {
    	        // Failed to initialize OAuth
    	    }
    	});

    	// Export OAuth interface
    	window.InduxAppwriteAuthOAuth = {
    	    initialize: initializeOAuth,
    	    handleCallbacks: handleOAuthCallbacks
    	};

    	/* Auth callbacks */

    	// Handle authentication callbacks from URL parameters
    	// This module coordinates callback detection and delegates to method-specific handlers

    	function initializeCallbacks() {
    	    const config = window.InduxAppwriteAuthConfig;
    	    if (!config) {
    	        return;
    	    }

    	    // Check for callback in URL or sessionStorage
    	    function detectCallback() {
    	        const urlParams = new URLSearchParams(window.location.search);
    	        const userId = urlParams.get('userId');
    	        const secret = urlParams.get('secret');
    	        const expire = urlParams.get('expire');
    	        
    	        // Check for stored callback (from rate limit retry)
    	        let storedCallback = null;
    	        try {
    	            const stored = sessionStorage.getItem('indux:magic-link:callback');
    	            if (stored) {
    	                storedCallback = JSON.parse(stored);
    	            }
    	        } catch (e) {
    	            // Ignore parse errors
    	        }
    	        
    	        // Check OAuth redirect flag
    	        const isOAuthCallback = sessionStorage.getItem('indux:oauth:redirect') === 'true';
    	        
    	        // Check for team invitation (teamId and membershipId in URL)
    	        const teamId = urlParams.get('teamId');
    	        const membershipId = urlParams.get('membershipId');
    	        const isTeamInvite = !!(teamId && membershipId && userId && secret);
    	        
    	        const callbackInfo = {
    	            userId: userId || storedCallback?.userId,
    	            secret: secret || storedCallback?.secret,
    	            expire: expire,
    	            teamId: teamId,
    	            membershipId: membershipId,
    	            isOAuth: isOAuthCallback,
    	            isTeamInvite: isTeamInvite,
    	            hasCallback: !!(userId || storedCallback?.userId) && !!(secret || storedCallback?.secret),
    	            hasExpired: !!expire && !userId && !secret
    	        };
    	        
    	        return callbackInfo;
    	    }

    	    // Clean up URL parameters
    	    function cleanupUrl() {
    	        const url = new URL(window.location.href);
    	        const paramsToRemove = ['userId', 'secret', 'expire', 'project', 'teamId', 'membershipId'];
    	        paramsToRemove.forEach(param => {
    	            while (url.searchParams.has(param)) {
    	                url.searchParams.delete(param);
    	            }
    	        });
    	        url.hash = '';
    	        window.history.replaceState({}, '', url.toString());
    	    }

    	    // Process callback - delegates to method-specific handlers
    	    async function processCallback(callbackInfo) {
    	        const store = Alpine.store('auth');
    	        if (!store || !store._appwrite) {
    	            return { handled: false };
    	        }

    	        store._appwrite;

    	        // Clean up URL immediately
    	        cleanupUrl();

    	        // Handle expired magic link
    	        if (callbackInfo.hasExpired) {
    	            // Dispatch event for magic link handler
    	            window.dispatchEvent(new CustomEvent('indux:auth:callback:expired', {
    	                detail: callbackInfo
    	            }));
    	            return { handled: true, type: 'expired' };
    	        }

    	        // Handle valid callback (userId + secret)
    	        if (callbackInfo.hasCallback) {
    	            if (callbackInfo.isTeamInvite) {
    	                // Team invitation callback - dispatch event
    	                window.dispatchEvent(new CustomEvent('indux:auth:callback:team', {
    	                    detail: callbackInfo
    	                }));
    	                return { handled: true, type: 'team' };
    	            } else if (callbackInfo.isOAuth) {
    	                // OAuth callback - dispatch event
    	                window.dispatchEvent(new CustomEvent('indux:auth:callback:oauth', {
    	                    detail: callbackInfo
    	                }));
    	                return { handled: true, type: 'oauth' };
    	            } else {
    	                // Magic link callback - dispatch event
    	                window.dispatchEvent(new CustomEvent('indux:auth:callback:magic', {
    	                    detail: callbackInfo
    	                }));
    	                return { handled: true, type: 'magic' };
    	            }
    	        }

    	        return { handled: false };
    	    }

    	    // Export callback detection and processing
    	    window.InduxAppwriteAuthCallbacks = {
    	        detect: detectCallback,
    	        process: processCallback,
    	        cleanupUrl
    	    };
    	}

    	// Initialize when config is available
    	if (window.InduxAppwriteAuthConfig) {
    	    initializeCallbacks();
    	} else {
    	    document.addEventListener('DOMContentLoaded', () => {
    	        if (window.InduxAppwriteAuthConfig) {
    	            initializeCallbacks();
    	        }
    	    });
    	}
    	return indux_appwrite_auth;
    }

    requireIndux_appwrite_auth();

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
            event.detail.locale;
            
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

        // Create a simple fallback object that returns empty strings for all properties
        // This prevents infinite recursion by not using a Proxy for nested property access
        function createSimpleFallback() {
            const fallback = Object.create(null);
            
            // Add primitive conversion methods directly to the object
            fallback[Symbol.toPrimitive] = function(hint) {
                return hint === 'number' ? 0 : '';
            };
            fallback.valueOf = function() { return ''; };
            fallback.toString = function() { return ''; };
            
            // Add route() function that returns the fallback for chaining
            fallback.route = function(pathKey) {
                return fallback;
            };
            
            // For array-like properties, add length
            Object.defineProperty(fallback, 'length', {
                value: 0,
                writable: false,
                enumerable: false,
                configurable: false
            });
            
            // Make Symbol.toPrimitive non-enumerable and directly on the object
            Object.defineProperty(fallback, Symbol.toPrimitive, {
                value: function(hint) {
                    return hint === 'number' ? 0 : '';
                },
                writable: false,
                enumerable: false,
                configurable: false
            });
            
            // Use Proxy only for the initial access - but return the plain object for nested accesses
            return new Proxy(fallback, {
                get(target, key) {
                    // Handle special keys that shouldn't trigger recursion
                    if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally' ||
                        key === Symbol.toStringTag || key === Symbol.hasInstance) {
                        return undefined;
                    }

                    // Handle constructor and prototype
                    if (key === 'constructor' || key === '__proto__' || key === 'prototype') {
                        return undefined;
                    }

                    // If the key exists on the target (like route, toString, valueOf, length, Symbol.toPrimitive), return it
                    if (key in target || key === Symbol.toPrimitive) {
                        const value = target[key];
                        if (value !== undefined) {
                            return value;
                        }
                    }

                    // For any other property access, return the plain target object (not the proxy)
                    // This prevents recursion because accessing properties on the plain object won't trigger this proxy's getter
                    // The plain object will return undefined for missing properties, which Alpine will handle
                    return target;
                },
                has(target, key) {
                    // Make all string keys appear to exist to prevent Alpine from trying to access them
                    if (typeof key === 'string') {
                        return true;
                    }
                    return key in target || key === Symbol.toPrimitive;
                }
            });
        }
        
        // Create a cached singleton fallback object
        let cachedLoadingProxy = null;
        
        // Create a safe proxy for loading state
        function createLoadingProxy() {
            // Reuse cached fallback for all nested property accesses
            if (!cachedLoadingProxy) {
                cachedLoadingProxy = createSimpleFallback();
            }
            return cachedLoadingProxy;
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
                    document.documentElement.lang || Alpine.store('locale')?.current || 'en';

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
                                            return createRouteProxy(target, pathKey);
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

    /* Indux Dropdowns */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeDropdownPlugin() {
        // Ensure Alpine.js context exists for directives to work
        function ensureAlpineContext() {
            const body = document.body;
            if (!body.hasAttribute('x-data')) {
                body.setAttribute('x-data', '{}');
            }
        }

        // Helper to register directives
        function registerDirective(name, handler) {
            Alpine.directive(name, handler);
        }

        // Ensure Alpine.js context exists
        ensureAlpineContext();

        // Register dropdown directive
        registerDirective('dropdown', (el, { modifiers, expression }, { effect, evaluateLater }) => {
            let menu;

            // Shared hover state for all dropdown types
            let hoverTimeout;
            let autoCloseTimeout;
            let startAutoCloseTimer;

            effect(() => {

                // Defer processing to ensure Alpine is fully ready
                setTimeout(() => {
                    if (!window.Alpine) {
                        console.warn('[Indux] Alpine not available for dropdown processing');
                        return;
                    }

                    // Generate a unique anchor code for positioning
                    const anchorCode = Math.random().toString(36).substr(2, 9);

                    // Evaluate the expression to get the actual menu ID
                    let dropdownId;
                    if (expression) {
                        // Check if expression contains template literals or is a static string
                        if (expression.includes('${') || expression.includes('`')) {
                            // Use evaluateLater for dynamic expressions
                            const evaluator = evaluateLater(expression);
                            evaluator(value => {
                                dropdownId = value;
                            });
                        } else {
                            // Static string - use as-is
                            dropdownId = expression;
                        }
                    } else {
                        dropdownId = `dropdown-${anchorCode}`;
                    }

                    // Check if expression refers to a template ID
                    if (dropdownId && document.getElementById(dropdownId)?.tagName === 'TEMPLATE') {
                        // Clone template content and generate unique ID
                        const template = document.getElementById(dropdownId);
                        menu = template.content.cloneNode(true).firstElementChild;
                        const uniqueDropdownId = `dropdown-${anchorCode}`;
                        menu.setAttribute('id', uniqueDropdownId);
                        document.body.appendChild(menu);
                        el.setAttribute('popovertarget', uniqueDropdownId);

                        // Initialize Alpine on the cloned menu
                        Alpine.initTree(menu);
                    } else {
                        // Original behavior for static dropdowns
                        menu = document.getElementById(dropdownId);
                        if (!menu) {
                            // Check if this might be a component-based dropdown
                            if (window.InduxComponentsRegistry && window.InduxComponentsLoader) {
                                // Try to find the menu in components
                                const componentName = dropdownId; // Assume the dropdownId is the component name
                                const registry = window.InduxComponentsRegistry;
                                
                                if (registry.registered.has(componentName)) {
                                    // Component exists, wait for it to be loaded
                                    const waitForComponent = async () => {
                                        const loader = window.InduxComponentsLoader;
                                        const content = await loader.loadComponent(componentName);
                                        if (content) {
                                            // Create a temporary container to parse the component
                                            const tempDiv = document.createElement('div');
                                            tempDiv.innerHTML = content.trim();
                                            const menuElement = tempDiv.querySelector(`#${dropdownId}`);
                                            
                                            if (menuElement) {
                                                // Clone the menu and append to body
                                                menu = menuElement.cloneNode(true);
                                                menu.setAttribute('id', dropdownId);
                                                document.body.appendChild(menu);
                                                el.setAttribute('popovertarget', dropdownId);
                                                
                                                // Initialize Alpine on the menu
                                                Alpine.initTree(menu);
                                                
                                                // Set up the dropdown after menu is ready
                                                setupDropdown();
                                            } else {
                                                console.warn(`[Indux] Menu with id "${dropdownId}" not found in component "${componentName}"`);
                                            }
                                        } else {
                                            console.warn(`[Indux] Failed to load component "${componentName}" for dropdown`);
                                        }
                                    };
                                    
                                    // Wait for components to be ready, then try to load
                                    if (window.__induxComponentsInitialized) {
                                        waitForComponent();
                                    } else {
                                        window.addEventListener('indux:components-ready', waitForComponent);
                                    }
                                    return; // Exit early, setup will happen in waitForComponent
                                }
                            }
                            
                            console.warn(`[Indux] Dropdown menu with id "${dropdownId}" not found`);
                            return;
                        }
                        el.setAttribute('popovertarget', dropdownId);
                    }

                    // Set up the dropdown
                    setupDropdown();

                    function setupDropdown() {
                        if (!menu) return;
                        
                        // Set up popover
                        menu.setAttribute('popover', '');

                        // Set up anchor positioning
                        const anchorName = `--dropdown-${anchorCode}`;
                        el.style.setProperty('anchor-name', anchorName);
                        menu.style.setProperty('position-anchor', anchorName);

                        // Set up hover functionality after menu is ready
                        if (modifiers.includes('hover')) {
                        const handleShowPopover = () => {
                            if (menu && !menu.matches(':popover-open')) {
                                clearTimeout(hoverTimeout);
                                clearTimeout(autoCloseTimeout);
                                
                                menu.showPopover();
                            }
                        };

                        // Enhanced auto-close when mouse leaves both trigger and menu
                        startAutoCloseTimer = () => {
                            clearTimeout(autoCloseTimeout);
                            autoCloseTimeout = setTimeout(() => {
                                if (menu?.matches(':popover-open')) {
                                    const isOverButton = el.matches(':hover');
                                    const isOverMenu = menu.matches(':hover');
                                    
                                    if (!isOverButton && !isOverMenu) {
                                        menu.hidePopover();
                                    }
                                }
                            }, 300); // Small delay to prevent accidental closes
                        };

                        el.addEventListener('mouseenter', handleShowPopover);
                        el.addEventListener('mouseleave', startAutoCloseTimer);
                    }



                    // Add keyboard navigation handling
                    menu.addEventListener('keydown', (e) => {
                        // Get all navigable elements (traditional focusable + li elements)
                        const allElements = menu.querySelectorAll(
                            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), li'
                        );
                        const currentIndex = Array.from(allElements).indexOf(e.target);

                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const nextIndex = (currentIndex + 1) % allElements.length;
                            const nextElement = allElements[nextIndex];
                            if (nextElement.tagName === 'LI') {
                                nextElement.setAttribute('tabindex', '0');
                            }
                            nextElement.focus();
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prevIndex = (currentIndex - 1 + allElements.length) % allElements.length;
                            const prevElement = allElements[prevIndex];
                            if (prevElement.tagName === 'LI') {
                                prevElement.setAttribute('tabindex', '0');
                            }
                            prevElement.focus();
                        } else if (e.key === 'Tab') {
                            // Get only traditional focusable elements for tab navigation
                            const focusable = menu.querySelectorAll(
                                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                            );

                            // If we're on the last focusable element and tabbing forward
                            if (!e.shiftKey && e.target === focusable[focusable.length - 1]) {
                                e.preventDefault();
                                menu.hidePopover();
                                // Focus the next focusable element after the dropdown trigger
                                const allFocusable = document.querySelectorAll(
                                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                                );
                                const triggerIndex = Array.from(allFocusable).indexOf(el);
                                const nextElement = allFocusable[triggerIndex + 1];
                                if (nextElement) nextElement.focus();
                            }

                            // If we're on the first element and tabbing backward
                            if (e.shiftKey && e.target === focusable[0]) {
                                menu.hidePopover();
                            }
                        } else if (e.key === 'Escape') {
                            menu.hidePopover();
                            el.focus();
                        } else if (e.key === 'Enter' || e.key === ' ') {
                            // Allow Enter/Space to activate li elements or follow links
                            if (e.target.tagName === 'LI') {
                                const link = e.target.querySelector('a');
                                if (link) {
                                    e.preventDefault();
                                    link.click();
                                }
                            }
                        }
                    });

                    // Make li elements focusable when menu opens
                    menu.addEventListener('toggle', (e) => {
                        if (e.newState === 'open') {
                            // Set up li elements for keyboard navigation
                            const liElements = menu.querySelectorAll('li');
                            liElements.forEach((li, index) => {
                                if (!li.hasAttribute('tabindex')) {
                                    li.setAttribute('tabindex', '-1');
                                }
                                // Focus first li element if no other focusable elements
                                if (index === 0 && !menu.querySelector('button, [href], input, select, textarea, [tabindex="0"]')) {
                                    li.setAttribute('tabindex', '0');
                                    li.focus();
                                }
                            });
                        }
                    });

                    // Add hover functionality for menu
                    if (modifiers.includes('hover')) {
                        // Simple approach: any mouse activity in the menu area cancels close timer
                        menu.addEventListener('mouseenter', () => {
                            clearTimeout(autoCloseTimeout);
                            clearTimeout(hoverTimeout);
                        });

                        menu.addEventListener('mouseleave', () => {
                            // Always start timer when leaving menu bounds
                            if (startAutoCloseTimer) {
                                startAutoCloseTimer();
                            }
                        });

                        // Add event listeners to all interactive elements inside menu to cancel timers
                        const cancelCloseTimer = () => {
                            clearTimeout(autoCloseTimeout);
                        };

                        // Set up listeners on existing menu items
                        const setupMenuItemListeners = () => {
                            const menuItems = menu.querySelectorAll('li, button, a, [role="menuitem"]');
                            menuItems.forEach(item => {
                                item.addEventListener('mouseenter', cancelCloseTimer);
                            });
                        };

                        // Setup listeners after a brief delay to ensure menu is rendered
                        setTimeout(setupMenuItemListeners, 10);
                    }
                    } // End of setupDropdown function
                });
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) {
                initializeDropdownPlugin();
            } else {
                // Wait for Alpine to be available
                document.addEventListener('alpine:init', initializeDropdownPlugin);
            }
        });
    } else {
        // DOM is already loaded
        if (window.Alpine) {
            initializeDropdownPlugin();
        } else {
            // Wait for Alpine to be available
            document.addEventListener('alpine:init', initializeDropdownPlugin);
        }
    }

    // Also listen for alpine:init as a backup
    document.addEventListener('alpine:init', initializeDropdownPlugin);

    // Handle dialog interactions - close dropdowns when dialogs open
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button[popovertarget]');
        if (!button) return;
        
        const targetId = button.getAttribute('popovertarget');
        const target = document.getElementById(targetId);
        
        if (target && target.tagName === 'DIALOG' && target.hasAttribute('popover')) {
            // Close dropdowns BEFORE the dialog opens to avoid conflicts
            const openDropdowns = document.querySelectorAll('menu[popover]:popover-open');
            
            openDropdowns.forEach(dropdown => {
                if (!target.contains(dropdown)) {
                    dropdown.hidePopover();
                }
            });
        }
    });

    var indux_icons = {};

    /* Iconify v3.1.1 */

    var hasRequiredIndux_icons;

    function requireIndux_icons () {
    	if (hasRequiredIndux_icons) return indux_icons;
    	hasRequiredIndux_icons = 1;
    	(function (exports) {
    		var Iconify = function (t) { const e = Object.freeze({ left: 0, top: 0, width: 16, height: 16 }), n = Object.freeze({ rotate: 0, vFlip: false, hFlip: false }), o = Object.freeze({ ...e, ...n }), r = Object.freeze({ ...o, body: "", hidden: false }); function i(t, e) { const o = function (t, e) { const n = {}; !t.hFlip != !e.hFlip && (n.hFlip = true), !t.vFlip != !e.vFlip && (n.vFlip = true); const o = ((t.rotate || 0) + (e.rotate || 0)) % 4; return o && (n.rotate = o), n }(t, e); for (const i in r) i in n ? i in t && !(i in o) && (o[i] = n[i]) : i in e ? o[i] = e[i] : i in t && (o[i] = t[i]); return o } function c(t, e, n) { const o = t.icons, r = t.aliases || Object.create(null); let c = {}; function s(t) { c = i(o[t] || r[t], c); } return s(e), n.forEach(s), i(t, c) } function s(t, e) { const n = []; if ("object" != typeof t || "object" != typeof t.icons) return n; t.not_found instanceof Array && t.not_found.forEach((t => { e(t, null), n.push(t); })); const o = function (t, e) { const n = t.icons, o = t.aliases || Object.create(null), r = Object.create(null); return (Object.keys(n).concat(Object.keys(o))).forEach((function t(e) { if (n[e]) return r[e] = []; if (!(e in r)) { r[e] = null; const n = o[e] && o[e].parent, i = n && t(n); i && (r[e] = [n].concat(i)); } return r[e] })), r }(t); for (const r in o) { const i = o[r]; i && (e(r, c(t, r, i)), n.push(r)); } return n } const a = /^[a-z0-9]+(-[a-z0-9]+)*$/, u = (t, e, n, o = "") => { const r = t.split(":"); if ("@" === t.slice(0, 1)) { if (r.length < 2 || r.length > 3) return null; o = r.shift().slice(1); } if (r.length > 3 || !r.length) return null; if (r.length > 1) { const t = r.pop(), n = r.pop(), i = { provider: r.length > 0 ? r[0] : o, prefix: n, name: t }; return e && !f(i) ? null : i } const i = r[0], c = i.split("-"); if (c.length > 1) { const t = { provider: o, prefix: c.shift(), name: c.join("-") }; return e && !f(t) ? null : t } if (n && "" === o) { const t = { provider: o, prefix: "", name: i }; return e && !f(t, n) ? null : t } return null }, f = (t, e) => !!t && !("" !== t.provider && !t.provider.match(a) || !(e && "" === t.prefix || t.prefix.match(a)) || !t.name.match(a)), l = { provider: "", aliases: {}, not_found: {}, ...e }; function d(t, e) { for (const n in e) if (n in t && typeof t[n] != typeof e[n]) return false; return true } function p(t) { if ("object" != typeof t || null === t) return null; const e = t; if ("string" != typeof e.prefix || !t.icons || "object" != typeof t.icons) return null; if (!d(t, l)) return null; const n = e.icons; for (const t in n) { const e = n[t]; if (!t.match(a) || "string" != typeof e.body || !d(e, r)) return null } const o = e.aliases || Object.create(null); for (const t in o) { const e = o[t], i = e.parent; if (!t.match(a) || "string" != typeof i || !n[i] && !o[i] || !d(e, r)) return null } return e } const h = Object.create(null); function g(t, e) { const n = h[t] || (h[t] = Object.create(null)); return n[e] || (n[e] = function (t, e) { return { provider: t, prefix: e, icons: Object.create(null), missing: new Set } }(t, e)) } function m(t, e) { return p(e) ? s(e, ((e, n) => { n ? t.icons[e] = n : t.missing.add(e); })) : [] } function y(t, e) { let n = []; return ("string" == typeof t ? [t] : Object.keys(h)).forEach((t => { ("string" == typeof t && "string" == typeof e ? [e] : Object.keys(h[t] || {})).forEach((e => { const o = g(t, e); n = n.concat(Object.keys(o.icons).map((n => ("" !== t ? "@" + t + ":" : "") + e + ":" + n))); })); })), n } let b = false; function v(t) { const e = "string" == typeof t ? u(t, true, b) : t; if (e) { const t = g(e.provider, e.prefix), n = e.name; return t.icons[n] || (t.missing.has(n) ? null : void 0) } } function x(t, e) { const n = u(t, true, b); if (!n) return false; return function (t, e, n) { try { if ("string" == typeof n.body) return t.icons[e] = { ...n }, !0 } catch (t) { } return false }(g(n.provider, n.prefix), n.name, e) } function w(t, e) { if ("object" != typeof t) return false; if ("string" != typeof e && (e = t.provider || ""), b) ; const n = t.prefix; if (!f({ provider: e, prefix: n, name: "a" })) return false; return !!m(g(e, n), t) } function S(t) { return !!v(t) } function j(t) { const e = v(t); return e ? { ...o, ...e } : null } const E = Object.freeze({ width: null, height: null }), I = Object.freeze({ ...E, ...n }), O = /(-?[0-9.]*[0-9]+[0-9.]*)/g, k = /^-?[0-9.]*[0-9]+[0-9.]*$/g; function C(t, e, n) { if (1 === e) return t; if (n = n || 100, "number" == typeof t) return Math.ceil(t * e * n) / n; if ("string" != typeof t) return t; const o = t.split(O); if (null === o || !o.length) return t; const r = []; let i = o.shift(), c = k.test(i); for (; ;) { if (c) { const t = parseFloat(i); isNaN(t) ? r.push(i) : r.push(Math.ceil(t * e * n) / n); } else r.push(i); if (i = o.shift(), void 0 === i) return r.join(""); c = !c; } } const M = t => "unset" === t || "undefined" === t || "none" === t; function T(t, e) { const n = { ...o, ...t }, r = { ...I, ...e }, i = { left: n.left, top: n.top, width: n.width, height: n.height }; let c = n.body;[n, r].forEach((t => { const e = [], n = t.hFlip, o = t.vFlip; let r, s = t.rotate; switch (n ? o ? s += 2 : (e.push("translate(" + (i.width + i.left).toString() + " " + (0 - i.top).toString() + ")"), e.push("scale(-1 1)"), i.top = i.left = 0) : o && (e.push("translate(" + (0 - i.left).toString() + " " + (i.height + i.top).toString() + ")"), e.push("scale(1 -1)"), i.top = i.left = 0), s < 0 && (s -= 4 * Math.floor(s / 4)), s %= 4, s) { case 1: r = i.height / 2 + i.top, e.unshift("rotate(90 " + r.toString() + " " + r.toString() + ")"); break; case 2: e.unshift("rotate(180 " + (i.width / 2 + i.left).toString() + " " + (i.height / 2 + i.top).toString() + ")"); break; case 3: r = i.width / 2 + i.left, e.unshift("rotate(-90 " + r.toString() + " " + r.toString() + ")"); }s % 2 == 1 && (i.left !== i.top && (r = i.left, i.left = i.top, i.top = r), i.width !== i.height && (r = i.width, i.width = i.height, i.height = r)), e.length && (c = '<g transform="' + e.join(" ") + '">' + c + "</g>"); })); const s = r.width, a = r.height, u = i.width, f = i.height; let l, d; null === s ? (d = null === a ? "1em" : "auto" === a ? f : a, l = C(d, u / f)) : (l = "auto" === s ? u : s, d = null === a ? C(l, f / u) : "auto" === a ? f : a); const p = {}, h = (t, e) => { M(e) || (p[t] = e.toString()); }; return h("width", l), h("height", d), p.viewBox = i.left.toString() + " " + i.top.toString() + " " + u.toString() + " " + f.toString(), { attributes: p, body: c } } const L = /\sid="(\S+)"/g, A = "IconifyId" + Date.now().toString(16) + (16777216 * Math.random() | 0).toString(16); let F = 0; function P(t, e = A) { const n = []; let o; for (; o = L.exec(t);)n.push(o[1]); if (!n.length) return t; const r = "suffix" + (16777216 * Math.random() | Date.now()).toString(16); return n.forEach((n => { const o = "function" == typeof e ? e(n) : e + (F++).toString(), i = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); t = t.replace(new RegExp('([#;"])(' + i + ')([")]|\\.[a-z])', "g"), "$1" + o + r + "$3"); })), t = t.replace(new RegExp(r, "g"), "") } const N = { local: true, session: true }, z = { local: new Set, session: new Set }; let _ = false; const D = "iconify2", R = "iconify", $ = R + "-count", q = R + "-version", H = 36e5, U = 168; function V(t, e) { try { return t.getItem(e) } catch (t) { } } function Q(t, e, n) { try { return t.setItem(e, n), !0 } catch (t) { } } function G(t, e) { try { t.removeItem(e); } catch (t) { } } function J(t, e) { return Q(t, $, e.toString()) } function B(t) { return parseInt(V(t, $)) || 0 } let K = "undefined" == typeof window ? {} : window; function W(t) { const e = t + "Storage"; try { if (K && K[e] && "number" == typeof K[e].length) return K[e] } catch (t) { } N[t] = false; } function X(t, e) { const n = W(t); if (!n) return; const o = V(n, q); if (o !== D) { if (o) { const t = B(n); for (let e = 0; e < t; e++)G(n, R + e.toString()); } return Q(n, q, D), void J(n, 0) } const r = Math.floor(Date.now() / H) - U, i = t => { const o = R + t.toString(), i = V(n, o); if ("string" == typeof i) { try { const n = JSON.parse(i); if ("object" == typeof n && "number" == typeof n.cached && n.cached > r && "string" == typeof n.provider && "object" == typeof n.data && "string" == typeof n.data.prefix && e(n, t)) return !0 } catch (t) { } G(n, o); } }; let c = B(n); for (let e = c - 1; e >= 0; e--)i(e) || (e === c - 1 ? (c--, J(n, c)) : z[t].add(e)); } function Y() { if (!_) { _ = true; for (const t in N) X(t, (t => { const e = t.data, n = g(t.provider, e.prefix); if (!m(n, e).length) return !1; const o = e.lastModified || -1; return n.lastModifiedCached = n.lastModifiedCached ? Math.min(n.lastModifiedCached, o) : o, !0 })); } } function Z(t, e) { switch (t) { case "local": case "session": N[t] = e; break; case "all": for (const t in N) N[t] = e; } } const tt = Object.create(null); function et(t, e) { tt[t] = e; } function nt(t) { return tt[t] || tt[""] } function ot(t) { let e; if ("string" == typeof t.resources) e = [t.resources]; else if (e = t.resources, !(e instanceof Array && e.length)) return null; return { resources: e, path: t.path || "/", maxURL: t.maxURL || 500, rotate: t.rotate || 750, timeout: t.timeout || 5e3, random: true === t.random, index: t.index || 0, dataAfterTimeout: false !== t.dataAfterTimeout } } const rt = Object.create(null), it = ["https://api.simplesvg.com", "https://api.unisvg.com"], ct = []; for (; it.length > 0;)1 === it.length || Math.random() > .5 ? ct.push(it.shift()) : ct.push(it.pop()); function st(t, e) { const n = ot(e); return null !== n && (rt[t] = n, true) } function at(t) { return rt[t] } rt[""] = ot({ resources: ["https://api.iconify.design"].concat(ct) }); let ut = (() => { let t; try { if (t = fetch, "function" == typeof t) return t } catch (t) { } })(); const ft = { prepare: (t, e, n) => { const o = [], r = function (t, e) { const n = at(t); if (!n) return 0; let o; if (n.maxURL) { let t = 0; n.resources.forEach((e => { const n = e; t = Math.max(t, n.length); })); const r = e + ".json?icons="; o = n.maxURL - t - n.path.length - r.length; } else o = 0; return o }(t, e), i = "icons"; let c = { type: i, provider: t, prefix: e, icons: [] }, s = 0; return n.forEach(((n, a) => { s += n.length + 1, s >= r && a > 0 && (o.push(c), c = { type: i, provider: t, prefix: e, icons: [] }, s = n.length), c.icons.push(n); })), o.push(c), o }, send: (t, e, n) => { if (!ut) return void n("abort", 424); let o = function (t) { if ("string" == typeof t) { const e = at(t); if (e) return e.path } return "/" }(e.provider); switch (e.type) { case "icons": { const t = e.prefix, n = e.icons.join(","); o += t + ".json?" + new URLSearchParams({ icons: n }).toString(); break } case "custom": { const t = e.uri; o += "/" === t.slice(0, 1) ? t.slice(1) : t; break } default: return void n("abort", 400) }let r = 503; ut(t + o).then((t => { const e = t.status; if (200 === e) return r = 501, t.json(); setTimeout((() => { n(function (t) { return 404 === t }(e) ? "abort" : "next", e); })); })).then((t => { "object" == typeof t && null !== t ? setTimeout((() => { n("success", t); })) : setTimeout((() => { 404 === t ? n("abort", t) : n("next", r); })); })).catch((() => { n("next", r); })); } }; function lt(t, e) { t.forEach((t => { const n = t.loaderCallbacks; n && (t.loaderCallbacks = n.filter((t => t.id !== e))); })); } let dt = 0; var pt = { resources: [], index: 0, timeout: 2e3, rotate: 750, random: false, dataAfterTimeout: false }; function ht(t, e, n, o) { const r = t.resources.length, i = t.random ? Math.floor(Math.random() * r) : t.index; let c; if (t.random) { let e = t.resources.slice(0); for (c = []; e.length > 1;) { const t = Math.floor(Math.random() * e.length); c.push(e[t]), e = e.slice(0, t).concat(e.slice(t + 1)); } c = c.concat(e); } else c = t.resources.slice(i).concat(t.resources.slice(0, i)); const s = Date.now(); let a, u = "pending", f = 0, l = null, d = [], p = []; function h() { l && (clearTimeout(l), l = null); } function g() { "pending" === u && (u = "aborted"), h(), d.forEach((t => { "pending" === t.status && (t.status = "aborted"); })), d = []; } function m(t, e) { e && (p = []), "function" == typeof t && p.push(t); } function y() { u = "failed", p.forEach((t => { t(void 0, a); })); } function b() { d.forEach((t => { "pending" === t.status && (t.status = "aborted"); })), d = []; } function v() { if ("pending" !== u) return; h(); const o = c.shift(); if (void 0 === o) return d.length ? void (l = setTimeout((() => { h(), "pending" === u && (b(), y()); }), t.timeout)) : void y(); const r = { status: "pending", resource: o, callback: (e, n) => { !function (e, n, o) { const r = "success" !== n; switch (d = d.filter((t => t !== e)), u) { case "pending": break; case "failed": if (r || !t.dataAfterTimeout) return; break; default: return }if ("abort" === n) return a = o, void y(); if (r) return a = o, void (d.length || (c.length ? v() : y())); if (h(), b(), !t.random) { const n = t.resources.indexOf(e.resource); -1 !== n && n !== t.index && (t.index = n); } u = "completed", p.forEach((t => { t(o); })); }(r, e, n); } }; d.push(r), f++, l = setTimeout(v, t.rotate), n(o, e, r.callback); } return "function" == typeof o && p.push(o), setTimeout(v), function () { return { startTime: s, payload: e, status: u, queriesSent: f, queriesPending: d.length, subscribe: m, abort: g } } } function gt(t) { const e = { ...pt, ...t }; let n = []; function o() { n = n.filter((t => "pending" === t().status)); } const r = { query: function (t, r, i) { const c = ht(e, t, r, ((t, e) => { o(), i && i(t, e); })); return n.push(c), c }, find: function (t) { return n.find((e => t(e))) || null }, setIndex: t => { e.index = t; }, getIndex: () => e.index, cleanup: o }; return r } function mt() { } const yt = Object.create(null); function bt(t, e, n) { let o, r; if ("string" == typeof t) { const e = nt(t); if (!e) return n(void 0, 424), mt; r = e.send; const i = function (t) { if (!yt[t]) { const e = at(t); if (!e) return; const n = { config: e, redundancy: gt(e) }; yt[t] = n; } return yt[t] }(t); i && (o = i.redundancy); } else { const e = ot(t); if (e) { o = gt(e); const n = nt(t.resources ? t.resources[0] : ""); n && (r = n.send); } } return o && r ? o.query(e, r, n)().abort : (n(void 0, 424), mt) } function vt(t, e) { function n(n) { let o; if (!N[n] || !(o = W(n))) return; const r = z[n]; let i; if (r.size) r.delete(i = Array.from(r).shift()); else if (i = B(o), !J(o, i + 1)) return; const c = { cached: Math.floor(Date.now() / H), provider: t.provider, data: e }; return Q(o, R + i.toString(), JSON.stringify(c)) } _ || Y(), e.lastModified && !function (t, e) { const n = t.lastModifiedCached; if (n && n >= e) return n === e; if (t.lastModifiedCached = e, n) for (const n in N) X(n, (n => { const o = n.data; return n.provider !== t.provider || o.prefix !== t.prefix || o.lastModified === e })); return true }(t, e.lastModified) || Object.keys(e.icons).length && (e.not_found && delete (e = Object.assign({}, e)).not_found, n("local") || n("session")); } function xt() { } function wt(t) { t.iconsLoaderFlag || (t.iconsLoaderFlag = true, setTimeout((() => { t.iconsLoaderFlag = false, function (t) { t.pendingCallbacksFlag || (t.pendingCallbacksFlag = true, setTimeout((() => { t.pendingCallbacksFlag = false; const e = t.loaderCallbacks ? t.loaderCallbacks.slice(0) : []; if (!e.length) return; let n = false; const o = t.provider, r = t.prefix; e.forEach((e => { const i = e.icons, c = i.pending.length; i.pending = i.pending.filter((e => { if (e.prefix !== r) return true; const c = e.name; if (t.icons[c]) i.loaded.push({ provider: o, prefix: r, name: c }); else { if (!t.missing.has(c)) return n = true, true; i.missing.push({ provider: o, prefix: r, name: c }); } return false })), i.pending.length !== c && (n || lt([t], e.id), e.callback(i.loaded.slice(0), i.missing.slice(0), i.pending.slice(0), e.abort)); })); }))); }(t); }))); } const St = t => { const e = g(t.provider, t.prefix).pendingIcons; return !(!e || !e.has(t.name)) }, jt = (t, e) => { const o = function (t) { const e = { loaded: [], missing: [], pending: [] }, n = Object.create(null); t.sort(((t, e) => t.provider !== e.provider ? t.provider.localeCompare(e.provider) : t.prefix !== e.prefix ? t.prefix.localeCompare(e.prefix) : t.name.localeCompare(e.name))); let o = { provider: "", prefix: "", name: "" }; return t.forEach((t => { if (o.name === t.name && o.prefix === t.prefix && o.provider === t.provider) return; o = t; const r = t.provider, i = t.prefix, c = t.name, s = n[r] || (n[r] = Object.create(null)), a = s[i] || (s[i] = g(r, i)); let u; u = c in a.icons ? e.loaded : "" === i || a.missing.has(c) ? e.missing : e.pending; const f = { provider: r, prefix: i, name: c }; u.push(f); })), e }(function (t, e = true, n = false) { const o = []; return t.forEach((t => { const r = "string" == typeof t ? u(t, e, n) : t; r && o.push(r); })), o }(t, true, (b))); if (!o.pending.length) { let t = true; return e && setTimeout((() => { t && e(o.loaded, o.missing, o.pending, xt); })), () => { t = false; } } const r = Object.create(null), i = []; let c, s; return o.pending.forEach((t => { const { provider: e, prefix: n } = t; if (n === s && e === c) return; c = e, s = n, i.push(g(e, n)); const o = r[e] || (r[e] = Object.create(null)); o[n] || (o[n] = []); })), o.pending.forEach((t => { const { provider: e, prefix: n, name: o } = t, i = g(e, n), c = i.pendingIcons || (i.pendingIcons = new Set); c.has(o) || (c.add(o), r[e][n].push(o)); })), i.forEach((t => { const { provider: e, prefix: n } = t; r[e][n].length && function (t, e) { t.iconsToLoad ? t.iconsToLoad = t.iconsToLoad.concat(e).sort() : t.iconsToLoad = e, t.iconsQueueFlag || (t.iconsQueueFlag = true, setTimeout((() => { t.iconsQueueFlag = false; const { provider: e, prefix: n } = t, o = t.iconsToLoad; let r; delete t.iconsToLoad, o && (r = nt(e)) && r.prepare(e, n, o).forEach((n => { bt(e, n, (e => { if ("object" != typeof e) n.icons.forEach((e => { t.missing.add(e); })); else try { const n = m(t, e); if (!n.length) return; const o = t.pendingIcons; o && n.forEach((t => { o.delete(t); })), vt(t, e); } catch (t) { console.error(t); } wt(t); })); })); }))); }(t, r[e][n]); })), e ? function (t, e, n) { const o = dt++, r = lt.bind(null, n, o); if (!e.pending.length) return r; const i = { id: o, icons: e, callback: t, abort: r }; return n.forEach((t => { (t.loaderCallbacks || (t.loaderCallbacks = [])).push(i); })), r }(e, o, i) : xt }, Et = t => new Promise(((e, n) => { const r = "string" == typeof t ? u(t, true) : t; r ? jt([r || t], (i => { if (i.length && r) { const t = v(r); if (t) return void e({ ...o, ...t }) } n(t); })) : n(t); })); function It(t, e) { const n = { ...t }; for (const t in e) { const o = e[t], r = typeof o; t in E ? (null === o || o && ("string" === r || "number" === r)) && (n[t] = o) : r === typeof n[t] && (n[t] = "rotate" === t ? o % 4 : o); } return n } const Ot = { ...I, inline: false }, kt = "iconify", Ct = "iconify-inline", Mt = "iconifyData" + Date.now(); let Tt = []; function Lt(t) { for (let e = 0; e < Tt.length; e++) { const n = Tt[e]; if (("function" == typeof n.node ? n.node() : n.node) === t) return n } } function At(t, e = false) { let n = Lt(t); return n ? (n.temporary && (n.temporary = e), n) : (n = { node: t, temporary: e }, Tt.push(n), n) } function Ft() { return Tt } let Pt = null; const Nt = { childList: true, subtree: true, attributes: true }; function zt(t) { if (!t.observer) return; const e = t.observer; e.pendingScan || (e.pendingScan = setTimeout((() => { delete e.pendingScan, Pt && Pt(t); }))); } function _t(t, e) { if (!t.observer) return; const n = t.observer; if (!n.pendingScan) for (let o = 0; o < e.length; o++) { const r = e[o]; if (r.addedNodes && r.addedNodes.length > 0 || "attributes" === r.type && void 0 !== r.target[Mt]) return void (n.paused || zt(t)) } } function Dt(t, e) { t.observer.instance.observe(e, Nt); } function Rt(t) { let e = t.observer; if (e && e.instance) return; const n = "function" == typeof t.node ? t.node() : t.node; n && window && (e || (e = { paused: 0 }, t.observer = e), e.instance = new window.MutationObserver(_t.bind(null, t)), Dt(t, n), e.paused || zt(t)); } function $t() { Ft().forEach(Rt); } function qt(t) { if (!t.observer) return; const e = t.observer; e.pendingScan && (clearTimeout(e.pendingScan), delete e.pendingScan), e.instance && (e.instance.disconnect(), delete e.instance); } function Ht(t) { const e = null !== Pt; Pt !== t && (Pt = t, e && Ft().forEach(qt)), e ? $t() : function (t) { const e = document; e.readyState && "loading" !== e.readyState ? t() : e.addEventListener("DOMContentLoaded", t); }($t); } function Ut(t) { (t ? [t] : Ft()).forEach((t => { if (!t.observer) return void (t.observer = { paused: 1 }); const e = t.observer; if (e.paused++, e.paused > 1 || !e.instance) return; e.instance.disconnect(); })); } function Vt(t) { if (t) { const e = Lt(t); e && Ut(e); } else Ut(); } function Qt(t) { (t ? [t] : Ft()).forEach((t => { if (!t.observer) return void Rt(t); const e = t.observer; if (e.paused && (e.paused--, !e.paused)) { const n = "function" == typeof t.node ? t.node() : t.node; if (!n) return; e.instance ? Dt(t, n) : Rt(t); } })); } function Gt(t) { if (t) { const e = Lt(t); e && Qt(e); } else Qt(); } function Jt(t, e = false) { const n = At(t, e); return Rt(n), n } function Bt(t) { const e = Lt(t); e && (qt(e), function (t) { Tt = Tt.filter((e => t !== e && t !== ("function" == typeof e.node ? e.node() : e.node))); }(t)); } const Kt = /[\s,]+/; const Wt = ["width", "height"], Xt = ["inline", "hFlip", "vFlip"]; function Yt(t) { const e = t.getAttribute("data-icon"), n = "string" == typeof e && u(e, true); if (!n) return null; const o = { ...Ot, inline: t.classList && t.classList.contains(Ct) }; Wt.forEach((e => { const n = t.getAttribute("data-" + e); n && (o[e] = n); })); const r = t.getAttribute("data-rotate"); "string" == typeof r && (o.rotate = function (t, e = 0) { const n = t.replace(/^-?[0-9.]*/, ""); function o(t) { for (; t < 0;)t += 4; return t % 4 } if ("" === n) { const e = parseInt(t); return isNaN(e) ? 0 : o(e) } if (n !== t) { let e = 0; switch (n) { case "%": e = 25; break; case "deg": e = 90; }if (e) { let r = parseFloat(t.slice(0, t.length - n.length)); return isNaN(r) ? 0 : (r /= e, r % 1 == 0 ? o(r) : 0) } } return e }(r)); const i = t.getAttribute("data-flip"); "string" == typeof i && function (t, e) { e.split(Kt).forEach((e => { switch (e.trim()) { case "horizontal": t.hFlip = true; break; case "vertical": t.vFlip = true; } })); }(o, i), Xt.forEach((e => { const n = "data-" + e, r = function (t, e) { return t === e || "true" === t || "" !== t && "false" !== t && null }(t.getAttribute(n), n); "boolean" == typeof r && (o[e] = r); })); const c = t.getAttribute("data-mode"); return { name: e, icon: n, customisations: o, mode: c } } const Zt = "svg." + kt + ", i." + kt + ", span." + kt + ", i." + Ct + ", span." + Ct; function te(t, e) { let n = -1 === t.indexOf("xlink:") ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"'; for (const t in e) n += " " + t + '="' + e[t] + '"'; return '<svg xmlns="http://www.w3.org/2000/svg"' + n + ">" + t + "</svg>" } let ee; function ne(t) { return void 0 === ee && function () { try { ee = window.trustedTypes.createPolicy("iconify", { createHTML: t => t }); } catch (t) { ee = null; } }(), ee ? ee.createHTML(t) : t } function oe(t) { const e = new Set(["iconify"]); return ["provider", "prefix"].forEach((n => { t[n] && e.add("iconify--" + t[n]); })), e } function re(t, e, n, o) { const r = t.classList; if (o) { const t = o.classList; Array.from(t).forEach((t => { r.add(t); })); } const i = []; return e.forEach((t => { r.contains(t) ? n.has(t) && i.push(t) : (r.add(t), i.push(t)); })), n.forEach((t => { e.has(t) || r.remove(t); })), i } function ie(t, e, n) { const o = t.style; (n || []).forEach((t => { o.removeProperty(t); })); const r = []; for (const t in e) o.getPropertyValue(t) || (r.push(t), o.setProperty(t, e[t])); return r } function ce(t, e, n) { let o; try { o = document.createElement("span"); } catch (e) { return t } const r = e.customisations, i = T(n, r), c = t[Mt], s = te(P(i.body), { "aria-hidden": "true", role: "img", ...i.attributes }); o.innerHTML = ne(s); const a = o.childNodes[0], u = t.attributes; for (let t = 0; t < u.length; t++) { const e = u.item(t), n = e.name; "class" === n || a.hasAttribute(n) || a.setAttribute(n, e.value); } const f = re(a, oe(e.icon), new Set(c && c.addedClasses), t), l = ie(a, r.inline ? { "vertical-align": "-0.125em" } : {}, c && c.addedStyles), d = { ...e, status: "loaded", addedClasses: f, addedStyles: l }; return a[Mt] = d, t.parentNode && t.parentNode.replaceChild(a, t), a } const se = { display: "inline-block" }, ae = { "background-color": "currentColor" }, ue = { "background-color": "transparent" }, fe = { image: "var(--svg)", repeat: "no-repeat", size: "100% 100%" }, le = { "-webkit-mask": ae, mask: ae, background: ue }; for (const t in le) { const e = le[t]; for (const n in fe) e[t + "-" + n] = fe[n]; } function de(t) { return t + (t.match(/^[-0-9.]+$/) ? "px" : "") } let pe = false; function he() { pe || (pe = true, setTimeout((() => { pe && (pe = false, ge()); }))); } function ge(t, e = false) { const n = Object.create(null); function r(t, e) { const { provider: o, prefix: r, name: i } = t, c = g(o, r), s = c.icons[i]; if (s) return { status: "loaded", icon: s }; if (c.missing.has(i)) return { status: "missing" }; if (e && !St(t)) { const t = n[o] || (n[o] = Object.create(null)); (t[r] || (t[r] = new Set)).add(i); } return { status: "loading" } } (t ? [t] : Ft()).forEach((t => { const n = "function" == typeof t.node ? t.node() : t.node; if (!n || !n.querySelectorAll) return; let i = false, c = false; function s(e, n, r) { if (c || (c = true, Ut(t)), "SVG" !== e.tagName.toUpperCase()) { const t = n.mode, i = "mask" === t || "bg" !== t && ("style" === t ? -1 !== r.body.indexOf("currentColor") : null); if ("boolean" == typeof i) return void function (t, e, n, o) { const r = e.customisations, i = T(n, r), c = i.attributes, s = t[Mt], a = te(i.body, { ...c, width: n.width + "", height: n.height + "" }), u = re(t, oe(e.icon), new Set(s && s.addedClasses)), f = { "--svg": 'url("' + (l = a, "data:image/svg+xml," + function (t) { return t.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ") }(l) + '")'), width: de(c.width), height: de(c.height), ...se, ...o ? ae : ue }; var l; r.inline && (f["vertical-align"] = "-0.125em"); const d = ie(t, f, s && s.addedStyles), p = { ...e, status: "loaded", addedClasses: u, addedStyles: d }; t[Mt] = p; }(e, n, { ...o, ...r }, i) } ce(e, n, r); } ((function (t) { const e = []; return t.querySelectorAll(Zt).forEach((t => { const n = t[Mt] || "svg" !== t.tagName.toLowerCase() ? Yt(t) : null; n && e.push({ node: t, props: n }); })), e }))(n).forEach((({ node: t, props: e }) => { const n = t[Mt]; if (!n) { const { status: n, icon: o } = r(e.icon, true); return o ? void s(t, e, o) : (i = i || "loading" === n, void (t[Mt] = { ...e, status: n })) } let o; if (function (t, e) { if (t.name !== e.name || t.mode !== e.mode) return true; const n = t.customisations, o = e.customisations; for (const t in Ot) if (n[t] !== o[t]) return true; return false }(n, e)) { if (o = r(e.icon, n.name !== e.name), !o.icon) return i = i || "loading" === o.status, void Object.assign(n, { ...e, status: o.status }) } else { if ("loading" !== n.status) return; if (o = r(e.icon, false), !o.icon) return void (n.status = o.status) } s(t, e, o.icon); })), t.temporary && !i ? Bt(n) : e && i ? Jt(n, true) : c && t.observer && Qt(t); })); for (const t in n) { const e = n[t]; for (const n in e) { const o = e[n]; jt(Array.from(o).map((e => ({ provider: t, prefix: n, name: e }))), he); } } } function me(t, e, n = false) { const o = v(t); if (!o) return null; const r = u(t), i = It(Ot, e || {}), c = ce(document.createElement("span"), { name: t, icon: r, customisations: i }, o); return n ? c.outerHTML : c } function ye() { return "3.1.1" } function be(t, e) { return me(t, e, false) } function ve(t, e) { return me(t, e, true) } function xe(t, e) { const n = v(t); if (!n) return null; return T(n, It(Ot, e || {})) } function we(t) { t ? function (t) { const e = Lt(t); e ? ge(e) : ge({ node: t, temporary: true }, true); }(t) : ge(); } if ("undefined" != typeof document && "undefined" != typeof window) { !function () { if (document.documentElement) return At(document.documentElement); Tt.push({ node: () => document.documentElement }); }(); const t = window; if (void 0 !== t.IconifyPreload) { const e = t.IconifyPreload, n = "Invalid IconifyPreload syntax."; "object" == typeof e && null !== e && (e instanceof Array ? e : [e]).forEach((t => { try { ("object" != typeof t || null === t || t instanceof Array || "object" != typeof t.icons || "string" != typeof t.prefix || !w(t)) && console.error(n); } catch (t) { console.error(n); } })); } setTimeout((() => { Ht(ge), ge(); })); } function Se(t, e) { Z(t, false !== e); } function je(t) { Z(t, true); } if (et("", ft), "undefined" != typeof document && "undefined" != typeof window) { Y(); const t = window; if (void 0 !== t.IconifyProviders) { const e = t.IconifyProviders; if ("object" == typeof e && null !== e) for (const t in e) { const n = "IconifyProviders[" + t + "] is invalid."; try { const o = e[t]; if ("object" != typeof o || !o || void 0 === o.resources) continue; st(t, o) || console.error(n); } catch (t) { console.error(n); } } } } const Ee = { getAPIConfig: at, setAPIModule: et, sendAPIQuery: bt, setFetch: function (t) { ut = t; }, getFetch: function () { return ut }, listAPIProviders: function () { return Object.keys(rt) } }, Ie = { _api: Ee, addAPIProvider: st, loadIcons: jt, loadIcon: Et, iconExists: S, getIcon: j, listIcons: y, addIcon: x, addCollection: w, replaceIDs: P, calculateSize: C, buildIcon: T, getVersion: ye, renderSVG: be, renderHTML: ve, renderIcon: xe, scan: we, observe: Jt, stopObserving: Bt, pauseObserver: Vt, resumeObserver: Gt, enableCache: Se, disableCache: je }; return t._api = Ee, t.addAPIProvider = st, t.addCollection = w, t.addIcon = x, t.buildIcon = T, t.calculateSize = C, t.default = Ie, t.disableCache = je, t.enableCache = Se, t.getIcon = j, t.getVersion = ye, t.iconExists = S, t.listIcons = y, t.loadIcon = Et, t.loadIcons = jt, t.observe = Jt, t.pauseObserver = Vt, t.renderHTML = ve, t.renderIcon = xe, t.renderSVG = be, t.replaceIDs = P, t.resumeObserver = Gt, t.scan = we, t.stopObserving = Bt, Object.defineProperty(t, "__esModule", { value: true }), t }({}); try { for (var key in exports.__esModule = !0, exports.default = Iconify, Iconify) exports[key] = Iconify[key]; } catch (t) { } try { void 0 === self.Iconify && (self.Iconify = Iconify); } catch (t) { }

    		/* Indux Icons */

    		// Initialize plugin when either DOM is ready or Alpine is ready
    		function initializeIconPlugin() {
    		    // Register icon directive
    		    Alpine.directive('icon', (el, { expression }, { effect, evaluateLater }) => {
    		        const iconValue = expression;
    		        if (!iconValue) return

    		        // Check if it's a raw icon name (should contain a colon for icon format like 'lucide:house')
    		        const isRawIconName = iconValue.includes(':') &&
    		            !iconValue.includes("'") &&
    		            !iconValue.includes('"') &&
    		            !iconValue.includes('$') &&
    		            !iconValue.includes('?') &&
    		            !iconValue.includes('.') &&
    		            !iconValue.includes('(') &&
    		            !iconValue.includes(')');

    		        // For raw icon names, wrap in quotes
    		        const safeExpression = isRawIconName ? `'${iconValue}'` : iconValue;
    		        const evaluate = evaluateLater(safeExpression);

    		        effect(() => {
    		            evaluate(value => {
    		                if (!value) return

    		                // Special handling for <li> elements
    		                if (el.tagName.toLowerCase() === 'li') {
    		                    // Check if this is the first time processing this li
    		                    if (!el.hasAttribute('data-icon-processed')) {
    		                        // Store original text content
    		                        const originalText = el.textContent.trim();

    		                        // Clear the element
    		                        el.innerHTML = '';

    		                        // Create a temporary element for Iconify to process
    		                        const tempEl = document.createElement('span');
    		                        tempEl.className = 'iconify';
    		                        tempEl.setAttribute('data-icon', value);

    		                        // Add temporary element first
    		                        el.appendChild(tempEl);

    		                        // Add text content back
    		                        if (originalText) {
    		                            const textNode = document.createTextNode(originalText);
    		                            el.appendChild(textNode);
    		                        }

    		                        // Mark as processed to prevent re-processing
    		                        el.setAttribute('data-icon-processed', 'true');

    		                        // Use Iconify to process the temporary element
    		                        window.Iconify.scan(tempEl);

    		                        // After a short delay, check if Iconify replaced our element
    		                        setTimeout(() => {
    		                            // Check if the temp element was replaced by an SVG
    		                            const svg = el.querySelector('svg');
    		                            if (svg && svg.parentNode === el) {
    		                                // Iconify replaced our span with SVG, wrap it in a new span
    		                                const newSpan = document.createElement('span');
    		                                newSpan.setAttribute('x-icon', value);
    		                                el.insertBefore(newSpan, svg);
    		                                newSpan.appendChild(svg);
    		                            }
    		                        }, 50);
    		                        return
    		                    } else {
    		                        // Update existing icon
    		                        const iconSpan = el.querySelector('.iconify');
    		                        if (iconSpan) {
    		                            iconSpan.setAttribute('data-icon', value);
    		                            if (window.Iconify) {
    		                                window.Iconify.scan(iconSpan);
    		                            }
    		                        }
    		                        return
    		                    }
    		                }

    		                // Standard handling for non-li elements
    		                let iconEl = el.querySelector('.iconify');
    		                if (!iconEl) {
    		                    iconEl = document.createElement('span');
    		                    iconEl.className = 'iconify';
    		                    el.innerHTML = '';
    		                    el.appendChild(iconEl);
    		                }

    		                // Set icon data
    		                iconEl.setAttribute('data-icon', value);

    		                // Use Iconify (already embedded in script)
    		                window.Iconify.scan(iconEl);
    		            });
    		        });
    		    });
    		}

    		// Handle both DOMContentLoaded and alpine:init
    		if (document.readyState === 'loading') {
    		    document.addEventListener('DOMContentLoaded', () => {
    		        if (window.Alpine) initializeIconPlugin();
    		    });
    		}

    		document.addEventListener('alpine:init', initializeIconPlugin); 
    	} (indux_icons));
    	return indux_icons;
    }

    requireIndux_icons();

    /* Indux Localization */

    function initializeLocalizationPlugin() {
        // Environment detection for debug logging
        window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' || 
                             window.location.hostname.includes('dev') ||
                             window.location.search.includes('debug=true');
        
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

    var indux_markdown = {};

    /* Indux Markdown */

    var hasRequiredIndux_markdown;

    function requireIndux_markdown () {
    	if (hasRequiredIndux_markdown) return indux_markdown;
    	hasRequiredIndux_markdown = 1;
    	// Cache for marked.js loading
    	let markedPromise = null;

    	// Load marked.js from CDN
    	async function loadMarkedJS() {
    	    if (typeof marked !== 'undefined') {
    	        return marked;
    	    }
    	    
    	    // Return existing promise if already loading
    	    if (markedPromise) {
    	        return markedPromise;
    	    }
    	    
    	    markedPromise = new Promise((resolve, reject) => {
    	        const script = document.createElement('script');
    	        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    	        script.onload = () => {
    	            // Initialize marked.js
    	            if (typeof marked !== 'undefined') {
    	                resolve(marked);
    	            } else {
    	                console.error('[Indux Markdown] Marked.js failed to load - marked is undefined');
    	                markedPromise = null; // Reset so we can try again
    	                reject(new Error('marked.js failed to load'));
    	            }
    	        };
    	        script.onerror = (error) => {
    	            console.error('[Indux Markdown] Script failed to load:', error);
    	            markedPromise = null; // Reset so we can try again
    	            reject(error);
    	        };
    	        document.head.appendChild(script);
    	    });
    	    
    	    return markedPromise;
    	}

    	// Configure marked to preserve full language strings
    	async function configureMarked(marked) {
    	    marked.use({
    	        renderer: {
    	            code(token) {
    	                const lang = token.lang || '';
    	                const text = token.text || '';
    	                token.escaped || false;
    	                
    	                // Parse the language string to extract attributes
    	                const attributes = parseLanguageString(lang);
    	                
    	                // Build attributes for the x-code element
    	                let xCodeAttributes = '';
    	                if (attributes.title) {
    	                    xCodeAttributes += ` name="${attributes.title}"`;
    	                }
    	                if (attributes.language) {
    	                    xCodeAttributes += ` language="${attributes.language}"`;
    	                }
    	                if (attributes.numbers) {
    	                    xCodeAttributes += ' numbers';
    	                }
    	                if (attributes.copy) {
    	                    xCodeAttributes += ' copy';
    	                }
    	                
    	                // For x-code elements, use the raw text to preserve formatting
    	                let code = text;
    	                let preserveOriginal = '';
    	                
    	                // For HTML language code blocks, preserve the original raw text to maintain indentation
    	                if (attributes.language === 'html' || text.includes('<!DOCTYPE') || (text.includes('<html') && text.includes('<head') && text.includes('<body'))) {
    	                    // Store the original content in a data attribute to preserve indentation
    	                    preserveOriginal = ` data-original-content="${text.replace(/"/g, '&quot;')}"`;
    	                }
    	                
    	                // Always create an x-code element, with or without attributes
    	                return `<x-code${xCodeAttributes}${preserveOriginal}>${code}</x-code>\n`;
    	            }
    	        },
    	        // Configure marked to allow custom HTML tags
    	        breaks: true,
    	        gfm: true
    	    });

    	    // Add custom tokenizer for callout blocks
    	    marked.use({
    	        extensions: [{
    	            name: 'callout',
    	            level: 'block',
    	            start(src) {
    	                return src.match(/^:::/)?.index;
    	            },
    	            tokenizer(src) {
    	                // Find the opening ::: and type
    	                const openMatch = src.match(/^:::(.*?)(?:\n|$)/);
    	                if (!openMatch) return;
    	                
    	                // Parse the opening line for classes and icon
    	                const openingLine = openMatch[1].trim();
    	                let classes = '';
    	                let iconValue = '';
    	                
    	                // Match icon="value" pattern
    	                const iconMatch = openingLine.match(/icon="([^"]+)"/);
    	                if (iconMatch) {
    	                    iconValue = iconMatch[1];
    	                }
    	                
    	                // Get all class names (remove icon attribute first)
    	                classes = openingLine.replace(/\s*icon="[^"]+"\s*/, '').trim();
    	                
    	                const startPos = openMatch[0].length;
    	                
    	                // Find the closing ::: from the remaining content
    	                const remainingContent = src.slice(startPos);
    	                const closeMatch = remainingContent.match(/\n:::/);
    	                
    	                if (closeMatch) {
    	                    const content = remainingContent.slice(0, closeMatch.index);
    	                    const raw = openMatch[0] + content + closeMatch[0];
    	                    
    	                    return {
    	                        type: 'callout',
    	                        raw: raw,
    	                        classes: classes,
    	                        iconValue: iconValue,
    	                        text: content.trim()
    	                    };
    	                }
    	            },
    	            renderer(token) {
    	                const classes = token.classes || '';
    	                const iconValue = token.iconValue || '';
    	                
    	                // For frame callouts, don't parse as markdown to avoid wrapping HTML in <p> tags
    	                let parsedContent;
    	                if (classes.includes('frame')) {
    	                    // Use raw content for frame callouts to preserve HTML structure
    	                    parsedContent = token.text;
    	                } else {
    	                    // Parse the content as markdown to support nested markdown syntax
    	                    parsedContent = marked.parse(token.text);
    	                }
    	                
    	                const iconHtml = iconValue ? `<span x-icon="${iconValue}"></span>` : '';
    	                
    	                // Create a temporary div to count top-level elements
    	                const temp = document.createElement('div');
    	                temp.innerHTML = parsedContent;
    	                const elementCount = temp.children.length;
    	                
    	                // Only wrap in a div if:
    	                // 1. There are 2 or more elements AND
    	                // 2. There's an icon (which needs the content to be wrapped as a sibling)
    	                const needsWrapper = elementCount >= 2 && iconValue;
    	                const wrappedContent = needsWrapper ? 
    	                    `<div>${parsedContent}</div>` : 
    	                    parsedContent;
    	                
    	                return `<aside${classes ? ` class="${classes}"` : ''}>${iconHtml}${wrappedContent}</aside>\n`;
    	            }
    	        }]
    	    });

    	    // Configure marked to preserve custom HTML tags
    	    marked.setOptions({
    	        headerIds: false,
    	        mangle: false
    	    });
    	}

    	// Custom renderer for x-code-group to handle line breaks properly
    	function renderXCodeGroup(markdown) {
    	    // Find x-code-group blocks and process them specially
    	    const xCodeGroupRegex = /<x-code-group[^>]*>([\s\S]*?)<\/x-code-group>/g;
    	    
    	    return markdown.replace(xCodeGroupRegex, (match, content) => {
    	        // Ensure there's a line break after the opening tag if there isn't one
    	        const processedContent = content.replace(/^(?!\s*\n)/, '\n');
    	        
    	        return `<x-code-group>${processedContent}</x-code-group>`;
    	    });
    	}

    	// Post-process HTML to enable checkboxes by removing disabled attribute
    	function enableCheckboxes(html) {
    	    // Create a temporary DOM element to parse the HTML
    	    const temp = document.createElement('div');
    	    temp.innerHTML = html;
    	    
    	    // Find all checkbox inputs and remove disabled attribute
    	    const checkboxes = temp.querySelectorAll('input[type="checkbox"]');
    	    checkboxes.forEach(checkbox => {
    	        checkbox.removeAttribute('disabled');
    	    });
    	    
    	    return temp.innerHTML;
    	}





    	// Parse language string to extract title and attributes
    	function parseLanguageString(languageString) {
    	    if (!languageString || languageString.trim() === '') {
    	        return { title: null, language: null, numbers: false, copy: false };
    	    }
    	    
    	    const parts = languageString.split(/\s+/);
    	    
    	    const attributes = {
    	        title: null,
    	        language: null,
    	        numbers: false,
    	        copy: false
    	    };
    	    
    	    let i = 0;
    	    while (i < parts.length) {
    	        const part = parts[i];
    	        
    	        // Check for attributes
    	        if (part === 'numbers') {
    	            attributes.numbers = true;
    	            i++;
    	            continue;
    	        }
    	        
    	        if (part === 'copy') {
    	            attributes.copy = true;
    	            i++;
    	            continue;
    	        }
    	        
    	        // Check for quoted names (e.g., "Example")
    	        if (part.startsWith('"') && part.endsWith('"')) {
    	            // Single word quoted name
    	            attributes.title = part.slice(1, -1);
    	            i++;
    	            continue;
    	        } else if (part.startsWith('"')) {
    	            // Multi-word quoted name
    	            let fullName = part.slice(1);
    	            i++;
    	            while (i < parts.length) {
    	                const nextPart = parts[i];
    	                if (nextPart.endsWith('"')) {
    	                    fullName += ' ' + nextPart.slice(0, -1);
    	                    attributes.title = fullName;
    	                    i++;
    	                    break;
    	                } else {
    	                    fullName += ' ' + nextPart;
    	                    i++;
    	                }
    	            }
    	            continue;
    	        }
    	        
    	        // Store language identifiers (e.g., "css", "javascript", etc.)
    	        // Use the first language identifier found
    	        if (!attributes.language) {
    	            attributes.language = part;
    	        }
    	        i++;
    	    }
    	    
    	    return attributes;
    	}

    	// Preload marked.js as soon as script loads
    	loadMarkedJS().catch(() => {
    	    // Silently ignore errors during preload
    	});

    	// Initialize plugin when either DOM is ready or Alpine is ready
    	async function initializeMarkdownPlugin() {
    	    try {
    	        // Load marked.js
    	        const marked = await loadMarkedJS();
    	        
    	        // Configure marked with all our custom settings
    	        await configureMarked(marked);
    	        
    	        // Configure marked to generate heading IDs
    	        marked.use({
    	            renderer: {
    	                heading(token) {
    	                    // Extract text and level from the token
    	                    const text = token.text || '';
    	                    const level = token.depth || 1;
    	                    const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    	                    return `<h${level} id="${escapedText}">${text}</h${level}>`;
    	                }
    	            }
    	        });
    	    
    	    // Check if there are any elements with x-markdown already on the page
    	    const existingMarkdownElements = document.querySelectorAll('[x-markdown]');
    	    
    	    // Register markdown directive
    	    Alpine.directive('markdown', (el, { expression, modifiers }, { effect, evaluateLater }) => {
    	        
    	        // Handle null/undefined expressions gracefully
    	        if (!expression) {
    	            return;
    	        }
    	        
    	        // Hide element initially to prevent flicker
    	        el.style.opacity = '0';
    	        el.style.transition = 'opacity 0.15s ease-in-out';
    	        
    	        // Store original markdown content
    	        let markdownSource = '';
    	        let isUpdating = false;
    	        let hasContent = false;

    	        const normalizeContent = (content) => {
    	            const lines = content.split('\n');
    	            const commonIndent = lines
    	                .filter(line => line.trim())
    	                .reduce((min, line) => {
    	                    const indent = line.match(/^\s*/)[0].length;
    	                    return Math.min(min, indent);
    	                }, Infinity);

    	            return lines
    	                .map(line => line.slice(commonIndent))
    	                .join('\n')
    	                .trim();
    	        };

    	        const updateContent = async (element, newContent = null) => {
    	            if (isUpdating) return;
    	            isUpdating = true;

    	            try {
    	                // Update source if new content provided
    	                if (newContent !== null && newContent.trim() !== '') {
    	                    markdownSource = normalizeContent(newContent);
    	                }

    	                // Skip if no content
    	                if (!markdownSource || markdownSource.trim() === '') {
    	                    element.style.opacity = '0';
    	                    return;
    	                }

    	                // Load marked.js and parse markdown
    	                const marked = await loadMarkedJS();
    	                const processedMarkdown = renderXCodeGroup(markdownSource);
    	                let html = marked.parse(processedMarkdown);

    	                // Post-process HTML to enable checkboxes (remove disabled attribute)
    	                html = enableCheckboxes(html);

    	                // Only update if content has changed and isn't empty
    	                if (element.innerHTML !== html && html.trim() !== '') {
    	                    // Create a temporary container to hold the HTML
    	                    const temp = document.createElement('div');
    	                    temp.innerHTML = html;

    	                    // Replace the content
    	                    element.innerHTML = '';
    	                    while (temp.firstChild) {
    	                        element.appendChild(temp.firstChild);
    	                    }
    	                    
    	                    // Show element with content
    	                    hasContent = true;
    	                    element.style.opacity = '1';
    	                } else if (!hasContent) {
    	                    // Keep hidden if no valid content
    	                    element.style.opacity = '0';
    	                }
    	            } finally {
    	                isUpdating = false;
    	            }
    	        };

    	        // Handle inline markdown content (no expression or 'inline')
    	        if (!expression || expression === 'inline') {
    	            // Initial parse
    	            markdownSource = normalizeContent(el.textContent);
    	            updateContent(el);

    	            // Set up mutation observer for streaming content
    	            const observer = new MutationObserver((mutations) => {
    	                let newContent = null;

    	                for (const mutation of mutations) {
    	                    if (mutation.type === 'childList') {
    	                        const textNodes = Array.from(el.childNodes)
    	                            .filter(node => node.nodeType === Node.TEXT_NODE);
    	                        if (textNodes.length > 0) {
    	                            newContent = textNodes.map(node => node.textContent).join('');
    	                            break;
    	                        }
    	                    } else if (mutation.type === 'characterData') {
    	                        newContent = mutation.target.textContent;
    	                        break;
    	                    }
    	                }

    	                if (newContent && newContent.trim() !== '') {
    	                    updateContent(el, newContent);
    	                }
    	            });

    	            observer.observe(el, {
    	                characterData: true,
    	                childList: true,
    	                subtree: true,
    	                characterDataOldValue: true
    	            });

    	            return;
    	        }

    	        // Handle expressions (file paths, inline strings, content references)
    	        // Check if this is a simple string literal that needs to be quoted
    	        let processedExpression = expression;
    	        if (!expression.includes('+') && !expression.includes('`') && !expression.includes('${') && 
    	            !expression.startsWith('$') && !expression.startsWith("'") && !expression.startsWith('"')) {
    	            // Wrap simple string literals in quotes to prevent Alpine from treating them as expressions
    	            processedExpression = `'${expression.replace(/'/g, "\\'")}'`;
    	        }
    	        const getMarkdownContent = evaluateLater(processedExpression);

    	        effect(() => {
    	            getMarkdownContent(async (pathOrContent) => {
    	                // Reset visibility if content is empty/undefined
    	                if (!pathOrContent || pathOrContent === undefined || pathOrContent === '') {
    	                    el.style.opacity = '0';
    	                    hasContent = false;
    	                    return;
    	                }

    	                if (pathOrContent === undefined) {
    	                    pathOrContent = expression;
    	                }

    	                // Check if this looks like a file path (contains .md, .markdown, or starts with /)
    	                const isFilePath = typeof pathOrContent === 'string' &&
    	                    (pathOrContent.includes('.md') ||
    	                        pathOrContent.includes('.markdown') ||
    	                        pathOrContent.startsWith('/') ||
    	                        pathOrContent.includes('/'));

    	                let markdownContent = pathOrContent;

    	                // If it's a file path, fetch the content
    	                if (isFilePath) {
    	                    try {
    	                        // Ensure the path is absolute from project root
    	                        let resolvedPath = pathOrContent;
    	                        
    	                        // If it's a relative path (doesn't start with /), make it absolute from root
    	                        if (!pathOrContent.startsWith('/')) {
    	                            resolvedPath = '/' + pathOrContent;
    	                        }
    	                        
    	                        const response = await fetch(resolvedPath);
    	                        if (response.ok) {
    	                            markdownContent = await response.text();
    	                        } else {
    	                            console.warn(`[Indux] Failed to fetch markdown file: ${resolvedPath}`);
    	                            markdownContent = `# Error Loading Content\n\nCould not load: ${resolvedPath}`;
    	                        }
    	                    } catch (error) {
    	                        console.error(`[Indux] Error fetching markdown file: ${pathOrContent}`, error);
    	                        markdownContent = `# Error Loading Content\n\nCould not load: ${pathOrContent}\n\nError: ${error.message}`;
    	                    }
    	                }

    	                // Skip empty content
    	                if (!markdownContent || markdownContent.trim() === '') {
    	                    el.style.opacity = '0';
    	                    hasContent = false;
    	                    return;
    	                }

    	                const marked = await loadMarkedJS();
    	                let html = marked.parse(markdownContent);
    	                
    	                // Post-process HTML to enable checkboxes (remove disabled attribute)
    	                html = enableCheckboxes(html);
    	                
    	                // Create temporary container
    	                const temp = document.createElement('div');
    	                temp.innerHTML = html;
    	                
    	                el.innerHTML = '';
    	                while (temp.firstChild) {
    	                    el.appendChild(temp.firstChild);
    	                }
    	                
    	                // Code highlighting is handled by indux.code.js plugin

    	                // Show content with fade-in
    	                hasContent = true;
    	                el.style.opacity = '1';

    	                // Extract headings for anchor links
    	                const headings = [];
    	                const headingElements = el.querySelectorAll('h1, h2, h3');
    	                headingElements.forEach(heading => {
    	                    headings.push({
    	                        id: heading.id,
    	                        text: heading.textContent,
    	                        level: parseInt(heading.tagName.charAt(1))
    	                    });
    	                });

    	                // Store headings in Alpine data if 'headings' modifier is used
    	                if (modifiers.includes('headings')) {
    	                    // Generate a unique ID for this markdown section
    	                    const sectionId = 'markdown-' + Math.random().toString(36).substr(2, 9);
    	                    el.setAttribute('data-headings-section', sectionId);

    	                    // Store headings in a global registry
    	                    if (!window._induxHeadings) {
    	                        window._induxHeadings = {};
    	                    }
    	                    window._induxHeadings[sectionId] = headings;
    	                }
    	            });
    	        });
    	    });
    	    
    	    // If there are existing elements with x-markdown, manually process them with proper Alpine context
    	    if (existingMarkdownElements.length > 0) {
    	        
    	        existingMarkdownElements.forEach(el => {
    	            const expression = el.getAttribute('x-markdown');
    	            
    	            // Create a temporary Alpine component context for this element
    	            const tempComponent = Alpine.$data(el) || {};
    	            
    	            // Use Alpine's evaluation system within the component context
    	            const updateContent = async (element, newContent = null) => {
    	                try {
    	                    if (!newContent) {
    	                        return;
    	                    }
    	                    
    	                    // Load marked.js and parse markdown
    	                    const marked = await loadMarkedJS();
    	                    const processedMarkdown = renderXCodeGroup(newContent);
    	                    let html = marked.parse(processedMarkdown);
    	                    
    	                    // Post-process HTML to enable checkboxes (remove disabled attribute)
    	                    html = html.replace(/<input type="checkbox"([^>]*?)disabled([^>]*?)>/g, '<input type="checkbox"$1$2>');
    	                    
    	                    // Create temporary container
    	                    const temp = document.createElement('div');
    	                    temp.innerHTML = html;
    	                    
    	                    element.innerHTML = '';
    	                    while (temp.firstChild) {
    	                        element.appendChild(temp.firstChild);
    	                    }
    	                    
    	                    // Re-highlight code blocks after content update
    	                    // Code highlighting is handled by indux.code.js plugin
    	                } catch (error) {
    	                    console.error('[Indux Markdown] Failed to process element:', error);
    	                }
    	            };
    	            
    	            // Handle simple string expressions
    	            if (expression.startsWith("'") && expression.endsWith("'")) {
    	                const content = expression.slice(1, -1);
    	                updateContent(el, content);
    	            } else {
    	                // For complex expressions, we need to force Alpine to re-process this element
    	                
    	                // Remove and re-add the attribute to force Alpine to re-process it
    	                const originalExpression = expression;
    	                el.removeAttribute('x-markdown');
    	                
    	                // Use a small delay to ensure the directive is registered
    	                setTimeout(() => {
    	                    el.setAttribute('x-markdown', originalExpression);
    	                }, 50);
    	            }
    	        });
    	    }
    	    
    	    } catch (error) {
    	        console.error('[Indux] Failed to initialize markdown plugin:', error);
    	    }
    	}

    	// Handle both DOMContentLoaded and alpine:init
    	if (document.readyState === 'loading') {
    	    document.addEventListener('DOMContentLoaded', () => {
    	        if (window.Alpine) {
    	            initializeMarkdownPlugin();
    	        }
    	    });
    	}

    	document.addEventListener('alpine:init', () => {
    	    initializeMarkdownPlugin();
    	});
    	return indux_markdown;
    }

    requireIndux_markdown();

    /* Indux Resizer */

    function initializeResizablePlugin() {
        // Cache for unit conversions to avoid repeated DOM manipulation
        const unitCache = new Map();
        let tempConversionEl = null;

        // Helper to convert any unit to pixels (cached and optimized)
            const convertToPixels = (value, unit) => {
                if (unit === 'px') return value;

            const cacheKey = `${value}${unit}`;
            if (unitCache.has(cacheKey)) {
                return unitCache.get(cacheKey);
            }

            // Use a single cached conversion element
            if (!tempConversionEl) {
                tempConversionEl = document.createElement('div');
                tempConversionEl.style.cssText = 'visibility:hidden;position:absolute;top:-9999px;left:-9999px;width:0;height:0;';
                document.body.appendChild(tempConversionEl);
            }

            tempConversionEl.style.width = `${value}${unit}`;
            const pixels = tempConversionEl.getBoundingClientRect().width;
            
            unitCache.set(cacheKey, pixels);
                return pixels;
            };

        // Helper to convert pixels back to original unit (cached)
        const convertFromPixels = (pixels, unit, element) => {
                if (unit === 'px') return pixels;

            const cacheKey = `${pixels}${unit}${element.tagName}`;
            if (unitCache.has(cacheKey)) {
                return unitCache.get(cacheKey);
            }

            let result;
                switch (unit) {
                    case '%':
                    result = (pixels / element.parentElement.getBoundingClientRect().width) * 100;
                    break;
                    case 'rem':
                        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
                    result = pixels / remSize;
                    break;
                    case 'em':
                    const emSize = parseFloat(getComputedStyle(element).fontSize);
                    result = pixels / emSize;
                    break;
                    default:
                    result = pixels;
            }
            
            unitCache.set(cacheKey, result);
            return result;
        };

        Alpine.directive('resize', (el, { modifiers, expression }, { evaluate }) => {
            // Store configuration on the element for lazy initialization
            el._resizeConfig = {
                expression,
                evaluate,
                handles: null,
                initialized: false
            };

            // Load saved width and height immediately if specified
            if (expression) {
                try {
                    const options = evaluate(expression);
                    if (options) {
                        if (options.saveWidth) {
                            const savedWidth = localStorage.getItem(`resizable-${options.saveWidth}`);
                            if (savedWidth) {
                                // Preserve the original unit if saved
                                const [value, unit] = savedWidth.split('|');
                                el.style.width = `${value}${unit || 'px'}`;
                            }
                        }
                        if (options.saveHeight) {
                            const savedHeight = localStorage.getItem(`resizable-${options.saveHeight}`);
                            if (savedHeight) {
                                // Preserve the original unit if saved
                                const [value, unit] = savedHeight.split('|');
                                el.style.height = `${value}${unit || 'px'}`;
                            }
                        }
                    }
                } catch (error) {
                    // Ignore parsing errors here, they'll be handled in initializeResizeElement
                }
            }

            // Add hover listener to create handles on first interaction
            el.addEventListener('mouseenter', initializeResizeElement, { once: true });
        });

        function initializeResizeElement(event) {
            const el = event.target;
            const config = el._resizeConfig;
            if (config.initialized) return;

            config.initialized = true;

            // Helper to parse value and unit from CSS dimension
            const parseDimension = (value) => {
                if (typeof value === 'number') return { value, unit: 'px' };
                const match = String(value).match(/^([\d.]+)(.*)$/);
                return match ? { value: parseFloat(match[1]), unit: match[2] || 'px' } : { value: 0, unit: 'px' };
            };

            // Parse options from expression or use defaults
            let options = {};
            if (config.expression) {
                try {
                    options = config.evaluate(config.expression);
                } catch (error) {
                    console.error('Error parsing x-resize expression:', config.expression, error);
                    options = {};
                }
            }
            const {
                snapDistance = 0,
                snapPoints = [],
                snapCloseX = null,
                snapDistanceX = null,
                snapDistanceY = null,
                snapPointsX = [],
                snapPointsY = [],
                snapCloseY = null,
                toggle = null,
                handles = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
                saveWidth = null,
                saveHeight = null
            } = options;

            // Store handles for cleanup
            config.handles = [];

            // Parse constraints with units
            const constraints = {
                closeX: snapCloseX ? parseDimension(snapCloseX) : null,
                closeY: snapCloseY ? parseDimension(snapCloseY) : null
            };

            // Parse snap points with units
            const parsedSnapPoints = snapPoints.map(point => parseDimension(point));
            const parsedSnapPointsX = snapPointsX.map(point => parseDimension(point));
            const parsedSnapPointsY = snapPointsY.map(point => parseDimension(point));

            // Detect RTL context
            const isRTL = getComputedStyle(el).direction === 'rtl';
            
            // Handle mapping for resize behavior
            const handleMap = {
                // Physical directions (fixed)
                top: { edge: 'top', direction: 'vertical' },
                bottom: { edge: 'bottom', direction: 'vertical' },
                left: { edge: 'left', direction: 'horizontal' },
                right: { edge: 'right', direction: 'horizontal' },
                
                // Corners
                'top-left': { edge: 'top-left', direction: 'both', edges: ['top', 'left'] },
                'top-right': { edge: 'top-right', direction: 'both', edges: ['top', 'right'] },
                'bottom-left': { edge: 'bottom-left', direction: 'both', edges: ['bottom', 'left'] },
                'bottom-right': { edge: 'bottom-right', direction: 'both', edges: ['bottom', 'right'] },
                
                // Logical directions (RTL-aware)
                start: { 
                    edge: isRTL ? 'right' : 'left', 
                    direction: 'horizontal',
                    logical: true
                },
                end: { 
                    edge: isRTL ? 'left' : 'right', 
                    direction: 'horizontal',
                    logical: true
                },
                
                // Logical corners
                'top-start': { 
                    edge: isRTL ? 'top-right' : 'top-left', 
                    direction: 'both', 
                    edges: isRTL ? ['top', 'right'] : ['top', 'left'],
                    logical: true
                },
                'top-end': { 
                    edge: isRTL ? 'top-left' : 'top-right', 
                    direction: 'both', 
                    edges: isRTL ? ['top', 'left'] : ['top', 'right'],
                    logical: true
                },
                'bottom-start': { 
                    edge: isRTL ? 'bottom-right' : 'bottom-left', 
                    direction: 'both', 
                    edges: isRTL ? ['bottom', 'right'] : ['bottom', 'left'],
                    logical: true
                },
                'bottom-end': { 
                    edge: isRTL ? 'bottom-left' : 'bottom-right', 
                    direction: 'both', 
                    edges: isRTL ? ['bottom', 'left'] : ['bottom', 'right'],
                    logical: true
                }
            };

            // Create handles for each specified handle
            handles.forEach(handleName => {
                const handleInfo = handleMap[handleName];
                if (!handleInfo) return;

                const handle = document.createElement('span');
                handle.className = `resize-handle resize-handle-${handleName}`;
                handle.setAttribute('data-handle', handleName);

                let startX, startY, startWidth, startHeight;
                let currentSnap = null;

                // Convert constraints to pixels for calculations
                const pixelConstraints = {
                    closeX: constraints.closeX ? convertToPixels(constraints.closeX.value, constraints.closeX.unit) : null,
                    closeY: constraints.closeY ? convertToPixels(constraints.closeY.value, constraints.closeY.unit) : null
                };

                // Convert snap points to pixels
                const pixelSnapPoints = parsedSnapPoints.map(point => ({
                    value: convertToPixels(point.value, point.unit),
                    unit: point.unit
                }));
                const pixelSnapPointsX = parsedSnapPointsX.map(point => ({
                    value: convertToPixels(point.value, point.unit),
                    unit: point.unit
                }));
                const pixelSnapPointsY = parsedSnapPointsY.map(point => ({
                    value: convertToPixels(point.value, point.unit),
                    unit: point.unit
                }));

                const snapDistancePixels = convertToPixels(snapDistance, 'px');
            const snapDistanceXPixels = snapDistanceX ? convertToPixels(snapDistanceX, 'px') : snapDistancePixels;
            const snapDistanceYPixels = snapDistanceY ? convertToPixels(snapDistanceY, 'px') : snapDistancePixels;

                const handleMouseDown = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = el.getBoundingClientRect().width;
                    startHeight = el.getBoundingClientRect().height;

                    // Show overlay
                    const overlay = document.querySelector('.resize-overlay') || createOverlay();
                    overlay.style.display = 'block';
                    document.body.appendChild(overlay);

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                };

                const handleMouseMove = (e) => {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;

                    let newWidth = startWidth;
                    let newHeight = startHeight;

                    // Calculate new dimensions based on handle type
                    if (handleInfo.direction === 'horizontal' || handleInfo.direction === 'both') {
                        if (handleInfo.edge === 'left' || handleInfo.edge === 'top-left' || handleInfo.edge === 'bottom-left') {
                            newWidth = startWidth - deltaX;
                        } else if (handleInfo.edge === 'right' || handleInfo.edge === 'top-right' || handleInfo.edge === 'bottom-right') {
                        newWidth = startWidth + deltaX;
                        }
                    }

                    if (handleInfo.direction === 'vertical' || handleInfo.direction === 'both') {
                        if (handleInfo.edge === 'top' || handleInfo.edge === 'top-left' || handleInfo.edge === 'top-right') {
                            newHeight = startHeight - deltaY;
                        } else if (handleInfo.edge === 'bottom' || handleInfo.edge === 'bottom-left' || handleInfo.edge === 'bottom-right') {
                            newHeight = startHeight + deltaY;
                        }
                    }

                    // Handle snap-close behavior for width
                    if (pixelConstraints.closeX !== null) {
                        // Close when element becomes smaller than threshold (dragging toward inside)
                        if (newWidth <= pixelConstraints.closeX) {
                            el.classList.add('resizable-closing');
                            currentSnap = 'closing';
                            
                            if (toggle) {
                                config.evaluate(`${toggle} = false`);
                            }
                            return; // Exit early to prevent further width calculations
                        }
                    }

                    // Handle snap-close behavior for height
                    if (pixelConstraints.closeY !== null) {
                        // Close when element becomes smaller than threshold (dragging toward inside)
                        if (newHeight <= pixelConstraints.closeY) {
                            el.classList.add('resizable-closing');
                            currentSnap = 'closing';
                            
                            if (toggle) {
                                config.evaluate(`${toggle} = false`);
                            }
                            return; // Exit early to prevent further height calculations
                        }
                    }

                    // Apply constraints only if we're not closing
                    // Note: maxWidth and maxHeight are now handled by CSS (e.g., Tailwind classes)

                    // Handle normal snap points for width
                    const widthSnapPoints = pixelSnapPointsX.length > 0 ? pixelSnapPointsX : pixelSnapPoints;
                    const widthSnapDistance = snapDistanceXPixels;
                    for (const point of widthSnapPoints) {
                        const distance = Math.abs(newWidth - point.value);
                        if (distance < widthSnapDistance) {
                                newWidth = point.value;
                            currentSnap = `${convertFromPixels(newWidth, point.unit, el)}${point.unit}`;
                                break;
                            }
                    }

                    // Handle normal snap points for height
                    const heightSnapPoints = pixelSnapPointsY.length > 0 ? pixelSnapPointsY : pixelSnapPoints;
                    const heightSnapDistance = snapDistanceYPixels;
                    for (const point of heightSnapPoints) {
                        const distance = Math.abs(newHeight - point.value);
                        if (distance < heightSnapDistance) {
                            newHeight = point.value;
                            currentSnap = `${convertFromPixels(newHeight, point.unit, el)}${point.unit}`;
                            break;
                        }
                    }

                    // Convert back to original unit for display
                    el.style.width = `${newWidth}px`;
                    el.style.height = `${newHeight}px`;
                    el.classList.remove('resizable-closing', 'resizable-closed');
                    if (toggle) {
                        config.evaluate(`${toggle} = true`);
                    }

                    if (currentSnap !== 'closing') {
                        if (saveWidth) {
                        localStorage.setItem(`resizable-${saveWidth}`,
                                `${newWidth}|px`);
                        }
                        if (saveHeight) {
                            localStorage.setItem(`resizable-${saveHeight}`,
                                `${newHeight}|px`);
                        }
                    }

                    // Dispatch resize event
                    el.dispatchEvent(new CustomEvent('resize', {
                        detail: {
                            width: newWidth,
                            height: newHeight,
                            unit: 'px',
                            snap: currentSnap,
                            closing: currentSnap === 'closing'
                        }
                    }));
                };

                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);

                    // Hide overlay
                    const overlay = document.querySelector('.resize-overlay');
                    if (overlay) {
                        overlay.style.display = 'none';
                    }

                    if (currentSnap === 'closing') {
                        el.classList.add('resizable-closed');
                    }
                };

                handle.addEventListener('mousedown', handleMouseDown);
                el.appendChild(handle);
                config.handles.push(handle);
            });
        }

        function createOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'resize-overlay';
            overlay.style.display = 'none';
            return overlay;
        }
    }

    // Initialize the plugin
    if (typeof Alpine !== 'undefined') {
        initializeResizablePlugin();
    } else {
        document.addEventListener('alpine:init', () => {
            initializeResizablePlugin();
        });
    }

    /* Indux Router */

    // Main routing initialization
    function initializeRouting() {

        // Mark as initialized
        window.__induxRoutingInitialized = true;
        window.dispatchEvent(new CustomEvent('indux:routing-ready'));

    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRouting);
    } else {
        initializeRouting();
    }

    // Export main routing interface
    window.InduxRouting = {
        initialize: initializeRouting,
        // Route matching utility
        matchesCondition: (path, condition) => {
            // Normalize path consistently - keep '/' as '/' for home route
            const normalizedPath = path === '/' ? '/' : path.replace(/^\/+|\/+$/g, '') || '/';

            // Get localization codes from manifest
            const localizationCodes = [];
            try {
                const manifest = window.InduxComponentsRegistry?.manifest || window.manifest;
                if (manifest && manifest.data) {
                    Object.values(manifest.data).forEach(dataSource => {
                        if (typeof dataSource === 'object' && dataSource !== null) {
                            Object.keys(dataSource).forEach(key => {
                                if (key.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
                                    localizationCodes.push(key);
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                // Ignore errors if manifest is not available
            }

            // Check if path starts with a localization code
            let pathToCheck = normalizedPath;
            if (localizationCodes.length > 0) {
                const pathSegments = normalizedPath.split('/').filter(segment => segment);
                if (pathSegments.length > 0 && localizationCodes.includes(pathSegments[0])) {
                    // Remove the localization code and check the remaining path
                    pathToCheck = pathSegments.slice(1).join('/') || '/';
                }
            }

            // Handle wildcards
            if (condition.includes('*')) {
                if (condition === '*') return true;
                const wildcardPattern = condition.replace('*', '');
                const normalizedPattern = wildcardPattern.replace(/^\/+|\/+$/g, '');
                return pathToCheck.startsWith(normalizedPattern + '/');
            }

            // Handle exact matches (starting with =) - after localization processing
            if (condition.startsWith('=')) {
                const exactPath = condition.slice(1);
                if (exactPath === '/') {
                    return pathToCheck === '/' || pathToCheck === '';
                }
                const normalizedExactPath = exactPath.replace(/^\/+|\/+$/g, '');
                return pathToCheck === normalizedExactPath;
            }

            // Handle exact paths (starting with /)
            if (condition.startsWith('/')) {
                if (condition === '/') {
                    return pathToCheck === '/' || pathToCheck === '';
                }
                const routePath = condition.replace(/^\//, '');
                return pathToCheck === routePath || pathToCheck.startsWith(routePath + '/');
            }

            // Handle substring matching (default behavior)
            return pathToCheck.includes(condition);
        }
    };


    // Router position

    // Capture initial body order from index.html
    function captureBodyOrder() {
        if (window.__induxBodyOrder) return; // Already captured

        try {
            const req = new XMLHttpRequest();
            req.open('GET', '/index.html', false);
            req.send(null);
            if (req.status === 200) {
                let html = req.responseText;

                // Handle self-closing tags if components plugin isn't available
                if (!window.InduxComponents) {
                    html = html.replace(/<x-([a-z0-9-]+)([^>]*)\s*\/?>/gi, (match, tag, attrs) => `<x-${tag}${attrs}></x-${tag}>`);
                }

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const bodyChildren = Array.from(doc.body.children);

                window.__induxBodyOrder = bodyChildren.map((el, index) => ({
                    index,
                    tag: el.tagName.toLowerCase().trim(),
                    isComponent: el.tagName.toLowerCase().startsWith('x-'),
                    attrs: Array.from(el.attributes).map(attr => [attr.name, attr.value]),
                    key: el.getAttribute('data-component-id') || (el.tagName.toLowerCase().startsWith('x-') ? el.tagName.toLowerCase().replace('x-', '').trim() : null),
                    position: index,
                    content: el.tagName.toLowerCase().startsWith('x-') ? null : el.innerHTML
                }));
            }
        } catch (e) {
            // Failed to load index.html for body order snapshot
        }
    }

    // Assign data-order attributes to all top-level elements
    function assignDataPositions() {
        if (!document.body) return;

        const bodyChildren = Array.from(document.body.children);

        bodyChildren.forEach((element, index) => {
            element.setAttribute('data-order', index.toString());
        });
    }

    // Initialize position management
    function initializePositionManagement() {
        // Capture body order first
        captureBodyOrder();

        // Assign data-order attributes
        assignDataPositions();
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePositionManagement);
    } else {
        initializePositionManagement();
    }

    // Export position management interface
    window.InduxRoutingPosition = {
        initialize: initializePositionManagement,
        captureBodyOrder,
        assignDataPositions
    }; 

    // Router navigation

    // Current route state
    let currentRoute = '/';
    let isInternalNavigation = false;

    // Handle route changes
    async function handleRouteChange() {
        const newRoute = window.location.pathname;
        if (newRoute === currentRoute) return;

        currentRoute = newRoute;

        // Handle scrolling based on whether this is an anchor link or route change
        if (!window.location.hash) {
            // This is a route change - scroll to top
            // Use a small delay to ensure content has loaded
            setTimeout(() => {
                // Scroll main page to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Find and scroll scrollable containers to top
                // Use a generic approach that works with any CSS framework
                // Only check elements that are likely to be scrollable containers
                const potentialContainers = document.querySelectorAll('div, main, section, article, aside, nav, header, footer, .prose');
                potentialContainers.forEach(element => {
                    const computedStyle = window.getComputedStyle(element);
                    const isScrollable = (
                        computedStyle.overflowY === 'auto' || 
                        computedStyle.overflowY === 'scroll' ||
                        computedStyle.overflow === 'auto' || 
                        computedStyle.overflow === 'scroll'
                    ) && element.scrollHeight > element.clientHeight;
                    
                    if (isScrollable) {
                        element.scrollTop = 0;
                    }
                });
            }, 50);
        } else {
            // This is an anchor link - let the browser handle the scroll naturally
            // Use a small delay to ensure content has loaded, then let browser scroll to anchor
            setTimeout(() => {
                // The browser will automatically scroll to the anchor
                // We just need to ensure the content is loaded first
            }, 50);
        }

        // Emit route change event
        window.dispatchEvent(new CustomEvent('indux:route-change', {
            detail: {
                from: currentRoute,
                to: newRoute,
                normalizedPath: newRoute === '/' ? '/' : newRoute.replace(/^\/|\/$/g, '')
            }
        }));
    }

    // Intercept link clicks to prevent page reloads
    function interceptLinkClicks() {
        // Use capture phase to intercept before other handlers
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
            
            // Handle pure anchor links normally - don't intercept them
            if (href.startsWith('#')) return;
            
            // Check if it's an external link FIRST (before any other processing)
            let isExternalLink = false;
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) {
                    isExternalLink = true; // External link
                }
            } catch (e) {
                // Invalid URL, treat as relative
            }

            // If it's an external link, don't intercept it
            if (isExternalLink) {
                return;
            }
            
            // Handle links with both route and anchor (e.g., /page#section)
            if (href.includes('#')) {
                const [path, hash] = href.split('#');
                
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                // Set flag to prevent recursive calls
                isInternalNavigation = true;

                // Update URL without page reload
                history.pushState(null, '', href);

                // Handle route change (but don't scroll to top since there's an anchor)
                handleRouteChange();

                // Reset flag
                isInternalNavigation = false;
                
                // After route change, scroll to the anchor
                setTimeout(() => {
                    const targetElement = document.getElementById(hash);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
                
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Set flag to prevent recursive calls
            isInternalNavigation = true;

            // Update URL without page reload
            history.pushState(null, '', href);

            // Handle route change
            handleRouteChange();

            // Reset flag
            isInternalNavigation = false;

        }, true); // Use capture phase
    }

    // Initialize navigation
    function initializeNavigation() {
        // Set initial route
        currentRoute = window.location.pathname;

        // Intercept link clicks
        interceptLinkClicks();

        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', () => {
            if (!isInternalNavigation) {
                handleRouteChange();
            }
        });

        // Handle initial route
        handleRouteChange();
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNavigation);
    } else {
        initializeNavigation();
    }

    // Export navigation interface
    window.InduxRoutingNavigation = {
        initialize: initializeNavigation,
        getCurrentRoute: () => currentRoute
    }; 

    // Router visibility

    // Process visibility for all elements with x-route
    function processRouteVisibility(normalizedPath) {

        const routeElements = document.querySelectorAll('[x-route]');

        // First pass: collect all defined routes (excluding !* and other negative conditions)
        const definedRoutes = [];
        routeElements.forEach(element => {
            const routeCondition = element.getAttribute('x-route');
            if (!routeCondition) return;

            const conditions = routeCondition.split(',').map(cond => cond.trim());
            conditions.forEach(cond => {
                // Only collect positive conditions and wildcards (not negative ones)
                if (!cond.startsWith('!') && cond !== '!*') {
                    definedRoutes.push(cond);
                }
            });
        });

        // Extract localization codes from manifest.json data sources
        const localizationCodes = [];
        try {
            // Check if manifest is available and has data sources
            const manifest = window.InduxComponentsRegistry?.manifest || window.manifest;
            if (manifest && manifest.data) {
                Object.values(manifest.data).forEach(dataSource => {
                    if (typeof dataSource === 'object' && dataSource !== null) {
                        Object.keys(dataSource).forEach(key => {
                            // Check if this looks like a localization key (common language codes)
                            if (key.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
                                localizationCodes.push(key);
                            }
                        });
                    }
                });
            }
        } catch (e) {
            // Ignore errors if manifest is not available
        }

        // Check if current route is defined by any route
        let isRouteDefined = definedRoutes.some(route => 
            window.InduxRouting.matchesCondition(normalizedPath, route)
        );

        // Also check if the route starts with a localization code
        if (!isRouteDefined && localizationCodes.length > 0) {
            const pathSegments = normalizedPath.split('/').filter(segment => segment);
            if (pathSegments.length > 0) {
                const firstSegment = pathSegments[0];
                if (localizationCodes.includes(firstSegment)) {
                    // This is a localized route - check if the remaining path is defined
                    const remainingPath = pathSegments.slice(1).join('/');
                    
                    // If no remaining path, treat as root route
                    if (remainingPath === '') {
                        isRouteDefined = definedRoutes.some(route => 
                            window.InduxRouting.matchesCondition('/', route) || 
                            window.InduxRouting.matchesCondition('', route)
                        );
                    } else {
                        // Check if the remaining path matches any defined route
                        isRouteDefined = definedRoutes.some(route => 
                            window.InduxRouting.matchesCondition(remainingPath, route)
                        );
                    }
                }
            }
        }

        routeElements.forEach(element => {
            const routeCondition = element.getAttribute('x-route');
            if (!routeCondition) return;

            // Parse route conditions
            const conditions = routeCondition.split(',').map(cond => cond.trim());
            const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
            const negativeConditions = conditions
                .filter(cond => cond.startsWith('!'))
                .map(cond => cond.slice(1));

            // Special handling for !* (undefined routes)
            if (conditions.includes('!*')) {
                const shouldShow = !isRouteDefined;
                if (shouldShow) {
                    element.removeAttribute('hidden');
                    element.style.display = '';
                } else {
                    element.setAttribute('hidden', '');
                    element.style.display = 'none';
                }
                return;
            }

            // Check conditions
            const hasNegativeMatch = negativeConditions.some(cond =>
                window.InduxRouting.matchesCondition(normalizedPath, cond)
            );
            const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                window.InduxRouting.matchesCondition(normalizedPath, cond)
            );

            const shouldShow = hasPositiveMatch && !hasNegativeMatch;

            // Show/hide element
            if (shouldShow) {
                element.removeAttribute('hidden');
                element.style.display = '';
            } else {
                element.setAttribute('hidden', '');
                element.style.display = 'none';
            }
        });
    }

    // Add x-cloak to route elements that don't have it
    function addXCloakToRouteElements() {
        const routeElements = document.querySelectorAll('[x-route]:not([x-cloak])');
        routeElements.forEach(element => {
            element.setAttribute('x-cloak', '');
        });
    }

    // Initialize visibility management
    function initializeVisibility() {
        // Add x-cloak to route elements to prevent flash
        addXCloakToRouteElements();
        
        // Process initial visibility
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
        processRouteVisibility(normalizedPath);

        // Listen for route changes
        window.addEventListener('indux:route-change', (event) => {
            processRouteVisibility(event.detail.normalizedPath);
        });

        // Listen for component processing to ensure visibility is applied after components load
        window.addEventListener('indux:components-processed', () => {
            // Add x-cloak to any new route elements
            addXCloakToRouteElements();
            
            const currentPath = window.location.pathname;
            const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
            processRouteVisibility(normalizedPath);
        });
    }

    // Add x-cloak immediately to prevent flash
    if (document.readyState === 'loading') {
        // DOM is still loading, add x-cloak as soon as possible
        document.addEventListener('DOMContentLoaded', () => {
            addXCloakToRouteElements();
            initializeVisibility();
        });
    } else {
        // DOM is ready, add x-cloak immediately
        addXCloakToRouteElements();
        initializeVisibility();
    }

    // Export visibility interface
    window.InduxRoutingVisibility = {
        initialize: initializeVisibility,
        processRouteVisibility
    }; 

    // Router head

    // Track injected head content to prevent duplicates
    const injectedHeadContent = new Set();

    // Check if an element should be visible based on route conditions
    function shouldElementBeVisible(element, normalizedPath) {

        // Check if element has x-route attribute
        if (element.hasAttribute('x-route')) {
            const routeCondition = element.getAttribute('x-route');

            if (routeCondition) {
                const conditions = routeCondition.split(',').map(cond => cond.trim());
                const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                const negativeConditions = conditions
                    .filter(cond => cond.startsWith('!'))
                    .map(cond => cond.slice(1));

                const hasNegativeMatch = negativeConditions.some(cond => {
                    const matches = window.InduxRouting.matchesCondition(normalizedPath, cond);
                    return matches;
                });

                const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => {
                    const matches = window.InduxRouting.matchesCondition(normalizedPath, cond);
                    return matches;
                });

                const result = hasPositiveMatch && !hasNegativeMatch;
                return result;
            }
        }

        // Check parent elements for x-route
        const parentWithRoute = element.closest('[x-route]');
        if (parentWithRoute) {
            return shouldElementBeVisible(parentWithRoute, normalizedPath);
        }

        // If no route conditions, element is visible
        return true;
    }

    // Generate unique identifier for head content
    function generateHeadId(element) {
        const position = element.getAttribute('data-order');
        const componentId = element.getAttribute('data-component-id');
        const tagName = element.tagName.toLowerCase();

        if (position) {
            return `${tagName}-${position}`;
        } else if (componentId) {
            return `${tagName}-${componentId}`;
        } else {
            return `${tagName}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    // Process head content for a single element
    function processElementHeadContent(element, normalizedPath) {
        let headTemplate = null;

        // Check if the element itself is a template with data-head
        if (element.tagName === 'TEMPLATE' && element.hasAttribute('data-head')) {
            headTemplate = element;
        } else {
            // Look for a template with data-head inside the element
            headTemplate = element.querySelector('template[data-head]');
        }

        if (!headTemplate) {
            return;
        }

        const headId = generateHeadId(element);
        const isVisible = shouldElementBeVisible(element, normalizedPath);

        if (isVisible) {
            // Check if we've already injected this content
            if (injectedHeadContent.has(headId)) {
                return;
            }

            // Add new head content
            Array.from(headTemplate.content.children).forEach(child => {
                if (child.tagName === 'SCRIPT') {
                    // For scripts, create and execute directly
                    const script = document.createElement('script');
                    script.textContent = child.textContent;
                    script.setAttribute('data-route-head', headId);
                    document.head.appendChild(script);
                } else {
                    // For other elements, clone and add
                    const clonedChild = child.cloneNode(true);
                    clonedChild.setAttribute('data-route-head', headId);
                    document.head.appendChild(clonedChild);
                }
            });

            injectedHeadContent.add(headId);
        } else {
            // Element is not visible, remove any existing head content for this element
            const existingHead = document.head.querySelectorAll(`[data-route-head="${headId}"]`);
            existingHead.forEach(el => {
                el.remove();
            });
            injectedHeadContent.delete(headId);
        }
    }

    // Process all head content in the DOM
    function processAllHeadContent(normalizedPath) {

        // Find all elements with head templates
        const elementsWithHead = document.querySelectorAll('template[data-head]');

        // Debug: Let's see what's actually in the DOM
        const allTemplates = document.querySelectorAll('template');
        allTemplates.forEach((template, index) => {
            if (template.hasAttribute('data-head')) ; else {
                // Check if this might be the about template
                if (template.getAttribute('x-route') === 'about') ;
            }
        });

        // Also try a more specific selector to see if we can find the about template
        document.querySelector('template[x-route="about"]');

        // Process each element's head content
        elementsWithHead.forEach((template, index) => {

            // For component templates, we need to check if the component should be visible
            // based on the current route, not just the template's own attributes
            let element = template;
            let shouldProcess = true;

            // If this is a component template (has data-component), check if the component
            // should be visible for the current route
            if (template.hasAttribute('data-component')) {
                template.getAttribute('data-component');
                const componentRoute = template.getAttribute('x-route');

                // Check if this component should be visible for the current route
                if (componentRoute) {
                    const isVisible = window.InduxRouting.matchesCondition(normalizedPath, componentRoute);
                    shouldProcess = isVisible;
                } else {
                    shouldProcess = false;
                }
            } else {
                // For non-component templates, use the existing logic
                element = template.closest('[data-order], [data-component-id], [x-route]');

                // If the template itself has the attributes we need, use it directly
                if (!element || element === template) {
                    if (template.hasAttribute('data-order') || template.hasAttribute('data-component') || template.hasAttribute('x-route')) {
                        element = template;
                    } else {
                        element = template.parentElement;
                    }
                }

                if (element) {
                    const isVisible = shouldElementBeVisible(element, normalizedPath);
                    shouldProcess = isVisible;
                }
            }

            if (shouldProcess) {
                // For component templates, process them directly since we've already determined visibility
                if (template.hasAttribute('data-component')) {
                    processElementHeadContent(template, normalizedPath);
                } else {
                    // For non-component templates, use the existing logic
                    processElementHeadContent(element, normalizedPath);
                }
            }
        });
    }

    // Initialize head content management
    function initializeHeadContent() {
        // Wait for components to be ready before processing head content
        function processHeadContentAfterComponentsReady() {
            // Process initial head content after a longer delay to let components settle
            setTimeout(() => {
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

                // Debug: Check if about component exists
                document.querySelector('[data-component="about-1"]');

                // Debug: Check what placeholders exist
                const placeholders = document.querySelectorAll('x-about, x-home, x-ui');
                placeholders.forEach((placeholder, index) => {
                });

                processAllHeadContent(normalizedPath);
            }, 200);
        }

        // Function to process head content immediately (for projects without components)
        function processHeadContentImmediately() {
            const currentPath = window.location.pathname;
            const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
            processAllHeadContent(normalizedPath);
        }

        // Check if components system exists
        if (window.InduxComponents) {
            // Components system exists - wait for it to be fully processed
            if (window.__induxComponentsInitialized) {
                // Components are initialized, but we need to wait for them to be processed
                // Check if components have already been processed
                if (document.querySelector('[data-component]')) {
                    processHeadContentAfterComponentsReady();
                } else {
                    // Wait for components to be processed
                    window.addEventListener('indux:components-processed', processHeadContentAfterComponentsReady);
                }
            } else {
                // Wait for components to be ready, then wait for them to be processed
                window.addEventListener('indux:components-ready', () => {
                    window.addEventListener('indux:components-processed', processHeadContentAfterComponentsReady);
                });
            }
        } else {
            // No components system - process immediately
            processHeadContentImmediately();
        }

        // Listen for route changes - process immediately after components are ready
        window.addEventListener('indux:route-change', (event) => {

            // Wait a bit for components to settle after route change
            setTimeout(() => {
                // Process head content immediately to catch components before they're reverted
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

                // Debug: Check if about component exists
                document.querySelector('[data-component="about-1"]');

                // Debug: Check what placeholders exist
                const placeholders = document.querySelectorAll('x-about, x-home, x-ui');
                placeholders.forEach((placeholder, index) => {
                });

                processAllHeadContent(normalizedPath);
            }, 100);
        });
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHeadContent);
    } else {
        initializeHeadContent();
    }

    // Export head content interface
    window.InduxRoutingHead = {
        initialize: initializeHeadContent,
        processElementHeadContent,
        processAllHeadContent
    }; 

    // Router anchors

    // Anchors functionality
    function initializeAnchors() {
        
        // Register anchors directive  
        Alpine.directive('anchors', (el, { expression, modifiers }, { effect, evaluateLater, Alpine }) => {

            
            try {
                // Parse pipeline syntax: 'scope | targets'
                const parseExpression = (expr) => {
                    if (!expr || expr.trim() === '') {
                        return { scope: '', targets: 'h1, h2, h3, h4, h5, h6' };
                    }
                    
                    if (expr.includes('|')) {
                        const parts = expr.split('|').map(p => p.trim());
                        return {
                            scope: parts[0] || '',
                            targets: parts[1] || 'h1, h2, h3, h4, h5, h6'
                        };
                    } else {
                        return { scope: '', targets: expr };
                    }
                };
                
                // Extract anchors function
                const extractAnchors = (expr) => {
                    const parsed = parseExpression(expr);
                    
                    let containers = [];
                    if (!parsed.scope) {
                        containers = [document.body];
                    } else {
                        containers = Array.from(document.querySelectorAll(parsed.scope));
                    }
                    
                    let elements = [];
                    const targets = parsed.targets.split(',').map(t => t.trim());
                    
                    containers.forEach(container => {
                        // Query all targets at once, then filter and sort by DOM order
                        const allMatches = [];
                        targets.forEach(target => {
                            const matches = container.querySelectorAll(target);
                            allMatches.push(...Array.from(matches));
                        });
                        
                        // Remove duplicates and sort by DOM order
                        const uniqueMatches = [...new Set(allMatches)];
                        uniqueMatches.sort((a, b) => {
                            const position = a.compareDocumentPosition(b);
                            if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                            if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                            return 0;
                        });
                        
                        elements.push(...uniqueMatches);
                    });
                    
                    return elements.map((element, index) => {
                        // Generate simple ID
                        let id = element.id;
                        if (!id) {
                            id = element.textContent.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                            if (id) element.id = id;
                        }

                        // Selected state will be managed by intersection observer

                        return {
                            id: id,
                            text: element.textContent,
                            link: `#${id}`,
                            tag: element.tagName.toLowerCase(),
                            class: element.className.split(' ')[0] || '',
                            classes: Array.from(element.classList),
                            index: index,
                            element: element,

                        };
                    });
                };
                
                // Track rendered elements to prevent duplicates
                let renderedElements = [];
                
                // Update Alpine data with anchors
                const updateAnchors = (anchors) => {
                    // Remove existing rendered elements if they exist
                    renderedElements.forEach(element => {
                        if (element.parentElement) {
                            element.remove();
                        }
                    });
                    renderedElements = [];
                    
                    // Set Alpine reactive property for anchor count
                    Alpine.store('anchors', { count: anchors.length });
                    
                    // Render using the template element's structure and classes
                    if (anchors.length > 0) {
                        // Find the container div inside the template
                        const templateContent = el.content || el;
                        const containerTemplate = templateContent.querySelector('div') || el.querySelector('div');
                        
                        if (containerTemplate) {
                            // Clone the container div from the template
                            const containerElement = containerTemplate.cloneNode(false); // Don't clone children
                            
                            // Remove Alpine directives from the container
                            containerElement.removeAttribute('x-show');
                            
                            anchors.forEach(anchor => {
                                // Find the <a> element inside the template
                                const anchorTemplate = templateContent.querySelector('a') || el.querySelector('a');
                                
                                if (anchorTemplate) {
                                    // Clone the <a> element from inside the template
                                    const linkElement = anchorTemplate.cloneNode(true);
                                    
                                    // Remove Alpine directives
                                    linkElement.removeAttribute('x-text');
                                    linkElement.removeAttribute(':href');
                                    
                                    // Set the actual href and text content
                                    linkElement.href = anchor.link;
                                    linkElement.textContent = anchor.text;
                                    
                                    // Evaluate :class binding if present
                                    if (linkElement.hasAttribute(':class')) {
                                        const classBinding = linkElement.getAttribute(':class');
                                        linkElement.removeAttribute(':class');
                                        
                                        try {
                                            // Create a simple evaluator for class bindings
                                            const evaluateClassBinding = (binding, anchor) => {
                                                // Replace anchor.property references with actual values
                                                let evaluated = binding
                                                    .replace(/anchor\.tag/g, `'${anchor.tag}'`)
                                                    .replace(/anchor\.selected/g, anchor.selected ? 'true' : 'false')
                                                    .replace(/anchor\.index/g, anchor.index)
                                                    .replace(/anchor\.id/g, `'${anchor.id}'`)
                                                    .replace(/anchor\.text/g, `'${anchor.text.replace(/'/g, "\\'")}'`)
                                                    .replace(/anchor\.link/g, `'${anchor.link}'`)
                                                    .replace(/anchor\.class/g, `'${anchor.class}'`);
                                                
                                                // Simple object evaluation for class bindings
                                                if (evaluated.includes('{') && evaluated.includes('}')) {
                                                    // Extract the object part
                                                    const objectMatch = evaluated.match(/\{([^}]+)\}/);
                                                    if (objectMatch) {
                                                        const objectContent = objectMatch[1];
                                                        const classPairs = objectContent.split(',').map(pair => pair.trim());
                                                        
                                                        classPairs.forEach(pair => {
                                                            const [className, condition] = pair.split(':').map(s => s.trim());
                                                            if (condition && eval(condition)) {
                                                                linkElement.classList.add(className.replace(/['"]/g, ''));
                                                            }
                                                        });
                                                    }
                                                }
                                            };
                                            
                                            evaluateClassBinding(classBinding, anchor);
                                        } catch (error) {
                                            console.warn('[Indux Anchors] Could not evaluate class binding:', classBinding, error);
                                        }
                                    }
                                    
                                    containerElement.appendChild(linkElement);
                                }
                            });
                            
                            // Insert the container before the template element
                            el.parentElement.insertBefore(containerElement, el);
                            renderedElements.push(containerElement);
                        } else {
                            // Fallback: insert links directly if no container found
                            anchors.forEach(anchor => {
                                const templateContent = el.content || el;
                                const anchorTemplate = templateContent.querySelector('a') || el.querySelector('a');
                                
                                if (anchorTemplate) {
                                    const linkElement = anchorTemplate.cloneNode(true);
                                    linkElement.removeAttribute('x-text');
                                    linkElement.removeAttribute(':href');
                                    linkElement.href = anchor.link;
                                    linkElement.textContent = anchor.text;
                                    
                                    // Evaluate :class binding if present
                                    if (linkElement.hasAttribute(':class')) {
                                        const classBinding = linkElement.getAttribute(':class');
                                        linkElement.removeAttribute(':class');
                                        
                                        try {
                                            // Create a simple evaluator for class bindings
                                            const evaluateClassBinding = (binding, anchor) => {
                                                // Replace anchor.property references with actual values
                                                let evaluated = binding
                                                    .replace(/anchor\.tag/g, `'${anchor.tag}'`)
                                                    .replace(/anchor\.selected/g, anchor.selected ? 'true' : 'false')
                                                    .replace(/anchor\.index/g, anchor.index)
                                                    .replace(/anchor\.id/g, `'${anchor.id}'`)
                                                    .replace(/anchor\.text/g, `'${anchor.text.replace(/'/g, "\\'")}'`)
                                                    .replace(/anchor\.link/g, `'${anchor.link}'`)
                                                    .replace(/anchor\.class/g, `'${anchor.class}'`);
                                                
                                                // Simple object evaluation for class bindings
                                                if (evaluated.includes('{') && evaluated.includes('}')) {
                                                    // Extract the object part
                                                    const objectMatch = evaluated.match(/\{([^}]+)\}/);
                                                    if (objectMatch) {
                                                        const objectContent = objectMatch[1];
                                                        const classPairs = objectContent.split(',').map(pair => pair.trim());
                                                        
                                                        classPairs.forEach(pair => {
                                                            const [className, condition] = pair.split(':').map(s => s.trim());
                                                            if (condition && eval(condition)) {
                                                                linkElement.classList.add(className.replace(/['"]/g, ''));
                                                            }
                                                        });
                                                    }
                                                }
                                            };
                                            
                                            evaluateClassBinding(classBinding, anchor);
                                        } catch (error) {
                                            console.warn('[Indux Anchors] Could not evaluate class binding:', classBinding, error);
                                        }
                                    }
                                    
                                    el.parentElement.insertBefore(linkElement, el);
                                    renderedElements.push(linkElement);
                                }
                            });
                        }
                        
                        el.style.display = 'none'; // Hide template
                    } else {
                        // No anchors - ensure template is visible and elements are cleared
                        el.style.display = '';
                    }
                };
                
                // Try extraction and update data
                const tryExtraction = () => {
                    const anchors = extractAnchors(expression);
                    updateAnchors(anchors);
                    return anchors;
                };
                
                // Try extraction with progressive delays and content detection
                const attemptExtraction = (attempt = 1, maxAttempts = 10) => {
                    const anchors = extractAnchors(expression);
                    
                    if (anchors.length > 0) {
                        updateAnchors(anchors);
                        return true;
                    } else if (attempt < maxAttempts) {
                        setTimeout(() => {
                            attemptExtraction(attempt + 1, maxAttempts);
                        }, attempt * 200); // Progressive delay: 200ms, 400ms, 600ms, etc.
                    } else {
                        // No anchors found after all attempts, update store to clear previous state
                        updateAnchors([]);
                    }
                    return false;
                };
                
                // Store refresh function on element for route changes
                el._x_anchorRefresh = () => {
                    attemptExtraction();
                };
                
                // Start extraction attempts
                attemptExtraction();
                
                
            } catch (error) {
                console.error('[Indux Anchors] Error in directive:', error);
            }
        });
    }

    // Initialize anchors when Alpine is ready
    document.addEventListener('alpine:init', () => {

        try {
            initializeAnchors();

        } catch (error) {
            console.error('[Indux Anchors] Failed to initialize:', error);
        }
    });

    // Refresh anchors when route changes
    window.addEventListener('indux:route-change', () => {
        // Immediately clear the store to hide the h5 element
        Alpine.store('anchors', { count: 0 });
        
        // Wait longer for content to load after route change
        setTimeout(() => {
            const anchorElements = document.querySelectorAll('[x-anchors]');
            anchorElements.forEach(el => {
                const expression = el.getAttribute('x-anchors');
                if (expression && el._x_anchorRefresh) {
                    el._x_anchorRefresh();
                }
            });
        }, 200);
    });

    // Refresh anchors when hash changes (for active state updates)
    window.addEventListener('hashchange', () => {
        const anchorElements = document.querySelectorAll('[x-anchors]');
        anchorElements.forEach(el => {
            if (el._x_anchorRefresh) {
                el._x_anchorRefresh();
            }
        });
    });

    // Also refresh anchors when components are processed
    window.addEventListener('indux:components-processed', () => {
        setTimeout(() => {
            const anchorElements = document.querySelectorAll('[x-anchors]');
            anchorElements.forEach(el => {
                const expression = el.getAttribute('x-anchors');
                if (expression && el._x_anchorRefresh) {
                    el._x_anchorRefresh();
                }
            });
        }, 100);
    }); 

    // Export anchors interface
    window.InduxRoutingAnchors = {
        initialize: initializeAnchors
    };


    // Router magic property

    // Initialize router magic property
    function initializeRouterMagic() {
        // Check if Alpine is available
        if (typeof Alpine === 'undefined') {
            console.error('[Indux Router Magic] Alpine is not available');
            return;
        }
        
        // Create a reactive object for route data
        const route = Alpine.reactive({
            current: window.location.pathname,
            segments: [],
            params: {},
            matches: null
        });

        // Update route when route changes
        const updateRoute = () => {
            const currentRoute = window.InduxRoutingNavigation?.getCurrentRoute() || window.location.pathname;
            
            // Strip localization codes and other injected segments to get the logical route
            let logicalRoute = currentRoute;
            
            // Check if there's a localization code at the start of the path
            const pathParts = currentRoute.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                // Check if first segment is a language code (2-5 characters, alphanumeric with hyphens/underscores)
                const firstSegment = pathParts[0];
                if (/^[a-zA-Z0-9_-]{2,5}$/.test(firstSegment)) {
                    // This might be a language code, check if it's in the available locales
                    const store = Alpine.store('locale');
                    if (store && store.available && store.available.includes(firstSegment)) {
                        // Remove the language code from the path
                        logicalRoute = '/' + pathParts.slice(1).join('/');
                        if (logicalRoute === '/') logicalRoute = '/';
                    }
                }
            }
            
            const normalizedPath = logicalRoute === '/' ? '' : logicalRoute.replace(/^\/|\/$/g, '');
            const segments = normalizedPath ? normalizedPath.split('/').filter(segment => segment) : [];
            
            route.current = logicalRoute;
            route.segments = segments;
            route.params = {};
        };

        // Listen for route changes
        window.addEventListener('indux:route-change', updateRoute);
        window.addEventListener('popstate', updateRoute);
        
        // Register $route magic property - return the route string directly
        Alpine.magic('route', () => route.current);
    }

    // Initialize when Alpine is ready and router is ready
    document.addEventListener('alpine:init', () => {
        // Wait for router to be ready
        const waitForRouter = () => {
            if (window.InduxRoutingNavigation && window.InduxRouting) {
                try {
                    initializeRouterMagic();
                } catch (error) {
                    console.error('[Indux Router Magic] Failed to initialize:', error);
                }
            } else {
                // Wait a bit more for router to initialize
                setTimeout(waitForRouter, 50);
            }
        };
        
        waitForRouter();
    });

    // Also try to initialize immediately if Alpine and router are already available
    if (typeof Alpine !== 'undefined' && window.InduxRoutingNavigation && window.InduxRouting) {
        try {
            initializeRouterMagic();
        } catch (error) {
            console.error('[Indux Router Magic] Failed to initialize immediately:', error);
        }
    }

    // Export magic property interface
    window.InduxRoutingMagic = {
        initialize: initializeRouterMagic
    };

    /* Indux Slides */

    function initializeCarouselPlugin() {

        Alpine.directive('carousel', (el, { value, modifiers, expression }, { evaluate, effect }) => {
            const state = {
                carousel: {
                    autoplay: modifiers.includes('autoplay'),
                    interval: 3000,
                    loop: modifiers.includes('loop'),
                    arrows: modifiers.includes('arrows'),
                    dots: modifiers.includes('dots'),
                    thumbnails: modifiers.includes('thumbnails'),
                    enableDrag: !modifiers.includes('no-drag')
                },
                currentSlide: 0,
                dragging: false,
                startX: 0,

                // Get total slides by counting actual DOM elements
                get totalSlides() {
                    const track = el.querySelector('.carousel-slides');
                    if (!track) return 0;
                    return Array.from(track.children).filter(child =>
                        child.tagName !== 'TEMPLATE'
                    ).length;
                },

                // Navigation methods
                next() {
                    const total = this.totalSlides;
                    if (this.currentSlide >= total - 1) {
                        if (this.carousel.loop) {
                            this.currentSlide = 0;
                        }
                    } else {
                        this.currentSlide++;
                    }
                },

                prev() {
                    const total = this.totalSlides;
                    if (this.currentSlide <= 0) {
                        if (this.carousel.loop) {
                            this.currentSlide = total - 1;
                        }
                    } else {
                        this.currentSlide--;
                    }
                },

                goToSlide(index) {
                    const total = this.totalSlides;
                    if (index >= 0 && index < total) {
                        this.currentSlide = index;
                    }
                },

                // Drag handlers
                startDrag(e) {
                    if (!this.carousel.enableDrag) return;
                    this.dragging = true;
                    this.startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
                },

                drag(e) {
                    if (!this.dragging) return;
                    e.preventDefault();
                    const currentX = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
                    const diff = currentX - this.startX;

                    if (Math.abs(diff) > 50) {
                        if (diff > 0) {
                            this.prev();
                        } else {
                            this.next();
                        }
                        this.dragging = false;
                    }
                },

                endDrag() {
                    this.dragging = false;
                },

                // Add this method to generate dots array
                get dots() {
                    return Array.from({ length: this.totalSlides }, (_, i) => ({
                        index: i,
                        active: i === this.currentSlide
                    }));
                }
            };

            Alpine.bind(el, {
                'x-data'() {
                    return state;
                },

                'x-init'() {
                    setTimeout(() => {
                        const track = el.querySelector('.carousel-slides');
                        if (!track) {
                            console.warn('[Indux] Carousel track element not found. Expected element with class "carousel-slides"');
                            return;
                        }

                        // Setup autoplay if enabled
                        if (this.carousel.autoplay) {
                            let interval;

                            const startAutoplay = () => {
                                interval = setInterval(() => this.next(), this.carousel.interval);
                            };

                            const stopAutoplay = () => {
                                clearInterval(interval);
                            };

                            // Start autoplay
                            startAutoplay();

                            // Pause on hover if autoplay is enabled
                            el.addEventListener('mouseenter', stopAutoplay);
                            el.addEventListener('mouseleave', startAutoplay);

                            // Clean up on element removal
                            el._x_cleanups = el._x_cleanups || [];
                            el._x_cleanups.push(() => {
                                stopAutoplay();
                                el.removeEventListener('mouseenter', stopAutoplay);
                                el.removeEventListener('mouseleave', startAutoplay);
                            });
                        }
                    }, 0);
                }
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeCarouselPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeCarouselPlugin);

    /* Indux Tabs */

    // Simple tabs plugin that acts as a proxy for Alpine's native functionality
    function initializeTabsPlugin() {
        // Process all tab elements
        function processTabs() {
            // Find all x-tab elements
            const tabButtons = document.querySelectorAll('[x-tab]');
            const tabPanels = document.querySelectorAll('[x-tabpanel]');
            
            if (tabButtons.length === 0 && tabPanels.length === 0) {
                return;
            }
            
            // Group panels by their x-tabpanel value
            const panelGroups = {};
            tabPanels.forEach(panel => {
                const panelSet = panel.getAttribute('x-tabpanel') || '';
                const panelId = panel.id || panel.className.split(' ')[0];
                if (panelId) {
                    if (!panelGroups[panelSet]) panelGroups[panelSet] = [];
                    panelGroups[panelSet].push({ element: panel, id: panelId });
                }
            });
            
            // Process each panel group
            Object.entries(panelGroups).forEach(([panelSet, panels]) => {
                const tabProp = panelSet ? `tab_${panelSet}` : 'tab';
                
                // Find the common parent (body or closest x-data element)
                let commonParent = document.body;
                if (panels.length > 0) {
                    commonParent = panels[0].element.closest('[x-data]') || document.body;
                }
                
                // Ensure x-data exists
                if (!commonParent.hasAttribute('x-data')) {
                    commonParent.setAttribute('x-data', '{}');
                }
                
                // Set up x-data with default value
                const existingXData = commonParent.getAttribute('x-data') || '{}';
                let newXData = existingXData;
                
                // Check if the tab property already exists
                const propertyRegex = new RegExp(`${tabProp}\\s*:\\s*'[^']*'`, 'g');
                if (!propertyRegex.test(newXData)) {
                    // Add the tab property with default value (first panel's id)
                    const defaultValue = panels.length > 0 ? panels[0].id : 'a';
                    const tabProperty = `${tabProp}: '${defaultValue}'`;
                    
                    if (newXData === '{}') {
                        newXData = `{ ${tabProperty} }`;
                    } else {
                        const lastBraceIndex = newXData.lastIndexOf('}');
                        if (lastBraceIndex > 0) {
                            const beforeBrace = newXData.substring(0, lastBraceIndex);
                            const afterBrace = newXData.substring(lastBraceIndex);
                            const separator = beforeBrace.trim().endsWith(',') ? '' : ', ';
                            newXData = beforeBrace + separator + tabProperty + afterBrace;
                        }
                    }
                    
                    if (newXData !== existingXData) {
                        commonParent.setAttribute('x-data', newXData);
                    }
                }
                
                // Process panels for this group - add x-show attributes FIRST
                panels.forEach(panel => {
                    const showCondition = `${tabProp} === '${panel.id}'`;
                    panel.element.setAttribute('x-show', showCondition);
                    
                    // Remove x-tabpanel attribute since we've converted it
                    panel.element.removeAttribute('x-tabpanel');
                });
                
                // Process tab buttons for this panel set
                tabButtons.forEach(button => {
                    const tabValue = button.getAttribute('x-tab');
                    if (!tabValue) return;
                    
                    // Check if this button targets panels in this group
                    const targetsThisGroup = panels.some(panel => panel.id === tabValue);
                    if (!targetsThisGroup) return;
                    
                    // Set up click handler
                    const clickHandler = `${tabProp} = '${tabValue}'`;
                    button.setAttribute('x-on:click', clickHandler);
                    
                    // Remove x-tab attribute since we've converted it
                    button.removeAttribute('x-tab');
                });
            });
        }
        
        // Wait for components to be ready first
        document.addEventListener('indux:components-ready', () => {
            setTimeout(processTabs, 100); // Small delay to ensure DOM is settled
        });
        
        // Also listen for components-processed event
        document.addEventListener('indux:components-processed', () => {
            setTimeout(processTabs, 100);
        });
        
        // Also run on DOMContentLoaded as a fallback for non-component pages
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(processTabs, 100);
        });
        
        // Add a fallback timer to catch cases where events don't fire
        setTimeout(() => {
            processTabs();
        }, 2000);
    }

    // Initialize the plugin
    initializeTabsPlugin();

    /* Indux Themes */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeThemePlugin() {

        // Initialize theme state with Alpine reactivity
        const theme = Alpine.reactive({
            current: localStorage.getItem('theme') || 'system'
        });

        // Apply initial theme
        applyTheme(theme.current);

        // Setup system theme listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (theme.current === 'system') {
                applyTheme('system');
            }
        });

        // Register theme directive
        Alpine.directive('theme', (el, { expression }, { evaluate, cleanup }) => {

            const handleClick = () => {
                const newTheme = expression === 'toggle'
                    ? (document.documentElement.classList.contains('dark') ? 'light' : 'dark')
                    : evaluate(expression);
                setTheme(newTheme);
            };

            el.addEventListener('click', handleClick);
            cleanup(() => el.removeEventListener('click', handleClick));
        });

        // Add $theme magic method
        Alpine.magic('theme', () => ({
            get current() {
                return theme.current
            },
            set current(value) {
                setTheme(value);
            }
        }));

        function setTheme(newTheme) {
            if (newTheme === 'toggle') {
                newTheme = theme.current === 'light' ? 'dark' : 'light';
            }

            // Update theme state
            theme.current = newTheme;
            localStorage.setItem('theme', newTheme);

            // Apply theme
            applyTheme(newTheme);
        }

        function applyTheme(theme) {
            const isDark = theme === 'system'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                : theme === 'dark';

            // Update document classes
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(isDark ? 'dark' : 'light');

            // Update meta theme-color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', isDark ? '#000000' : '#FFFFFF');
            }
        }
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) {
                initializeThemePlugin();
            }
        });
    }

    document.addEventListener('alpine:init', initializeThemePlugin);

    /* Indux Toasts */

    const TOAST_DURATION = 3000; // Default duration in ms

    function initializeToastPlugin() {

        // Helper function to get or create container
        const getContainer = () => {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
            return container;
        };

        // Helper function to create icon element
        const createIconElement = (iconName) => {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'iconify';
            iconSpan.setAttribute('data-icon', iconName);
            if (window.Iconify) {
                window.Iconify.scan(iconSpan);
            }
            return iconSpan;
        };

        // Helper function to show toast
        const showToast = (message, { type = '', duration = TOAST_DURATION, dismissible = false, fixed = false, icon = null } = {}) => {
            const container = getContainer();

            // Create toast element
            const toast = document.createElement('div');
            toast.setAttribute('role', 'alert');
            toast.setAttribute('class', type ? `toast ${type}` : 'toast');

            // Create content with optional icon
            const contentHtml = `
            ${icon ? '<span class="toast-icon"></span>' : ''}
            <div class="toast-content">${message}</div>
            ${dismissible || fixed ? '<button class="toast-dismiss-button" aria-label="Dismiss"></button>' : ''}
        `;

            toast.innerHTML = contentHtml;

            // Add icon if specified
            if (icon) {
                const iconContainer = toast.querySelector('.toast-icon');
                iconContainer.appendChild(createIconElement(icon));
            }

            // Add to container
            container.appendChild(toast);

            // Force a reflow before adding the entry class
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    toast.classList.add('toast-entry');
                });
            });

            // Handle dismiss button if present
            if (dismissible || fixed) {
                toast.querySelector('.toast-dismiss-button')?.addEventListener('click', () => {
                    removeToast(toast);
                });
            }

            // Auto dismiss after duration (unless fixed)
            if (!fixed) {
                const timeout = setTimeout(() => {
                    removeToast(toast);
                }, duration);

                // Pause timer on hover
                toast.addEventListener('mouseenter', () => {
                    clearTimeout(timeout);
                });

                // Resume timer on mouse leave
                toast.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        removeToast(toast);
                    }, duration / 2);
                });
            }
        };

        // Helper function to remove toast with animation
        const removeToast = (toast) => {
            toast.classList.remove('toast-entry');
            toast.classList.add('toast-exit');

            // Track all transitions
            let transitions = 0;
            const totalTransitions = 2; // opacity and transform

            toast.addEventListener('transitionend', (e) => {
                transitions++;
                // Only remove the toast after all transitions complete
                if (transitions >= totalTransitions) {
                    // Set height to 0 and opacity to 0 before removing
                    // This allows other toasts to smoothly animate to their new positions
                    toast.style.height = `${toast.offsetHeight}px`;
                    toast.offsetHeight; // Force reflow
                    toast.style.height = '0';
                    toast.style.margin = '0';
                    toast.style.padding = '0';

                    // Finally remove the element after the collapse animation
                    toast.addEventListener('transitionend', () => {
                        toast.remove();
                    }, { once: true });
                }
            });
        };

        // Add toast directive
        Alpine.directive('toast', (el, { modifiers, expression }, { evaluate }) => {
            // Parse options from modifiers
            const options = {
                type: modifiers.includes('brand') ? 'brand' :
                    modifiers.includes('positive') ? 'positive' :
                    modifiers.includes('negative') ? 'negative' :
                    modifiers.includes('accent') ? 'accent' : '',
                dismissible: modifiers.includes('dismiss'),
                fixed: modifiers.includes('fixed')
            };

            // Find duration modifier (any number)
            const durationModifier = modifiers.find(mod => !isNaN(mod));
            if (durationModifier) {
                options.duration = Number(durationModifier);
            } else {
                options.duration = modifiers.includes('long') ? TOAST_DURATION * 2 : TOAST_DURATION;
            }

            // Handle both static and dynamic expressions
            let message;
            try {
                // Check if expression starts with $x (data sources)
                if (expression.startsWith('$x.')) {
                    // Use evaluate for $x expressions to access collections
                    message = evaluate(expression);
                } else if (expression.includes('+') || expression.includes('`') || expression.includes('${')) {
                    // Try to evaluate as a dynamic expression
                    message = evaluate(expression);
                } else {
                    // Use as static string
                    message = expression;
                }
            } catch (e) {
                // If evaluation fails, use the expression as a static string
                message = expression;
            }

            // Store the toast options on the element
            el._toastOptions = { message, options };

            // Add click handler that works with other handlers
            const originalClick = el.onclick;
            el.onclick = (e) => {
                // Call original click handler if it exists
                if (originalClick) {
                    originalClick.call(el, e);
                }
                // Show toast after original handler
                showToast(message, options);
            };
        });

        // Add toast magic to Alpine
        Alpine.magic('toast', () => {
            // Create the base toast function
            const toast = (message, options = {}) => {
                showToast(message, { ...options, type: '' });
            };

            // Add type methods
            toast.brand = (message, options = {}) => {
                showToast(message, { ...options, type: 'brand' });
            };

            toast.accent = (message, options = {}) => {
                showToast(message, { ...options, type: 'accent' });
            };

            toast.positive = (message, options = {}) => {
                showToast(message, { ...options, type: 'positive' });
            };

            toast.negative = (message, options = {}) => {
                showToast(message, { ...options, type: 'negative' });
            };

            // Add dismiss variants
            toast.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: '', dismissible: true });
            };

            toast.brand.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: 'brand', dismissible: true });
            };

            toast.accent.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: 'accent', dismissible: true });
            };

            toast.positive.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: 'positive', dismissible: true });
            };

            toast.negative.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: 'negative', dismissible: true });
            };

            // Add fixed variants
            toast.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: '', fixed: true });
            };

            toast.brand.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: 'brand', fixed: true });
            };

            toast.accent.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: 'accent', fixed: true });
            };

            toast.positive.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: 'positive', fixed: true });
            };

            toast.negative.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: 'negative', fixed: true });
            };

            return toast;
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeToastPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeToastPlugin);

    var indux_tooltips = {};

    /* Indux Tooltips */

    var hasRequiredIndux_tooltips;

    function requireIndux_tooltips () {
    	if (hasRequiredIndux_tooltips) return indux_tooltips;
    	hasRequiredIndux_tooltips = 1;
    	// Get tooltip hover delay from CSS variable
    	function getTooltipHoverDelay(element) {
    	    // Try to get the value from the element first, then from document root
    	    let computedStyle = getComputedStyle(element);
    	    let delayValue = computedStyle.getPropertyValue('--tooltip-hover-delay').trim();
    	    
    	    if (!delayValue) {
    	        // If not found on element, check document root
    	        computedStyle = getComputedStyle(document.documentElement);
    	        delayValue = computedStyle.getPropertyValue('--tooltip-hover-delay').trim();
    	    }
    	    
    	    if (!delayValue) {
    	        return 500; // Default to 500ms if not set
    	    }
    	    
    	    // Parse CSS time value (supports various time units)
    	    const timeValue = parseFloat(delayValue);
    	    
    	    if (delayValue.endsWith('s')) {
    	        return timeValue * 1000; // Convert seconds to milliseconds
    	    } else if (delayValue.endsWith('ms')) {
    	        return timeValue; // Already in milliseconds
    	    } else if (delayValue.endsWith('m')) {
    	        return timeValue * 60 * 1000; // Convert minutes to milliseconds
    	    } else if (delayValue.endsWith('h')) {
    	        return timeValue * 60 * 60 * 1000; // Convert hours to milliseconds
    	    } else if (delayValue.endsWith('min')) {
    	        return timeValue * 60 * 1000; // Convert minutes to milliseconds
    	    } else if (delayValue.endsWith('sec')) {
    	        return timeValue * 1000; // Convert seconds to milliseconds
    	    } else if (delayValue.endsWith('second')) {
    	        return timeValue * 1000; // Convert seconds to milliseconds
    	    } else if (delayValue.endsWith('minute')) {
    	        return timeValue * 60 * 1000; // Convert minutes to milliseconds
    	    } else if (delayValue.endsWith('hour')) {
    	        return timeValue * 60 * 60 * 1000; // Convert hours to milliseconds
    	    } else {
    	        // If no unit, assume milliseconds (backward compatibility)
    	        return timeValue;
    	    }
    	}

    	function initializeTooltipPlugin() {

    	    Alpine.directive('tooltip', (el, { modifiers, expression }, { effect, evaluateLater }) => {

    	        let getTooltipContent;

    	        // If it starts with $x, handle content loading
    	        if (expression.startsWith('$x.')) {
    	            const path = expression.substring(3); // Remove '$x.'
    	            const [contentType, ...pathParts] = path.split('.');

    	            // Create evaluator that uses the $x magic method
    	            getTooltipContent = evaluateLater(expression);

    	            // Ensure content is loaded before showing tooltip
    	            effect(() => {
    	                const store = Alpine.store('collections');
    	                if (store && typeof store.loadCollection === 'function' && !store[contentType]) {
    	                    store.loadCollection(contentType);
    	                }
    	            });
    	        } else {
    	            // Check if expression contains HTML tags (indicating rich content)
    	            if (expression.includes('<') && expression.includes('>')) {
    	                // Treat as literal HTML string - escape any quotes to prevent syntax errors
    	                const escapedExpression = expression.replace(/'/g, "\\'");
    	                getTooltipContent = evaluateLater(`'${escapedExpression}'`);
    	            } else if (expression.includes('+') || expression.includes('`') || expression.includes('${')) {
    	                // Try to evaluate as a dynamic expression
    	                getTooltipContent = evaluateLater(expression);
    	            } else {
    	                // Use as static string
    	                getTooltipContent = evaluateLater(`'${expression}'`);
    	            }
    	        }

    	        effect(() => {
    	            // Generate a unique ID for the tooltip
    	            const tooltipCode = Math.random().toString(36).substr(2, 9);
    	            const tooltipId = `tooltip-${tooltipCode}`;

    	            // Store the original popovertarget if it exists, or check for x-dropdown
    	            let originalTarget = el.getAttribute('popovertarget');
    	            
    	            // If no popovertarget but has x-dropdown, that will become the target
    	            if (!originalTarget && el.hasAttribute('x-dropdown')) {
    	                originalTarget = el.getAttribute('x-dropdown');
    	            }

    	            // Create the tooltip element
    	            const tooltip = document.createElement('div');
    	            tooltip.setAttribute('popover', '');
    	            tooltip.setAttribute('id', tooltipId);
    	            tooltip.setAttribute('class', 'tooltip');

    	            // Store the original anchor name if it exists
    	            el.style.getPropertyValue('anchor-name');
    	            const tooltipAnchor = `--tooltip-${tooltipCode}`;

    	            // Set tooltip content
    	            getTooltipContent(content => {
    	                tooltip.innerHTML = content || '';
    	            });

    	            // Handle positioning modifiers - preserve exact order and build class names like dropdown CSS
    	            const validPositions = ['top', 'bottom', 'start', 'end', 'center', 'corner'];
    	            const positions = modifiers.filter(mod => validPositions.includes(mod));
    	            
    	            if (positions.length > 0) {
    	                // Build class name by joining modifiers with dashes (preserves original order)
    	                const positionClass = positions.join('-');
    	                tooltip.classList.add(positionClass);
    	            }

    	            // Add the tooltip to the document
    	            document.body.appendChild(tooltip);

    	            // State variables for managing tooltip behavior
    	            let showTimeout;
    	            let isMouseDown = false;

    	            el.addEventListener('mouseenter', () => {
    	                if (!isMouseDown) {
    	                    const hoverDelay = getTooltipHoverDelay(el);
    	                    showTimeout = setTimeout(() => {
    	                        // Check if user is actively interacting with other popovers
    	                        const hasOpenPopover = originalTarget && document.getElementById(originalTarget)?.matches(':popover-open');
    	                        
    	                        if (!isMouseDown && !tooltip.matches(':popover-open') && !hasOpenPopover) {
    	                            // Only manage anchor-name if element has other popover functionality
    	                            if (originalTarget) {
    	                                // Store current anchor name (dropdown may have set it by now)
    	                                const currentAnchorName = el.style.getPropertyValue('anchor-name');
    	                                if (currentAnchorName) {
    	                                    el._originalAnchorName = currentAnchorName;
    	                                }
    	                            }
    	                            
    	                            el.style.setProperty('anchor-name', tooltipAnchor);
    	                            tooltip.style.setProperty('position-anchor', tooltipAnchor);

    	                            // Show tooltip without changing popovertarget
    	                            tooltip.showPopover();
    	                        }
    	                    }, hoverDelay);
    	                }
    	            });

    	            el.addEventListener('mouseleave', () => {
    	                clearTimeout(showTimeout);
    	                if (tooltip.matches(':popover-open')) {
    	                    tooltip.hidePopover();
    	                    // Only restore anchor name if element has other popover functionality
    	                    if (originalTarget) {
    	                        restoreOriginalAnchor();
    	                    }
    	                }
    	            });

    	            el.addEventListener('mousedown', () => {
    	                isMouseDown = true;
    	                clearTimeout(showTimeout);
    	                if (tooltip.matches(':popover-open')) {
    	                    tooltip.hidePopover();
    	                }
    	                // Only restore anchor name if element has other popover functionality
    	                if (originalTarget) {
    	                    restoreOriginalAnchor();
    	                }
    	            });

    	            el.addEventListener('mouseup', () => {
    	                isMouseDown = false;
    	            });

    	            // Handle click events - hide tooltip but delay anchor restoration
    	            el.addEventListener('click', (e) => {
    	                clearTimeout(showTimeout);
    	                
    	                // Hide tooltip if open
    	                if (tooltip.matches(':popover-open')) {
    	                    tooltip.hidePopover();
    	                }
    	                
    	                // Don't restore anchor immediately - let other click handlers run first
    	                // This allows dropdown plugin to set its own anchor-name
    	                setTimeout(() => {
    	                    // Only restore anchor if no popover opened from this click
    	                    if (originalTarget) {
    	                        const targetPopover = document.getElementById(originalTarget);
    	                        const isPopoverOpen = targetPopover?.matches(':popover-open');
    	                        if (!targetPopover || !isPopoverOpen) {
    	                            restoreOriginalAnchor();
    	                        }
    	                        // If popover is open, keep current anchor (don't restore)
    	                    } else {
    	                        restoreOriginalAnchor();
    	                    }
    	                }, 100); // Give other plugins time to set their anchors
    	            });

    	            // Helper function to restore original anchor
    	            function restoreOriginalAnchor() {
    	                if (el._originalAnchorName) {
    	                    // Restore the original anchor name
    	                    el.style.setProperty('anchor-name', el._originalAnchorName);
    	                } else {
    	                    // Remove the tooltip anchor name so other plugins can set their own
    	                    el.style.removeProperty('anchor-name');
    	                }
    	            }

    	            // Listen for other popovers opening and close tooltip if needed
    	            const handlePopoverOpen = (event) => {
    	                // If another popover opens and it's not our tooltip, close our tooltip
    	                if (event.target !== tooltip && tooltip.matches(':popover-open')) {
    	                    tooltip.hidePopover();
    	                    // Only restore anchor name if element has other popover functionality
    	                    if (originalTarget) {
    	                        restoreOriginalAnchor();
    	                    }
    	                }
    	            };

    	            // Add global listener for popover events (only if not already added)
    	            if (!el._tooltipPopoverListener) {
    	                document.addEventListener('toggle', handlePopoverOpen);
    	                el._tooltipPopoverListener = handlePopoverOpen;
    	            }

    	            // Cleanup function for when element is removed
    	            const cleanup = () => {
    	                if (el._tooltipPopoverListener) {
    	                    document.removeEventListener('toggle', el._tooltipPopoverListener);
    	                    delete el._tooltipPopoverListener;
    	                }
    	                if (tooltip && tooltip.parentElement) {
    	                    tooltip.remove();
    	                }
    	            };

    	            // Store cleanup function for manual cleanup if needed
    	            el._tooltipCleanup = cleanup;
    	        });
    	    });
    	}

    	// Handle both DOMContentLoaded and alpine:init
    	if (document.readyState === 'loading') {
    	    document.addEventListener('DOMContentLoaded', () => {
    	        if (window.Alpine) initializeTooltipPlugin();
    	    });
    	}

    	document.addEventListener('alpine:init', initializeTooltipPlugin);
    	return indux_tooltips;
    }

    requireIndux_tooltips();

    /* Indux URL Parameters */

    function initializeUrlParametersPlugin() {
        // Initialize empty parameters store
        Alpine.store('urlParams', {
            current: {},
            _initialized: false
        });

        // Cache for debounced updates
        const updateTimeouts = new Map();
        const DEBOUNCE_DELAY = 300;

        // Helper to parse query string
        function parseQueryString(queryString) {
            const params = new URLSearchParams(queryString);
            const result = {};

            for (const [key, value] of params.entries()) {
                // Handle array values (comma-separated)
                if (value.includes(',')) {
                    result[key] = value.split(',').filter(Boolean);
                } else {
                    result[key] = value;
                }
            }

            return result;
        }

        // Helper to stringify query object
        function stringifyQueryObject(query) {
            const params = new URLSearchParams();

            for (const [key, value] of Object.entries(query)) {
                if (Array.isArray(value)) {
                    params.set(key, value.filter(Boolean).join(','));
                } else if (value != null && value !== '') {
                    params.set(key, value);
                }
            }

            return params.toString();
        }

        // Helper to ensure value is in array format
        function ensureArray(value) {
            if (Array.isArray(value)) return value;
            if (value == null || value === '') return [];
            return [value];
        }

        // Update URL with new query parameters
        async function updateURL(updates, action = 'set') {

            const url = new URL(window.location.href);
            const currentParams = parseQueryString(url.search);

            // Apply updates based on action
            for (const [key, value] of Object.entries(updates)) {
                switch (action) {
                    case 'add':
                        const currentAdd = ensureArray(currentParams[key]);
                        const newValues = ensureArray(value);
                        currentParams[key] = [...new Set([...currentAdd, ...newValues])];
                        break;

                    case 'remove':
                        const currentRemove = ensureArray(currentParams[key]);
                        const removeValue = ensureArray(value)[0]; // Take first value to remove
                        currentParams[key] = currentRemove.filter(v => v !== removeValue);
                        if (currentParams[key].length === 0) {
                            delete currentParams[key];
                        }
                        break;

                    case 'set':
                    default:
                        if (value == null || value === '') {
                            delete currentParams[key];
                        } else {
                            currentParams[key] = value;
                        }
                        break;
                }
            }

            // Update URL
            const newQueryString = stringifyQueryObject(currentParams);
            url.search = newQueryString ? `?${newQueryString}` : '';
            console.debug('[Indux] New URL:', url.toString());

            // Update URL using pushState to ensure changes are visible
            window.history.pushState({}, '', url.toString());

            // Update store
            Alpine.store('urlParams', {
                current: currentParams,
                _initialized: true
            });

            // Dispatch event
            document.dispatchEvent(new CustomEvent('url-updated', {
                detail: { updates, action }
            }));

            return currentParams;
        }

        // Add $url magic method
        Alpine.magic('url', () => {
            const store = Alpine.store('urlParams');

            return new Proxy({}, {
                get(target, prop) {
                    // Handle special keys
                    if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
                        return undefined;
                    }

                    // Get current value
                    const value = store.current[prop];

                    // Return a proxy for the value
                    return new Proxy({}, {
                        get(target, key) {
                            if (key === 'value') {
                                // Ensure arrays are returned as arrays, not strings
                                if (Array.isArray(value)) return value;
                                if (typeof value === 'string' && value.includes(',')) {
                                    return value.split(',').filter(Boolean);
                                }
                                // Return undefined/null values as they are (for proper falsy checks)
                                return value;
                            }
                            if (key === 'set') return (newValue) => {
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'set');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'add') return (newValue) => {
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'add');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'remove') return (value) => {
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: value }, 'remove');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'clear') return () => {
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: null }, 'set');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            return undefined;
                        },
                        set(target, key, newValue) {
                            if (key === 'value') {
                                // Make value settable for x-model compatibility
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'set');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                                return true;
                            }
                            return false;
                        }
                    });
                }
            });
        });

        // Initialize with current URL parameters
        const initialParams = parseQueryString(window.location.search);
        Alpine.store('urlParams', {
            current: initialParams,
            _initialized: true
        });

        // Listen for popstate events
        window.addEventListener('popstate', () => {
            const params = parseQueryString(window.location.search);
            Alpine.store('urlParams', {
                current: params,
                _initialized: true
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeUrlParametersPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeUrlParametersPlugin);

    // Utility generators
    // Functions that generate CSS utilities from CSS variable suffixes

    function createUtilityGenerators() {
        return {
            'color-': (suffix, value) => {
                const utilities = [];
                const addUtility = (prefix, property, baseValue) => {
                    utilities.push([`${prefix}-${suffix}`, `${property}: ${baseValue}`]);
                };
                addUtility('text', 'color', value);
                addUtility('bg', 'background-color', value);
                addUtility('border', 'border-color', value);
                addUtility('outline', 'outline-color', value);
                addUtility('ring', 'box-shadow', `0 0 0 1px ${value}`);
                addUtility('fill', 'fill', value);
                addUtility('stroke', 'stroke', value);
                return utilities;
            },
            'font-': (suffix, value) => [
                [`font-${suffix}`, `font-family: ${value}`]
            ],
            'text-': (suffix, value) => [
                [`text-${suffix}`, `font-size: ${value}`]
            ],
            'font-weight-': (suffix, value) => [
                [`font-${suffix}`, `font-weight: ${value}`]
            ],
            'tracking-': (suffix, value) => [
                [`tracking-${suffix}`, `letter-spacing: ${value}`]
            ],
            'leading-': (suffix, value) => [
                [`leading-${suffix}`, `line-height: ${value}`]
            ],
            'breakpoint-': (suffix, value) => [
                [`@${suffix}`, `@media (min-width: ${value})`]
            ],
            'container-': (suffix, value) => [
                [`container-${suffix}`, `max-width: ${value}`],
                [`@container-${suffix}`, `@container (min-width: ${value})`]
            ],
            'spacing-': (suffix, value) => [
                [`gap-${suffix}`, `gap: ${value}`],
                [`p-${suffix}`, `padding: ${value}`],
                [`px-${suffix}`, `padding-left: ${value}; padding-right: ${value}`],
                [`py-${suffix}`, `padding-top: ${value}; padding-bottom: ${value}`],
                [`m-${suffix}`, `margin: ${value}`],
                [`mx-${suffix}`, `margin-left: ${value}; margin-right: ${value}`],
                [`my-${suffix}`, `margin-top: ${value}; margin-bottom: ${value}`],
                [`space-x-${suffix}`, `> * + * { margin-left: ${value}; }`],
                [`space-y-${suffix}`, `> * + * { margin-top: ${value}; }`],
                [`max-w-${suffix}`, `max-width: ${value}`],
                [`max-h-${suffix}`, `max-height: ${value}`],
                [`min-w-${suffix}`, `min-width: ${value}`],
                [`min-h-${suffix}`, `min-height: ${value}`],
                [`w-${suffix}`, `width: ${value}`],
                [`h-${suffix}`, `height: ${value}`]
            ],
            'radius-': (suffix, value) => [
                [`rounded-${suffix}`, `border-radius: ${value}`]
            ],
            'shadow-': (suffix, value) => [
                [`shadow-${suffix}`, `box-shadow: ${value}`]
            ],
            'inset-shadow-': (suffix, value) => [
                [`inset-shadow-${suffix}`, `box-shadow: inset ${value}`]
            ],
            'drop-shadow-': (suffix, value) => [
                [`drop-shadow-${suffix}`, `filter: drop-shadow(${value})`]
            ],
            'blur-': (suffix, value) => [
                [`blur-${suffix}`, `filter: blur(${value})`]
            ],
            'perspective-': (suffix, value) => [
                [`perspective-${suffix}`, `perspective: ${value}`]
            ],
            'aspect-': (suffix, value) => [
                [`aspect-${suffix}`, `aspect-ratio: ${value}`]
            ],
            'ease-': (suffix, value) => [
                [`ease-${suffix}`, `transition-timing-function: ${value}`]
            ],
            'animate-': (suffix, value) => [
                [`animate-${suffix}`, `animation: ${value}`]
            ],
            'border-width-': (suffix, value) => [
                [`border-${suffix}`, `border-width: ${value}`]
            ],
            'border-style-': (suffix, value) => [
                [`border-${suffix}`, `border-style: ${value}`]
            ],
            'outline-': (suffix, value) => [
                [`outline-${suffix}`, `outline-color: ${value}`]
            ],
            'outline-width-': (suffix, value) => [
                [`outline-${suffix}`, `outline-width: ${value}`]
            ],
            'outline-style-': (suffix, value) => [
                [`outline-${suffix}`, `outline-style: ${value}`]
            ],
            'ring-': (suffix, value) => [
                [`ring-${suffix}`, `box-shadow: 0 0 0 ${value} var(--color-ring)`]
            ],
            'ring-offset-': (suffix, value) => [
                [`ring-offset-${suffix}`, `--tw-ring-offset-width: ${value}`]
            ],
            'divide-': (suffix, value) => [
                [`divide-${suffix}`, `border-color: ${value}`]
            ],
            'accent-': (suffix, value) => [
                [`accent-${suffix}`, `accent-color: ${value}`]
            ],
            'caret-': (suffix, value) => [
                [`caret-${suffix}`, `caret-color: ${value}`]
            ],
            'decoration-': (suffix, value) => [
                [`decoration-${suffix}`, `text-decoration-color: ${value}`]
            ],
            'placeholder-': (suffix, value) => [
                [`placeholder-${suffix}`, `&::placeholder { color: ${value} }`]
            ],
            'selection-': (suffix, value) => [
                [`selection-${suffix}`, `&::selection { background-color: ${value} }`]
            ],
            'scrollbar-': (suffix, value) => [
                [`scrollbar-${suffix}`, `scrollbar-color: ${value}`]
            ]
        };
    }



    // Variants and variant groups
    // CSS selector mappings for Tailwind variants

    function createVariants() {
        return {
            // State variants
            'hover': ':hover',
            'focus': ':focus',
            'focus-visible': ':focus-visible',
            'focus-within': ':focus-within',
            'active': ':active',
            'visited': ':visited',
            'target': ':target',
            'first': ':first-child',
            'last': ':last-child',
            'only': ':only-child',
            'odd': ':nth-child(odd)',
            'even': ':nth-child(even)',
            'first-of-type': ':first-of-type',
            'last-of-type': ':last-of-type',
            'only-of-type': ':only-of-type',
            'empty': ':empty',
            'disabled': ':disabled',
            'enabled': ':enabled',
            'checked': ':checked',
            'indeterminate': ':indeterminate',
            'default': ':default',
            'required': ':required',
            'valid': ':valid',
            'invalid': ':invalid',
            'in-range': ':in-range',
            'out-of-range': ':out-of-range',
            'placeholder-shown': ':placeholder-shown',
            'autofill': ':autofill',
            'read-only': ':read-only',
            'read-write': ':read-write',
            'optional': ':optional',
            'user-valid': ':user-valid',
            'user-invalid': ':user-invalid',
            'open': ':is([open], :popover-open, :open) &',
            'closed': ':not(:is([open], :popover-open, :open)) &',
            'paused': '[data-state="paused"] &',
            'playing': '[data-state="playing"] &',
            'muted': '[data-state="muted"] &',
            'unmuted': '[data-state="unmuted"] &',
            'collapsed': '[data-state="collapsed"] &',
            'expanded': '[data-state="expanded"] &',
            'unchecked': ':not(:checked)',
            'selected': '[data-state="selected"] &',
            'unselected': '[data-state="unselected"] &',
            'details-content': '::details-content',
            'nth': ':nth-child',
            'nth-last': ':nth-last-child',
            'nth-of-type': ':nth-of-type',
            'nth-last-of-type': ':nth-last-of-type',
            'has': ':has',
            'not': ':not',

            // Pseudo-elements
            'before': '::before',
            'after': '::after',
            'first-letter': '::first-letter',
            'first-line': '::first-line',
            'marker': '::marker',
            'selection': '::selection',
            'file': '::file-selector-button',
            'backdrop': '::backdrop',
            'placeholder': '::placeholder',
            'target-text': '::target-text',
            'spelling-error': '::spelling-error',
            'grammar-error': '::grammar-error',

            // Media queries
            'dark': '.dark &',
            'light': '.light &',

            // Group variants
            'group': '.group &',
            'group-hover': '.group:hover &',
            'group-focus': '.group:focus &',
            'group-focus-within': '.group:focus-within &',
            'group-active': '.group:active &',
            'group-disabled': '.group:disabled &',
            'group-visited': '.group:visited &',
            'group-checked': '.group:checked &',
            'group-required': '.group:required &',
            'group-valid': '.group:valid &',
            'group-invalid': '.group:invalid &',
            'group-in-range': '.group:in-range &',
            'group-out-of-range': '.group:out-of-range &',
            'group-placeholder-shown': '.group:placeholder-shown &',
            'group-autofill': '.group:autofill &',
            'group-read-only': '.group:read-only &',
            'group-read-write': '.group:read-write &',
            'group-optional': '.group:optional &',
            'group-user-valid': '.group:user-valid &',
            'group-user-invalid': '.group:user-invalid &',

            // Peer variants
            'peer': '.peer ~ &',
            'peer-hover': '.peer:hover ~ &',
            'peer-focus': '.peer:focus ~ &',
            'peer-focus-within': '.peer:focus-within ~ &',
            'peer-active': '.peer:active ~ &',
            'peer-disabled': '.peer:disabled ~ &',
            'peer-visited': '.peer:visited ~ &',
            'peer-checked': '.peer:checked ~ &',
            'peer-required': '.peer:required ~ &',
            'peer-valid': '.peer:valid ~ &',
            'peer-invalid': '.peer:invalid ~ &',
            'peer-in-range': '.peer:in-range ~ &',
            'peer-out-of-range': '.peer:out-of-range ~ &',
            'peer-placeholder-shown': '.peer:placeholder-shown ~ &',
            'peer-autofill': '.peer:autofill ~ &',
            'peer-read-only': '.peer:read-only ~ &',
            'peer-read-write': '.peer:read-write ~ &',
            'peer-optional': '.peer:optional ~ &',
            'peer-user-valid': '.peer:user-valid ~ &',
            'peer-user-invalid': '.peer:user-invalid &',

            'motion-safe': '@media (prefers-reduced-motion: no-preference)',
            'motion-reduce': '@media (prefers-reduced-motion: reduce)',
            'print': '@media print',
            'portrait': '@media (orientation: portrait)',
            'landscape': '@media (orientation: landscape)',
            'contrast-more': '@media (prefers-contrast: more)',
            'contrast-less': '@media (prefers-contrast: less)',
            'forced-colors': '@media (forced-colors: active)',
            'rtl': '&:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *)',
            'ltr': '&:where(:dir(ltr), [dir="ltr"], [dir="ltr"] *)',
            '[dir=rtl]': '[dir="rtl"] &',
            '[dir=ltr]': '[dir="ltr"] &',
            'pointer-fine': '@media (pointer: fine)',
            'pointer-coarse': '@media (pointer: coarse)',
            'pointer-none': '@media (pointer: none)',
            'any-pointer-fine': '@media (any-pointer: fine)',
            'any-pointer-coarse': '@media (any-pointer: coarse)',
            'any-pointer-none': '@media (any-pointer: none)',
            'scripting-enabled': '@media (scripting: enabled)',
            'can-hover': '@media (hover: hover)',
            'can-not-hover': '@media (hover: none)',
            'any-hover': '@media (any-hover: hover)',
            'any-hover-none': '@media (any-hover: none)',
            'any-pointer': '@media (any-pointer: fine)',
            'any-pointer-coarse': '@media (any-pointer: coarse)',
            'any-pointer-none': '@media (any-pointer: none)',
            'color': '@media (color)',
            'color-gamut': '@media (color-gamut: srgb)',
            'color-gamut-p3': '@media (color-gamut: p3)',
            'color-gamut-rec2020': '@media (color-gamut: rec2020)',
            'monochrome': '@media (monochrome)',
            'monochrome-color': '@media (monochrome: 0)',
            'monochrome-grayscale': '@media (monochrome: 1)',
            'inverted-colors': '@media (inverted-colors: inverted)',
            'inverted-colors-none': '@media (inverted-colors: none)',
            'update': '@media (update: fast)',
            'update-slow': '@media (update: slow)',
            'update-none': '@media (update: none)',
            'overflow-block': '@media (overflow-block: scroll)',
            'overflow-block-paged': '@media (overflow-block: paged)',
            'overflow-inline': '@media (overflow-inline: scroll)',
            'overflow-inline-auto': '@media (overflow-inline: auto)',
            'prefers-color-scheme': '@media (prefers-color-scheme: dark)',
            'prefers-color-scheme-light': '@media (prefers-color-scheme: light)',
            'prefers-contrast': '@media (prefers-contrast: more)',
            'prefers-contrast-less': '@media (prefers-contrast: less)',
            'prefers-contrast-no-preference': '@media (prefers-contrast: no-preference)',
            'prefers-reduced-motion': '@media (prefers-reduced-motion: reduce)',
            'prefers-reduced-motion-no-preference': '@media (prefers-reduced-motion: no-preference)',
            'prefers-reduced-transparency': '@media (prefers-reduced-transparency: reduce)',
            'prefers-reduced-transparency-no-preference': '@media (prefers-reduced-transparency: no-preference)',
            'resolution': '@media (resolution: 1dppx)',
            'resolution-low': '@media (resolution: 1dppx)',
            'resolution-high': '@media (resolution: 2dppx)',
            'scan': '@media (scan: progressive)',
            'scan-interlace': '@media (scan: interlace)',
            'scripting': '@media (scripting: enabled)',
            'scripting-none': '@media (scripting: none)',
            'scripting-initial-only': '@media (scripting: initial-only)',

            // Container queries
            'container': '@container',
            'container-name': '@container',

            // Important modifier
            '!': '!important',

            // Responsive breakpoints
            'sm': '@media (min-width: 640px)',
            'md': '@media (min-width: 768px)',
            'lg': '@media (min-width: 1024px)',
            'xl': '@media (min-width: 1280px)',
            '2xl': '@media (min-width: 1536px)',

            // Supports queries
            'supports': '@supports',

            // Starting style
            'starting': '@starting-style',

            // Data attribute variants (common patterns)
            'data-open': '[data-state="open"] &',
            'data-closed': '[data-state="closed"] &',
            'data-checked': '[data-state="checked"] &',
            'data-unchecked': '[data-state="unchecked"] &',
            'data-on': '[data-state="on"] &',
            'data-off': '[data-state="off"] &',
            'data-visible': '[data-state="visible"] &',
            'data-hidden': '[data-state="hidden"] &',
            'data-disabled': '[data-disabled] &',
            'data-loading': '[data-loading] &',
            'data-error': '[data-error] &',
            'data-success': '[data-success] &',
            'data-warning': '[data-warning] &',
            'data-selected': '[data-selected] &',
            'data-highlighted': '[data-highlighted] &',
            'data-pressed': '[data-pressed] &',
            'data-expanded': '[data-expanded] &',
            'data-collapsed': '[data-collapsed] &',
            'data-active': '[data-active] &',
            'data-inactive': '[data-inactive] &',
            'data-valid': '[data-valid] &',
            'data-invalid': '[data-invalid] &',
            'data-required': '[data-required] &',
            'data-optional': '[data-optional] &',
            'data-readonly': '[data-readonly] &',
            'data-write': '[data-write] &',

            // Aria attribute variants (common patterns)
            'aria-expanded': '[aria-expanded="true"] &',
            'aria-collapsed': '[aria-expanded="false"] &',
            'aria-pressed': '[aria-pressed="true"] &',
            'aria-unpressed': '[aria-pressed="false"] &',
            'aria-checked': '[aria-checked="true"] &',
            'aria-unchecked': '[aria-checked="false"] &',
            'aria-selected': '[aria-selected="true"] &',
            'aria-unselected': '[aria-selected="false"] &',
            'aria-invalid': '[aria-invalid="true"] &',
            'aria-valid': '[aria-invalid="false"] &',
            'aria-required': '[aria-required="true"] &',
            'aria-optional': '[aria-required="false"] &',
            'aria-disabled': '[aria-disabled="true"] &',
            'aria-enabled': '[aria-disabled="false"] &',
            'aria-hidden': '[aria-hidden="true"] &',
            'aria-visible': '[aria-hidden="false"] &',
            'aria-busy': '[aria-busy="true"] &',
            'aria-available': '[aria-busy="false"] &',
            'aria-current': '[aria-current="true"] &',
            'aria-not-current': '[aria-current="false"] &',
            'aria-live': '[aria-live="polite"] &, [aria-live="assertive"] &',
            'aria-atomic': '[aria-atomic="true"] &',
            'aria-relevant': '[aria-relevant="additions"] &, [aria-relevant="removals"] &, [aria-relevant="text"] &, [aria-relevant="all"] &'
        };
    }

    function createVariantGroups() {
        return {
            'state': ['hover', 'focus', 'active', 'visited', 'target', 'open', 'closed', 'paused', 'playing', 'muted', 'unmuted', 'collapsed', 'expanded', 'unchecked', 'selected', 'unselected'],
            'child': ['first', 'last', 'only', 'odd', 'even'],
            'form': ['disabled', 'enabled', 'checked', 'indeterminate', 'required', 'valid', 'invalid'],
            'pseudo': ['before', 'after', 'first-letter', 'first-line', 'marker', 'selection', 'file', 'backdrop'],
            'media': ['dark', 'light', 'motion-safe', 'motion-reduce', 'print', 'portrait', 'landscape', 'rtl', 'ltr', 'can-hover', 'can-not-hover', 'any-hover', 'any-hover-none', 'color', 'monochrome', 'inverted-colors', 'inverted-colors-none', 'update', 'update-slow', 'update-none', 'overflow-block', 'overflow-block-paged', 'overflow-inline', 'overflow-inline-auto', 'prefers-color-scheme', 'prefers-color-scheme-light', 'prefers-contrast', 'prefers-contrast-less', 'prefers-contrast-no-preference', 'prefers-reduced-motion', 'prefers-reduced-motion-no-preference', 'prefers-reduced-transparency', 'prefers-reduced-transparency-no-preference', 'resolution', 'resolution-low', 'resolution-high', 'scan', 'scan-interlace', 'scripting', 'scripting-none', 'scripting-initial-only', 'forced-colors', 'contrast-more', 'contrast-less', 'pointer-fine', 'pointer-coarse', 'pointer-none', 'any-pointer-fine', 'any-pointer-coarse', 'any-pointer-none', 'scripting-enabled'],
            'responsive': ['sm', 'md', 'lg', 'xl', '2xl'],
            'group': ['group', 'group-hover', 'group-focus', 'group-active', 'group-disabled', 'group-checked', 'group-required', 'group-valid', 'group-invalid'],
            'peer': ['peer', 'peer-hover', 'peer-focus', 'peer-active', 'peer-disabled', 'peer-checked', 'peer-required', 'peer-valid', 'peer-invalid'],
            'data': ['data-open', 'data-closed', 'data-checked', 'data-unchecked', 'data-visible', 'data-hidden', 'data-disabled', 'data-loading', 'data-error', 'data-success', 'data-warning', 'data-selected', 'data-highlighted', 'data-pressed', 'data-expanded', 'data-collapsed', 'data-active', 'data-inactive', 'data-valid', 'data-invalid', 'data-required', 'data-optional', 'data-readonly', 'data-write'],
            'aria': ['aria-expanded', 'aria-collapsed', 'aria-pressed', 'aria-unpressed', 'aria-checked', 'aria-unchecked', 'aria-selected', 'aria-unselected', 'aria-invalid', 'aria-valid', 'aria-required', 'aria-optional', 'aria-disabled', 'aria-enabled', 'aria-hidden', 'aria-visible', 'aria-busy', 'aria-available', 'aria-current', 'aria-not-current', 'aria-live', 'aria-atomic', 'aria-relevant']
        };
    }



    /* Indux Utilities */

    // Browser runtime compiler
    class TailwindCompiler {
        constructor(options = {}) {
            this.debug = options.debug === true;
            this.startTime = performance.now();
            
            if (this.debug) {
                console.log(`[Indux Utilities] Constructor started at ${this.startTime.toFixed(2)}ms`);
                console.log(`[Indux Utilities] Document readyState: ${document.readyState}`);
                console.log(`[Indux Utilities] Head exists: ${!!document.head}`);
            }

            // Create critical style element FIRST - must be before any rendering
            performance.now();
            this.criticalStyleElement = document.createElement('style');
            this.criticalStyleElement.id = 'utility-styles-critical';
            // Insert at the very beginning of head
            if (document.head) {
                if (document.head.firstChild) {
                    document.head.insertBefore(this.criticalStyleElement, document.head.firstChild);
                } else {
                    document.head.appendChild(this.criticalStyleElement);
                }
                if (this.debug) {
                    console.log(`[Indux Utilities] Critical style element created and inserted at ${(performance.now() - this.startTime).toFixed(2)}ms`);
                }
            } else {
                // If head doesn't exist yet, wait for it (shouldn't happen, but safety check)
                if (this.debug) {
                    console.warn(`[Indux Utilities] Head doesn't exist yet, waiting...`);
                }
                const checkHead = setInterval(() => {
                    if (document.head) {
                        clearInterval(checkHead);
                        if (document.head.firstChild) {
                            document.head.insertBefore(this.criticalStyleElement, document.head.firstChild);
                        } else {
                            document.head.appendChild(this.criticalStyleElement);
                        }
                        if (this.debug) {
                            console.log(`[Indux Utilities] Critical style element inserted after wait at ${(performance.now() - this.startTime).toFixed(2)}ms`);
                        }
                    }
                }, 1);
            }
            
            // Initialize options first (needed for regex patterns)
            this.options = {
                rootSelector: options.rootSelector || ':root',
                themeSelector: options.themeSelector || '@theme',
                debounceTime: options.debounceTime || 50,
                maxCacheAge: options.maxCacheAge || 24 * 60 * 60 * 1000,
                debug: options.debug !== false,
                ...options
            };
            
            // Initialize regex patterns (needed for utility generation)
            this.regexPatterns = {
                root: new RegExp(`${this.options.rootSelector}\\s*{([^}]*)}`, 'g'),
                theme: new RegExp(`${this.options.themeSelector}\\s*{([^}]*)}`, 'g'),
                variable: /--([\w-]+):\s*([^;]+);/g,
                tailwindPrefix: /^(color|font|text|font-weight|tracking|leading|breakpoint|container|spacing|radius|shadow|inset-shadow|drop-shadow|blur|perspective|aspect|ease|animate|border-width|border-style|outline|outline-width|outline-style|ring|ring-offset|divide|accent|caret|decoration|placeholder|selection|scrollbar)-/
            };
            
            // Initialize utility generators from component
            const generators = createUtilityGenerators();
            // Start with minimal generators needed for synchronous generation
            this.utilityGenerators = {
                'color-': generators['color-'],
                'font-': generators['font-'],
                'text-': generators['text-'],
                'font-weight-': generators['font-weight-'],
                'tracking-': generators['tracking-'],
                'leading-': generators['leading-'],
                'spacing-': generators['spacing-'],
                'radius-': generators['radius-'],
                'shadow-': generators['shadow-'],
                'blur-': generators['blur-']
            };
            // Add remaining generators
            Object.assign(this.utilityGenerators, generators);
            
            // Initialize variants from component (needed for parseClassName during sync generation)
            this.variants = createVariants();
            this.variantGroups = createVariantGroups();
            
            // Cache for parsed class names (must be before addCriticalBlockingStylesSync)
            this.classCache = new Map();
            
            // Add critical styles IMMEDIATELY - don't wait for anything
            this.addCriticalBlockingStylesSync();

            // Create main style element for generated utilities
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'utility-styles';
            document.head.appendChild(this.styleElement);
            if (this.debug) {
                console.log(`[Indux Utilities] Main style element created at ${(performance.now() - this.startTime).toFixed(2)}ms`);
            }

            // Initialize properties
            this.tailwindLink = null;
            this.observer = null;
            this.isCompiling = false;
            this.compileTimeout = null;
            this.cache = new Map();
            this.lastThemeHash = null;
            this.processedElements = new WeakSet();
            this.activeBreakpoints = new Set();
            this.activeModifiers = new Set();
            this.cssFiles = new Set();
            this.pendingStyles = new Map();
            this.currentThemeVars = new Map();
            this.hasInitialized = false;
            this.lastCompileTime = 0;
            this.minCompileInterval = 100; // Minimum time between compilations in ms
            this.cssContentCache = new Map(); // Cache CSS file contents with timestamps
            this.lastClassesHash = ''; // Track changes in used classes
            this.staticClassCache = new Set(); // Cache classes found in static HTML/components
            this.dynamicClassCache = new Set(); // Cache classes that appear dynamically
            this.hasScannedStatic = false; // Track if we've done initial static scan
            this.staticScanPromise = null; // Promise for initial static scan
            this.ignoredClassPatterns = [ // Patterns for classes to ignore
                /^hljs/, /^language-/, /^copy$/, /^copied$/, /^lines$/, /^selected$/
            ];
            this.ignoredElementSelectors = [ // Elements to ignore for DOM mutations
                'pre', 'code', 'x-code', 'x-code-group'
            ];
            this.ignoredAttributes = [ // Attribute changes to ignore (non-visual/utility changes)
                'id', 'data-order', 'data-component-id', 'data-highlighted', 'data-processed',
                'x-intersect', 'x-intersect:leave', 'x-show', 'x-hide', 'x-transition',
                'aria-expanded', 'aria-selected', 'aria-current', 'aria-hidden', 'aria-label',
                'tabindex', 'role', 'title', 'alt', 'data-state', 'data-value'
            ];
            this.significantChangeSelectors = [ // Only these DOM additions trigger recompilation
                '[data-component]', '[x-data]' // Components and Alpine elements
            ];

            // Pre-define pseudo classes
            this.pseudoClasses = ['hover', 'focus', 'active', 'disabled', 'dark'];

            // Cache for discovered custom utility classes
            this.customUtilities = new Map();

            // Variants and classCache already initialized above (before addCriticalBlockingStylesSync)

            // Load cache and start processing
            this.loadAndApplyCache();

            // If cache loaded utilities, they'll be in the main style element
            // The critical style element will be cleared when full utilities are ready

            // Try to generate minimal utilities synchronously from inline styles
            this.generateSynchronousUtilities();

            // Listen for component loads
            this.setupComponentLoadListener();

            this.waitForTailwind().then(() => {
                this.startProcessing();
            });
        }

        // Public API for other plugins to configure behavior
        addIgnoredClassPattern(pattern) {
            if (pattern instanceof RegExp) {
                this.ignoredClassPatterns.push(pattern);
            } else if (typeof pattern === 'string') {
                this.ignoredClassPatterns.push(new RegExp(pattern));
            }
        }

        addIgnoredElementSelector(selector) {
            if (typeof selector === 'string') {
                this.ignoredElementSelectors.push(selector);
            }
        }

        addSignificantChangeSelector(selector) {
            if (typeof selector === 'string') {
                this.significantChangeSelectors.push(selector);
            }
        }

        // Allow plugins to trigger recompilation when needed
        triggerRecompilation(reason = 'manual') {
            this.compile();
        }

        // Debounce utility
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Wait for Tailwind to be available
        async waitForTailwind() {
            return new Promise((resolve) => {
                if (this.isTailwindAvailable()) {
                    resolve();
                    return;
                }

                const checkInterval = setInterval(() => {
                    if (this.isTailwindAvailable()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);

                // Also check on DOMContentLoaded
                document.addEventListener('DOMContentLoaded', () => {
                    if (this.isTailwindAvailable()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                });

                // Set a timeout to prevent infinite waiting
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }

        // Check if Tailwind is available
        isTailwindAvailable() {
            // Check for Tailwind in various ways
            return (
                // Check for Tailwind CSS file
                Array.from(document.styleSheets).some(sheet =>
                    sheet.href && (
                        sheet.href.includes('tailwind') ||
                        sheet.href.includes('tailwindcss') ||
                        sheet.href.includes('indux')
                    )
                ) ||
                // Check for Tailwind classes in document
                document.querySelector('[class*="tailwind"]') ||
                // Check for Tailwind in window object
                window.tailwind ||
                // Check for Tailwind in document head
                document.head.innerHTML.includes('tailwind') ||
                // Check for Indux CSS files
                document.head.innerHTML.includes('indux')
            );
        }
    }



    // Synchronous utility generation
    // Methods for generating utilities synchronously before first paint

    TailwindCompiler.prototype.addCriticalBlockingStylesSync = function() {
        if (!this.criticalStyleElement) return;
        
        const syncStart = performance.now();
        if (this.debug) {
            console.log(`[Indux Utilities] Starting synchronous utility generation at ${(syncStart - this.startTime).toFixed(2)}ms`);
        }
        
        try {
            // Extract CSS variables synchronously from already-loaded sources
            const cssVariables = new Map();
            
            // 1. From inline style elements (already in DOM)
            const inlineStyles = document.querySelectorAll('style:not(#utility-styles):not(#utility-styles-critical)');
            if (this.debug) {
                console.log(`[Indux Utilities] Found ${inlineStyles.length} inline style elements`);
            }
            for (const styleEl of inlineStyles) {
                if (styleEl.textContent) {
                    const variables = this.extractThemeVariables(styleEl.textContent);
                    for (const [name, value] of variables.entries()) {
                        cssVariables.set(name, value);
                    }
                }
            }
            if (this.debug && cssVariables.size > 0) {
                console.log(`[Indux Utilities] Extracted ${cssVariables.size} CSS variables from inline styles`);
            }
            
            // 2. From HTML source (parse style tags in HTML)
            try {
                if (document.documentElement) {
                    const htmlSource = document.documentElement.outerHTML;
                    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
                    let styleMatch;
                    while ((styleMatch = styleRegex.exec(htmlSource)) !== null) {
                        const cssContent = styleMatch[1];
                        const variables = this.extractThemeVariables(cssContent);
                        for (const [name, value] of variables.entries()) {
                            cssVariables.set(name, value);
                        }
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
            
            // 3. From loaded stylesheets (synchronously read CSS rules)
            try {
                const stylesheets = Array.from(document.styleSheets);
                if (this.debug) {
                    console.log(`[Indux Utilities] Found ${stylesheets.length} stylesheets`);
                }
                for (const sheet of stylesheets) {
                    try {
                        // Try to access CSS rules (may fail due to CORS)
                        const rules = Array.from(sheet.cssRules || []);
                        for (const rule of rules) {
                            if (rule.type === CSSRule.STYLE_RULE && rule.styleSheet) {
                                // Handle @import rules that have nested stylesheets
                                try {
                                    const nestedRules = Array.from(rule.styleSheet.cssRules || []);
                                    for (const nestedRule of nestedRules) {
                                        if (nestedRule.type === CSSRule.STYLE_RULE) {
                                            const cssText = nestedRule.cssText;
                                            const variables = this.extractThemeVariables(cssText);
                                            for (const [name, value] of variables.entries()) {
                                                cssVariables.set(name, value);
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // Ignore nested rule errors
                                }
                            }
                            if (rule.type === CSSRule.STYLE_RULE) {
                                const cssText = rule.cssText;
                                const variables = this.extractThemeVariables(cssText);
                                for (const [name, value] of variables.entries()) {
                                    cssVariables.set(name, value);
                                }
                            }
                        }
                    } catch (e) {
                        // CORS or other access errors - expected for some stylesheets
                        if (this.debug && sheet.href) {
                            console.log(`[Indux Utilities] Cannot access stylesheet (CORS?): ${sheet.href}`);
                        }
                    }
                }
                if (this.debug && cssVariables.size > 0) {
                    console.log(`[Indux Utilities] Extracted ${cssVariables.size} CSS variables from stylesheets`);
                }
            } catch (e) {
                if (this.debug) {
                    console.warn(`[Indux Utilities] Error reading stylesheets:`, e);
                }
            }
            
            // 4. From computed styles (if :root is available)
            try {
                if (document.documentElement && document.readyState !== 'loading') {
                    const rootStyles = getComputedStyle(document.documentElement);
                    let computedVars = 0;
                    for (let i = 0; i < rootStyles.length; i++) {
                        const prop = rootStyles[i];
                        if (prop.startsWith('--')) {
                            const value = rootStyles.getPropertyValue(prop);
                            if (value && value.trim()) {
                                cssVariables.set(prop.substring(2), value.trim());
                                computedVars++;
                            }
                        }
                    }
                    if (this.debug && computedVars > 0) {
                        console.log(`[Indux Utilities] Extracted ${computedVars} CSS variables from computed styles`);
                    }
                }
            } catch (e) {
                // Ignore errors
            }
            
            // 5. Scan for classes that need utilities
            const classesToGenerate = new Set();
            try {
                // Method A: Scan HTML source
                if (document.documentElement) {
                    const htmlSource = document.documentElement.outerHTML;
                    const classRegex = /class=["']([^"']+)["']/gi;
                    let classMatch;
                    while ((classMatch = classRegex.exec(htmlSource)) !== null) {
                        const classes = classMatch[1].split(/\s+/).filter(Boolean);
                        for (const cls of classes) {
                            // Match utility patterns that might use CSS variables
                            if (/^(border|bg|text|ring|outline|decoration|caret|accent|fill|stroke)-[a-z0-9-]+(\/[0-9]+)?$/.test(cls)) {
                                classesToGenerate.add(cls);
                            }
                        }
                    }
                }
                
                // Method B: Scan DOM directly (if body exists)
                if (document.body) {
                    const elements = document.body.querySelectorAll('*');
                    for (const el of elements) {
                        if (el.className && typeof el.className === 'string') {
                            const classes = el.className.split(/\s+/).filter(Boolean);
                            for (const cls of classes) {
                                if (/^(border|bg|text|ring|outline|decoration|caret|accent|fill|stroke)-[a-z0-9-]+(\/[0-9]+)?$/.test(cls)) {
                                    classesToGenerate.add(cls);
                                }
                            }
                        }
                    }
                }
                
                if (this.debug) {
                    console.log(`[Indux Utilities] Found ${classesToGenerate.size} utility classes to generate`);
                    if (classesToGenerate.size > 0) {
                        console.log(`[Indux Utilities] Sample classes: ${Array.from(classesToGenerate).slice(0, 5).join(', ')}`);
                    }
                }
            } catch (e) {
                if (this.debug) {
                    console.warn(`[Indux Utilities] Error scanning for classes:`, e);
                }
            }
            
            // Generate utilities synchronously if we have CSS variables
            if (this.debug) {
                console.log(`[Indux Utilities] CSS variables found: ${cssVariables.size}, Classes found: ${classesToGenerate.size}`);
            }
            
            if (cssVariables.size > 0) {
                const generateStart = performance.now();
                const cssText = Array.from(cssVariables.entries())
                    .map(([name, value]) => `--${name}: ${value};`)
                    .join('\n');
                
                const tempCss = `:root { ${cssText} }`;
                
                // If we have classes, use them. Otherwise, try to get classes from cache
                let usedData = null; // Initialize to null so we can detect when it's not set
                if (classesToGenerate.size > 0) {
                    usedData = {
                        classes: Array.from(classesToGenerate),
                        variableSuffixes: []
                    };
                } else {
                    // Try to get classes from cache (most efficient - only generate what was used before)
                    const cached = localStorage.getItem('tailwind-cache');
                    let cachedClasses = new Set();
                    
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            const cacheEntries = Object.values(parsed);
                            
                            // Extract classes from cache keys (format: "class1,class2-themeHash")
                            for (const entry of cacheEntries) {
                                // Find the cache entry with the most recent timestamp
                                const mostRecent = cacheEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
                                if (mostRecent && mostRecent.css) {
                                    // Extract class names from generated CSS
                                    const classMatches = mostRecent.css.match(/\.([a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*)\s*{/g);
                                    if (classMatches) {
                                        for (const match of classMatches) {
                                            const className = match.replace(/^\./, '').replace(/\s*{.*$/, '');
                                            // Only include utility classes (not Tailwind native like red-500)
                                            if (/^(border|bg|text|ring|outline|decoration|caret|accent|fill|stroke)-[a-z0-9-]+(\/[0-9]+)?$/.test(className.split(':').pop())) {
                                                cachedClasses.add(className);
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore cache parsing errors
                        }
                    }
                    
                    if (cachedClasses.size > 0) {
                        usedData = {
                            classes: Array.from(cachedClasses),
                            variableSuffixes: []
                        };
                        if (this.debug) {
                            console.log(`[Indux Utilities] Using ${cachedClasses.size} classes from cache for synchronous generation`);
                        }
                    } else {
                        // Last resort: scan HTML source text directly
                        try {
                            const htmlText = document.documentElement.innerHTML || '';
                            const classMatches = htmlText.match(/class=["']([^"']+)["']/g);
                            if (classMatches) {
                                for (const match of classMatches) {
                                    const classString = match.replace(/class=["']/, '').replace(/["']$/, '');
                                    const classes = classString.split(/\s+/).filter(Boolean);
                                    for (const cls of classes) {
                                        if (/^(border|bg|text|ring|outline|decoration|caret|accent|fill|stroke)-[a-z0-9-]+(\/[0-9]+)?$/.test(cls)) {
                                            cachedClasses.add(cls);
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                        
                        if (cachedClasses.size > 0) {
                            usedData = {
                                classes: Array.from(cachedClasses),
                                variableSuffixes: []
                            };
                            if (this.debug) {
                                console.log(`[Indux Utilities] Found ${cachedClasses.size} classes from HTML source text`);
                            }
                        }
                        // If still no classes, continue to generate utilities for all color variables
                    }
                }
                
                // If no classes found, generate utilities for all color variables
                if (!usedData || !usedData.classes || usedData.classes.length === 0) {
                    if (this.debug) {
                        console.log(`[Indux Utilities] No classes found in DOM/cache, checking for color variables to generate utilities...`);
                    }
                    
                    // Generate utilities for all color-* variables to prevent flash
                    const colorVars = Array.from(cssVariables.entries())
                        .filter(([name]) => name.startsWith('color-'));
                    
                    if (this.debug) {
                        console.log(`[Indux Utilities] Found ${colorVars.length} color variables out of ${cssVariables.size} total variables`);
                    }
                    
                    if (colorVars.length > 0) {
                        // Create synthetic classes for all color utilities (text, bg, border)
                        const syntheticClasses = [];
                        for (const [varName] of colorVars) {
                            const suffix = varName.replace('color-', '');
                            syntheticClasses.push(`text-${suffix}`);
                            syntheticClasses.push(`bg-${suffix}`);
                            syntheticClasses.push(`border-${suffix}`);
                        }
                        usedData = {
                            classes: syntheticClasses,
                            variableSuffixes: []
                        };
                        if (this.debug) {
                            console.log(`[Indux Utilities] Generating utilities for all ${colorVars.length} color variables (${syntheticClasses.length} synthetic classes) to prevent flash`);
                        }
                    } else {
                        if (this.debug) {
                            console.log(`[Indux Utilities] No color variables found, skipping synchronous generation`);
                        }
                        return;
                    }
                }
                
                const generated = this.generateUtilitiesFromVars(tempCss, usedData);
                if (generated) {
                    const applyStart = performance.now();
                    this.criticalStyleElement.textContent = generated;
                    
                    // Force a synchronous style recalculation
                    if (document.body) {
                        // Trigger a reflow to force style application
                        void document.body.offsetHeight;
                    } else {
                        // If body doesn't exist yet, force reflow on documentElement
                        void document.documentElement.offsetHeight;
                    }
                    
                    const applyEnd = performance.now();
                    
                    if (this.debug) {
                        const sampleClasses = usedData.classes.slice(0, 5).join(', ');
                        console.log(`[Indux Utilities] Generated ${generated.split('{').length - 1} utility rules in ${(applyStart - generateStart).toFixed(2)}ms`);
                        console.log(`[Indux Utilities] Applied critical utilities to DOM at ${(applyEnd - this.startTime).toFixed(2)}ms`);
                        console.log(`[Indux Utilities] Critical utilities length: ${generated.length} chars`);
                        console.log(`[Indux Utilities] Sample classes generated: ${sampleClasses}${usedData.classes.length > 5 ? '...' : ''}`);
                    }
                } else {
                    if (this.debug) {
                        console.warn(`[Indux Utilities] No utilities generated despite having ${cssVariables.size} variables`);
                    }
                }
            } else {
                if (this.debug) {
                    console.warn(`[Indux Utilities] Cannot generate utilities: no CSS variables found`);
                }
            }
        } catch (error) {
            if (this.debug) {
                console.error(`[Indux Utilities] Error in synchronous generation:`, error);
            }
        } finally {
            if (this.debug) {
                console.log(`[Indux Utilities] Synchronous generation completed in ${(performance.now() - syncStart).toFixed(2)}ms`);
            }
        }
    };

    // Generate synchronous utilities (fallback method)
    TailwindCompiler.prototype.generateSynchronousUtilities = function() {
        try {
            // Always try to generate, even if cache exists, to catch any new classes
            const hasExistingStyles = this.styleElement.textContent && this.styleElement.textContent.trim();

            let cssVariables = new Map();
            const commonColorClasses = new Set();

            // Method 1: Extract from inline style elements
            const inlineStyles = document.querySelectorAll('style:not(#utility-styles)');
            for (const styleEl of inlineStyles) {
                if (styleEl.textContent) {
                    const variables = this.extractThemeVariables(styleEl.textContent);
                    for (const [name, value] of variables.entries()) {
                        cssVariables.set(name, value);
                    }
                }
            }

            // Method 2: Parse HTML source directly for CSS variables in <style> tags
            try {
                const htmlSource = document.documentElement.outerHTML;
                // Extract CSS from <style> tags in HTML source
                const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
                let styleMatch;
                while ((styleMatch = styleRegex.exec(htmlSource)) !== null) {
                    const cssContent = styleMatch[1];
                    const variables = this.extractThemeVariables(cssContent);
                    for (const [name, value] of variables.entries()) {
                        cssVariables.set(name, value);
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }

            // Method 3: Check computed styles from :root (if available)
            try {
                if (document.readyState !== 'loading') {
                    const rootStyles = getComputedStyle(document.documentElement);
                    // Extract all CSS variables, not just color ones
                    const allProps = rootStyles.length;
                    for (let i = 0; i < allProps; i++) {
                        const prop = rootStyles[i];
                        if (prop.startsWith('--')) {
                            const value = rootStyles.getPropertyValue(prop);
                            if (value && value.trim()) {
                                cssVariables.set(prop.substring(2), value.trim());
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore errors accessing computed styles
            }

            // Method 4: Scan HTML source directly for class attributes
            try {
                const htmlSource = document.documentElement.outerHTML;
                // Extract all class attributes from HTML source
                const classRegex = /class=["']([^"']+)["']/gi;
                let classMatch;
                while ((classMatch = classRegex.exec(htmlSource)) !== null) {
                    const classString = classMatch[1];
                    const classes = classString.split(/\s+/).filter(Boolean);
                    for (const cls of classes) {
                        // Match common color utility patterns (more comprehensive)
                        if (/^(border|bg|text|ring|outline|decoration|caret|accent|fill|stroke)-[a-z0-9-]+(\/[0-9]+)?$/.test(cls)) {
                            commonColorClasses.add(cls);
                        }
                    }
                }
            } catch (e) {
                // Fallback: scan DOM if HTML parsing fails
                const elements = document.querySelectorAll('*');
                for (const el of elements) {
                    if (el.className && typeof el.className === 'string') {
                        const classes = el.className.split(/\s+/);
                        for (const cls of classes) {
                            if (/^(border|bg|text|ring|outline|decoration|caret|accent|fill|stroke)-[a-z0-9-]+(\/[0-9]+)?$/.test(cls)) {
                                commonColorClasses.add(cls);
                            }
                        }
                    }
                }
            }

            // If we have variables and classes, generate utilities
            if (cssVariables.size > 0 && commonColorClasses.size > 0) {
                const cssText = Array.from(cssVariables.entries())
                    .map(([name, value]) => `--${name}: ${value};`)
                    .join('\n');

                const tempCss = `:root { ${cssText} }`;
                const usedData = {
                    classes: Array.from(commonColorClasses),
                    variableSuffixes: []
                };

                const generated = this.generateUtilitiesFromVars(tempCss, usedData);
                if (generated) {
                    const finalCss = `@layer utilities {\n${generated}\n}`;
                    // Apply styles - append to existing if cache exists, replace if not
                    if (hasExistingStyles) {
                        // Append new utilities to existing cache (they'll be deduplicated by CSS)
                        this.styleElement.textContent += '\n\n' + finalCss;
                    } else {
                        this.styleElement.textContent = finalCss;
                    }
                    
                    // Clear critical styles once we have generated utilities
                    if (this.criticalStyleElement && generated.trim()) {
                        this.criticalStyleElement.textContent = '';
                    }
                }
            }
        } catch (error) {
            // Silently fail - async compilation will handle it
        }
    };



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
        const utilityRegex = /(?:@layer\s+utilities\s*{[^}]*}|^)(?:[^{}]*?)(?:^|\s)(\.[\w-]+)\s*{([^}]+)}/gm;

        let match;
        while ((match = utilityRegex.exec(cssText)) !== null) {
            const className = match[1].substring(1); // Remove the leading dot
            const cssRules = match[2].trim();
            
            // Skip if it's a Tailwind-generated class (starts with common prefixes)
            if (this.isTailwindGeneratedClass(className)) {
                continue;
            }

            // Store the utility class and its CSS (combine if already exists)
            if (utilities.has(className)) {
                const existingRules = utilities.get(className);
                utilities.set(className, `${existingRules}; ${cssRules}`);
            } else {
                utilities.set(className, cssRules);
            }
        }

        // Also look for :where() selectors which are common in Indux utilities
        // Handle both single class and multiple class selectors
        const whereRegex = /:where\(([^)]+)\)\s*{([^}]+)}/g;
        while ((match = whereRegex.exec(cssText)) !== null) {
            const selectorContent = match[1];
            const cssRules = match[2].trim();
            
            // Extract individual class names from the selector
            const classMatches = selectorContent.match(/\.([\w-]+)/g);
            if (classMatches) {
                for (const classMatch of classMatches) {
                    const className = classMatch.substring(1); // Remove the leading dot
                    
                    if (!this.isTailwindGeneratedClass(className)) {
                        // Combine CSS rules if the class already exists
                        if (utilities.has(className)) {
                            const existingRules = utilities.get(className);
                            utilities.set(className, `${existingRules}; ${cssRules}`);
                        } else {
                            utilities.set(className, cssRules);
                        }
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

                const classMatches = selector.match(/\.[A-Za-z0-9_-]+/g);
                if (!classMatches) continue;

                for (const classToken of classMatches) {
                    const className = classToken.substring(1);

                    // Skip Tailwind-generated or already captured classes
                    if (this.isTailwindGeneratedClass(className)) continue;

                    // Combine CSS rules if the class already exists
                    if (utilities.has(className)) {
                        const existingRules = utilities.get(className);
                        utilities.set(className, `${existingRules}; ${cssRules}`);
                    } else {
                        utilities.set(className, cssRules);
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
                const classTokens = cleanedSelector.match(/\.[A-Za-z0-9_-]+/g);
                if (!classTokens) continue;

                for (const token of classTokens) {
                    const className = token.slice(1);
                    if (this.isTailwindGeneratedClass(className)) continue;

                    // Store selector-aware utility so variants preserve context and pseudos
                    const value = { selector: cleanedSelector, css: rule.css };
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



    // DOM observation and event handling
    // Methods for watching DOM changes and triggering recompilation

    // Setup component load listener and MutationObserver
    TailwindCompiler.prototype.setupComponentLoadListener = function() {
        // Use a single debounced handler for all component-related events
        const debouncedCompile = this.debounce(() => {
            if (!this.isCompiling) {
                this.compile();
            }
        }, this.options.debounceTime);

        // Listen for custom event when components are loaded
        document.addEventListener('indux:component-loaded', (event) => {
            debouncedCompile();
        });

        // Listen for route changes but don't recompile unnecessarily
        document.addEventListener('indux:route-change', (event) => {
            // Only trigger compilation if we detect new dynamic classes
            // The existing MutationObserver will handle actual DOM changes
            if (this.hasScannedStatic) {
                // Wait longer for route content to fully load before checking
                setTimeout(() => {
                    const currentDynamicCount = this.dynamicClassCache.size;
                    const currentClassesHash = this.lastClassesHash;
                    
                    // Scan for new classes
                    this.getUsedClasses();
                    const newDynamicCount = this.dynamicClassCache.size;
                    const dynamicClasses = Array.from(this.dynamicClassCache);
                    const newClassesHash = dynamicClasses.sort().join(',');
                    
                    // Only compile if we found genuinely new classes, not just code processing artifacts
                    if (newDynamicCount > currentDynamicCount && newClassesHash !== currentClassesHash) {
                        const newClasses = dynamicClasses.filter(cls => 
                            // Filter out classes that are likely from code processing
                            !cls.includes('hljs') && 
                            !cls.startsWith('language-') && 
                            !cls.includes('copy') &&
                            !cls.includes('lines')
                        );
                        
                        if (newClasses.length > 0) {
                            debouncedCompile();
                        }
                    }
                }, 300); // Longer delay to let code processing finish
            }
        });

        // Use a single MutationObserver for all DOM changes
        const observer = new MutationObserver((mutations) => {
            let shouldRecompile = false;

            for (const mutation of mutations) {
                // Skip attribute changes that don't affect utilities
                if (mutation.type === 'attributes') {
                    const attributeName = mutation.attributeName;
                    
                    // Skip ignored attributes (like id changes from router)
                    if (this.ignoredAttributes.includes(attributeName)) {
                        continue;
                    }
                    
                    // Only care about class attribute changes
                    if (attributeName !== 'class') {
                        continue;
                    }
                    
                    // If it's a class change, check if we have new classes that need utilities
                    const element = mutation.target;
                    if (element.nodeType === Node.ELEMENT_NODE) {
                        const currentClasses = Array.from(element.classList || []);
                        const newClasses = currentClasses.filter(cls => {
                            // Skip ignored patterns
                            if (this.ignoredClassPatterns.some(pattern => pattern.test(cls))) {
                                return false;
                            }
                            
                            // Check if this class is new (not in our cache)
                            return !this.staticClassCache.has(cls) && !this.dynamicClassCache.has(cls);
                        });
                        
                        if (newClasses.length > 0) {
                            // Add new classes to dynamic cache
                            newClasses.forEach(cls => this.dynamicClassCache.add(cls));
                            shouldRecompile = true;
                            break;
                        }
                    }
                }
                else if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Skip ignored elements using configurable selectors
                            const isIgnoredElement = this.ignoredElementSelectors.some(selector => 
                                node.tagName?.toLowerCase() === selector.toLowerCase() ||
                                node.closest(selector)
                            );
                            
                            if (isIgnoredElement) {
                                continue;
                            }

                            // Only recompile for significant changes using configurable selectors
                            const hasSignificantChange = this.significantChangeSelectors.some(selector => {
                                try {
                                    return node.matches?.(selector) || node.querySelector?.(selector);
                                } catch (e) {
                                    return false; // Invalid selector
                                }
                            });

                            if (hasSignificantChange) {
                                shouldRecompile = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldRecompile) break;
            }

            if (shouldRecompile) {
                debouncedCompile();
            }
        });

        // Start observing the document with the configured parameters
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'] // Only observe class changes
        });
    };

    // Start processing with initial compilation and observer setup
    TailwindCompiler.prototype.startProcessing = async function() {
        try {
            // Start initial compilation immediately
            const initialCompilation = this.compile();

            // Set up observer while compilation is running
            this.observer = new MutationObserver((mutations) => {
                const relevantMutations = mutations.filter(mutation => {
                    if (mutation.type === 'attributes' &&
                        mutation.attributeName === 'class') {
                        return true;
                    }
                    if (mutation.type === 'childList') {
                        return Array.from(mutation.addedNodes).some(node =>
                            node.nodeType === Node.ELEMENT_NODE);
                    }
                    return false;
                });

                if (relevantMutations.length === 0) return;

                // Check if there are any new classes that need processing
                const newClasses = this.getUsedClasses();
                if (newClasses.classes.length === 0) return;

                if (this.compileTimeout) {
                    clearTimeout(this.compileTimeout);
                }
                this.compileTimeout = setTimeout(() => {
                    if (!this.isCompiling) {
                        this.compile();
                    }
                }, this.options.debounceTime);
            });

            // Start observing immediately
            this.observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });

            // Wait for initial compilation
            await initialCompilation;

            this.hasInitialized = true;
        } catch (error) {
            console.error('Error starting Tailwind compiler:', error);
        }
    };



    // Utilities initialization
    // Initialize compiler and set up event listeners

    // Initialize immediately without waiting for DOMContentLoaded
    const compiler = new TailwindCompiler();

    // Expose utilities compiler for optional integration
    window.InduxUtilities = compiler;

    // Log when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (compiler.debug) {
                console.log(`[Indux Utilities] DOMContentLoaded fired at ${(performance.now() - compiler.startTime).toFixed(2)}ms`);
            }
        });
    } else {
        if (compiler.debug) {
            console.log(`[Indux Utilities] DOM already loaded when script ran`);
        }
    }

    // Log first paint if available
    if ('PerformanceObserver' in window) {
        try {
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (compiler.debug && (entry.name === 'first-paint' || entry.name === 'first-contentful-paint')) {
                        console.log(`[Indux Utilities] ${entry.name} at ${entry.startTime.toFixed(2)}ms`);
                    }
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
            // PerformanceObserver might not be available
        }
    }

    // Also handle DOMContentLoaded for any elements that might be added later
    document.addEventListener('DOMContentLoaded', () => {
        if (!compiler.isCompiling) {
            compiler.compile();
        }
    });

    // Additional dependencies for Alpine+Tailwind build
    // Update these filenames as needed when versions change
    const TAILWIND_V4_FILE = 'tailwind.v4.1.js';
    const ALPINE_FILE = 'alpine.v3.14.9.js';

    exports.ALPINE_FILE = ALPINE_FILE;
    exports.TAILWIND_V4_FILE = TAILWIND_V4_FILE;

    return exports;

})({});

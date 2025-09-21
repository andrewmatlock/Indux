/*  Indux JS
/*  By Andrew Matlock under MIT license
/*  https://github.com/andrewmatlock/Indux
/*
/*  Contains all Indux plugins bundled with Iconify (iconify.design)
/*
/*  With on-demand reference to:
/*  - highlight.js (https://highlightjs.org)
/*  - js-yaml (https://nodeca.github.io/js-yaml)
/*  - Marked JS (https://marked.js.org)
/*
/*  Requires Alpine JS (alpinejs.dev) to operate.
*/


var Indux = (function (exports) {
    'use strict';

    /* Indux Components */

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
            // Collect properties from placeholder attributes
            const props = {};
            Array.from(element.attributes).forEach(attr => {
                if (attr.name !== name && attr.name !== 'class' && !attr.name.startsWith('data-')) {
                    // Store both original case and lowercase for flexibility
                    props[attr.name] = attr.value;
                    props[attr.name.toLowerCase()] = attr.value;
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

    /* Indux Code */

    // Cache for highlight.js loading
    let hljsPromise = null;

    // Load highlight.js from CDN
    async function loadHighlightJS() {
        if (typeof hljs !== 'undefined') {
            return hljs;
        }
        
        // Return existing promise if already loading
        if (hljsPromise) {
            return hljsPromise;
        }
        
        hljsPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js';
            script.onload = () => {
                // Initialize highlight.js
                if (typeof hljs !== 'undefined') {
                    resolve(hljs);
                } else {
                    console.error('[Indux Code] Highlight.js failed to load - hljs is undefined');
                    hljsPromise = null; // Reset so we can try again
                    reject(new Error('highlight.js failed to load'));
                }
            };
            script.onerror = (error) => {
                console.error('[Indux Code] Script failed to load:', error);
                hljsPromise = null; // Reset so we can try again
                reject(error);
            };
            document.head.appendChild(script);
        });
        
        return hljsPromise;
    }

    // Preload highlight.js as soon as script loads
    loadHighlightJS().catch(() => {
        // Silently ignore errors during preload
    });

    // Optional optimization: Configure utilities plugin if present
    if (window.InduxUtilities) {
        // Tell utilities plugin to ignore code-related DOM changes and classes
        window.InduxUtilities.addIgnoredClassPattern(/^hljs/);
        window.InduxUtilities.addIgnoredClassPattern(/^language-/);
        window.InduxUtilities.addIgnoredClassPattern(/^copy$/);
        window.InduxUtilities.addIgnoredClassPattern(/^copied$/);
        window.InduxUtilities.addIgnoredClassPattern(/^lines$/);
        window.InduxUtilities.addIgnoredClassPattern(/^selected$/);
        
        window.InduxUtilities.addIgnoredElementSelector('pre');
        window.InduxUtilities.addIgnoredElementSelector('code');
        window.InduxUtilities.addIgnoredElementSelector('x-code');
        window.InduxUtilities.addIgnoredElementSelector('x-code-group');
    }

    // Process existing pre/code blocks
    async function processExistingCodeBlocks() {
        try {
            const hljs = await loadHighlightJS();
            
            // Find all pre > code blocks that aren't already processed
            // Exclude elements with frame class but allow those inside asides (frames)
            const codeBlocks = document.querySelectorAll('pre > code:not(.hljs):not([data-highlighted="yes"]):not(.frame)');
            
            for (const codeBlock of codeBlocks) {
                try {
                    
                    // Skip if the element contains HTML (has child elements)
                    if (codeBlock.children.length > 0) {
                        continue;
                    }
                    
                    // Skip if the content looks like HTML (contains tags)
                    let content = codeBlock.textContent || '';
                    if (content.includes('<') && content.includes('>') && content.includes('</')) {
                        // This looks like HTML content, skip highlighting to avoid security warnings
                        continue;
                    }
                    
                    // Special handling for frames - clean up content
                    const isInsideFrame = codeBlock.closest('aside');
                    if (isInsideFrame) {
                        // Remove leading empty lines and whitespace
                        content = content.replace(/^\s*\n+/, '');
                        // Remove trailing empty lines and whitespace
                        content = content.replace(/\n+\s*$/, '');
                        // Also trim any remaining leading/trailing whitespace
                        content = content.trim();
                        // Update the code block content
                        codeBlock.textContent = content;
                    }
                    
                    const pre = codeBlock.parentElement;
                    
                    // Add title if present
                    if (pre.hasAttribute('name') || pre.hasAttribute('title')) {
                        const title = pre.getAttribute('name') || pre.getAttribute('title');
                        const header = document.createElement('header');
                        
                        const titleElement = document.createElement('div');
                        titleElement.textContent = title;
                        header.appendChild(titleElement);
                        
                        pre.insertBefore(header, codeBlock);
                    }
                    
                    // Add line numbers if requested
                    if (pre.hasAttribute('numbers')) {
                        const codeText = codeBlock.textContent;
                        const lines = codeText.split('\n');
                        
                        const linesContainer = document.createElement('div');
                        linesContainer.className = 'lines';
                        
                        for (let i = 0; i < lines.length; i++) {
                            const lineSpan = document.createElement('span');
                            lineSpan.textContent = (i + 1).toString();
                            linesContainer.appendChild(lineSpan);
                        }
                        
                        pre.insertBefore(linesContainer, codeBlock);
                    }
                    
                    // Check if element has a supported language class
                    const languageMatch = codeBlock.className.match(/language-(\w+)/);
                    if (languageMatch) {
                        const language = languageMatch[1];
                        
                        // Skip non-programming languages
                        if (language === 'frame') {
                            continue;
                        }
                        
                        const supportedLanguages = hljs.listLanguages();
                        const languageAliases = {
                            'js': 'javascript',
                            'ts': 'typescript', 
                            'py': 'python',
                            'rb': 'ruby',
                            'sh': 'bash',
                            'yml': 'yaml'
                        };
                        
                        let actualLanguage = language;
                        if (languageAliases[language]) {
                            actualLanguage = languageAliases[language];
                            // Update the class name to use the correct language
                            codeBlock.className = codeBlock.className.replace(`language-${language}`, `language-${actualLanguage}`);
                        }
                        
                        // Only highlight if the language is supported
                        if (!supportedLanguages.includes(actualLanguage)) {
                            // Skip unsupported languages instead of warning
                            continue;
                        }
                    } else {
                        // Add default language class if not present
                        codeBlock.className += ' language-css'; // Default to CSS for the example
                    }
                    
                    // Highlight the code block
                    hljs.highlightElement(codeBlock);
                    
                } catch (error) {
                    console.warn('[Indux] Failed to process code block:', error);
                }
            }
        } catch (error) {
            console.warn('[Indux] Failed to process existing code blocks:', error);
        }
    }

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeCodePlugin() {

        // X-Code-Group custom element for tabbed code blocks
        class XCodeGroupElement extends HTMLElement {
            constructor() {
                super();
            }

            static get observedAttributes() {
                return ['numbers', 'copy'];
            }

            get numbers() {
                return this.hasAttribute('numbers');
            }

            get copy() {
                return this.hasAttribute('copy');
            }

            connectedCallback() {
                // Small delay to ensure x-code elements are initialized
                setTimeout(() => {
                    this.setupCodeGroup();
                }, 0);
            }

            attributeChangedCallback(name, oldValue, newValue) {
                if (oldValue !== newValue) {
                    if (name === 'numbers' || name === 'copy') {
                        this.updateAttributes();
                    }
                }
            }

            setupCodeGroup() {
                // Find all x-code elements within this group
                const codeElements = this.querySelectorAll('x-code');
                
                if (codeElements.length === 0) {
                    return;
                }

                // Set default tab to first named code element first
                const firstNamedCode = Array.from(codeElements).find(code => code.getAttribute('name'));
                if (firstNamedCode) {
                    const defaultTab = firstNamedCode.getAttribute('name');
                    this.setAttribute('x-data', `{ codeTabs: '${defaultTab}' }`);
                }

                // Create header for tabs
                const header = document.createElement('header');
                
                // Process each code element
                codeElements.forEach((codeElement, index) => {
                    const name = codeElement.getAttribute('name');
                    
                    if (!name) {
                        return; // Skip if no name attribute
                    }
                    
                    // Create tab button
                    const tabButton = document.createElement('button');
                    tabButton.setAttribute('x-on:click', `codeTabs = '${name}'`);
                    tabButton.setAttribute('x-bind:class', `codeTabs === '${name}' ? 'selected' : ''`);
                    tabButton.setAttribute('role', 'tab');
                    tabButton.setAttribute('aria-controls', `code-${name.replace(/\s+/g, '-').toLowerCase()}`);
                    tabButton.setAttribute('x-bind:aria-selected', `codeTabs === '${name}' ? 'true' : 'false'`);
                    tabButton.textContent = name;
                    
                    // Add keyboard navigation
                    tabButton.addEventListener('keydown', (e) => {
                        const tabs = header.querySelectorAll('button[role="tab"]');
                        const currentIndex = Array.from(tabs).indexOf(tabButton);
                        
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            const nextIndex = e.key === 'ArrowRight' 
                                ? (currentIndex + 1) % tabs.length
                                : (currentIndex - 1 + tabs.length) % tabs.length;
                            tabs[nextIndex].focus();
                            tabs[nextIndex].click();
                        }
                    });
                    
                    header.appendChild(tabButton);
                    
                    // Set up the code element for tabs
                    codeElement.setAttribute('x-show', `codeTabs === '${name}'`);
                    codeElement.setAttribute('id', `code-${name.replace(/\s+/g, '-').toLowerCase()}`);
                    codeElement.setAttribute('role', 'tabpanel');
                    codeElement.setAttribute('aria-labelledby', `tab-${name.replace(/\s+/g, '-').toLowerCase()}`);
                    
                    // Apply numbers and copy attributes from group if present
                    if (this.numbers && !codeElement.hasAttribute('numbers')) {
                        codeElement.setAttribute('numbers', '');
                    }
                    if (this.copy && !codeElement.hasAttribute('copy')) {
                        codeElement.setAttribute('copy', '');
                    }
                });
                
                // Set up header with proper ARIA attributes
                header.setAttribute('role', 'tablist');
                header.setAttribute('aria-label', 'Code examples');
                
                // Insert header at the beginning
                this.insertBefore(header, this.firstChild);
                
                // Set initial tab IDs after header is added
                const tabs = header.querySelectorAll('button[role="tab"]');
                tabs.forEach((tab, index) => {
                    const name = tab.textContent.replace(/\s+/g, '-').toLowerCase();
                    tab.setAttribute('id', `tab-${name}`);
                });
            }

            updateAttributes() {
                const codeElements = this.querySelectorAll('x-code');
                codeElements.forEach(codeElement => {
                    if (this.numbers) {
                        codeElement.setAttribute('numbers', '');
                    } else {
                        codeElement.removeAttribute('numbers');
                    }
                    if (this.copy) {
                        codeElement.setAttribute('copy', '');
                    } else {
                        codeElement.removeAttribute('copy');
                    }
                });
            }
        }

        // X-Code custom element
        class XCodeElement extends HTMLElement {
            constructor() {
                super();
            }

            static get observedAttributes() {
                return ['language', 'numbers', 'title', 'copy'];
            }

            get language() {
                return this.getAttribute('language') || 'auto';
            }

            get numbers() {
                return this.hasAttribute('numbers');
            }

            get title() {
                return this.getAttribute('name') || this.getAttribute('title');
            }

            get copy() {
                return this.hasAttribute('copy');
            }

            get contentElement() {
                return this.querySelector('code') || this;
            }

            connectedCallback() {
                this.setupElement();
                // Remove tabindex to prevent focusing the container itself
                // Focus should go to interactive elements like copy button
                this.highlightCode();
            }

            attributeChangedCallback(name, oldValue, newValue) {
                if (oldValue !== newValue) {
                    if (name === 'language') {
                        this.highlightCode();
                    } else if (name === 'numbers') {
                        this.updateLineNumbers();
                    } else if (name === 'title') {
                        this.updateTitle();
                    } else if (name === 'copy' && typeof this.updateCopyButton === 'function') {
                        this.updateCopyButton();
                    }
                }
            }

            setupElement() {
                // Extract content BEFORE adding any UI elements
                let content = this.extractContent();
                
                // Check if we have preserved original content for complete HTML documents
                const originalContent = this.getAttribute('data-original-content');
                if (originalContent) {
                    // Use the preserved original content that includes document-level tags
                    content = originalContent;
                    // Remove the data attribute as we no longer need it
                    this.removeAttribute('data-original-content');
                }
                
                // Create semantically correct structure: pre > code
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                
                // Use textContent to preserve HTML tags as literal text
                // This ensures highlight.js treats the content as code, not HTML
                code.textContent = content;
                pre.appendChild(code);
                this.textContent = '';
                this.appendChild(pre);

                // Create title if present (after pre element is created) - but only if not in a code group
                if (this.title && !this.closest('x-code-group')) {
                    const header = document.createElement('header');
                    
                    const title = document.createElement('div');
                    title.textContent = this.title;
                    header.appendChild(title);
                    
                    this.insertBefore(header, pre);
                }

                // Add line numbers if enabled
                if (this.numbers) {
                    this.setupLineNumbers();
                }

                // Add copy button if enabled (after content extraction)
                if (this.copy) {
                    this.setupCopyButton();
                }
                
                // If this is in a code group, ensure copy button comes after title in tab order
                const codeGroup = this.closest('x-code-group');
                if (codeGroup && this.copy) {
                    const copyButton = this.querySelector('.copy');
                    if (copyButton) {
                        // Set tabindex to ensure it comes after header buttons in tab order
                        copyButton.setAttribute('tabindex', '0');
                    }
                }
            }

            extractContent() {
                // Get the content and preserve original formatting
                let content = this.textContent;
                
                // Preserve intentional line breaks at the beginning and end
                // Only trim if there are no intentional line breaks
                const hasLeadingLineBreak = content.startsWith('\n');
                const hasTrailingLineBreak = content.endsWith('\n');
                
                // Trim but preserve intentional line breaks
                if (hasLeadingLineBreak) {
                    content = '\n' + content.trimStart();
                } else {
                    content = content.trimStart();
                }
                
                if (hasTrailingLineBreak) {
                    content = content.trimEnd() + '\n';
                } else {
                    content = content.trimEnd();
                }
                
                // Check if this is markdown-generated content (has preserved indentation)
                // Also check if this is inside a frame (aside element)
                const isInsideFrame = this.closest('aside');
                const hasPreservedIndentation = content.includes('\n    ') || content.includes('\n\t');
                
                // Special handling for frames - remove leading and trailing empty lines
                if (isInsideFrame) {
                    // If we have a title and the content starts with it, remove it
                    if (this.title && content.startsWith(this.title)) {
                        content = content.substring(this.title.length);
                        // Remove any leading newline after removing title
                        content = content.replace(/^\n+/, '');
                    }
                    
                    // Remove leading empty lines and whitespace
                    content = content.replace(/^\s*\n+/, '');
                    // Remove trailing empty lines and whitespace
                    content = content.replace(/\n+\s*$/, '');
                    // Also trim any remaining leading/trailing whitespace
                    content = content.trim();
                }
                
                if (!hasPreservedIndentation && content.includes('\n') && !isInsideFrame) {
                    // Only normalize indentation for non-markdown content
                    const hasTrailingLineBreakText = content.endsWith('\n');
                    const lines = content.split('\n');
                    
                    // Find the minimum indentation (excluding empty lines and lines with no indentation)
                    let minIndent = Infinity;
                    for (const line of lines) {
                        if (line.trim() !== '') {
                            const indent = line.length - line.trimStart().length;
                            if (indent > 0) { // Only consider lines that actually have indentation
                                minIndent = Math.min(minIndent, indent);
                            }
                        }
                    }

                    // Remove the common indentation from all lines
                    if (minIndent < Infinity) {
                        content = lines.map(line => {
                            if (line.trim() === '') return '';
                            const indent = line.length - line.trimStart().length;
                            // Only remove indentation if the line has enough spaces
                            return indent >= minIndent ? line.slice(minIndent) : line;
                        }).join('\n');
                        
                        // Preserve trailing line break if it was originally there
                        if (hasTrailingLineBreakText) {
                            content += '\n';
                        }
                    }
                }
                
                // Check if the content was interpreted as HTML (has child nodes)
                if (this.children.length > 0) {
                    // Extract the original HTML from the child nodes
                    content = this.innerHTML;
                    
                    // Preserve intentional line breaks at the beginning and end
                    const hasLeadingLineBreak = content.startsWith('\n');
                    const hasTrailingLineBreak = content.endsWith('\n');
                    
                    // Trim but preserve intentional line breaks
                    if (hasLeadingLineBreak) {
                        content = '\n' + content.trimStart();
                    } else {
                        content = content.trimStart();
                    }
                    
                    if (hasTrailingLineBreak) {
                        content = content.trimEnd() + '\n';
                    } else {
                        content = content.trimEnd();
                    }

                    // Remove any copy button that might have been included
                    content = content.replace(/<button[^>]*class="copy"[^>]*>.*?<\/button>/g, '');

                    // Clean up empty attribute values (data-head="" -> data-head)
                    content = content.replace(/(\w+)=""/g, '$1');

                    // For HTML content, normalize indentation (but not for frames)
                    const isInsideFrame = this.closest('aside');
                    const hasTrailingLineBreakHtml = content.endsWith('\n');
                    const lines = content.split('\n');
                    if (lines.length > 1 && !isInsideFrame) {
                        // Find the minimum indentation
                        let minIndent = Infinity;
                        for (const line of lines) {
                            if (line.trim() !== '') {
                                const indent = line.length - line.trimStart().length;
                                if (indent > 0) {
                                    minIndent = Math.min(minIndent, indent);
                                }
                            }
                        }

                        // Remove the common indentation from all lines
                        if (minIndent < Infinity) {
                            content = lines.map(line => {
                                if (line.trim() === '') return '';
                                const indent = line.length - line.trimStart().length;
                                return indent >= minIndent ? line.slice(minIndent) : line;
                            }).join('\n');
                            
                            // Preserve trailing line break if it was originally there
                            if (hasTrailingLineBreakHtml) {
                                content += '\n';
                            }
                        }
                    }
                }
                
                return content;
            }

            async setupLineNumbers() {
                try {
                    // Ensure the pre element exists and has content
                    const pre = this.querySelector('pre');

                    if (pre && !this.querySelector('.lines')) {
                        // Make sure the pre element is properly set up first
                        if (!pre.querySelector('code')) {
                            const code = document.createElement('code');
                            code.textContent = pre.textContent;
                            pre.textContent = '';
                            pre.appendChild(code);
                        }

                        // Count the lines using the actual DOM content
                        const codeText = pre.textContent;
                        const lines = codeText.split('\n');

                        // Create the lines container
                        const linesContainer = document.createElement('div');
                        linesContainer.className = 'lines';

                        // Add line number items for all lines (including empty ones)
                        for (let i = 0; i < lines.length; i++) {
                            const lineSpan = document.createElement('span');
                            lineSpan.textContent = (i + 1).toString();
                            linesContainer.appendChild(lineSpan);
                        }

                        // Insert line numbers before the pre element
                        this.insertBefore(linesContainer, pre);
                    }
                } catch (error) {
                    console.warn('[Indux] Failed to setup line numbers:', error);
                }
            }

            async setupCopyButton() {
                try {
                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy';
                    copyButton.setAttribute('aria-label', 'Copy code to clipboard');
                    copyButton.setAttribute('type', 'button');
                    
                    copyButton.addEventListener('click', () => {
                        this.copyCodeToClipboard();
                    });
                    
                    // Add keyboard support
                    copyButton.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.copyCodeToClipboard();
                        }
                    });
                    
                    this.appendChild(copyButton);
                } catch (error) {
                    console.warn('[Indux] Failed to setup copy button:', error);
                }
            }

            async copyCodeToClipboard() {
                try {
                    const codeElement = this.contentElement;
                    const codeText = codeElement.textContent;
                    
                    await navigator.clipboard.writeText(codeText);
                    
                    // Show copied state using CSS classes
                    const copyButton = this.querySelector('.copy');
                    if (copyButton) {
                        copyButton.classList.add('copied');
                        setTimeout(() => {
                            copyButton.classList.remove('copied');
                        }, 2000);
                    }
                } catch (error) {
                    console.warn('[Indux] Failed to copy code:', error);
                }
            }

            updateLineNumbers() {
                if (this.numbers) {
                    this.setupLineNumbers();
                } else {
                    // Remove line numbers if disabled
                    const lines = this.querySelector('.lines');
                    if (lines) {
                        lines.remove();
                    }
                }
            }

            async highlightCode() {
                try {
                    // Ensure highlight.js is loaded
                    const hljs = await loadHighlightJS();
                    
                    const codeElement = this.contentElement;
                    
                    // Skip if this element contains HTML (has child elements)
                    if (codeElement.children.length > 0) {
                        return;
                    }
                    
                    // Only skip HTML content for auto-detection, not when language is explicitly specified
                    const content = codeElement.textContent || '';
                    
                    // Reset highlighting if already highlighted
                    if (codeElement.dataset.highlighted === 'yes') {
                        delete codeElement.dataset.highlighted;
                        // Clear all highlight.js related classes
                        codeElement.className = codeElement.className.replace(/\bhljs\b|\blanguage-\w+\b/g, '').trim();
                    }
                    
                    // Set language class if specified
                    if (this.language && this.language !== 'auto') {
                        // Skip non-programming languages
                        if (this.language === 'frame') {
                            return;
                        }
                        
                        // Check if the language is supported by highlight.js
                        const supportedLanguages = hljs.listLanguages();
                        const languageAliases = {
                            'js': 'javascript',
                            'ts': 'typescript', 
                            'py': 'python',
                            'rb': 'ruby',
                            'sh': 'bash',
                            'yml': 'yaml',
                            'html': 'xml'
                        };
                        
                        let actualLanguage = this.language;
                        if (languageAliases[this.language]) {
                            actualLanguage = languageAliases[this.language];
                        }
                        
                        // Only highlight if language is supported, otherwise skip highlighting
                        if (supportedLanguages.includes(actualLanguage)) {
                            // Use hljs.highlight() with specific language to avoid auto-detection
                            const result = hljs.highlight(codeElement.textContent, { language: actualLanguage });
                            codeElement.innerHTML = result.value;
                            codeElement.className = `language-${actualLanguage} hljs`;
                            codeElement.dataset.highlighted = 'yes';
                        } else {
                            // Skip unsupported languages
                            return;
                        }
                    } else {
                        // For auto-detection, only proceed if content doesn't look like HTML
                        if (content.includes('<') && content.includes('>') && content.includes('</')) {
                            // Skip HTML-like content to avoid security warnings during auto-detection
                            return;
                        }
                        
                        // Remove any existing language class for auto-detection
                        codeElement.className = codeElement.className.replace(/\blanguage-\w+/g, '');
                        
                        // Use highlightElement for auto-detection when no specific language
                        hljs.highlightElement(codeElement);
                    }
                    
                } catch (error) {
                    console.warn(`[Indux] Failed to highlight code:`, error);
                }
            }

            update() {
                this.highlightCode();
            }

            updateTitle() {
                let titleElement = this.querySelector('header div');
                if (this.title) {
                    if (!titleElement) {
                        titleElement = document.createElement('div');
                        titleElement.textContent = this.title;
                        this.insertBefore(titleElement, this.firstChild);
                    }
                    titleElement.textContent = this.title;
                } else if (titleElement) {
                    titleElement.remove();
                }
            }

            updateCopyButton() {
                const existingCopyButton = this.querySelector('.copy');
                
                if (this.copy) {
                    if (!existingCopyButton) {
                        // Only add copy button if setupElement has already been called
                        // (i.e., if we have a pre element)
                        if (this.querySelector('pre')) {
                            this.setupCopyButton();
                        }
                        // Otherwise, the copy button will be added in setupElement()
                    }
                } else {
                    if (existingCopyButton) {
                        existingCopyButton.remove();
                    }
                }
            }
        }

        // Initialize the plugin
        async function initialize() {
            try {
                // Register the custom element
                if (!customElements.get('x-code')) {
                    customElements.define('x-code', XCodeElement);
                }
                if (!customElements.get('x-code-group')) {
                    customElements.define('x-code-group', XCodeGroupElement);
                }

                    // Process existing code blocks
        await processExistingCodeBlocks();
        
        // Listen for markdown plugin conversions
        document.addEventListener('indux:code-blocks-converted', async () => {
            await processExistingCodeBlocks();
        });
        
        // Also listen for the event on the document body for better coverage
        document.body.addEventListener('indux:code-blocks-converted', async () => {
            await processExistingCodeBlocks();
        });

            } catch (error) {
                console.error('[Indux] Failed to initialize code plugin:', error);
            }
        }

        // Alpine.js directive for code highlighting (only if Alpine is available)
        if (typeof Alpine !== 'undefined') {
            Alpine.directive('code', (el, { expression, modifiers }, { effect, evaluateLater }) => {
                // Create x-code element
                const codeElement = document.createElement('x-code');

                // Get language from various possible sources
                let language = 'auto';
                
                // Check for language attribute first
                const languageAttr = el.getAttribute('language');
                if (languageAttr) {
                    language = languageAttr;
                } else if (expression && typeof expression === 'string' && !expression.includes('.')) {
                    // Fallback to expression if it's a simple string
                    language = expression;
                } else if (modifiers.length > 0) {
                    // Fallback to first modifier
                    language = modifiers[0];
                }

                codeElement.setAttribute('language', language);

                // Enable line numbers if specified
                if (modifiers.includes('numbers') || modifiers.includes('line-numbers') || el.hasAttribute('numbers')) {
                    codeElement.setAttribute('numbers', '');
                }

                // Set title from various possible sources
                const title = el.getAttribute('name') || el.getAttribute('title') || el.getAttribute('data-title');
                if (title) {
                    codeElement.setAttribute('name', title);
                }

                // Move content to x-code element
                const content = el.textContent.trim();
                codeElement.textContent = content;
                el.textContent = '';
                el.appendChild(codeElement);

                // Handle dynamic content updates only if expression is a variable
                if (expression && (expression.includes('.') || !['javascript', 'css', 'html', 'python', 'ruby', 'php', 'java', 'c', 'cpp', 'csharp', 'go', 'sql', 'json', 'yaml', 'markdown', 'typescript', 'jsx', 'tsx', 'scss', 'sass', 'less', 'xml', 'markup'].includes(expression))) {
                    const getContent = evaluateLater(expression);
                    effect(() => {
                        getContent((content) => {
                            if (content && typeof content === 'string') {
                                codeElement.textContent = content;
                                codeElement.update();
                            }
                        });
                    });
                }
            });
        }

        // Handle both DOMContentLoaded and alpine:init
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            initialize();
        }

        // Listen for Alpine initialization (only if Alpine is available)
        if (typeof Alpine !== 'undefined') {
            document.addEventListener('alpine:init', initialize);
        } else {
            // If Alpine isn't available yet, listen for it to become available
            document.addEventListener('alpine:init', () => {
                // Re-register the directive when Alpine becomes available
                if (typeof Alpine !== 'undefined') {
                    Alpine.directive('code', (el, { expression, modifiers }, { effect, evaluateLater }) => {
                        // Create x-code element
                        const codeElement = document.createElement('x-code');

                        // Get language from various possible sources
                        let language = 'auto';
                        
                        // Check for language attribute first
                        const languageAttr = el.getAttribute('language');
                        if (languageAttr) {
                            language = languageAttr;
                        } else if (expression && typeof expression === 'string' && !expression.includes('.')) {
                            // Fallback to expression if it's a simple string
                            language = expression;
                        } else if (modifiers.length > 0) {
                            // Fallback to first modifier
                            language = modifiers[0];
                        }

                        codeElement.setAttribute('language', language);

                        // Enable line numbers if specified
                        if (modifiers.includes('numbers') || modifiers.includes('line-numbers') || el.hasAttribute('numbers')) {
                            codeElement.setAttribute('numbers', '');
                        }

                        // Set title from various possible sources
                        const title = el.getAttribute('name') || el.getAttribute('title') || el.getAttribute('data-title');
                        if (title) {
                            codeElement.setAttribute('name', title);
                        }

                        // Move content to x-code element
                        const content = el.textContent.trim();
                        codeElement.textContent = content;
                        el.textContent = '';
                        el.appendChild(codeElement);

                        // Handle dynamic content updates only if expression is a variable
                        if (expression && (expression.includes('.') || !['javascript', 'css', 'html', 'python', 'ruby', 'php', 'java', 'c', 'cpp', 'csharp', 'go', 'sql', 'json', 'yaml', 'markdown', 'typescript', 'jsx', 'tsx', 'scss', 'sass', 'less', 'xml', 'markup'].includes(expression))) {
                            const getContent = evaluateLater(expression);
                            effect(() => {
                                getContent((content) => {
                                    if (content && typeof content === 'string') {
                                        codeElement.textContent = content;
                                        codeElement.update();
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    }

    // Initialize the plugin
    initializeCodePlugin();

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
        function createRouteProxy(dataSourceData, pathKey, dataSourceName) {
            return new Proxy({}, {
                get(target, prop) {
                    try {
                        // Get current URL from store (reactive)
                        const store = Alpine.store('data');
                        const currentPath = store?._currentUrl || window.location.pathname;
                        let pathSegments = currentPath.split('/').filter(segment => segment);
                        
                        // Filter out language codes from path segments for route matching
                        // Language codes are typically 2-3 characters or extended codes like 'az-Arab'
                        const localeStore = Alpine.store('locale');
                        if (localeStore && localeStore.available && pathSegments.length > 0) {
                            const firstSegment = pathSegments[0];
                            // Check if first segment is a language code
                            if (localeStore.available.includes(firstSegment)) {
                                // Remove the language code from path segments
                                pathSegments = pathSegments.slice(1);
                            }
                        }
                        
                        // If dataSource data is not loaded yet, return empty string for string properties
                        if (!dataSourceData || typeof dataSourceData !== 'object') {
                            return typeof prop === 'string' ? '' : undefined;
                        }
                        
                        // Search through dataSource data recursively
                        const foundItem = findItemByPath(dataSourceData, pathKey, pathSegments);
                        
                        if (foundItem && prop in foundItem) {
                            return foundItem[prop];
                        }
                        
                        // Special handling for 'group' property - find the group containing the matched item
                        if (prop === 'group' && foundItem) {
                            const groupItem = findGroupContainingItem(dataSourceData, foundItem);
                            return groupItem?.group || '';
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
                            console.warn(`[Indux] Dropdown menu with id "${dropdownId}" not found`);
                            return;
                        }
                        el.setAttribute('popovertarget', dropdownId);
                    }

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

    // Handle modal interactions - close dropdowns when modals open
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button[popovertarget]');
        if (!button) return;
        
        const targetId = button.getAttribute('popovertarget');
        const target = document.getElementById(targetId);
        
        if (target && target.tagName === 'DIALOG' && target.hasAttribute('popover')) {
            // Close dropdowns BEFORE the modal opens to avoid conflicts
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

            // 2. Check HTML lang attribute
            const htmlLang = document.documentElement.lang;
            if (htmlLang && isValidLanguageCode(htmlLang) && availableLocales.includes(htmlLang)) {
                return htmlLang;
            }

            // 3. Check localStorage
            const storedLang = safeStorage.get('lang');
            if (storedLang && isValidLanguageCode(storedLang) && availableLocales.includes(storedLang)) {
                return storedLang;
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
    	                const html = marked.parse(processedMarkdown);

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
    	        const getMarkdownContent = evaluateLater(expression);

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
    	                        const response = await fetch(pathOrContent);
    	                        if (response.ok) {
    	                            markdownContent = await response.text();
    	                        } else {
    	                            console.warn(`[Indux] Failed to fetch markdown file: ${pathOrContent}`);
    	                            markdownContent = `# Error Loading Content\n\nCould not load: ${pathOrContent}`;
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
    	                const html = marked.parse(markdownContent);
    	                
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
    	                    const html = marked.parse(processedMarkdown);
    	                    
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
                        if (newWidth <= pixelConstraints.closeX) {
                            el.classList.add('resizable-closing');
                            currentSnap = 'closing';
                            
                            if (toggle) {
                                config.evaluate(`${toggle} = false`);
                            }
                            return; // Exit early to prevent further width calculations
                        }
                    }

                    // Handle snap-close behavior for height (always check, regardless of handle direction)
                    if (pixelConstraints.closeY !== null) {
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
            const normalizedPath = path.replace(/^\/+|\/+$/g, '') || '/';

            // Handle wildcards
            if (condition.includes('*')) {
                if (condition === '*') return true;
                const wildcardPattern = condition.replace('*', '');
                const normalizedPattern = wildcardPattern.replace(/^\/+|\/+$/g, '');
                return normalizedPath.startsWith(normalizedPattern + '/');
            }

            // Handle exact paths (starting with /)
            if (condition.startsWith('/')) {
                if (condition === '/') {
                    return normalizedPath === '/' || normalizedPath === '';
                }
                const routePath = condition.replace(/^\//, '');
                return normalizedPath === routePath || normalizedPath.startsWith(routePath + '/');
            }

            // Handle substring matching (default behavior)
            return normalizedPath.includes(condition);
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
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            // Check if it's a relative link
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) return; // External link
            } catch (e) {
                // Invalid URL, treat as relative
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

        routeElements.forEach(element => {
            const routeCondition = element.getAttribute('x-route');
            if (!routeCondition) return;

            // Parse route conditions
            const conditions = routeCondition.split(',').map(cond => cond.trim());
            const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
            const negativeConditions = conditions
                .filter(cond => cond.startsWith('!'))
                .map(cond => cond.slice(1));

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
            } else {
                element.setAttribute('hidden', '');
            }
        });
    }

    // Initialize visibility management
    function initializeVisibility() {
        // Process initial visibility
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
        processRouteVisibility(normalizedPath);

        // Listen for route changes
        window.addEventListener('indux:route-change', (event) => {
            processRouteVisibility(event.detail.normalizedPath);
        });
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeVisibility);
    } else {
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

    function initializeTabsPlugin() {   
        
        // Helper to get tab property name based on panel set
        function getTabPropertyName(panelSet) {
            return panelSet ? `tab_${panelSet}` : 'tab';
        }
        
        // Helper to find panels by ID or class
        function findPanelsByTarget(target, panelSet) {
            const panels = [];
            
            // Check if target is an ID
            const panelById = document.getElementById(target);
            if (panelById && panelById.hasAttribute('x-tabpanel')) {
                const panelSetAttr = panelById.getAttribute('x-tabpanel');
                if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                    panels.push(panelById);
                }
            }
            
            // Check if target is a class - handle numeric class names
            try {
                const panelsByClass = document.querySelectorAll(`.${target}[x-tabpanel]`);
                panelsByClass.forEach(panel => {
                    const panelSetAttr = panel.getAttribute('x-tabpanel');
                    if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                        panels.push(panel);
                    } else {
                    }
                });
            } catch (e) {
                // If the selector is invalid (e.g., numeric class), try a different approach
                const allPanels = document.querySelectorAll('[x-tabpanel]');
                allPanels.forEach(panel => {
                    if (panel.classList.contains(target)) {
                        const panelSetAttr = panel.getAttribute('x-tabpanel');
                        if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                            panels.push(panel);
                        }
                    }
                });
            }
            
            return panels;
        }
        
        // Helper to find the common parent of multiple elements
        function findCommonParent(elements) {
            if (elements.length === 0) return document.body;
            if (elements.length === 1) return elements[0].parentElement || document.body;
            
            // Start with the first element
            let commonParent = elements[0];
            
            // For each subsequent element, find the lowest common ancestor
            for (let i = 1; i < elements.length; i++) {
                commonParent = findLowestCommonAncestor(commonParent, elements[i]);
            }
            
            return commonParent || document.body;
        }
        
        // Helper to find lowest common ancestor of two elements
        function findLowestCommonAncestor(element1, element2) {
            // Get all ancestors of element1
            const ancestors1 = [];
            let current = element1;
            while (current) {
                ancestors1.push(current);
                current = current.parentElement;
            }
            
            // Walk up from element2 until we find a common ancestor
            current = element2;
            while (current) {
                if (ancestors1.includes(current)) {
                    return current;
                }
                current = current.parentElement;
            }
            
            return document.body; // Fallback
        }
        
        // Process tabs and panels
        function processTabs() {
            // Prevent multiple executions in rapid succession
            if (window.induxTabsProcessing) {
                return;
            }
            window.induxTabsProcessing = true;
            
            // Reset flag after processing
            setTimeout(() => {
                window.induxTabsProcessing = false;
            }, 100);
            
            // Find all tab-related elements
            const tabButtons = document.querySelectorAll('[x-tab]');
            const panels = document.querySelectorAll('[x-tabpanel]');
            
            if (tabButtons.length === 0 && panels.length === 0) {
                window.induxTabsProcessing = false;
                return;
            }
            
            // Group panels by their panel set
            const panelSets = new Map();
            panels.forEach(panel => {
                const panelSet = panel.getAttribute('x-tabpanel') || '';
                if (!panelSets.has(panelSet)) {
                    panelSets.set(panelSet, []);
                }
                panelSets.get(panelSet).push(panel);
            });
            
            
            // Process each panel set separately
            panelSets.forEach((panelsInSet, panelSet) => {
                // Find buttons that control panels in this set AND are in the same DOM section
                const buttonsForThisSet = [];
                tabButtons.forEach(button => {
                    const tabValue = button.getAttribute('x-tab');
                    if (!tabValue) return;
                    
                    // Check if this button controls any panels in this set
                    const targetPanels = findPanelsByTarget(tabValue, panelSet);
                    if (targetPanels.length > 0) {
                        // Only include buttons that are in the same "section" as their target panels
                        // by checking if they share a close common ancestor
                        const buttonAndFirstPanel = [button, targetPanels[0]];
                        const commonAncestor = findCommonParent(buttonAndFirstPanel);
                        
                        // Count levels from button to common ancestor
                        let buttonDepth = 0;
                        let current = button;
                        while (current && current !== commonAncestor) {
                            current = current.parentElement;
                            buttonDepth++;
                        }
                        
                        // Only include if button is within 2 levels of the common ancestor
                        // This keeps tab groups properly isolated and prevents cross-contamination
                        if (commonAncestor && commonAncestor !== document.body && buttonDepth <= 2) {
                            console.log('[Indux Tabs] Including button', tabValue, 'depth:', buttonDepth, 'ancestor:', commonAncestor.tagName, commonAncestor.className);
                            buttonsForThisSet.push(button);
                        } else {
                            console.log('[Indux Tabs] Excluding button', tabValue, 'depth:', buttonDepth, 'ancestor:', commonAncestor.tagName);
                        }
                    }
                });
                
                console.log('[Indux Tabs] Panel set:', panelSet || 'default', 'Buttons found:', buttonsForThisSet.length, 'Panels:', panelsInSet.length);
                
                if (buttonsForThisSet.length === 0) {
                    console.log('[Indux Tabs] No buttons found for panel set:', panelSet || 'default');
                    return;
                }
                
                // Find the closest common parent of JUST the panels first  
                // This ensures we get the most specific container for this tab group
                const panelCommonParent = findCommonParent(panelsInSet);
                
                // Now filter buttons to only include those actually within this panel container
                const filteredButtons = buttonsForThisSet.filter(button => 
                    panelCommonParent.contains(button)
                );
                
                console.log('[Indux Tabs] Panel set:', panelSet || 'default', 'Filtered buttons:', filteredButtons.length, 'within panel container:', panelCommonParent.tagName, panelCommonParent.className);
                
                // If no buttons are within the panel container, skip this group
                if (filteredButtons.length === 0) {
                    console.log('[Indux Tabs] No buttons found within panel container for set:', panelSet || 'default');
                    return;
                }
                
                // Use the panel container as our common parent (buttons should be within it)
                const commonParent = panelCommonParent;
                
                console.log('[Indux Tabs] Panel set:', panelSet || 'default', 'Common parent:', commonParent.tagName, commonParent.className || commonParent.id);
                
                
                // Check if we've already processed this parent for this panel set
                const processedKey = `data-tabs-processed-${panelSet}`;
                if (commonParent.hasAttribute(processedKey)) {
                    return;
                }
                
                // Mark as processed for this panel set
                commonParent.setAttribute(processedKey, 'true');
                
                // Ensure the common parent has x-data
                if (!commonParent.hasAttribute('x-data')) {
                    commonParent.setAttribute('x-data', '{}');
                }
                
                // Create tab data specifically for this panel set only
                const tabProp = getTabPropertyName(panelSet);
                let defaultTabValue = null;
                
                // Process buttons for this set and collect tab data FIRST
                filteredButtons.forEach(button => {
                    const tabValue = button.getAttribute('x-tab');
                    if (!tabValue) return;
                    
                    // Set the default value to the first button's value
                    if (!defaultTabValue) {
                        defaultTabValue = tabValue;
                    }
                    
                    // Add click handler
                    const existingClick = button.getAttribute('x-on:click') || '';
                    const newClick = `${tabProp} = '${tabValue}'`;
                    
                    // Only add if it's not already there to avoid duplication
                    let finalClick;
                    if (existingClick && existingClick.includes(newClick)) {
                        finalClick = existingClick;
                    } else {
                        finalClick = existingClick ? `${existingClick}; ${newClick}` : newClick;
                    }
                    
                    button.setAttribute('x-on:click', finalClick);
                });
                
                // Set up Alpine data property for THIS panel set only
                if (defaultTabValue) {
                    const existingXData = commonParent.getAttribute('x-data') || '{}';
                    let newXData = existingXData;
                    
                    // Create the property for this specific panel set
                    const tabProperty = `${tabProp}: '${defaultTabValue}'`;
                    
                    // Parse existing x-data
                    if (existingXData === '{}') {
                        // Empty x-data, create new one with this tab property
                        newXData = `{ ${tabProperty} }`;
                    } else {
                        // Existing x-data, append this tab property
                        // Insert before the closing brace
                        const lastBraceIndex = existingXData.lastIndexOf('}');
                        if (lastBraceIndex > 0) {
                            const beforeBrace = existingXData.substring(0, lastBraceIndex);
                            const afterBrace = existingXData.substring(lastBraceIndex);
                            const separator = beforeBrace.trim().endsWith(',') ? '' : ', ';
                            newXData = beforeBrace + separator + tabProperty + afterBrace;
                        }
                    }
                    
                    // Update the x-data attribute
                    console.log('[Indux Tabs] Setting x-data on', commonParent.tagName, commonParent.className, ':', newXData);
                    commonParent.setAttribute('x-data', newXData);
                    
                    // Force Alpine to re-initialize if it's already initialized
                    if (window.Alpine && commonParent._x_dataStack) {
                        delete commonParent._x_dataStack;
                        window.Alpine.initTree(commonParent);
                    }
                }
                
                // NOW process panels and add x-show directives (after Alpine data is set up)
                panelsInSet.forEach(panel => {
                    const tabProp = getTabPropertyName(panelSet);
                    
                    // Add x-show directive
                    const panelId = panel.id || panel.className.split(' ')[0];
                    if (panelId) {
                        panel.setAttribute('x-show', `${tabProp} === '${panelId}'`);
                    }
                });
            });
        }
        
        // Register Alpine directives
        if (window.Alpine) {
            Alpine.plugin(() => {
                // Register x-tab directive
                Alpine.directive('tab', (el, { value }, { effect }) => {
                    // This will be processed by our main logic
                    effect(() => {
                        processTabs();
                    });
                });
                
                // Register x-tabpanel directive
                Alpine.directive('tabpanel', (el, { value }, { effect }) => {
                    // This will be processed by our main logic
                    effect(() => {
                        processTabs();
                    });
                });
            });
        } else {
            document.addEventListener('alpine:init', () => {
                Alpine.plugin(() => {
                    // Register x-tab directive
                    Alpine.directive('tab', (el, { value }, { effect }) => {
                        // This will be processed by our main logic
                        effect(() => {
                            processTabs();
                        });
                    });
                    
                    // Register x-tabpanel directive
                    Alpine.directive('tabpanel', (el, { value }, { effect }) => {
                        // This will be processed by our main logic
                        effect(() => {
                            processTabs();
                        });
                    });
                });
            });
        }
        
        // Process tabs when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processTabs);
        } else {
            processTabs();
        }
        
        // Also process when Alpine is ready
        document.addEventListener('alpine:initialized', processTabs);
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
    	    
    	    return delayValue ? parseInt(delayValue) : 500; // Default to 500ms if not set
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

    /* Indux Utilities */

    // Browser runtime compiler
    class TailwindCompiler {
        constructor(options = {}) {

            // Create style element immediately
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'utility-styles';
            document.head.appendChild(this.styleElement);

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
            this.options = {
                rootSelector: options.rootSelector || ':root',
                themeSelector: options.themeSelector || '@theme',
                debounceTime: options.debounceTime || 50,
                maxCacheAge: options.maxCacheAge || 24 * 60 * 60 * 1000,
                debug: options.debug || true,
                ...options
            };

            // Pre-compile regex patterns
            this.regexPatterns = {
                root: new RegExp(`${this.options.rootSelector}\\s*{([^}]*)}`, 'g'),
                theme: new RegExp(`${this.options.themeSelector}\\s*{([^}]*)}`, 'g'),
                variable: /--([\w-]+):\s*([^;]+);/g,
                tailwindPrefix: /^(color|font|text|font-weight|tracking|leading|breakpoint|container|spacing|radius|shadow|inset-shadow|drop-shadow|blur|perspective|aspect|ease|animate|border-width|border-style|outline|outline-width|outline-style|ring|ring-offset|divide|accent|caret|decoration|placeholder|selection|scrollbar)-/
            };

            // Pre-define pseudo classes
            this.pseudoClasses = ['hover', 'focus', 'active', 'disabled', 'dark'];

            // Pre-define utility generators
            this.utilityGenerators = {
                'color-': (suffix, value) => {
                    const utilities = [];

                    // Helper function to generate utility with optional opacity
                    const addUtility = (prefix, property, baseValue) => {
                        // Base utility without opacity
                        utilities.push([`${prefix}-${suffix}`, `${property}: ${baseValue}`]);
                    };

                    addUtility('text', 'color', value);
                    addUtility('bg', 'background-color', value);
                    addUtility('border', 'border-color', value);
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

            // Define valid variants and their CSS selectors
            this.variants = {
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
                'open': '[open] &',
                'closed': ':not([open]) &',
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

            // Define variant groups that can be combined
            this.variantGroups = {
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

            // Cache for parsed class names
            this.classCache = new Map();

            // Load cache and start processing
            this.loadAndApplyCache();

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

        setupComponentLoadListener() {
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
        }

        // Debounce helper
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
            // Check if Tailwind is already available
            if (this.isTailwindAvailable()) {
                return;
            }

            // Wait for Tailwind to be available
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.isTailwindAvailable()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);

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
                    console.warn('[TailwindCompiler] Tailwind not found after 5 seconds, proceeding anyway');
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
                        sheet.href.includes('tailwindcss')
                    )
                ) ||
                // Check for Tailwind classes in document
                document.querySelector('[class*="tailwind"]') ||
                // Check for Tailwind in window object
                window.tailwind ||
                // Check for Tailwind in document head
                document.head.innerHTML.includes('tailwind')
            );
        }

        loadAndApplyCache() {
            try {
                const cached = localStorage.getItem('tailwind-cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    this.cache = new Map(Object.entries(parsed));

                    // Apply the most recent cached styles immediately
                    const mostRecentCache = Array.from(this.cache.entries())
                        .sort((a, b) => b[1].timestamp - a[1].timestamp)[0];

                    if (mostRecentCache) {
                        this.styleElement.textContent = mostRecentCache[1].css;
                        this.lastThemeHash = mostRecentCache[1].themeHash;
                    }
                }
            } catch (error) {
                console.warn('Failed to load cached styles:', error);
            }
        }

        async startProcessing() {
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
        }

        discoverCssFiles() {
            try {
                // Get all stylesheets from the document
                const stylesheets = Array.from(document.styleSheets);

                // Process each stylesheet
                for (const sheet of stylesheets) {
                    try {
                        // Only process local files (exclude CDNs and external resources)
                        if (sheet.href && 
                            sheet.href.startsWith(window.location.origin) &&
                            !sheet.href.includes('cdn.') &&
                            !sheet.href.includes('jsdelivr') &&
                            !sheet.href.includes('unpkg') &&
                            !sheet.href.includes('cdnjs')) {
                            this.cssFiles.add(sheet.href);
                        }

                        // Get all @import rules (only local ones)
                        const rules = Array.from(sheet.cssRules || []);
                        for (const rule of rules) {
                            if (rule.type === CSSRule.IMPORT_RULE &&
                                rule.href.startsWith(window.location.origin) &&
                                !rule.href.includes('cdn.')) {
                                this.cssFiles.add(rule.href);
                            }
                        }
                    } catch (e) {
                        // Skip stylesheets that can't be accessed due to CORS
                        console.warn('Skipped stylesheet due to CORS:', sheet.href || 'inline');
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
        }

        loadPersistentCache() {
            try {
                const cached = localStorage.getItem('tailwind-cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    this.cache = new Map(Object.entries(parsed));
                }
            } catch (error) {
                console.warn('Failed to load cached styles:', error);
            }
        }

        savePersistentCache() {
            try {
                const serialized = JSON.stringify(Object.fromEntries(this.cache));
                localStorage.setItem('tailwind-cache', serialized);
            } catch (error) {
                console.warn('Failed to save cached styles:', error);
            }
        }

        // Generate a hash of the theme variables to detect changes
        generateThemeHash(themeCss) {
            // Use encodeURIComponent to handle non-Latin1 characters safely
            return encodeURIComponent(themeCss).slice(0, 8); // Simple hash of theme content
        }

        // Clean up old cache entries
        cleanupCache() {
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
        }

        // Scan static HTML files and components for classes
        async scanStaticClasses() {
            if (this.staticScanPromise) {
                return this.staticScanPromise;
            }

            this.staticScanPromise = (async () => {
                try {
                    const staticClasses = new Set();

                    // 1. Scan index.html content
                    const htmlContent = document.documentElement.outerHTML;
                    this.extractClassesFromHTML(htmlContent, staticClasses);

                    // 2. Scan component files that are likely to be loaded
                    const componentUrls = [
                        '/components/navigation/header.html',
                        '/components/navigation/logo.html',
                        '/components/navigation/doc-footer.html'
                    ];

                    const componentPromises = componentUrls.map(async (url) => {
                        try {
                            const response = await fetch(url);
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
        }

        // Extract classes from HTML content
        extractClassesFromHTML(html, classSet) {

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
        }

        getUsedClasses() {
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
                            // This handles cases where the variable is --color-content-subtle
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

                return {
                    classes: Array.from(allClasses),
                    variableSuffixes: Array.from(usedVariableSuffixes)
                };
            } catch (error) {
                console.error('Error getting used classes:', error);
                return { classes: [], variableSuffixes: [] };
            }
        }

        async fetchThemeContent() {
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
                            
                            // For static compilation phase, cache for longer (30 seconds)
                            // For dynamic compilation phase, cache for shorter (5 seconds)
                            const cacheTime = this.hasScannedStatic ? 5000 : 30000;
                            
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
        }

        async processThemeContent(content) {
            try {
                const variables = this.extractThemeVariables(content);
                if (variables.size === 0) {
                    return;
                }

                // Only log and process actual changes
                let hasChanges = false;
                for (const [name, value] of variables.entries()) {
                    const currentValue = this.currentThemeVars.get(name);
                    if (currentValue !== value) {
                        hasChanges = true;
                        this.currentThemeVars.set(name, value);
                    }
                }

                if (hasChanges) {
                    // Generate utilities for these variables
                    const utilities = this.generateUtilitiesFromVars(content, this.getUsedClasses());
                    if (!utilities) {
                        return;
                    }

                    // Update styles immediately with new utilities
                    const newStyles = `@layer utilities {\n${utilities}\n}`;
                    this.updateStyles(newStyles);
                }

            } catch (error) {
                console.warn('Error processing theme content:', error);
            }
        }

        updateStyles(newStyles) {
            if (!this.styleElement) {
                console.warn('No style element found');
                return;
            }

            this.styleElement.textContent = newStyles;
        }

        extractThemeVariables(cssText) {
            const variables = new Map();

            // Extract ALL CSS custom properties from ANY declaration block
            // This regex finds --variable-name: value; patterns anywhere in the CSS
            const varRegex = /--([\w-]+):\s*([^;]+);/g;

            let varMatch;
            while ((varMatch = varRegex.exec(cssText)) !== null) {
                const name = varMatch[1];
                const value = varMatch[2].trim();
                variables.set(name, value);
            }

            return variables;
        }

        parseClassName(className) {
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
                    // This is a variant separator, not part of a bracket expression
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
        }

        generateUtilitiesFromVars(cssText, usedData) {
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
                                
                                // Replace underscores with spaces, but preserve them inside parentheses
                                // This handles cases like :not(.whatever,_else) where the underscore should become a space
                                arbitrarySelector = arbitrarySelector.replace(/_/g, ' ');
                                
                                // We'll handle this in the CSS generation - store for later use
                                selector = { baseClass: selector, arbitrarySelector };
                            } else if (variant.selector.startsWith(':')) {
                                // For pseudo-classes, append to selector
                                selector = `${selector}${variant.selector}`;
                            } else if (variant.selector.startsWith('@')) {
                                // For media queries, wrap the whole rule
                                hasMediaQuery = true;
                                mediaQueryRule = variant.selector;
                            } else if (variant.selector.includes('&')) {
                                // For contextual selectors (like dark mode)
                                selector = variant.selector.replace('&', selector);
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
                                if (baseClass.includes('/') && baseClass.startsWith(className + '/')) {
                                    const opacity = baseClass.split('/')[1];
                                    // Validate that the opacity is a number between 0-100
                                    return !isNaN(opacity) && opacity >= 0 && opacity <= 100;
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
        }

        async compile() {
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
                        
                        const utilities = this.generateUtilitiesFromVars(themeCss, staticUsedData);
                        if (utilities) {
                            const finalCss = `@layer utilities {\n${utilities}\n}`;
                            this.styleElement.textContent = finalCss;
                            this.lastClassesHash = staticUsedData.classes.sort().join(',');
                        }
                    }
                    
                    this.hasInitialized = true;
                    this.isCompiling = false;
                    return;
                }

                // For subsequent compilations, only check for new dynamic classes
                const usedData = this.getUsedClasses();
                const dynamicClasses = Array.from(this.dynamicClassCache);
                
                // Create a hash of current dynamic classes to detect changes
                const dynamicClassesHash = dynamicClasses.sort().join(',');
                
                // Check if dynamic classes have actually changed
                if (dynamicClassesHash === this.lastClassesHash && this.hasInitialized) {
                    // No new dynamic classes, skip compilation
                    this.isCompiling = false;
                    return;
                }

                // Only fetch CSS if we have new dynamic classes
                if (dynamicClasses.length > 0) {
                const themeCss = await this.fetchThemeContent();
                    if (!themeCss) {
                        this.isCompiling = false;
                        return;
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
                    const utilities = this.generateUtilitiesFromVars(themeCss, usedData);
                        if (utilities) {
                    const finalCss = `@layer utilities {\n${utilities}\n}`;
                    this.styleElement.textContent = finalCss;
                            this.lastClassesHash = dynamicClassesHash;
                        }
                    }
                }

            } catch (error) {
                console.error('Error compiling Tailwind CSS:', error);
            } finally {
                this.isCompiling = false;
            }
        }
    }

    // Initialize immediately without waiting for DOMContentLoaded
    const compiler = new TailwindCompiler();

    // Expose utilities compiler for optional integration
    window.InduxUtilities = compiler;

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

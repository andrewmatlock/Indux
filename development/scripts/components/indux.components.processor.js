/*! Indux Components Processor 1.0.0 - MIT License */
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
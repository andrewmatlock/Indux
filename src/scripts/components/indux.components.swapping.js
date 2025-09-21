/*! Indux Components Swapping 1.0.0 - MIT License */
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
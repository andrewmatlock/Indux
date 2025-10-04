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

    // Listen for component processing to ensure visibility is applied after components load
    window.addEventListener('indux:components-processed', () => {
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
        processRouteVisibility(normalizedPath);
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
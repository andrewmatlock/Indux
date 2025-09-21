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
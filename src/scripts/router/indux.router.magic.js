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
        const normalizedPath = currentRoute === '/' ? '' : currentRoute.replace(/^\/|\/$/g, '');
        const segments = normalizedPath ? normalizedPath.split('/').filter(segment => segment) : [];
        
        route.current = currentRoute;
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

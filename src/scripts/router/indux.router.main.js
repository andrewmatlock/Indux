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

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

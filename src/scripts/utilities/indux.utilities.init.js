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


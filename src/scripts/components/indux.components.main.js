/*! Indux Components Main 1.0.0 - MIT License */

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
/*! Indux Router 1.0.0 - MIT License */




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
    // Don't use capture phase - let anchor links work naturally
    document.addEventListener('click', (event) => {
        
        const link = event.target.closest('a');
        if (!link) {
            return;
        }

        const href = link.getAttribute('href');
        
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        // Skip anchor links - let them work naturally
        if (href.startsWith('#') || href.includes('#')) {
            // Don't prevent default or stop propagation - let browser handle it completely
            return;
        }

        // Only prevent default for non-anchor links
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Check if it's a relative link
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) return; // External link
        } catch (e) {
            // Invalid URL, treat as relative
        }

        // Set flag to prevent recursive calls
        isInternalNavigation = true;

        // Update URL without page reload
        history.pushState(null, '', href);

        // Handle route change
        handleRouteChange();

        // Reset flag
        isInternalNavigation = false;

    }, false); // Don't use capture phase
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

// Anchors functionality
function initializeAnchors() {
    // Register anchors directive
    Alpine.directive('anchors', (el, { expression, modifiers }, { effect, evaluateLater }) => {
        const getTarget = evaluateLater(expression || 'null');
        const hasHighlight = modifiers.includes('highlight');

        effect(() => {
            getTarget(async (target) => {
                const extractHeadings = () => {
                    let headings = [];

                    if (target) {
                        // If target is a string, treat as selector
                        if (typeof target === 'string') {
                            const targetEl = document.querySelector(target);
                            if (targetEl) {
                                const headingElements = targetEl.querySelectorAll('h1, h2, h3');
                                headings = Array.from(headingElements).map((heading, index) => {
                                    // Generate ID if missing
                                    let id = heading.id;
                                    if (!id || id.trim() === '') {
                                        // Create ID from text content
                                        id = heading.textContent
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-')
                                            .trim();

                                        // Ensure uniqueness by adding index if needed
                                        if (!id) {
                                            id = `heading-${index}`;
                                        }

                                        // Set the ID on the heading element
                                        heading.id = id;
                                        
                                        // Add x-intersect directive to track visibility
                                        const anchorLink = anchorsEl.querySelector(`a[href="#${id}"]`);
                                        if (anchorLink) {
                                            // Add x-intersect to the heading
                                            heading.setAttribute('x-intersect', `$el.closest('[x-anchors]').__x.$data.anchorHeadings.find(h => h.id === '${id}').isActive = true`);
                                            heading.setAttribute('x-intersect:leave', `$el.closest('[x-anchors]').__x.$data.anchorHeadings.find(h => h.id === '${id}').isActive = false`);
                                        }
                                    }

                                    return {
                                        id: id,
                                        text: heading.textContent,
                                        level: parseInt(heading.tagName.charAt(1)),
                                        index: index
                                    };
                                });
                            }
                        }
                        // If target is a DOM element, extract headings from it
                        else if (target && target.querySelectorAll) {
                            const headingElements = target.querySelectorAll('h1, h2, h3');
                            headings = Array.from(headingElements).map((heading, index) => {
                                // Generate ID if missing
                                let id = heading.id;
                                if (!id || id.trim() === '') {
                                    // Create ID from text content
                                    id = heading.textContent
                                        .toLowerCase()
                                        .replace(/[^a-z0-9\s-]/g, '')
                                        .replace(/\s+/g, '-')
                                        .trim();

                                    // Ensure uniqueness by adding index if needed
                                    if (!id) {
                                        id = `heading-${index}`;
                                    }

                                    // Set the ID on the heading element
                                    heading.id = id;
                                }

                                return {
                                    id: id,
                                    text: heading.textContent,
                                    level: parseInt(heading.tagName.charAt(1)),
                                    index: index
                                };
                            });
                        }
                    }

                    return headings;
                };

                const updateHeadings = (headings) => {
                    // Find the closest Alpine component
                    const parentElement = el.closest('[x-data]') || document.body;

                    // Add URL generation function to each heading
                    const headingsWithUrls = headings.map(heading => ({
                        ...heading,
                        url: () => {
                            // Return just the hash for anchor links
                            return `#${heading.id}`;
                        }
                    }));

                    // Initialize anchorHeadings if it doesn't exist
                    if (parentElement._x_dataStack && parentElement._x_dataStack[0]) {
                        if (!parentElement._x_dataStack[0].anchorHeadings) {
                            parentElement._x_dataStack[0].anchorHeadings = [];
                        }
                        parentElement._x_dataStack[0].anchorHeadings = headingsWithUrls;
                    } else {
                        // Create data stack if it doesn't exist
                        if (!parentElement._x_dataStack) {
                            parentElement._x_dataStack = [{}];
                        }
                        parentElement._x_dataStack[0].anchorHeadings = headingsWithUrls;

                        // Initialize Alpine if needed
                        if (window.Alpine) {
                            Alpine.nextTick(() => {
                                Alpine.initTree(parentElement);
                            });
                        }
                    }
                };

                // Try immediately
                let headings = extractHeadings();

                // If no headings found, set up a MutationObserver
                if (headings.length === 0) {
                    if (typeof target === 'string') {
                        const targetEl = document.querySelector(target);
                        if (targetEl) {
                            const observer = new MutationObserver((mutations) => {
                                const newHeadings = extractHeadings();
                                if (newHeadings.length > 0) {
                                    updateHeadings(newHeadings);
                                    observer.disconnect();
                                }
                            });

                            observer.observe(targetEl, {
                                childList: true,
                                subtree: true
                            });

                            // Also try a few times with setTimeout as fallback
                            let attempts = 0;
                            const tryAgain = () => {
                                attempts++;
                                const newHeadings = extractHeadings();
                                if (newHeadings.length > 0) {
                                    updateHeadings(newHeadings);
                                    observer.disconnect();
                                } else if (attempts < 10) {
                                    setTimeout(tryAgain, 200);
                                } else {
                                    observer.disconnect();
                                }
                            };
                            setTimeout(tryAgain, 200);
                        }
                    }
                }

                updateHeadings(headings);
                
                                // Setup highlighting if modifier is present
                if (hasHighlight) {
                    const setupHighlighting = () => {
                        const links = el.querySelectorAll('a');
                        const container = document.querySelector('.scroll-smooth');
                        const targetContainer = el.closest('[x-anchors]')?.querySelector('.prose') || document.querySelector('.prose');
                        
                        if (!links.length || !container || !targetContainer) {
                            return;
                        }
                        
                        const targets = targetContainer.querySelectorAll('h1[id], h2[id], h3[id]');
                        
                        if (!targets.length) {
                            return;
                        }
                        
                        const updateActiveHeading = () => {
                            let activeHeading = null;
                            let highestPosition = -1;
                            
                            targets.forEach(target => {
                                const rect = target.getBoundingClientRect();
                                const containerRect = container.getBoundingClientRect();
                                
                                if (rect.top >= 0 && rect.bottom <= containerRect.height) {
                                    if (activeHeading === null || rect.top < highestPosition) {
                                        activeHeading = target;
                                        highestPosition = rect.top;
                                    }
                                }
                            });
                            
                            if (activeHeading) {
                                const id = activeHeading.id;
                                links.forEach(link => {
                                    const isActive = link.getAttribute('href') === `#${id}`;
                                    
                                    if (isActive) {
                                        link.classList.add('text-content-neutral');
                                        link.classList.remove('text-content-subtle');
                                    } else {
                                        link.classList.add('text-content-subtle');
                                        link.classList.remove('text-content-neutral');
                                    }
                                });
                            }
                        };
                        
                        const observer = new IntersectionObserver(() => {
                            updateActiveHeading();
                        }, {
                            root: container,
                            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
                        });
                        
                        container.addEventListener('scroll', () => {
                            updateActiveHeading();
                        });
                        
                        targets.forEach(target => {
                            observer.observe(target);
                        });
                    };
                    
                    // Wait for content to be ready
                    const waitForContent = () => {
                        const links = el.querySelectorAll('a');
                        if (links.length > 0) {
                            setupHighlighting();
                        } else {
                            setTimeout(waitForContent, 200);
                        }
                    };
                    
                                         waitForContent();
                 }
            });
        });
    });
}



// Initialize anchors when Alpine is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeAnchors();
    });
}

document.addEventListener('alpine:init', initializeAnchors); 


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
        if (template.hasAttribute('data-head')) {
        } else {
            // Check if this might be the about template
            if (template.getAttribute('x-route') === 'about') {
            }
        }
    });

    // Also try a more specific selector to see if we can find the about template
    const aboutTemplate = document.querySelector('template[x-route="about"]');
    if (aboutTemplate) {
    }

    // Process each element's head content
    elementsWithHead.forEach((template, index) => {

        // For component templates, we need to check if the component should be visible
        // based on the current route, not just the template's own attributes
        let element = template;
        let shouldProcess = true;

        // If this is a component template (has data-component), check if the component
        // should be visible for the current route
        if (template.hasAttribute('data-component')) {
            const componentId = template.getAttribute('data-component');
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
            const aboutComponent = document.querySelector('[data-component="about-1"]');
            if (aboutComponent) {
            }

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
            const aboutComponent = document.querySelector('[data-component="about-1"]');
            if (aboutComponent) {
            }

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
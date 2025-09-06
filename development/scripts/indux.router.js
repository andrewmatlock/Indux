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

    const oldRoute = currentRoute;
    currentRoute = newRoute;

    // Use requestAnimationFrame to batch DOM updates without delay
    requestAnimationFrame(() => {
    // Emit route change event
    window.dispatchEvent(new CustomEvent('indux:route-change', {
        detail: {
                from: oldRoute,
            to: newRoute,
            normalizedPath: newRoute === '/' ? '/' : newRoute.replace(/^\/|\/$/g, '')
        }
    }));

        // Handle hash in URL after route change
        const hash = window.location.hash;
        if (hash) {
            const anchorId = hash.substring(1);
            // Use a longer delay for route + anchor combinations to ensure content is loaded
            setTimeout(() => {
                scrollToAnchor(anchorId);
            }, 50);
        }
    });
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
        const target = link.getAttribute('target');
        
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        // Don't intercept external links or links with target="_blank"
        if (target === '_blank') {
            return;
        }

        // Check if it's an external link
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) {
                return; // External link - let browser handle it
            }
        } catch (e) {
            // Invalid URL, but might be relative - continue processing
        }
        
        // Handle anchor links with smooth scrolling
        if (href.startsWith('#') || href.includes('#')) {
            // Check if this is a route + anchor combination
            if (href.includes('/') && href.includes('#')) {
                // This is a route with an anchor - handle navigation first, then scroll
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

                // Extract route and anchor
                const [route, hash] = href.split('#');
                const anchorId = hash;

                // Set flag to prevent recursive calls
                isInternalNavigation = true;

                // Update URL without page reload
                history.pushState(null, '', href);

                // Handle route change
                handleRouteChange();

                // Reset flag
                isInternalNavigation = false;

                // Scroll to anchor after route change (handled in handleRouteChange)
                return;
            } else if (href.startsWith('#')) {
                // This is a pure anchor link - handle smooth scrolling
                event.preventDefault();
                
                const hash = href.substring(1);
                if (hash) {
                    scrollToAnchor(hash);
                }
                return;
            }
        }

        // Only prevent default for non-anchor links
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

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

// Smooth scroll to anchor within scrollable containers
function scrollToAnchor(anchorId) {
    const targetElement = document.getElementById(anchorId);
    if (!targetElement) return;

    // Find the scrollable container that contains the target element
    const scrollableContainer = findScrollableContainer(targetElement);
    
    if (scrollableContainer) {
        // Calculate the position to scroll to
        const containerRect = scrollableContainer.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Calculate the scroll position needed to bring the target into view
        const scrollTop = scrollableContainer.scrollTop + (targetRect.top - containerRect.top) - 100; // 100px offset
        
        // Smooth scroll to the target
        scrollableContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    } else {
        // Fallback to default browser behavior if no scrollable container found
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
}

// Find the nearest scrollable container that contains the given element
function findScrollableContainer(element) {
    let current = element;
    
    while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        
        // Check if this element is scrollable
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return current;
        }
        
        current = current.parentElement;
    }
    
    return null;
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

    // Handle initial hash if present
    setTimeout(() => {
        const hash = window.location.hash;
        if (hash) {
            const anchorId = hash.substring(1);
            scrollToAnchor(anchorId);
        }
    }, 200); // Wait a bit longer for initial content to load
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
    Alpine.directive('anchors', (el, { expression, modifiers }, { effect, evaluateLater, Alpine }) => {

        
        try {
            // Parse pipeline syntax: 'scope | targets'
            const parseExpression = (expr) => {
                if (!expr || expr.trim() === '') {
                    return { scope: '', targets: 'h1, h2, h3, h4, h5, h6' };
                }
                
                if (expr.includes('|')) {
                    const parts = expr.split('|').map(p => p.trim());
                                    return {
                        scope: parts[0] || '',
                        targets: parts[1] || 'h1, h2, h3, h4, h5, h6'
                    };
                } else {
                    return { scope: '', targets: expr };
                }
            };
            
            // Extract anchors function
            const extractAnchors = (expr) => {
                const parsed = parseExpression(expr);
                
                let containers = [];
                if (!parsed.scope) {
                    containers = [document.body];
                } else {
                    containers = Array.from(document.querySelectorAll(parsed.scope));
                }
                
                let elements = [];
                const targets = parsed.targets.split(',').map(t => t.trim());
                
                containers.forEach(container => {
                    // Query all targets at once, then filter and sort by DOM order
                    const allMatches = [];
                    targets.forEach(target => {
                        const matches = container.querySelectorAll(target);
                        allMatches.push(...Array.from(matches));
                    });
                    
                    // Remove duplicates and sort by DOM order
                    const uniqueMatches = [...new Set(allMatches)];
                    uniqueMatches.sort((a, b) => {
                        const position = a.compareDocumentPosition(b);
                        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                        return 0;
                    });
                    
                    elements.push(...uniqueMatches);
                });
                
                return elements.map((element, index) => {
                    // Generate simple ID
                    let id = element.id;
                                    if (!id) {
                        id = element.textContent.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                        if (id) element.id = id;
                                    }

                    // Selected state will be managed by intersection observer

                                return {
                                    id: id,
                        text: element.textContent,
                        link: `#${id}`,
                        tag: element.tagName.toLowerCase(),
                        class: element.className.split(' ')[0] || '',
                        classes: Array.from(element.classList),
                        index: index,
                        element: element,

                                };
                            });
            };
            
            // Track if we've already rendered to prevent duplicates
            let renderedContainer = null;
            
                        // Update Alpine data with anchors
            const updateAnchors = (anchors) => {
                // Remove existing rendered container if it exists
                if (renderedContainer && renderedContainer.parentElement) {
                    renderedContainer.remove();
                    renderedContainer = null;
                }
                
                // Render using the template element's structure and classes
                if (anchors.length > 0) {
                    renderedContainer = document.createElement('div');
                    
                    anchors.forEach(anchor => {
                        // Find the <a> element inside the template
                        const templateContent = el.content || el;
                        const anchorTemplate = templateContent.querySelector('a') || el.querySelector('a');
                        
                        if (anchorTemplate) {
                            // Clone the <a> element from inside the template
                            const linkElement = anchorTemplate.cloneNode(true);
                            
                            // Remove Alpine directives
                            linkElement.removeAttribute('x-text');
                            linkElement.removeAttribute(':href');
                            
                            // Set the actual href and text content
                            linkElement.href = anchor.link;
                            linkElement.textContent = anchor.text;
                            
                            // Evaluate any :class bindings for this anchor
                            if (linkElement.hasAttribute(':class')) {
                                const classBinding = linkElement.getAttribute(':class');
                                linkElement.removeAttribute(':class');
                                
                                // Parse the class binding object and apply classes
                                if (classBinding.includes("'pl-2': anchor.tag === 'h3'") && anchor.tag === 'h3') {
                                    linkElement.classList.add('pl-2');
                                }
                            }
                            
                            renderedContainer.appendChild(linkElement);
                        }
                    });
                    
                    // Replace template with actual elements
                    el.parentElement.insertBefore(renderedContainer, el);
                    el.style.display = 'none'; // Hide template
                }
            };
            
            // Try extraction and update data
            const tryExtraction = () => {
                const anchors = extractAnchors(expression);
                updateAnchors(anchors);
                return anchors;
            };
            
            // Try extraction with progressive delays and content detection
            const attemptExtraction = (attempt = 1, maxAttempts = 10) => {
                const anchors = extractAnchors(expression);
                
                if (anchors.length > 0) {
                    updateAnchors(anchors);

                    return true;
                                } else if (attempt < maxAttempts) {
                    setTimeout(() => {
                        attemptExtraction(attempt + 1, maxAttempts);
                    }, attempt * 200); // Progressive delay: 200ms, 400ms, 600ms, etc.
                }
                return false;
            };
            
            // Store refresh function on element for route changes
            el._x_anchorRefresh = () => {
                attemptExtraction();
            };
            
            // Start extraction attempts
            attemptExtraction();
            
            
        } catch (error) {
            console.error('[Indux Anchors] Error in directive:', error);
        }
    });
}



// Initialize anchors when Alpine is ready
document.addEventListener('alpine:init', () => {

    try {
        initializeAnchors();

    } catch (error) {
        console.error('[Indux Anchors] Failed to initialize:', error);
    }
});

// Refresh anchors when route changes
window.addEventListener('indux:route-change', () => {
    // Wait a bit for content to load after route change
    setTimeout(() => {
        const anchorElements = document.querySelectorAll('[x-anchors]');
        anchorElements.forEach(el => {
            const expression = el.getAttribute('x-anchors');
            if (expression && el._x_anchorRefresh) {
                el._x_anchorRefresh();
            }
        });
    }, 100);
});

// Refresh anchors when hash changes (for active state updates)
window.addEventListener('hashchange', () => {
    const anchorElements = document.querySelectorAll('[x-anchors]');
    anchorElements.forEach(el => {
        if (el._x_anchorRefresh) {
            el._x_anchorRefresh();
        }
    });
}); 


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

// Listen for markdown content changes to re-process head templates
document.addEventListener('DOMContentLoaded', () => {
    // Set up mutation observer for markdown elements
    const setupMarkdownObserver = () => {
        const markdownElements = document.querySelectorAll('[x-markdown]');
        markdownElements.forEach(element => {
            const observer = new MutationObserver(() => {
                // Add a small delay to ensure templates are fully rendered
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
                    processAllHeadContent(normalizedPath);
                }, 100);
            });
            observer.observe(element, {
                childList: true,
                subtree: true
            });
        });
    };

    // Initial setup
    setupMarkdownObserver();
    
    // Also re-setup observers when route changes (in case new markdown elements appear)
    window.addEventListener('indux:route-change', () => {
        setTimeout(setupMarkdownObserver, 200);
    });
});

// Export head content interface
window.InduxRoutingHead = {
    initialize: initializeHeadContent,
    processElementHeadContent,
    processAllHeadContent
}; 
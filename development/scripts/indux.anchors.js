/*! Indux Anchors 1.0.0 - MIT License */

// Initialize plugin when Alpine is ready
function initializeAnchorsPlugin() {
    // Register anchors directive
    Alpine.directive('anchors', (el, { expression, modifiers }, { effect, evaluateLater }) => {
        const getTarget = evaluateLater(expression || 'null');

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
                                    }

                                    return {
                                        id: id,
                                        text: heading.textContent,
                                        level: parseInt(heading.tagName.charAt(1)),
                                        index: index // Add index for unique key
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
                                    index: index // Add index for unique key
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
            });
        });
    });

    // Add intersection observer to track visible headings
    function setupIntersectionObserver() {
        const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3');
        const anchorLinks = document.querySelectorAll('[x-anchors] a[href^="#"]');
        
        if (headings.length === 0 || anchorLinks.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            // Clear all active states first
            anchorLinks.forEach(link => {
                link.removeAttribute('data-active');
            });
            
            // Find the most recently intersecting heading (highest in viewport)
            let activeHeading = null;
            let highestPosition = -1;
            
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const rect = entry.boundingClientRect;
                    const position = rect.top;
                    if (position > highestPosition) {
                        highestPosition = position;
                        activeHeading = entry.target;
                    }
                }
            });
            
            // Set active state only for the most visible heading
            if (activeHeading) {
                const headingId = activeHeading.id;
                const anchorLink = document.querySelector(`[x-anchors] a[href$="#${headingId}"]`);
                if (anchorLink) {
                    anchorLink.setAttribute('data-active', 'true');
                }
            }
        }, {
            root: document.querySelector('.overflow-y-auto'), // Use the scrollable container
            rootMargin: '-20% 0px -70% 0px', // Consider heading "visible" when it's in the top 20% of the viewport
            threshold: 0
        });

        headings.forEach(heading => {
            if (heading.id) {
                observer.observe(heading);
            }
        });
    }

    // Setup intersection observer when anchors are initialized
    document.addEventListener('alpine:init', () => {
        Alpine.nextTick(() => {
            setTimeout(setupIntersectionObserver, 100); // Small delay to ensure content is rendered
        });
    });
}

// Let the browser handle hash navigation naturally
// The browser will automatically scroll to anchors when the page loads

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeAnchorsPlugin();
    });
}

document.addEventListener('alpine:init', initializeAnchorsPlugin); 
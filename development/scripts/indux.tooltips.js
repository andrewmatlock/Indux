/*! Indux Tooltips 1.0.0 - MIT License */

// Get tooltip hover delay from CSS variable
function getTooltipHoverDelay(element) {
    // Try to get the value from the element first, then from document root
    let computedStyle = getComputedStyle(element);
    let delayValue = computedStyle.getPropertyValue('--tooltip-hover-delay').trim();
    
    if (!delayValue) {
        // If not found on element, check document root
        computedStyle = getComputedStyle(document.documentElement);
        delayValue = computedStyle.getPropertyValue('--tooltip-hover-delay').trim();
    }
    
    return delayValue ? parseInt(delayValue) : 500; // Default to 500ms if not set
}

function initializeTooltipPlugin() {

    Alpine.directive('tooltip', (el, { modifiers, expression }, { effect, evaluateLater }) => {

        let getTooltipContent;

        // If it starts with $x, handle content loading
        if (expression.startsWith('$x.')) {
            const path = expression.substring(3); // Remove '$x.'
            const [contentType, ...pathParts] = path.split('.');

            // Create evaluator that uses the $x magic method
            getTooltipContent = evaluateLater(expression);

            // Ensure content is loaded before showing tooltip
            effect(() => {
                const store = Alpine.store('collections');
                if (store && typeof store.loadCollection === 'function' && !store[contentType]) {
                    store.loadCollection(contentType);
                }
            });
        } else {
            // Check if expression contains HTML tags (indicating rich content)
            if (expression.includes('<') && expression.includes('>')) {
                // Treat as literal HTML string - escape any quotes to prevent syntax errors
                const escapedExpression = expression.replace(/'/g, "\\'");
                getTooltipContent = evaluateLater(`'${escapedExpression}'`);
            } else if (expression.includes('+') || expression.includes('`') || expression.includes('${')) {
                // Try to evaluate as a dynamic expression
                getTooltipContent = evaluateLater(expression);
            } else {
                // Use as static string
                getTooltipContent = evaluateLater(`'${expression}'`);
            }
        }

        effect(() => {
            // Generate a unique ID for the tooltip
            const tooltipCode = Math.random().toString(36).substr(2, 9);
            const tooltipId = `tooltip-${tooltipCode}`;

            // Store the original popovertarget if it exists, or check for x-dropdown
            let originalTarget = el.getAttribute('popovertarget');
            
            // If no popovertarget but has x-dropdown, that will become the target
            if (!originalTarget && el.hasAttribute('x-dropdown')) {
                originalTarget = el.getAttribute('x-dropdown');
            }

            // Create the tooltip element
            const tooltip = document.createElement('div');
            tooltip.setAttribute('popover', '');
            tooltip.setAttribute('id', tooltipId);
            tooltip.setAttribute('class', 'tooltip');

            // Store the original anchor name if it exists
            const originalAnchorName = el.style.getPropertyValue('anchor-name');
            const tooltipAnchor = `--tooltip-${tooltipCode}`;

            // Set tooltip content
            getTooltipContent(content => {
                tooltip.innerHTML = content || '';
            });

            // Handle positioning modifiers - preserve exact order and build class names like dropdown CSS
            const validPositions = ['top', 'bottom', 'start', 'end', 'center', 'corner'];
            const positions = modifiers.filter(mod => validPositions.includes(mod));
            
            if (positions.length > 0) {
                // Build class name by joining modifiers with dashes (preserves original order)
                const positionClass = positions.join('-');
                tooltip.classList.add(positionClass);
            }

            // Add the tooltip to the document
            document.body.appendChild(tooltip);

            // State variables for managing tooltip behavior
            let showTimeout;
            let isMouseDown = false;

            el.addEventListener('mouseenter', () => {
                if (!isMouseDown) {
                    const hoverDelay = getTooltipHoverDelay(el);
                    showTimeout = setTimeout(() => {
                        // Check if user is actively interacting with other popovers
                        const hasOpenPopover = originalTarget && document.getElementById(originalTarget)?.matches(':popover-open');
                        
                        if (!isMouseDown && !tooltip.matches(':popover-open') && !hasOpenPopover) {
                            // Only manage anchor-name if element has other popover functionality
                            if (originalTarget) {
                                // Store current anchor name (dropdown may have set it by now)
                                const currentAnchorName = el.style.getPropertyValue('anchor-name');
                                if (currentAnchorName) {
                                    el._originalAnchorName = currentAnchorName;
                                }
                            }
                            
                            el.style.setProperty('anchor-name', tooltipAnchor);
                            tooltip.style.setProperty('position-anchor', tooltipAnchor);

                            // Show tooltip without changing popovertarget
                            tooltip.showPopover();
                        }
                    }, hoverDelay);
                }
            });

            el.addEventListener('mouseleave', () => {
                clearTimeout(showTimeout);
                if (tooltip.matches(':popover-open')) {
                    tooltip.hidePopover();
                    // Only restore anchor name if element has other popover functionality
                    if (originalTarget) {
                        restoreOriginalAnchor();
                    }
                }
            });

            el.addEventListener('mousedown', () => {
                isMouseDown = true;
                clearTimeout(showTimeout);
                if (tooltip.matches(':popover-open')) {
                    tooltip.hidePopover();
                }
                // Only restore anchor name if element has other popover functionality
                if (originalTarget) {
                    restoreOriginalAnchor();
                }
            });

            el.addEventListener('mouseup', () => {
                isMouseDown = false;
            });

            // Handle click events - hide tooltip but delay anchor restoration
            el.addEventListener('click', (e) => {
                clearTimeout(showTimeout);
                
                // Hide tooltip if open
                if (tooltip.matches(':popover-open')) {
                    tooltip.hidePopover();
                }
                
                // Don't restore anchor immediately - let other click handlers run first
                // This allows dropdown plugin to set its own anchor-name
                setTimeout(() => {
                    // Only restore anchor if no popover opened from this click
                    if (originalTarget) {
                        const targetPopover = document.getElementById(originalTarget);
                        const isPopoverOpen = targetPopover?.matches(':popover-open');
                        if (!targetPopover || !isPopoverOpen) {
                            restoreOriginalAnchor();
                        }
                        // If popover is open, keep current anchor (don't restore)
                    } else {
                        restoreOriginalAnchor();
                    }
                }, 100); // Give other plugins time to set their anchors
            });

            // Helper function to restore original anchor
            function restoreOriginalAnchor() {
                if (el._originalAnchorName) {
                    // Restore the original anchor name
                    el.style.setProperty('anchor-name', el._originalAnchorName);
                } else {
                    // Remove the tooltip anchor name so other plugins can set their own
                    el.style.removeProperty('anchor-name');
                }
            }

            // Listen for other popovers opening and close tooltip if needed
            const handlePopoverOpen = (event) => {
                // If another popover opens and it's not our tooltip, close our tooltip
                if (event.target !== tooltip && tooltip.matches(':popover-open')) {
                    tooltip.hidePopover();
                    // Only restore anchor name if element has other popover functionality
                    if (originalTarget) {
                        restoreOriginalAnchor();
                    }
                }
            };

            // Add global listener for popover events (only if not already added)
            if (!el._tooltipPopoverListener) {
                document.addEventListener('toggle', handlePopoverOpen);
                el._tooltipPopoverListener = handlePopoverOpen;
            }

            // Cleanup function for when element is removed
            const cleanup = () => {
                if (el._tooltipPopoverListener) {
                    document.removeEventListener('toggle', el._tooltipPopoverListener);
                    delete el._tooltipPopoverListener;
                }
                if (tooltip && tooltip.parentElement) {
                    tooltip.remove();
                }
            };

            // Store cleanup function for manual cleanup if needed
            el._tooltipCleanup = cleanup;
        });
    });
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeTooltipPlugin()
    })
}

document.addEventListener('alpine:init', initializeTooltipPlugin) 
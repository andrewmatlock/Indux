/* Indux Dropdowns */

// Initialize plugin when either DOM is ready or Alpine is ready
function initializeDropdownPlugin() {
    // Ensure Alpine.js context exists for directives to work
    function ensureAlpineContext() {
        const body = document.body;
        if (!body.hasAttribute('x-data')) {
            body.setAttribute('x-data', '{}');
        }
    }

    // Helper to register directives
    function registerDirective(name, handler) {
        Alpine.directive(name, handler);
    }

    // Check if a menu element is nested (triggered from within another menu)
    const isNestedMenu = (menu) => {
        // Find all buttons/elements that target this menu
        const menuId = menu.id;
        const triggers = document.querySelectorAll(`[popovertarget="${menuId}"], [x-dropdown="${menuId}"], [x-dropdown*="${menuId}"]`);
        
        // Check if any trigger is inside another popover menu
        for (const trigger of triggers) {
            let parent = trigger.parentElement;
            while (parent) {
                if (parent.tagName === 'MENU' && parent.hasAttribute('popover')) {
                    return true;
                }
                parent = parent.parentElement;
            }
        }
        return false;
    };

    // Ensure Alpine.js context exists
    ensureAlpineContext();

    // Register dropdown directive
    registerDirective('dropdown', (el, { modifiers, expression }, { effect, evaluateLater }) => {
        let menu;

        // Shared hover state for all dropdown types
        let hoverTimeout;
        let autoCloseTimeout;
        let startAutoCloseTimer;

        effect(() => {

            // Defer processing to ensure Alpine is fully ready
            setTimeout(() => {
                if (!window.Alpine) {
                    console.warn('[Indux] Alpine not available for dropdown processing');
                    return;
                }

                // Generate a unique anchor code for positioning
                const anchorCode = Math.random().toString(36).substr(2, 9);

                // Evaluate the expression to get the actual menu ID
                let dropdownId;
                if (expression) {
                    // Check if expression contains template literals or is a static string
                    if (expression.includes('${') || expression.includes('`')) {
                        // Use evaluateLater for dynamic expressions
                        const evaluator = evaluateLater(expression);
                        evaluator(value => {
                            dropdownId = value;
                        });
                    } else {
                        // Static string - use as-is
                        dropdownId = expression;
                    }
                } else {
                    dropdownId = `dropdown-${anchorCode}`;
                }

                // Check if expression refers to a template ID
                if (dropdownId && document.getElementById(dropdownId)?.tagName === 'TEMPLATE') {
                    // Clone template content and generate unique ID
                    const template = document.getElementById(dropdownId);
                    menu = template.content.cloneNode(true).firstElementChild;
                    const uniqueDropdownId = `dropdown-${anchorCode}`;
                    menu.setAttribute('id', uniqueDropdownId);
                    document.body.appendChild(menu);
                    el.setAttribute('popovertarget', uniqueDropdownId);

                    // Initialize Alpine on the cloned menu
                    Alpine.initTree(menu);
                } else {
                    // Original behavior for static dropdowns
                    menu = document.getElementById(dropdownId);
                    if (!menu) {
                        // Check if this might be a component-based dropdown
                        if (window.InduxComponentsRegistry && window.InduxComponentsLoader) {
                            // Try to find the menu in components
                            const componentName = dropdownId; // Assume the dropdownId is the component name
                            const registry = window.InduxComponentsRegistry;
                            
                            if (registry.registered.has(componentName)) {
                                // Component exists, wait for it to be loaded
                                const waitForComponent = async () => {
                                    const loader = window.InduxComponentsLoader;
                                    const content = await loader.loadComponent(componentName);
                                    if (content) {
                                        // Create a temporary container to parse the component
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = content.trim();
                                        const menuElement = tempDiv.querySelector(`#${dropdownId}`);
                                        
                                        if (menuElement) {
                                            // Clone the menu and append to body
                                            menu = menuElement.cloneNode(true);
                                            menu.setAttribute('id', dropdownId);
                                            document.body.appendChild(menu);
                                            el.setAttribute('popovertarget', dropdownId);
                                            
                                            // Initialize Alpine on the menu
                                            Alpine.initTree(menu);
                                            
                                            // Set up the dropdown after menu is ready
                                            setupDropdown();
                                        } else {
                                            console.warn(`[Indux] Menu with id "${dropdownId}" not found in component "${componentName}"`);
                                        }
                                    } else {
                                        console.warn(`[Indux] Failed to load component "${componentName}" for dropdown`);
                                    }
                                };
                                
                                // Wait for components to be ready, then try to load
                                if (window.__induxComponentsInitialized) {
                                    waitForComponent();
                                } else {
                                    window.addEventListener('indux:components-ready', waitForComponent);
                                }
                                return; // Exit early, setup will happen in waitForComponent
                            }
                        }
                        
                        console.warn(`[Indux] Dropdown menu with id "${dropdownId}" not found`);
                        return;
                    }
                    el.setAttribute('popovertarget', dropdownId);
                }

                // Set up the dropdown
                setupDropdown();

                function setupDropdown() {
                    if (!menu) return;
                    
                    // Set up popover
                    menu.setAttribute('popover', '');

                    // Set up anchor positioning
                    const anchorName = `--dropdown-${anchorCode}`;
                    el.style.setProperty('anchor-name', anchorName);
                    menu.style.setProperty('position-anchor', anchorName);

                    // Set up hover functionality after menu is ready
                    if (modifiers.includes('hover')) {
                    const handleShowPopover = () => {
                        if (menu && !menu.matches(':popover-open')) {
                            clearTimeout(hoverTimeout);
                            clearTimeout(autoCloseTimeout);
                            
                            menu.showPopover();
                        }
                    };

                    // Enhanced auto-close when mouse leaves both trigger and menu
                    startAutoCloseTimer = () => {
                        clearTimeout(autoCloseTimeout);
                        autoCloseTimeout = setTimeout(() => {
                            if (menu?.matches(':popover-open')) {
                                const isOverButton = el.matches(':hover');
                                const isOverMenu = menu.matches(':hover');
                                
                                if (!isOverButton && !isOverMenu) {
                                    menu.hidePopover();
                                }
                            }
                        }, 300); // Small delay to prevent accidental closes
                    };

                    el.addEventListener('mouseenter', handleShowPopover);
                    el.addEventListener('mouseleave', startAutoCloseTimer);
                }



                // Add keyboard navigation handling
                menu.addEventListener('keydown', (e) => {
                    // Get all navigable elements (traditional focusable + li elements)
                    const allElements = menu.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), li'
                    );
                    const currentIndex = Array.from(allElements).indexOf(e.target);

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextIndex = (currentIndex + 1) % allElements.length;
                        const nextElement = allElements[nextIndex];
                        if (nextElement.tagName === 'LI') {
                            nextElement.setAttribute('tabindex', '0');
                        }
                        nextElement.focus();
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevIndex = (currentIndex - 1 + allElements.length) % allElements.length;
                        const prevElement = allElements[prevIndex];
                        if (prevElement.tagName === 'LI') {
                            prevElement.setAttribute('tabindex', '0');
                        }
                        prevElement.focus();
                    } else if (e.key === 'Tab') {
                        // Get only traditional focusable elements for tab navigation
                        const focusable = menu.querySelectorAll(
                            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                        );

                        // If we're on the last focusable element and tabbing forward
                        if (!e.shiftKey && e.target === focusable[focusable.length - 1]) {
                            e.preventDefault();
                            menu.hidePopover();
                            // Focus the next focusable element after the dropdown trigger
                            const allFocusable = document.querySelectorAll(
                                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                            );
                            const triggerIndex = Array.from(allFocusable).indexOf(el);
                            const nextElement = allFocusable[triggerIndex + 1];
                            if (nextElement) nextElement.focus();
                        }

                        // If we're on the first element and tabbing backward
                        if (e.shiftKey && e.target === focusable[0]) {
                            menu.hidePopover();
                        }
                    } else if (e.key === 'Escape') {
                        menu.hidePopover();
                        el.focus();
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        // Allow Enter/Space to activate li elements or follow links
                        if (e.target.tagName === 'LI') {
                            const link = e.target.querySelector('a');
                            if (link) {
                                e.preventDefault();
                                link.click();
                            }
                        }
                    }
                });

                // Make li elements focusable when menu opens
                menu.addEventListener('toggle', (e) => {
                    if (e.newState === 'open') {
                        // Set up li elements for keyboard navigation
                        const liElements = menu.querySelectorAll('li');
                        liElements.forEach((li, index) => {
                            if (!li.hasAttribute('tabindex')) {
                                li.setAttribute('tabindex', '-1');
                            }
                            // Focus first li element if no other focusable elements
                            if (index === 0 && !menu.querySelector('button, [href], input, select, textarea, [tabindex="0"]')) {
                                li.setAttribute('tabindex', '0');
                                li.focus();
                            }
                        });
                    }
                });

                // Add hover functionality for menu
                if (modifiers.includes('hover')) {
                    // Simple approach: any mouse activity in the menu area cancels close timer
                    menu.addEventListener('mouseenter', () => {
                        clearTimeout(autoCloseTimeout);
                        clearTimeout(hoverTimeout);
                    });

                    menu.addEventListener('mouseleave', () => {
                        // Always start timer when leaving menu bounds
                        if (startAutoCloseTimer) {
                            startAutoCloseTimer();
                        }
                    });

                    // Add event listeners to all interactive elements inside menu to cancel timers
                    const cancelCloseTimer = () => {
                        clearTimeout(autoCloseTimeout);
                    };

                    // Set up listeners on existing menu items
                    const setupMenuItemListeners = () => {
                        const menuItems = menu.querySelectorAll('li, button, a, [role="menuitem"]');
                        menuItems.forEach(item => {
                            item.addEventListener('mouseenter', cancelCloseTimer);
                        });
                    };

                    // Setup listeners after a brief delay to ensure menu is rendered
                    setTimeout(setupMenuItemListeners, 10);
                }
                } // End of setupDropdown function
            });
        });
    });
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            initializeDropdownPlugin();
        } else {
            // Wait for Alpine to be available
            document.addEventListener('alpine:init', initializeDropdownPlugin);
        }
    });
} else {
    // DOM is already loaded
    if (window.Alpine) {
        initializeDropdownPlugin();
    } else {
        // Wait for Alpine to be available
        document.addEventListener('alpine:init', initializeDropdownPlugin);
    }
}

// Also listen for alpine:init as a backup
document.addEventListener('alpine:init', initializeDropdownPlugin);

// Handle modal interactions - close dropdowns when modals open
document.addEventListener('click', (event) => {
    const button = event.target.closest('button[popovertarget]');
    if (!button) return;
    
    const targetId = button.getAttribute('popovertarget');
    const target = document.getElementById(targetId);
    
    if (target && target.tagName === 'DIALOG' && target.hasAttribute('popover')) {
        // Close dropdowns BEFORE the modal opens to avoid conflicts
        const openDropdowns = document.querySelectorAll('menu[popover]:popover-open');
        
        openDropdowns.forEach(dropdown => {
            if (!target.contains(dropdown)) {
                dropdown.hidePopover();
            }
        });
    }
}); 
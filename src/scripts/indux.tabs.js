/* Indux Tabs */

function initializeTabsPlugin() {   
    
    // Track tab data globally
    const tabData = new Map();
    
    // Helper to get tab property name based on panel set
    function getTabPropertyName(panelSet) {
        return panelSet ? `tab_${panelSet}` : 'tab';
    }
    
    // Helper to find panels by ID or class
    function findPanelsByTarget(target, panelSet) {
        const panels = [];
        
        // Check if target is an ID
        const panelById = document.getElementById(target);
        if (panelById && panelById.hasAttribute('x-tabpanel')) {
            const panelSetAttr = panelById.getAttribute('x-tabpanel');
            if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                panels.push(panelById);
            }
        }
        
        // Check if target refers to a template element
        if (target && document.getElementById(target)?.tagName === 'TEMPLATE') {
            const template = document.getElementById(target);
            const clonedPanel = template.content.cloneNode(true).firstElementChild;
            if (clonedPanel && clonedPanel.hasAttribute('x-tabpanel')) {
                const panelSetAttr = clonedPanel.getAttribute('x-tabpanel');
                if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                    // Generate unique ID for the cloned panel
                    const uniqueId = `tabpanel-${Math.random().toString(36).substr(2, 9)}`;
                    clonedPanel.setAttribute('id', uniqueId);
                    document.body.appendChild(clonedPanel);
                    
                    // Initialize Alpine on the cloned panel
                    if (window.Alpine) {
                        Alpine.initTree(clonedPanel);
                    }
                    
                    panels.push(clonedPanel);
                }
            }
        }
        
        // Check if target refers to a component
        if (!panels.length && window.InduxComponentsRegistry && window.InduxComponentsLoader) {
            const componentName = target;
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
                        const panelElement = tempDiv.querySelector(`#${target}[x-tabpanel]`);
                        
                        if (panelElement) {
                            // Clone the panel and append to body
                            const clonedPanel = panelElement.cloneNode(true);
                            clonedPanel.setAttribute('id', target);
                            document.body.appendChild(clonedPanel);
                            
                            // Initialize Alpine on the panel
                            if (window.Alpine) {
                                Alpine.initTree(clonedPanel);
                            }
                            
                            const panelSetAttr = clonedPanel.getAttribute('x-tabpanel');
                            if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                                panels.push(clonedPanel);
                            }
                        }
                    }
                };
                
                // Wait for components to be ready, then try to load
                if (window.__induxComponentsInitialized) {
                    waitForComponent();
                } else {
                    window.addEventListener('indux:components-ready', waitForComponent);
                }
            }
        }
        
        // Check if target is a class - handle numeric class names
        try {
            const panelsByClass = document.querySelectorAll(`.${target}[x-tabpanel]`);
            panelsByClass.forEach(panel => {
                const panelSetAttr = panel.getAttribute('x-tabpanel');
                if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                    panels.push(panel);
                } else {
                }
            });
        } catch (e) {
            // If the selector is invalid (e.g., numeric class), try a different approach
            const allPanels = document.querySelectorAll('[x-tabpanel]');
            allPanels.forEach(panel => {
                if (panel.classList.contains(target)) {
                    const panelSetAttr = panel.getAttribute('x-tabpanel');
                    if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                        panels.push(panel);
                    }
                }
            });
        }
        
        return panels;
    }
    
    // Helper to find the common parent of multiple elements
    function findCommonParent(elements) {
        if (elements.length === 0) return document.body;
        if (elements.length === 1) return elements[0].parentElement || document.body;
        
        // Start with the first element
        let commonParent = elements[0];
        
        // For each subsequent element, find the lowest common ancestor
        for (let i = 1; i < elements.length; i++) {
            commonParent = findLowestCommonAncestor(commonParent, elements[i]);
        }
        
        return commonParent || document.body;
    }
    
    // Helper to find lowest common ancestor of two elements
    function findLowestCommonAncestor(element1, element2) {
        // Get all ancestors of element1
        const ancestors1 = [];
        let current = element1;
        while (current) {
            ancestors1.push(current);
            current = current.parentElement;
        }
        
        // Walk up from element2 until we find a common ancestor
        current = element2;
        while (current) {
            if (ancestors1.includes(current)) {
                return current;
            }
            current = current.parentElement;
        }
        
        return document.body; // Fallback
    }
    
    // Process tabs and panels
    function processTabs() {
        // Prevent multiple executions in rapid succession
        if (window.induxTabsProcessing) {
            return;
        }
        window.induxTabsProcessing = true;
        
        // Reset flag after processing
        setTimeout(() => {
            window.induxTabsProcessing = false;
        }, 200); // Increased timeout to prevent race conditions
        
        // Find all tab-related elements
        const tabButtons = document.querySelectorAll('[x-tab]');
        const panels = document.querySelectorAll('[x-tabpanel]');
        
        
        if (tabButtons.length === 0 && panels.length === 0) {
            window.induxTabsProcessing = false;
            return;
        }
        
        // Group panels by their panel set
        const panelSets = new Map();
        panels.forEach(panel => {
            const panelSet = panel.getAttribute('x-tabpanel') || '';
            if (!panelSets.has(panelSet)) {
                panelSets.set(panelSet, []);
            }
            panelSets.get(panelSet).push(panel);
        });
        
        
        // Process each panel set separately
        panelSets.forEach((panelsInSet, panelSet) => {
            // Find buttons that control panels in this set AND are in the same DOM section
            const buttonsForThisSet = [];
            tabButtons.forEach(button => {
                const tabValue = button.getAttribute('x-tab');
                if (!tabValue) return;
                
                // Check if this button controls any panels in this set
                const targetPanels = findPanelsByTarget(tabValue, panelSet);
                if (targetPanels.length > 0) {
                    // Only include buttons that are in the same "section" as their target panels
                    // by checking if they share a close common ancestor
                    const buttonAndFirstPanel = [button, targetPanels[0]];
                    const commonAncestor = findCommonParent(buttonAndFirstPanel);
                    
                    // Count levels from button to common ancestor
                    let buttonDepth = 0;
                    let current = button;
                    while (current && current !== commonAncestor) {
                        current = current.parentElement;
                        buttonDepth++;
                    }
                    
                    // Only include if button is within 2 levels of the common ancestor
                    // This keeps tab groups properly isolated and prevents cross-contamination
                    if (commonAncestor && commonAncestor !== document.body && buttonDepth <= 2) {
                        buttonsForThisSet.push(button);
                    }
                }
            });
            
            if (buttonsForThisSet.length === 0) {
                return;
            }
            
            // Find the closest common parent of JUST the panels first  
            // This ensures we get the most specific container for this tab group
            const panelCommonParent = findCommonParent(panelsInSet);
            
            // Now filter buttons to only include those actually within this panel container
            const filteredButtons = buttonsForThisSet.filter(button => 
                panelCommonParent.contains(button)
            );
            
            // If no buttons are within the panel container, skip this group
            if (filteredButtons.length === 0) {
                return;
            }
            
            // Use the panel container as our common parent (buttons should be within it)
            const commonParent = panelCommonParent;
            
            // Note: Removed processed attribute check to allow re-processing when components load
            
            // Ensure the common parent has x-data
            if (!commonParent.hasAttribute('x-data')) {
                commonParent.setAttribute('x-data', '{}');
            }
            
            // Create tab data specifically for this panel set only
            const tabProp = getTabPropertyName(panelSet);
            let defaultTabValue = null;
            
            // Process buttons for this set and collect tab data FIRST
            filteredButtons.forEach(button => {
                const tabValue = button.getAttribute('x-tab');
                if (!tabValue) return;
                
                // Set the default value to the first button's value
                if (!defaultTabValue) {
                    defaultTabValue = tabValue;
                }
                
                // Add click handler
                const existingClick = button.getAttribute('x-on:click') || '';
                const newClick = `${tabProp} = '${tabValue}'`;
                
                // Only add if it's not already there to avoid duplication
                let finalClick;
                if (existingClick && existingClick.includes(newClick)) {
                    finalClick = existingClick;
                } else {
                    finalClick = existingClick ? `${existingClick}; ${newClick}` : newClick;
                }
                
                button.setAttribute('x-on:click', finalClick);
            });
            
            // Set up Alpine data property for THIS panel set only
            if (defaultTabValue) {
                const existingXData = commonParent.getAttribute('x-data') || '{}';
                let newXData = existingXData;
                
                // Create the property for this specific panel set
                const tabProperty = `${tabProp}: '${defaultTabValue}'`;
                
                // Parse existing x-data
                if (existingXData === '{}') {
                    // Empty x-data, create new one with this tab property
                    newXData = `{ ${tabProperty} }`;
                } else {
                    // Existing x-data, append this tab property
                    // Insert before the closing brace
                    const lastBraceIndex = existingXData.lastIndexOf('}');
                    if (lastBraceIndex > 0) {
                        const beforeBrace = existingXData.substring(0, lastBraceIndex);
                        const afterBrace = existingXData.substring(lastBraceIndex);
                        const separator = beforeBrace.trim().endsWith(',') ? '' : ', ';
                        newXData = beforeBrace + separator + tabProperty + afterBrace;
                    }
                }
                
                // Update the x-data attribute
                commonParent.setAttribute('x-data', newXData);
                
                // Force Alpine to re-initialize if it's already initialized
                if (window.Alpine && commonParent._x_dataStack) {
                    delete commonParent._x_dataStack;
                    window.Alpine.initTree(commonParent);
                }
            }
            
            // NOW process panels and add x-show directives (after Alpine data is set up)
            panelsInSet.forEach(panel => {
                const tabProp = getTabPropertyName(panelSet);
                
                // Add x-show directive only if it doesn't already exist
                const panelId = panel.id || panel.className.split(' ')[0];
                if (panelId && !panel.hasAttribute('x-show')) {
                    const xShowValue = `${tabProp} === '${panelId}'`;
                    panel.setAttribute('x-show', xShowValue);
                }
            });
        });
    }
    
    // Register Alpine directives
    if (window.Alpine) {
        Alpine.plugin(() => {
            // Register x-tab directive
            Alpine.directive('tab', (el, { value }, { effect }) => {
                // This will be processed by our main logic
                effect(() => {
                    processTabs();
                });
            });
            
            // Register x-tabpanel directive
            Alpine.directive('tabpanel', (el, { value }, { effect }) => {
                // This will be processed by our main logic
                effect(() => {
                    processTabs();
                });
            });
        });
    } else {
        document.addEventListener('alpine:init', () => {
            Alpine.plugin(() => {
                // Register x-tab directive
                Alpine.directive('tab', (el, { value }, { effect }) => {
                    // This will be processed by our main logic
                    effect(() => {
                        processTabs();
                    });
                });
                
                // Register x-tabpanel directive
                Alpine.directive('tabpanel', (el, { value }, { effect }) => {
                    // This will be processed by our main logic
                    effect(() => {
                        processTabs();
                    });
                });
            });
        });
    }
    
    // Process tabs when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processTabs);
    } else {
        processTabs();
    }
    
    // Also process when Alpine is ready
    document.addEventListener('alpine:initialized', processTabs);
    
    // Process tabs when components are loaded/updated
    document.addEventListener('indux:components-ready', processTabs);
    document.addEventListener('indux:components-processed', processTabs);
    
    // Fallback polling for edge cases (reduced frequency)
    let pollCount = 0;
    const maxPolls = 10; // 2 seconds at 200ms intervals
    const pollInterval = setInterval(() => {
        pollCount++;
        if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            return;
        }
        
        // Only check if there are unprocessed panels
        const currentPanels = document.querySelectorAll('[x-tabpanel]');
        if (currentPanels && currentPanels.length > 0) {
            const unprocessedPanels = Array.from(currentPanels).filter(panel => !panel.hasAttribute('x-show'));
            
            if (unprocessedPanels.length > 0) {
                processTabs();
            }
        }
    }, 200);
}

// Initialize the plugin
initializeTabsPlugin();

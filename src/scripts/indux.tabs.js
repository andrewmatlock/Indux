/* Indux Tabs */

// Simple tabs plugin that acts as a proxy for Alpine's native functionality
function initializeTabsPlugin() {
    // Process all tab elements
    function processTabs() {
        // Find all x-tab elements
        const tabButtons = document.querySelectorAll('[x-tab]');
        const tabPanels = document.querySelectorAll('[x-tabpanel]');
        
        if (tabButtons.length === 0 && tabPanels.length === 0) {
            return;
        }
        
        // Group panels by their x-tabpanel value
        const panelGroups = {};
        tabPanels.forEach(panel => {
            const panelSet = panel.getAttribute('x-tabpanel') || '';
            const panelId = panel.id || panel.className.split(' ')[0];
            if (panelId) {
                if (!panelGroups[panelSet]) panelGroups[panelSet] = [];
                panelGroups[panelSet].push({ element: panel, id: panelId });
            }
        });
        
        // Process each panel group
        Object.entries(panelGroups).forEach(([panelSet, panels]) => {
            const tabProp = panelSet ? `tab_${panelSet}` : 'tab';
            
            // Find the common parent (body or closest x-data element)
            let commonParent = document.body;
            if (panels.length > 0) {
                commonParent = panels[0].element.closest('[x-data]') || document.body;
            }
            
            // Ensure x-data exists
            if (!commonParent.hasAttribute('x-data')) {
                commonParent.setAttribute('x-data', '{}');
            }
            
            // Set up x-data with default value
            const existingXData = commonParent.getAttribute('x-data') || '{}';
            let newXData = existingXData;
            
            // Check if the tab property already exists
            const propertyRegex = new RegExp(`${tabProp}\\s*:\\s*'[^']*'`, 'g');
            if (!propertyRegex.test(newXData)) {
                // Add the tab property with default value (first panel's id)
                const defaultValue = panels.length > 0 ? panels[0].id : 'a';
                const tabProperty = `${tabProp}: '${defaultValue}'`;
                
                if (newXData === '{}') {
                    newXData = `{ ${tabProperty} }`;
                } else {
                    const lastBraceIndex = newXData.lastIndexOf('}');
                    if (lastBraceIndex > 0) {
                        const beforeBrace = newXData.substring(0, lastBraceIndex);
                        const afterBrace = newXData.substring(lastBraceIndex);
                        const separator = beforeBrace.trim().endsWith(',') ? '' : ', ';
                        newXData = beforeBrace + separator + tabProperty + afterBrace;
                    }
                }
                
                if (newXData !== existingXData) {
                    commonParent.setAttribute('x-data', newXData);
                }
            }
            
            // Process panels for this group - add x-show attributes FIRST
            panels.forEach(panel => {
                const showCondition = `${tabProp} === '${panel.id}'`;
                panel.element.setAttribute('x-show', showCondition);
                
                // Remove x-tabpanel attribute since we've converted it
                panel.element.removeAttribute('x-tabpanel');
            });
            
            // Process tab buttons for this panel set
            tabButtons.forEach(button => {
                const tabValue = button.getAttribute('x-tab');
                if (!tabValue) return;
                
                // Check if this button targets panels in this group
                const targetsThisGroup = panels.some(panel => panel.id === tabValue);
                if (!targetsThisGroup) return;
                
                // Set up click handler
                const clickHandler = `${tabProp} = '${tabValue}'`;
                button.setAttribute('x-on:click', clickHandler);
                
                // Remove x-tab attribute since we've converted it
                button.removeAttribute('x-tab');
            });
        });
    }
    
    // Wait for components to be ready first
    document.addEventListener('indux:components-ready', () => {
        setTimeout(processTabs, 100); // Small delay to ensure DOM is settled
    });
    
    // Also listen for components-processed event
    document.addEventListener('indux:components-processed', () => {
        setTimeout(processTabs, 100);
    });
    
    // Also run on DOMContentLoaded as a fallback for non-component pages
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(processTabs, 100);
    });
    
    // Add a fallback timer to catch cases where events don't fire
    setTimeout(() => {
        processTabs();
    }, 2000);
}

// Initialize the plugin
initializeTabsPlugin();

/*! Indux Markdown 1.0.0 - MIT License */
const marked = self.marked;

// Initialize plugin when either DOM is ready or Alpine is ready
function initializeMarkdownPlugin() {
    // Register markdown directive
    Alpine.directive('markdown', (el, { expression }, { effect, evaluateLater }) => {
        // Store original markdown content
        let markdownSource = '';
        let isUpdating = false;

        const normalizeContent = (content) => {
            const lines = content.split('\n');
            const commonIndent = lines
                .filter(line => line.trim())
                .reduce((min, line) => {
                    const indent = line.match(/^\s*/)[0].length;
                    return Math.min(min, indent);
                }, Infinity);

            return lines
                .map(line => line.slice(commonIndent))
                .join('\n')
                .trim();
        };

        const updateContent = async (element, newContent = null) => {
            if (isUpdating) return;
            isUpdating = true;

            try {
                // Update source if new content provided
                if (newContent !== null && newContent.trim() !== '') {
                    markdownSource = normalizeContent(newContent);
                }

                const html = marked.parse(markdownSource);

                // Only update if content has changed and isn't empty
                if (element.innerHTML !== html && html.trim() !== '') {
                    // Create a temporary container to hold the HTML
                    const temp = document.createElement('div');
                    temp.innerHTML = html;

                    // Replace the content
                    element.innerHTML = '';
                    while (temp.firstChild) {
                        element.appendChild(temp.firstChild);
                    }
                }
            } finally {
                isUpdating = false;
            }
        };

        // Handle inline markdown content (no expression or 'inline')
        if (!expression || expression === 'inline') {
            // Initial parse
            markdownSource = normalizeContent(el.textContent);
            updateContent(el);

            // Set up mutation observer for streaming content
            const observer = new MutationObserver((mutations) => {
                let newContent = null;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        const textNodes = Array.from(el.childNodes)
                            .filter(node => node.nodeType === Node.TEXT_NODE);
                        if (textNodes.length > 0) {
                            newContent = textNodes.map(node => node.textContent).join('');
                            break;
                        }
                    } else if (mutation.type === 'characterData') {
                        newContent = mutation.target.textContent;
                        break;
                    }
                }

                if (newContent && newContent.trim() !== '') {
                    updateContent(el, newContent);
                }
            });

            observer.observe(el, {
                characterData: true,
                childList: true,
                subtree: true,
                characterDataOldValue: true
            });

            return;
        }

        // Handle expressions (file paths, inline strings, content references)
        const getMarkdownContent = evaluateLater(expression);

        effect(() => {
            getMarkdownContent(async (pathOrContent) => {
                if (pathOrContent === undefined) {
                    pathOrContent = expression;
                }
                const html = marked.parse(pathOrContent);
                el.innerHTML = html;
            });
        });
    });
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) initializeMarkdownPlugin();
    });
}

document.addEventListener('alpine:init', initializeMarkdownPlugin); 
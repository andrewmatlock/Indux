
/*! Indux Markdown 1.0.0 - MIT License */
const marked = self.marked;

// Configure marked to preserve full language strings
marked.use({
    renderer: {
        code(token) {
            const lang = token.lang || '';
            const text = token.text || '';
            const escaped = token.escaped || false;
            
            // Store the full language string in a data attribute
            const dataLang = lang ? ` data-language="${lang}"` : '';
            const className = lang ? ` class="language-${lang.split(' ')[0]}"` : '';
            
            const code = escaped ? text : text.replace(/[&<>"']/g, (match) => {
                const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
                return escapeMap[match];
            });
            
            return `<pre${dataLang}><code${className}>${code}</code></pre>\n`;
        }
    }
});

// Check if the code plugin is available
function isCodePluginAvailable() {
    return typeof window.XCodeElement !== 'undefined' || 
           document.querySelector('script[src*="indux.code.js"]') !== null;
}

// Convert markdown code blocks to x-code elements
function convertCodeBlocks(element) {
    if (!isCodePluginAvailable()) {
        return; // Code plugin not available, use default rendering
    }

    const codeBlocks = element.querySelectorAll('pre code');

    
    // Define valid languages array
    const validLanguages = ['javascript', 'js', 'typescript', 'ts', 'html', 'css', 'python', 'py', 'java', 'c', 'cpp', 'csharp', 'cs', 'php', 'ruby', 'rb', 'go', 'rust', 'rs', 'swift', 'kotlin', 'kt', 'scala', 'sql', 'json', 'yaml', 'yml', 'xml', 'markdown', 'md', 'bash', 'sh', 'powershell', 'ps', 'dockerfile', 'docker', 'nginx', 'apache', 'git', 'diff', 'text', 'plaintext'];
    
    // Define callout types that should be converted to aside elements
    const calloutTypes = ['preview', 'note', 'warning', 'info', 'tip', 'success', 'error', 'danger'];
    
    codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentElement;
        let language = codeBlock.className?.replace('language-', '') || '';
        const code = codeBlock.textContent;
        
        // Check if this is a callout block (starts with a callout type)
        const languageParts = language.split(/\s+/);
        const firstPart = languageParts[0]?.toLowerCase();
        
        if (calloutTypes.includes(firstPart)) {
            // This is a callout block - convert to aside element
            const calloutType = firstPart;
            
            // Create aside element
            const aside = document.createElement('aside');
            aside.className = calloutType;
            
            // Set the content as HTML to render actual elements
            aside.innerHTML = code;
            
            // Replace the pre element with aside
            pre.parentNode.replaceChild(aside, pre);
            return; // Skip the rest of the processing
        }
        
        // Parse Mintlify-style meta options from language
        let title = '';
        let lineNumbers = false;
        
        if (language) {
            // Split by spaces to handle multiple options
            const parts = language.split(/\s+/);
            const parsedLanguage = parts[0];
            
            // Check if first part is a valid language
            if (validLanguages.includes(parsedLanguage.toLowerCase())) {
                language = parsedLanguage;
                
                // Parse remaining parts for options
                for (let i = 1; i < parts.length; i++) {
                    const part = parts[i].toLowerCase();
                    
                    // Check for line numbers
                    if (part === 'numbers' || part === 'lines') {
                        lineNumbers = true;
                    }
                    // Check for title (anything that's not a known option)
                    else if (!['numbers', 'lines', 'expandable', 'wrap', 'focus', 'highlight'].includes(part)) {
                        title = parts[i]; // Use original case for title
                    }
                }
            } else {
                // If first part isn't a language, treat it as a title
                title = parts[0];
                language = 'text'; // Default to text
                
                // Check remaining parts for options
                for (let i = 1; i < parts.length; i++) {
                    const part = parts[i].toLowerCase();
                    if (part === 'numbers' || part === 'lines') {
                        lineNumbers = true;
                    }
                }
            }
        }
        
        // Also check if the pre element has any data attributes that might contain the original language
        const preLanguage = pre.getAttribute('data-language') || pre.getAttribute('lang');
        if (preLanguage && preLanguage !== language) {
            // Parse the pre language as well
            const preParts = preLanguage.split(/\s+/);
            if (preParts.length > 1) {
                // Use the pre language if it has more parts
                const preParsedLanguage = preParts[0];
                if (validLanguages.includes(preParsedLanguage.toLowerCase())) {
                    language = preParsedLanguage;
                    
                    // Parse remaining parts for options
                    for (let i = 1; i < preParts.length; i++) {
                        const part = preParts[i].toLowerCase();
                        
                        // Check for line numbers
                        if (part === 'numbers' || part === 'lines') {
                            lineNumbers = true;
                        }
                        // Check for title (anything that's not a known option)
                        else if (!['numbers', 'lines', 'expandable', 'wrap', 'focus', 'highlight'].includes(part)) {
                            title = preParts[i]; // Use original case for title
                        }
                    }
                }
            }
        }
        
        // Create x-code element
        const xCode = document.createElement('x-code');
        if (language && language !== 'text') {
            xCode.setAttribute('language', language);
        }
        
        // Add title if present
        if (title) {
            xCode.setAttribute('name', title);
        }
        
        // Add line numbers if specified
        if (lineNumbers) {
            xCode.setAttribute('numbers', '');
        }
        
        // Set the code content
        let cleanCode = code;
        if (title) {
            // Remove the title from the beginning of the code if it appears there
            const titlePattern = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n?`, 'i');
            cleanCode = code.replace(titlePattern, '').trim();
        }
        xCode.textContent = cleanCode;
        
        // Replace the pre element with x-code
        pre.parentNode.replaceChild(xCode, pre);
    });
}

// Initialize plugin when either DOM is ready or Alpine is ready
function initializeMarkdownPlugin() {
    // Configure marked to generate heading IDs
    marked.use({
        renderer: {
            heading(token) {
                // Extract text and level from the token
                const text = token.text || '';
                const level = token.depth || 1;
                const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
                return `<h${level} id="${escapedText}">${text}</h${level}>`;
            }
        }
    });

    // Register markdown directive
    Alpine.directive('markdown', (el, { expression, modifiers }, { effect, evaluateLater }) => {
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

                    // Convert code blocks to x-code if plugin is available
                    convertCodeBlocks(temp);

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

                // Check if this looks like a file path (contains .md, .markdown, or starts with /)
                const isFilePath = typeof pathOrContent === 'string' &&
                    (pathOrContent.includes('.md') ||
                        pathOrContent.includes('.markdown') ||
                        pathOrContent.startsWith('/') ||
                        pathOrContent.includes('/'));

                let markdownContent = pathOrContent;

                // If it's a file path, fetch the content
                if (isFilePath) {
                    try {
                        const response = await fetch(pathOrContent);
                        if (response.ok) {
                            markdownContent = await response.text();
                        } else {
                            console.warn(`[Indux] Failed to fetch markdown file: ${pathOrContent}`);
                            markdownContent = `# Error Loading Content\n\nCould not load: ${pathOrContent}`;
                        }
                    } catch (error) {
                        console.error(`[Indux] Error fetching markdown file: ${pathOrContent}`, error);
                        markdownContent = `# Error Loading Content\n\nCould not load: ${pathOrContent}\n\nError: ${error.message}`;
                    }
                }

                const html = marked.parse(markdownContent);
                
                // Create temporary container and convert code blocks
                const temp = document.createElement('div');
                temp.innerHTML = html;
                convertCodeBlocks(temp);
                
                el.innerHTML = '';
                while (temp.firstChild) {
                    el.appendChild(temp.firstChild);
                }

                // Extract headings for anchor links
                const headings = [];
                const headingElements = el.querySelectorAll('h1, h2, h3');
                headingElements.forEach(heading => {
                    headings.push({
                        id: heading.id,
                        text: heading.textContent,
                        level: parseInt(heading.tagName.charAt(1))
                    });
                });

                // Store headings in Alpine data if 'headings' modifier is used
                if (modifiers.includes('headings')) {
                    // Generate a unique ID for this markdown section
                    const sectionId = 'markdown-' + Math.random().toString(36).substr(2, 9);
                    el.setAttribute('data-headings-section', sectionId);

                    // Store headings in a global registry
                    if (!window._induxHeadings) {
                        window._induxHeadings = {};
                    }
                    window._induxHeadings[sectionId] = headings;
                }
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
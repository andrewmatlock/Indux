/*! Indux Markdown 1.0.0 - MIT License */

// Cache for marked.js loading
let markedPromise = null;

// Load marked.js from CDN
async function loadMarkedJS() {
    if (typeof marked !== 'undefined') {
        return marked;
    }
    
    // Return existing promise if already loading
    if (markedPromise) {
        return markedPromise;
    }
    
    markedPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => {
            // Initialize marked.js
            if (typeof marked !== 'undefined') {
                resolve(marked);
            } else {
                console.error('[Indux Markdown] Marked.js failed to load - marked is undefined');
                markedPromise = null; // Reset so we can try again
                reject(new Error('marked.js failed to load'));
            }
        };
        script.onerror = (error) => {
            console.error('[Indux Markdown] Script failed to load:', error);
            markedPromise = null; // Reset so we can try again
            reject(error);
        };
        document.head.appendChild(script);
    });
    
    return markedPromise;
}

// Configure marked to preserve full language strings
async function configureMarked(marked) {
    marked.use({
        renderer: {
            code(token) {
                const lang = token.lang || '';
                const text = token.text || '';
                const escaped = token.escaped || false;
                
                // Parse the language string to extract attributes
                const attributes = parseLanguageString(lang);
                
                // Build attributes for the x-code element
                let xCodeAttributes = '';
                if (attributes.title) {
                    xCodeAttributes += ` name="${attributes.title}"`;
                }
                if (attributes.language) {
                    xCodeAttributes += ` language="${attributes.language}"`;
                }
                if (attributes.numbers) {
                    xCodeAttributes += ' numbers';
                }
                if (attributes.copy) {
                    xCodeAttributes += ' copy';
                }
                
                // For x-code elements, use the raw text to preserve formatting
                let code = text;
                let preserveOriginal = '';
                
                // For HTML language code blocks, preserve the original raw text to maintain indentation
                if (attributes.language === 'html' || text.includes('<!DOCTYPE') || (text.includes('<html') && text.includes('<head') && text.includes('<body'))) {
                    // Store the original content in a data attribute to preserve indentation
                    preserveOriginal = ` data-original-content="${text.replace(/"/g, '&quot;')}"`;
                }
                
                // Always create an x-code element, with or without attributes
                return `<x-code${xCodeAttributes}${preserveOriginal}>${code}</x-code>\n`;
            }
        },
        // Configure marked to allow custom HTML tags
        breaks: true,
        gfm: true
    });

    // Add custom tokenizer for callout blocks
    marked.use({
        extensions: [{
            name: 'callout',
            level: 'block',
            start(src) {
                return src.match(/^:::/)?.index;
            },
            tokenizer(src) {
                // Find the opening ::: and type
                const openMatch = src.match(/^:::(.*?)(?:\n|$)/);
                if (!openMatch) return;
                
                // Parse the opening line for classes and icon
                const openingLine = openMatch[1].trim();
                let classes = '';
                let iconValue = '';
                
                // Match icon="value" pattern
                const iconMatch = openingLine.match(/icon="([^"]+)"/);
                if (iconMatch) {
                    iconValue = iconMatch[1];
                }
                
                // Get all class names (remove icon attribute first)
                classes = openingLine.replace(/\s*icon="[^"]+"\s*/, '').trim();
                
                const startPos = openMatch[0].length;
                
                // Find the closing ::: from the remaining content
                const remainingContent = src.slice(startPos);
                const closeMatch = remainingContent.match(/\n:::/);
                
                if (closeMatch) {
                    const content = remainingContent.slice(0, closeMatch.index);
                    const raw = openMatch[0] + content + closeMatch[0];
                    
                    return {
                        type: 'callout',
                        raw: raw,
                        classes: classes,
                        iconValue: iconValue,
                        text: content.trim()
                    };
                }
            },
            renderer(token) {
                const classes = token.classes || '';
                const iconValue = token.iconValue || '';
                
                // For frame callouts, don't parse as markdown to avoid wrapping HTML in <p> tags
                let parsedContent;
                if (classes.includes('frame')) {
                    // Use raw content for frame callouts to preserve HTML structure
                    parsedContent = token.text;
                } else {
                    // Parse the content as markdown to support nested markdown syntax
                    parsedContent = marked.parse(token.text);
                }
                
                const iconHtml = iconValue ? `<span x-icon="${iconValue}"></span>` : '';
                
                // Create a temporary div to count top-level elements
                const temp = document.createElement('div');
                temp.innerHTML = parsedContent;
                const elementCount = temp.children.length;
                
                // Only wrap in a div if:
                // 1. There are 2 or more elements AND
                // 2. There's an icon (which needs the content to be wrapped as a sibling)
                const needsWrapper = elementCount >= 2 && iconValue;
                const wrappedContent = needsWrapper ? 
                    `<div>${parsedContent}</div>` : 
                    parsedContent;
                
                return `<aside${classes ? ` class="${classes}"` : ''}>${iconHtml}${wrappedContent}</aside>\n`;
            }
        }]
    });

    // Configure marked to preserve custom HTML tags
    marked.setOptions({
        headerIds: false,
        mangle: false
    });
}

// Custom renderer for x-code-group to handle line breaks properly
function renderXCodeGroup(markdown) {
    // Find x-code-group blocks and process them specially
    const xCodeGroupRegex = /<x-code-group[^>]*>([\s\S]*?)<\/x-code-group>/g;
    
    return markdown.replace(xCodeGroupRegex, (match, content) => {
        // Ensure there's a line break after the opening tag if there isn't one
        const processedContent = content.replace(/^(?!\s*\n)/, '\n');
        
        return `<x-code-group>${processedContent}</x-code-group>`;
    });
}

// Check if highlight.js is available
function isHighlightJsAvailable() {
    return typeof window.hljs !== 'undefined';
}





// Parse language string to extract title and attributes
function parseLanguageString(languageString) {
    if (!languageString || languageString.trim() === '') {
        return { title: null, language: null, numbers: false, copy: false };
    }
    
    const parts = languageString.split(/\s+/);
    
    const attributes = {
        title: null,
        language: null,
        numbers: false,
        copy: false
    };
    
    let i = 0;
    while (i < parts.length) {
        const part = parts[i];
        
        // Check for attributes
        if (part === 'numbers') {
            attributes.numbers = true;
            i++;
            continue;
        }
        
        if (part === 'copy') {
            attributes.copy = true;
            i++;
            continue;
        }
        
        // Check for quoted names (e.g., "Example")
        if (part.startsWith('"') && part.endsWith('"')) {
            // Single word quoted name
            attributes.title = part.slice(1, -1);
            i++;
            continue;
        } else if (part.startsWith('"')) {
            // Multi-word quoted name
            let fullName = part.slice(1);
            i++;
            while (i < parts.length) {
                const nextPart = parts[i];
                if (nextPart.endsWith('"')) {
                    fullName += ' ' + nextPart.slice(0, -1);
                    attributes.title = fullName;
                    i++;
                    break;
                } else {
                    fullName += ' ' + nextPart;
                    i++;
                }
            }
            continue;
        }
        
        // Store language identifiers (e.g., "css", "javascript", etc.)
        // Use the first language identifier found
        if (!attributes.language) {
            attributes.language = part;
        }
        i++;
    }
    
    return attributes;
}

// Preload marked.js as soon as script loads
loadMarkedJS().catch(() => {
    // Silently ignore errors during preload
});

// Initialize plugin when either DOM is ready or Alpine is ready
async function initializeMarkdownPlugin() {
    try {
        // Load marked.js
        const marked = await loadMarkedJS();
        
        // Configure marked with all our custom settings
        await configureMarked(marked);
        
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
    
    // Check if there are any elements with x-markdown already on the page
    const existingMarkdownElements = document.querySelectorAll('[x-markdown]');
    
    // Register markdown directive
    Alpine.directive('markdown', (el, { expression, modifiers }, { effect, evaluateLater }) => {
        
        // Handle null/undefined expressions gracefully
        if (!expression) {
            return;
        }
        
        // Hide element initially to prevent flicker
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.15s ease-in-out';
        
        // Store original markdown content
        let markdownSource = '';
        let isUpdating = false;
        let hasContent = false;

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

                // Skip if no content
                if (!markdownSource || markdownSource.trim() === '') {
                    element.style.opacity = '0';
                    return;
                }

                // Load marked.js and parse markdown
                const marked = await loadMarkedJS();
                const processedMarkdown = renderXCodeGroup(markdownSource);
                const html = marked.parse(processedMarkdown);

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
                    
                    // Show element with content
                    hasContent = true;
                    element.style.opacity = '1';
                } else if (!hasContent) {
                    // Keep hidden if no valid content
                    element.style.opacity = '0';
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
                // Reset visibility if content is empty/undefined
                if (!pathOrContent || pathOrContent === undefined || pathOrContent === '') {
                    el.style.opacity = '0';
                    hasContent = false;
                    return;
                }

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

                // Skip empty content
                if (!markdownContent || markdownContent.trim() === '') {
                    el.style.opacity = '0';
                    hasContent = false;
                    return;
                }

                const marked = await loadMarkedJS();
                const html = marked.parse(markdownContent);
                
                // Create temporary container
                const temp = document.createElement('div');
                temp.innerHTML = html;
                
                el.innerHTML = '';
                while (temp.firstChild) {
                    el.appendChild(temp.firstChild);
                }
                
                // Code highlighting is handled by indux.code.js plugin

                // Show content with fade-in
                hasContent = true;
                el.style.opacity = '1';

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
    
    // If there are existing elements with x-markdown, manually process them with proper Alpine context
    if (existingMarkdownElements.length > 0) {
        
        existingMarkdownElements.forEach(el => {
            const expression = el.getAttribute('x-markdown');
            
            // Create a temporary Alpine component context for this element
            const tempComponent = Alpine.$data(el) || {};
            
            // Use Alpine's evaluation system within the component context
            const updateContent = async (element, newContent = null) => {
                try {
                    if (!newContent) {
                        return;
                    }
                    
                    // Load marked.js and parse markdown
                    const marked = await loadMarkedJS();
                    const processedMarkdown = renderXCodeGroup(newContent);
                    const html = marked.parse(processedMarkdown);
                    
                    // Create temporary container
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    
                    element.innerHTML = '';
                    while (temp.firstChild) {
                        element.appendChild(temp.firstChild);
                    }
                    
                    // Re-highlight code blocks after content update
                    // Code highlighting is handled by indux.code.js plugin
                } catch (error) {
                    console.error('[Indux Markdown] Failed to process element:', error);
                }
            };
            
            // Handle simple string expressions
            if (expression.startsWith("'") && expression.endsWith("'")) {
                const content = expression.slice(1, -1);
                updateContent(el, content);
            } else {
                // For complex expressions, we need to force Alpine to re-process this element
                
                // Remove and re-add the attribute to force Alpine to re-process it
                const originalExpression = expression;
                el.removeAttribute('x-markdown');
                
                // Use a small delay to ensure the directive is registered
                setTimeout(() => {
                    el.setAttribute('x-markdown', originalExpression);
                }, 50);
            }
        });
    }
    
    } catch (error) {
        console.error('[Indux] Failed to initialize markdown plugin:', error);
    }
}

// Handle both DOMContentLoaded and alpine:init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            initializeMarkdownPlugin();
        } else {
        }
    });
}

document.addEventListener('alpine:init', () => {
    initializeMarkdownPlugin();
}); 
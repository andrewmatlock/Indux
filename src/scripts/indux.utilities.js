/* Indux Utilities */

// Browser runtime compiler
class TailwindCompiler {
    constructor(options = {}) {

        // Create style element immediately
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'utility-styles';
        document.head.appendChild(this.styleElement);

        // Initialize properties
        this.tailwindLink = null;
        this.observer = null;
        this.isCompiling = false;
        this.compileTimeout = null;
        this.cache = new Map();
        this.lastThemeHash = null;
        this.processedElements = new WeakSet();
        this.activeBreakpoints = new Set();
        this.activeModifiers = new Set();
        this.cssFiles = new Set();
        this.pendingStyles = new Map();
        this.currentThemeVars = new Map();
        this.hasInitialized = false;
        this.lastCompileTime = 0;
        this.minCompileInterval = 100; // Minimum time between compilations in ms
        this.cssContentCache = new Map(); // Cache CSS file contents with timestamps
        this.lastClassesHash = ''; // Track changes in used classes
        this.staticClassCache = new Set(); // Cache classes found in static HTML/components
        this.dynamicClassCache = new Set(); // Cache classes that appear dynamically
        this.hasScannedStatic = false; // Track if we've done initial static scan
        this.staticScanPromise = null; // Promise for initial static scan
        this.ignoredClassPatterns = [ // Patterns for classes to ignore
            /^hljs/, /^language-/, /^copy$/, /^copied$/, /^lines$/, /^selected$/
        ];
        this.ignoredElementSelectors = [ // Elements to ignore for DOM mutations
            'pre', 'code', 'x-code', 'x-code-group'
        ];
        this.ignoredAttributes = [ // Attribute changes to ignore (non-visual/utility changes)
            'id', 'data-order', 'data-component-id', 'data-highlighted', 'data-processed',
            'x-intersect', 'x-intersect:leave', 'x-show', 'x-hide', 'x-transition',
            'aria-expanded', 'aria-selected', 'aria-current', 'aria-hidden', 'aria-label',
            'tabindex', 'role', 'title', 'alt', 'data-state', 'data-value'
        ];
        this.significantChangeSelectors = [ // Only these DOM additions trigger recompilation
            '[data-component]', '[x-data]' // Components and Alpine elements
        ];
        this.options = {
            rootSelector: options.rootSelector || ':root',
            themeSelector: options.themeSelector || '@theme',
            debounceTime: options.debounceTime || 50,
            maxCacheAge: options.maxCacheAge || 24 * 60 * 60 * 1000,
            debug: options.debug || true,
            ...options
        };

        // Pre-compile regex patterns
        this.regexPatterns = {
            root: new RegExp(`${this.options.rootSelector}\\s*{([^}]*)}`, 'g'),
            theme: new RegExp(`${this.options.themeSelector}\\s*{([^}]*)}`, 'g'),
            variable: /--([\w-]+):\s*([^;]+);/g,
            tailwindPrefix: /^(color|font|text|font-weight|tracking|leading|breakpoint|container|spacing|radius|shadow|inset-shadow|drop-shadow|blur|perspective|aspect|ease|animate|border-width|border-style|outline|outline-width|outline-style|ring|ring-offset|divide|accent|caret|decoration|placeholder|selection|scrollbar)-/
        };

        // Pre-define pseudo classes
        this.pseudoClasses = ['hover', 'focus', 'active', 'disabled', 'dark'];

        // Cache for discovered custom utility classes
        this.customUtilities = new Map();

        // Pre-define utility generators
        this.utilityGenerators = {
            'color-': (suffix, value) => {
                const utilities = [];

                // Helper function to generate utility with optional opacity
                const addUtility = (prefix, property, baseValue) => {
                    // Base utility without opacity
                    utilities.push([`${prefix}-${suffix}`, `${property}: ${baseValue}`]);
                };

                addUtility('text', 'color', value);
                addUtility('bg', 'background-color', value);
                addUtility('border', 'border-color', value);
                addUtility('outline', 'outline-color', value);
                addUtility('ring', 'box-shadow', `0 0 0 1px ${value}`);
                addUtility('fill', 'fill', value);
                addUtility('stroke', 'stroke', value);

                return utilities;
            },
            'font-': (suffix, value) => [
                [`font-${suffix}`, `font-family: ${value}`]
            ],
            'text-': (suffix, value) => [
                [`text-${suffix}`, `font-size: ${value}`]
            ],
            'font-weight-': (suffix, value) => [
                [`font-${suffix}`, `font-weight: ${value}`]
            ],
            'tracking-': (suffix, value) => [
                [`tracking-${suffix}`, `letter-spacing: ${value}`]
            ],
            'leading-': (suffix, value) => [
                [`leading-${suffix}`, `line-height: ${value}`]
            ],
            'breakpoint-': (suffix, value) => [
                [`@${suffix}`, `@media (min-width: ${value})`]
            ],
            'container-': (suffix, value) => [
                [`container-${suffix}`, `max-width: ${value}`],
                [`@container-${suffix}`, `@container (min-width: ${value})`]
            ],
            'spacing-': (suffix, value) => [
                [`gap-${suffix}`, `gap: ${value}`],
                [`p-${suffix}`, `padding: ${value}`],
                [`px-${suffix}`, `padding-left: ${value}; padding-right: ${value}`],
                [`py-${suffix}`, `padding-top: ${value}; padding-bottom: ${value}`],
                [`m-${suffix}`, `margin: ${value}`],
                [`mx-${suffix}`, `margin-left: ${value}; margin-right: ${value}`],
                [`my-${suffix}`, `margin-top: ${value}; margin-bottom: ${value}`],
                [`space-x-${suffix}`, `> * + * { margin-left: ${value}; }`],
                [`space-y-${suffix}`, `> * + * { margin-top: ${value}; }`],
                [`max-w-${suffix}`, `max-width: ${value}`],
                [`max-h-${suffix}`, `max-height: ${value}`],
                [`min-w-${suffix}`, `min-width: ${value}`],
                [`min-h-${suffix}`, `min-height: ${value}`],
                [`w-${suffix}`, `width: ${value}`],
                [`h-${suffix}`, `height: ${value}`]
            ],
            'radius-': (suffix, value) => [
                [`rounded-${suffix}`, `border-radius: ${value}`]
            ],
            'shadow-': (suffix, value) => [
                [`shadow-${suffix}`, `box-shadow: ${value}`]
            ],
            'inset-shadow-': (suffix, value) => [
                [`inset-shadow-${suffix}`, `box-shadow: inset ${value}`]
            ],
            'drop-shadow-': (suffix, value) => [
                [`drop-shadow-${suffix}`, `filter: drop-shadow(${value})`]
            ],
            'blur-': (suffix, value) => [
                [`blur-${suffix}`, `filter: blur(${value})`]
            ],
            'perspective-': (suffix, value) => [
                [`perspective-${suffix}`, `perspective: ${value}`]
            ],
            'aspect-': (suffix, value) => [
                [`aspect-${suffix}`, `aspect-ratio: ${value}`]
            ],
            'ease-': (suffix, value) => [
                [`ease-${suffix}`, `transition-timing-function: ${value}`]
            ],
            'animate-': (suffix, value) => [
                [`animate-${suffix}`, `animation: ${value}`]
            ],
            'border-width-': (suffix, value) => [
                [`border-${suffix}`, `border-width: ${value}`]
            ],
            'border-style-': (suffix, value) => [
                [`border-${suffix}`, `border-style: ${value}`]
            ],
            'outline-': (suffix, value) => [
                [`outline-${suffix}`, `outline-color: ${value}`]
            ],
            'outline-width-': (suffix, value) => [
                [`outline-${suffix}`, `outline-width: ${value}`]
            ],
            'outline-style-': (suffix, value) => [
                [`outline-${suffix}`, `outline-style: ${value}`]
            ],
            'ring-': (suffix, value) => [
                [`ring-${suffix}`, `box-shadow: 0 0 0 ${value} var(--color-ring)`]
            ],
            'ring-offset-': (suffix, value) => [
                [`ring-offset-${suffix}`, `--tw-ring-offset-width: ${value}`]
            ],
            'divide-': (suffix, value) => [
                [`divide-${suffix}`, `border-color: ${value}`]
            ],
            'accent-': (suffix, value) => [
                [`accent-${suffix}`, `accent-color: ${value}`]
            ],
            'caret-': (suffix, value) => [
                [`caret-${suffix}`, `caret-color: ${value}`]
            ],
            'decoration-': (suffix, value) => [
                [`decoration-${suffix}`, `text-decoration-color: ${value}`]
            ],
            'placeholder-': (suffix, value) => [
                [`placeholder-${suffix}`, `&::placeholder { color: ${value} }`]
            ],
            'selection-': (suffix, value) => [
                [`selection-${suffix}`, `&::selection { background-color: ${value} }`]
            ],
            'scrollbar-': (suffix, value) => [
                [`scrollbar-${suffix}`, `scrollbar-color: ${value}`]
            ]
        };

        // Define valid variants and their CSS selectors
        this.variants = {
            // State variants
            'hover': ':hover',
            'focus': ':focus',
            'focus-visible': ':focus-visible',
            'focus-within': ':focus-within',
            'active': ':active',
            'visited': ':visited',
            'target': ':target',
            'first': ':first-child',
            'last': ':last-child',
            'only': ':only-child',
            'odd': ':nth-child(odd)',
            'even': ':nth-child(even)',
            'first-of-type': ':first-of-type',
            'last-of-type': ':last-of-type',
            'only-of-type': ':only-of-type',
            'empty': ':empty',
            'disabled': ':disabled',
            'enabled': ':enabled',
            'checked': ':checked',
            'indeterminate': ':indeterminate',
            'default': ':default',
            'required': ':required',
            'valid': ':valid',
            'invalid': ':invalid',
            'in-range': ':in-range',
            'out-of-range': ':out-of-range',
            'placeholder-shown': ':placeholder-shown',
            'autofill': ':autofill',
            'read-only': ':read-only',
            'read-write': ':read-write',
            'optional': ':optional',
            'user-valid': ':user-valid',
            'user-invalid': ':user-invalid',
            'open': '[open] &',
            'closed': ':not([open]) &',
            'paused': '[data-state="paused"] &',
            'playing': '[data-state="playing"] &',
            'muted': '[data-state="muted"] &',
            'unmuted': '[data-state="unmuted"] &',
            'collapsed': '[data-state="collapsed"] &',
            'expanded': '[data-state="expanded"] &',
            'unchecked': ':not(:checked)',
            'selected': '[data-state="selected"] &',
            'unselected': '[data-state="unselected"] &',
            'details-content': '::details-content',
            'nth': ':nth-child',
            'nth-last': ':nth-last-child',
            'nth-of-type': ':nth-of-type',
            'nth-last-of-type': ':nth-last-of-type',
            'has': ':has',
            'not': ':not',

            // Pseudo-elements
            'before': '::before',
            'after': '::after',
            'first-letter': '::first-letter',
            'first-line': '::first-line',
            'marker': '::marker',
            'selection': '::selection',
            'file': '::file-selector-button',
            'backdrop': '::backdrop',
            'placeholder': '::placeholder',
            'target-text': '::target-text',
            'spelling-error': '::spelling-error',
            'grammar-error': '::grammar-error',

            // Media queries
            'dark': '.dark &',
            'light': '.light &',

            // Group variants
            'group': '.group &',
            'group-hover': '.group:hover &',
            'group-focus': '.group:focus &',
            'group-focus-within': '.group:focus-within &',
            'group-active': '.group:active &',
            'group-disabled': '.group:disabled &',
            'group-visited': '.group:visited &',
            'group-checked': '.group:checked &',
            'group-required': '.group:required &',
            'group-valid': '.group:valid &',
            'group-invalid': '.group:invalid &',
            'group-in-range': '.group:in-range &',
            'group-out-of-range': '.group:out-of-range &',
            'group-placeholder-shown': '.group:placeholder-shown &',
            'group-autofill': '.group:autofill &',
            'group-read-only': '.group:read-only &',
            'group-read-write': '.group:read-write &',
            'group-optional': '.group:optional &',
            'group-user-valid': '.group:user-valid &',
            'group-user-invalid': '.group:user-invalid &',

            // Peer variants
            'peer': '.peer ~ &',
            'peer-hover': '.peer:hover ~ &',
            'peer-focus': '.peer:focus ~ &',
            'peer-focus-within': '.peer:focus-within ~ &',
            'peer-active': '.peer:active ~ &',
            'peer-disabled': '.peer:disabled ~ &',
            'peer-visited': '.peer:visited ~ &',
            'peer-checked': '.peer:checked ~ &',
            'peer-required': '.peer:required ~ &',
            'peer-valid': '.peer:valid ~ &',
            'peer-invalid': '.peer:invalid ~ &',
            'peer-in-range': '.peer:in-range ~ &',
            'peer-out-of-range': '.peer:out-of-range ~ &',
            'peer-placeholder-shown': '.peer:placeholder-shown ~ &',
            'peer-autofill': '.peer:autofill ~ &',
            'peer-read-only': '.peer:read-only ~ &',
            'peer-read-write': '.peer:read-write ~ &',
            'peer-optional': '.peer:optional ~ &',
            'peer-user-valid': '.peer:user-valid ~ &',
            'peer-user-invalid': '.peer:user-invalid &',

            'motion-safe': '@media (prefers-reduced-motion: no-preference)',
            'motion-reduce': '@media (prefers-reduced-motion: reduce)',
            'print': '@media print',
            'portrait': '@media (orientation: portrait)',
            'landscape': '@media (orientation: landscape)',
            'contrast-more': '@media (prefers-contrast: more)',
            'contrast-less': '@media (prefers-contrast: less)',
            'forced-colors': '@media (forced-colors: active)',
            'rtl': '&:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *)',
            'ltr': '&:where(:dir(ltr), [dir="ltr"], [dir="ltr"] *)',
            '[dir=rtl]': '[dir="rtl"] &',
            '[dir=ltr]': '[dir="ltr"] &',
            'pointer-fine': '@media (pointer: fine)',
            'pointer-coarse': '@media (pointer: coarse)',
            'pointer-none': '@media (pointer: none)',
            'any-pointer-fine': '@media (any-pointer: fine)',
            'any-pointer-coarse': '@media (any-pointer: coarse)',
            'any-pointer-none': '@media (any-pointer: none)',
            'scripting-enabled': '@media (scripting: enabled)',
            'can-hover': '@media (hover: hover)',
            'can-not-hover': '@media (hover: none)',
            'any-hover': '@media (any-hover: hover)',
            'any-hover-none': '@media (any-hover: none)',
            'any-pointer': '@media (any-pointer: fine)',
            'any-pointer-coarse': '@media (any-pointer: coarse)',
            'any-pointer-none': '@media (any-pointer: none)',
            'color': '@media (color)',
            'color-gamut': '@media (color-gamut: srgb)',
            'color-gamut-p3': '@media (color-gamut: p3)',
            'color-gamut-rec2020': '@media (color-gamut: rec2020)',
            'monochrome': '@media (monochrome)',
            'monochrome-color': '@media (monochrome: 0)',
            'monochrome-grayscale': '@media (monochrome: 1)',
            'inverted-colors': '@media (inverted-colors: inverted)',
            'inverted-colors-none': '@media (inverted-colors: none)',
            'update': '@media (update: fast)',
            'update-slow': '@media (update: slow)',
            'update-none': '@media (update: none)',
            'overflow-block': '@media (overflow-block: scroll)',
            'overflow-block-paged': '@media (overflow-block: paged)',
            'overflow-inline': '@media (overflow-inline: scroll)',
            'overflow-inline-auto': '@media (overflow-inline: auto)',
            'prefers-color-scheme': '@media (prefers-color-scheme: dark)',
            'prefers-color-scheme-light': '@media (prefers-color-scheme: light)',
            'prefers-contrast': '@media (prefers-contrast: more)',
            'prefers-contrast-less': '@media (prefers-contrast: less)',
            'prefers-contrast-no-preference': '@media (prefers-contrast: no-preference)',
            'prefers-reduced-motion': '@media (prefers-reduced-motion: reduce)',
            'prefers-reduced-motion-no-preference': '@media (prefers-reduced-motion: no-preference)',
            'prefers-reduced-transparency': '@media (prefers-reduced-transparency: reduce)',
            'prefers-reduced-transparency-no-preference': '@media (prefers-reduced-transparency: no-preference)',
            'resolution': '@media (resolution: 1dppx)',
            'resolution-low': '@media (resolution: 1dppx)',
            'resolution-high': '@media (resolution: 2dppx)',
            'scan': '@media (scan: progressive)',
            'scan-interlace': '@media (scan: interlace)',
            'scripting': '@media (scripting: enabled)',
            'scripting-none': '@media (scripting: none)',
            'scripting-initial-only': '@media (scripting: initial-only)',

            // Container queries
            'container': '@container',
            'container-name': '@container',

            // Important modifier
            '!': '!important',

            // Responsive breakpoints
            'sm': '@media (min-width: 640px)',
            'md': '@media (min-width: 768px)',
            'lg': '@media (min-width: 1024px)',
            'xl': '@media (min-width: 1280px)',
            '2xl': '@media (min-width: 1536px)',

            // Supports queries
            'supports': '@supports',

            // Starting style
            'starting': '@starting-style',

            // Data attribute variants (common patterns)
            'data-open': '[data-state="open"] &',
            'data-closed': '[data-state="closed"] &',
            'data-checked': '[data-state="checked"] &',
            'data-unchecked': '[data-state="unchecked"] &',
            'data-on': '[data-state="on"] &',
            'data-off': '[data-state="off"] &',
            'data-visible': '[data-state="visible"] &',
            'data-hidden': '[data-state="hidden"] &',
            'data-disabled': '[data-disabled] &',
            'data-loading': '[data-loading] &',
            'data-error': '[data-error] &',
            'data-success': '[data-success] &',
            'data-warning': '[data-warning] &',
            'data-selected': '[data-selected] &',
            'data-highlighted': '[data-highlighted] &',
            'data-pressed': '[data-pressed] &',
            'data-expanded': '[data-expanded] &',
            'data-collapsed': '[data-collapsed] &',
            'data-active': '[data-active] &',
            'data-inactive': '[data-inactive] &',
            'data-valid': '[data-valid] &',
            'data-invalid': '[data-invalid] &',
            'data-required': '[data-required] &',
            'data-optional': '[data-optional] &',
            'data-readonly': '[data-readonly] &',
            'data-write': '[data-write] &',

            // Aria attribute variants (common patterns)
            'aria-expanded': '[aria-expanded="true"] &',
            'aria-collapsed': '[aria-expanded="false"] &',
            'aria-pressed': '[aria-pressed="true"] &',
            'aria-unpressed': '[aria-pressed="false"] &',
            'aria-checked': '[aria-checked="true"] &',
            'aria-unchecked': '[aria-checked="false"] &',
            'aria-selected': '[aria-selected="true"] &',
            'aria-unselected': '[aria-selected="false"] &',
            'aria-invalid': '[aria-invalid="true"] &',
            'aria-valid': '[aria-invalid="false"] &',
            'aria-required': '[aria-required="true"] &',
            'aria-optional': '[aria-required="false"] &',
            'aria-disabled': '[aria-disabled="true"] &',
            'aria-enabled': '[aria-disabled="false"] &',
            'aria-hidden': '[aria-hidden="true"] &',
            'aria-visible': '[aria-hidden="false"] &',
            'aria-busy': '[aria-busy="true"] &',
            'aria-available': '[aria-busy="false"] &',
            'aria-current': '[aria-current="true"] &',
            'aria-not-current': '[aria-current="false"] &',
            'aria-live': '[aria-live="polite"] &, [aria-live="assertive"] &',
            'aria-atomic': '[aria-atomic="true"] &',
            'aria-relevant': '[aria-relevant="additions"] &, [aria-relevant="removals"] &, [aria-relevant="text"] &, [aria-relevant="all"] &'
        };

        // Define variant groups that can be combined
        this.variantGroups = {
            'state': ['hover', 'focus', 'active', 'visited', 'target', 'open', 'closed', 'paused', 'playing', 'muted', 'unmuted', 'collapsed', 'expanded', 'unchecked', 'selected', 'unselected'],
            'child': ['first', 'last', 'only', 'odd', 'even'],
            'form': ['disabled', 'enabled', 'checked', 'indeterminate', 'required', 'valid', 'invalid'],
            'pseudo': ['before', 'after', 'first-letter', 'first-line', 'marker', 'selection', 'file', 'backdrop'],
            'media': ['dark', 'light', 'motion-safe', 'motion-reduce', 'print', 'portrait', 'landscape', 'rtl', 'ltr', 'can-hover', 'can-not-hover', 'any-hover', 'any-hover-none', 'color', 'monochrome', 'inverted-colors', 'inverted-colors-none', 'update', 'update-slow', 'update-none', 'overflow-block', 'overflow-block-paged', 'overflow-inline', 'overflow-inline-auto', 'prefers-color-scheme', 'prefers-color-scheme-light', 'prefers-contrast', 'prefers-contrast-less', 'prefers-contrast-no-preference', 'prefers-reduced-motion', 'prefers-reduced-motion-no-preference', 'prefers-reduced-transparency', 'prefers-reduced-transparency-no-preference', 'resolution', 'resolution-low', 'resolution-high', 'scan', 'scan-interlace', 'scripting', 'scripting-none', 'scripting-initial-only', 'forced-colors', 'contrast-more', 'contrast-less', 'pointer-fine', 'pointer-coarse', 'pointer-none', 'any-pointer-fine', 'any-pointer-coarse', 'any-pointer-none', 'scripting-enabled'],
            'responsive': ['sm', 'md', 'lg', 'xl', '2xl'],
            'group': ['group', 'group-hover', 'group-focus', 'group-active', 'group-disabled', 'group-checked', 'group-required', 'group-valid', 'group-invalid'],
            'peer': ['peer', 'peer-hover', 'peer-focus', 'peer-active', 'peer-disabled', 'peer-checked', 'peer-required', 'peer-valid', 'peer-invalid'],
            'data': ['data-open', 'data-closed', 'data-checked', 'data-unchecked', 'data-visible', 'data-hidden', 'data-disabled', 'data-loading', 'data-error', 'data-success', 'data-warning', 'data-selected', 'data-highlighted', 'data-pressed', 'data-expanded', 'data-collapsed', 'data-active', 'data-inactive', 'data-valid', 'data-invalid', 'data-required', 'data-optional', 'data-readonly', 'data-write'],
            'aria': ['aria-expanded', 'aria-collapsed', 'aria-pressed', 'aria-unpressed', 'aria-checked', 'aria-unchecked', 'aria-selected', 'aria-unselected', 'aria-invalid', 'aria-valid', 'aria-required', 'aria-optional', 'aria-disabled', 'aria-enabled', 'aria-hidden', 'aria-visible', 'aria-busy', 'aria-available', 'aria-current', 'aria-not-current', 'aria-live', 'aria-atomic', 'aria-relevant']
        };

        // Cache for parsed class names
        this.classCache = new Map();

        // Load cache and start processing
        this.loadAndApplyCache();

        // Listen for component loads
        this.setupComponentLoadListener();

        this.waitForTailwind().then(() => {
            this.startProcessing();
        });
    }

    // Public API for other plugins to configure behavior
    addIgnoredClassPattern(pattern) {
        if (pattern instanceof RegExp) {
            this.ignoredClassPatterns.push(pattern);
        } else if (typeof pattern === 'string') {
            this.ignoredClassPatterns.push(new RegExp(pattern));
        }
    }

    addIgnoredElementSelector(selector) {
        if (typeof selector === 'string') {
            this.ignoredElementSelectors.push(selector);
        }
    }

    addSignificantChangeSelector(selector) {
        if (typeof selector === 'string') {
            this.significantChangeSelectors.push(selector);
        }
    }

    // Allow plugins to trigger recompilation when needed
    triggerRecompilation(reason = 'manual') {
        this.compile();
    }

    setupComponentLoadListener() {
        // Use a single debounced handler for all component-related events
        const debouncedCompile = this.debounce(() => {
            if (!this.isCompiling) {
                this.compile();
            }
        }, this.options.debounceTime);

        // Listen for custom event when components are loaded
        document.addEventListener('indux:component-loaded', (event) => {
            debouncedCompile();
        });

        // Listen for route changes but don't recompile unnecessarily
        document.addEventListener('indux:route-change', (event) => {
            // Only trigger compilation if we detect new dynamic classes
            // The existing MutationObserver will handle actual DOM changes
            if (this.hasScannedStatic) {
                // Wait longer for route content to fully load before checking
                setTimeout(() => {
                    const currentDynamicCount = this.dynamicClassCache.size;
                    const currentClassesHash = this.lastClassesHash;
                    
                    // Scan for new classes
                    const usedData = this.getUsedClasses();
                    const newDynamicCount = this.dynamicClassCache.size;
                    const dynamicClasses = Array.from(this.dynamicClassCache);
                    const newClassesHash = dynamicClasses.sort().join(',');
                    
                    // Only compile if we found genuinely new classes, not just code processing artifacts
                    if (newDynamicCount > currentDynamicCount && newClassesHash !== currentClassesHash) {
                        const newClasses = dynamicClasses.filter(cls => 
                            // Filter out classes that are likely from code processing
                            !cls.includes('hljs') && 
                            !cls.startsWith('language-') && 
                            !cls.includes('copy') &&
                            !cls.includes('lines')
                        );
                        
                        if (newClasses.length > 0) {
                            debouncedCompile();
                        }
                    }
                }, 300); // Longer delay to let code processing finish
            }
        });

        // Use a single MutationObserver for all DOM changes
        const observer = new MutationObserver((mutations) => {
            let shouldRecompile = false;

            for (const mutation of mutations) {
                // Skip attribute changes that don't affect utilities
                if (mutation.type === 'attributes') {
                    const attributeName = mutation.attributeName;
                    
                    // Skip ignored attributes (like id changes from router)
                    if (this.ignoredAttributes.includes(attributeName)) {
                        continue;
                    }
                    
                    // Only care about class attribute changes
                    if (attributeName !== 'class') {
                        continue;
                    }
                    
                    // If it's a class change, check if we have new classes that need utilities
                    const element = mutation.target;
                    if (element.nodeType === Node.ELEMENT_NODE) {
                        const currentClasses = Array.from(element.classList || []);
                        const newClasses = currentClasses.filter(cls => {
                            // Skip ignored patterns
                            if (this.ignoredClassPatterns.some(pattern => pattern.test(cls))) {
                                return false;
                            }
                            
                            // Check if this class is new (not in our cache)
                            return !this.staticClassCache.has(cls) && !this.dynamicClassCache.has(cls);
                        });
                        
                        if (newClasses.length > 0) {
                            // Add new classes to dynamic cache
                            newClasses.forEach(cls => this.dynamicClassCache.add(cls));
                            shouldRecompile = true;
                            break;
                        }
                    }
                }
                else if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Skip ignored elements using configurable selectors
                            const isIgnoredElement = this.ignoredElementSelectors.some(selector => 
                                node.tagName?.toLowerCase() === selector.toLowerCase() ||
                                node.closest(selector)
                            );
                            
                            if (isIgnoredElement) {
                                continue;
                            }

                            // Only recompile for significant changes using configurable selectors
                            const hasSignificantChange = this.significantChangeSelectors.some(selector => {
                                try {
                                    return node.matches?.(selector) || node.querySelector?.(selector);
                                } catch (e) {
                                    return false; // Invalid selector
                                }
                            });

                            if (hasSignificantChange) {
                            shouldRecompile = true;
                            break;
                            }
                        }
                    }
                }
                if (shouldRecompile) break;
            }

            if (shouldRecompile) {
                debouncedCompile();
            }
        });

        // Start observing the document with the configured parameters
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'] // Only observe class changes
        });
    }

    // Debounce helper
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Wait for Tailwind to be available
    async waitForTailwind() {
        // Check if Tailwind is already available
        if (this.isTailwindAvailable()) {
            return;
        }

        // Wait for Tailwind to be available
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (this.isTailwindAvailable()) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);

            // Also check on DOMContentLoaded
            document.addEventListener('DOMContentLoaded', () => {
                if (this.isTailwindAvailable()) {
                    clearInterval(checkInterval);
                    resolve();
                }
            });

            // Set a timeout to prevent infinite waiting
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    // Check if Tailwind is available
    isTailwindAvailable() {
        // Check for Tailwind in various ways
        return (
            // Check for Tailwind CSS file
            Array.from(document.styleSheets).some(sheet =>
                sheet.href && (
                    sheet.href.includes('tailwind') ||
                    sheet.href.includes('tailwindcss') ||
                    sheet.href.includes('indux')
                )
            ) ||
            // Check for Tailwind classes in document
            document.querySelector('[class*="tailwind"]') ||
            // Check for Tailwind in window object
            window.tailwind ||
            // Check for Tailwind in document head
            document.head.innerHTML.includes('tailwind') ||
            // Check for Indux CSS files
            document.head.innerHTML.includes('indux')
        );
    }

    loadAndApplyCache() {
        try {
            const cached = localStorage.getItem('tailwind-cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                this.cache = new Map(Object.entries(parsed));

                // Apply the most recent cached styles immediately
                const mostRecentCache = Array.from(this.cache.entries())
                    .sort((a, b) => b[1].timestamp - a[1].timestamp)[0];

                if (mostRecentCache) {
                    this.styleElement.textContent = mostRecentCache[1].css;
                    this.lastThemeHash = mostRecentCache[1].themeHash;
                }
            }
        } catch (error) {
            console.warn('Failed to load cached styles:', error);
        }
    }

    async startProcessing() {
        try {

            // Start initial compilation immediately
            const initialCompilation = this.compile();

            // Set up observer while compilation is running
            this.observer = new MutationObserver((mutations) => {
                const relevantMutations = mutations.filter(mutation => {
                    if (mutation.type === 'attributes' &&
                        mutation.attributeName === 'class') {
                        return true;
                    }
                    if (mutation.type === 'childList') {
                        return Array.from(mutation.addedNodes).some(node =>
                            node.nodeType === Node.ELEMENT_NODE);
                    }
                    return false;
                });

                if (relevantMutations.length === 0) return;

                // Check if there are any new classes that need processing
                const newClasses = this.getUsedClasses();
                if (newClasses.classes.length === 0) return;

                if (this.compileTimeout) {
                    clearTimeout(this.compileTimeout);
                }
                this.compileTimeout = setTimeout(() => {
                    if (!this.isCompiling) {
                        this.compile();
                    }
                }, this.options.debounceTime);
            });

            // Start observing immediately
            this.observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });

            // Wait for initial compilation
            await initialCompilation;

            this.hasInitialized = true;
        } catch (error) {
            console.error('Error starting Tailwind compiler:', error);
        }
    }

    discoverCssFiles() {
        try {
            // Get all stylesheets from the document
            const stylesheets = Array.from(document.styleSheets);

            // Process each stylesheet
            for (const sheet of stylesheets) {
                try {
                    // Process local files and @indux CDN files
                    if (sheet.href && (
                        sheet.href.startsWith(window.location.origin) ||
                        sheet.href.includes('@indux') ||
                        (sheet.href.includes('jsdelivr') && sheet.href.includes('@indux')) ||
                        (sheet.href.includes('unpkg') && sheet.href.includes('@indux'))
                    )) {
                        this.cssFiles.add(sheet.href);
                    }

                    // Get all @import rules (local and @indux CDN)
                    const rules = Array.from(sheet.cssRules || []);
                    for (const rule of rules) {
                        if (rule.type === CSSRule.IMPORT_RULE && rule.href && (
                            rule.href.startsWith(window.location.origin) ||
                            rule.href.includes('@indux') ||
                            (rule.href.includes('jsdelivr') && rule.href.includes('@indux')) ||
                            (rule.href.includes('unpkg') && rule.href.includes('@indux'))
                        )) {
                            this.cssFiles.add(rule.href);
                        }
                    }
                } catch (e) {
                    // Skip stylesheets that can't be accessed (external CDN files, CORS, etc.)
                    // This is expected behavior for external stylesheets
                }
            }

            // Add any inline styles (exclude generated styles)
            const styleElements = document.querySelectorAll('style:not(#utility-styles)');
            for (const style of styleElements) {
                if (style.textContent && style.textContent.trim()) {
                    const id = style.id || `inline-style-${Array.from(styleElements).indexOf(style)}`;
                    this.cssFiles.add('inline:' + id);
                }
            }
        } catch (error) {
            console.warn('Error discovering CSS files:', error);
        }
    }

    loadPersistentCache() {
        try {
            const cached = localStorage.getItem('tailwind-cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                this.cache = new Map(Object.entries(parsed));
            }
        } catch (error) {
            console.warn('Failed to load cached styles:', error);
        }
    }

    savePersistentCache() {
        try {
            const serialized = JSON.stringify(Object.fromEntries(this.cache));
            localStorage.setItem('tailwind-cache', serialized);
        } catch (error) {
            console.warn('Failed to save cached styles:', error);
        }
    }

    // Generate a hash of the theme variables to detect changes
    generateThemeHash(themeCss) {
        // Use encodeURIComponent to handle non-Latin1 characters safely
        return encodeURIComponent(themeCss).slice(0, 8); // Simple hash of theme content
    }

    // Clean up old cache entries
    cleanupCache() {
        const now = Date.now();
        const maxAge = this.options.maxCacheAge;
        const entriesToDelete = [];

        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp && (now - value.timestamp > maxAge)) {
                entriesToDelete.push(key);
            }
        }

        for (const key of entriesToDelete) {
            this.cache.delete(key);
        }

        if (entriesToDelete.length > 0) {
            this.savePersistentCache();
        }
    }

    // Scan static HTML files and components for classes
    async scanStaticClasses() {
        if (this.staticScanPromise) {
            return this.staticScanPromise;
        }

        this.staticScanPromise = (async () => {
            try {
                const staticClasses = new Set();

                // 1. Scan index.html content
                const htmlContent = document.documentElement.outerHTML;
                this.extractClassesFromHTML(htmlContent, staticClasses);

                // 2. Scan component files from manifest
                const registry = window.InduxComponentsRegistry;
                const componentUrls = [];
                
                if (registry && registry.manifest) {
                    // Get all component paths from manifest
                    const allComponents = [
                        ...(registry.manifest.preloadedComponents || []),
                        ...(registry.manifest.components || [])
                    ];
                    componentUrls.push(...allComponents);
                }

                const componentPromises = componentUrls.map(async (url) => {
                    try {
                        const response = await fetch('/' + url);
                        if (response.ok) {
                            const html = await response.text();
                            this.extractClassesFromHTML(html, staticClasses);
                        }
                    } catch (error) {
                        // Silently ignore missing components
                    }
                });

                await Promise.all(componentPromises);

                // Cache static classes
                for (const cls of staticClasses) {
                    this.staticClassCache.add(cls);
                }

                this.hasScannedStatic = true;

                return staticClasses;
            } catch (error) {
                console.warn('[TailwindCompiler] Error scanning static classes:', error);
                this.hasScannedStatic = true;
                return new Set();
            }
        })();

        return this.staticScanPromise;
    }

    // Extract classes from HTML content
    extractClassesFromHTML(html, classSet) {

        // Match class attributes: class="..." or class='...'
        const classRegex = /class=["']([^"']+)["']/g;
        let match;
        
        while ((match = classRegex.exec(html)) !== null) {
            const classString = match[1];
            const classes = classString.split(/\s+/).filter(Boolean);
            for (const cls of classes) {
                if (cls && !cls.startsWith('x-') && !cls.startsWith('$')) {
                    classSet.add(cls);
                }
            }
        }

        // Also check for x-data and other Alpine directives that might contain classes
        const alpineRegex = /x-(?:data|bind:class|class)=["']([^"']+)["']/g;
        while ((match = alpineRegex.exec(html)) !== null) {
            // Simple extraction - could be enhanced for complex Alpine expressions
            const content = match[1];
            const classMatches = content.match(/['"`]([^'"`\s]+)['"`]/g);
            if (classMatches) {
                for (const classMatch of classMatches) {
                    const cls = classMatch.replace(/['"`]/g, '');
                    if (cls && !cls.startsWith('$') && !cls.includes('(')) {
                        classSet.add(cls);
                    }
                }
            }
        }
    }

    getUsedClasses() {
        try {
            const allClasses = new Set();
            const usedVariableSuffixes = new Set();

            // Add static classes (pre-scanned)
            for (const cls of this.staticClassCache) {
                allClasses.add(cls);
            }

            // Scan current DOM for dynamic classes only
            const elements = document.getElementsByTagName('*');
            for (const element of elements) {
                let classes = [];
                if (typeof element.className === 'string') {
                    classes = element.className.split(/\s+/).filter(Boolean);
                } else if (element.classList) {
                    classes = Array.from(element.classList);
                }

                for (const cls of classes) {
                    if (!cls) continue;

                    // Skip classes using configurable patterns
                    const isIgnoredClass = this.ignoredClassPatterns.some(pattern => 
                        pattern.test(cls)
                    );
                    
                    if (isIgnoredClass) {
                        continue;
                    }

                    // Add all classes (static + dynamic)
                    allClasses.add(cls);

                    // Track dynamic classes separately
                    if (!this.staticClassCache.has(cls)) {
                        this.dynamicClassCache.add(cls);
                    }
                }
            }

            // Process all classes for variable suffixes
            for (const cls of allClasses) {
                    // Extract base class and variants
                    const parts = cls.split(':');
                    const baseClass = parts[parts.length - 1];

                    // Extract suffix for variable matching
                    const classParts = baseClass.split('-');
                    if (classParts.length > 1) {
                        let suffix = classParts.slice(1).join('-');

                        // Handle opacity modifiers (like /90, /50)
                        let baseSuffix = suffix;
                        if (suffix.includes('/')) {
                            const parts = suffix.split('/');
                            baseSuffix = parts[0];
                            const opacity = parts[1];

                            // Add both the base suffix and the full suffix with opacity
                            usedVariableSuffixes.add(baseSuffix);
                            usedVariableSuffixes.add(suffix); // Keep the full suffix with opacity
                        } else {
                            usedVariableSuffixes.add(suffix);
                        }

                        // For compound classes like text-content-subtle, also add the full suffix
                        // This handles cases where the variable is --color-content-subtle
                        if (classParts.length > 2) {
                            const fullSuffix = classParts.slice(1).join('-');
                            if (fullSuffix.includes('/')) {
                                usedVariableSuffixes.add(fullSuffix.split('/')[0]);
                            } else {
                                usedVariableSuffixes.add(fullSuffix);
                        }
                    }
                }
            }

            return {
                classes: Array.from(allClasses),
                variableSuffixes: Array.from(usedVariableSuffixes)
            };
        } catch (error) {
            console.error('Error getting used classes:', error);
            return { classes: [], variableSuffixes: [] };
        }
    }

    async fetchThemeContent() {
        const themeContents = new Set();
        const fetchPromises = [];

        // If we haven't discovered CSS files yet, do it now
        if (this.cssFiles.size === 0) {
            this.discoverCssFiles();
        }

        // Process all files concurrently
        for (const source of this.cssFiles) {
            const fetchPromise = (async () => {
                try {
                    let content = '';
                    let needsFetch = true;

                    if (source.startsWith('inline:')) {
                        const styleId = source.replace('inline:', '');
                        const styleElement = styleId ?
                            document.getElementById(styleId) :
                            document.querySelector('style');
                        if (styleElement) {
                            content = styleElement.textContent;
                        }
                        needsFetch = false;
                    } else {
                        // Smart caching: use session storage + timestamp approach
                        const cacheKey = source;
                        const cached = this.cssContentCache.get(cacheKey);
                        const now = Date.now();
                        
                        // Different cache times based on file source
                        let cacheTime;
                        if (source.includes('@indux') || source.includes('jsdelivr') || source.includes('unpkg')) {
                            // CDN files: cache longer (5 minutes for static, 1 minute for dynamic)
                            cacheTime = this.hasScannedStatic ? 60000 : 300000;
                        } else {
                            // Local files: shorter cache (5 seconds for dynamic, 30 seconds for static)
                            cacheTime = this.hasScannedStatic ? 5000 : 30000;
                        }
                        
                        if (cached && (now - cached.timestamp) < cacheTime) {
                            content = cached.content;
                            needsFetch = false;
                        }

                        if (needsFetch) {
                            // Add timestamp for development cache busting, but keep it minimal
                            const timestamp = Math.floor(now / 1000); // Only changes every second
                            const url = `${source}?t=${timestamp}`;

                            const response = await fetch(url);

                        if (!response.ok) {
                            console.warn('Failed to fetch stylesheet:', url);
                            return;
                        }

                        content = await response.text();
                            
                            // Cache the content with timestamp
                            this.cssContentCache.set(cacheKey, {
                                content: content,
                                timestamp: now
                            });
                        }
                    }

                    if (content) {
                        themeContents.add(content);
                    }
                } catch (error) {
                    console.warn(`Error fetching CSS from ${source}:`, error);
                }
            })();
            fetchPromises.push(fetchPromise);
        }

        // Wait for all fetches to complete
        await Promise.all(fetchPromises);

        return Array.from(themeContents).join('\n');
    }

    async processThemeContent(content) {
        try {
            const variables = this.extractThemeVariables(content);
            if (variables.size === 0) {
                return;
            }

            // Only log and process actual changes
            let hasChanges = false;
            for (const [name, value] of variables.entries()) {
                const currentValue = this.currentThemeVars.get(name);
                if (currentValue !== value) {
                    hasChanges = true;
                    this.currentThemeVars.set(name, value);
                }
            }

            if (hasChanges) {
                // Generate utilities for these variables
                const utilities = this.generateUtilitiesFromVars(content, this.getUsedClasses());
                if (!utilities) {
                    return;
                }

                // Update styles immediately with new utilities
                const newStyles = `@layer utilities {\n${utilities}\n}`;
                this.updateStyles(newStyles);
            }

        } catch (error) {
            console.warn('Error processing theme content:', error);
        }
    }

    updateStyles(newStyles) {
        if (!this.styleElement) {
            console.warn('No style element found');
            return;
        }

        this.styleElement.textContent = newStyles;
    }

    extractThemeVariables(cssText) {
        const variables = new Map();

        // Extract ALL CSS custom properties from ANY declaration block
        // This regex finds --variable-name: value; patterns anywhere in the CSS
        const varRegex = /--([\w-]+):\s*([^;]+);/g;

        let varMatch;
        while ((varMatch = varRegex.exec(cssText)) !== null) {
            const name = varMatch[1];
            const value = varMatch[2].trim();
            variables.set(name, value);
        }

        return variables;
    }

    extractCustomUtilities(cssText) {
        const utilities = new Map();

        // Extract custom utility classes from CSS
        // This regex finds .class-name { ... } patterns in @layer utilities or standalone
        const utilityRegex = /(?:@layer\s+utilities\s*{[^}]*}|^)(?:[^{}]*?)(?:^|\s)(\.[\w-]+)\s*{([^}]+)}/gm;

        let match;
        while ((match = utilityRegex.exec(cssText)) !== null) {
            const className = match[1].substring(1); // Remove the leading dot
            const cssRules = match[2].trim();
            
            // Skip if it's a Tailwind-generated class (starts with common prefixes)
            if (this.isTailwindGeneratedClass(className)) {
                continue;
            }

            // Store the utility class and its CSS (combine if already exists)
            if (utilities.has(className)) {
                const existingRules = utilities.get(className);
                utilities.set(className, `${existingRules}; ${cssRules}`);
            } else {
                utilities.set(className, cssRules);
            }
        }

        // Also look for :where() selectors which are common in Indux utilities
        // Handle both single class and multiple class selectors
        const whereRegex = /:where\(([^)]+)\)\s*{([^}]+)}/g;
        while ((match = whereRegex.exec(cssText)) !== null) {
            const selectorContent = match[1];
            const cssRules = match[2].trim();
            
            // Extract individual class names from the selector
            const classMatches = selectorContent.match(/\.([\w-]+)/g);
            if (classMatches) {
                for (const classMatch of classMatches) {
                    const className = classMatch.substring(1); // Remove the leading dot
                    
                    if (!this.isTailwindGeneratedClass(className)) {
                        // Combine CSS rules if the class already exists
                        if (utilities.has(className)) {
                            const existingRules = utilities.get(className);
                            utilities.set(className, `${existingRules}; ${cssRules}`);
                        } else {
                            utilities.set(className, cssRules);
                        }
                    }
                }
            }
        }

        return utilities;
    }

    isTailwindGeneratedClass(className) {
        // Check if this looks like a Tailwind-generated class
        const tailwindPatterns = [
            /^[a-z]+-\d+$/, // spacing, sizing classes like p-4, w-10
            /^[a-z]+-\[/, // arbitrary values like w-[100px]
            /^(text|bg|border|ring|shadow|opacity|scale|rotate|translate|skew|origin|transform|transition|duration|delay|ease|animate|backdrop|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|filter|backdrop-)/, // common Tailwind prefixes
            /^(sm|md|lg|xl|2xl):/, // responsive prefixes
            /^(hover|focus|active|disabled|group-hover|group-focus|peer-hover|peer-focus):/, // state prefixes
            /^(dark|light):/, // theme prefixes
            /^!/, // important modifier
            /^\[/, // arbitrary selectors
        ];

        return tailwindPatterns.some(pattern => pattern.test(className));
    }

    parseClassName(className) {
        // Check cache first
        if (this.classCache.has(className)) {
            return this.classCache.get(className);
        }

        const result = {
            important: className.startsWith('!'),
            variants: [],
            baseClass: className
        };

        // Remove important modifier if present
        if (result.important) {
            className = className.slice(1);
        }

        // Split by variant separator, but preserve content within brackets
        const parts = [];
        let current = '';
        let bracketDepth = 0;
        
        for (let i = 0; i < className.length; i++) {
            const char = className[i];
            
            if (char === '[') {
                bracketDepth++;
            } else if (char === ']') {
                bracketDepth--;
            }
            
            if (char === ':' && bracketDepth === 0) {
                // This is a variant separator, not part of a bracket expression
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current); // Add the last part
        
        result.baseClass = parts.pop(); // Last part is always the base class

        // Process variants in order (left to right)
        result.variants = parts.map(variant => {
            // Check for arbitrary selector variants [&_selector]
            if (variant.startsWith('[') && variant.endsWith(']')) {
                const arbitrarySelector = variant.slice(1, -1); // Remove brackets
                if (arbitrarySelector.startsWith('&')) {
                    return {
                        name: variant,
                        selector: arbitrarySelector,
                        isArbitrary: true
                    };
                }
            }
            
            const selector = this.variants[variant];
            if (!selector) {
                console.warn(`Unknown variant: ${variant}`);
                return null;
            }
            return {
                name: variant,
                selector: selector,
                isArbitrary: false
            };
        }).filter(Boolean);

        // Cache the result
        this.classCache.set(className, result);
        return result;
    }

    generateCustomUtilities(usedData) {
        try {
            const utilities = [];
            const generatedRules = new Set();
            const { classes: usedClasses } = usedData;


            if (this.customUtilities.size === 0) {
                return '';
            }

            // Helper to escape special characters in class names
            const escapeClassName = (className) => {
                return className.replace(/[^a-zA-Z0-9-]/g, '\\$&');
            };

            // Helper to generate a single utility with its variants
            const generateUtility = (baseClass, css) => {
                // Find all variants of this base class that are actually used
                const usedVariants = usedClasses
                    .filter(cls => {
                        const parts = cls.split(':');
                        const basePart = parts[parts.length - 1];
                        const isMatch = basePart === baseClass || (basePart.startsWith('!') && basePart.slice(1) === baseClass);
                        return isMatch;
                    });

                // Skip generating base utility - it already exists in the CSS
                // Only generate variants and important versions
                
                // Generate important version if used
                if (usedClasses.includes('!' + baseClass)) {
                    const importantCss = css.includes(';') ? 
                        css.replace(/;/g, ' !important;') : 
                        css + ' !important';
                    const rule = `.${escapeClassName('!' + baseClass)} { ${importantCss} }`;
                    if (!generatedRules.has(rule)) {
                        utilities.push(rule);
                        generatedRules.add(rule);
                    }
                }

                // Generate each variant as a separate class
                for (const variantClass of usedVariants) {
                    if (variantClass === baseClass) continue;

                    const parsed = this.parseClassName(variantClass);

                    // Check if this is an important variant
                    const isImportant = parsed.important;
                    const cssContent = isImportant ? 
                        (css.includes(';') ? css.replace(/;/g, ' !important;') : css + ' !important') : 
                        css;

                    // Build selector by applying variants
                    let selector = `.${escapeClassName(variantClass)}`;
                    let hasMediaQuery = false;
                    let mediaQueryRule = '';

                    for (const variant of parsed.variants) {
                        if (variant.isArbitrary) {
                            // Handle arbitrary selectors like [&_figure] or [&_fieldset:has(legend):not(.whatever)]
                            let arbitrarySelector = variant.selector;
                            
                            // Replace underscores with spaces, but preserve them inside parentheses
                            arbitrarySelector = arbitrarySelector.replace(/_/g, ' ');
                            
                            selector = { baseClass: selector, arbitrarySelector };
                        } else if (variant.selector.startsWith(':')) {
                            // For pseudo-classes, append to selector
                            selector = `${selector}${variant.selector}`;
                        } else if (variant.selector.startsWith('@')) {
                            // For media queries, wrap the whole rule
                            hasMediaQuery = true;
                            mediaQueryRule = variant.selector;
                        } else if (variant.selector.includes('&')) {
                            // For contextual selectors (like dark mode)
                            selector = variant.selector.replace('&', selector);
                        }
                    }

                    // Generate the final rule
                    let rule;
                    if (typeof selector === 'object' && selector.arbitrarySelector) {
                        // Handle arbitrary selectors with nested CSS
                        rule = `${selector.baseClass} {\n    ${selector.arbitrarySelector} {\n        ${cssContent}\n    }\n}`;
                    } else {
                        // Regular selector
                        rule = `${selector} { ${cssContent} }`;
                    }
                    
                    const finalRule = hasMediaQuery ? 
                        `${mediaQueryRule} { ${rule} }` : 
                        rule;


                    if (!generatedRules.has(finalRule)) {
                        utilities.push(finalRule);
                        generatedRules.add(finalRule);
                    }
                }
            };

            // Generate utilities for each custom class that's actually used
            for (const [className, css] of this.customUtilities.entries()) {
                // Check if this specific utility class is actually used (including variants and important)
                const isUsed = usedClasses.some(cls => {
                    // Parse the class to extract the base utility name
                    const parsed = this.parseClassName(cls);
                    const baseClass = parsed.baseClass;
                    
                    // Check both normal and important versions
                    return baseClass === className || 
                           baseClass === '!' + className ||
                           (baseClass.startsWith('!') && baseClass.slice(1) === className);
                });

                if (isUsed) {
                    generateUtility(className, css);
                }
            }

            return utilities.join('\n');
        } catch (error) {
            console.error('Error generating custom utilities:', error);
            return '';
        }
    }

    generateUtilitiesFromVars(cssText, usedData) {
        try {
            const utilities = [];
            const generatedRules = new Set(); // Track generated rules to prevent duplicates
            const variables = this.extractThemeVariables(cssText);
            const { classes: usedClasses, variableSuffixes } = usedData;

            if (variables.size === 0) {
                return '';
            }

            // Helper to escape special characters in class names
            const escapeClassName = (className) => {
                return className.replace(/[^a-zA-Z0-9-]/g, '\\$&');
            };

            // Helper to generate a single utility with its variants
            const generateUtility = (baseClass, css) => {
                // Find all variants of this base class that are actually used
                const usedVariants = usedClasses
                    .filter(cls => {
                        const parts = cls.split(':');
                        const basePart = parts[parts.length - 1];
                        return basePart === baseClass || (basePart.startsWith('!') && basePart.slice(1) === baseClass);
                    });

                // Generate base utility if it's used directly
                if (usedClasses.includes(baseClass)) {
                    const rule = `.${escapeClassName(baseClass)} { ${css} }`;
                    if (!generatedRules.has(rule)) {
                        utilities.push(rule);
                        generatedRules.add(rule);
                    }
                }
                // Generate important version if used
                if (usedClasses.includes('!' + baseClass)) {
                    const importantCss = css.includes(';') ? 
                        css.replace(/;/g, ' !important;') : 
                        css + ' !important';
                    const rule = `.${escapeClassName('!' + baseClass)} { ${importantCss} }`;
                    if (!generatedRules.has(rule)) {
                        utilities.push(rule);
                        generatedRules.add(rule);
                    }
                }

                // Generate each variant as a separate class
                for (const variantClass of usedVariants) {
                    if (variantClass === baseClass) continue;

                    const parsed = this.parseClassName(variantClass);

                    // Check if this is an important variant
                    const isImportant = parsed.important;
                    const cssContent = isImportant ? 
                        (css.includes(';') ? css.replace(/;/g, ' !important;') : css + ' !important') : 
                        css;

                    // Build selector by applying variants
                        let selector = `.${escapeClassName(variantClass)}`;
                    let hasMediaQuery = false;
                    let mediaQueryRule = '';

                    for (const variant of parsed.variants) {
                        if (variant.isArbitrary) {
                            // Handle arbitrary selectors like [&_figure] or [&_fieldset:has(legend):not(.whatever)]
                            // Convert underscores to spaces, but be careful with complex selectors
                            let arbitrarySelector = variant.selector;
                            
                            // Replace underscores with spaces, but preserve them inside parentheses
                            // This handles cases like :not(.whatever,_else) where the underscore should become a space
                            arbitrarySelector = arbitrarySelector.replace(/_/g, ' ');
                            
                            // We'll handle this in the CSS generation - store for later use
                            selector = { baseClass: selector, arbitrarySelector };
                        } else if (variant.selector.startsWith(':')) {
                            // For pseudo-classes, append to selector
                            selector = `${selector}${variant.selector}`;
                        } else if (variant.selector.startsWith('@')) {
                            // For media queries, wrap the whole rule
                            hasMediaQuery = true;
                            mediaQueryRule = variant.selector;
                        } else if (variant.selector.includes('&')) {
                            // For contextual selectors (like dark mode)
                            selector = variant.selector.replace('&', selector);
                        }
                    }

                    // Generate the final rule
                    let rule;
                    if (typeof selector === 'object' && selector.arbitrarySelector) {
                        // Handle arbitrary selectors with nested CSS
                        rule = `${selector.baseClass} {\n    ${selector.arbitrarySelector} {\n        ${cssContent}\n    }\n}`;
                    } else {
                        // Regular selector
                        rule = `${selector} { ${cssContent} }`;
                    }
                    
                    const finalRule = hasMediaQuery ? 
                        `${mediaQueryRule} { ${rule} }` : 
                        rule;

                        if (!generatedRules.has(finalRule)) {
                            utilities.push(finalRule);
                            generatedRules.add(finalRule);
                    }
                }
            };

            // Generate utilities based on variable prefix
            for (const [varName, varValue] of variables.entries()) {
                if (!varName.match(this.regexPatterns.tailwindPrefix)) {
                    continue;
                }

                const suffix = varName.split('-').slice(1).join('-');
                const value = `var(--${varName})`;
                const prefix = varName.split('-')[0] + '-';
                const generator = this.utilityGenerators[prefix];

                if (generator) {
                    const utilityPairs = generator(suffix, value);
                    for (const [className, css] of utilityPairs) {
                        // Check if this specific utility class is actually used (including variants and important)
                        const isUsed = usedClasses.some(cls => {
                            // Parse the class to extract the base utility name
                            const parsed = this.parseClassName(cls);
                            const baseClass = parsed.baseClass;
                            
                            // Check both normal and important versions
                            return baseClass === className || 
                                   baseClass === '!' + className ||
                                   (baseClass.startsWith('!') && baseClass.slice(1) === className);
                        });
                        if (isUsed) {
                            generateUtility(className, css);
                        }

                        // Check for opacity variants of this utility
                        const opacityVariants = usedClasses.filter(cls => {
                            // Parse the class to extract the base utility name
                            const parsed = this.parseClassName(cls);
                            const baseClass = parsed.baseClass;
                            
                            // Check if this class has an opacity modifier and matches our base class
                            if (baseClass.includes('/')) {
                                const baseWithoutOpacity = baseClass.split('/')[0];
                                if (baseWithoutOpacity === className) {
                                    const opacity = baseClass.split('/')[1];
                                    // Validate that the opacity is a number between 0-100
                                    return !isNaN(opacity) && opacity >= 0 && opacity <= 100;
                                }
                            }
                            return false;
                        });

                        // Generate opacity utilities for each variant found
                        for (const variant of opacityVariants) {
                            const opacity = variant.split('/')[1];
                            const opacityValue = `color-mix(in oklch, ${value} ${opacity}%, transparent)`;
                            const opacityCss = css.replace(value, opacityValue);
                            generateUtility(variant, opacityCss);
                        }
                    }
                }
            }

            return utilities.join('\n');
        } catch (error) {
            console.error('Error generating utilities:', error);
            return '';
        }
    }

    async compile() {
        try {
            // Prevent too frequent compilations
            const now = Date.now();
            if (now - this.lastCompileTime < this.minCompileInterval) {
                return;
            }
            this.lastCompileTime = now;

            if (this.isCompiling) {
                return;
            }
            this.isCompiling = true;

            // On first run, scan static classes and CSS variables
            if (!this.hasScannedStatic) {
                await this.scanStaticClasses();
                
                // Fetch CSS content once for initial compilation
                const themeCss = await this.fetchThemeContent();
                if (themeCss) {
                    // Extract and cache custom utilities
                const discoveredCustomUtilities = this.extractCustomUtilities(themeCss);
                    for (const [name, value] of discoveredCustomUtilities.entries()) {
                        this.customUtilities.set(name, value);
                    }

                    const variables = this.extractThemeVariables(themeCss);
                    for (const [name, value] of variables.entries()) {
                        this.currentThemeVars.set(name, value);
                    }
                    
                    // Generate utilities for all static classes
                    const staticUsedData = {
                        classes: Array.from(this.staticClassCache),
                        variableSuffixes: []
                    };
                    // Process static classes for variable suffixes
                    for (const cls of this.staticClassCache) {
                        const parts = cls.split(':');
                        const baseClass = parts[parts.length - 1];
                        const classParts = baseClass.split('-');
                        if (classParts.length > 1) {
                            staticUsedData.variableSuffixes.push(classParts.slice(1).join('-'));
                        }
                    }
                    
                    // Generate both variable-based and custom utilities
                    const varUtilities = this.generateUtilitiesFromVars(themeCss, staticUsedData);
                    const customUtilitiesGenerated = this.generateCustomUtilities(staticUsedData);
                    
                    const allUtilities = [varUtilities, customUtilitiesGenerated].filter(Boolean).join('\n\n');
                    if (allUtilities) {
                        const finalCss = `@layer utilities {\n${allUtilities}\n}`;
                        this.styleElement.textContent = finalCss;
                        this.lastClassesHash = staticUsedData.classes.sort().join(',');
                    }
                }
                
                this.hasInitialized = true;
                this.isCompiling = false;
                return;
            }

            // For subsequent compilations, check for new dynamic classes
            const usedData = this.getUsedClasses();
            const dynamicClasses = Array.from(this.dynamicClassCache);
            
            // Create a hash of current dynamic classes to detect changes
            const dynamicClassesHash = dynamicClasses.sort().join(',');
            
            // Check if dynamic classes have actually changed
            if (dynamicClassesHash !== this.lastClassesHash || !this.hasInitialized) {
                // Fetch CSS content for dynamic compilation
                const themeCss = await this.fetchThemeContent();
                if (!themeCss) {
                    this.isCompiling = false;
                    return;
                }

                // Update custom utilities cache if needed
                const discoveredCustomUtilities = this.extractCustomUtilities(themeCss);
                for (const [name, value] of discoveredCustomUtilities.entries()) {
                    this.customUtilities.set(name, value);
                }

                // Check for variable changes
                const variables = this.extractThemeVariables(themeCss);
                let hasVariableChanges = false;
                for (const [name, value] of variables.entries()) {
                    const currentValue = this.currentThemeVars.get(name);
                    if (currentValue !== value) {
                        hasVariableChanges = true;
                        this.currentThemeVars.set(name, value);
                    }
                }

                // Generate utilities for all classes (static + dynamic) if needed
                if (hasVariableChanges || dynamicClassesHash !== this.lastClassesHash) {
                    
                    // Generate both variable-based and custom utilities
                    const varUtilities = this.generateUtilitiesFromVars(themeCss, usedData);
                    const customUtilitiesGenerated = this.generateCustomUtilities(usedData);
                    
                    
                    const allUtilities = [varUtilities, customUtilitiesGenerated].filter(Boolean).join('\n\n');
                    if (allUtilities) {
                        const finalCss = `@layer utilities {\n${allUtilities}\n}`;
                        this.styleElement.textContent = finalCss;
                        this.lastClassesHash = dynamicClassesHash;
                    }
                }
            }

        } catch (error) {
            console.error('Error compiling Tailwind CSS:', error);
        } finally {
            this.isCompiling = false;
        }
    }
}

// Initialize immediately without waiting for DOMContentLoaded
const compiler = new TailwindCompiler();

// Expose utilities compiler for optional integration
window.InduxUtilities = compiler;

// Also handle DOMContentLoaded for any elements that might be added later
document.addEventListener('DOMContentLoaded', () => {
    if (!compiler.isCompiling) {
        compiler.compile();
    }
});
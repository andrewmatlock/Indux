#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
const CONFIG = {
    // Component subscripts order
    componentSubscripts: [
        'indux.components.registry.js',
        'indux.components.loader.js',
        'indux.components.processor.js',
        'indux.components.swapping.js',
        'indux.components.mutation.js',
        'indux.components.main.js'
    ],

    // Routing subscripts order
    routingSubscripts: [
        'indux.router.main.js',
        'indux.router.position.js',
        'indux.router.navigation.js',
        'indux.router.visibility.js',
        'indux.router.head.js'
    ],

    // Core plugins that should load first
    corePlugins: ['scripts/indux.components.js'],

    // Files to ignore in rollup
    ignorePatterns: [
        'scripts/components/**',
        'scripts/router/**',
        '**/alpine.v3.*.js',
        'scripts/indux.js',
        'scripts/indux.quickstart.js',
        'scripts/indux/slides.js',
        '**/tailwind.*.js',
        'scripts/rollup.js',
        'scripts/rollup.alpine.tailwind.js',
        'scripts/rollup.alpine.tailwind.temp.js',
    ],

    // Dependencies
    dependencies: {
        TAILWIND_V4_FILE: 'tailwind.v4.1.js',
        ALPINE_FILE: 'alpine.v3.14.9.js'
    },

    // Stylesheet configuration
    stylesheets: {
        // Core files that need special handling
        coreFiles: ['indux.theme.css', 'indux.reset.css'],

        // Files that need popover.css appended
        popoverDependent: ['indux.dropdown.css', 'indux.modal.css', 'indux.sidebar.css', 'indux.tooltip.css'],

        // Files that need group.css appended
        groupDependent: [],

        // Directories to process
        sourceDirs: ['styles/core', 'styles/elements', 'styles/utilities'],

        // Output directory
        outputDir: 'styles'
    }
};

// Build subscripts into monolith files
function buildSubscripts() {
    console.log('Building subscripts into monolith files...\n');

    // Build components
    combineSubscripts(CONFIG.componentSubscripts, 'indux.components.js', 'components');

    // Build routing
    combineSubscripts(CONFIG.routingSubscripts, 'indux.router.js', 'router');

    console.log('✓ Subscripts built successfully!\n');
}

// Build stylesheets
function buildStylesheets() {
    console.log('Building stylesheets...\n');

    // Step 1: Build the main indux.css file
    buildMainStylesheet();

    // Step 2: Handle special popover-dependent files
    handlePopoverDependentFiles();

    // Step 3: Handle special group-dependent files
    handleGroupDependentFiles();

    // Step 4: Copy indux.css to docs and starter template
    copyInduxCssToTargets();

}


// Build the main indux.css file
function buildMainStylesheet() {
    console.log('Building main indux.css...');

    const mainContent = [];

    // Add header comment
    mainContent.push('/*  Indux CSS\n/*  By Andrew Matlock under MIT license\n/*  https://github.com/andrewmatlock/Indux\n*/');

    // Step 1: Add core files in order
    for (const coreFile of CONFIG.stylesheets.coreFiles) {
        const corePath = path.join('styles/core', coreFile);
        if (fs.existsSync(corePath)) {
            const content = fs.readFileSync(corePath, 'utf8').trim();
            mainContent.push(content);
            console.log(`  ✓ Added core: ${coreFile}`);
        }
    }

    // Step 2: Add elements files in alphabetical order
    const elementFiles = glob.sync('styles/elements/*.css')
        .map(file => path.basename(file))
        .sort();

    for (const elementFile of elementFiles) {
        const elementPath = path.join('styles/elements', elementFile);
        let content = fs.readFileSync(elementPath, 'utf8').trim();
        
        // Strip base layer popover styles from popover-dependent files when compiling into main indux.css
        if (CONFIG.stylesheets.popoverDependent.includes(elementFile)) {
            content = stripBaseLayerPopoverStyles(content);
        }
        
        mainContent.push(content);
        console.log(`  ✓ Added element: ${elementFile}`);
    }

    // Step 3: Add utilities files in alphabetical order
    const utilityFiles = glob.sync('styles/utilities/*.css')
        .map(file => path.basename(file))
        .sort();

    for (const utilityFile of utilityFiles) {
        const utilityPath = path.join('styles/utilities', utilityFile);
        const content = fs.readFileSync(utilityPath, 'utf8').trim();
        mainContent.push(content);
        console.log(`  ✓ Added utility: ${utilityFile}`);
    }

    // Write the main stylesheet with single line breaks between files
    const outputPath = path.join(CONFIG.stylesheets.outputDir, 'indux.css');
    fs.writeFileSync(outputPath, mainContent.join('\n\n'));
    console.log(`  ✓ Created indux.css`);
    console.log('');
}

// Strip base layer popover styles from content (used when compiling into main indux.css)
function stripBaseLayerPopoverStyles(content) {
    // Remove the base layer popover styles that are already included in indux.reset.css
    // This function finds @layer base blocks that contain :where([popover]) and removes them
    
    const lines = content.split('\n');
    const result = [];
    let inBaseLayer = false;
    let braceCount = 0;
    let foundPopover = false;
    let baseLayerStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line contains @layer base
        if (line.includes('@layer base')) {
            inBaseLayer = true;
            braceCount = 0;
            foundPopover = false;
            baseLayerStart = i;
        }
        
        if (inBaseLayer) {
            // Count braces to track nesting
            for (const char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            
            // Check if this line contains :where([popover])
            if (line.includes(':where([popover])')) {
                foundPopover = true;
            }
            
            // If we've closed all braces and found popover styles, skip this block
            if (braceCount === 0 && foundPopover) {
                inBaseLayer = false;
                foundPopover = false;
                baseLayerStart = -1;
                continue; // Skip adding this line
            }
            
            // If we've closed all braces but didn't find popover styles, add the block
            if (braceCount === 0 && !foundPopover) {
                // Add all lines from baseLayerStart to current line
                for (let j = baseLayerStart; j <= i; j++) {
                    result.push(lines[j]);
                }
                inBaseLayer = false;
                foundPopover = false;
                baseLayerStart = -1;
                continue;
            }
            
            // If we're still inside the block, continue without adding
            if (braceCount > 0) {
                continue;
            }
        }
        
        // Add line if we're not in a base layer block
        if (!inBaseLayer) {
            result.push(line);
        }
    }
    
    // Clean up extra blank lines that might have been left after removing @layer base blocks
    const cleanedResult = [];
    for (let i = 0; i < result.length; i++) {
        const line = result[i];
        const nextLine = result[i + 1];
        const prevLine = result[i - 1];
        
        // Skip blank lines that are followed by another blank line
        if (line.trim() === '' && nextLine && nextLine.trim() === '') {
            continue;
        }
        
        // Skip blank lines that are at the start of a file
        if (line.trim() === '' && cleanedResult.length === 0) {
            continue;
        }
        
        // Skip blank lines that come right after a comment (like /* Dropdowns */)
        if (line.trim() === '' && prevLine && prevLine.trim().startsWith('/*') && prevLine.trim().endsWith('*/')) {
            continue;
        }
        
        cleanedResult.push(line);
    }
    
    return cleanedResult.join('\n');
}

// Handle files that need popover.css appended
function handlePopoverDependentFiles() {
    console.log('Processing popover-dependent files...');
    console.log('  ✓ Popover-dependent files are handled in main indux.css build');
    console.log('  ✓ Individual files available in styles/elements/ for standalone use');
    console.log('');
}

// Copy indux.css to docs and starter template directories
function copyInduxCssToTargets() {
    console.log('Copying indux.css to target directories...');

    const cssSource = path.join('styles', 'indux.css');
    
    if (!fs.existsSync(cssSource)) {
        console.warn('  ⚠ Warning: indux.css not found, skipping copy');
        return;
    }

    // Copy to docs/styles
    const docsStylesDir = path.join('..', 'docs', 'styles');
    if (!fs.existsSync(docsStylesDir)) {
        fs.mkdirSync(docsStylesDir, { recursive: true });
    }
    const cssDocsDest = path.join(docsStylesDir, 'indux.css');
    fs.copyFileSync(cssSource, cssDocsDest);
    console.log('  ✓ Copied indux.css to docs/styles');

    // Copy to templates/starter/styles
    const starterStylesDir = path.join('..', 'templates', 'starter', 'styles');
    if (!fs.existsSync(starterStylesDir)) {
        fs.mkdirSync(starterStylesDir, { recursive: true });
    }
    const cssStarterDest = path.join(starterStylesDir, 'indux.css');
    fs.copyFileSync(cssSource, cssStarterDest);
    console.log('  ✓ Copied indux.css to templates/starter/styles');

    console.log('');
}


// Handle files that need group.css appended
function handleGroupDependentFiles() {
    console.log('Processing group-dependent files...');

    const groupPath = path.join('styles/snippets', 'group.css');
    if (!fs.existsSync(groupPath)) {
        console.warn('  ⚠ Warning: group.css not found, skipping dependent files');
        return;
    }

    const groupContent = fs.readFileSync(groupPath, 'utf8');

    // Add indux.select.css to the list of group-dependent files
    const groupDependent = [...CONFIG.stylesheets.groupDependent, 'indux.select.css'];

    for (const dependentFile of groupDependent) {
        const sourcePath = path.join('styles/elements', dependentFile);
        const outputPath = path.join(CONFIG.stylesheets.outputDir, dependentFile);

        if (fs.existsSync(sourcePath)) {
            const originalContent = fs.readFileSync(sourcePath, 'utf8');
            const combinedContent = originalContent + '\n\n' + groupContent;

            fs.writeFileSync(outputPath, combinedContent);
            console.log(`  ✓ Processed ${dependentFile} with group.css`);
        } else {
            console.warn(`  ⚠ Warning: ${dependentFile} not found`);
        }
    }
    console.log('');
}

// Combine subscripts into a single file
function combineSubscripts(subscriptFiles, outputFile, systemName) {
    console.log(`Building ${systemName} monolith...`);

    const combinedContent = [];
    const componentDir = path.join('scripts', systemName);

    // Combine all subscripts
    let filesFound = 0;
    for (const file of subscriptFiles) {
        const filePath = path.join(componentDir, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            combinedContent.push(content);
            console.log(`  ✓ Added ${file}`);
            filesFound++;
        } else {
            console.warn(`  ⚠ Warning: ${file} not found`);
        }
    }

    // Only write the file if we found at least one subscript
    if (filesFound > 0) {
        const outputPath = path.join('scripts', outputFile);
        fs.writeFileSync(outputPath, combinedContent.join('\n\n'));
        console.log(`  ✓ Created ${outputFile}`);
    } else {
        console.log(`  ⚠ No files found for ${systemName}, skipping ${outputFile}`);
    }
    console.log('');
}

// Build rollup entry files
function buildRollupFiles() {
    console.log('Building rollup entry files...\n');

    // Get all plugin files
    const otherPluginFiles = glob.sync('scripts/indux.*.js', {
        ignore: CONFIG.ignorePatterns
    }).sort();

    const pluginFiles = [...CONFIG.corePlugins, ...otherPluginFiles];


    // Create main rollup entry
    const entryContent = pluginFiles
        .map(file => `import './${path.basename(file)}';`)
        .join('\n');

    // Add dependency exports
    const exportConstants = `// Additional dependencies for Alpine+Tailwind build
// Update these filenames as needed when versions change
export const TAILWIND_V4_FILE = '${CONFIG.dependencies.TAILWIND_V4_FILE}';
export const ALPINE_FILE = '${CONFIG.dependencies.ALPINE_FILE}';`;

    const finalEntryContent = entryContent + '\n\n' + exportConstants;

    // Write main rollup entry
    const entryPath = path.join('scripts', 'rollup.js');
    fs.writeFileSync(entryPath, finalEntryContent);
    console.log('  ✓ Created rollup.js');

    // Create Alpine+Tailwind entry
    const alpineTailwindEntryContent = [
        `import './${CONFIG.dependencies.TAILWIND_V4_FILE}';`,
        `import './indux.utilities.js';`,
        // Import all Indux plugins
        ...pluginFiles.map(file => `import './${path.basename(file)}';`),
        `import './${CONFIG.dependencies.ALPINE_FILE}';`
    ].join('\n');

    const alpineTailwindEntryPath = path.join('scripts', 'rollup.quickstart.temp.js');
    fs.writeFileSync(alpineTailwindEntryPath, alpineTailwindEntryContent);
    console.log('  ✓ Created rollup.quickstart.temp.js');


    console.log('✓ Rollup files built successfully!\n');
}

// Create rollup configuration
function createRollupConfig() {
    console.log('Creating rollup configuration...\n');


    const rollupConfig = `import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs';
import path from 'path';

// Create both configurations
const baseConfig = {
    plugins: [
        resolve(),
        commonjs()
    ]
};


// Cleanup plugin for quickstart (cleans up after both builds)
const quickstartCleanupPlugin = {
    name: 'quickstart-cleanup',
    writeBundle() {
        // Clean up temporary files
        try {
            fs.unlinkSync('scripts/rollup.quickstart.temp.js');
        } catch (e) {
            // Files may already be cleaned up
        }
    }
};

// Copy to docs and starter template plugin (runs after quickstart build)
const copyToDocsPlugin = {
    name: 'copy-to-docs',
    writeBundle() {
        // Copy files to docs and starter template directories after build
        try {
            // Ensure docs directories exist
            const docsScriptsDir = path.join('..', 'docs', 'scripts');
            const docsStylesDir = path.join('..', 'docs', 'styles');
            
            if (!fs.existsSync(docsScriptsDir)) {
                fs.mkdirSync(docsScriptsDir, { recursive: true });
            }
            if (!fs.existsSync(docsStylesDir)) {
                fs.mkdirSync(docsStylesDir, { recursive: true });
            }

            // Ensure starter template directories exist
            const starterScriptsDir = path.join('..', 'templates', 'starter', 'scripts');
            const starterStylesDir = path.join('..', 'templates', 'starter', 'styles');
            
            if (!fs.existsSync(starterScriptsDir)) {
                fs.mkdirSync(starterScriptsDir, { recursive: true });
            }
            if (!fs.existsSync(starterStylesDir)) {
                fs.mkdirSync(starterStylesDir, { recursive: true });
            }

            // Copy indux.quickstart.js to both docs and starter
            const quickstartSource = path.join('scripts', 'indux.quickstart.js');
            const quickstartDocsDest = path.join(docsScriptsDir, 'indux.quickstart.js');
            const quickstartStarterDest = path.join(starterScriptsDir, 'indux.quickstart.js');

            if (fs.existsSync(quickstartSource)) {
                fs.copyFileSync(quickstartSource, quickstartDocsDest);
                fs.copyFileSync(quickstartSource, quickstartStarterDest);
                console.log('  ✓ Copied indux.quickstart.js to docs/scripts and templates/starter/scripts');
            } else {
                console.warn('  ⚠ Warning: indux.quickstart.js not found');
            }

            // Copy indux.css to both docs and starter
            const cssSource = path.join('styles', 'indux.css');
            const cssDocsDest = path.join(docsStylesDir, 'indux.css');
            const cssStarterDest = path.join(starterStylesDir, 'indux.css');

            if (fs.existsSync(cssSource)) {
                fs.copyFileSync(cssSource, cssDocsDest);
                fs.copyFileSync(cssSource, cssStarterDest);
                console.log('  ✓ Copied indux.css to docs/styles and templates/starter/styles');
            } else {
                console.warn('  ⚠ Warning: indux.css not found');
            }
        } catch (e) {
            console.warn('  ⚠ Warning: Failed to copy files to docs and starter:', e.message);
        }
    }
};

export default [
    // Standard Indux build
    {
        ...baseConfig,
        input: 'scripts/rollup.js',
        output: {
            file: 'scripts/indux.js',
            format: 'iife',
            name: 'Indux',
            banner: \`/*  Indux JS\n/*  By Andrew Matlock under MIT license\n/*  https://github.com/andrewmatlock/Indux\n/*\n/*  Contains all Indux plugins bundled with Iconify (iconify.design)\n/*\n/*  With on-demand reference to:\n/*  - highlight.js (https://highlightjs.org)\n/*  - js-yaml (https://nodeca.github.io/js-yaml)\n/*  - Marked JS (https://marked.js.org)\n/*\n/*  Requires Alpine JS (alpinejs.dev) to operate.\n*/\n\n\` // Add header
        },
        plugins: [
            ...baseConfig.plugins
        ]
    },
    // Alpine+Tailwind build
    {
        ...baseConfig,
        input: 'scripts/rollup.quickstart.temp.js',
        output: {
            file: 'scripts/indux.quickstart.js',
            format: 'iife',
            name: 'InduxAlpineTailwind',
            banner: \`/*  Indux JS - Quickstart\n/*  By Andrew Matlock under MIT license\n/*  https://github.com/andrewmatlock/Indux\n/*\n/*  Contains all Indux plugins bundled with:\n/*  - Alpine JS (alpinejs.dev)\n/*  - Iconify (iconify.design)\n/*  - Tailwind CSS (modified Play CDN script) (tailwindcss.com)\n/*\n/*  With on-demand reference to:\n/*  - highlight.js (https://highlightjs.org)\n/*  - js-yaml (https://nodeca.github.io/js-yaml)\n/*  - Marked JS (https://marked.js.org)\n*/\n\n\` // Add header
        },
        plugins: [
            ...baseConfig.plugins,
            quickstartCleanupPlugin,
            copyToDocsPlugin
        ]
    }
];`;

    fs.writeFileSync('rollup.config.mjs', rollupConfig);
    console.log('  ✓ Created rollup.config.mjs');
    console.log('✓ Rollup configuration created successfully!\n');
}

// Main build function
async function build() {
    console.log('🚀 Starting Indux build process...\n');

    try {
        // Step 1: Build subscripts
        buildSubscripts();

        // Step 2: Build stylesheets
        buildStylesheets();

        // Step 3: Build rollup files
        buildRollupFiles();

        // Step 4: Create rollup config
        createRollupConfig();

        console.log('✅ Build process completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run build');
        console.log('2. This will execute rollup with the generated config');
        console.log('3. Files will be copied to docs after rollup completes');

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Copy specific files to docs directory
function copyToDocs() {
    console.log('Copying files to docs...');

    // Ensure docs directories exist
    const docsScriptsDir = path.join('..', 'docs', 'scripts');
    const docsStylesDir = path.join('..', 'docs', 'styles');
    
    if (!fs.existsSync(docsScriptsDir)) {
        fs.mkdirSync(docsScriptsDir, { recursive: true });
    }
    if (!fs.existsSync(docsStylesDir)) {
        fs.mkdirSync(docsStylesDir, { recursive: true });
    }

    // Copy indux.quickstart.js to docs/scripts
    const quickstartSource = path.join('scripts', 'indux.quickstart.js');
    const quickstartDest = path.join(docsScriptsDir, 'indux.quickstart.js');

    if (fs.existsSync(quickstartSource)) {
        fs.copyFileSync(quickstartSource, quickstartDest);
        console.log('  ✓ Copied indux.quickstart.js to docs/scripts');
    } else {
        console.warn('  ⚠ Warning: indux.quickstart.js not found');
    }

    // Copy indux.css to docs/styles
    const cssSource = path.join('styles', 'indux.css');
    const cssDest = path.join(docsStylesDir, 'indux.css');

    if (fs.existsSync(cssSource)) {
        fs.copyFileSync(cssSource, cssDest);
        console.log('  ✓ Copied indux.css to docs/styles');
    } else {
        console.warn('  ⚠ Warning: indux.css not found');
    }

    console.log('');
}

// Run the build
build(); 
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
        '**/indux.example_plugin.js',
        '**/indux.tailwind.compiler.js',
        '**/alpine.v3.*.js',
        '**/tailwind.*.js',
        'scripts/indux.js',
        'scripts/indux.alpine.tailwind.js',
        'scripts/rollup.js',
        'scripts/rollup.alpine.tailwind.js',
        'scripts/rollup.alpine.tailwind.temp.js',
        'scripts/components/**',
        'scripts/router/**'
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
        popoverDependent: ['indux.dropdown.css', 'indux.modal.css', 'indux.tooltip.css'],

        // Files that need group.css appended
        groupDependent: ['indux.button.css', 'indux.input.css'],

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

    // Step 1: Duplicate all files from source directories
    duplicateStylesheets();

    // Step 2: Build the main indux.css file
    buildMainStylesheet();

    // Step 3: Handle special popover-dependent files
    handlePopoverDependentFiles();

    // Step 4: Handle special group-dependent files
    handleGroupDependentFiles();

    // Step 5: Copy files to docs and create scoped version
    copyToDocsAndScope();

    console.log('✓ Stylesheets built successfully!\n');
}

// Duplicate all stylesheet files from source directories to output directory
function duplicateStylesheets() {
    console.log('Duplicating stylesheet files...');

    for (const sourceDir of CONFIG.stylesheets.sourceDirs) {
        const files = glob.sync(`${sourceDir}/*.css`);

        for (const file of files) {
            const filename = path.basename(file);
            const outputPath = path.join(CONFIG.stylesheets.outputDir, filename);

            // Skip if it's a popover-dependent or group-dependent file (will be handled separately)
            if (CONFIG.stylesheets.popoverDependent.includes(filename) ||
                CONFIG.stylesheets.groupDependent.includes(filename)) {
                continue;
            }

            fs.copyFileSync(file, outputPath);
            console.log(`  ✓ Duplicated ${filename}`);
        }
    }
    console.log('');
}

// Build the main indux.css file
function buildMainStylesheet() {
    console.log('Building main indux.css...');

    const mainContent = [];

    // Add header comment
    mainContent.push('/*! Indux CSS 1.0.0 - MIT License */');

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
        const content = fs.readFileSync(elementPath, 'utf8').trim();
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

// Handle files that need popover.css appended
function handlePopoverDependentFiles() {
    console.log('Processing popover-dependent files...');

    const popoverPath = path.join('styles/snippets', 'popover.css');
    if (!fs.existsSync(popoverPath)) {
        console.warn('  ⚠ Warning: popover.css not found, skipping dependent files');
        return;
    }

    const popoverContent = fs.readFileSync(popoverPath, 'utf8');

    for (const dependentFile of CONFIG.stylesheets.popoverDependent) {
        const sourcePath = path.join('styles/elements', dependentFile);
        const outputPath = path.join(CONFIG.stylesheets.outputDir, dependentFile);

        if (fs.existsSync(sourcePath)) {
            const originalContent = fs.readFileSync(sourcePath, 'utf8');
            const combinedContent = originalContent + '\n\n' + popoverContent;

            fs.writeFileSync(outputPath, combinedContent);
            console.log(`  ✓ Processed ${dependentFile} with popover.css`);
        } else {
            console.warn(`  ⚠ Warning: ${dependentFile} not found`);
        }
    }
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

// Copy built files to docs and create scoped version
function copyToDocsAndScope() {
    console.log('Copying files to docs and creating scoped version...');

    // Ensure docs/assets directory exists
    const docsAssetsDir = path.join('..', 'docs', 'assets');
    if (!fs.existsSync(docsAssetsDir)) {
        fs.mkdirSync(docsAssetsDir, { recursive: true });
    }

    // Copy indux.alpine.tailwind.js
    const alpineTailwindSource = path.join('scripts', 'indux.alpine.tailwind.js');
    const alpineTailwindDest = path.join(docsAssetsDir, 'indux.alpine.tailwind.js');

    if (fs.existsSync(alpineTailwindSource)) {
        fs.copyFileSync(alpineTailwindSource, alpineTailwindDest);
        console.log('  ✓ Copied indux.alpine.tailwind.js to docs/assets');
    } else {
        console.warn('  ⚠ Warning: indux.alpine.tailwind.js not found');
    }

    // Copy and scope indux.css
    const cssSource = path.join('styles', 'indux.css');
    const cssDest = path.join(docsAssetsDir, 'indux.css');

    if (fs.existsSync(cssSource)) {
        const cssContent = fs.readFileSync(cssSource, 'utf8');
        const scopedContent = scopeCSSForFrame(cssContent);

        fs.writeFileSync(cssDest, scopedContent);
        console.log('  ✓ Created scoped indux.css for docs/assets');
    } else {
        console.warn('  ⚠ Warning: indux.css not found');
    }

    console.log('');
}

// Scope CSS content to .frame element using targeted regex replace
function scopeCSSForFrame(cssContent) {
    // Replace @layer base { and @layer utilities { with .frame {
    let result = cssContent
        .replace(/(^|\n)(\s*)@layer base \{/g, '$1$2.frame {')
        .replace(/(^|\n)(\s*)@layer utilities \{/g, '$1$2.frame {');

    // Replace top-level :root { with .frame { (not .frame :root {)
    result = result
        .replace(/(^|\n)([ \t]*):root \{/g, '$1$2.frame {')
        .replace(/(^|\n)([ \t]*)\.dark \{/g, '$1$2.frame .dark {');

    return result;
}

// Combine subscripts into a single file
function combineSubscripts(subscriptFiles, outputFile, systemName) {
    console.log(`Building ${systemName} monolith...`);

    const combinedContent = [];
    const componentDir = path.join('scripts', systemName);

    // Add header comment
    combinedContent.push(`/*! Indux ${systemName.charAt(0).toUpperCase() + systemName.slice(1)} 1.0.0 - MIT License */`);
    combinedContent.push('');

    // Combine all subscripts
    let filesFound = 0;
    for (const file of subscriptFiles) {
        const filePath = path.join(componentDir, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            // Remove the header comment from each file (first line)
            const lines = content.split('\n');
            const contentWithoutHeader = lines.slice(1).join('\n');
            combinedContent.push(contentWithoutHeader);
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

    // Handle markdown plugin specially - extract raw CDN script and custom plugin code
    const markdownPluginPath = 'scripts/indux.markdown.js';
    const markdownContent = fs.readFileSync(markdownPluginPath, 'utf8');
    const lines = markdownContent.split('\n');

    // First 2 lines contain the raw Marked CDN script (must stay at root level)
    const markedScript = lines.slice(0, 2).join('\n');

    // Remaining lines are our custom plugin code (can be wrapped in function)
    const pluginCode = lines.slice(2).join('\n');

    // Write temporary plugin file with just the custom code
    const tempPluginPath = path.join('scripts', 'temp.plugin.js');
    fs.writeFileSync(tempPluginPath, pluginCode);

    // Create main rollup entry (excluding markdown plugin since it's handled specially)
    const entryContent = pluginFiles
        .filter(file => file !== 'scripts/indux.markdown.js')
        .map(file => `import './${path.basename(file)}';`)
        .join('\n') + '\nimport "./temp.plugin.js";';

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
        // Import all Indux plugins (excluding markdown since it's handled specially)
        ...pluginFiles
            .filter(file => file !== 'scripts/indux.markdown.js')
            .map(file => `import './${path.basename(file)}';`),
        `import "./temp.plugin.js";`,
        `import './${CONFIG.dependencies.ALPINE_FILE}';`
    ].join('\n');

    const alpineTailwindEntryPath = path.join('scripts', 'rollup.alpine.tailwind.temp.js');
    fs.writeFileSync(alpineTailwindEntryPath, alpineTailwindEntryContent);
    console.log('  ✓ Created rollup.alpine.tailwind.temp.js');

    // Store marked script for rollup config
    global.markedScript = markedScript;

    console.log('✓ Rollup files built successfully!\n');
}

// Create rollup configuration
function createRollupConfig() {
    console.log('Creating rollup configuration...\n');

    // Escape the marked script for safe embedding
    const escapedMarkedScript = global.markedScript
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    const rollupConfig = `import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import fs from 'fs';

// Create both configurations
const baseConfig = {
    plugins: [
        resolve(),
        commonjs()
    ]
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
            intro: \`${escapedMarkedScript}\` // Add Marked script at the very beginning
        },
        onwrite: () => {
            // Clean up temporary files
            try {
                fs.unlinkSync('scripts/temp.plugin.js');
                fs.unlinkSync('scripts/rollup.alpine.tailwind.temp.js');
            } catch (e) {
                // Files may already be cleaned up
            }
        }
    },
    // Alpine+Tailwind build
    {
        ...baseConfig,
        input: 'scripts/rollup.alpine.tailwind.temp.js',
        output: {
            file: 'scripts/indux.alpine.tailwind.js',
            format: 'iife',
            name: 'InduxAlpineTailwind',
            intro: \`${escapedMarkedScript}\` // Add Marked script at the very beginning
        },
        onwrite: () => {
            // Clean up temporary files
            try {
                fs.unlinkSync('scripts/temp.plugin.js');
                fs.unlinkSync('scripts/rollup.alpine.tailwind.temp.js');
            } catch (e) {
                // Files may already be cleaned up
            }
        }
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

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run the build
build(); 
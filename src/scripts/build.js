#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import cssnano from 'cssnano';
import postcss from 'postcss';

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
        'indux.router.head.js',
        'indux.router.anchors.js',
        'indux.router.magic.js'
    ],

    // Utilities subscripts order
    utilitiesSubscripts: [
        'indux.utilities.generators.js',
        'indux.utilities.variants.js',
        'indux.utilities.main.js',
        'indux.utilities.sync.js',
        'indux.utilities.cache.js',
        'indux.utilities.helpers.js',
        'indux.utilities.compile.js',
        'indux.utilities.observation.js',
        'indux.utilities.init.js'
    ],

    // Auth subscripts order
    authSubscripts: [
        'indux.appwrite.auth.config.js',
        'indux.appwrite.auth.store.js',
        'indux.appwrite.auth.main.js',
        'indux.appwrite.auth.frontend.js',
        'indux.appwrite.auth.teams.core.js',
        'indux.appwrite.auth.teams.defaults.js',
        'indux.appwrite.auth.teams.roles.defaults.js',
        'indux.appwrite.auth.teams.roles.js',
        'indux.appwrite.auth.teams.userRoles.js',
        'indux.appwrite.auth.teams.members.js',
        'indux.appwrite.auth.teams.callbacks.js',
        'indux.appwrite.auth.teams.convenience.js',
        'indux.appwrite.auth.users.anonymous.js',
        'indux.appwrite.auth.users.magic.js',
        'indux.appwrite.auth.users.oauth.js',
        'indux.appwrite.auth.users.callbacks.js'
    ],

    // Core plugins that should load first
    corePlugins: ['scripts/indux.components.js'],

    // Files to ignore in rollup
    ignorePatterns: [
        'scripts/components/**',
        'scripts/router/**',
        'scripts/auth/**',
        '**/alpine.v3.*.js',
        'scripts/indux.js',
        'scripts/indux.quickstart.js',
        'scripts/indux.code.js',
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
        coreFiles: ['indux.reset.css'],

        // Files that need popover.css appended
        popoverDependent: ['indux.dropdown.css', 'indux.dialog.css', 'indux.sidebar.css', 'indux.tooltip.css'],

        // Files that need group.css appended
        groupDependent: [],

        // Files to distribute as standalone (excluded from main indux.css)
        standaloneFiles: ['indux.theme.css', 'indux.code.css'],
        
        // Files that should be minified
        minifyFiles: ['indux.css', 'indux.code.css'],
        
        // Files that should only be copied to docs (not starter template)
        docsOnlyFiles: ['indux.code.css'],

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

    // Build utilities
    combineSubscripts(CONFIG.utilitiesSubscripts, 'indux.utilities.js', 'utilities');

    // Build auth
    combineSubscripts(CONFIG.authSubscripts, 'indux.appwrite.auth.js', 'auth');

    console.log('✓ Subscripts built successfully!\n');
}

// Build stylesheets
async function buildStylesheets() {
    console.log('Building stylesheets...\n');

    // Step 1: Build the main indux.css file
    buildMainStylesheet();

    // Step 2: Minify CSS files
    await minifyCssFiles();

    // Step 3: Distribute standalone files
    distributeStandaloneFiles();

    // Step 4: Handle special popover-dependent files
    handlePopoverDependentFiles();

    // Step 5: Handle special group-dependent files
    handleGroupDependentFiles();

    // Step 6: Sync starter template to create-starter package
    syncStarterTemplate();

}


// Build the main indux.css file
function buildMainStylesheet() {
    console.log('Building main indux.css...');

    const mainContent = [];

    // Add header comment
    mainContent.push('/*  Indux CSS\n/*  By Andrew Matlock under MIT license\n/*  https://indux.build\n/*  Modify referenced variables in indux.theme.css\n*/');

    // Step 1: Add core files in order
    for (const coreFile of CONFIG.stylesheets.coreFiles) {
        const corePath = path.join('styles/core', coreFile);
        if (fs.existsSync(corePath)) {
            const content = fs.readFileSync(corePath, 'utf8').trim();
            mainContent.push(content);
            console.log(`  ✓ Added core: ${coreFile}`);
        }
    }

    // Step 2: Add elements files in alphabetical order (excluding standalone files)
    const elementFiles = glob.sync('styles/elements/*.css')
        .map(file => path.basename(file))
        .filter(file => !CONFIG.stylesheets.standaloneFiles.includes(file))
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

// Minify CSS files
async function minifyCssFiles() {
    console.log('Minifying CSS files...');

    for (const cssFile of CONFIG.stylesheets.minifyFiles) {
        await minifyCssFile(cssFile);
    }
}

// Minify a single CSS file
async function minifyCssFile(cssFileName) {
    console.log(`Minifying ${cssFileName}...`);

    // Determine source directory based on file
    let sourceDir = CONFIG.stylesheets.outputDir;
    if (cssFileName === 'indux.code.css') {
        sourceDir = 'styles/elements';
    }
    
    const cssPath = path.join(sourceDir, cssFileName);
    
    if (!fs.existsSync(cssPath)) {
        console.warn(`  ⚠ Warning: ${cssFileName} not found, skipping minification`);
        return;
    }

    try {
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Configure cssnano options - conservative settings for framework CSS
        const processor = postcss([
            cssnano({
                preset: ['default', {
                    // Safe optimizations that don't remove CSS
                    discardComments: {
                        removeAll: true,
                    },
                    normalizeWhitespace: true,
                    colormin: true,
                    convertValues: true,
                    mergeIdents: true,
                    mergeLonghand: true,
                    mergeRules: true,
                    minifyFontValues: true,
                    minifyGradients: true,
                    minifyParams: true,
                    minifySelectors: true,
                    normalizeCharset: true,
                    normalizeDisplayValues: true,
                    normalizePositions: true,
                    normalizeRepeatStyle: true,
                    normalizeString: true,
                    normalizeTimingFunctions: true,
                    normalizeUnicode: true,
                    normalizeUrl: true,
                    orderedValues: true,
                    reduceIdents: true,
                    reduceInitial: true,
                    reduceTransforms: true,
                    svgo: true,
                    uniqueSelectors: true,
                    
                    // Disable potentially dangerous optimizations for framework CSS
                    discardDuplicates: false,    // Keep duplicates (might be intentional)
                    discardEmpty: false,         // Keep empty rules (might be placeholders)
                    discardOverridden: false,    // Keep overridden rules (might be needed for specificity)
                }]
            })
        ]);

        const result = await processor.process(cssContent, { from: cssPath });
        
        if (result.warnings && result.warnings.length > 0) {
            console.warn(`  ⚠ Warning: ${cssFileName} minification had warnings:`, result.warnings);
        }

        // Write the minified CSS
        const minifiedFileName = cssFileName.replace('.css', '.min.css');
        const minifiedPath = path.join(CONFIG.stylesheets.outputDir, minifiedFileName);
        fs.writeFileSync(minifiedPath, result.css);
        
        // Calculate compression ratio
        const originalSize = Buffer.byteLength(cssContent, 'utf8');
        const minifiedSize = Buffer.byteLength(result.css, 'utf8');
        const compressionRatio = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        console.log(`  ✓ Created ${minifiedFileName}`);
        console.log(`  ✓ Size: ${(originalSize / 1024).toFixed(1)}KB → ${(minifiedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);
        console.log('');
        
    } catch (error) {
        console.error(`  ❌ Error minifying ${cssFileName}:`, error.message);
    }
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

// Sync starter template to create-starter package
function syncStarterTemplate() {
    console.log('Syncing starter template to create-starter package...');

    const sourceDir = path.join('..', 'templates', 'starter');
    const targetDir = path.join('..', 'packages', 'create-starter', 'templates');

    if (!fs.existsSync(sourceDir)) {
        console.warn('  ⚠ Warning: templates/starter not found, skipping sync');
        return;
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
        // Copy all files from templates/starter to packages/create-starter/templates
        const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const sourcePath = path.join(sourceDir, entry.name);
            const targetPath = path.join(targetDir, entry.name);
            
            if (entry.isDirectory()) {
                // Recursively copy directories
                if (fs.existsSync(targetPath)) {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                }
                fs.cpSync(sourcePath, targetPath, { recursive: true });
                console.log(`  ✓ Synced directory: ${entry.name}`);
            } else {
                // Copy files
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`  ✓ Synced file: ${entry.name}`);
            }
        }
        
        console.log('  ✓ Starter template synced successfully');
    } catch (error) {
        console.warn('  ⚠ Warning: Failed to sync starter template:', error.message);
    }

    console.log('');
}

// Distribute standalone files
function distributeStandaloneFiles() {
    console.log('Distributing standalone files...');

    for (const standaloneFile of CONFIG.stylesheets.standaloneFiles) {
        // Determine source directory based on file
        let sourceDir = 'styles/elements';
        if (standaloneFile === 'indux.theme.css') {
            sourceDir = 'styles/core';
        }
        
        const sourcePath = path.join(sourceDir, standaloneFile);
        
        if (!fs.existsSync(sourcePath)) {
            console.warn(`  ⚠ Warning: ${standaloneFile} not found, skipping distribution`);
            continue;
        }

        // Copy to main styles directory
        const outputPath = path.join(CONFIG.stylesheets.outputDir, standaloneFile);
        fs.copyFileSync(sourcePath, outputPath);
        console.log(`  ✓ Copied ${standaloneFile} to styles/`);

        // Copy minified version if it exists
        const minifiedFile = standaloneFile.replace('.css', '.min.css');
        const minifiedSourcePath = path.join(CONFIG.stylesheets.outputDir, minifiedFile);
        if (fs.existsSync(minifiedSourcePath)) {
            const minifiedOutputPath = path.join(CONFIG.stylesheets.outputDir, minifiedFile);
            fs.copyFileSync(minifiedSourcePath, minifiedOutputPath);
            console.log(`  ✓ Copied ${minifiedFile} to styles/`);
        }

        // Note: Files are no longer copied to docs or templates/starter
        // These directories now maintain their own local file versions
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

// Function to copy files to dist directory for clean jsdelivr URLs
function copyFilesToDist() {
    console.log('Copying files to dist directory for clean jsdelivr URLs...');
    
    // Create dist directory if it doesn't exist
    const distDir = path.join('..', 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    const filesToCopy = [
        // Main bundled files
        { source: 'scripts/indux.js', dest: '../dist/indux.js' },
        { source: 'scripts/indux.quickstart.js', dest: '../dist/indux.quickstart.js' },
        { source: 'styles/indux.css', dest: '../dist/indux.css' },
        { source: 'styles/indux.min.css', dest: '../dist/indux.min.css' },
        { source: 'styles/indux.theme.css', dest: '../dist/indux.theme.css' },
        { source: 'styles/indux.code.css', dest: '../dist/indux.code.css' },
        { source: 'styles/indux.code.min.css', dest: '../dist/indux.code.min.css' },
        
        // Individual plugin files
        { source: 'scripts/indux.appwrite.auth.js', dest: '../dist/indux.appwrite.auth.js' },
        { source: 'scripts/indux.code.js', dest: '../dist/indux.code.js' },
        { source: 'scripts/indux.components.js', dest: '../dist/indux.components.js' },
        { source: 'scripts/indux.data.js', dest: '../dist/indux.data.js' },
        { source: 'scripts/indux.dropdowns.js', dest: '../dist/indux.dropdowns.js' },
        { source: 'scripts/indux.icons.js', dest: '../dist/indux.icons.js' },
        { source: 'scripts/indux.localization.js', dest: '../dist/indux.localization.js' },
        { source: 'scripts/indux.markdown.js', dest: '../dist/indux.markdown.js' },
        { source: 'scripts/indux.resize.js', dest: '../dist/indux.resize.js' },
        { source: 'scripts/indux.router.js', dest: '../dist/indux.router.js' },
        { source: 'scripts/indux.slides.js', dest: '../dist/indux.slides.js' },
        { source: 'scripts/indux.tabs.js', dest: '../dist/indux.tabs.js' },
        { source: 'scripts/indux.themes.js', dest: '../dist/indux.themes.js' },
        { source: 'scripts/indux.toasts.js', dest: '../dist/indux.toasts.js' },
        { source: 'scripts/indux.tooltips.js', dest: '../dist/indux.tooltips.js' },
        { source: 'scripts/indux.utilities.js', dest: '../dist/indux.utilities.js' },
        
        // Individual CSS files
        { source: 'styles/elements/indux.accordion.css', dest: '../dist/indux.accordion.css' },
        { source: 'styles/elements/indux.avatar.css', dest: '../dist/indux.avatar.css' },
        { source: 'styles/elements/indux.button.css', dest: '../dist/indux.button.css' },
        { source: 'styles/elements/indux.checkbox.css', dest: '../dist/indux.checkbox.css' },
        { source: 'styles/elements/indux.dialog.css', dest: '../dist/indux.dialog.css' },
        { source: 'styles/elements/indux.divider.css', dest: '../dist/indux.divider.css' },
        { source: 'styles/elements/indux.dropdown.css', dest: '../dist/indux.dropdown.css' },
        { source: 'styles/elements/indux.form.css', dest: '../dist/indux.form.css' },
        { source: 'styles/elements/indux.input.css', dest: '../dist/indux.input.css' },
        { source: 'styles/elements/indux.radio.css', dest: '../dist/indux.radio.css' },
        { source: 'styles/elements/indux.resize.css', dest: '../dist/indux.resize.css' },
        { source: 'styles/elements/indux.sidebar.css', dest: '../dist/indux.sidebar.css' },
        { source: 'styles/elements/indux.slides.css', dest: '../dist/indux.slides.css' },
        { source: 'styles/elements/indux.switch.css', dest: '../dist/indux.switch.css' },
        { source: 'styles/elements/indux.table.css', dest: '../dist/indux.table.css' },
        { source: 'styles/elements/indux.toast.css', dest: '../dist/indux.toast.css' },
        { source: 'styles/elements/indux.tooltip.css', dest: '../dist/indux.tooltip.css' },
        { source: 'styles/elements/indux.typography.css', dest: '../dist/indux.typography.css' },
        { source: 'styles/utilities/indux.utilities.css', dest: '../dist/indux.utilities.css' }
    ];

    for (const file of filesToCopy) {
        if (fs.existsSync(file.source)) {
            fs.copyFileSync(file.source, file.dest);
            console.log('  ✓ Copied ' + file.source + ' → ' + file.dest);
        } else {
            console.warn('  ⚠ Warning: ' + file.source + ' not found, skipping');
        }
    }
    
    console.log('');
}

// Copy to dist plugin (runs after quickstart build)
const copyToDistPlugin = {
    name: 'copy-to-dist',
    writeBundle() {
        // Copy files to dist directory for clean jsdelivr URLs
        copyFilesToDist();
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
            banner: \`/*  Indux JS\n/*  By Andrew Matlock under MIT license\n/*  https://github.com/andrewmatlock/Indux\n/*\n/*  Contains all Indux plugins bundled with Iconify (iconify.design)\n/*\n/*  With on-demand reference to:\n/*  - js-yaml (https://nodeca.github.io/js-yaml)\n/*  - Marked JS (https://marked.js.org)\n/*\n/*  Requires Alpine JS (alpinejs.dev) to operate.\n/*  Some plugins use Indux CSS styles.\n*/\n\n\` // Add header
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
            banner: \`/*  Indux JS - Quickstart\n/*  By Andrew Matlock under MIT license\n/*  https://indux.build\n/*\n/*  Contains all Indux plugins bundled with:\n/*  - Alpine JS (alpinejs.dev)\n/*  - Iconify (iconify.design)\n/*  - Tailwind CSS (modified Play CDN script) (tailwindcss.com)\n/*\n/*  With on-demand reference to:\n/*  - js-yaml (https://nodeca.github.io/js-yaml)\n/*  - Marked JS (https://marked.js.org)\n/*\n/*  Some plugins use Indux CSS styles.\n*/\n\n\` // Add header
        },
        plugins: [
            ...baseConfig.plugins,
            quickstartCleanupPlugin,
            copyToDistPlugin
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
        await buildStylesheets();

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
    const cssMinSource = path.join('styles', 'indux.min.css');
    const cssDest = path.join(docsStylesDir, 'indux.css');
    const cssMinDest = path.join(docsStylesDir, 'indux.min.css');

    if (fs.existsSync(cssSource)) {
        fs.copyFileSync(cssSource, cssDest);
        console.log('  ✓ Copied indux.css to docs/styles');
    } else {
        console.warn('  ⚠ Warning: indux.css not found');
    }

    if (fs.existsSync(cssMinSource)) {
        fs.copyFileSync(cssMinSource, cssMinDest);
        console.log('  ✓ Copied indux.min.css to docs/styles');
    } else {
        console.warn('  ⚠ Warning: indux.min.css not found');
    }

    // Copy standalone files to docs/styles
    for (const standaloneFile of CONFIG.stylesheets.standaloneFiles) {
        const source = path.join('styles', standaloneFile);
        const dest = path.join(docsStylesDir, standaloneFile);

        if (fs.existsSync(source)) {
            fs.copyFileSync(source, dest);
            console.log(`  ✓ Copied ${standaloneFile} to docs/styles`);
        } else {
            console.warn(`  ⚠ Warning: ${standaloneFile} not found`);
        }

        // Copy minified version if it exists
        const minifiedFile = standaloneFile.replace('.css', '.min.css');
        const minifiedSource = path.join('styles', minifiedFile);
        const minifiedDest = path.join(docsStylesDir, minifiedFile);

        if (fs.existsSync(minifiedSource)) {
            fs.copyFileSync(minifiedSource, minifiedDest);
            console.log(`  ✓ Copied ${minifiedFile} to docs/styles`);
        }
    }

    console.log('');
}

// Copy files to root for clean npm package structure
function copyFilesToRoot() {
    console.log('Copying files to root for clean npm package structure...');

    const filesToCopy = [
        { source: 'scripts/indux.js', dest: 'indux.js' },
        { source: 'scripts/indux.quickstart.js', dest: 'indux.quickstart.js' },
        { source: 'styles/indux.css', dest: 'indux.css' },
        { source: 'styles/indux.min.css', dest: 'indux.min.css' },
        { source: 'styles/indux.theme.css', dest: 'indux.theme.css' },
        { source: 'styles/indux.code.css', dest: 'indux.code.css' },
        { source: 'styles/indux.code.min.css', dest: 'indux.code.min.css' }
    ];

    for (const file of filesToCopy) {
        const sourcePath = path.join('..', file.source);
        const destPath = path.join('..', file.dest);

        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`  ✓ Copied ${file.source} → ${file.dest}`);
        } else {
            console.warn(`  ⚠ Warning: ${file.source} not found, skipping`);
        }
    }

    console.log('');
}

// Copy files to package root with clean filenames for npm package
function createDistDirectory() {
    console.log('Copying files to package root with clean filenames...');

    const filesToCopy = [
        { source: 'scripts/indux.js', dest: 'indux.js' },
        { source: 'scripts/indux.quickstart.js', dest: 'indux.quickstart.js' },
        { source: 'styles/indux.css', dest: 'indux.css' },
        { source: 'styles/indux.min.css', dest: 'indux.min.css' },
        { source: 'styles/indux.theme.css', dest: 'indux.theme.css' },
        { source: 'styles/indux.code.css', dest: 'indux.code.css' },
        { source: 'styles/indux.code.min.css', dest: 'indux.code.min.css' }
    ];

    for (const file of filesToCopy) {
        const sourcePath = path.join('..', file.source);
        const destPath = path.join('..', file.dest);

        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`  ✓ Copied ${file.source} → ${file.dest}`);
        } else {
            console.warn(`  ⚠ Warning: ${file.source} not found, skipping`);
        }
    }

    console.log('');
}

// Copy files to package root for clean jsdelivr URLs (only during build)
function copyFilesToPackageRoot() {
    console.log('Copying files to package root for clean jsdelivr URLs...');

    const filesToCopy = [
        { source: 'scripts/indux.js', dest: 'indux.js' },
        { source: 'scripts/indux.quickstart.js', dest: 'indux.quickstart.js' },
        { source: 'styles/indux.css', dest: 'indux.css' },
        { source: 'styles/indux.min.css', dest: 'indux.min.css' },
        { source: 'styles/indux.theme.css', dest: 'indux.theme.css' },
        { source: 'styles/indux.code.css', dest: 'indux.code.css' },
        { source: 'styles/indux.code.min.css', dest: 'indux.code.min.css' }
    ];

    for (const file of filesToCopy) {
        const sourcePath = path.join('..', file.source);
        const destPath = path.join('..', file.dest);

        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`  ✓ Copied ${file.source} → ${file.dest}`);
        } else {
            console.warn(`  ⚠ Warning: ${file.source} not found, skipping`);
        }
    }

    console.log('');
}

// Run the build
build(); 
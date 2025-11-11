import resolve from '@rollup/plugin-node-resolve';
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
            banner: `/*  Indux JS
/*  By Andrew Matlock under MIT license
/*  https://github.com/andrewmatlock/Indux
/*
/*  Contains all Indux plugins bundled with Iconify (iconify.design)
/*
/*  With on-demand reference to:
/*  - js-yaml (https://nodeca.github.io/js-yaml)
/*  - Marked JS (https://marked.js.org)
/*
/*  Requires Alpine JS (alpinejs.dev) to operate.
/*  Some plugins use Indux CSS styles.
*/

` // Add header
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
            banner: `/*  Indux JS - Quickstart
/*  By Andrew Matlock under MIT license
/*  https://indux.build
/*
/*  Contains all Indux plugins bundled with:
/*  - Alpine JS (alpinejs.dev)
/*  - Iconify (iconify.design)
/*  - Tailwind CSS (modified Play CDN script) (tailwindcss.com)
/*
/*  With on-demand reference to:
/*  - js-yaml (https://nodeca.github.io/js-yaml)
/*  - Marked JS (https://marked.js.org)
/*
/*  Some plugins use Indux CSS styles.
*/

` // Add header
        },
        plugins: [
            ...baseConfig.plugins,
            quickstartCleanupPlugin,
            copyToDistPlugin
        ]
    }
];
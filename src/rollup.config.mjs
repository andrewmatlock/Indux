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

// Cleanup plugin
const cleanupPlugin = {
    name: 'cleanup',
    writeBundle() {
        // Clean up temporary files
        try {
            fs.unlinkSync('scripts/temp.plugin.js');
        } catch (e) {
            // Files may already be cleaned up
        }
    }
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

// Copy to docs plugin (runs after quickstart build)
const copyToDocsPlugin = {
    name: 'copy-to-docs',
    writeBundle() {
        // Copy files to docs directory after build
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
        } catch (e) {
            console.warn('  ⚠ Warning: Failed to copy files to docs:', e.message);
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
            intro: `/*! Indux Markdown 1.0.0 - MIT License */
` // Add Marked script at the very beginning
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
            intro: `/*! Indux Markdown 1.0.0 - MIT License */
` // Add Marked script at the very beginning
        },
        plugins: [
            ...baseConfig.plugins,
            cleanupPlugin,
            quickstartCleanupPlugin,
            copyToDocsPlugin
        ]
    }
];
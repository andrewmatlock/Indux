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

            // Copy standalone files to docs and starter (with docs-only handling)
            for (const standaloneFile of CONFIG.stylesheets.standaloneFiles) {
                const source = path.join('styles', standaloneFile);
                const docsDest = path.join(docsStylesDir, standaloneFile);

                if (fs.existsSync(source)) {
                    // Always copy to docs
                    fs.copyFileSync(source, docsDest);
                    
                    // Copy to starter only if not docs-only
                    if (!CONFIG.stylesheets.docsOnlyFiles.includes(standaloneFile)) {
                        const starterDest = path.join(starterStylesDir, standaloneFile);
                        fs.copyFileSync(source, starterDest);
                        console.log('  ✓ Copied ' + standaloneFile + ' to docs/styles and templates/starter/styles');
                    } else {
                        console.log('  ✓ Copied ' + standaloneFile + ' to docs/styles (docs-only)');
                    }
                } else {
                    console.warn('  ⚠ Warning: ' + standaloneFile + ' not found');
                }
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
            banner: `/*  Indux JS
/*  By Andrew Matlock under MIT license
/*  https://github.com/andrewmatlock/Indux
/*
/*  Contains all Indux plugins bundled with Iconify (iconify.design)
/*
/*  With on-demand reference to:
/*  - highlight.js (https://highlightjs.org)
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
/*  - highlight.js (https://highlightjs.org)
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
            copyToDocsPlugin
        ]
    }
];
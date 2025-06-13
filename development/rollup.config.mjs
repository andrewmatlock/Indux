import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

// Define core plugins that should load first
const corePlugins = [
    'scripts/indux.components.js'
];

// Get all other plugin files, excluding example, third-party scripts, and output files
const otherPluginFiles = glob.sync('scripts/indux.*.js', {
    ignore: [
        '**/indux.example_plugin.js',
        '**/indux.tailwind.compiler.js',
        '**/alpine.*.js',
        '**/tailwind.*.js',
        'scripts/indux.js',
        'scripts/rollup.js',
        ...corePlugins
    ]
}).sort(); // Sort alphabetically

// Combine core plugins with other plugins
const pluginFiles = [...corePlugins, ...otherPluginFiles];

// Special handling for markdown plugin
const markdownPluginPath = 'scripts/indux.markdown.js';
const markdownContent = fs.readFileSync(markdownPluginPath, 'utf8');
const markedScript = markdownContent.split('\n').slice(0, 10).join('\n'); // Get first 10 lines containing Marked script
const pluginCode = markdownContent.split('\n').slice(10).join('\n'); // Get remaining plugin code

// Write temporary plugin file without Marked script
const tempPluginPath = path.join('scripts', 'temp.plugin.js');
fs.writeFileSync(tempPluginPath, pluginCode);

// Create a temporary entry file with correct relative imports, excluding markdown plugin
const entryContent = pluginFiles
    .filter(file => file !== 'scripts/indux.markdown.js')
    .map(file => `import './${path.basename(file)}';`)
    .join('\n') + '\nimport "./temp.plugin.js";';
const entryPath = path.join('scripts', 'rollup.js');
fs.writeFileSync(entryPath, entryContent);

export default {
    input: entryPath,
    output: {
        file: 'scripts/indux.js',
        format: 'iife',
        name: 'Indux',
        intro: markedScript // Add Marked script at the very beginning
    },
    plugins: [
        resolve(),
        commonjs()
    ],
    onwrite: () => {
        // Clean up temporary file
        fs.unlinkSync(tempPluginPath);
    }
};

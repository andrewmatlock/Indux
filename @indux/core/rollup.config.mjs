import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const plugins = [
    resolve(),
    commonjs(),
    terser({
        compress: {
            drop_console: true,
        },
        mangle: {
            toplevel: true,
        }
    }),
];

// Individual plugin builds
const pluginConfigs = [
    'components',
    'forms',
    'navigation',
    'ui'
].map(name => ({
    input: `src/plugins/${name}.js`,
    output: [
        {
            file: `dist/${name}.js`,
            format: 'iife',
            name: `Indux${name.charAt(0).toUpperCase() + name.slice(1)}`,
        },
        {
            file: `dist/${name}.min.js`,
            format: 'iife',
            name: `Indux${name.charAt(0).toUpperCase() + name.slice(1)}`,
            plugins: [terser()]
        }
    ],
    plugins
}));

// Main bundle
const mainConfig = {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/index.js',
            format: 'esm'
        },
        {
            file: 'dist/index.min.js',
            format: 'iife',
            name: 'Indux',
            plugins: [terser()]
        }
    ],
    plugins
};

export default [...pluginConfigs, mainConfig]; 
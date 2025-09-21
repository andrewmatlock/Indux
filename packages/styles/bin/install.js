#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Executing postinstall script for packages/styles');

const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    console.log('Creating directory:', dirname);
    if (fs.existsSync(dirname)) return true;
    fs.mkdirSync(dirname, { recursive: true });
};

// Find all CSS files in the project (excluding node_modules)
const findCssFiles = (dir, fileName) => {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === 'node_modules') continue;

        if (entry.isDirectory()) {
            results.push(...findCssFiles(fullPath, fileName));
        } else if (entry.name === fileName) {
            results.push(fullPath);
        }
    }
    return results;
};

async function install() {
    try {
        const packageJson = require('../package.json');
        console.log(`Force installing packages/styles version: ${packageJson.version}`);

        // Check if --static flag is present
        const staticOnly = process.argv.includes('--static');
        console.log(`Installing ${staticOnly ? 'static files only' : 'all files'}`);

        const projectRoot = path.resolve(__dirname, '../../../../');
        const sourceDir = path.resolve(__dirname, '..');

        // Find existing CSS files
        const existingFiles = {
            baseline: findCssFiles(projectRoot, 'baseline.css'),
            elements: findCssFiles(projectRoot, 'elements.css'),
            styles: findCssFiles(projectRoot, 'styles.css')
        };

        // Determine which files to update
        const filesToUpdate = ['baseline.css', 'elements.css'];
        if (!staticOnly) {
            filesToUpdate.push('styles.css');
        }

        // Update files in their existing locations or default to styles/
        for (const file of filesToUpdate) {
            const sourcePath = path.join(sourceDir, file);
            
            // Check if source file exists
            if (!fs.existsSync(sourcePath)) {
                console.log(`${file} not found in source. Skipping ${file}.`);
                continue;
            }
            
            const existingLocations = existingFiles[file.replace('.css', '')] || [];

            if (existingLocations.length > 0) {
                // Update files in their existing locations
                for (const targetPath of existingLocations) {
                    if (file === 'styles.css') {
                        // Backup existing styles.css
                        const backupPath = path.join(path.dirname(targetPath), 'styles.old.css');
                        await fs.promises.copyFile(targetPath, backupPath);
                        console.log(`Backed up ${targetPath} to ${backupPath}`);
                    }
                    await fs.promises.copyFile(sourcePath, targetPath);
                    console.log(`Updated existing ${file} at ${targetPath}`);
                }
            } else {
                // Create in default location if not found
                const cssDir = path.join(projectRoot, 'styles');
                await fs.promises.mkdir(cssDir, { recursive: true });
                const targetPath = path.join(cssDir, file);
                await fs.promises.copyFile(sourcePath, targetPath);
                console.log(`Created new ${file} at ${targetPath}`);
            }
        }

        console.log('Installation completed successfully');
    } catch (error) {
        console.error('Installation failed:', error);
        process.exit(1);
    }
}

install().catch(console.error);
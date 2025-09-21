#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Executing postinstall script for packages/core');

const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    console.log('Creating directory:', dirname);
    if (fs.existsSync(dirname)) return true;
    fs.mkdirSync(dirname, { recursive: true });
};

// Find all JS files in the project (excluding node_modules)
const findJsFiles = (dir, fileName) => {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === 'node_modules') continue;

        if (entry.isDirectory()) {
            results.push(...findJsFiles(fullPath, fileName));
        } else if (entry.name === fileName) {
            results.push(fullPath);
        }
    }
    return results;
};

async function install() {
    try {
        const packageJson = require('../package.json');
        console.log(`Force installing @indux/core version: ${packageJson.version}`);

        const projectRoot = path.resolve(__dirname, '../../../../');
        const sourcePath = path.resolve(__dirname, '../indux.min.js');

        // Check if source file exists
        if (!fs.existsSync(sourcePath)) {
            console.log('indux.min.js not found in dist. Skipping installation.');
            console.log('Run "npm run build" to generate the required files.');
            return;
        }

        // Find existing indux.min.js files
        const existingLocations = findJsFiles(projectRoot, 'indux.min.js');

        if (existingLocations.length > 0) {
            // Update files in their existing locations
            for (const targetPath of existingLocations) {
                await fs.promises.copyFile(
                    sourcePath,
                    targetPath,
                    fs.constants.COPYFILE_FICLONE | fs.constants.COPYFILE_FORCE
                );
                console.log(`Updated existing indux.min.js at ${targetPath}`);
            }
        } else {
            // Create in default location if not found
            const targetPath = path.join(projectRoot, 'indux.min.js');
            await fs.promises.copyFile(
                sourcePath,
                targetPath,
                fs.constants.COPYFILE_FICLONE | fs.constants.COPYFILE_FORCE
            );
            console.log(`Created new indux.min.js at ${targetPath}`);
        }

        console.log('Installation completed successfully');
    } catch (error) {
        console.error('Installation failed:', error);
        process.exit(1);
    }
}

install().catch(console.error);
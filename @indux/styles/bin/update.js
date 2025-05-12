#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

async function main() {
    const projectRoot = process.cwd();
    console.log('Project root:', projectRoot);

    // Source files from package
    const files = ['baseline.css', 'elements.css', 'styles.css'];
    const sourceDir = path.resolve(__dirname, '..');

    // Verify source files exist
    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        if (!fs.existsSync(sourcePath)) {
            console.log(`Source ${file} not found in package`);
            return;
        }
    }

    // Find all instances of CSS files in the project (excluding node_modules)
    const findFiles = (dir, fileNames, found = {}) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules
            if (entry.name === 'node_modules') continue;

            if (entry.isDirectory()) {
                findFiles(fullPath, fileNames, found);
            } else if (fileNames.includes(entry.name)) {
                found[entry.name] = found[entry.name] || [];
                found[entry.name].push(fullPath);
            }
        }

        return found;
    };

    const targetFiles = findFiles(projectRoot, files);

    if (Object.keys(targetFiles).length === 0) {
        console.log('No existing CSS files found in project');
        return;
    }

    console.log('\nFound CSS files:');
    Object.entries(targetFiles).forEach(([file, paths]) => {
        console.log(`\n${file}:`);
        paths.forEach((p, i) => console.log(`${i + 1}. ${p}`));
    });

    const { shouldUpdate } = await prompts({
        type: 'confirm',
        name: 'shouldUpdate',
        message: 'Update all instances with latest versions?',
        initial: true
    });

    if (!shouldUpdate) {
        console.log('Update cancelled');
        return;
    }

    // Update all instances
    Object.entries(targetFiles).forEach(([file, paths]) => {
        const sourcePath = path.join(sourceDir, file);
        paths.forEach(targetPath => {
            fs.copySync(sourcePath, targetPath);
            console.log(`Updated ${targetPath}`);
        });
    });
}

if (require.main === module) {
    main().catch(console.error);
} 
#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

async function main() {
    const projectRoot = process.cwd();
    console.log('Project root:', projectRoot);

    // Source from node_modules
    const sourcePath = path.resolve(__dirname, '../indux.min.js');
    if (!fs.existsSync(sourcePath)) {
        console.log('Source indux.min.js not found in package');
        return;
    }

    // Find all instances of indux.min.js in the project (excluding node_modules)
    const findFiles = (dir, fileName, files = []) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules
            if (entry.name === 'node_modules') continue;

            if (entry.isDirectory()) {
                findFiles(fullPath, fileName, files);
            } else if (entry.name === fileName) {
                files.push(fullPath);
            }
        }

        return files;
    };

    const targetFiles = findFiles(projectRoot, 'indux.min.js');

    if (targetFiles.length === 0) {
        console.log('No existing indux.min.js files found in project');
        return;
    }

    console.log('\nFound indux.min.js files:');
    targetFiles.forEach((file, i) => console.log(`${i + 1}. ${file}`));

    const { shouldUpdate } = await prompts({
        type: 'confirm',
        name: 'shouldUpdate',
        message: 'Update all instances with latest version?',
        initial: true
    });

    if (!shouldUpdate) {
        console.log('Update cancelled');
        return;
    }

    // Update all found instances
    for (const targetPath of targetFiles) {
        fs.ensureDirSync(path.dirname(targetPath));
        fs.copySync(sourcePath, targetPath);
        console.log(`Updated ${targetPath}`);
    }
    console.log('All instances updated successfully');
}

if (require.main === module) {
    main().catch(console.error);
}
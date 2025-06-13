#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');

program
    .name('indux')
    .description('Indux plugin and stylesheet manager')
    .version('1.5.9');

program
    .command('install')
    .description('Install specific plugins or stylesheets')
    .argument('<items...>', 'Plugins or stylesheets to install (e.g., components, icons, normalizer)')
    .option('-d, --dir <directory>', 'Target directory', './scripts')
    .action(async (items, options) => {
        const targetDir = path.resolve(options.dir);
        await fs.ensureDir(targetDir);

        for (const item of items) {
            const sourcePath = path.join(__dirname, '../dist', `${item}.js`);
            const targetPath = path.join(targetDir, `indux.${item}.js`);

            if (await fs.pathExists(sourcePath)) {
                await fs.copy(sourcePath, targetPath);
                console.log(`Installed ${item} to ${targetPath}`);
            } else {
                console.error(`Plugin or stylesheet '${item}' not found`);
            }
        }
    });

program.parse(); 
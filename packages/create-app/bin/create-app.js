#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

async function init() {
    // Get project name
    const { projectName } = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'What is your project name?',
        initial: 'my-indux-app'
    });

    // Get template choice
    const templates = fs.readdirSync(path.join(__dirname, '../templates'));
    const { templateChoice } = await prompts({
        type: 'select',
        name: 'templateChoice',
        message: 'Choose a template:',
        choices: templates.map(t => ({ title: t, value: t }))
    });

    const projectPath = path.join(process.cwd(), projectName);

    // Check if directory exists
    if (fs.existsSync(projectPath)) {
        const { overwrite } = await prompts({
            type: 'confirm',
            name: 'overwrite',
            message: 'Directory exists. Overwrite?',
            initial: false
        });

        if (!overwrite) {
            console.log('Operation cancelled');
            process.exit(1);
        }
        fs.removeSync(projectPath);
    }

    // Copy template
    const templatePath = path.join(__dirname, '../templates', templateChoice);
    fs.copySync(templatePath, projectPath);

    // Create package.json
    const packageJson = {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
            "start": "npm run dev",
            "dev": "lite-server",
            "build": "npm run update",
            "update": "npx @indux/core@latest update && npx @indux/styles@latest update"
        },
        dependencies: {
            "@indux/core": "latest",
            "@indux/styles": "latest"
        },
        devDependencies: {
            "lite-server": "^2.6.1"
        }
    };

    fs.writeJsonSync(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

    console.log(`
Project created successfully!

Next steps:
  cd ${projectName}
  npm install
  npm start
    `);
}

init().catch(console.error); 
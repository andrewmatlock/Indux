#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

async function init() {
    console.log('🚀 Welcome to Indux! Let\'s create your new project.\n');

    // Get project name
    const { projectName } = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'What is your project name?',
        initial: 'my-indux-app',
        validate: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Project name is required';
            }
            if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                return 'Project name can only contain letters, numbers, hyphens, and underscores';
            }
            return true;
        }
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
    const templatePath = path.join(__dirname, '../template');
    fs.copySync(templatePath, projectPath);

    // Create package.json
    const packageJson = {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
            "start": "npm run dev",
            "dev": "browser-sync start --config bs-config.js --port 3000",
            "build": "echo 'Static site - no build needed'",
            "update": "echo 'To update Indux, replace the CDN links in your HTML files'"
        },
        devDependencies: {
            "browser-sync": "^3.0.3"
        }
    };

    fs.writeJsonSync(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

    // Create bs-config.js for development
    const bsConfig = `module.exports = {
    server: {
        baseDir: "./",
        middleware: function (req, res, next) {
            // Set proper MIME types for assets
            if (req.url.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            } else if (req.url.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            } else if (req.url.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json');
            } else if (req.url.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            } else if (req.url.endsWith('.ico')) {
                res.setHeader('Content-Type', 'image/x-icon');
            } else if (req.url.endsWith('.png')) {
                res.setHeader('Content-Type', 'image/png');
            } else if (req.url.endsWith('.jpg') || req.url.endsWith('.jpeg')) {
                res.setHeader('Content-Type', 'image/jpeg');
            } else if (req.url.endsWith('.svg')) {
                res.setHeader('Content-Type', 'image/svg+xml');
            } else if (req.url.endsWith('.xml')) {
                res.setHeader('Content-Type', 'application/xml');
            } else if (req.url.endsWith('.txt')) {
                res.setHeader('Content-Type', 'text/plain');
            }

            // Handle SPA routing - only for non-asset requests
            const url = req.url;
            const urlWithoutQuery = url.split('?')[0];

            // Always allow asset requests to pass through unchanged
            if (urlWithoutQuery.includes('.') && urlWithoutQuery !== '/') {
                return next();
            }

            // Always allow root path
            if (url === '/' || url === '') {
                return next();
            }

            // Always allow API and special paths
            if (url.startsWith('/api/') ||
                url.startsWith('/_') ||
                url.includes('browser-sync')) {
                return next();
            }

            // For all other routes (SPA routes), serve index.html
            req.url = '/';
            return next();
        }
    },
    files: ["**/*.html", "**/*.js", "**/*.css", "**/*.json", "**/*.yaml", "**/*.md"],
    open: true,
    notify: false,
    port: 3000,
    single: true,
    ghostMode: false
};`;

    fs.writeFileSync(path.join(projectPath, 'bs-config.js'), bsConfig);

    console.log(`
✅ Project created successfully!

📁 Project structure:
  ${projectName}/
  ├── components/          # Reusable HTML components
  ├── content/            # Data files (YAML/JSON)
  ├── pages/              # Page templates
  ├── scripts/            # Custom JavaScript
  ├── styles/             # Custom CSS
  ├── index.html          # Main page
  ├── package.json        # Dependencies
  └── bs-config.js        # Development server config

🚀 Next steps:
  cd ${projectName}
  npm install
  npm start

📚 Documentation:
  https://indux.dev

💡 Tips:
  - Edit index.html to customize your pages
  - Add components in the components/ folder
  - Customize styles in the styles/ folder
  - Use browser-sync for live reloading during development
    `);
}

init().catch(console.error);

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
  console.log('Usage: npx @indux/create-starter <project-name>');
  console.log('Example: npx @indux/create-starter MyProject');
  process.exit(1);
}

// Validate project name - allow most characters but prevent problematic ones
if (!/^[a-zA-Z0-9._-]+$/.test(projectName) || projectName.includes('..') || projectName.startsWith('.') || projectName.endsWith('.')) {
  console.error('Error: Project name must contain only letters, numbers, dots, underscores, and hyphens. Cannot start/end with dots or contain consecutive dots.');
  process.exit(1);
}

const projectPath = path.resolve(process.cwd(), projectName);

// Check if directory already exists
if (fs.existsSync(projectPath)) {
  console.error(`Error: Directory "${projectName}" already exists`);
  process.exit(1);
}

console.log(`Creating Indux project: ${projectName}`);

try {
  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });

  // Copy all files from starter template
  const starterDir = path.join(__dirname, '..', '..', 'templates', 'starter');
  const filesToCopy = [
    'index.html',
    'components',
    'scripts',
    'styles',
    'assets',
    'icons',
    'manifest.json',
    'robots.txt',
    'sitemap.xml',
    'LICENSE',
    'README.md'
  ];

  filesToCopy.forEach(file => {
    const srcPath = path.join(starterDir, file);
    const destPath = path.join(projectPath, file);
    
    if (fs.existsSync(srcPath)) {
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });

  // Create package.json for the new project
  // Convert project name to valid npm package name (lowercase, no spaces, etc.)
  const packageName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  const packageJson = {
    "name": packageName,
    "version": "1.0.0",
    "description": `Indux project: ${projectName}`,
    "main": "index.html",
    "scripts": {
      "start": "browser-sync start --config bs-config.js",
      "build": "echo 'No build needed for Indux projects'"
    },
    "keywords": ["indux", "framework", "html", "css", "javascript"],
    "author": "",
    "license": "MIT",
    "devDependencies": {
      "browser-sync": "^2.29.3"
    }
  };

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create bs-config.js for browser-sync
  const bsConfig = `module.exports = {
  server: {
    baseDir: "./",
    index: "index.html"
  },
  files: ["**/*.html", "**/*.css", "**/*.js"],
  watchOptions: {
    ignored: ["node_modules"]
  },
  port: 3000,
  open: true,
  notify: false
};`;

  fs.writeFileSync(path.join(projectPath, 'bs-config.js'), bsConfig);

  // Create .gitignore
  const gitignore = `node_modules/
.DS_Store
*.log
`;

  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

  console.log(`✅ Project created successfully!`);
  console.log(`📁 Location: ${projectPath}`);
  console.log(``);
  console.log(`Next steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  npm start`);
  console.log(``);
  console.log(`Your Indux project will be available at http://localhost:3000`);

} catch (error) {
  console.error('Error creating project:', error.message);
  process.exit(1);
}

// Helper function to copy directories recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

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
  const starterDir = path.join(__dirname, 'templates');
  const filesToCopy = [
    'index.html',
    'components',
    'data',
    'scripts',
    'styles',
    'icons',
    'manifest.json',
    'robots.txt',
    'sitemap.xml',
    'LICENSE.md',
    'privacy.md',
    'README.md',
    'favicon.ico',
    '_redirects',
    '.htaccess'
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

  // Create .gitignore
  const gitignore = `# Dependencies (if you add them later)
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs (if you add a build process)
dist/
build/
*.tgz

# Development files
.vscode/
.idea/
*.swp
*.swo
*~
bs-config.js

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp

# Logs
logs
*.log
# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/
`;

  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);

  console.log(`✅ Project created successfully!`);
  console.log(`📁 Location: ${projectPath}`);
  console.log(`See README.md for more details.`);

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

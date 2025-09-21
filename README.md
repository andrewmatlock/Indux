# Indux Framework

A lightweight JavaScript framework for building interactive web applications.


## Project Structure
indux-monorepo/
├── packages/ # NPM packages
│ ├── core/ # Core framework
│ ├── styles/ # CSS utilities
│ └── create-/ # Template generators
├── src/ # Source files
│ └── scripts/ # Framework source
├── templates/ # Project templates
└── package.json # Root configuration


## Available Commands

### Build Commands
Rollup all Indux plugins into indux.js (in the /development directory):

    npx rollup -c

    
Clean all build artifacts:

    npm run clean

Build core framework:

    npm run build:core

Build style utilities:

    npm run build:styles

Build template packages:

    npm run build:templates

Build everything:

    npm run build



### Test Commands
Run all tests:

    npm test

### Publishing
Build and publish latest packages to NPM:

    npm run publish-packages


## Package Descriptions

- **packages/core**: Core framework functionality (indux.min.js)
- **packages/styles**: CSS utilities and baseline styles (baseline.css, elements.css, styles.css)
- **packages/create-starter**: Project generator for basic startertemplate


## Using Templates

### Create New Project
Using npx:

    npx packages/create-starter my-app

Or install globally:

    npm install -g packages/create-starter
    create-indux-starter my-app

### Install/Update Specific Files
Install core framework:

    npm install packages/core

This creates scripts/indux.min.js.
Add to your HTML:

    <script src="scripts/indux.min.js"></script>

### Install/Update Styles Only
Install CSS files:

    npm install packages/styles

This creates or updates styles/baseline.css, elements.css, and styles.css.
If updating, your old styles.css is backed up as styles.old.css since that's where your custom CSS should go.
Add to your HTML:

    <link rel="stylesheet" href="styles/styles.css">

### Force Update
If an update is not coming through, it may be due to npm caching on your system.
Try running:

    npm cache clean --force
    npm install packages/core
    npm install packages/styles
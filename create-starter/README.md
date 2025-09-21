# Indux Create Starter

This package provides the `create-indux-starter` command for scaffolding new Indux projects.

## Build Commands

### Development
```bash
# Build the Indux framework files
npm run build

# Start the docs development server
npm run start:docs
```

### Publishing
```bash
# Publish the starter package to npm
npm run publish:starter
```

### Testing Locally
```bash
# Test the create command locally
cd create-starter
npm link
create-indux-starter my-test-project
```

## What This Package Does

1. **Scaffolds new Indux projects** using the template in `/templates/starter`
2. **Creates a complete project structure** with:
   - HTML components
   - CSS stylesheets  
   - JavaScript files
   - Development server configuration
3. **Sets up CDN links** to jsdelivr for Indux framework files
4. **Provides development workflow** with browser-sync

## Template Source

The actual template files are located in `/templates/starter/` in the root directory. 

**Important:** This package does NOT include the template files - it references them from the root directory. When you update files in `/templates/starter/`, those changes are immediately available to the create command.

**Workflow:**
1. Edit files in `/templates/starter/` 
2. Test with `create-indux-starter my-test-project`
3. No need to republish the npm package - template changes are live immediately

## Version Management

- Update version in `create-starter/package.json`
- Update version in root `package.json` 
- Run `npm run publish:starter` to publish
- The template files are automatically included from `/templates/starter/`

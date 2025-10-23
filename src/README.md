# Indux Development

## Quick Start

```bash
npm run start
```
Runs any website directory in this repo with live reload.

---

## Build

```bash
npm run build
```
- Compiles indux.components.js and indux.router.js from their respective source files in /src/scripts/components or /router
- Bundles scripts from /src/scripts into indux.js and indux.quickstart.js
- Bundles CSS stylesheets from /src/styles into indux.css
- Copies indux.css and indux.quickstart.js to docs and starter template
- Generates release assets

---

## Publish to jsDelivr

```bash
git tag v1.0.0
git push origin v1.0.0
```
Auto-publishes to npm and jsDelivr CDN via GitHub Actions. Files available at URLs like:
- `https://cdn.jsdelivr.net/npm/@indux/indux@0.2.3/dist/indux.js`
- `https://cdn.jsdelivr.net/npm/@indux/indux@0.2.3/dist/indux.css`

And distributed publically like:

- `https://cdn.jsdelivr.net/npm/@indux/indux@latest/dist/indux.min.js`
- `https://cdn.jsdelivr.net/npm/@indux/indux@latest/dist/indux.min.css`

### Version Numbering Strategy

**Main Package (@indux/indux):**
- Use semantic versioning (MAJOR.MINOR.PATCH)
- For bug fixes and small improvements: `npm version patch` (0.2.4 → 0.2.5)
- For new features: `npm version minor` (0.2.4 → 0.3.0)
- For breaking changes: `npm version major` (0.2.4 → 1.0.0)
- Always check existing tags first: `git tag --list | tail -5`
- If version already exists, manually update `package.json` and commit before tagging

**Starter Template (@indux/starter):**
- Independent versioning from main package
- Current version in `packages/create-starter/package.json`
- Use `npm version patch` in the create-starter directory
- Or manually update version and run `npm run publish:starter`

**Publishing Workflow:**
1. Make changes and commit
2. Check current version: `git tag --list | tail -5`
3. Update version: `npm version patch` (or manually edit package.json)
4. Create and push tag: `git tag vX.X.X && git push origin vX.X.X`
5. For starter template: `npm run publish:starter`

---

## Publish Starter Template

```bash
npm run publish:starter
```
Publishes starter template to npm as @indux/starter.

---

## Install Starter Template

```bash
npx @indux/starter my-app
```
Creates new Indux project from template.

---

## Update Indux Files

### Individual File Updates

```bash
npx @indux/add js
npx @indux/add css
npx @indux/add theme
npx @indux/add code
npx @indux/add quickstart
```
Downloads and overwrites specific Indux files with latest versions from CDN.

### Bulk Update

```bash
npx @indux/add update
```
Scans project directory and updates all Indux files except `indux.theme.css` (which is preserved for custom modifications).

**Note:** These commands require the `@indux/add` package to be published to npm first.
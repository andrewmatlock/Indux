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


## Publish to jsdelivr

```bash
git tag v1.0.0
git push origin v1.0.0
```
Auto-publishes to npm and jsdelivr CDN via GitHub Actions. Files available at:
- `https://cdn.jsdelivr.net/npm/@andrewmatlock/indux@0.2.0/src/scripts/indux.js`
- `https://cdn.jsdelivr.net/npm/@andrewmatlock/indux@0.2.0/src/styles/indux.css`


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
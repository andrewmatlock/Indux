# Indux Starter Project

A modern web application built with the Indux framework.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open in browser
open http://localhost:3000
```

## 📁 Project Structure

```
my-indux-project/
├── components/          # Reusable HTML components
│   ├── header.html     # Site header
│   ├── footer.html     # Site footer
│   └── logo.html       # Logo component
├── styles/             # CSS stylesheets
│   └── indux.css       # Indux framework styles
├── scripts/            # JavaScript files
│   └── indux.quickstart.js  # Indux framework + Alpine.js + Tailwind
├── index.html          # Main page
├── package.json        # Dependencies and scripts
├── bs-config.js        # Development server configuration
└── README.md           # This file
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server with live reload
- `npm run dev` - Alias for `npm start`
- `npm run build` - Build for production (static site)
- `npm run update` - Update Indux framework files

### Development Server

The project uses Browser-sync for development with:
- **Live reload** on file changes
- **SPA routing** support
- **Cross-device testing** via external URL
- **Port**: 3000 (configurable in `bs-config.js`)

## 🎨 Styling

This project uses the **Indux CSS Framework** which includes:
- **Modern CSS reset** and base styles
- **Component library** (buttons, forms, modals, etc.)
- **Utility classes** for rapid development
- **Dark/light theme** support
- **Responsive design** patterns

### Adding Custom Styles

Create your own CSS files in the `styles/` directory:

```css
/* styles/custom.css */
.my-component {
    /* Your styles here */
}
```

Then include them in `index.html`:

```html
<link rel="stylesheet" href="/styles/custom.css">
```

## 🧩 Components

Indux uses **HTML components** for reusability. Components are defined in the `components/` directory and used with custom elements:

```html
<!-- Define component -->
<!-- components/my-button.html -->
<button class="btn btn-primary">
    <slot></slot>
</button>

<!-- Use component -->
<my-button>Click me!</my-button>
```

### Available Components

- `<x-header>` - Site header with navigation
- `<x-footer>` - Site footer
- `<x-logo>` - Logo component

## 📱 JavaScript

This project includes:
- **Alpine.js** - Lightweight reactive framework
- **Indux Framework** - Component system and utilities
- **Tailwind CSS** - Utility-first CSS framework

### Alpine.js Usage

```html
<div x-data="{ count: 0 }">
    <button @click="count++">Count: <span x-text="count"></span></button>
</div>
```

### Indux Components

```html
<!-- Theme toggle -->
<button @click="$theme.toggle()">Toggle Theme</button>

<!-- Data binding -->
<div x-text="$x.core.docs.name">Loading...</div>
```

## 🚀 Deployment

This is a **static site** that can be deployed to any static hosting service:

### Recommended Platforms

- **Vercel** - `vercel --prod`
- **Netlify** - Connect your Git repository
- **GitHub Pages** - Enable in repository settings
- **Surge.sh** - `surge dist/`
- **Firebase Hosting** - `firebase deploy`

### Build for Production

```bash
# The site is already production-ready
# Just upload the files to your hosting service
```

## 📚 Learn More

- **Indux Documentation**: https://indux.dev
- **Alpine.js Guide**: https://alpinejs.dev/start-here
- **Tailwind CSS Docs**: https://tailwindcss.com/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Indux Framework](https://indux.dev) - Modern web framework
- [Alpine.js](https://alpinejs.dev) - Lightweight reactive framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

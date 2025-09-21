# Indux Starter Project

## 🚀 Quick Start

Indux projects include a built-in SPA router and require a local server to run.

**Local Server Options (choose one):**

1. **Python** (works on most systems):
   ```bash
   python3 -m http.server 8000
   ```

2. **Node.js** (if you have it installed):
   ```bash
   npx http-server
   ```

3. **Other options**:
   - VS Code Live Server extension
   - Browsersync (requires installation)
   - Any other static file server

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
├── pages/              # Additional pages
│   ├── about.html      # About page
│   └── contact.html    # Contact page
├── index.html          # Main page
├── manifest.json       # PWA manifest
├── favicon.ico         # Site icon
├── LICENSE             # MIT License
└── README.md           # This file
```

## 📚 Learn More

This project supports routes, components, dynamic data, localization, icons, color themes, and much more.

For comprehensive documentation visit [indux.build](https://indux.build).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Indux Framework](https://indux.dev) - Modern web framework
- [Alpine.js](https://alpinejs.dev) - Lightweight reactive framework, included in indux.quickstart.js
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework, with its Play CDN script included in indux.quickstart.js

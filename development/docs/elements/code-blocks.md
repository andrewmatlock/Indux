# Code

Syntax highlighting for code blocks using the modern CSS Custom Highlight API.

---

## Setup

Add an [Indux script](/getting-started/setup) to your project, or use the standalone code plugin:

```html "<head> or <body>" copy
<!-- Alpine -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Indux code blocks plugin -->
<script src="https://cdn.jsdelivr.net/npm/indux/dist/indux.code.js"></script>
```

---

## X-Code Element

Use the `<x-code>` custom element for syntax highlighting:

```html
<x-code language="javascript">
function hello() {
  console.log('Hello, World!');
  return true;
}
</x-code>

<!-- With line numbers -->
<x-code language="javascript" numbers>
function hello() {
  console.log('Hello, World!');
  return true;
}
</x-code>

<!-- With title only -->
<x-code language="css" title="CSS Styling">
  .container {
    display: flex;
    justify-content: center;
  }
</x-code>

### Attributes

- `language` - The programming language for syntax highlighting (default: `plaintext`)
- `theme` - The color theme (default: `prettylights`)
- `numbers` - Enable line numbers (boolean attribute)
- `title`


## Styles
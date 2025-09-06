# Content Collections

Manage reusable content with JSON and YAML files.

---

## Setup

Content collections are supported by an Alpine plugin, available on its own or as part of Indux bundles.

<x-code-group copy>

```html "Standalone"
<!-- Alpine -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Indux collections plugin only -->
<script src="https://cdn.jsdelivr.net/npm/indux/dist/indux.collections.js"></script>
```

```html "Indux JS"
<!-- Alpine -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Indux JS -->
<script src="https://cdn.jsdelivr.net/npm/indux/dist/indux.js"></script>
```

```html "Quickstart"
<!-- Indux JS, Alpine, and Tailwind combined -->
<script src="https://cdn.jsdelivr.net/npm/indux/dist/indux.quickstart.js"></script>
```

</x-code-group>

Content collections store reusable content in local JSON or YAML files, making it easy to manage repetitive data across your project. Collections are loaded on-demand and cached for the session duration.

<Note>Collection files are maintained client-side and should not contain sensitive data.</Note>

---

## Basic Usage

Collections are accessed using the `$x` magic method with dot notation:

- **Access collections**: `$x.collectionName`
- **Array access**: `$x.collectionName[0]` or `$x.collectionName[1]`
- **Nested properties**: `$x.collectionName.property`
- **Array methods**: `$x.collectionName.filter()`, `$x.collectionName.map()`, etc.

**Collection names** can be anything (`team`, `products`, `features`, etc.) and are registered in `manifest.json`.

---

## Create Collections

Create JSON or YAML files anywhere in your project. Both formats work identically - choose based on preference.

<x-code-group>

```json "team.json"
[
    {
        "name": "Darth Vader",
        "role": "Lord",
        "image": "/assets/team/vader.webp"
    },
    {
        "name": "Admiral Piett", 
        "role": "Fleet Commander",
        "image": "/assets/team/piett.webp"
    }
]
```

```yaml "team.yaml"
- name: Darth Vader
  role: Lord
  image: /assets/team/vader.webp
- name: Admiral Piett
  role: Fleet Commander
  image: /assets/team/piett.webp
```

</x-code-group>

Collections can use any structure - arrays, objects, or nested combinations.

<Warning>JSON files will break with syntax errors. Use validators like [JSON Lint](https://jsonlint.com/) to check your files.</Warning>

---

## Register Collections

Register collections in `manifest.json` so they can be accessed in HTML:

```json "manifest.json"
{
    "collections": {
        "team": "/collections/team.json",
        "products": "/collections/products.yaml",
        "features": {
            "en": "/collections/features/en.yaml",
            "fr": "/collections/features/fr.yaml"
        }
    }
}
```

Collections support localization through the manifest configuration. See [Localization](/plugins/localization) for details.

---

## Display Content

### Text Content

Use `x-text` to display text from collections:

<x-code-group>

```html "HTML"
<h4 x-text="$x.team[0].name"></h4>
<p x-text="$x.team[0].role"></p>
```

```json "team.json"
[
    {
        "name": "Darth Vader",
        "role": "Lord",
        "image": "/assets/team/vader.webp"
    }
]
```

</x-code-group>

### Rich Content

Use `x-html` for content that includes HTML tags:

```html
<div x-html="$x.blog[0].content"></div>
```

### Attributes

Use `x-bind:` (or `:`) to bind collection data to HTML attributes:

```html
<img :src="$x.team[0].image" :alt="$x.team[0].name">
<a :href="$x.team[0].linkedin">LinkedIn</a>
```

---

## List Content

Use `<template x-for>` to iterate through collection arrays:

::: frame
<div class="row gap-6">
    <div class="grow w-[160px] min-w-[160px] shadow">
        <img class="aspect-square object-cover mt-0 mb-xs" src="/assets/team/vader.jpg" alt="Darth Vader" />
        <div>
            <p class="font-bold">Darth Vader</p>
            <span>Lord</span>
        </div>
    </div>
    <div class="grow w-[160px] min-w-[160px] shadow">
        <img class="aspect-square object-cover mt-0 mb-xs" src="/assets/team/piett.webp" alt="Admiral Piett" />
        <div>
            <p class="font-bold">Admiral Piett</p>
            <span>Fleet Commander</span>
        </div>
    </div>
</div>
:::

```html
<template x-for="person in $x.team" :key="person.name">
    <div>
        <img :src="person.image" :alt="person.name">
        <div>
            <p x-text="person.name"></p>
            <small x-text="person.role"></small>
        </div>
    </div>
</template>
```

The `<template>` tag creates a loop through the collection array. Use `x-for="item in $x.collectionName"` where `item` is an arbitrary name for the current loop item.

---

## Array Methods

Collections support all standard JavaScript array methods for filtering, mapping, and transforming data:

### Filter

```html
<!-- Show only team members with "Lord" role -->
<template x-for="person in $x.team.filter(p => p.role === 'Lord')" :key="person.name">
    <div x-text="person.name"></div>
</template>
```

---

### Map

```html
<!-- Transform team data to display names only -->
<template x-for="name in $x.team.map(p => p.name)" :key="name">
    <div x-text="name"></div>
</template>
```

---

### Find

```html
<!-- Find specific team member -->
<div x-text="$x.team.find(p => p.role === 'Lord')?.name || 'Not found'"></div>
```

---

### Other Methods

Collections also support `slice()`, `forEach()`, `reduce()`, `some()`, `every()`, and `findIndex()`.

---

## Route-Specific Content

Use the `route()` function to find content based on the current URL path:

```html
<!-- Find content matching current route -->
<div x-text="$x.pages.route('slug').title"></div>
<div x-html="$x.pages.route('slug').content"></div>
```

This searches through the collection for items where the specified property matches any segment of the current URL path.

---

## Cross-Collection Access

Access all loaded collections through the global `all` array:

```html
<!-- Show all content from any collection -->
<template x-for="item in $x.all" :key="item.name">
    <div x-text="item.name"></div>
</template>
```

Each item includes metadata: `contentType`, `_loadedFrom`, and `_locale`.
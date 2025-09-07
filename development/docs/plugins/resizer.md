# Resizer

---

## Setup

Add an [Indux script](/getting-started/setup) to your project, or use the standalone resizer plugin:

```html "<head> or <body>" copy
<!-- Alpine -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- Indux resizer plugin -->
<script src="https://cdn.jsdelivr.net/npm/indux/dist/indux.resizer.js"></script>
```

This plugin adds drag-to-resize functionality to any element using an `x-resize` directive. Elements can be resized horizontally, vertically, or both with customizable constraints, snap points, and persistence.

---

## Basic Usage

Use the `x-resize` directive on any element to make it resizable:

```html
<div x-resize class="w-64 h-32 bg-gray-100">
    Resizable content
</div>
```

The element will automatically get resize handles based on the default configuration.

---

## Configuration Options

Configure resizing behavior using an options object:

```html
<div x-resize="{
    minWidth: 200,
    maxWidth: 800,
    handles: ['e', 'se'],
    snapPoints: [300, 500, 700],
    snapDistance: 20,
    saveWidth: 'sidebar-width'
}">
    Configurable resizable content
</div>
```

### Available Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| **`minWidth`** | Number/String | `200` | Minimum width (px, %, rem, em) |
| **`maxWidth`** | Number/String | `Infinity` | Maximum width (px, %, rem, em) |
| **`handles`** | Array | `['e']` | Resize handles: `n`, `s`, `e`, `w`, `nw`, `ne`, `sw`, `se` |
| **`snapPoints`** | Array | `[]` | Width values to snap to |
| **`snapDistance`** | Number/String | `50` | Distance threshold for snapping |
| **`snapCloseWidth`** | Number/String | `200` | Width threshold for auto-close |
| **`toggle`** | String | `null` | Alpine variable to toggle visibility |
| **`saveWidth`** | String | `null` | localStorage key to persist width |
| **`affectedSelector`** | String | `null` | CSS selector for affected element |

---

## Handle Positions

Resize handles can be positioned on any edge or corner:

```html
<!-- Horizontal only -->
<div x-resize="{ handles: ['e'] }">Right edge</div>

<!-- Vertical only -->
<div x-resize="{ handles: ['s'] }">Bottom edge</div>

<!-- Both directions -->
<div x-resize="{ handles: ['se'] }">Bottom-right corner</div>

<!-- All edges -->
<div x-resize="{ handles: ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] }">
    All edges and corners
</div>
```

### Handle Types

- **`n`** - North (top edge)
- **`s`** - South (bottom edge)  
- **`e`** - East (right edge)
- **`w`** - West (left edge)
- **`nw`** - Northwest (top-left corner)
- **`ne`** - Northeast (top-right corner)
- **`sw`** - Southwest (bottom-left corner)
- **`se`** - Southeast (bottom-right corner)

---

## Snap Points

Define specific widths where the element should snap:

```html
<div x-resize="{
    snapPoints: [200, 400, 600, 800],
    snapDistance: 30
}">
    Snaps to 200px, 400px, 600px, or 800px
</div>
```

Snap points work with any unit type:

```html
<div x-resize="{
    snapPoints: ['25%', '50%', '75%'],
    snapDistance: '20px'
}">
    Snaps to 25%, 50%, or 75% width
</div>
```

---

## Auto-Close Behavior

Elements can automatically close when resized below a threshold:

```html
<div x-resize="{
    snapCloseWidth: 150,
    toggle: 'sidebarOpen'
}" x-show="sidebarOpen">
    Sidebar that closes when too narrow
</div>
```

When the width drops below `snapCloseWidth`, the element gets the `resizable-closed` class and the toggle variable is set to `false`.

---

## Persistence

Save and restore resize state using localStorage:

```html
<div x-resize="{
    saveWidth: 'my-sidebar-width',
    minWidth: '200px',
    maxWidth: '600px'
}">
    Width persists across page reloads
</div>
```

The saved width includes the original unit type and is restored on page load.

---

## Units Support

The resizer supports multiple CSS units:

```html
<!-- Pixels -->
<div x-resize="{ minWidth: 200, maxWidth: 800 }">

<!-- Percentages -->
<div x-resize="{ minWidth: '20%', maxWidth: '80%' }">

<!-- Rem units -->
<div x-resize="{ minWidth: '12rem', maxWidth: '24rem' }">

<!-- Em units -->
<div x-resize="{ minWidth: '20em', maxWidth: '40em' }">
```

---

## Events

Listen for resize events to perform custom actions:

```html
<div x-resize 
     @resize="handleResize($event.detail)"
     x-data="{ 
         handleResize(detail) {
             console.log('Width:', detail.width);
             console.log('Height:', detail.height);
             console.log('Unit:', detail.unit);
             console.log('Snap:', detail.snap);
             console.log('Closing:', detail.closing);
         }
     }">
    Resizable with event handling
</div>
```

### Event Detail Properties

- **`width`** - Current width value
- **`height`** - Current height value  
- **`unit`** - CSS unit type
- **`snap`** - Active snap point or null
- **`closing`** - Boolean indicating if element is closing

---

## Advanced Examples

### Sidebar with Toggle

```html
<div x-data="{ sidebarOpen: true }">
    <button @click="sidebarOpen = !sidebarOpen">Toggle Sidebar</button>
    
    <div x-resize="{
        minWidth: 200,
        maxWidth: 500,
        snapCloseWidth: 150,
        toggle: 'sidebarOpen',
        saveWidth: 'sidebar-width',
        handles: ['e']
    }" 
    x-show="sidebarOpen"
    class="bg-gray-100 p-4">
        Resizable sidebar content
    </div>
</div>
```

### Multi-Panel Layout

```html
<div class="flex">
    <div x-resize="{
        minWidth: 200,
        maxWidth: 600,
        handles: ['e'],
        affectedSelector: '.main-content'
    }" class="bg-blue-100 p-4">
        Left panel
    </div>
    
    <div class="main-content flex-1 bg-gray-100 p-4">
        Main content (affected by left panel resize)
    </div>
</div>
```

### Responsive Snap Points

```html
<div x-resize="{
    snapPoints: ['25%', '50%', '75%'],
    snapDistance: '30px',
    handles: ['e', 'w']
}" class="bg-green-100 p-4">
    Responsive snap points
</div>
```

---

## CSS Classes

The resizer adds CSS classes during interaction:

- **`resizable-closing`** - Applied when element is being closed
- **`resizable-closed`** - Applied when element is closed

```css
.resizable-closed {
    display: none;
}

.resizable-closing {
    opacity: 0.5;
    transition: opacity 0.2s;
}
```
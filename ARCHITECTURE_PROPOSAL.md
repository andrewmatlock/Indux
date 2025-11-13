# Appwrite Database & Storage Integration Architecture Proposal

## Executive Summary

This proposal outlines how to integrate Appwrite Databases and Storage into Indux's data sources pattern, maintaining consistency with the existing `$x` magic method while adding read/write capabilities and permission-aware operations.

## Core Principles

1. **Unified Access Pattern**: Extend `$x` magic method to support Appwrite collections/storage
2. **Read/Write Symmetry**: Read operations work like existing data sources; write operations use intuitive methods
3. **Context-Aware Scoping**: Automatically scope queries by user, team, role, and permissions
4. **Permission-Aware**: Leverage Appwrite's built-in permissions; errors surface gracefully
5. **Reactive by Default**: Changes automatically update UI via Alpine reactivity
6. **Progressive Enhancement**: Custom directives for common patterns, but `$x` magic method is sufficient for all operations

## Architecture Overview

### Configuration Structure

Extend `manifest.json` to support Appwrite data sources alongside existing local/API sources:

```json
{
  "data": {
    // Existing local file
    "team": "/data/team.json",
    
    // Existing API source
    "products": {
      "url": "${API_BASE_URL}/products"
    },
    
    // NEW: Appwrite Database Collection
    "posts": {
      "type": "appwrite",
      "databaseId": "main",
      "collectionId": "posts",
      "queries": {
        "default": [
          ["orderDesc", "createdAt"],
          ["limit", 10]
        ],
        "featured": [
          ["equal", "featured", true],
          ["orderDesc", "createdAt"]
        ]
      }
    },
    
    // NEW: Team-scoped projects (automatically scoped by current team)
    "projects": {
      "type": "appwrite",
      "databaseId": "main",
      "collectionId": "projects",
      "scope": "team",  // Auto-scope queries to current team
      "queries": {
        "default": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["orderDesc", "createdAt"]
        ],
        "active": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["equal", "status", "active"],
          ["orderDesc", "createdAt"]
        ]
      }
    },
    
    // NEW: User-scoped data (auto-scoped to current user)
    "userSettings": {
      "type": "appwrite",
      "databaseId": "main",
      "collectionId": "userSettings",
      "scope": "user",  // Auto-scope to current user
      "queries": {
        "default": [
          ["equal", "userId", "$auth.userId"]
        ]
      }
    },
    
    // NEW: Appwrite Storage Bucket
    "uploads": {
      "type": "appwrite",
      "bucketId": "user-uploads",
      "queries": {
        "default": [
          ["orderDesc", "dateCreated"]
        ]
      }
    }
  }
}
```

### Access Pattern

#### Reading Data (Same as Current Pattern)

```html
<!-- Read from Appwrite collection - works identically to local files -->
<template x-for="post in $x.posts" :key="post.$id">
  <div>
    <h2 x-text="post.title"></h2>
    <p x-text="post.content"></p>
  </div>
</template>

<!-- Use query variants -->
<template x-for="post in $x.posts.featured" :key="post.$id">
  <div x-text="post.title"></div>
</template>

<!-- Route-specific lookups still work -->
<h1 x-text="$x.posts.route('slug').title"></h1>
```

#### Writing Data (New Methods)

```html
<!-- Create new document -->
<button @click="$x.posts.create({ title: 'New Post', content: '...' })">
  Create Post
</button>

<!-- Update document -->
<button @click="$x.posts.update(post.$id, { title: 'Updated' })">
  Update
</button>

<!-- Delete document -->
<button @click="$x.posts.delete(post.$id)">
  Delete
</button>

<!-- Real-time subscription -->
<div x-data="{ post: null }" 
     x-init="$x.posts.subscribe('documents', (payload) => { post = payload.payload })">
  <div x-text="post?.title"></div>
</div>
```

### Implementation Strategy

#### 1. Extend Data Sources Plugin

Modify `indux.data.js` to detect Appwrite sources and handle them differently:

```javascript
// In loadDataSource function
if (dataSource.type === 'appwrite') {
  if (dataSource.collectionId) {
    // Database collection
    data = await loadFromAppwriteCollection(dataSource);
  } else if (dataSource.bucketId) {
    // Storage bucket
    data = await loadFromAppwriteStorage(dataSource);
  }
}
```

#### 2. Create Appwrite Data Service

New module: `indux.appwrite.data.js` (similar to auth structure)

```javascript
// Leverage existing Appwrite client from auth
async function getAppwriteDataServices() {
  const { client } = await window.InduxAppwriteAuthConfig.getAppwriteClient();
  if (!client) return null;
  
  return {
    databases: new window.Appwrite.Databases(client),
    storage: new window.Appwrite.Storage(client),
    realtime: new window.Appwrite.Realtime(client)
  };
}
```

#### 3. Proxy Pattern for Read/Write

Extend the `$x` proxy to add write methods for Appwrite sources:

```javascript
// In $x magic method proxy
if (value && value._sourceType === 'appwrite') {
  return new Proxy(value, {
    get(target, key) {
      // Existing read operations...
      
      // NEW: Write operations
      if (key === 'create') {
        return async (data) => {
          const result = await createDocument(target._databaseId, target._collectionId, data);
          // Invalidate cache, trigger reactivity
          await refreshDataSource(prop);
          return result;
        };
      }
      
      if (key === 'update') {
        return async (documentId, data) => {
          const result = await updateDocument(target._databaseId, target._collectionId, documentId, data);
          await refreshDataSource(prop);
          return result;
        };
      }
      
      if (key === 'delete') {
        return async (documentId) => {
          await deleteDocument(target._databaseId, target._collectionId, documentId);
          await refreshDataSource(prop);
        };
      }
      
      if (key === 'subscribe') {
        return (channel, callback) => {
          return subscribeToRealtime(target._databaseId, target._collectionId, channel, callback);
        };
      }
      
      // Query variants (e.g., $x.posts.featured)
      if (target._queries && target._queries[key]) {
        return loadQuery(target, key);
      }
    }
  });
}
```

## Scoping & Context-Aware Queries

### The Challenge

Local files are **global** - everyone sees the same content. Database collections are **contextual** - content varies by:
- **User**: Personal settings, user-specific data
- **Team**: Team projects, shared workspaces
- **Role**: Permission-based filtering
- **Combinations**: Team projects where user has specific role

### Solution: Automatic Scoping

The `$x` magic method automatically injects auth context into queries:

```json
{
  "projects": {
    "type": "appwrite",
    "databaseId": "main",
    "collectionId": "projects",
    "scope": "team",  // Auto-inject team context
    "queries": {
      "default": [
        ["equal", "teamId", "$auth.currentTeam.$id"],
        ["orderDesc", "createdAt"]
      ]
    }
  }
}
```

**Query Variable Interpolation:**
- `$auth.userId` → Current user's ID
- `$auth.currentTeam.$id` → Current team's ID
- `$auth.user.$id` → User object ID (same as userId)
- `$auth.teams[0].$id` → First team's ID
- Custom variables via `$auth.get('customVar')`

**Scoping Modes:**
- `"scope": "user"` - Auto-add `["equal", "userId", "$auth.userId"]` to all queries
- `"scope": "team"` - Auto-add `["equal", "teamId", "$auth.currentTeam.$id"]` to all queries
- `"scope": "none"` or omitted - No automatic scoping (global queries)

### Dynamic Scoping

Queries can be dynamically scoped at runtime:

```html
<!-- Projects for current team (automatic) -->
<template x-for="project in $x.projects" :key="project.$id">
  <div x-text="project.name"></div>
</template>

<!-- Projects for specific team (override scope) -->
<template x-for="project in $x.projects.scope('team', team.$id)" :key="project.$id">
  <div x-text="project.name"></div>
</template>

<!-- User's personal projects (override scope) -->
<template x-for="project in $x.projects.scope('user')" :key="project.$id">
  <div x-text="project.name"></div>
</template>
```

### Permission-Aware Operations

All operations respect Appwrite permissions. Failed operations return errors gracefully:

```html
<!-- Create project (automatically scoped to current team) -->
<button @click="
  $x.projects.create({
    name: 'New Project',
    teamId: $auth.currentTeam.$id,
    createdBy: $auth.userId
  }).then(project => {
    // Success - UI auto-updates
  }).catch(error => {
    // Permission denied or validation error
    console.error(error.message);
  })
">
  Create Project
</button>

<!-- Update (only if user has permission) -->
<button @click="$x.projects.update(project.$id, { name: 'Updated' })"
        :disabled="!$auth.hasTeamPermission('updateProjects')">
  Update
</button>
```

## Detailed Feature Design

### 1. Database Collections

#### Configuration Options

```json
{
  "posts": {
    "type": "appwrite",
    "databaseId": "main",
    "collectionId": "posts",
    "queries": {
      "default": [
        ["orderDesc", "createdAt"],
        ["limit", 10]
      ],
      "featured": [
        ["equal", "featured", true],
        ["orderDesc", "createdAt"]
      ],
      "byAuthor": [
        ["equal", "authorId", "$auth.userId"]
      ]
    },
    "transform": "documents",  // Optional: extract nested data
    "defaultValue": []        // Fallback if query fails
  }
}
```

#### Query Variants

```html
<!-- Default query -->
<div x-text="$x.posts.length"></div>

<!-- Named query variant -->
<template x-for="post in $x.posts.featured">
  <div x-text="post.title"></div>
</template>

<!-- Dynamic queries (future enhancement) -->
<div x-text="$x.posts.query([['equal', 'status', 'published']]).length"></div>
```

#### Write Operations

```javascript
// Create - returns new document
const newPost = await $x.posts.create({
  title: "My Post",
  content: "Content here",
  authorId: $auth.userId
});

// Update - returns updated document
const updated = await $x.posts.update(documentId, {
  title: "Updated Title"
});

// Delete - returns void
await $x.posts.delete(documentId);
```

### 2. Storage Buckets

#### Configuration

```json
{
  "uploads": {
    "type": "appwrite",
    "bucketId": "user-uploads",
    "queries": {
      "default": [
        ["orderDesc", "dateCreated"]
      ],
      "images": [
        ["equal", "mimeType", "image/jpeg"]
      ]
    }
  }
}
```

#### Access Pattern

```html
<!-- List files -->
<template x-for="file in $x.uploads" :key="file.$id">
  <div>
    <img :src="$x.uploads.url(file.$id)" :alt="file.name">
  </div>
</template>

<!-- Upload file -->
<input type="file" @change="handleUpload($event)">
```

```javascript
// Upload
async function handleUpload(event) {
  const file = event.target.files[0];
  const result = await $x.uploads.create(file, file.name);
  // Auto-refreshes $x.uploads
}

// Delete
await $x.uploads.delete(fileId);

// Get file URL
const url = $x.uploads.url(fileId);
const preview = $x.uploads.preview(fileId, width, height);
```

### 3. Real-time Subscriptions

```html
<div x-data="{ posts: [] }"
     x-init="
       $x.posts.subscribe('documents', (payload) => {
         if (payload.events.includes('database.documents.create')) {
           posts.push(payload.payload);
         }
       });
       posts = $x.posts;
     ">
  <template x-for="post in posts" :key="post.$id">
    <div x-text="post.title"></div>
  </template>
</div>
```

### 4. Permission Handling

Appwrite handles permissions server-side. The client will:

1. **Read Operations**: Fail gracefully if no permission
   ```javascript
   // Returns defaultValue or empty array if permission denied
   const posts = $x.posts; // [] if no read permission
   ```

2. **Write Operations**: Return error details
   ```javascript
   try {
     await $x.posts.create({ title: "..." });
   } catch (error) {
     // Error contains permission details
     console.error(error.message); // "Missing write permission"
   }
   ```

3. **UI Feedback**: Alpine can react to permission state
   ```html
   <button @click="$x.posts.create(...)" 
           :disabled="!$auth.hasPermission('write')">
     Create
   </button>
   ```

### 5. Caching Strategy

- **Read Cache**: Similar to existing data sources (session-based)
- **Write Invalidation**: Automatically refresh affected sources
- **Real-time Updates**: Bypass cache, update store directly
- **Query Variants**: Cache separately (e.g., `posts:featured`)

## Migration Path

### Phase 1: Core Infrastructure
- [ ] Create `indux.appwrite.data.js` module
- [ ] Extend `manifest.json` schema for Appwrite sources
- [ ] Integrate with existing data sources plugin
- [ ] Basic read operations for collections

### Phase 2: Write Operations
- [ ] Implement create/update/delete for collections
- [ ] Implement upload/delete for storage
- [ ] Auto-refresh on write operations
- [ ] Error handling and permission feedback

### Phase 3: Advanced Features
- [ ] Real-time subscriptions
- [ ] Query variants support
- [ ] Storage file operations (upload, preview, download)
- [ ] Optimistic updates

### Phase 4: Developer Experience
- [ ] TypeScript definitions (if applicable)
- [ ] Documentation
- [ ] Examples and templates
- [ ] Error messages and debugging tools

## Benefits of This Approach

1. **Consistency**: Same `$x` pattern developers already know
2. **Progressive Enhancement**: Works alongside existing local/API sources
3. **Reactive**: Automatic UI updates via Alpine
4. **Permission-Aware**: Leverages Appwrite's security model
5. **Flexible**: Supports queries, real-time, and complex operations
6. **Minimal Config**: Sensible defaults, optional customization

## Example: Complete Use Case

```html
<!-- Display posts -->
<template x-for="post in $x.posts" :key="post.$id">
  <article>
    <h2 x-text="post.title"></h2>
    <p x-text="post.content"></p>
    <img :src="$x.uploads.url(post.imageId)" :alt="post.title">
    
    <!-- Edit if owner -->
    <button x-show="$auth.userId === post.authorId"
            @click="editPost(post.$id)">
      Edit
    </button>
  </article>
</template>

<!-- Create new post -->
<form @submit.prevent="createPost">
  <input x-model="newPost.title" placeholder="Title">
  <textarea x-model="newPost.content"></textarea>
  <input type="file" @change="uploadImage">
  <button type="submit">Publish</button>
</form>

<script>
function createPost() {
  $x.posts.create({
    title: newPost.title,
    content: newPost.content,
    imageId: uploadedImageId,
    authorId: $auth.userId
  });
}

function uploadImage(event) {
  const file = event.target.files[0];
  $x.uploads.create(file, file.name).then(result => {
    uploadedImageId = result.$id;
  });
}
</script>
```

## Custom Alpine Directives: When Are They Useful?

### Assessment

**Custom directives are useful for:**
1. **Common CRUD Patterns**: Reduce boilerplate for forms, lists, and common operations
2. **Declarative Operations**: Make intent clear in HTML without JavaScript
3. **Accessibility**: Can add ARIA attributes and keyboard navigation automatically

**Custom directives are NOT necessary for:**
1. **Basic CRUD**: `$x.collection.create()` is already intuitive
2. **Simple Operations**: Alpine's `@click` with `$x` methods is sufficient
3. **Complex Logic**: JavaScript functions are clearer than directive modifiers

### Recommended Directives

#### 1. `x-db-form` - Auto-handle create/update forms

```html
<form x-db-form="projects" 
      :data-id="editingProject?.$id"
      @submit="handleSubmit">
  <input name="name" required>
  <input name="description">
  <button type="submit">Save</button>
</form>
```

**Benefits:**
- Auto-populates form from `data-id` (update mode)
- Auto-scopes to current team/user
- Handles validation errors
- Shows loading states

**Implementation:**
```javascript
Alpine.directive('db-form', (el, { expression }, { evaluate }) => {
  const collectionName = expression;
  const formData = new FormData(el);
  const dataId = el.getAttribute(':data-id') || el.dataset.id;
  
  el.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(formData);
    
    if (dataId) {
      await $x[collectionName].update(dataId, data);
    } else {
      await $x[collectionName].create(data);
    }
  });
});
```

#### 2. `x-db-list` - Auto-load and display collections

```html
<div x-db-list="projects" 
     query="active"
     :scope="{ team: $auth.currentTeam.$id }">
  <template x-for="item in $x.projects.active" :key="item.$id">
    <div x-text="item.name"></div>
  </template>
</div>
```

**Benefits:**
- Auto-loads on mount
- Handles loading/error states
- Can trigger refresh on events

#### 3. `x-db-delete` - Confirmation + delete pattern

```html
<button x-db-delete="projects" 
        :data-id="project.$id"
        confirm="Delete this project?">
  Delete
</button>
```

**Benefits:**
- Built-in confirmation dialog
- Loading state
- Auto-refresh list

### Recommendation

**Start with `$x` magic method only.** Custom directives can be added later based on:
- Developer feedback on common patterns
- Repetitive boilerplate in real projects
- Accessibility requirements

The `$x` magic method is powerful enough for all operations. Directives should enhance DX, not be required.

## Use Case: Team Projects with Storage

### Configuration

```json
{
  "data": {
    // Global content (local files)
    "navigation": "/data/navigation.yaml",
    "features": {
      "en": "/data/features/en.yaml",
      "fr": "/data/features/fr.yaml"
    },
    
    // Team-scoped projects
    "projects": {
      "type": "appwrite",
      "databaseId": "main",
      "collectionId": "projects",
      "scope": "team",
      "queries": {
        "default": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["orderDesc", "createdAt"]
        ],
        "active": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["equal", "status", "active"],
          ["orderDesc", "createdAt"]
        ],
        "byUser": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["equal", "createdBy", "$auth.userId"],
          ["orderDesc", "createdAt"]
        ]
      }
    },
    
    // Project assets (storage)
    "projectAssets": {
      "type": "appwrite",
      "bucketId": "project-assets",
      "scope": "team",
      "queries": {
        "default": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["orderDesc", "dateCreated"]
        ],
        "byProject": [
          ["equal", "teamId", "$auth.currentTeam.$id"],
          ["equal", "projectId", "$projectId"],
          ["orderDesc", "dateCreated"]
        ]
      }
    }
  }
}
```

### Implementation Example

```html
<!-- Team Projects List -->
<div x-data="{ 
  currentTeam: $auth.currentTeam,
  editingProject: null 
}">
  
  <!-- Projects for current team (auto-scoped) -->
  <template x-for="project in $x.projects" :key="project.$id">
    <article>
      <h3 x-text="project.name"></h3>
      <p x-text="project.description"></p>
      
      <!-- Project assets -->
      <div class="assets">
        <template x-for="asset in $x.projectAssets.scope('project', project.$id)" 
                  :key="asset.$id">
          <img :src="$x.projectAssets.url(asset.$id)" 
               :alt="asset.name"
               x-show="asset.mimeType.startsWith('image/')">
          <a :href="$x.projectAssets.url(asset.$id)" 
             x-text="asset.name"
             x-show="!asset.mimeType.startsWith('image/')">
          </a>
        </template>
      </div>
      
      <!-- Upload asset -->
      <input type="file" 
             @change="handleAssetUpload($event, project.$id)"
             :disabled="!$auth.hasTeamPermission('uploadAssets')">
      
      <!-- Edit/Delete (permission-aware) -->
      <button @click="editingProject = project"
              :disabled="!$auth.hasTeamPermission('updateProjects')">
        Edit
      </button>
      <button @click="$x.projects.delete(project.$id)"
              :disabled="!$auth.hasTeamPermission('deleteProjects')">
        Delete
      </button>
    </article>
  </template>
  
  <!-- Create Project Form -->
  <form @submit.prevent="createProject">
    <input x-model="newProject.name" required>
    <textarea x-model="newProject.description"></textarea>
    <button type="submit" 
            :disabled="!$auth.hasTeamPermission('createProjects')">
      Create Project
    </button>
  </form>
</div>

<script>
function createProject() {
  $x.projects.create({
    name: newProject.name,
    description: newProject.description,
    teamId: $auth.currentTeam.$id,
    createdBy: $auth.userId,
    status: 'active'
  }).then(project => {
    newProject = { name: '', description: '' };
    // UI auto-updates via Alpine reactivity
  });
}

async function handleAssetUpload(event, projectId) {
  const file = event.target.files[0];
  const asset = await $x.projectAssets.create(file, file.name, {
    projectId: projectId,
    teamId: $auth.currentTeam.$id,
    uploadedBy: $auth.userId
  });
  // UI auto-updates
}
</script>
```

### Key Features Demonstrated

1. **Automatic Scoping**: `$x.projects` automatically filters by current team
2. **Permission Checks**: Buttons disabled based on team permissions
3. **Storage Integration**: Assets linked to projects, scoped by team
4. **Reactive Updates**: All changes automatically reflect in UI
5. **Context Variables**: Queries use `$auth.currentTeam.$id`, `$auth.userId`

## Open Questions

1. **Naming**: Should we use `$x.posts.create()` or `$x.posts.$create()` to avoid conflicts?
   - **Recommendation**: Use `create()` - conflicts are unlikely, and it's cleaner
2. **Batch Operations**: Should we support batch create/update/delete?
   - **Recommendation**: Yes, as `$x.projects.createBatch([...])` for performance
3. **Relationships**: How to handle relationships between collections?
   - **Recommendation**: Use query variables - `$x.assets.scope('project', project.$id)`
4. **File Uploads**: Drag-and-drop support, progress indicators?
   - **Recommendation**: Start with basic upload, add progress via events
5. **Offline Support**: Cache strategies for offline scenarios?
   - **Recommendation**: Use existing data source cache, add offline queue for writes
6. **Query Variable Security**: How to prevent injection in `$auth` variables?
   - **Recommendation**: Whitelist allowed variables, sanitize all inputs

## Summary: Addressing Key Questions

### Are Custom Alpine Directives Useful for CRUD?

**Short answer: Optional, not required.**

The `$x` magic method is sufficient for all CRUD operations:
- `$x.projects.create({...})` - Clear and intuitive
- `$x.projects.update(id, {...})` - Standard pattern
- `$x.projects.delete(id)` - Simple and direct

**Custom directives add value for:**
- **Common patterns**: `x-db-form` reduces form boilerplate
- **Accessibility**: Auto-add ARIA attributes, keyboard navigation
- **Declarative intent**: Makes HTML more self-documenting

**Recommendation**: Start with `$x` magic method only. Add directives later if patterns emerge that would benefit from them. The magic method is powerful enough on its own.

### How Does `$x` Extend Gracefully for Scoped Content?

**Solution: Context-Aware Scoping with Variable Interpolation**

1. **Configuration-Level Scoping:**
   ```json
   {
     "projects": {
       "scope": "team",  // Auto-inject team context
       "queries": {
         "default": [
           ["equal", "teamId", "$auth.currentTeam.$id"]
         ]
       }
     }
   }
   ```

2. **Runtime Variable Interpolation:**
   - `$auth.userId` → Current user ID
   - `$auth.currentTeam.$id` → Current team ID
   - Variables are resolved when queries execute
   - Failed lookups return empty arrays (graceful degradation)

3. **Dynamic Override:**
   ```html
   <!-- Default scope (team) -->
   <template x-for="p in $x.projects">
   
   <!-- Override scope -->
   <template x-for="p in $x.projects.scope('user')">
   ```

4. **Permission Integration:**
   - All operations respect Appwrite permissions
   - Failed operations return errors (don't crash)
   - UI can react to permission state: `:disabled="!$auth.hasTeamPermission('createProjects')"`

**Key Insight**: Local files are global by nature. Database collections are contextual by design. The `$x` magic method bridges this gap by:
- Auto-injecting context variables into queries
- Providing scoping modes (`user`, `team`, `none`)
- Allowing runtime overrides when needed
- Failing gracefully when context is unavailable

### Example: Team Projects Use Case

```html
<!-- Global content (local files) - everyone sees the same -->
<nav>
  <template x-for="item in $x.navigation">
    <a :href="item.path" x-text="item.label"></a>
  </template>
</nav>

<!-- Team-scoped projects - only current team's projects -->
<div x-show="$auth.currentTeam">
  <template x-for="project in $x.projects">
    <div x-text="project.name"></div>
  </template>
</div>

<!-- User-scoped settings - only current user's settings -->
<div x-show="$auth.isAuthenticated">
  <div x-text="$x.userSettings.theme"></div>
</div>
```

**What happens:**
1. `$x.navigation` → Loads from `/data/navigation.yaml` (global, no scoping)
2. `$x.projects` → Queries Appwrite with `teamId = $auth.currentTeam.$id` (auto-scoped)
3. `$x.userSettings` → Queries Appwrite with `userId = $auth.userId` (auto-scoped)

**If context unavailable:**
- No team selected → `$x.projects` returns `[]` (empty array)
- Not authenticated → `$x.userSettings` returns `{}` (empty object)
- UI doesn't break, just shows no data

## Conclusion

This architecture maintains Indux's philosophy of simplicity while adding powerful database and storage capabilities. By extending the existing `$x` pattern with context-aware scoping, developers can seamlessly transition from static content to dynamic, permission-aware data sources without learning a new API.

**Key Achievements:**
- ✅ Unified access pattern (`$x` works for local files, APIs, and databases)
- ✅ Automatic scoping (user/team context injected automatically)
- ✅ Permission-aware (operations respect Appwrite permissions)
- ✅ Graceful degradation (missing context doesn't break UI)
- ✅ Progressive enhancement (custom directives optional, not required)


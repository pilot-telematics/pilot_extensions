
# AI SPEC — PILOT Marketplace Extensions (v2.0)

This specification defines **MANDATORY RULES** for generating code for
**PILOT Marketplace extensions**.

This spec is written for **AI code generation**.
If any default assumption conflicts with this spec, **THIS SPEC OVERRIDES EVERYTHING**.

Target platform:
- PILOT Marketplace
- Ext JS 7.7+ (already loaded by PILOT)
- Extension runtime based on `skeleton`
- Official reference:
  https://github.com/pilot-telematics/pilot_extensions

---

## 1. Core Architecture (NON-NEGOTIABLE)

- PILOT extensions are **NOT standalone web applications**
- Extensions run **inside the existing PILOT Ext JS application**
- Ext JS runtime is **already loaded**
- The global object `skeleton` is **provided by PILOT**
- Extensions are loaded **ONLY via Module.js**
- HTML files are **NEVER** used to bootstrap code

### STRICTLY FORBIDDEN
❌ Loading Ext JS manually (CDN, script tags)  
❌ Mocking or simulating `skeleton`  
❌ Creating SPA-style applications  
❌ Using global entry functions  
❌ Initializing logic inside HTML  
❌ Treating PILOT as a generic website  

---

## 2. PILOT UI Structure (MUST UNDERSTAND)

PILOT main window layout:

```

┌───────────────────────────────────────────────┐
│ skeleton.header                               │
│ (top panel: buttons, indicators)              │
├───────────────┬───────────────────────────────┤
│ skeleton.     │ skeleton.mapframe             │
│ navigation    │ (main content: map / panels)  │
│ (left panel)  │                               │
└───────────────┴───────────────────────────────┘

````

Key objects:
- `skeleton.navigation` → left navigation tabs
- `skeleton.navigation.online.online_tree` → online tree in main section → online tab
- `skeleton.navigation.online.online_tree.context_menu` → online tree context menu
- `skeleton.mapframe` → main content area
- `skeleton.header` → top toolbar
- `skeleton.header.menu_btn.menu` → global menu in top toolbar
- `mapContainer` → main map component



---

## 3. Mandatory Module.js Structure (CRITICAL)

Every extension **MUST** define `Module.js` exactly as an **Ext JS class**:

```js
Ext.define('Store.<app>.Module', {
    extend: 'Ext.Component',

    initModule: function () {

        // 1. Create navigation component (left panel)
        var navTab = Ext.create('Store.<app>.view.Navigation');

        // 2. Create main panel (mapframe)
        var mainPanel = Ext.create('Store.<app>.view.MainPanel');

        // 3. Link navigation to main panel
        navTab.map_frame = mainPanel;

        // 4. Register components in PILOT
        skeleton.navigation.add(navTab);
        skeleton.mapframe.add(mainPanel);
    }
});
````

### ABSOLUTE RULES

* `initModule` MUST be a **method of the class**
* DO NOT define `function initModule()` globally
* DO NOT pass plain JS objects into `skeleton.navigation.add`
* ALL UI elements MUST be Ext JS components
* ALL components MUST be created via `Ext.create(...)`
* ALL classes MUST use namespace:

```
Store.<app>.*
```

Any violation makes the output INVALID.

---

## 4. File Structure Rules

### REQUIRED FILES

* `Module.js`
* `doc/index.html`

### OPTIONAL FILES (only if justified)

* `style.css`
* `resources/css/*.css`
* helper JS classes under `Store.<app>.*`

Rules:

* Keep structure **flat and readable**
* Avoid unnecessary files
* Provide **full content** of every file created
* Clearly label file paths in output

---

## 5. `doc/index.html` (DOCUMENTATION ONLY)

`doc/index.html` is used by **PILOT Marketplace** as application documentation.

### MUST

* Be static HTML
* Optionally include inline CSS
* Describe:

    * purpose of the extension
    * user-visible functionality
    * data sources (PILOT / external)
    * configuration steps

### STRICTLY FORBIDDEN

❌ `<script>` tags
❌ Loading Ext JS
❌ Initializing `skeleton`
❌ Running any JavaScript logic
❌ Bootstrapping the extension

---

## 6. Working with PILOT API

When accessing PILOT data, use backend APIs such as:

```
/ax/tree.php
```

Typical usage:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: {
        vehs: 1,
        state: 1
    }
});
```

### API DATA RULES

* Tree responses are **hierarchical**
* Root array contains **groups**
* Each group has `children` array
* DO NOT assume flat arrays
* Always iterate:
  `groups → children`

---

## 7. External Services (Generic Rules)

External services may be used **only to enrich PILOT data**.

Rules:

* PILOT remains the **source of truth**
* External data MUST NOT be written back into PILOT
* External APIs MUST be optional
* API keys MUST be configurable by the user
* Keys MAY be stored in browser `localStorage`
* Failures MUST be handled gracefully

---

## 8. Maps and MapContainer

Maps are added via `MapContainer`:

```js
this.map = new MapContainer('map-id');
this.map.init(lat, lon, zoom, containerId, false);
```

Map logic MUST:

* be initialized after component render
* live inside Ext JS components

Map Container API described in

docs/MapContainer.md

---

## 9. Style & Complexity Constraints

* Beginner-friendly
* Clear Ext JS patterns
* No build tools
* No transpilers
* No frameworks beyond Ext JS
* Minimal comments, but helpful
* Avoid overengineering

---

## 10. Self-Validation Checklist (MANDATORY)

Before final output, verify:

* [ ] `Module.js` uses `Ext.define`
* [ ] `initModule` is a class method
* [ ] Navigation component is created with `Ext.create`
* [ ] Main panel is created with `Ext.create`
* [ ] `navTab.map_frame` is set
* [ ] `skeleton.navigation.add(navTab)` is used
* [ ] `skeleton.mapframe.add(mainPanel)` is used
* [ ] `doc/index.html` contains NO scripts
* [ ] No Ext JS CDN links
* [ ] No mocked `skeleton`

If any item fails, the output is INVALID.

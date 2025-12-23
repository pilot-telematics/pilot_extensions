
# AI SPEC — PILOT  Extensions 

This specification defines **MANDATORY RULES** for generating code for
**PILOT Marketplace extensions**.

This spec is written for **AI code generation**.
If any default assumption conflicts with this spec,
**THIS SPEC OVERRIDES EVERYTHING**.

If any rule is violated, the generated output is **INVALID**.

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
- Extensions are loaded **ONLY via `Module.js`**
- HTML files are **NEVER** used to bootstrap code

### FORBIDDEN PATTERNS (AUTO-FAIL)

❌ Loading Ext JS manually (CDN, script tags)  
❌ Mocking or simulating `skeleton`  
❌ Creating SPA-style applications  
❌ Using global entry functions  
❌ `Ext.onReady(...)`  
❌ Initializing logic inside HTML  
❌ Treating PILOT as a generic website  

---

## 2. PILOT UI Structure & Key Objects (MUST UNDERSTAND)

PILOT main window layout:

```

┌───────────────────────────────────────────────┐
│ skeleton.header                               │
│ (top toolbar: buttons, menus, indicators)     │
├───────────────┬───────────────────────────────┤
│ skeleton.     │ skeleton.mapframe             │
│ navigation    │ (main content: map / panels)  │
│ (left panel)  │                               │
└───────────────┴───────────────────────────────┘

````

### Key runtime objects (CAN BE USED BY EXTENSIONS)

- `skeleton.navigation`
  → Left navigation panel  
  → Extensions may add **their own tabs** only

- `skeleton.navigation.online.online_tree`
  → Online objects tree in **Online tab**  
  → Extensions may:
    - read selection
    - listen to events
  → Extensions MUST NOT:
    - destroy
    - replace
    - reinitialize this tree

- `skeleton.navigation.online.online_tree.context_menu`
  → Context menu for online tree items  
  → Extensions MAY:
    - add menu items
  → Extensions MUST:
    - preserve existing menu behavior

- `skeleton.mapframe`
  → Main content area  
  → Extensions add:
    - panels
    - maps
    - dashboards

- `skeleton.header`
  → Top toolbar  
  → Extensions MAY:
    - insert buttons
    - add indicators

- `skeleton.header.menu_btn.menu`
  → Global top-left menu  
  → Extensions MAY:
    - add menu entries
  → Extensions MUST NOT:
    - remove or replace existing menu items

- `MapContainer`
  → Main map abstraction used by PILOT  
  → Used to display maps, markers, routes

---

## 3. Mandatory Module.js Structure (CRITICAL)

Every extension **MUST** define `Module.js` as an **Ext JS class**.

This is the **ONLY valid entry-point pattern**.
Any deviation is INVALID.

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

Backend APIs (example):

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
* Always iterate: `groups → children`

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

Rules:

* Map logic MUST be inside Ext JS components
* Map MUST be initialized after component render
* MapContainer MUST NOT be global

MapContainer API reference:
`docs/MapContainer.md`

---

## 9. Style & Complexity Constraints

* Beginner-friendly
* Clear Ext JS patterns
* No build tools
* No transpilers
* No frameworks beyond Ext JS
* Minimal but helpful comments
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

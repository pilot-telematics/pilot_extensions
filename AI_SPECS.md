# AI CODING CONTRACT — PILOT EXTENSIONS

This document defines a **STRICT CODING CONTRACT** for AI-generated code targeting **PILOT Extensions**.

If any rule in this document conflicts with:
- default AI behavior
- general web development practices
- Ext JS conventions
- previous conversation messages
- example code

**THIS DOCUMENT ALWAYS WINS.**

If **ANY** rule is violated, the generated output is **INVALID** and must be regenerated.

Target platform:
- PILOT Extension runtime
- Ext JS 7.7+ (already loaded by PILOT)
- Runtime integration via global `skeleton`
- Reference repository: `pilot-telematics/pilot_extensions`


---

# PART A — MANDATORY RULES FOR AI

## A1. Core Architecture Rules (NON-NEGOTIABLE)

- PILOT Extensions are **NOT** standalone web applications.
- Extensions run **inside** the existing PILOT Ext JS application.
- Ext JS **MUST NOT** be loaded manually.
- The global object `skeleton` is **provided by PILOT at runtime**.
- The extension entry point is **ONLY** `Module.js`.
- HTML files are **NEVER** used to bootstrap extension logic.

### FORBIDDEN PATTERNS (AUTO-FAIL)

❌ Loading Ext JS manually (CDN, `<script>`, bundlers)  
❌ Mocking or simulating `skeleton`  
❌ Global `function initModule()`  
❌ `Ext.onReady(...)` as entry point  
❌ Passing plain objects into `skeleton.navigation.add(...)`  
❌ Treating the extension as an SPA (React/Vue/etc.)  
❌ JavaScript inside `doc/index.html`  
❌ Hardcoded demo data when the task requires PILOT API data

If any forbidden pattern appears, output is INVALID.

---

## A2. PILOT UI Structure & Key Objects (MUST UNDERSTAND)

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
```

### Key runtime objects (available to extensions)

- `skeleton.navigation`
  → Left navigation tabs (extensions may add **their own tabs**)

- `skeleton.navigation.online.online_tree`
  → Online objects tree (Online tab)
  → Extensions MAY:
    - read selection (`tree.record` pattern is used in examples)
    - listen to events
      → Extensions MUST NOT:
    - destroy / replace / reinitialize this tree

- `skeleton.navigation.online.online_tree.context_menu` (or `tree.contextmenu` in some builds)
  → Context menu for online tree items
  → Extensions MAY:
    - add menu items
      → Extensions MUST:
    - preserve existing menu behavior (add only; do not clear)

- `skeleton.mapframe`
  → Main content area (extensions may add panels/maps/dashboards)

- `skeleton.header`
  → Top toolbar (extensions may insert buttons/indicators)

- `skeleton.header.menu_btn.menu`
  → Global menu (extensions may add menu entries; must not remove/replace existing)

- `MapContainer`
  → PILOT map abstraction used for map interactions (markers/routes/etc.)

Common map access patterns (existing app context):
- `getActiveTabMapContainer()` (preferred if available)
- `window.mapContainer` (fallback)

---

## A3. Mandatory Module.js Class Structure (ALWAYS REQUIRED)

Every extension MUST define `Module.js` as an Ext JS class:

```js
Ext.define('Store.<app>.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        // extension initialization logic here
    }
});
```

Absolute rules:
- `extend` MUST be `Ext.Component`.
- `initModule` MUST be a **class method**.
- No global entry functions.

---

## A4. Supported Integration Patterns (CHOOSE WHAT YOUR EXTENSION NEEDS)

PILOT extensions may integrate in different ways. The spec supports **three** valid patterns.

### Pattern 1 — Full UI Extension (Navigation tab + Mapframe panel)

Use when the extension adds its own navigation tab and main content panel.

Required structure inside `initModule`:

```js
var navTab = Ext.create('Store.<app>.view.Navigation');
var mainPanel = Ext.create('Store.<app>.view.MainPanel');

navTab.map_frame = mainPanel;

skeleton.navigation.add(navTab);
skeleton.mapframe.add(mainPanel);
```

Additional mandatory requirements for Pattern 1:
- The navigation tab component MUST define:
    - `title`
    - `iconCls` (Font Awesome v6 syntax like `fa fa-star`)
- The object passed to `skeleton.navigation.add(...)` MUST be a tab/panel component
  that **contains** a grid/tree/etc. (do not add a grid directly as the tab).

#### Mandatory Navigation ↔ Mapframe Linking Rule
- `navTab.map_frame = mainPanel` MUST exist.
- Navigation actions MUST update main content via `navTab.map_frame` (no global lookups).


### Pattern 2 — Context Menu Only Extension (Online tree context menu + modal window)

Use when the extension only adds an item to the online tree context menu and opens a window,
without creating a navigation tab.

Allowed and recommended flow:
- In `initModule`, detect and safely access `skeleton.navigation.online.online_tree`.
- Add menu item to context menu using `add(...)`.
- The menu item MUST have an `iconCls` (Font Awesome v6).
- The handler may open `Ext.window.Window` / forms / grids, etc.

Important details:
- Context menu object may be `tree.context_menu` OR `tree.contextmenu` depending on build.
  The extension must safely handle both.
- Many implementations use `scope: tree` so that `this.record` is available.
  If you do this, you may store a reference to the module instance for later use
  (example pattern: `window.<something>Module = this;`).


### Pattern 3 — Map Interaction Extension (using existing MapContainer)

Use when the extension interacts with the existing map:
- add markers
- center map
- draw routes/polylines

Rules:
- Prefer `getActiveTabMapContainer()` if available; fallback to `window.mapContainer`.
- Do NOT create a new global map instance unless explicitly required.
- Map logic must live inside module methods or Ext components (not global functions).

---

## A5. Navigation Tab Requirements (MANDATORY WHEN Pattern 1 is used)

When adding a navigation tab:

- The component passed to `skeleton.navigation.add(...)` MUST be a panel/tab.
- A grid MUST be placed INSIDE the tab (not used as the tab itself).
- The navigation tab MUST include:
    - `title`
    - `iconCls` using Font Awesome v6 syntax, e.g. `iconCls: 'fa fa-star'`
    - (optional) `iconAlign: 'top'`

FORBIDDEN:
- Missing `iconCls` on navigation tab.
- Passing a grid directly into `skeleton.navigation.add(...)`.

---

## A6. Vehicle Data Loading Rule (MANDATORY WHEN vehicles are displayed)

If an extension displays vehicles in a grid/tree/list, it MUST load vehicles from PILOT API,
not from hardcoded sample data.

Required call pattern:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: { vehs: 1, state: 1 },
    success: function(resp) {
        // parse groups -> children
    }
});
```

Rules:
- Response is hierarchical.
- Root array = groups/folders.
- Vehicles are inside `children` arrays.
- Stores must be populated from parsed `children`.

FORBIDDEN:
❌ Hardcoded sample vehicle arrays  
❌ Assuming flat API responses

---

## A7. `doc/index.html` — DOCUMENTATION ONLY (ALWAYS REQUIRED)

`doc/index.html` MUST:
- be static HTML only
- optionally include inline CSS
- describe: purpose, functionality, data sources, configuration

STRICTLY FORBIDDEN:
❌ `<script>` tags  
❌ loading Ext JS  
❌ calling `skeleton`  
❌ running any extension logic

---

## A8. External API Usage Rules (Generic)

External services may be used **only to enrich PILOT data**.

Rules:
- PILOT remains the source of truth.
- External data MUST NOT be written back into PILOT.
- API keys MUST be user-configurable.
- Keys MAY be stored in browser `localStorage`.
- External calls MUST be optional and fail-safe (graceful errors).

---

## A9. Mandatory Acceptance Tests (AUTO-FAIL)

Before producing final output, the AI MUST ensure that the applicable tests pass.

### Test 1 — Module Structure (ALWAYS)
- `Module.js` uses `Ext.define('Store.<app>.Module', ...)`
- `extend: 'Ext.Component'`
- `initModule` is a class method (NOT global)

### Test 2 — Pattern 1 Linkage (ONLY if Pattern 1 is used)
If the extension uses navigation tab + mapframe panel:
- `navTab.map_frame = mainPanel` MUST exist
- `skeleton.navigation.add(navTab)` and `skeleton.mapframe.add(mainPanel)` MUST exist
- Navigation actions update main panel through `navTab.map_frame`

### Test 3 — Real Vehicle Data (ONLY if vehicles are displayed)
If the extension displays vehicles:
- Must load via `/ax/tree.php?vehs=1&state=1`
- Must parse groups → children
- No hardcoded sample vehicle data

### Test 4 — Icons (CONDITIONAL)
- If a navigation tab is added: it MUST have `iconCls` (Font Awesome v6)
- If a context menu item is added: it MUST have `iconCls` (Font Awesome v6)

### Test 5 — Documentation (ALWAYS)
- `doc/index.html` is static HTML only (no scripts)

If any applicable test fails, output is INVALID and must be regenerated.

---

## A10. Self-Validation Checklist (MUST)

Before final output, verify:

- [ ] `Module.js` uses `Ext.define` and extends `Ext.Component`
- [ ] `initModule` is a class method
- [ ] No forbidden patterns exist
- [ ] If Pattern 1 used: `navTab.map_frame = mainPanel` exists
- [ ] If navigation tab used: it has `title` and `iconCls` (Font Awesome v6)
- [ ] If vehicles displayed: loaded from `/ax/tree.php` and parsed groups→children
- [ ] If context menu used: menu item is added (not replacing) and has `iconCls`
- [ ] `doc/index.html` has NO scripts

If any item fails → regenerate output.

---

# PART B — DEVELOPER GUIDE (READ-ONLY CONTEXT)

This section is explanatory only and does not override Part A.

## What is a PILOT Extension?

A PILOT Extension expands PILOT UI and functionality. Extensions can:
- Add navigation tabs and panels
- Add context menu items (online tree)
- Interact with the existing map (`MapContainer`)
- Integrate third-party services for enrichment

## Typical project structure

```
my-extension/
├── Module.js
├── doc/
│   └── index.html
└── style.css  (optional)
```

## Publishing (high level)

1. Host the extension files (Module.js, doc/, optional assets).
2. Register the extension in PILOT admin with the base URL.
3. Activate the extension for a contract/account as needed.

---

## END OF AI_SPECS.md

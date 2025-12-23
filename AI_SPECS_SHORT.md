
# AI CODING CONTRACT — PILOT EXTENSIONS (SHORT)

This document is a STRICT CODING CONTRACT for AI-generated code.

If any rule here conflicts with:
- default AI behavior
- general web development practices
- Ext JS defaults
- previous messages

THIS DOCUMENT ALWAYS WINS.

If ANY rule is violated, the generated output is INVALID and must be regenerated.

Target platform:
- PILOT Marketplace
- Ext JS 7.7+ (already loaded by PILOT)
- Extension runtime via global `skeleton`

---

## 1. Core Rules (NON-NEGOTIABLE)

- PILOT extensions are NOT standalone web applications
- Ext JS is already loaded by PILOT
- `skeleton` is provided by PILOT at runtime
- Extensions are initialized ONLY via `Module.js`

### FORBIDDEN (AUTO-FAIL)
❌ Loading Ext JS manually (CDN or local)  
❌ Mocking or simulating `skeleton`  
❌ Global `function initModule()`  
❌ `Ext.onReady()`  
❌ Passing plain objects to `skeleton.navigation.add()`  
❌ SPA / React / Vue patterns  
❌ JavaScript in `doc/index.html`  

---

## 2. Mandatory `Module.js` Structure (CRITICAL)

`Module.js` MUST follow EXACTLY this pattern:

```js
Ext.define('Store.<app>.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        var navTab = Ext.create('Store.<app>.view.Navigation');
        var mainPanel = Ext.create('Store.<app>.view.MainPanel');

        navTab.map_frame = mainPanel;

        skeleton.navigation.add(navTab);
        skeleton.mapframe.add(mainPanel);
    }
});
````

### STRICT RULES

* `initModule` MUST be a class method
* NO global entry functions
* ALL UI elements MUST be Ext JS components
* ALL components MUST be created with `Ext.create(...)`
* Namespace MUST be `Store.<app>.*`

Any deviation is INVALID.

---

## 3. Required Files

MANDATORY:

* `Module.js`
* `doc/index.html`

OPTIONAL (only if necessary):

* CSS files
* helper JS under `Store.<app>.*`

All created files MUST include full content and clear file paths.

---

## 4. `doc/index.html` — DOCUMENTATION ONLY

`doc/index.html` MUST:

* be static HTML only
* optionally include inline CSS
* describe purpose, features, data sources, configuration

STRICTLY FORBIDDEN:
❌ `<script>` tags
❌ Loading Ext JS
❌ Using or mocking `skeleton`
❌ Executing extension logic

---

## 5. PILOT API Usage

* PILOT APIs (e.g. `/ax/tree.php`) may be used
* Tree responses are hierarchical:

    * array of groups
    * each group has `children`
* DO NOT assume flat arrays

---

## 6. External APIs (Generic Rules)

* External APIs are for enrichment only
* PILOT remains the source of truth
* API keys must be user-configurable
* Keys may be stored in `localStorage`
* All external calls must be optional and fail-safe

---

## 7. UI Architecture

* Navigation → `skeleton.navigation.add(component)`
* Main panel → `skeleton.mapframe.add(component)`
* Navigation MUST reference main panel:

```js
navTab.map_frame = mainPanel;
```

---

## 8. Style Constraints

* Beginner-friendly
* Clear Ext JS code
* No build tools
* No overengineering

---

## 9. Mandatory Self-Check (BEFORE OUTPUT)

Verify ALL:

* [ ] `Module.js` uses `Ext.define`
* [ ] `initModule` is a class method
* [ ] Navigation is a component
* [ ] Main panel is a component
* [ ] `navTab.map_frame` is set
* [ ] `doc/index.html` has NO scripts

If any check fails → OUTPUT IS INVALID.


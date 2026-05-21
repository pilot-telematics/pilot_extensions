# AI Extension Generation Guide

This guide tells an AI coding agent how to use this repository to generate PILOT Extensions from a business idea.

Read this after [../AI_SPECS.md](../AI_SPECS.md). The specs are mandatory. This guide explains the workflow.

## 1. First Decision: Choose the Integration Pattern

Before writing code, classify the business idea.

Use `Full UI Extension` when the user needs a new working area:

- dashboard;
- table/list with details;
- editor;
- monitoring panel;
- report-like UI;
- business subsystem.

Use `Context Menu Extension` when the user wants an action on an existing PILOT object:

- add a command to Online tree;
- open a modal for the selected vehicle;
- draw something on the existing map;
- enrich the selected object with external data.

Use `Existing Map Interaction` when the user explicitly says to use the current PILOT map:

- Online map: `window.mapContainer`;
- History map: `window.historyMapContainer`;
- active tab map: `getActiveTabMapContainer()` if available.
- PILOT maps are `MapContainer` wrappers over Leaflet; read `docs/MapContainer.md` before using map center, markers, routes, geozones, or coordinates.

Use `Custom Map Panel` only when the extension needs its own map view.

Use `Header Button` when the feature is global and should be available from the top PILOT header:

- account-wide notification;
- quick status window;
- global import/export action;
- link to an external business system.

Use `Header Menu Item` when the action is useful but should not take header space. Add it to `skeleton.header.menu_btn.menu` only after checking that the menu exists.

Use `Advanced Host Integration` only when the user explicitly asks to extend an existing PILOT workflow such as Reports, Vehicle Editor, History, or a built-in settings window. Built-in PILOT modules use these patterns, but generated Extensions must guard every host object and optional hook with existence checks.

## 2. Files to Inspect

Always inspect:

1. `AI_SPECS.md`
2. `docs/AI_EXTENSION_GUIDE.md`
3. one closest example
4. `docs/PILOT_RUNTIME_UTILS.md`
5. `docs/IDEA_TO_EXTENSION.md` or `docs/IDEA_TO_EXTENSION_RU.md` for the expected delivery shape

Example mapping:

- Minimal tab/panel: `examples/hello_world/Module.js`
- Starter app: `examples/template_app/Module.js`
- List + custom map: `examples/airports/Module.js`, `Tab.js`, `Map.js`
- Action from Online tree: `examples/nearby_poi/Module.js`
- Complex backend module: `examples/communal/Module.js`, `docs/communal_RU.md`
- Map API details: `docs/MapContainer.md` or `docs/MapContainer_RU.md` when the idea uses maps, markers, routes, geozones, map center, or coordinates
- Marker icons: `docs/MarkerIconApi.md`
- Deployment: `DEPLOY.md`
- PILOT runtime utilities, Highcharts, jQuery, UOM, renderers: `docs/PILOT_RUNTIME_UTILS.md` or `docs/PILOT_RUNTIME_UTILS_RU.md`

Do not blindly copy legacy patterns that conflict with `AI_SPECS.md`.

Third-party developers work with the runtime objects and classes already loaded by the compiled PILOT application. Extensions should define their own business classes under `Store.<name>.*` and may use host utilities such as `Pilot.utils.LeftBarPanel`, `Pilot.utils.Toggle`, `Pilot.utils.ColorField`, `Pilot.utils.DateTimeField`, `Pilot.utils.TreeSearchField`, and `Pilot.utils.MapContainer` when those utilities are available in the target PILOT runtime.

## 2.1 Lessons From Built-In PILOT Modules

The private PILOT modules were reviewed to extract architecture patterns, not to publish or copy their source code. Use these lessons:

- Simple modules usually define one `Module` class, extend `Ext.Component`, and do all runtime registration in `initModule(...)`.
- Full UI modules create a navigation component and a paired main panel, assign `navTab.map_frame = mainPanel`, then add them to `skeleton.navigation` and `skeleton.mapframe`.
- Action modules add items to existing menus such as Online tree context menu, group context menu, folder context menu, header buttons, or the header dropdown menu.
- Larger modules create stores in `Module.js` or a central container, then pass them into tabs, grids, maps, and windows instead of relying on random globals.
- Expensive stores should load lazily on `show`, `beforeshow`, or explicit user action when possible.
- Reports and editor integrations are advanced: add UI only when the target host container exists, and keep fallback behavior when it does not.
- Built-in modules sometimes use internal hooks or module namespaces. Generated Extensions should prefer stable runtime objects first and use optional hooks only behind `if (window.MODULE_OVERRIDER)` or similar guards.
- Always add to existing host UI; do not remove, recreate, or replace PILOT tabs, trees, maps, menus, or header components.

Default pattern order for AI:

1. Context menu only, if one selected object action is enough.
2. Header button or header menu item, if the action is global.
3. Full UI Extension, if the feature needs its own workspace.
4. Existing map interaction, if the task is map output on the current Online/History map.
5. Custom map panel, only if the feature needs an independent map.
6. Advanced host integration, only when the user explicitly asks for Reports/settings/editor integration.

Before generating custom charting, unit conversion, or formatting code, check PILOT runtime helpers:

- `Highcharts` and `Highcharts.seriesTypes.sunburst`;
- `jQuery` / `$`;
- `window.uom` and UOM helpers like `speedSS`, `mileageSS`, `volumeSS`;
- renderers like `num`, `dateTimeStr`, `secondsToHumanTime`, `makeAddress`, `makeGeoZone`.

## 3. Runtime Facts to Preserve

PILOT provides the application shell. Generated code must integrate into it.

Globals:

- `window.skeleton`
- `window.skeleton.header`
- `window.skeleton.navigation`
- `window.skeleton.navigation.online.online_tree`
- `window.skeleton.mapframe`
- `window.skeleton.map_frame`
- `window.mapContainer`
- `window.historyMapContainer`

Use `skeleton.mapframe` for new code in this repository. If supporting uncertain runtime builds, use:

```js
function getMainFrame() {
    return (window.skeleton && (skeleton.mapframe || skeleton.map_frame)) || null;
}
```

Do not confuse:

- `skeleton.mapframe` / `skeleton.map_frame` - the host container;
- `navTab.map_frame` - a property that links one navigation component to its paired main panel.

The same convention is exposed in the runtime: a navigation component can keep a reference to its paired main panel in `map_frame`, while the host main frame is `skeleton.mapframe` or, in some builds, `skeleton.map_frame`.

## 3.1 Extension Name And Class Name

The PILOT Extension name entered in admin must be safe for Ext JS class names. Use lowercase `snake_case`, for example `weather_demo`.

PILOT creates the entry class name from that admin name:

```text
Store.<extension_name>.Module
```

So this is correct:

```js
Ext.define('Store.weather_demo.Module', {
    extend: 'Ext.Component'
});
```

This is not a safe PILOT Extension name:

```text
weather-demo
```

It makes PILOT try to create `Store.weather-demo.Module`, which will not match `Store.weather_demo.Module`. Public hosting project names may still use hyphens, for example `https://weather-demo.YOUR.pages.dev/`, but the PILOT Extension name and `/store/...` path should be `weather_demo`.

## 4. Recommended Full UI Skeleton

Use this when generating a normal extension with its own tab and main panel.

```js
Ext.define('Store.my_extension.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        var navTab = Ext.create('Pilot.utils.LeftBarPanel', {
            title: l('My Extension'),
            iconCls: 'fa fa-layer-group',
            iconAlign: 'top',
            minimized: true,
            items: [
                Ext.create('Store.my_extension.view.NavigationContent', {})
            ]
        });

        var mainPanel = Ext.create('Store.my_extension.view.MainPanel', {});

        navTab.map_frame = mainPanel;

        skeleton.navigation.add(navTab);
        skeleton.mapframe.add(mainPanel);
    }
});
```

If `Pilot.utils.LeftBarPanel` is not appropriate, use an `Ext.panel.Panel` wrapper. Avoid passing a grid directly to `skeleton.navigation.add(...)` in new generated code.

## 5. Recommended Context Menu Skeleton

Use this when the extension adds a command to Online tree.

```js
Ext.define('Store.my_extension.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        var me = this;

        if (!window.skeleton ||
            !skeleton.navigation ||
            !skeleton.navigation.online ||
            !skeleton.navigation.online.online_tree) {
            Ext.log('my_extension: online tree not found');
            return;
        }

        var tree = skeleton.navigation.online.online_tree;
        var menu = tree.contextmenu || tree.context_menu;

        if (!menu || !menu.add) {
            Ext.log('my_extension: online tree context menu not found');
            return;
        }

        window.myExtensionModule = me;

        menu.add({
            text: l('My Action'),
            iconCls: 'fa fa-bolt',
            handler: me.onAction,
            scope: tree
        });
    },

    onAction: function () {
        var tree = this;
        var module = window.myExtensionModule;
        var record = tree.record;

        if (!module || !record) {
            Ext.Msg.alert('My Action', l('No object selected'));
            return;
        }

        module.openWindow(record);
    }
});
```

When the selected object needs coordinates:

```js
var lat = record.get('lat');
var lon = record.get('lon');

if (!Ext.isNumber(lat) || !Ext.isNumber(lon)) {
    Ext.Msg.alert('My Action', l('Selected object has no coordinates'));
    return;
}
```

## 5.1 Recommended Header Button Skeleton

Use this for global actions that should be one click away.

```js
Ext.define('Store.my_extension.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        if (!window.skeleton || !skeleton.header || !skeleton.header.insert) {
            Ext.log('my_extension: header not found');
            return;
        }

        skeleton.header.insert(5, {
            xtype: 'button',
            cls: 'header_tool my_extension-header-btn',
            iconCls: 'fa fa-bolt',
            tooltip: l('My Extension'),
            handler: this.openWindow,
            scope: this
        });
    },

    openWindow: function () {
        Ext.create('Store.my_extension.view.MainWindow', {}).show();
    }
});
```

Add a CSS rule for every header button class. The PILOT header can be light gray, so a white icon or white text without a button background has poor contrast.

```css
.my_extension-header-btn {
    background: #2563eb !important;
    border-color: #1d4ed8 !important;
}

.my_extension-header-btn .x-btn-inner,
.my_extension-header-btn .x-btn-icon-el {
    color: #ffffff !important;
}

.my_extension-header-btn:hover {
    background: #1d4ed8 !important;
}
```

Use a header dropdown menu item for less frequent actions:

```js
var menu = skeleton.header.menu_btn && skeleton.header.menu_btn.menu;

if (menu && menu.add) {
    menu.add({
        text: l('My Extension'),
        iconCls: 'fa fa-puzzle-piece',
        handler: this.openWindow,
        scope: this
    });
}
```

Do not remove or reorder native PILOT header items unless the user explicitly asks and the target runtime is known.

## 5.2 Advanced Host Integration Rules

Use these only when the business idea truly requires integration into existing PILOT sections such as Reports, Vehicle Editor, History, or native settings:

- Check every host object before use.
- Prefer adding a tab/panel/menu item over overriding existing behavior.
- If an optional hook such as `MODULE_OVERRIDER` is available, guard it:

```js
if (window.MODULE_OVERRIDER && MODULE_OVERRIDER.append) {
    MODULE_OVERRIDER.append('Pilot.view.online.VehicleEditor', function (win) {
        // Add Extension UI only after checking the expected host methods.
    });
}
```

- Provide a fallback in the zip documentation when the hook is not available in the target PILOT build.
- Do not depend on built-in module namespaces like `Pilot.modules.*` from an Extension. Keep Extension code under `Store.<extension>.*`.

## 6. Map Access Recipe

Read `docs/MapContainer.md` before generating map code. `MapContainer` is a PILOT wrapper over Leaflet. Do not assume Google Maps-style APIs such as `getMap().getCenter().lat()` / `.lng()` unless that adapter was verified in the target runtime.

Use this for Online map actions:

```js
function getPilotMap() {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

Use this for History-specific actions:

```js
function getHistoryMap() {
    return window.historyMapContainer || null;
}
```

Use this guarded helper when the feature needs the current map center:

```js
function getMapCenter(map) {
    if (!map) {
        return null;
    }

    if (map.map && map.map.getCenter) {
        var center = map.map.getCenter();

        return {
            lat: center.lat,
            lon: center.lng
        };
    }

    return null;
}
```

PILOT marker helpers generally use `lat` and `lon`; Leaflet internals use `lat` and `lng`.

Before drawing new output, remove old output created by the extension.

```js
function cleanupMap(markerIds) {
    var map = getPilotMap();

    if (!map) {
        return;
    }

    if (map.removePilyline) {
        map.removePilyline();
    } else if (map.removePolyline) {
        map.removePolyline();
    }

    Ext.Array.forEach(markerIds || [], function (id) {
        var marker = map.getMarker && map.getMarker(id);

        if (marker && map.removeMarker) {
            map.removeMarker(marker);
        }
    });
}
```

## 7. Vehicle Data Recipe

If the user asks for objects, vehicles, units, agents, or fleet lists, do not invent static data.

Use:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: {
        vehs: 1,
        state: 1
    },
    success: function (response) {
        var groups = Ext.decode(response.responseText);
        var vehicles = [];

        function walk(nodes) {
            Ext.Array.forEach(nodes || [], function (node) {
                if (node.children && node.children.length) {
                    walk(node.children);
                } else if (node.vehid || node.agentid || node.typeid) {
                    vehicles.push(node);
                }
            });
        }

        walk(groups);
    }
});
```

Adjust vehicle detection to the actual fields used by the feature.

## 8. Documentation File Recipe

Always create `doc/index.html`.

It should explain:

- purpose;
- user flow;
- data sources;
- external APIs;
- configuration;
- deployment notes;
- limitations.

It must not contain `<script>`.

## 9. Deployment Notes to Include When Relevant

If the user asks for a deliverable extension, mention the final upload structure:

```text
extension-upload/
├── index.html
├── Module.js
├── style.css
└── doc/
    └── index.html
```

For Cloudflare deployment, root `index.html` is required next to `Module.js`. It may be empty or duplicate `doc/index.html`; its purpose is to make Cloudflare treat the uploaded folder as the assets root.

The direct verification URL must point to:

```text
https://HOST/Module.js
```

The registered PILOT admin URL must be the base URL:

```text
https://HOST/
```

After registration, runtime code should use the PILOT same-origin proxy path:

```text
/store/<extension>/
/store/<extension>/Module.js
/store/<extension>/doc/index.html
/store/<extension>/backend/
```

Example: if the Extension name is `myapp` and the admin URL is `https://somehost.com/blabla/`, then `/store/myapp/backend/` proxies to `https://somehost.com/blabla/backend/`.

If the external host is `https://weather-demo.YOUR.pages.dev/`, still prefer `weather_demo` as the PILOT Extension name. The runtime path then becomes `/store/weather_demo/Module.js`, not `/store/weather-demo/Module.js`.

Use [../DEPLOY.md](../DEPLOY.md) for hosting-specific instructions.

If the extension includes custom CSS, tell the AI to prefer Tailwind CSS palette colors for new custom colors. This does not mean loading Tailwind CSS; it is only a palette rule unless the user explicitly asks for Tailwind as a dependency.

The generated Extension deliverable must be a zip archive with the complete file structure. The chat answer should not print full source code by default. It should include a concrete launch path:

1. zip archive name;
2. file tree inside the zip;
3. exact upload folder structure;
4. exact public URLs that must open after upload;
5. exact direct `Module.js` URL to verify in a browser;
6. safe `snake_case` PILOT Extension name to enter in admin;
7. exact base URL to register in PILOT admin;
8. proxied `/store/<extension>/...` runtime URLs for docs/assets/backend;
9. browser verification steps;
10. troubleshooting for `404`, HTML instead of JS, CORS, `skeleton is undefined`, `Store.weather-demo.Module` name mismatches, and missing Ext classes.

## 10. Final Response Checklist for AI

Before final answer:

- Inspect generated `Module.js`.
- Verify the PILOT Extension name is lowercase `snake_case` and the class name matches it exactly.
- Verify there is no standalone app bootstrap.
- Verify `doc/index.html` has no scripts.
- Verify every header button has an Extension-specific class with a visible background and readable text/icon color.
- Verify all referenced files exist.
- Package the Extension into a zip archive with the same structure that must be uploaded.
- Verify navigation, context menu, and map integration match the selected pattern.
- Verify deployment instructions include where to upload files, which direct `Module.js` URL to verify, and which base URL to register in PILOT.
- For Cloudflare, verify the zip includes root `index.html` next to `Module.js`.
- Summarize the zip contents and any manual configuration required.

If code cannot be verified in a live PILOT instance, say that clearly and list the static checks that passed.

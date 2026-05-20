# AI CODING CONTRACT - PILOT EXTENSIONS (SHORT)

Use this as the compact rule set. The full contract is [AI_SPECS.md](AI_SPECS.md).

## Core Rules

- PILOT Extensions are not standalone web apps.
- Ext JS is already loaded by PILOT.
- Runtime starts only from `Module.js`.
- `window.skeleton` is provided by PILOT.
- Generated Extensions should define their own classes under `Store.*`.
- Use only PILOT runtime objects/classes already loaded by the compiled app.js.
- Reuse already loaded runtime libraries such as `Highcharts`, Highcharts sunburst, and `jQuery` when available.
- Reuse PILOT units/renderers such as `window.uom`, `speedSS`, `mileageSS`, `num`, `dateTimeStr`, `makeAddress`, and `makeGeoZone` when available.
- Do not mock or replace native PILOT containers.
- Do not use React/Vue/SPA/build-tool patterns.
- `doc/index.html` is documentation only and must not contain scripts.

## Required Module Shape

```js
Ext.define('Store.my_extension.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        // Initialization.
    }
});
```

Use a safe `snake_case` PILOT Extension name, for example `my_extension`. PILOT creates the runtime class as `Store.<extension_name>.Module`, so the `Module.js` class must match it exactly:

```js
Ext.define('Store.my_extension.Module', {
    extend: 'Ext.Component',
    initModule: function () {}
});
```

Do not use hyphens in the PILOT Extension name. A public host may be `https://weather-demo.YOUR.pages.dev/`, but the PILOT Extension name should be `weather_demo`, producing `/store/weather_demo/Module.js`.

## Important PILOT Globals

- `window.mapContainer` - Online map.
- `window.historyMapContainer` - History map.
- `window.getActiveTabMapContainer()` - preferred helper if available.
- PILOT maps are `MapContainer` wrappers over Leaflet. For map features, read `docs/MapContainer.md`; do not assume Google Maps-style `getMap().getCenter().lat()` APIs.
- `window.skeleton.header` - top header.
- `window.skeleton.navigation` - left navigation.
- `window.skeleton.navigation.online.online_tree` - Online objects tree.
- `window.skeleton.mapframe` - main content/map frame in repo examples.
- `window.skeleton.map_frame` - same conceptual frame in some runtime notes; use fallback if needed.
- PILOT admin stores the external base URL, but runtime files are proxied as `/store/<extension>/...` for CORS compatibility. The `<extension>` segment is the safe PILOT Extension name, not necessarily the external host/project name.

Navigation and main content are linked with:

```js
navTab.map_frame = mainPanel;
```

## Valid Patterns

Full UI:

```js
var navTab = Ext.create('Pilot.utils.LeftBarPanel', {
    title: l('My Extension'),
    iconCls: 'fa fa-layer-group',
    iconAlign: 'top',
    minimized: true,
    items: [Ext.create('Store.my_extension.view.NavigationContent', {})]
});

var mainPanel = Ext.create('Store.my_extension.view.MainPanel', {});

navTab.map_frame = mainPanel;
skeleton.navigation.add(navTab);
skeleton.mapframe.add(mainPanel);
```

Context menu only:

```js
var tree = skeleton.navigation.online.online_tree;
var menu = tree.contextmenu || tree.context_menu;

menu.add({
    text: l('My Action'),
    iconCls: 'fa fa-bolt',
    handler: this.onAction,
    scope: tree
});
```

Existing map:

```js
var map = window.getActiveTabMapContainer ?
    getActiveTabMapContainer() :
    window.mapContainer;
```

When reading map center, treat `map.map` as the underlying Leaflet map if it exists and convert Leaflet `lng` to business `lon` for PILOT helpers.

## Vehicle Data

If vehicles are displayed, load them from PILOT:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: { vehs: 1, state: 1 }
});
```

Parse hierarchical groups and nested `children`. Do not assume a flat array.

## Final Self-Check

- `Module.js` uses `Ext.define`.
- Class extends `Ext.Component`.
- `initModule` is a class method.
- No standalone app/bootstrap code.
- No `Ext.ns(...)` or plain singleton object as the module entry; use `Ext.define('Store.<extension_name>.Module', ...)` with the exact safe PILOT Extension name.
- Navigation tab has `title` and `iconCls` if used.
- `navTab.map_frame = mainPanel` exists if a paired main panel is used.
- Existing context menu is extended, not replaced.
- Header buttons/menu items are added only after checking `skeleton.header` and without replacing native items.
- Header buttons use `header_tool <extension>-header-btn` plus CSS with a visible background and readable text/icon color. Do not put a white icon directly on the light gray PILOT header.
- Reports/settings/editor integrations are advanced; guard optional hooks such as `MODULE_OVERRIDER` and document fallback behavior.
- Existing map is reused when the task says so.
- If the idea uses maps, markers, routes, geozones, map center, or coordinates, `docs/MapContainer.md` was used and no Google Maps-style API was invented.
- `doc/index.html` has no scripts.
- Use available `Pilot.utils.*` host classes when they fit the task; do not require local PILOT source files.
- If custom CSS needs colors, prefer Tailwind CSS palette values; do not load Tailwind itself by default.
- Do not load duplicate Highcharts/jQuery/helper scripts if PILOT already provides them.
- Deliver the created Extension as a zip archive with the complete file structure.
- Do not print full source code in the chat by default; summarize the zip, upload path, direct `/Module.js` verification URL, base URL for PILOT registration, launch verification, and troubleshooting.
- For managers, deployment instructions must be browser UI-first. Do not require `npm`, `wrangler`, Git, or terminal commands unless explicitly requested.
- Do not invent a download link unless an actual zip artifact is attached.
- Do not replace the zip artifact with Python/Node/PowerShell/Bash code that the user must run locally.
- Verify external `/Module.js`, register the external base URL, and use/document proxied `/store/<extension>/...` URLs for runtime assets/backend. Use a `snake_case` Extension name such as `weather_demo`; avoid hyphenated names such as `weather-demo`.

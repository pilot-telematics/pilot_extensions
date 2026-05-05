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

Use safe Ext JS namespaces such as `Store.my_extension.Module`.

## Important PILOT Globals

- `window.mapContainer` - Online map.
- `window.historyMapContainer` - History map.
- `window.getActiveTabMapContainer()` - preferred helper if available.
- `window.skeleton.header` - top header.
- `window.skeleton.navigation` - left navigation.
- `window.skeleton.navigation.online.online_tree` - Online objects tree.
- `window.skeleton.mapframe` - main content/map frame in repo examples.
- `window.skeleton.map_frame` - same conceptual frame in some runtime notes; use fallback if needed.

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
- Navigation tab has `title` and `iconCls` if used.
- `navTab.map_frame = mainPanel` exists if a paired main panel is used.
- Existing context menu is extended, not replaced.
- Existing map is reused when the task says so.
- `doc/index.html` has no scripts.
- Use available `Pilot.utils.*` host classes when they fit the task; do not require local PILOT source files.
- If custom CSS needs colors, prefer Tailwind CSS palette values; do not load Tailwind itself by default.
- Do not load duplicate Highcharts/jQuery/helper scripts if PILOT already provides them.
- Final answer includes where to upload files, which `Module.js` URL to register, how to verify launch, and basic troubleshooting.

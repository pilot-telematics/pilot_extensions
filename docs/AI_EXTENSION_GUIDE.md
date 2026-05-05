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

Use `Custom Map Panel` only when the extension needs its own map view.

## 2. Files to Inspect

Always inspect:

1. `AI_SPECS.md`
2. `docs/AI_EXTENSION_GUIDE.md`
3. one closest example
4. `docs/PILOT_RUNTIME_UTILS.md`
5. `docs/IDEA_TO_EXTENSION.md` or `docs/IDEA_TO_EXTENSION_RU.md` for the expected delivery shape

Example mapping:

| User asks for | Inspect |
|---|---|
| minimal tab/panel | `examples/hello-world/Module.js` |
| starter app | `examples/template-app/Module.js` |
| list + custom map | `examples/airports/Module.js`, `Tab.js`, `Map.js` |
| action from Online tree | `examples/nearby-poi/Module.js` |
| complex backend module | `examples/communal/Module.js`, `docs/communal_RU.md` |
| map API details | `docs/MapContainer.md` |
| marker icons | `docs/MarkerIconApi.md` |
| deployment | `DEPLOY.md` |
| PILOT runtime utilities, Highcharts, jQuery, UOM, renderers | `docs/PILOT_RUNTIME_UTILS.md` or `docs/PILOT_RUNTIME_UTILS_RU.md` |

Do not blindly copy legacy patterns that conflict with `AI_SPECS.md`.

Third-party developers work with the runtime objects and classes already loaded by the compiled PILOT application. Extensions should define their own business classes under `Store.<name>.*` and may use host utilities such as `Pilot.utils.LeftBarPanel`, `Pilot.utils.Toggle`, `Pilot.utils.ColorField`, `Pilot.utils.DateTimeField`, `Pilot.utils.TreeSearchField`, and `Pilot.utils.MapContainer` when those utilities are available in the target PILOT runtime.

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
getMainFrame: function () {
    return skeleton.mapframe || skeleton.map_frame;
}
```

Do not confuse:

- `skeleton.mapframe` / `skeleton.map_frame` - the host container;
- `navTab.map_frame` - a property that links one navigation component to its paired main panel.

The same convention is exposed in the runtime: a navigation component can keep a reference to its paired main panel in `map_frame`, while the host main frame is `skeleton.mapframe` or, in some builds, `skeleton.map_frame`.

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

## 6. Map Access Recipe

Use this for Online map actions:

```js
getPilotMap: function () {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

Use this for History-specific actions:

```js
getHistoryMap: function () {
    return window.historyMapContainer || null;
}
```

Before drawing new output, remove old output created by the extension.

```js
cleanupMap: function () {
    var map = this.getPilotMap();

    if (!map) {
        return;
    }

    if (map.removePilyline) {
        map.removePilyline();
    } else if (map.removePolyline) {
        map.removePolyline();
    }

    Ext.Array.forEach(this.markerIds || [], function (id) {
        if (map.removeMarker) {
            map.removeMarker(id);
        }
    });

    this.markerIds = [];
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
├── Module.js
├── style.css
└── doc/
    └── index.html
```

The registered PILOT URL must point directly to:

```text
https://HOST/Module.js
```

Use [../DEPLOY.md](../DEPLOY.md) for hosting-specific instructions.

If the extension includes custom CSS, tell the AI to prefer Tailwind CSS palette colors for new custom colors. This does not mean loading Tailwind CSS; it is only a palette rule unless the user explicitly asks for Tailwind as a dependency.

The final answer for a generated extension must include a concrete launch path:

1. exact upload folder structure;
2. exact public URLs that must open after upload;
3. exact `Module.js` URL to register in PILOT;
4. browser verification steps;
5. troubleshooting for `404`, HTML instead of JS, CORS, `skeleton is undefined`, and missing Ext classes.

## 10. Final Response Checklist for AI

Before final answer:

- Inspect generated `Module.js`.
- Verify there is no standalone app bootstrap.
- Verify `doc/index.html` has no scripts.
- Verify all referenced files exist.
- Verify navigation, context menu, and map integration match the selected pattern.
- Verify deployment instructions include where to upload files and which `Module.js` URL to register.
- Summarize files changed and any manual configuration required.

If code cannot be verified in a live PILOT instance, say that clearly and list the static checks that passed.

# PILOT Extensions Developer Guide

This guide is for developers who build PILOT Extensions manually or review AI-generated code.

## 1. What A PILOT Extension Is

A PILOT Extension is not a standalone website or SPA. It is a set of files loaded into an already running PILOT UI.

PILOT already provides:

- Ext JS runtime;
- global `window.skeleton` container;
- existing Online, History, and Reports sections;
- existing Online and History maps;
- PILOT utilities such as `l(...)`, `Pilot.utils.LeftBarPanel`, `MapContainer`;
- already loaded libraries such as Highcharts, Highcharts sunburst, and jQuery when available in the target build;
- units of measure via `window.uom` / `UOM`;
- renderer/helper functions for dates, numbers, addresses, geozones, and statuses;
- access to PILOT APIs.

The Extension adds its own functionality into this host shell.

## 1.1 Extensions Vs Compiled PILOT Code

Extensions run inside compiled PILOT `app.js`. They can access runtime objects and utilities already loaded by PILOT, including useful `Pilot.utils.*` host classes.

| Compiled PILOT code | PILOT Extension |
|---|---|
| Shipped as part of PILOT | Hosted separately and loaded by `Module.js` URL |
| Compiled together with the main PILOT application | Hosted separately and loaded through its `Module.js` URL |
| May be tied to the main PILOT backend | May use external backend: Cloudflare Worker, VPS, PHP, separate API |
| Creates runtime objects and utilities | Uses only what is available in loaded `app.js` |

Practical rule: treat PILOT as the host platform. Use `skeleton`, native trees, maps, `l(...)`, Ext JS, and available `Pilot.utils.*`, but keep Extension-owned business classes under `Store.<extension>.*`.

See [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md).

## 2. Minimal Structure

```text
my-extension/
├── Module.js
└── doc/
    └── index.html
```

`Module.js` is the only runtime entry point.

`doc/index.html` is static Extension documentation. It must not contain `<script>` or startup logic.

Optional files:

```text
style.css
config.json
backend/
```

## 3. Basic `Module.js`

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

The left navigation tab and the main content panel are created separately, then linked through `map_frame`.

## 4. PILOT Runtime

### Header

`window.skeleton.header` is the top PILOT header.

Known elements:

- `skeleton.header.news_btn`
- `skeleton.header.balance`
- `skeleton.header.all_btn`
- `skeleton.header.fail_btn`
- `skeleton.header.act_btn`
- `skeleton.header.park_btn`
- `skeleton.header.idle_btn`
- `skeleton.header.menu_btn`
- `skeleton.header.alerts`

Add custom items carefully:

```js
skeleton.header.insert(5, {
    xtype: 'button',
    text: l('My Action'),
    iconCls: 'fa fa-bolt',
    handler: function () {
        Ext.Msg.alert(l('My Action'), l('Done'));
    }
});
```

Do not remove or replace native header items.

### Navigation

`window.skeleton.navigation` is the left tab panel.

Known sections:

- `skeleton.navigation.online`
- `skeleton.navigation.online.online_tree`
- `skeleton.navigation.history`
- `skeleton.navigation.history.objects`
- `skeleton.navigation.reports`
- `skeleton.navigation.reports.objects`
- `skeleton.navigation.reports.reports_store`

### Main Content / Map Frame

Repository examples use:

```js
skeleton.mapframe.add(mainPanel);
```

Some runtime notes use the alternate name:

```js
skeleton.map_frame
```

For uncertain builds:

```js
getMainFrame: function () {
    return skeleton.mapframe || skeleton.map_frame;
}
```

For this repository, prefer `skeleton.mapframe`.

## 5. Choosing An Architecture Pattern

### Own tab and own workspace

Use for independent modules: dashboards, directories, analytics, editors, reports, business tools.

Create:

- a tab in `skeleton.navigation`;
- a main panel in `skeleton.mapframe`;
- `navTab.map_frame = mainPanel`.

Examples:

- `examples/hello-world`
- `examples/template-app`
- `examples/communal`

### Context menu only

Use when the action starts from an existing PILOT object: Online vehicle, History item, report object.

Example:

- `examples/nearby-poi`

Template:

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

With `scope: tree`, the handler can use:

```js
var record = this.record;
var lat = record.get('lat');
var lon = record.get('lon');
```

### Existing map

If the feature relates to the current Online map, do not create a new map.

```js
var map = window.getActiveTabMapContainer ?
    getActiveTabMapContainer() :
    window.mapContainer;
```

For History:

```js
var map = window.historyMapContainer;
```

### Custom map

Create `new MapContainer(...)` only when the Extension truly needs its own map.

Example:

- `examples/airports/Map.js`

## 6. Map Basics

Online map:

```js
window.mapContainer
```

History map:

```js
window.historyMapContainer
```

Active map:

```js
window.getActiveTabMapContainer && getActiveTabMapContainer()
```

Markers usually use `lat` and `lon`:

```js
map.addMarker({
    id: 'my_marker',
    lat: 25.2208,
    lon: 55.3534,
    hint: 'Point'
});
```

Center:

```js
if (map.setMapCenter) {
    map.setMapCenter(lat, lon);
}
```

Zoom:

```js
if (map.setMapZoom) {
    map.setMapZoom(14);
}
```

See [MapContainer.md](MapContainer.md).

## 7. PILOT Data

If the Extension displays vehicles, do not use static sample arrays.

Base source:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: {
        vehs: 1,
        state: 1
    },
    success: function (response) {
        var data = Ext.decode(response.responseText);
        // data is hierarchical; vehicles are nested in children.
    }
});
```

The response is hierarchical. Recursively walk `children`.

## 8. Localization

Use `l('Text')` for UI strings:

```js
title: l('My Extension')
```

Large modules may load `lang/lang.json` and merge translations into global `lang`, as shown in `examples/communal/Module.js`.

## 8.1 Units And Renderers

Before writing custom formatters, check PILOT runtime helpers:

- `window.uom` / `UOM` for units;
- `speedSS`, `mileageSS`, `volumeSS`, `consSS`, `amountSS`, `weigSS` for values with suffixes;
- `num`, `int`, `valuePercent` for numbers;
- `dateTimeStr`, `timeDateStr`, `dateTimeStrF`, `secondsToHumanTime` for dates and durations;
- `makeAddress`, `makeAddressLink`, `makeGeoZone`, `makeCoordinates` for addresses and geozones.

Example:

```js
{
    text: l('Mileage'),
    dataIndex: 'mileage',
    renderer: function (value) {
        return typeof mileageSS === 'function' ? mileageSS(value, 1) : value;
    }
}
```

See [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md).

## 8.2 Highcharts And jQuery

PILOT usually already loads Highcharts, the sunburst module, and jQuery. Do not load them again from the Extension.

Check availability:

```js
if (window.Highcharts) {
    // build chart
}

if (window.Highcharts && Highcharts.seriesTypes && Highcharts.seriesTypes.sunburst) {
    // build sunburst chart
}

var jq = window.jQuery || window.$;
```

Do not replace Ext JS components with jQuery. Use jQuery sparingly for placeholder HTML or compatibility with runtime renderer helpers.

## 9. CSS And Paths

Load Extension CSS from `Module.js`:

```js
var css = document.createElement('link');
css.setAttribute('rel', 'stylesheet');
css.setAttribute('type', 'text/css');
css.setAttribute('href', '/store/my-extension/style.css');
document.head.appendChild(css);
```

For portable hosting, compute the base URL from the current `Module.js`, especially for Cloudflare/GitHub Pages.

When you add custom styles, prefer colors from the Tailwind CSS palette for new hex values. This keeps generated Extensions visually consistent and avoids random one-off colors. This is a color-palette recommendation only; do not load Tailwind CSS itself unless the Extension explicitly needs that dependency.

## 10. Backend

Backend is needed when:

- secrets/API keys must not be exposed in browser;
- the Extension needs its own database;
- a CORS proxy is required;
- business data must be stored outside PILOT.

Complex example:

- `examples/communal/backend`

Deployment: [../DEPLOY.md](../DEPLOY.md).

## 11. Pre-Publication Checklist

Check:

- `Module.js` opens by direct URL and returns JavaScript, not an HTML error page.
- `doc/index.html` opens.
- CSS/JSON/backend URLs are available.
- Browser console has no Ext JS class loading errors.
- The Extension does not load Ext JS manually.
- The tab has `title` and `iconCls`.
- If there is a main panel, `navTab.map_frame = mainPanel` exists.
- Context menu additions extend the existing menu.
- Map markers/routes created by the Extension can be cleaned up.

## 12. Reviewing AI Code

Compare the result with [../AI_SPECS.md](../AI_SPECS.md).

Common AI mistakes:

- builds standalone HTML/React/Vue app instead of a PILOT Extension;
- uses `Ext.onReady`;
- defines global `initModule`;
- adds `<script>` to `doc/index.html`;
- creates a new map when existing `mapContainer` should be used;
- confuses `skeleton.mapframe`, `skeleton.map_frame`, and component property `map_frame`;
- uses demo vehicles instead of `/ax/tree.php`;
- replaces native menus/trees instead of adding an item;
- assumes a class is available without checking the target PILOT runtime when that class is optional for the deployment.

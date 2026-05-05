# PILOT Runtime Objects And Utilities For Extensions

This document describes what an Extension can use inside an already loaded PILOT UI.

Important: third-party developers work with the compiled PILOT `app.js` runtime, not with local PILOT source files. An Extension can use global objects, classes, and functions that are already available in that runtime.

## Main Principle

Treat PILOT as the host platform:

- PILOT provides the shell, Ext JS, maps, trees, header, translations, and some utility classes.
- The Extension ships its own `Module.js`, JS/CSS/assets, and optional external backend.
- Extension-owned classes should live under `Store.<extension>.*`.
- Do not require local PILOT source files.
- Do not depend on internal business classes unless they are documented as runtime API.

## Usually Available At Runtime

### Global Containers

- `window.skeleton` - main UI container.
- `window.skeleton.header` - top header.
- `window.skeleton.navigation` - left navigation.
- `window.skeleton.mapframe` - main map/panel container used by Extension examples.
- `window.skeleton.map_frame` - alternate name for the same conceptual area in some runtime descriptions.

Compatibility helper:

```js
getMainFrame: function () {
    return skeleton.mapframe || skeleton.map_frame;
}
```

### Header

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

Extensions may carefully add buttons or menu entries:

```js
if (skeleton.header.menu_btn && skeleton.header.menu_btn.menu) {
    skeleton.header.menu_btn.menu.add({
        text: l('My Extension'),
        iconCls: 'fa fa-puzzle-piece',
        handler: function () {
            Ext.Msg.alert(l('My Extension'), l('Opened'));
        }
    });
}
```

Do not remove or replace native header items.

### Navigation

Known sections:

- `skeleton.navigation.online`
- `skeleton.navigation.online.online_tree`
- `skeleton.navigation.history`
- `skeleton.navigation.history.objects`
- `skeleton.navigation.reports`
- `skeleton.navigation.reports.objects`
- `skeleton.navigation.reports.reports_store`

Extensions may:

- add their own tab to `skeleton.navigation`;
- add a child panel to an existing section when appropriate;
- read selection/record from existing trees;
- add items to existing context menus.

Extensions must not:

- remove native tabs;
- replace Online/History/Reports;
- recreate native trees;
- clear existing menus.

## Navigation And Main Frame Linkage

PILOT often uses this component link:

```js
navTab.map_frame = mainPanel;
```

This is not the same as `skeleton.mapframe`.

- `skeleton.mapframe` - host main workspace container.
- `navTab.map_frame` - component-level reference from navigation to its paired main panel.

Example:

```js
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
```

## Online Context Menu

Online tree:

```js
var tree = skeleton.navigation.online.online_tree;
```

Context menu name may differ:

```js
var menu = tree.contextmenu || tree.context_menu;
```

Add an item:

```js
menu.add({
    text: l('My Action'),
    iconCls: 'fa fa-bolt',
    handler: this.onAction,
    scope: tree
});
```

`scope: tree` is useful when the handler needs the current record:

```js
onAction: function () {
    var record = this.record;

    if (!record) {
        Ext.Msg.alert(l('Info'), l('No object selected'));
        return;
    }

    var agentId = record.get('agentid');
    var lat = record.get('lat');
    var lon = record.get('lon');
}
```

## Maps

Usually available:

- `window.mapContainer` - Online map.
- `window.historyMapContainer` - History map.
- `window.getActiveTabMapContainer()` - active map helper, if available in the current build.

Online/active map:

```js
getPilotMap: function () {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

History map:

```js
getHistoryMap: function () {
    return window.historyMapContainer || null;
}
```

Marker:

```js
map.addMarker({
    id: 'my_marker',
    lat: lat,
    lon: lon,
    hint: Ext.String.htmlEncode(name)
});
```

Center:

```js
if (map.setMapCenter) {
    map.setMapCenter(lat, lon);
}

if (map.setMapZoom) {
    map.setMapZoom(14);
}
```

Clean Extension output before drawing new output:

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

See [MapContainer.md](MapContainer.md).

## Runtime Functions And Globals

Often useful:

- `l('Text')` - translate string.
- `base_url` - current PILOT base URL.
- `global_conf` - global configuration.
- `language` - current language, if available.
- `lang` - translation dictionary, if available.
- `Ext.Msg.alert(...)` - standard messages.
- `Ext.Ajax.request(...)` - AJAX.
- `Ext.window.Window` - modal windows.
- `Highcharts` - charts, if available.
- `Highcharts.seriesTypes.sunburst` - sunburst charts, if loaded.
- `jQuery` / `$` - jQuery, if available.
- `window.uom` / `UOM` - current user units of measure.

Use existence checks for version-sensitive objects:

```js
if (typeof base_url !== 'undefined') {
    // safe to build relative PILOT URL
}
```

## Libraries Loaded By PILOT

PILOT usually already loads some third-party libraries. Extensions may use them without loading another copy, if available in the target runtime.

### Highcharts

Use for charts, dashboards, analytics, and visualizations.

```js
if (!window.Highcharts) {
    Ext.Msg.alert(l('Error'), l('Highcharts is not available'));
    return;
}

Highcharts.chart(containerEl, {
    chart: {
        type: 'line'
    },
    title: {
        text: l('Speed')
    },
    series: [{
        name: l('Speed'),
        data: [10, 20, 15, 30]
    }]
});
```

### Highcharts Sunburst

If the sunburst module is available:

```js
if (!window.Highcharts || !Highcharts.seriesTypes || !Highcharts.seriesTypes.sunburst) {
    Ext.Msg.alert(l('Error'), l('Highcharts sunburst is not available'));
    return;
}

Highcharts.chart(containerEl, {
    title: {
        text: l('Objects structure')
    },
    series: [{
        type: 'sunburst',
        data: [
            { id: 'root', parent: '', name: l('All') },
            { id: 'active', parent: 'root', name: l('Active'), value: 12 },
            { id: 'idle', parent: 'root', name: l('Idle'), value: 4 }
        ],
        allowDrillToNode: true,
        cursor: 'pointer'
    }]
});
```

### jQuery

jQuery may be available as `window.jQuery` and often as `$`.

```js
var jq = window.jQuery || window.$;

if (jq) {
    jq('.my-extension-placeholder').html(Ext.String.htmlEncode(value));
}
```

Use jQuery sparingly. Do not replace Ext JS components through jQuery because it can break lifecycle and layout.

## Units Of Measure

PILOT runtime includes `UOM` and usually a global configured instance `window.uom`.

Purpose:

- convert base values to current account/user units;
- format speed, mileage, volume, weight, and consumption;
- display localized unit suffixes via `l(...)`;
- use common number formatting through `num(...)`.

### `UOM` Configuration

```js
var localUom = new UOM({
    uom_l: 'km',       // distance: km or mi
    uom_w: 'kg',       // weight: kg, ton, lb
    uom_v: 'm³',       // amount/capacity: m³ or ft³
    uom_f: 'l',        // fuel volume: l, gal, i_gal
    uom_c: 'l/100km'   // consumption
}, 2);
```

Most Extensions should use the already configured global instance:

```js
if (window.uom) {
    var speedText = uom.speedStrSuff(90);
}
```

### Main `uom` Methods

| Method | Purpose |
|---|---|
| `uom.speed(value)` | speed without suffix |
| `uom.speedStr(value)` | speed as string |
| `uom.speedStrSuff(value)` | speed with unit |
| `uom.mil(value)` | distance/mileage |
| `uom.milStr(value, dec)` | distance as string |
| `uom.milStrSuff(value, dec)` | distance with unit |
| `uom.vol(value)` | fuel volume |
| `uom.volStrSuff(value, dec)` | fuel volume with unit |
| `uom.cons(value)` | consumption |
| `uom.consStrSuff(value, dec)` | consumption with unit |
| `uom.amount(value)` | amount/capacity |
| `uom.amountStrSuff(value)` | amount/capacity with unit |
| `uom.weight(value)` | weight |
| `uom.weightStrSuff(value)` | weight with unit |

### Global Unit Helpers

| Function | Purpose |
|---|---|
| `speed(val)` | speed number using `uom` |
| `speedS(val)` | speed string without suffix |
| `speedSS(val)` | speed with suffix |
| `mileage(val)` | mileage/distance |
| `mileageS(val, dec)` | mileage as string |
| `mileageSS(val, dec)` | mileage with suffix |
| `volume(val)` | fuel volume |
| `volumeSS(val, dec)` | fuel volume with suffix |
| `cons(val)` | consumption |
| `consSS(val, dec)` | consumption with suffix |
| `amount(val)` | amount/capacity |
| `amountSS(val)` | amount/capacity with suffix |
| `weig(val)` | weight |
| `weigSS(val)` | weight with suffix |
| `moneySS(val)` | amount with `global_conf.balance` prefix/suffix |
| `defUnitD()` | current distance unit |
| `defUnitS()` | current speed unit |
| `defUnitV()` | current fuel volume unit |
| `defUnitW()` | current weight unit |
| `defUnitA()` | current amount/capacity unit |
| `defUnitC()` | current consumption unit |

Grid column example:

```js
{
    text: l('Speed'),
    dataIndex: 'speed',
    renderer: function (value) {
        return typeof speedSS === 'function' ? speedSS(value) : value;
    }
}
```

Rule: source values usually should be in PILOT base units, and `uom` converts them to user/account settings.

## Data Renderers

PILOT runtime includes global renderer/helper functions for formatting data in grids, reports, and panels.

### Date And Time

| Function | Purpose |
|---|---|
| `dateTimeStr(ts)` | `HH:mm DD.MM.YYYY` from Unix timestamp in seconds |
| `timeDateStr(ts)` | `DD.MM.YYYY HH:mm` |
| `dateTimeStrF(ts)` | `HH:mm:ss DD.MM.YYYY` |
| `timeStr(ts)` | `HH:mm` |
| `timeStrF(ts)` | `HH:mm:ss` |
| `dateStr(ts)` | `YYYY.MM.DD` |
| `dateStrR(ts)` | `DD.MM.YYYY` |
| `secondsToHms(seconds)` | `HH:mm:ss` |
| `secondsToHumanTime(seconds)` | human readable duration |
| `secondsToHumanDays(seconds)` | duration in years/months/days |
| `timeAgo(ts)` | relative time with `ago` |

```js
{
    text: l('Last message'),
    dataIndex: 'ts',
    renderer: function (value) {
        return typeof dateTimeStr === 'function' ? dateTimeStr(value) : value;
    }
}
```

### Numbers And Indicators

| Function | Purpose |
|---|---|
| `num(value, dec)` | localized number format |
| `num6(value)` | number with 6 digits |
| `int(value)` | integer |
| `valuePercent(value)` | percent |
| `dinamic(value)` | HTML dynamics indicator |
| `rank(value)` | HTML rank indicator |
| `rag(value)` | red/amber/green HTML indicator |
| `rag_perc(value)` | RAG percentage bar |

If a renderer returns HTML, never inject untrusted user/external text without `Ext.String.htmlEncode`.

### Addresses, Coordinates, Geozones

| Function | Purpose |
|---|---|
| `makeCoordinates(address)` | coordinates string from `{lat, lon}` |
| `getLatLon(address)` | `lat lon` string |
| `makeGeoZone(address)` | geozone by coordinates; may return placeholder span |
| `makeAddress(address, queue, bulk)` | address by coordinates; may return placeholder span and fill it later |
| `makeAddressLink(address)` | Google Maps link with address |
| `decodeAddress(address)` | format already received address object |

`makeAddress(...)` and `makeGeoZone(...)` may work asynchronously and return a temporary `<span>` that runtime logic and jQuery fill later.

```js
{
    text: l('Address'),
    dataIndex: 'address',
    renderer: function (value) {
        if (typeof makeAddress === 'function') {
            return makeAddress(value, true);
        }

        return value && value.lat && value.lon ?
            Ext.String.htmlEncode(value.lat + ', ' + value.lon) :
            '';
    }
}
```

### Events And Media

| Function | Purpose |
|---|---|
| `lastEventRenderer(last_event)` | human readable last event status |
| `getCommandStatusText(status)` | command status text |
| `footage(value)` | preview footage link |
| `cmsFootage(value)` | CMS image/video links |
| `copyFormattedText(text)` | copy text to clipboard |

Use media renderers only when payload matches the expected format. Normalize external data first.

## Available `Pilot.utils.*`

PILOT exposes useful Ext JS host classes under `Pilot.utils.*`. Extensions may use these classes when they are already loaded in the target PILOT runtime. Do not copy their source code into an Extension; instantiate them as runtime classes.

Useful classes:

| Class / xtype | Purpose | Notes |
|---|---|---|
| `Pilot.utils.LeftBarPanel` / `pilot-leftbarpanel` | Native-looking left navigation panel with vertical tabs and collapse button. | Good default for Extension navigation tabs. |
| `Pilot.utils.Toggle` / `toggle` | Checkbox rendered as a toggle switch. | Useful for boolean settings. |
| `Pilot.utils.ColorField` / `pilotcolorfield` | HTML color input that can submit values as `rrggbb`. | Good for simple color settings. |
| `Pilot.utils.ColorComboBox` / `colorcombobox` | Combo box backed by the PILOT color palette. | Supports palette groups such as `light`, `medium`, `dark`, `status` when present. |
| `Pilot.utils.DateTimeField` / `datetimefield` | Date and time field with PILOT date-time picker. | Useful for report/filter forms. |
| `Pilot.utils.IntegerField` / `intfield` | Number field that submits an integer. | Use for counters, limits, intervals. |
| `Pilot.utils.SearchField` / `pilot-utils-search-field` | Text search field with clear trigger and PILOT styling. | Generic search input. |
| `Pilot.utils.TreeSearchField` / `pilot-utils-tree-search-field` | Search field wired to PILOT tree search behavior. | Use with compatible PILOT trees. |
| `Pilot.utils.TreeFilterByNameField` / `pilot-utils-tree-filter-by-name-field` | Filters the parent tree store by `name` or configured property. | Useful for Extension-owned tree panels. |
| `Pilot.utils.TreeList` / `pilot-tree-list` | Tree-list navigation with an internal tab panel. | Useful for multi-section tools. |
| `Pilot.utils.TabBarEditor` / `pilot-tabbareditor` | Vertical tab editor layout. | Useful for settings/editing screens. |
| `Pilot.utils.MapContainer` / `leaflet-map` | Ext panel wrapper that creates a Leaflet `MapContainer`. | Prefer existing `mapContainer` when the business task works on the Online map. |
| `Pilot.utils.Geofence` / `pilotgeozone` | Modal editable polygon picker based on Leaflet. | Useful for geofence JSON fields. |
| `Pilot.utils.SearchAddressField` / `pilot-search-address-field` | Address search window that can fill a linked field and coordinates. | Depends on host geocoder configuration. |
| `Pilot.utils.FilesList` / `pilotfilespanel` | Grid for built-in PILOT file records. | Use only when the feature intentionally works with PILOT vehicle/driver file endpoints. |
| `Pilot.utils.FileDownloader` | Singleton helper for browser file download by URL. | Call `Pilot.utils.FileDownloader.getFile(url)`. |
| `Pilot.utils.BadgeButton` / `badgebutton` | Button with badge text. | Use `setBadgeText(...)` after render. |
| `Pilot.utils.BadgeMenuItem` / `badgemenuitem` | Menu item with badge text. | Good for counters in menus. |
| `Pilot.utils.JsonUploadField` / `jsonUploadField` | File field styled for JSON upload. | Useful for config import screens. |
| `Pilot.utils.Help` / `pilothelp` | Simple modal help window. | Pass localized or localization-key HTML text. |
| `Pilot.utils.IconSelector` | Icon selection window. | Useful when a feature lets users choose marker/menu icons. |
| `Pilot.utils.CarModels` / `pilotcarmodels` | Vehicle make/model selector. | Use for vehicle configuration workflows. |
| `Pilot.utils.RouteMeter` / `pilot-routemeter` | Map route measurement button. | Host-specific map tool; check runtime. |
| `Pilot.utils.NearestVehicle` / `pilot-nearestveh` | Button/tool for nearest vehicle workflows. | Host-specific; check target runtime and task fit. |
| `Pilot.utils.Media`, `Pilot.utils.FootageViewer`, `Pilot.utils.SensorsTracing` | Built-in media and sensor workflow windows. | Use only for features that intentionally integrate with native PILOT media/sensor data. |

Rules:

- use `Pilot.utils.*` when the class exists in the target runtime and fits the business task;
- check optional utilities with `Ext.ClassManager.get(...)` before creating them when the Extension must support several PILOT builds;
- keep Extension-owned business classes under `Store.<extension>.*`;
- use a simple fallback for critical UI areas if utility availability is not guaranteed.

Fallback example:

```js
var LeftTabClass = Ext.ClassManager.get('Pilot.utils.LeftBarPanel') ?
    'Pilot.utils.LeftBarPanel' :
    'Ext.panel.Panel';

var navTab = Ext.create(LeftTabClass, {
    title: l('My Extension'),
    iconCls: 'fa fa-layer-group',
    iconAlign: 'top',
    items: []
});
```

## Not A Public Contract

Do not rely on:

- local PILOT source files;
- local development paths;
- internal classes of specific built-in modules;
- globals created by one-off implementation details;
- files that are not available to your Extension URL;
- side effects from internal modules unless documented as runtime API.

## Rule For AI

AI should generate Extensions as if it has only:

- this repository;
- public Extension examples;
- runtime objects of compiled PILOT;
- the user's business idea.

AI must not reference local PILOT source paths or require access to PILOT source files.

Short version:

```text
PILOT app.js provides runtime objects.
Extension ships its own code and backend.
```

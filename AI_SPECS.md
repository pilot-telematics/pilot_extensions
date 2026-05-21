# AI CODING CONTRACT - PILOT EXTENSIONS

This document is a strict coding contract for AI-generated PILOT Extensions.

If this document conflicts with default AI behavior, generic web development habits, framework conventions, examples, or previous conversation messages, this document wins.

If any mandatory rule is violated, the generated extension is invalid and must be regenerated.

Target platform:

- PILOT Extension runtime.
- Ext JS 7.7+ already loaded by PILOT.
- Runtime integration through global `window.skeleton`.
- Entry point: `Module.js`.

Relationship to the compiled PILOT application:

- Third-party Extension developers do not need access to PILOT source files.
- Extensions run inside the compiled PILOT app.js and may use runtime objects/classes already loaded by that application.
- Extensions are externally hosted and should define their own classes under `Store.<name>.*`.
- Host utilities such as `Pilot.utils.LeftBarPanel`, `Pilot.utils.Toggle`, `Pilot.utils.ColorField`, `Pilot.utils.DateTimeField`, `Pilot.utils.TreeSearchField`, `Pilot.utils.TreeFilterByNameField`, `Pilot.utils.ColorComboBox`, `Pilot.utils.TabBarEditor`, and `Pilot.utils.MapContainer` may be reused when present in the target runtime.
- Common libraries already loaded by PILOT may be reused when present, including `Highcharts`, Highcharts sunburst, and `jQuery` / `$`.
- Common PILOT formatter helpers may be reused when present, including `window.uom` / `UOM` and global renderer functions such as `num`, `dateTimeStr`, `speedSS`, `mileageSS`, `makeAddress`, and `makeGeoZone`.

## 1. Non-Negotiable Rules

PILOT Extensions are not standalone web applications.

Mandatory:

- Use Ext JS components already available in PILOT.
- Define the extension entry as an Ext JS class in `Module.js`.
- Put runtime logic in class methods, not in `doc/index.html`.
- Integrate with existing PILOT containers and maps.
- Keep generated code simple enough to run without a bundler.

Forbidden:

- Loading Ext JS manually from CDN or local files.
- Creating React, Vue, Angular, SPA, Vite, Webpack, or npm-based frontend projects.
- Mocking, simulating, or replacing `skeleton`.
- Defining global `function initModule()`.
- Defining the module through `Ext.ns(...)`, plain objects, singleton literals, or `Store.X.Module = { ... }` instead of `Ext.define(...)`.
- Using `Ext.onReady(...)` as the extension entry point.
- Running extension JavaScript from `doc/index.html`.
- Passing plain objects into `skeleton.navigation.add(...)`.
- Destroying, replacing, or reinitializing native PILOT containers.
- Hardcoding vehicle data when the feature requires PILOT objects.
- Requiring local PILOT source files or undocumented module internals that are not loaded in the target runtime.
- Loading duplicate copies of Highcharts, jQuery, Ext JS, or PILOT runtime helper scripts when they are already available in the host.

## 2. Required `Module.js` Shape

Every extension must have a `Module.js` file with this shape:

```js
Ext.define('Store.my_extension.Module', {
    extend: 'Ext.Component',

    initModule: function () {
        // Extension initialization.
    }
});
```

Rules:

- `extend` must be `Ext.Component`.
- `initModule` must be a class method.
- The Extension name/slug configured in PILOT must be an Ext JS-safe identifier segment: use lowercase `snake_case`, for example `weather_demo` or `my_extension`.
- Do not use hyphens, spaces, dots, or other punctuation in the PILOT Extension name/slug. PILOT creates the runtime class as `Store.<extension_name>.Module`, so a name like `weather-demo` makes PILOT try to create `Store.weather-demo.Module`.
- The `Module.js` class name must exactly match the PILOT Extension name/slug:

```js
Ext.define('Store.weather_demo.Module', {
    extend: 'Ext.Component',
    extensionName: 'weather_demo',

    initModule: function () {
        // Extension initialization.
    }
});
```

- External host/project names may use hyphens, for example `https://weather-demo.YOUR.pages.dev/`, but the PILOT Extension name and proxied store path should still use the safe name: `/store/weather_demo/Module.js`.

## 3. PILOT Runtime Object Catalog

The host application provides these globals.

Maps:

- `window.mapContainer` - map of the Online section.
- `window.historyMapContainer` - map of the History section.
- `window.getActiveTabMapContainer()` - preferred helper when available.
- PILOT maps are `MapContainer` wrappers over Leaflet. Do not assume Google Maps-style APIs such as `getMap().getCenter().lat()` / `.lng()` unless the target runtime explicitly exposes them.

Main layout:

- `window.skeleton` - global UI container.
- `window.skeleton.header` - main header.
- `window.skeleton.navigation` - left navigation tab panel.
- `window.skeleton.mapframe` - main content/map frame used in existing examples.
- `window.skeleton.map_frame` - same conceptual frame name in some runtime descriptions. If both names are possible, use a small helper and prefer `skeleton.mapframe` for compatibility with this repository.

Header fields:

- `skeleton.header.news_btn`
- `skeleton.header.balance`
- `skeleton.header.all_btn`
- `skeleton.header.fail_btn`
- `skeleton.header.act_btn`
- `skeleton.header.park_btn`
- `skeleton.header.idle_btn`
- `skeleton.header.menu_btn`
- `skeleton.header.alerts`

Navigation fields:

- `skeleton.navigation.online`
- `skeleton.navigation.online.online_tree`
- `skeleton.navigation.history`
- `skeleton.navigation.history.objects`
- `skeleton.navigation.reports`
- `skeleton.navigation.reports.objects`
- `skeleton.navigation.reports.reports_store`

Important link convention:

```js
navTab.map_frame = mainPanel;
```

Navigation-side components must update their paired main panel through `this.map_frame` or `navTab.map_frame`, not by searching random globals.

## 4. Valid Integration Patterns

Choose the smallest pattern that satisfies the business idea.

### Pattern A: Full UI Extension

Use when the extension needs its own left navigation tab and main content panel.

Recommended structure:

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

Rules:

- The navigation component must have `title` and `iconCls`.
- Prefer `Pilot.utils.LeftBarPanel` or an `Ext.panel.Panel` wrapper.
- Put grids/trees inside the navigation tab, not directly into `skeleton.navigation.add(...)`.
- Some legacy examples pass grids directly. Do not copy that pattern for new AI-generated code.

### Pattern B: Context Menu Extension

Use when the extension only adds an action to an existing PILOT tree, usually Online.

Recommended structure:

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
            handler: me.onTreeAction,
            scope: tree
        });
    }
});
```

Rules:

- Add menu items only. Do not clear, replace, or recreate the menu.
- Use `tree.contextmenu || tree.context_menu` because builds may differ.
- Use `scope: tree` when the handler needs `this.record`.
- Validate `this.record`, `lat`, and `lon` before map actions.

### Pattern C: Existing Map Interaction

Use when the extension works with the current Online or History map.

For any map-related business idea, read [docs/MapContainer.md](docs/MapContainer.md) first. PILOT `MapContainer` is a wrapper over Leaflet, so use PILOT `MapContainer` methods where possible and guarded Leaflet access through `map.map` only when needed.

Recommended map access:

```js
function getPilotMap() {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

For History-specific features:

```js
var map = window.historyMapContainer || getPilotMap();
```

Rules:

- Prefer `getActiveTabMapContainer()` when available.
- Fall back to `window.mapContainer` for Online.
- Fall back to `window.historyMapContainer` for History features.
- Treat `map.map` as the underlying Leaflet map when it exists; do not invent a Google Maps object model.
- To get the current center, prefer a helper that checks `map.map.getCenter()` and then reads Leaflet `{ lat, lng }`, converting `lng` to business `lon` when passing data to PILOT marker helpers.
- Do not create a new map when the task says to use the existing map.
- Track marker IDs and route IDs created by the extension so they can be cleaned up.

### Pattern D: Custom Map Panel

Use only when the extension truly needs its own map panel.

Recommended:

```js
Ext.define('Store.my_extension.view.MapPanel', {
    extend: 'Ext.panel.Panel',
    layout: 'fit',
    cls: 'map_canvas',
    bodyCls: 'map_canvas',

    initComponent: function () {
        this.listeners = {
            render: this.initMap,
            resize: this.resizeMap,
            scope: this
        };

        this.callParent(arguments);
    },

    initMap: function () {
        this.map = new MapContainer('my_extension_map');
        this.map.init(55.75, 37.65, 10, this.id + '-body', false);
    },

    resizeMap: function () {
        if (this.map && this.map.checkResize) {
            this.map.checkResize();
        }
    }
});
```

### Pattern E: Header Button Or Header Menu Item

Use a header button only for global actions that should be visible all the time.

```js
if (window.skeleton && skeleton.header && skeleton.header.insert) {
    skeleton.header.insert(5, {
        xtype: 'button',
        cls: 'header_tool my_extension-header-btn',
        iconCls: 'fa fa-bolt',
        tooltip: l('My Extension'),
        handler: this.openWindow,
        scope: this
    });
}
```

Header buttons must include an Extension-specific CSS class with a visible background. Do not rely on white text or a white icon directly on the light gray PILOT header.

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

Use the header dropdown menu for less frequent global actions:

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

Rules:

- Check that `skeleton.header` and the target menu exist.
- Add only the Extension item.
- Do not remove or replace native header buttons or menu items.
- Header buttons have an Extension-specific class with a visible background and readable text/icon color.

### Pattern F: Advanced Host Integration

Use only when the user explicitly asks to extend an existing PILOT workflow such as Reports, Vehicle Editor, History, or native settings.

Rules:

- Check every host object before use.
- Prefer adding a tab, panel, or menu item over overriding native behavior.
- Use optional hooks only behind existence checks, for example `if (window.MODULE_OVERRIDER && MODULE_OVERRIDER.append)`.
- Provide a fallback note when the hook is not available.
- Keep Extension code under `Store.<extension>.*`; do not depend on built-in `Pilot.modules.*` namespaces.

## 5. PILOT Data Rules

If the extension displays vehicles, it must load real PILOT data.

Allowed source:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: {
        vehs: 1,
        state: 1
    },
    success: function (resp) {
        var groups = Ext.decode(resp.responseText);
        // Parse groups and nested children.
    }
});
```

Rules:

- The response is hierarchical.
- Root items are groups/folders.
- Vehicles are inside nested `children`.
- Do not assume a flat array.
- Do not use hardcoded vehicles unless the user explicitly asks for a static mock demo.

## 6. MapContainer Rules

Use [docs/MapContainer.md](docs/MapContainer.md) and [docs/MapContainer_RU.md](docs/MapContainer_RU.md).

Important basics:

- `MapContainer` is a PILOT wrapper over Leaflet. It is not a Google Maps object, even when one of the selectable base layers is named Google Map or Google Sat.
- The underlying Leaflet instance is usually available as `mapContainer.map`. Leaflet centers use `{ lat, lng }`.
- Markers use `lat` and `lon`.
- Existing maps may expose methods such as `addMarker`, `removeMarker`, `getMarker`, `setMapCenter`, `setMapZoom`, `decodeRoute`, `setPolylineBlue`, and `removePilyline`.
- Check method existence before calling version-sensitive methods.
- Some route/polyline helpers may expect Leaflet-style `lng`; marker helpers generally use `lon`.
- Do not write Google Maps-style code such as `mapContainer.getMap().getCenter().lat()` unless the specific runtime was verified to expose that adapter.

Safe example:

```js
if (map.setMapCenter) {
    map.setMapCenter(lat, lon);
}

if (map.setMapZoom) {
    map.setMapZoom(14);
}

map.addMarker({
    id: 'my_marker',
    lat: lat,
    lon: lon,
    hint: 'My marker'
});
```

## 7. `doc/index.html` Rules

Every extension must include `doc/index.html`.

It must:

- be static HTML;
- describe purpose, features, data sources, setup, and limitations;
- optionally include inline CSS.

It must not:

- include `<script>` tags;
- load Ext JS;
- call `skeleton`;
- run extension logic.

## 8. External API Rules

External services may enrich PILOT data, but PILOT remains the source of truth.

Rules:

- API keys must be configurable.
- Browser-side keys may be stored in `localStorage` only if acceptable for that service.
- Secrets must live server-side in a backend or proxy.
- External calls must fail gracefully.
- Do not write external data back into PILOT unless the user explicitly requests a supported backend flow.
- For CORS or secret handling, use a backend or Cloudflare Worker proxy. See [DEPLOY.md](DEPLOY.md).

## 8.1 PILOT Store Proxy URL Rules

PILOT admin stores the external Extension base URL, for example:

```text
Extension name: myapp
Admin URL: https://somehost.com/blabla/
```

At runtime, PILOT proxies that URL under the PILOT domain:

```text
https://pilot-gps.com/store/myapp/              -> https://somehost.com/blabla/
https://pilot-gps.com/store/myapp/Module.js    -> https://somehost.com/blabla/Module.js
https://pilot-gps.com/store/myapp/doc/index.html -> https://somehost.com/blabla/doc/index.html
https://pilot-gps.com/store/myapp/backend/     -> https://somehost.com/blabla/backend/
```

Rules:

- Verify the external `https://somehost.com/blabla/Module.js` directly in a browser before registration.
- Register only the external base URL in PILOT admin: `https://somehost.com/blabla/`.
- Inside the running Extension, prefer same-origin proxied URLs under `/store/<extension>/...` for Extension assets, docs, JSON, and backend calls.
- Do not hardcode `https://pilot-gps.com`; use a root-relative path such as `/store/myapp/backend/api.php` or derive the current script base from the loaded `Module.js`.
- For generated code, keep the PILOT Extension slug/name stable, URL-safe, and Ext JS-safe (`snake_case`), because it becomes both the `/store/<extension>/` path segment and the `Store.<extension>.Module` class segment.
- This proxy path exists for CORS compatibility. Do not call the external host directly from runtime code unless the task explicitly requires it and CORS is known to be safe.

## 8.2 Runtime Libraries, Units, And Renderers

Before adding a third-party library, check whether PILOT already loaded it.

Highcharts:

```js
if (window.Highcharts) {
    Highcharts.chart(containerEl, {
        chart: { type: 'line' },
        title: { text: l('Speed') },
        series: [{ name: l('Speed'), data: [10, 20, 15] }]
    });
}
```

Highcharts sunburst:

```js
if (window.Highcharts && Highcharts.seriesTypes && Highcharts.seriesTypes.sunburst) {
    Highcharts.chart(containerEl, {
        series: [{
            type: 'sunburst',
            data: [{ id: 'root', parent: '', name: l('All') }]
        }]
    });
}
```

jQuery:

```js
var jq = window.jQuery || window.$;
```

Use jQuery sparingly. Prefer Ext JS for Ext component lifecycle and layout.

Units of measure:

- Prefer `window.uom` if available.
- Use helpers like `speedSS(value)`, `mileageSS(value, dec)`, `volumeSS(value, dec)`, `consSS(value, dec)`, `amountSS(value)`, `weigSS(value)`.
- Values passed to these helpers should be in PILOT base units.

Data renderers:

- Date/time: `dateTimeStr`, `timeDateStr`, `dateTimeStrF`, `timeStr`, `dateStrR`, `secondsToHumanTime`.
- Number/status: `num`, `int`, `valuePercent`, `dinamic`, `rank`, `rag`.
- Address/geozone: `makeAddress`, `makeAddressLink`, `makeGeoZone`, `makeCoordinates`.

Renderer safety rules:

- Check function existence before using version-sensitive helpers.
- Many renderers return HTML. Escape user/external strings with `Ext.String.htmlEncode`.
- `makeAddress` and `makeGeoZone` may return placeholder spans and update them asynchronously.

## 8.3 Custom CSS And Colors

When an Extension needs its own CSS:

- load CSS from `Module.js`, not from `doc/index.html`;
- prefer loading Extension CSS/assets from the proxied `/store/<extension>/...` path or from the current `Module.js` base URL;
- keep selectors scoped with an Extension-specific class prefix;
- prefer Tailwind CSS palette colors for custom hex values, for example `slate`, `gray`, `zinc`, `red`, `amber`, `emerald`, `sky`, `blue`, `indigo`, or `violet`;
- do not load Tailwind CSS as a framework unless the user explicitly asks for that and accepts the extra dependency.

## 9. Files AI Should Usually Produce

For a small frontend-only extension:

```text
my_extension/
├── index.html
├── Module.js
├── doc/
│   └── index.html
└── style.css
```

For a backend extension:

```text
my_extension/
├── index.html
├── Module.js
├── doc/
│   └── index.html
├── style.css
└── backend/
    ├── init.php
    └── api.php
```

Do not create package.json, build config, node_modules, or standalone HTML app files unless the user specifically asks for tooling outside the PILOT extension runtime.

Do not create or require `npm`, `node`, `wrangler`, terminal, shell, or CLI deployment steps unless the user explicitly asks for a developer/CLI deployment path.

Do not replace the required zip deliverable with a local build script such as Python, Node.js, PowerShell, Bash, or “run this script to create the zip”. For manager-facing output, the AI must either attach/create the actual zip artifact or clearly state that the current chat cannot attach files.

## 9.1 Deployment Instructions For Managers

Default deployment instructions must be manager-friendly.

When the user chooses Cloudflare for a static Extension and does not explicitly ask for CLI:

- Use Cloudflare dashboard / browser upload instructions.
- Prefer Cloudflare Pages Direct Upload for static `Module.js`, CSS, docs, JSON, and assets.
- Include a root `index.html` next to `Module.js`; it may be empty or duplicate `doc/index.html`. This helps Cloudflare mark the uploaded folder as the assets root.
- Do not tell the user to install `npm`, Node.js, Wrangler, Git, or any terminal tool.
- Tell the user to upload the generated zip archive or its extracted folder through the Cloudflare dashboard.
- Tell the user to verify the public `https://.../Module.js` URL in a browser, then register the external base URL in PILOT admin, for example `https://.../`. Explain that PILOT will proxy it as `/store/<extension>/...` at runtime for CORS compatibility.

When the user chooses GitHub Pages and does not explicitly ask for CLI:

- Use GitHub web UI upload instructions or repository web upload flow.
- Do not require local Git commands.

When a backend/proxy is required:

- Explain that a technical person may be needed.
- If Cloudflare Worker code is needed, provide browser-dashboard steps first and CLI steps only as an optional developer path.

Never claim that a zip file is downloadable unless an actual file attachment/artifact is created. If the current AI environment cannot attach files, say so clearly and do not invent a download link or ask the user to run a local script to build the archive.

## 10. Mandatory Acceptance Checklist

Before final output, verify:

- `Module.js` exists.
- `Module.js` uses `Ext.define('Store.<extension_name>.Module', ...)`, where `<extension_name>` exactly matches the safe `snake_case` Extension name configured in PILOT.
- The Extension name/slug contains no hyphens. If the public host is `weather-demo.YOUR.pages.dev`, register the PILOT Extension as `weather_demo` and use `/store/weather_demo/...` inside runtime URLs.
- The class extends `Ext.Component`.
- `initModule` is a class method.
- No forbidden bootstrap pattern exists.
- If a navigation tab is added, it has `title` and `iconCls`.
- If a navigation tab has a main panel, `navTab.map_frame = mainPanel` exists.
- If using `skeleton.mapframe`, the code does not typo it as only `map_frame` without fallback.
- If a context menu item is added, it preserves the existing menu and has `iconCls`.
- If a header item is added, it preserves native header/menu items and checks host availability.
- If a header button is added, it uses `header_tool <extension>-header-btn` and CSS gives that class a visible background plus readable text/icon color.
- If advanced host integration is used, every optional hook is guarded and fallback behavior is documented.
- If vehicles are displayed, they are loaded from PILOT API and hierarchical `children` are parsed.
- `doc/index.html` contains no `<script>`.
- If the idea uses maps, markers, routes, geozones, map center, or coordinates, [docs/MapContainer.md](docs/MapContainer.md) was used and no Google Maps-style API was invented.
- Extension-created map markers/routes can be cleaned up.
- The deliverable is a zip archive that contains the complete Extension file structure.
- The zip archive contains root `index.html`, `Module.js`, `doc/index.html`, and every referenced JS/CSS/backend/asset file.
- The chat answer does not print full source code by default; it only summarizes the archive, file tree, upload location, direct `Module.js` verification URL shape, base URL for PILOT registration, browser verification steps, and basic troubleshooting.
- Cloudflare/GitHub deployment instructions are browser UI-first for managers and do not require `npm`, `wrangler`, Git, or terminal commands unless explicitly requested.
- For Cloudflare deliverables, root `index.html` exists next to `Module.js`, even if it is empty or a copy of `doc/index.html`.
- Runtime asset/doc/backend URLs use or document the PILOT `/store/<extension>/...` proxy path instead of direct external-host calls when CORS compatibility matters.
- The answer does not invent a fake download link for the zip archive.
- The answer does not replace the zip artifact with Python/Node/PowerShell/Bash code that the user must run locally.

If any applicable item fails, regenerate or fix the code before presenting it.

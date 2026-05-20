# MapContainer Guide For PILOT Extensions

`MapContainer` is the PILOT map wrapper used by the Online and History sections.

It is built on top of Leaflet. In Extensions, do not treat it as a Google Maps object, even when the selected base layer is named `Google Map` or `Google Sat`.

Most Extensions should reuse existing map instances:

```js
var onlineMap = window.mapContainer;
var historyMap = window.historyMapContainer;
```

If the active tab helper exists, prefer it for Online/current-map actions:

```js
function getPilotMap() {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

## Extension Safety Rules

- Use `MapContainer` methods first: `addMarker`, `removeMarker`, `setMapCenter`, `setMapZoom`, `addPolyline`, `removePolyline`, `setPolygon`, `addCircle`.
- Use the underlying Leaflet map only through `mapContainer.map` or `mapContainer.getMap()` and only after checking that it exists.
- Leaflet uses `{ lat, lng }`; many PILOT helpers and marker options use `lat` and `lon`.
- Do not use Google Maps-style code such as `mapContainer.getMap().getCenter().lat()`; Leaflet center fields are properties, not functions.
- Track every marker/polyline/polygon/circle ID created by your Extension so you can remove your own layers later.
- Do not call `clearAllMarkers`, `removeAllTracks`, `removeAllHistoryTracks`, or similar broad cleanup methods from an Extension unless the feature owns all those layers.

## Getting Current Map Center

```js
function getMapCenter(mapContainer) {
    var map = mapContainer && mapContainer.getMap ?
        mapContainer.getMap() :
        mapContainer && mapContainer.map;

    if (!map || !map.getCenter) {
        return null;
    }

    var center = map.getCenter();

    return {
        lat: center.lat,
        lon: center.lng
    };
}
```

## Creating A New Map

Create a new map only for a custom Extension panel. Do not create a new map when the business idea says to use the current PILOT map.

```js
var mapContainer = new MapContainer('my_extension_map');

mapContainer.init(25.184646, 55.2644923, 10, 'my-map-div', {
    withControls: true
});
```

`init(lat, lon, zoom, div, config)`:

| Parameter | Meaning |
|---|---|
| `lat` | Initial latitude. If missing, PILOT may use saved position or browser geolocation. |
| `lon` | Initial longitude. |
| `zoom` | Initial zoom. If missing, PILOT may use saved zoom from `localStorage`. |
| `div` | DOM element id for the Leaflet map container. |
| `config` | Optional Leaflet options plus PILOT flags. |

Useful config flags:

| Option | Meaning |
|---|---|
| `withControls` | Adds the Leaflet layer switcher and initializes the selected base map. |
| `withOutPlugins` | Skips active built-in plugins when truthy. |
| `crs` | Optional Leaflet CRS override. PILOT changes CRS for Yandex layers internally. |

## Base Maps

The runtime builds `baseMaps` from built-in providers and partner/global config. The current layer is stored in `localStorage` as `map_<mapContainer.name>`.

Common built-in names:

```text
Base
Dark
Gray
OSM
2Gis
Yandex
Yandex Sat
Google Map
Google Terrain
Google Sat
Wiki Mapia
TomTom
TomTom Dark
TomTom Sat
Arc GIS
Cosmo Sat
CARTO Voyager
CARTO Dark Matter
CARTO Positron
```

Switch base map:

```js
mapContainer.setBaseMap('OSM');
```

Inspect layers after initialization:

```js
var baseMaps = mapContainer.baseMaps;
var layers = mapContainer.getBaseMapLayers();
```

`baseMaps` is the practical Leaflet layer dictionary. `getBaseMapLayers()` exists in the runtime and returns `baseMapLayers` when that array is populated by the host flow.

## Plugins

Built-in plugin names observed in the runtime:

```text
polylineMeasure
tracksPanel
PolygonAreaMeter
streetView
browserPrint
Traffic
Weather
TrafficSea
```

Access a plugin:

```js
try {
    var traffic = mapContainer.getPlugin('Traffic');
} catch (e) {
    Ext.log('Traffic plugin is not available');
}
```

`getPlugin(name)` throws when the plugin is not found, so guard it with `try/catch` or check behavior carefully.

## Map View Methods

| Method | Notes |
|---|---|
| `getMap(options)` | Returns `options.map` if provided, otherwise the underlying Leaflet map. |
| `setMapCenter(lat, lon, options)` | Accepts either `lat, lon` or an array of points. Arrays call Leaflet `fitBounds`; scalar coordinates call `panTo`. `options.zoom` sets zoom after moving. |
| `setMapCenterBounds(position, options)` | Calls Leaflet `fitBounds(position, options)`. |
| `setMapCenterAnimate(lat, lon, options)` | Uses `flyToBounds`; `options.zoom` maps to `maxZoom`, `options.duration` controls animation duration. |
| `setMapZoom(zoom)` | Sets map zoom and stores it in `localStorage`. |
| `checkResize()` | Calls Leaflet invalidation logic for resized containers. Use after showing/resizing custom map panels. |
| `panToBounds(bounds_arr)` | Pan/fit helper for bounds arrays. |
| `setFullscreen(isActive)` | Toggles fullscreen state for the map container. |

## Markers

Add marker:

```js
var marker = mapContainer.addMarker({
    id: 'my_extension_marker_1',
    lat: 25.1846,
    lon: 55.2645,
    icon: 'https://example.com/icon.png',
    size: 'medium',
    tooltip: {
        msg: 'My marker',
        options: { direction: 'bottom' }
    },
    click: function (marker) {
        marker.showPopup();
    },
    customOptions: {
        type: 'my_extension'
    }
});
```

Important marker options:

| Option | Meaning |
|---|---|
| `id` | Required. Must be unique. Duplicate IDs are logged as warnings. |
| `lat`, `lon` | Required. `0` coordinates are rejected. |
| `icon` | Icon URL. |
| `size` | One of `micro`, `mini`, `mediumMini`, `medium`, `big`. |
| `x`, `y`, `a` | Manual icon width, height, and anchor y. |
| `tooltip` | `{ msg, options }` for Leaflet tooltip. |
| `label` | Permanent label. Do not combine with `tooltip`. |
| `poupContent` | Popup HTML. The runtime uses the historical misspelling `poupContent`. |
| `data` | PILOT vehicle-like data used to auto-build popup HTML. |
| `click` | Called as `click(marker)`. |
| `dragend` | Enables dragging and is called as `dragend(marker, event)`. |
| `contextmenu` | Marker context menu items. |
| `notBindToMap` | Creates marker object without adding it to the map. |
| `customOptions.type` | Useful for grouping extension markers. |

Marker helpers added by PILOT:

| Method | Notes |
|---|---|
| `marker.getId()` | Returns marker ID. |
| `marker.getLatLng()` | Returns Leaflet lat/lng. |
| `marker.showPopup()` | Opens popup after rebuilding content. |
| `marker.focus(zoom, duration)` | Focuses marker. |
| `marker.getStorage(key)` / `marker.setStorage(key, value)` | Stores extension data on the marker. |
| `marker.updateTooltip(options)` | Updates permanent tooltip/label. |
| `marker.clearListeners()` | Removes marker listeners used by PILOT. |

Find and remove markers:

```js
var marker = mapContainer.getMarker('my_extension_marker_1');

if (marker) {
    mapContainer.removeMarker(marker);
}
```

Related marker methods:

| Method | Notes |
|---|---|
| `getMarker(id)` | Returns marker from internal `_gmarkers`. |
| `deleteMarker(id)` | ID-based removal helper. |
| `removeMarker(marker)` | Removes a marker object from map and internal storage. |
| `removeMarkers(markers)` | Removes a list. |
| `removeAllMarkers(type)` | Broad cleanup. Avoid in Extensions unless you own the scope. |
| `clearAllMarkers()` | Removes all tracked markers. Avoid in Extensions. |
| `showMarkers(markersIDs)` / `hideMarkers(markersIDs)` | Show/hide by IDs. |
| `fitBoundsToMarkers()` | Fits map to current markers. |
| `flyToMarker(marker)` | Animated focus. |

## Polylines, Routes, And Tracks

Simple named polyline:

```js
var polyline = mapContainer.addPolyline([
    [25.18, 55.26],
    [25.19, 55.27]
], {
    id: 'my_extension_line_1',
    color: '#0EA5E9',
    label: 'Route'
});
```

Remove it:

```js
mapContainer.removePolyline('my_extension_line_1');
```

Polyline and route methods:

| Method | Notes |
|---|---|
| `addPolyline(points, options)` | Adds a managed polyline into `geofences`; returns `{ id, layer, options, focus, setTooltip }`. |
| `getPolyline(id)` | Returns managed polyline record. |
| `removePolyline(id)` | Removes managed polyline by ID. |
| `setPolyline(latlngs, color, options)` | Adds a generic Leaflet polyline named `polyline`; stored as `mapContainer.polyline`. |
| `removePilyline()` | Removes generic polylines with option `name: 'polyline'`. The misspelling is real in the runtime. |
| `setPolylineBlue(points)` | Shortcut using blue color. |
| `decodeRoute(encoded, precision)` | Decodes encoded route into `{ lat, lng }` objects. |
| `addArrowRoute(points, options)` | Adds route with direction arrows or corridor width. |
| `getArrowRoute(id)` / `removeArrowRoute(route)` | Manage arrow route objects. |
| `removeAllArrowRoutesType(type)` | Removes arrow routes by type. |
| `createInteractivePolyline(points, options)` | Adds hover/click interaction. Requires valid `options`; history tracks pass `rawPoints`. |
| `addHistoryTrack(data, options)` | Adds colored history route, route arrows, markers, and interactive hover behavior. |
| `getHistoryTrack(id)` / `removeHistoryTrack(id)` | Manage history tracks. |
| `removeAllHistoryTracks()` | Broad cleanup. Avoid unless you own all history tracks. |

History track input uses:

```js
{
    points: [
        [lat, lng, speed, timestamp]
    ],
    markers: [
        { id: 'm1', lat: 25.18, lon: 55.26 }
    ]
}
```

## Circles And Polygons

Circle:

```js
var circle = mapContainer.addCircle({
    id: 'my_extension_circle_1',
    lat: 25.1846,
    lng: 55.2645,
    radius: 500,
    label: '500 m',
    color: '#0EA5E9'
});
```

Polygon:

```js
var polygon = mapContainer.setPolygon([
    [25.18, 55.26],
    [25.19, 55.26],
    [25.19, 55.27]
], {
    id: 'my_extension_polygon_1',
    label: 'Zone',
    color: '#22C55E',
    fillOpacity: 0.2
});
```

Methods:

| Method | Notes |
|---|---|
| `addCircle(options, marker)` | Adds Leaflet circle or marker-bound great circle. Uses `lat/lng`, not `lat/lon`. |
| `getCircle(id)` / `removeCircle(id)` | Manage circles. |
| `removeCircles(circles)` / `removeAllCircles(type)` | Remove groups. |
| `setPolygon(points, options)` | Adds polygon to `geofences`; supports `label`, `tooltip`, `popup`, `color`, `fillOpacity`. |
| `getPolygon(id)` / `removePolygon(id)` | Manage polygons. |
| `clearAllPolygons()` | Broad cleanup. Avoid unless you own all polygons. |
| `getPointsZoneData(data)` | Parses strings like `lat,lng\|lat,lng\|...`. |
| `updateGeofenceVisibility()` | Updates label/layer visibility based on zoom and pixel size. |
| `setMinimalSizeNameGeozone(fontSize)` / `getMinimalSizeNameGeozone()` | Label sizing helpers. |

## KML, Tiles, Heatmaps

KML:

```js
mapContainer.addKmlLayer('/zones.kml', 'zones');
mapContainer.removeKmlLayer('zones');
```

Tile layer:

```js
mapContainer.addTileLayer({
    id: 'my_tiles',
    url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    minZoom: 10,
    maxZoom: 22,
    bounds: {
        corner_1: { lat: 25.0, lng: 55.0 },
        corner_2: { lat: 26.0, lng: 56.0 }
    }
});
```

Heatmap:

```js
var heat = mapContainer.setHeatmap([
    { lat: 25.18, lng: 55.26, count: 10 },
    { lat: 25.19, lng: 55.27, count: 25 }
], true, 'Density');

mapContainer.removeHeatMap(heat.id);
```

Methods:

| Method | Notes |
|---|---|
| `addKmlLayer(url, name)` | Fetches KML via jQuery and adds it. The runtime stores `name` as the layer key. |
| `getKmlLayer(name)` / `removeKmlLayer(name)` / `clearKmlLayers()` | Manage KML layers. |
| `addTileLayer(config)` / `getTileLayer(config)` / `removeTileLayer(config)` / `clearTileLayers()` | Manage tile layers by `config.id`. |
| `setHeatmap(points, isBounds, name)` | Adds `HeatmapOverlay` with fields `lat`, `lng`, `count`. Returns heat object with generated `id`. |
| `removeHeatMap(id)` / `removeAllHeatsMap()` | Manage heatmaps. |

## Controls And Interaction

| Method | Notes |
|---|---|
| `contexmenu(L, menu)` | Enables map context menu. Historical spelling is `contexmenu`. |
| `markercontexmenu(L, menu)` | Marker context menu helper. |
| `setHiddenContexMenu(isHide)` | Hides/shows context menu behavior. |
| `bindClick(cursor, callback)` | Sets cursor and binds Leaflet map click. |
| `unBindClick(cursor)` | Clears map click binding and cursor. |
| `setCursor(cursor)` | Sets CSS cursor on the map container. |
| `showCoords(event)` | Updates `#geomessage` with mouse coordinates. |
| `addControlMap(control)` / `removeControlMap(id)` / `getControl(id)` | Manage controls stored as `{ id, control }`. |
| `addCustomControl(name, domEl, position)` / `getCustomControl(name)` / `removeCustomControl(name)` | Manage custom Leaflet controls. |
| `addControl(name, html, position)` / `removeControl(name)` | Simple control helper. |
| `addLegend(html, position)` / `removeLegend()` | Legend helper. |

After `init(...)`, the map listens to mouse movement and updates `#geomessage`. `Ctrl + click` on the Leaflet map copies coordinates as `lat, lng` to the clipboard and shows a short popup.

## Geometry Helpers

| Method | Notes |
|---|---|
| `getDistanceBetweenLatLng(a, b)` | Expects `{ lat, lng }`; returns meters or `null` for invalid input. |
| `getDistanceBetweenLatLngHaversine(a, b)` | Haversine distance in meters. |
| `getDistanceBetweenPoints(a, b)` | Uses Leaflet point distance. |
| `geodesicArea(latLngs)` | Polygon area in square meters. |
| `geodesicAreaCircle(radius)` | Circle area. |
| `inBounds(lat, lng, bounds)` | Checks whether point is inside bounds. |
| `getAzimuth(firstPoint, secondPoint)` | Bearing helper. |
| `toRadians(degrees)` / `toDegrees(angle)` | Conversion helpers. |

## Cleanup Pattern For Extensions

```js
Ext.define('Store.my_extension.MapLayerStore', {
    singleton: true,

    markerIds: [],
    polylineIds: [],

    clear: function (map) {
        Ext.Array.forEach(this.markerIds, function (id) {
            var marker = map.getMarker && map.getMarker(id);

            if (marker && map.removeMarker) {
                map.removeMarker(marker);
            }
        });

        Ext.Array.forEach(this.polylineIds, function (id) {
            if (map.removePolyline) {
                map.removePolyline(id);
            }
        });

        this.markerIds = [];
        this.polylineIds = [];
    }
});
```

## Common Mistakes

| Mistake | Correct approach |
|---|---|
| `mapContainer.getMap().getCenter().lat()` | `mapContainer.getMap().getCenter().lat` |
| Using `lon` with Leaflet internals | Use `lng` inside Leaflet objects and convert to `lon` for PILOT marker helpers. |
| `removeMarker('id')` | Use `getMarker(id)` and pass the marker object, or use `deleteMarker(id)` if available. |
| Calling `clearAllMarkers()` from an Extension | Track and remove only Extension-created markers. |
| Creating a new `MapContainer` for current-map features | Reuse `window.mapContainer`, `window.historyMapContainer`, or `getActiveTabMapContainer()`. |

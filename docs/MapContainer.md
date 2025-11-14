
# MapContainer Usage Manual for Developers

This document provides a comprehensive guide to using the `MapContainer` class from `mapcontainer.js`. It is designed for developers integrating interactive Leaflet-based maps into web applications, particularly in fleet management, tracking, or geospatial visualization systems.

---

## Overview

`MapContainer` is a powerful wrapper around **Leaflet.js** that extends its functionality with:

- Multiple base map layers (OSM, Google, Yandex, TomTom, etc.)
- Traffic and sea traffic overlays
- Geofence drawing and visibility management
- Vehicle tracking with history tracks and markers
- Measurement tools (polyline, polygon area)
- Plugins (Street View, Print, Measure)
- Context menus, tooltips, heatmaps, KML, custom tiles
- Responsive controls and localization support

It manages state via `localStorage`, supports multiple languages, and allows deep customization.

---

## Initialization

### Constructor

```js
function MapContainer(layerName)
```

- `layerName`: String identifier for the map instance (used in `localStorage`, CSS variables, etc.)

### `init(lat, lon, zoom, div, config)`

```js
mapContainer.init(lat, lon, zoom, 'map-div-id', { withControls: true });
```

| Parameter | Type | Description |
|--------|------|-----------|
| `lat` | Number | Initial center latitude |
| `lon` | Number | Initial center longitude |
| `zoom` | Number | Initial zoom level |
| `div` | String | ID of the `<div>` container |
| `config` | Object | Optional config |

#### Config Options

```js
{
  withControls: true,        // Show layer switcher
  withOutPlugins: false,     // Disable built-in plugins
  crs: L.CRS.EPSG3857        // Override coordinate system
}
```

> Returns the `MapContainer` instance.

---

## Base Map Layers

Supports multiple providers:

```js
'OSM', 'Google Map', 'Google Sat', 'Yandex', 'Yandex Sat',
'TomTom', 'TomTom Dark', 'TomTom Sat', '2Gis', 'Arc GIS', 'Cosmo Sat'
```

### Switch Base Map

```js
mapContainer.setBaseMap('Google Sat');
```

> Uses Leaflet layer control. Persisted in `localStorage`.

---

## Plugins

Built-in plugins are defined in `this.plugins`.

| Plugin | Purpose | Options |
|-------|--------|--------|
| `polylineMeasure` | Measure distance | Tooltips, units |
| `PolygonAreaMeter` | Measure area | Toggle button |
| `streetView` | Google Street View | Checkbox |
| `browserPrint` | Print map | Portrait/Landscape |
| `Traffic` | Road traffic | Google/Yandex |
| `TrafficSea` | Marine traffic | Checkbox (if `seamap === '1'`) |

### Access Plugin

```js
const trafficPlugin = mapContainer.getPlugin('Traffic');
```

---

## Markers

### `addMarker(options)`

```js
mapContainer.addMarker({
  id: 'veh_123',
  lat: 25.1846,
  lon: 55.2645,
  icon: 'icons/truck.png',
  size: 'medium', // or [x, y]
  tooltip: { msg: 'Truck #123', direction: 'top' },
  popupContent: '<b>Truck 123</b>',
  click: () => alert('Clicked!'),
  dragend: (e) => console.log(e.latlng)
});
```

#### Marker Sizes

| Size | Dimensions |
|------|------------|
| `micro` | 16×16 |
| `mini` | 24×24 |
| `medium` | 32×32 |
| `big` | 48×48 |

Or set `x`, `y` manually.

### Remove Marker

```js
mapContainer.removeMarker(marker); // or by ID via internal tracking
```

---

## History Tracks

### `addHistoryTrack(data, options)`

```js
mapContainer.addHistoryTrack({
  points: [[lat, lng, speed, timestamp], ...],
  markers: [markerOptions, ...]
}, {
  id: 'track_1',
  color: '#FF0000',
  veh_name: 'Truck 123'
});
```

- Colors by speed or sensor values
- Interactive hover popup with speed/time/address
- Click to measure distance between points

### Remove Track

```js
mapContainer.removeHistoryTrack('track_1');
mapContainer.removeAllHistoryTracks();
```

---

## Geofences

Stored in `this.geofences` (LayerGroup)

### Add Polygon

```js
const polygon = mapContainer.addPolyline([
  [lat1, lng1], [lat2, lng2], ...
], {
  id: 'zone_1',
  color: '#FF0000',
  label: 'Warehouse A'
});
```

### Visibility Management

- Automatically hides small geofences at low zoom
- Tooltips appear only if size > 50px
- Use `updateGeofenceVisibility()` on `moveend`

```js
mapContainer.map.on('moveend', () => mapContainer.updateGeofenceVisibility());
```

---

## Measurement Tools

### Polyline Measure

Enabled via plugin. Supports:
- Drag to move
- SHIFT + click to delete
- CTRL + click to resume/add

### Polygon Area Meter

```js
mapContainer.activatePolygonAreaMeter();
// Draw multiple polygons
mapContainer.disablePolygonAreaMeter();
```

> Double-click to finish polygon.

---

## Traffic Layers

### Road Traffic

Toggles via checkbox (top-right). Uses:
- Google Traffic API
- Yandex Traffic

```js
localStorage.setItem('traffic-layer', 'google'); // or 'yandex'
```

### Sea Traffic (Marine)

Enabled if `global_conf.conf.org.conf.seamap === '1'`

```html
<input type="checkbox" id="traffic-sea-btn">
<label>Sea map</label>
```

---

## Coordinates & Interaction

### Show Coordinates

```js
mapContainer.map.on('mousemove', mapContainer.showCoords);
```

Displays in bottom-right corner.

### CTRL + Click → Copy Coordinates

```js
// Automatically enabled
// Copies: "25.18465, 55.26449"
```

Shows temporary popup: "Copied: ..."

---

## Context Menu

```js
mapContainer.contexmenu(L, {
  width: 160,
  items: [
    { text: 'Add Marker', callback: () => { ... } },
    { text: 'Measure', callback: () => { ... } }
  ]
});
```

> Right-click on map.

---

## Heatmaps

```js
mapContainer.setHeatmap([
  { lat: 25.1, lng: 55.1, count: 10 },
  { lat: 25.2, lng: 55.2, count: 50 }
], true, 'Vehicle Density');
```

- Includes toggle checkbox
- Auto-fit bounds if `isBounds = true`

---

## KML & Custom Tiles

### Add KML

```js
mapContainer.addKmlLayer('data.zones.kml', 'Zones');
mapContainer.removeKmlLayer('Zones');
```

### Add Custom Tile Layer

```js
mapContainer.addTileLayer({
  id: 'custom',
  url: 'https://tiles.example.com/{z}/{x}/{y}.png',
  minZoom: 10,
  maxZoom: 18,
  bounds: { corner_1: {lat,lng}, corner_2: {lat,lng} }
});
```

---

## Utility Methods

| Method | Description |
|-------|-------------|
| `setMapCenter(lat, lon)` | Pan to location |
| `setMapCenterBounds(bounds)` | Fit bounds |
| `setMapZoom(zoom)` | Set zoom |
| `getDistanceBetweenLatLng(a, b)` | Haversine distance (meters) |
| `geodesicArea(latLngs)` | Polygon area (m²) |
| `createInteractivePolyline(points, opts)` | Hover info + distance measure |

---

## Events

```js
mapContainer.map.on('baselayerchange', (e) => {
  console.log('Switched to:', e.name);
});

mapContainer.map.on('zoomend', () => {
  localStorage.setItem('zoom', mapContainer.map.getZoom());
});
```

---

## Styling & Theming

### Dynamic Tooltip Color

```css
--map1_tooltip: #FFFFFF; /* Light for dark maps */
```

Auto-set based on base layer.

### Custom CSS

```css
.tooltip_map1 { color: var(--map1_tooltip) !important; }
```

---

## Localization (`l()` function)

```js
l('Traffic') → 'Traffic' or 'Движение' (RU)
```

Used in:
- Tooltips
- Buttons
- Popups

---

## Best Practices

1. **Always call `init()` first**
2. **Use unique `layerName` per map instance**
3. **Persist zoom/center in `localStorage`**
4. **Call `updateGeofenceVisibility()` on move**
5. **Avoid memory leaks: remove markers/tracks**

---

## Example: Full Setup

```html
<div id="map" style="height: 600px;"></div>
```

```js
const mapContainer = new MapContainer('main');
mapContainer.init(25.1846, 55.2645, 12, 'map', {
  withControls: true
});

// Add vehicle
mapContainer.addMarker({
  id: 'v1',
  lat: 25.18,
  lon: 55.26,
  icon: 'truck.png',
  tooltip: { msg: 'Truck 1' }
});

// Add history
mapContainer.addHistoryTrack(trackData, { id: 't1' });
```

---

## Troubleshooting

| Issue | Solution |
|------|----------|
| Map not loading | Check `div` ID exists |
| Plugins missing | Ensure Leaflet plugins loaded |
| Traffic not showing | Check API keys / CORS |
| Coordinates not copying | Allow clipboard access |
| Geofences disappear | Increase `MIN_VISIBLE_SIZE_PIXELS` |

---

## Dependencies

- Leaflet.js
- Leaflet plugins:
    - `leaflet.polylineMeasure`
    - `leaflet.browser.print`
    - `leaflet.streetview`
    - `leaflet-editable`
    - `leaflet-corridor`
    - `leaflet-heatmap`

---

**Built for performance, scalability, and real-time tracking.**

---
```

**Save as:** `MAPCONTAINER_USAGE_MANUAL.md`  
**Ready to paste directly into any Markdown file or documentation system.**
```
# Руководство По MapContainer Для PILOT Extensions

`MapContainer` - картографическая обертка PILOT, которая используется в разделах Online и History.

Она построена поверх Leaflet. В Extensions не считайте ее объектом Google Maps, даже если выбран базовый слой `Google Map` или `Google Sat`.

В большинстве Extensions нужно использовать уже существующие карты:

```js
var onlineMap = window.mapContainer;
var historyMap = window.historyMapContainer;
```

Если доступен helper активной вкладки, для действий на текущей Online-карте лучше использовать его:

```js
function getPilotMap() {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

## Правила Безопасности Для Extensions

- Сначала используйте методы `MapContainer`: `addMarker`, `removeMarker`, `setMapCenter`, `setMapZoom`, `addPolyline`, `removePolyline`, `setPolygon`, `addCircle`.
- К нижележащей Leaflet-карте обращайтесь только через `mapContainer.map` или `mapContainer.getMap()` и только после проверки существования.
- Leaflet использует `{ lat, lng }`; многие PILOT-хелперы и marker options используют `lat` и `lon`.
- Не используйте Google Maps-style код вроде `mapContainer.getMap().getCenter().lat()`; у Leaflet поля центра являются свойствами, а не функциями.
- Запоминайте все ID маркеров, линий, полигонов и кругов, которые создает Extension, чтобы потом удалить только свои слои.
- Не вызывайте `clearAllMarkers`, `removeAllTracks`, `removeAllHistoryTracks` и похожие широкие методы очистки из Extension, если Extension не владеет всеми этими слоями.

## Получить Текущий Центр Карты

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

## Создать Новую Карту

Создавайте новую карту только для собственного map panel внутри Extension. Если бизнес-идея говорит использовать текущую карту PILOT, новую карту создавать не нужно.

```js
var mapContainer = new MapContainer('my_extension_map');

mapContainer.init(25.184646, 55.2644923, 10, 'my-map-div', {
    withControls: true
});
```

`init(lat, lon, zoom, div, config)`:

| Параметр | Значение |
|---|---|
| `lat` | Начальная широта. Если не задана, PILOT может использовать сохраненную позицию или browser geolocation. |
| `lon` | Начальная долгота. |
| `zoom` | Начальный zoom. Если не задан, PILOT может использовать сохраненный zoom из `localStorage`. |
| `div` | ID DOM-элемента для Leaflet-карты. |
| `config` | Опции Leaflet плюс флаги PILOT. |

Полезные config flags:

| Опция | Значение |
|---|---|
| `withControls` | Добавляет Leaflet layer switcher и инициализирует выбранную базовую карту. |
| `withOutPlugins` | Если truthy, не запускает активные встроенные plugins. |
| `crs` | Опциональное переопределение Leaflet CRS. Для Yandex слоев PILOT меняет CRS внутри. |

## Базовые Карты

Runtime строит `baseMaps` из встроенных провайдеров и partner/global config. Текущий слой хранится в `localStorage` как `map_<mapContainer.name>`.

Частые встроенные имена:

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

Переключить базовую карту:

```js
mapContainer.setBaseMap('OSM');
```

Посмотреть layers после инициализации:

```js
var baseMaps = mapContainer.baseMaps;
var layers = mapContainer.getBaseMapLayers();
```

`baseMaps` - практический словарь Leaflet layers. `getBaseMapLayers()` существует в runtime и возвращает `baseMapLayers`, если этот массив заполнен host-flow.

## Plugins

Имена встроенных plugins, найденные в runtime:

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

Получить plugin:

```js
try {
    var traffic = mapContainer.getPlugin('Traffic');
} catch (e) {
    Ext.log('Traffic plugin is not available');
}
```

`getPlugin(name)` выбрасывает исключение, если plugin не найден, поэтому используйте `try/catch`.

## Методы Вида Карты

| Метод | Примечание |
|---|---|
| `getMap(options)` | Возвращает `options.map`, если он передан, иначе нижележащую Leaflet-карту. |
| `setMapCenter(lat, lon, options)` | Принимает `lat, lon` или массив точек. Массив вызывает Leaflet `fitBounds`; координаты вызывают `panTo`. `options.zoom` выставляет zoom после перемещения. |
| `setMapCenterBounds(position, options)` | Вызывает Leaflet `fitBounds(position, options)`. |
| `setMapCenterAnimate(lat, lon, options)` | Использует `flyToBounds`; `options.zoom` становится `maxZoom`, `options.duration` задает длительность анимации. |
| `setMapZoom(zoom)` | Устанавливает zoom и сохраняет его в `localStorage`. |
| `checkResize()` | Вызывает Leaflet invalidation logic для изменившегося контейнера. Используйте после показа/resize собственного map panel. |
| `panToBounds(bounds_arr)` | Helper для bounds arrays. |
| `setFullscreen(isActive)` | Переключает fullscreen state карты. |

## Маркеры

Добавить маркер:

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

Важные marker options:

| Опция | Значение |
|---|---|
| `id` | Обязательный уникальный ID. Дубликаты логируются warning. |
| `lat`, `lon` | Обязательны. Координаты `0` отклоняются. |
| `icon` | URL иконки. |
| `size` | `micro`, `mini`, `mediumMini`, `medium`, `big`. |
| `x`, `y`, `a` | Ручные ширина, высота и anchor y. |
| `tooltip` | `{ msg, options }` для Leaflet tooltip. |
| `label` | Постоянная подпись. Не совмещайте с `tooltip`. |
| `poupContent` | HTML popup. В runtime исторически используется опечатка `poupContent`. |
| `data` | PILOT vehicle-like данные для автоматической сборки popup HTML. |
| `click` | Вызывается как `click(marker)`. |
| `dragend` | Включает dragging и вызывается как `dragend(marker, event)`. |
| `contextmenu` | Пункты context menu маркера. |
| `notBindToMap` | Создает marker object, но не добавляет его на карту. |
| `customOptions.type` | Удобно для группировки маркеров Extension. |

PILOT добавляет к marker helper-методы:

| Метод | Примечание |
|---|---|
| `marker.getId()` | Возвращает ID маркера. |
| `marker.getLatLng()` | Возвращает Leaflet lat/lng. |
| `marker.showPopup()` | Открывает popup после пересборки content. |
| `marker.focus(zoom, duration)` | Фокусирует маркер. |
| `marker.getStorage(key)` / `marker.setStorage(key, value)` | Хранит данные Extension на marker. |
| `marker.updateTooltip(options)` | Обновляет постоянный tooltip/label. |
| `marker.clearListeners()` | Удаляет listeners, которые использует PILOT. |

Найти и удалить marker:

```js
var marker = mapContainer.getMarker('my_extension_marker_1');

if (marker) {
    mapContainer.removeMarker(marker);
}
```

Связанные методы:

| Метод | Примечание |
|---|---|
| `getMarker(id)` | Возвращает marker из внутреннего `_gmarkers`. |
| `deleteMarker(id)` | ID-based helper удаления. |
| `removeMarker(marker)` | Удаляет marker object с карты и из внутреннего storage. |
| `removeMarkers(markers)` | Удаляет список. |
| `removeAllMarkers(type)` | Широкая очистка. Избегайте в Extensions, если не владеете scope. |
| `clearAllMarkers()` | Удаляет все tracked markers. Избегайте в Extensions. |
| `showMarkers(markersIDs)` / `hideMarkers(markersIDs)` | Показать/скрыть по ID. |
| `fitBoundsToMarkers()` | Подогнать карту под текущие markers. |
| `flyToMarker(marker)` | Анимированный фокус. |

## Polylines, Routes, Tracks

Простая managed polyline:

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

Удалить:

```js
mapContainer.removePolyline('my_extension_line_1');
```

Методы polyline/route:

| Метод | Примечание |
|---|---|
| `addPolyline(points, options)` | Добавляет managed polyline в `geofences`; возвращает `{ id, layer, options, focus, setTooltip }`. |
| `getPolyline(id)` | Возвращает managed polyline record. |
| `removePolyline(id)` | Удаляет managed polyline по ID. |
| `setPolyline(latlngs, color, options)` | Добавляет generic Leaflet polyline с `name: 'polyline'`; хранится как `mapContainer.polyline`. |
| `removePilyline()` | Удаляет generic polylines с option `name: 'polyline'`. Опечатка в названии реальная. |
| `setPolylineBlue(points)` | Shortcut с синим цветом. |
| `decodeRoute(encoded, precision)` | Декодирует encoded route в `{ lat, lng }`. |
| `addArrowRoute(points, options)` | Добавляет route со стрелками направления или corridor width. |
| `getArrowRoute(id)` / `removeArrowRoute(route)` | Управление arrow route objects. |
| `removeAllArrowRoutesType(type)` | Удаляет arrow routes по type. |
| `createInteractivePolyline(points, options)` | Добавляет hover/click interaction. Требует валидный `options`; history tracks передают `rawPoints`. |
| `addHistoryTrack(data, options)` | Добавляет цветной history route, route arrows, markers и hover behavior. |
| `getHistoryTrack(id)` / `removeHistoryTrack(id)` | Управление history tracks. |
| `removeAllHistoryTracks()` | Широкая очистка. Избегайте, если не владеете всеми history tracks. |

History track input:

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

Методы:

| Метод | Примечание |
|---|---|
| `addCircle(options, marker)` | Добавляет Leaflet circle или marker-bound great circle. Использует `lat/lng`, не `lat/lon`. |
| `getCircle(id)` / `removeCircle(id)` | Управление circles. |
| `removeCircles(circles)` / `removeAllCircles(type)` | Удаление групп. |
| `setPolygon(points, options)` | Добавляет polygon в `geofences`; поддерживает `label`, `tooltip`, `popup`, `color`, `fillOpacity`. |
| `getPolygon(id)` / `removePolygon(id)` | Управление polygons. |
| `clearAllPolygons()` | Широкая очистка. Избегайте, если Extension не владеет всеми polygons. |
| `getPointsZoneData(data)` | Парсит строки вида `lat,lng\|lat,lng\|...`. |
| `updateGeofenceVisibility()` | Обновляет видимость labels/layers по zoom и pixel size. |
| `setMinimalSizeNameGeozone(fontSize)` / `getMinimalSizeNameGeozone()` | Helpers размера labels. |

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

Методы:

| Метод | Примечание |
|---|---|
| `addKmlLayer(url, name)` | Загружает KML через jQuery и добавляет слой. Runtime хранит `name` как key слоя. |
| `getKmlLayer(name)` / `removeKmlLayer(name)` / `clearKmlLayers()` | Управление KML layers. |
| `addTileLayer(config)` / `getTileLayer(config)` / `removeTileLayer(config)` / `clearTileLayers()` | Управление tile layers по `config.id`. |
| `setHeatmap(points, isBounds, name)` | Добавляет `HeatmapOverlay` с полями `lat`, `lng`, `count`. Возвращает heat object с generated `id`. |
| `removeHeatMap(id)` / `removeAllHeatsMap()` | Управление heatmaps. |

## Controls And Interaction

| Метод | Примечание |
|---|---|
| `contexmenu(L, menu)` | Включает context menu карты. Историческое название метода - `contexmenu`. |
| `markercontexmenu(L, menu)` | Helper context menu маркеров. |
| `setHiddenContexMenu(isHide)` | Скрывает/показывает context menu behavior. |
| `bindClick(cursor, callback)` | Ставит cursor и bind Leaflet map click. |
| `unBindClick(cursor)` | Снимает map click binding и cursor. |
| `setCursor(cursor)` | Ставит CSS cursor на map container. |
| `showCoords(event)` | Обновляет `#geomessage` координатами мыши. |
| `addControlMap(control)` / `removeControlMap(id)` / `getControl(id)` | Управление controls в формате `{ id, control }`. |
| `addCustomControl(name, domEl, position)` / `getCustomControl(name)` / `removeCustomControl(name)` | Управление custom Leaflet controls. |
| `addControl(name, html, position)` / `removeControl(name)` | Простой control helper. |
| `addLegend(html, position)` / `removeLegend()` | Helper легенды. |

После `init(...)` карта слушает движение мыши и обновляет `#geomessage`. `Ctrl + click` по Leaflet-карте копирует координаты в формате `lat, lng` в clipboard и показывает короткий popup.

## Geometry Helpers

| Метод | Примечание |
|---|---|
| `getDistanceBetweenLatLng(a, b)` | Ожидает `{ lat, lng }`; возвращает метры или `null` при невалидном input. |
| `getDistanceBetweenLatLngHaversine(a, b)` | Haversine distance в метрах. |
| `getDistanceBetweenPoints(a, b)` | Использует Leaflet point distance. |
| `geodesicArea(latLngs)` | Площадь polygon в квадратных метрах. |
| `geodesicAreaCircle(radius)` | Площадь circle. |
| `inBounds(lat, lng, bounds)` | Проверяет, находится ли точка внутри bounds. |
| `getAzimuth(firstPoint, secondPoint)` | Bearing helper. |
| `toRadians(degrees)` / `toDegrees(angle)` | Conversion helpers. |

## Cleanup Pattern Для Extensions

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

## Частые Ошибки

| Ошибка | Правильный подход |
|---|---|
| `mapContainer.getMap().getCenter().lat()` | `mapContainer.getMap().getCenter().lat` |
| Использовать `lon` внутри Leaflet | В Leaflet используйте `lng`, для PILOT marker helpers переводите в `lon`. |
| `removeMarker('id')` | Используйте `getMarker(id)` и передайте marker object или `deleteMarker(id)`, если доступен. |
| Вызвать `clearAllMarkers()` из Extension | Запоминайте и удаляйте только маркеры своего Extension. |
| Создать новый `MapContainer` для работы с текущей картой | Используйте `window.mapContainer`, `window.historyMapContainer` или `getActiveTabMapContainer()`. |

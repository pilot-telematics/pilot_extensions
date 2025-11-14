
# Руководство по использованию MapContainer для разработчиков

Данный документ представляет собой полное руководство по использованию класса `MapContainer` из файла `mapcontainer.js`. Предназначено для разработчиков, интегрирующих интерактивные карты на базе **Leaflet.js** в веб-приложения, особенно в системах управления автопарком, мониторинга и геовизуализации.

---

## Обзор

`MapContainer` — мощная обёртка над **Leaflet.js**, расширяющая его функциональность:

- Множество базовых карт (OSM, Google, Яндекс, TomTom и др.)
- Слои трафика и морского трафика
- Рисование и управление видимостью геозон
- Отслеживание объектов с историей траекторий и маркерами
- Инструменты измерения (линия, площадь)
- Плагины (Street View, печать, измерение)
- Контекстные меню, подсказки, тепловые карты, KML, кастомные тайлы
- Адаптивные элементы управления и поддержка локализации

Состояние сохраняется в `localStorage`, поддерживается несколько языков, возможна глубокая кастомизация.

---

## Инициализация

### Конструктор

```js
function MapContainer(layerName)
```

- `layerName`: строковый идентификатор экземпляра карты (используется в `localStorage`, CSS-переменных и т.д.)

### `init(lat, lon, zoom, div, config)`

```js
mapContainer.init(lat, lon, zoom, 'map-div-id', { withControls: true });
```

| Параметр | Тип | Описание |
|---------|-----|---------|
| `lat` | Number | Начальная широта центра |
| `lon` | Number | Начальная долгота центра |
| `zoom` | Number | Начальный уровень масштаба |
| `div` | String | ID контейнера `<div>` |
| `config` | Object | Опциональная конфигурация |

#### Опции конфигурации

```js
{
  withControls: true,        // Показывать переключатель слоёв
  withOutPlugins: false,     // Отключить встроенные плагины
  crs: L.CRS.EPSG3857        // Переопределить систему координат
}
```

> Возвращает экземпляр `MapContainer`.

---

## Базовые слои карты

Поддерживаются провайдеры:

```js
'OSM', 'Google Map', 'Google Sat', 'Yandex', 'Yandex Sat',
'TomTom', 'TomTom Dark', 'TomTom Sat', '2Gis', 'Arc GIS', 'Cosmo Sat'
```

### Переключение базовой карты

```js
mapContainer.setBaseMap('Google Sat');
```

> Используется стандартный контрол Leaflet. Сохраняется в `localStorage`.

---

## Плагины

Встроенные плагины определены в `this.plugins`.

| Плагин | Назначение | Опции |
|-------|-----------|------|
| `polylineMeasure` | Измерение расстояния | Подсказки, единицы |
| `PolygonAreaMeter` | Измерение площади | Кнопка переключения |
| `streetView` | Google Street View | Чекбокс |
| `browserPrint` | Печать карты | Портрет/Ландшафт |
| `Traffic` | Дорожный трафик | Google/Яндекс |
| `TrafficSea` | Морской трафик | Чекбокс (если `seamap === '1'`) |

### Доступ к плагину

```js
const trafficPlugin = mapContainer.getPlugin('Traffic');
```

---

## Маркеры

### `addMarker(options)`

```js
mapContainer.addMarker({
  id: 'veh_123',
  lat: 25.1846,
  lon: 55.2645,
  icon: 'icons/truck.png',
  size: 'medium', // или [x, y]
  tooltip: { msg: 'Грузовик #123', direction: 'top' },
  popupContent: '<b>Грузовик 123</b>',
  click: () => alert('Нажато!'),
  dragend: (e) => console.log(e.latlng)
});
```

#### Размеры маркеров

| Размер | Размеры |
|--------|--------|
| `micro` | 16×16 |
| `mini` | 24×24 |
| `medium` | 32×32 |
| `big` | 48×48 |

Или задать вручную через `x`, `y`.

### Удаление маркера

```js
mapContainer.removeMarker(marker); // или по ID через внутренний учёт
```

---

## Исторические траектории

### `addHistoryTrack(data, options)`

```js
mapContainer.addHistoryTrack({
  points: [[lat, lng, speed, timestamp], ...],
  markers: [опции_маркера, ...]
}, {
  id: 'track_1',
  color: '#FF0000',
  veh_name: 'Грузовик 123'
});
```

- Цвет по скорости или значениям датчиков
- Интерактивная подсказка при наведении: скорость/время/адрес
- Клик — измерение расстояния между точками

### Удаление траектории

```js
mapContainer.removeHistoryTrack('track_1');
mapContainer.removeAllHistoryTracks();
```

---

## Геозоны

Хранятся в `this.geofences` (LayerGroup)

### Добавление полигона

```js
const polygon = mapContainer.addPolyline([
  [lat1, lng1], [lat2, lng2], ...
], {
  id: 'zone_1',
  color: '#FF0000',
  label: 'Склад А'
});
```

### Управление видимостью

- Автоматически скрывает мелкие геозоны при низком масштабе
- Подсказки появляются только если размер > 50px
- Вызывать `updateGeofenceVisibility()` при `moveend`

```js
mapContainer.map.on('moveend', () => mapContainer.updateGeofenceVisibility());
```

---

## Инструменты измерения

### Измерение линии

Включается через плагин. Поддерживает:
- Перетаскивание
- SHIFT + клик — удалить точку
- CTRL + клик — добавить/продолжить

### Измерение площади

```js
mapContainer.activatePolygonAreaMeter();
// Рисовать несколько полигонов
mapContainer.disablePolygonAreaMeter();
```

> Двойной клик — завершить полигон.

---

## Слои трафика

### Дорожный трафик

Переключается чекбоксом (вверху справа). Использует:
- Google Traffic API
- Яндекс.Пробки

```js
localStorage.setItem('traffic-layer', 'google'); // или 'yandex'
```

### Морской трафик

Включается, если `global_conf.conf.org.conf.seamap === '1'`

```html
<input type="checkbox" id="traffic-sea-btn">
<label>Морская карта</label>
```

---

## Координаты и взаимодействие

### Отображение координат

```js
mapContainer.map.on('mousemove', mapContainer.showCoords);
```

Отображается в правом нижнем углу.

### CTRL + Клик → Копирование координат

```js
// Включено автоматически
// Копирует: "25.18465, 55.26449"
```

Показывает временное уведомление: "Скопировано: ..."

---

## Контекстное меню

```js
mapContainer.contexmenu(L, {
  width: 160,
  items: [
    { text: 'Добавить маркер', callback: () => { ... } },
    { text: 'Измерить', callback: () => { ... } }
  ]
});
```

> Правая кнопка мыши на карте.

---

## Тепловые карты

```js
mapContainer.setHeatmap([
  { lat: 25.1, lng: 55.1, count: 10 },
  { lat: 25.2, lng: 55.2, count: 50 }
], true, 'Плотность ТС');
```

- Включает чекбокс переключения
- Автоматический фокус, если `isBounds = true`

---

## KML и кастомные тайлы

### Добавление KML

```js
mapContainer.addKmlLayer('data.zones.kml', 'Зоны');
mapContainer.removeKmlLayer('Зоны');
```

### Добавление кастомного тайлового слоя

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

## Полезные методы

| Метод | Описание |
|------|---------|
| `setMapCenter(lat, lon)` | Переместить центр |
| `setMapCenterBounds(bounds)` | Подогнать под границы |
| `setMapZoom(zoom)` | Установить масштаб |
| `getDistanceBetweenLatLng(a, b)` | Расстояние по Хаверсину (метры) |
| `geodesicArea(latLngs)` | Площадь полигона (м²) |
| `createInteractivePolyline(points, opts)` | Подсказки + измерение расстояния |

---

## События

```js
mapContainer.map.on('baselayerchange', (e) => {
  console.log('Переключено на:', e.name);
});

mapContainer.map.on('zoomend', () => {
  localStorage.setItem('zoom', mapContainer.map.getZoom());
});
```

---

## Стилизация и темы

### Динамический цвет подсказок

```css
--map1_tooltip: #FFFFFF; /* Светлый для тёмных карт */
```

Автоматически устанавливается в зависимости от базового слоя.

### Пользовательские CSS

```css
.tooltip_map1 { color: var(--map1_tooltip) !important; }
```

---

## Локализация (`l()`)

```js
l('Traffic') → 'Traffic' или 'Движение' (RU)
```

Используется в:
- Подсказках
- Кнопках
- Всплывающих окнах

---

## Лучшие практики

1. **Всегда вызывать `init()` первым**
2. **Использовать уникальный `layerName` для каждой карты**
3. **Сохранять масштаб/центр в `localStorage`**
4. **Вызывать `updateGeofenceVisibility()` при перемещении**
5. **Избегать утечек памяти: удалять маркеры/траектории**

---

## Пример: Полная настройка

```html
<div id="map" style="height: 600px;"></div>
```

```js
const mapContainer = new MapContainer('main');
mapContainer.init(25.1846, 55.2645, 12, 'map', {
  withControls: true
});

// Добавить ТС
mapContainer.addMarker({
  id: 'v1',
  lat: 25.18,
  lon: 55.26,
  icon: 'truck.png',
  tooltip: { msg: 'Грузовик 1' }
});

// Добавить историю
mapContainer.addHistoryTrack(trackData, { id: 't1' });
```

---

## Устранение неисправностей

| Проблема | Решение |
|--------|--------|
| Карта не загружается | Проверьте ID `div` |
| Плагины не работают | Убедитесь, что подключены плагины Leaflet |
| Трафик не отображается | Проверьте API-ключи / CORS |
| Координаты не копируются | Разрешите доступ к буферу обмена |
| Геозоны исчезают | Увеличьте `MIN_VISIBLE_SIZE_PIXELS` |

---

## Зависимости

- Leaflet.js
- Плагины Leaflet:
    - `leaflet.polylineMeasure`
    - `leaflet.browser.print`
    - `leaflet.streetview`
    - `leaflet-editable`
    - `leaflet-corridor`
    - `leaflet-heatmap`

---

**Создано для производительности, масштабируемости и мониторинга в реальном времени.**


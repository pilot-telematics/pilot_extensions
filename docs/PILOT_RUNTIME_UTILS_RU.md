# Runtime-объекты и утилиты PILOT для расширений

Этот документ описывает, чем может пользоваться расширение внутри уже загруженного PILOT.

Важно: сторонние разработчики работают с runtime скомпилированного PILOT app.js, а не с локальными исходными файлами PILOT. Расширение может использовать глобальные объекты, классы и функции, которые уже доступны в этом runtime.

## Главный Принцип

Расширение должно относиться к PILOT как к host platform:

- PILOT предоставляет оболочку, Ext JS, карты, деревья, header, переводы и часть utility-классов.
- Расширение поставляет свои `Module.js`, JS/CSS/assets и при необходимости внешний backend.
- Классы расширения должны жить в namespace `Store.<extension>.*`, где `<extension>` - точное безопасное lowercase `snake_case` имя расширения из панели Администратора PILOT, например `weather_demo`.
- Не используйте дефисы в имени расширения в PILOT. PILOT создает `Store.<extension>.Module` из этого имени.
- Не нужно требовать локальные исходные файлы PILOT.
- Не следует зависеть от внутренних business-классов основного приложения, если они не описаны как runtime API.

## Что Обычно Доступно В Runtime

### Глобальные Контейнеры

- `window.skeleton` - главный контейнер UI.
- `window.skeleton.header` - верхний header.
- `window.skeleton.navigation` - левая навигация.
- `window.skeleton.mapframe` - основной контейнер карт/панелей в примерах расширений.
- `window.skeleton.map_frame` - альтернативное имя того же смыслового места в некоторых описаниях runtime.

Для совместимости:

```js
function getMainFrame() {
    return (window.skeleton && (skeleton.mapframe || skeleton.map_frame)) || null;
}
```

### Header

Известные элементы:

- `skeleton.header.news_btn`
- `skeleton.header.balance`
- `skeleton.header.all_btn`
- `skeleton.header.fail_btn`
- `skeleton.header.act_btn`
- `skeleton.header.park_btn`
- `skeleton.header.idle_btn`
- `skeleton.header.menu_btn`
- `skeleton.header.alerts`

Расширение может аккуратно добавлять свои кнопки или пункты меню:

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

Не удаляйте и не заменяйте штатные элементы header.

Для custom header buttons добавляйте класс расширения с заметным фоном. Белый текст или иконки на светло-сером header PILOT плохо читаются.

```js
skeleton.header.insert(5, {
    xtype: 'button',
    cls: 'header_tool my_extension-header-btn',
    iconCls: 'fa fa-bolt',
    tooltip: l('My Extension'),
    handler: this.openWindow,
    scope: this
});
```

```css
.my_extension-header-btn {
    background: #2563eb !important;
    border-color: #1d4ed8 !important;
}

.my_extension-header-btn .x-btn-inner,
.my_extension-header-btn .x-btn-icon-el {
    color: #ffffff !important;
}
```

### Navigation

Известные разделы:

- `skeleton.navigation.online`
- `skeleton.navigation.online.online_tree`
- `skeleton.navigation.history`
- `skeleton.navigation.history.objects`
- `skeleton.navigation.reports`
- `skeleton.navigation.reports.objects`
- `skeleton.navigation.reports.reports_store`

Расширение может:

- добавить свою вкладку в `skeleton.navigation`;
- добавить дочернюю панель в существующий раздел, если это соответствует задаче;
- читать selection/record из существующих деревьев;
- добавлять пункты в существующие context menu.

Расширение не должно:

- удалять штатные вкладки;
- заменять Online/History/Reports;
- пересоздавать штатные деревья;
- очищать существующие меню.

## Связь Navigation И Main Frame

В PILOT часто используется связь:

```js
navTab.map_frame = mainPanel;
```

Это не то же самое, что `skeleton.mapframe`.

- `skeleton.mapframe` - host-контейнер основной рабочей области.
- `navTab.map_frame` - ссылка компонента навигации на его основную панель.

Пример для расширения:

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

## Context Menu Online

Дерево Online:

```js
var tree = skeleton.navigation.online.online_tree;
```

Context menu может называться по-разному:

```js
var menu = tree.contextmenu || tree.context_menu;
```

Добавление пункта:

```js
menu.add({
    text: l('My Action'),
    iconCls: 'fa fa-bolt',
    handler: onAction,
    scope: tree
});
```

`scope: tree` полезен, если handler должен получить текущую запись:

```js
function onAction() {
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

## Карты

Обычно доступны:

- `window.mapContainer` - карта Online.
- `window.historyMapContainer` - карта History.
- `window.getActiveTabMapContainer()` - helper для активной карты, если есть в текущей сборке.

Получить Online/active map:

```js
function getPilotMap() {
    if (window.getActiveTabMapContainer) {
        return getActiveTabMapContainer();
    }

    return window.mapContainer || null;
}
```

Получить History map:

```js
function getHistoryMap() {
    return window.historyMapContainer || null;
}
```

Маркер:

```js
map.addMarker({
    id: 'my_marker',
    lat: lat,
    lon: lon,
    hint: Ext.String.htmlEncode(name)
});
```

Центрирование:

```js
if (map.setMapCenter) {
    map.setMapCenter(lat, lon);
}

if (map.setMapZoom) {
    map.setMapZoom(14);
}
```

Перед новой отрисовкой удаляйте следы работы своего расширения:

```js
function cleanupMap(markerIds) {
    var map = getPilotMap();

    if (!map) {
        return;
    }

    if (map.removePilyline) {
        map.removePilyline();
    } else if (map.removePolyline) {
        map.removePolyline();
    }

    Ext.Array.forEach(markerIds || [], function (id) {
        var marker = map.getMarker && map.getMarker(id);

        if (marker && map.removeMarker) {
            map.removeMarker(marker);
        }
    });
}
```

Подробности по карте см. в [MapContainer_RU.md](MapContainer_RU.md).

## Runtime-Функции И Глобальные Данные

Часто полезны:

- `l('Text')` - перевод строки.
- `base_url` - базовый URL текущего PILOT, не base URL хостинга расширения.
- `global_conf` - глобальная конфигурация текущей установки.
- `language` - текущий язык, если доступен в сборке.
- `lang` - словарь переводов, если доступен в сборке.
- `Ext.Msg.alert(...)` - стандартные сообщения.
- `Ext.Ajax.request(...)` - AJAX.
- `Ext.window.Window` - модальные окна.
- `Highcharts` - графики, если доступны в текущей сборке.
- `Highcharts.seriesTypes.sunburst` - sunburst-графики, если модуль загружен.
- `jQuery` / `$` - jQuery, если доступен в текущей сборке.
- `window.uom` / `UOM` - единицы измерения текущего пользователя.

Справочник runtime перечисляет доступные объекты и функции. Само наличие значения не делает его стабильным API. Перед использованием данных аккаунта, роли, модулей или авторизации прочитайте [справочник совместимости API](PILOT_API_COMPATIBILITY_RU.md).

Используйте проверки наличия для version-sensitive объектов:

```js
if (typeof base_url !== 'undefined') {
    // safe to build relative PILOT URL
}
```

## API настроек расширения

`Pilot.Extensions.getSettings(name, scope)` возвращает настройки расширения, доступного текущему аккаунту. Метод доступен в сборках PILOT, в которых есть класс `Pilot.Extensions`.

```js
const settings = await Pilot.Extensions.getSettings('myapp');
console.log(settings.apiBaseUrl);
```

По умолчанию используется область `effective`. PILOT объединяет глобальные настройки с настройками текущего аккаунта. Значение аккаунта заменяет глобальное значение с тем же ключом. Область `account` возвращает только настройки текущего аккаунта. Область `global` возвращает только глобальные настройки.

```js
const globalSettings = await Pilot.Extensions.getSettings('myapp', 'global');
const accountSettings = await Pilot.Extensions.getSettings('myapp', 'account');
```

Метод возвращает `Promise<Object>`. Если в выбранной области нет настроек, метод возвращает пустой объект. Сервер определяет аккаунт по текущей авторизованной сессии PILOT и проверяет доступ к расширению. Метод не принимает ID аккаунта.

Promise отклоняется, если сессия не авторизована, аккаунт не имеет доступа к расширению или параметры запроса некорректны. Не храните в настройках, возвращаемых в браузер, пароли, приватные ключи и другие секреты. Пользователи могут просмотреть эти значения в браузере.

Уровень поддержки и правила доступа описаны в [справочнике совместимости API](PILOT_API_COMPATIBILITY_RU.md).

## Прокси store для расширения

Панель Администратора PILOT хранит внешний базовый URL расширения, например `https://somehost.com/blabla/`. В runtime PILOT проксирует этот URL внутри текущего домена PILOT:

```text
/store/myapp/Module.js       -> https://somehost.com/blabla/Module.js
/store/myapp/doc/index.html  -> https://somehost.com/blabla/doc/index.html
/store/myapp/backend/        -> https://somehost.com/blabla/backend/
```

Используйте root-relative URLs `/store/<extension>/...` для assets, docs, JSON и конечных точек backend расширения, когда нужны same-origin CORS-compatible запросы.

```js
var extensionSlug = 'myapp';
var extensionBase = '/store/' + extensionSlug + '/';

Ext.Ajax.request({
    url: extensionBase + 'backend/status.php',
    success: function (response) {
        var data = Ext.decode(response.responseText);
    }
});
```

Для переносимой загрузки ресурсов текущего `Module.js` можно также вычислять директорию текущего script. В PILOT это обычно будет `/store/<extension>/`.

## Сторонние Библиотеки, Загружаемые PILOT

PILOT обычно уже загружает ряд сторонних библиотек. Расширение может использовать их без повторной загрузки, если они есть в текущем runtime.

### Highcharts

Используйте для графиков, dashboard-панелей, аналитики и визуализаций.

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

Если доступен модуль sunburst:

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

jQuery доступен как `window.jQuery` и часто как `$`.

```js
var jq = window.jQuery || window.$;

if (jq) {
    jq('.my-extension-placeholder').html(Ext.String.htmlEncode(value));
}
```

Используйте jQuery точечно. Для Ext JS UI не заменяйте компоненты через jQuery: это может сломать lifecycle и layout.

## Units Of Measure

PILOT runtime содержит систему единиц измерения `UOM` и обычно глобальный экземпляр `window.uom`.

Назначение:

- конвертация базовых значений в настройки текущего аккаунта;
- форматирование скорости, пробега, объема, веса и расхода;
- вывод локализованного суффикса единицы через `l(...)`;
- единый формат чисел через `num(...)`.

### Конфигурация `UOM`

```js
var localUom = new UOM({
    uom_l: 'km',       // distance: km или mi
    uom_w: 'kg',       // weight: kg, ton, lb
    uom_v: 'm³',       // amount/capacity: m³ или ft³
    uom_f: 'l',        // fuel volume: l, gal, i_gal
    uom_c: 'l/100km'   // consumption
}, 2);
```

В расширении чаще всего нужно использовать уже настроенный глобальный экземпляр:

```js
if (window.uom) {
    var speedText = uom.speedStrSuff(90);
}
```

### Основные Методы `uom`

| Метод | Назначение |
|---|---|
| `uom.speed(value)` | скорость без суффикса |
| `uom.speedStr(value)` | скорость строкой |
| `uom.speedStrSuff(value)` | скорость с единицей |
| `uom.mil(value)` | расстояние/пробег |
| `uom.milStr(value, dec)` | расстояние строкой |
| `uom.milStrSuff(value, dec)` | расстояние с единицей |
| `uom.vol(value)` | объем топлива |
| `uom.volStrSuff(value, dec)` | объем топлива с единицей |
| `uom.cons(value)` | расход |
| `uom.consStrSuff(value, dec)` | расход с единицей |
| `uom.amount(value)` | объем/емкость |
| `uom.amountStrSuff(value)` | объем/емкость с единицей |
| `uom.weight(value)` | вес |
| `uom.weightStrSuff(value)` | вес с единицей |

### Глобальные Helper-Функции Единиц

| Функция | Назначение |
|---|---|
| `speed(val)` | скорость числом с учетом `uom` |
| `speedS(val)` | скорость строкой без суффикса |
| `speedSS(val)` | скорость с суффиксом |
| `mileage(val)` | пробег/расстояние |
| `mileageS(val, dec)` | пробег строкой |
| `mileageSS(val, dec)` | пробег с суффиксом |
| `volume(val)` | объем топлива |
| `volumeSS(val, dec)` | объем топлива с суффиксом |
| `cons(val)` | расход |
| `consSS(val, dec)` | расход с суффиксом |
| `amount(val)` | объем/емкость |
| `amountSS(val)` | объем/емкость с суффиксом |
| `weig(val)` | вес |
| `weigSS(val)` | вес с суффиксом |
| `moneySS(val)` | сумма с prefix/suffix из `global_conf.balance` |
| `defUnitD()` | текущая единица расстояния |
| `defUnitS()` | текущая единица скорости |
| `defUnitV()` | текущая единица объема топлива |
| `defUnitW()` | текущая единица веса |
| `defUnitA()` | текущая единица объема/емкости |
| `defUnitC()` | текущая единица расхода |

Пример в grid column:

```js
Ext.create('Ext.grid.Panel', {
    columns: [{
        text: l('Speed'),
        dataIndex: 'speed',
        renderer: function (value) {
            return typeof speedSS === 'function' ? speedSS(value) : value;
        }
    }]
});
```

Правило: исходные значения обычно должны быть в базовых единицах PILOT, а `uom` конвертирует их в настройки пользователя.

## Рендереры Данных

PILOT runtime содержит набор глобальных renderer/helper-функций для форматирования данных в таблицах, отчетах и панелях.

### Дата И Время

| Функция | Назначение |
|---|---|
| `dateTimeStr(ts)` | `HH:mm DD.MM.YYYY` из Unix timestamp в секундах |
| `timeDateStr(ts)` | `DD.MM.YYYY HH:mm` |
| `dateTimeStrF(ts)` | `HH:mm:ss DD.MM.YYYY` |
| `timeStr(ts)` | `HH:mm` |
| `timeStrF(ts)` | `HH:mm:ss` |
| `dateStr(ts)` | `YYYY.MM.DD` |
| `dateStrR(ts)` | `DD.MM.YYYY` |
| `secondsToHms(seconds)` | `HH:mm:ss` |
| `secondsToHumanTime(seconds)` | человекочитаемая длительность |
| `secondsToHumanDays(seconds)` | длительность в годах/месяцах/днях |
| `timeAgo(ts)` | относительное время с `ago` |

```js
Ext.create('Ext.grid.Panel', {
    columns: [{
        text: l('Last message'),
        dataIndex: 'ts',
        renderer: function (value) {
            return typeof dateTimeStr === 'function' ? dateTimeStr(value) : value;
        }
    }]
});
```

### Числа И Индикаторы

| Функция | Назначение |
|---|---|
| `num(value, dec)` | формат числа с учетом языка/настроек |
| `num6(value)` | число с 6 знаками |
| `int(value)` | целое число |
| `valuePercent(value)` | процент |
| `dinamic(value)` | HTML-индикатор динамики |
| `rank(value)` | HTML-индикатор ранга |
| `rag(value)` | red/amber/green HTML-индикатор |
| `rag_perc(value)` | процентная RAG-полоска |

Если renderer возвращает HTML, не подставляйте туда непроверенный пользовательский текст без `Ext.String.htmlEncode`.

### Адреса, Координаты И Геозоны

| Функция | Назначение |
|---|---|
| `makeCoordinates(address)` | строка координат из `{lat, lon}` |
| `getLatLon(address)` | строка `lat lon` |
| `makeGeoZone(address)` | геозона по координатам, может вернуть placeholder span |
| `makeAddress(address, queue, bulk)` | адрес по координатам, может вернуть placeholder span и заполнить позже |
| `makeAddressLink(address)` | ссылка на Google Maps с адресом |
| `decodeAddress(address)` | форматирование уже полученного address object |

`makeAddress(...)` и `makeGeoZone(...)` могут работать асинхронно и возвращать временный `<span>`, который потом заполняется runtime-логикой и jQuery.

```js
Ext.create('Ext.grid.Panel', {
    columns: [{
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
    }]
});
```

### События И Медиа

| Функция | Назначение |
|---|---|
| `lastEventRenderer(last_event)` | человекочитаемый статус последнего события |
| `getCommandStatusText(status)` | текст статуса команды |
| `footage(value)` | ссылка на preview footage |
| `cmsFootage(value)` | ссылки на CMS image/video |
| `copyFormattedText(text)` | копирование текста в clipboard |

Используйте media-renderers только если payload соответствует ожидаемому формату. Для внешних данных сначала нормализуйте структуру.

## Доступные `Pilot.utils.*`

PILOT предоставляет полезные Ext JS host-классы в namespace `Pilot.utils.*`. Расширения могут использовать эти классы, если они уже загружены в runtime целевой версии PILOT. Не копируйте исходники этих классов в расширении; создавайте их как runtime-классы.

Полезные классы:

| Класс / xtype | Назначение | Примечания |
|---|---|---|
| `Pilot.utils.LeftBarPanel` / `pilot-leftbarpanel` | Нативно выглядящая левая панель навигации с вертикальными вкладками и кнопкой сворачивания. | Хороший вариант по умолчанию для вкладок расширения. |
| `Pilot.utils.Toggle` / `toggle` | Checkbox, отображаемый как переключатель. | Удобно для boolean-настроек. |
| `Pilot.utils.ColorField` / `pilotcolorfield` | HTML color input, который может отправлять значение как `rrggbb`. | Для простых цветовых настроек. |
| `Pilot.utils.ColorComboBox` / `colorcombobox` | ComboBox на основе палитры цветов PILOT. | Поддерживает группы палитры `light`, `medium`, `dark`, `status`, если они есть в runtime. |
| `Pilot.utils.DateTimeField` / `datetimefield` | Поле даты и времени с PILOT date-time picker. | Удобно для фильтров и отчетов. |
| `Pilot.utils.IntegerField` / `intfield` | NumberField, который отправляет integer. | Для счетчиков, лимитов, интервалов. |
| `Pilot.utils.SearchField` / `pilot-utils-search-field` | Поле поиска с кнопкой очистки и стилем PILOT. | Универсальный search input. |
| `Pilot.utils.TreeSearchField` / `pilot-utils-tree-search-field` | Поле поиска, связанное с поведением поиска по деревьям PILOT. | Используйте с совместимыми деревьями PILOT. |
| `Pilot.utils.TreeFilterByNameField` / `pilot-utils-tree-filter-by-name-field` | Фильтрует store родительского treepanel по `name` или заданному свойству. | Удобно для деревьев, созданных расширением. |
| `Pilot.utils.TreeList` / `pilot-tree-list` | Навигация tree-list со встроенной tab panel. | Для инструментов с несколькими разделами. |
| `Pilot.utils.TabBarEditor` / `pilot-tabbareditor` | Вертикальный tab editor layout. | Для экранов настроек и редактирования. |
| `Pilot.utils.MapContainer` / `leaflet-map` | Ext panel wrapper, который создает Leaflet `MapContainer`. | Если задача работает с картой Online, обычно лучше использовать существующий `mapContainer`. |
| `Pilot.utils.Geofence` / `pilotgeozone` | Модальное окно редактирования полигона на Leaflet. | Для JSON-полей геозон. |
| `Pilot.utils.SearchAddressField` / `pilot-search-address-field` | Окно поиска адреса, которое может заполнить связанное поле и координаты. | Зависит от geocoder-конфигурации host-приложения. |
| `Pilot.utils.FilesList` / `pilotfilespanel` | Grid для встроенных файловых записей PILOT. | Используйте только если функция работает с файлами объектов/водителей PILOT. |
| `Pilot.utils.FileDownloader` | Singleton-helper для скачивания файла по URL. | Вызов: `Pilot.utils.FileDownloader.getFile(url)`. |
| `Pilot.utils.BadgeButton` / `badgebutton` | Button с badge-счетчиком. | После render можно вызвать `setBadgeText(...)`. |
| `Pilot.utils.BadgeMenuItem` / `badgemenuitem` | Menu item с badge-счетчиком. | Подходит для счетчиков в меню. |
| `Pilot.utils.JsonUploadField` / `jsonUploadField` | FileField, стилизованный для загрузки JSON. | Для экранов импорта конфигурации. |
| `Pilot.utils.Help` / `pilothelp` | Простое модальное окно помощи. | Передавайте HTML-текст или ключ локализации. |
| `Pilot.utils.IconSelector` | Окно выбора иконки. | Если пользователь должен выбирать иконку маркера/меню. |
| `Pilot.utils.CarModels` / `pilotcarmodels` | Выбор марки/модели автомобиля. | Для workflow настройки транспорта. |
| `Pilot.utils.RouteMeter` / `pilot-routemeter` | Кнопка измерения маршрута на карте. | Host-specific map tool; проверяйте runtime. |
| `Pilot.utils.NearestVehicle` / `pilot-nearestveh` | Кнопка/инструмент поиска ближайшего объекта. | Host-specific; проверяйте runtime и соответствие задаче. |
| `Pilot.utils.Media`, `Pilot.utils.FootageViewer`, `Pilot.utils.SensorsTracing` | Встроенные окна media и sensor workflow. | Используйте только для интеграций с native PILOT media/sensor data. |

Правило:

- можно использовать `Pilot.utils.*`, если класс есть в runtime нужной версии PILOT и подходит под бизнес-задачу;
- для необязательных utilities проверяйте `Ext.ClassManager.get(...)`, если расширение должно работать в нескольких сборках PILOT;
- бизнес-классы самого расширения держите в namespace `Store.<extension>.*`;
- для критичных мест лучше иметь простой fallback, если доступность utility не гарантирована.

Пример fallback для левой вкладки:

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

## Что Не Является Публичным Контрактом

Не полагайтесь на:

- локальные исходные файлы PILOT;
- локальные пути разработки;
- внутренние классы конкретных встроенных модулей;
- глобальные переменные, созданные разовой внутренней реализацией, а не платформой;
- файлы, которые не доступны вашему расширению по URL;
- side effects от внутренних модулей, если они не описаны как runtime API.

## Optional Host Hooks

В некоторых сборках PILOT доступны host hooks, которые используют встроенные модули, например `MODULE_OVERRIDER`. Расширения могут использовать такие hooks только для advanced integrations и только с проверками:

```js
if (window.MODULE_OVERRIDER && MODULE_OVERRIDER.append) {
    MODULE_OVERRIDER.append('Pilot.view.online.VehicleEditor', function (win) {
        // Добавляйте интерфейс расширения только после проверки методов host-окна.
    });
}
```

Если hook отсутствует, расширение всё равно должно загрузиться без поломки PILOT и должно описать недоступную advanced integration в `doc/index.html`.

## Правило Для AI

AI должен создавать расширение так, будто у него есть только:

- этот репозиторий;
- публичные примеры расширений;
- runtime-объекты скомпилированного PILOT;
- бизнес-идея пользователя.

AI не должен ссылаться на локальные пути к исходникам PILOT или требовать доступ к исходным файлам PILOT.

Коротко:

```text
PILOT app.js предоставляет runtime-объекты.
Расширение содержит собственный код и backend.
```

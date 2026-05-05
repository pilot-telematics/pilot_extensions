# Руководство Разработчика PILOT Extensions

Это практическое руководство для людей, которые делают расширения PILOT вручную или проверяют код, созданный AI.

## 1. Что Такое Расширение PILOT

Расширение PILOT - это не отдельный сайт и не standalone SPA. Это набор файлов, который загружается внутрь уже работающего PILOT UI.

PILOT уже предоставляет:

- Ext JS runtime;
- глобальный контейнер `window.skeleton`;
- существующие вкладки Online, History, Reports;
- существующие карты Online и History;
- утилиты PILOT вроде `l(...)`, `Pilot.utils.LeftBarPanel`, `MapContainer`;
- уже загруженные библиотеки вроде Highcharts, Highcharts sunburst и jQuery;
- единицы измерения `window.uom` / `UOM`;
- renderer/helper-функции для дат, чисел, адресов и статусов;
- доступ к API PILOT.

Расширение добавляет свою функциональность в эту оболочку.

## 1.1 Чем Extensions Отличаются От Встроенного Кода PILOT

Extensions работают внутри уже загруженного и скомпилированного PILOT app.js. Поэтому они могут обращаться к runtime-объектам и утилитам PILOT, включая полезные host-классы `Pilot.utils.*`.

Главные отличия:

| Встроенный код PILOT | PILOT Extension |
|---|---|
| Компилируется и поставляется в составе PILOT | Хостится отдельно и подключается по URL `Module.js` |
| Компилируется вместе с основным приложением PILOT | Хостится отдельно и загружается через URL `Module.js` |
| Может быть частью основного backend PILOT | Может иметь сторонний backend: Cloudflare Worker, VPS, PHP, отдельный API |
| Создает runtime-объекты и utilities | Использует только то, что уже доступно в загруженном app.js |

Практический вывод: Extension должен рассматривать PILOT как host platform. Можно пользоваться `skeleton`, существующими деревьями, картами, `l(...)`, Ext JS и доступными `Pilot.utils.*`, но бизнес-классы расширения нужно держать в `Store.<extension>.*`.

Подробнее см. [PILOT_RUNTIME_UTILS_RU.md](PILOT_RUNTIME_UTILS_RU.md).

## 2. Минимальная Структура

```text
my-extension/
├── Module.js
└── doc/
    └── index.html
```

`Module.js` - единственная runtime-точка входа.

`doc/index.html` - статическая документация расширения. В ней не должно быть `<script>` и логики запуска.

Дополнительно можно добавить:

```text
style.css
config.json
backend/
```

## 3. Базовый `Module.js`

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

Главная идея: левая вкладка и основная панель создаются отдельно, а потом связываются через `map_frame`.

## 4. Runtime PILOT

### Header

`window.skeleton.header` - верхняя панель PILOT.

Известные элементы:

- `skeleton.header.news_btn` - кнопка новостей;
- `skeleton.header.balance` - баланс договора;
- `skeleton.header.all_btn` - количество объектов;
- `skeleton.header.fail_btn` - объекты с проблемами;
- `skeleton.header.act_btn` - активные объекты;
- `skeleton.header.park_btn` - объекты на парковке;
- `skeleton.header.idle_btn` - idle-объекты;
- `skeleton.header.menu_btn` - меню справа сверху;
- `skeleton.header.alerts` - окно оповещений.

Добавляйте свои элементы аккуратно:

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

Не удаляйте и не заменяйте штатные элементы header.

### Navigation

`window.skeleton.navigation` - левая панель вкладок.

Известные разделы:

- `skeleton.navigation.online`
- `skeleton.navigation.online.online_tree`
- `skeleton.navigation.history`
- `skeleton.navigation.history.objects`
- `skeleton.navigation.reports`
- `skeleton.navigation.reports.objects`
- `skeleton.navigation.reports.reports_store`

### Main Content / Map Frame

В примерах репозитория используется:

```js
skeleton.mapframe.add(mainPanel);
```

В некоторых описаниях runtime тот же смысловой контейнер называется:

```js
skeleton.map_frame
```

Если вы пишете код для неизвестной сборки, можно сделать helper:

```js
getMainFrame: function () {
    return skeleton.mapframe || skeleton.map_frame;
}
```

Но для совместимости с текущими примерами используйте `skeleton.mapframe`.

## 5. Как Выбрать Архитектурный Паттерн

### Своя вкладка и своя рабочая область

Используйте, если расширение является самостоятельным рабочим модулем: dashboard, справочник, аналитика, редактор, отчетный инструмент.

Создайте:

- вкладку в `skeleton.navigation`;
- основную панель в `skeleton.mapframe`;
- связь `navTab.map_frame = mainPanel`.

Примеры:

- `examples/hello-world`
- `examples/template-app`
- `examples/communal`

### Только пункт контекстного меню

Используйте, если действие начинается из существующего объекта PILOT: машина в Online, объект в History, отчет и т.п.

Пример:

- `examples/nearby-poi`

Шаблон:

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

`scope: tree` удобен, потому что внутри handler доступна текущая запись:

```js
var record = this.record;
var lat = record.get('lat');
var lon = record.get('lon');
```

### Работа с существующей картой

Если задача относится к текущей карте Online, не создавайте новую карту.

```js
var map = window.getActiveTabMapContainer ?
    getActiveTabMapContainer() :
    window.mapContainer;
```

Для History:

```js
var map = window.historyMapContainer;
```

### Собственная карта

Создавайте `new MapContainer(...)` только если расширению действительно нужна отдельная карта.

Пример:

- `examples/airports/Map.js`

## 6. Работа С Картой

Online-карта:

```js
window.mapContainer
```

History-карта:

```js
window.historyMapContainer
```

Активная карта:

```js
window.getActiveTabMapContainer && getActiveTabMapContainer()
```

Маркеры обычно используют `lat` и `lon`:

```js
map.addMarker({
    id: 'my_marker',
    lat: 25.2208,
    lon: 55.3534,
    hint: 'Point'
});
```

Центрирование:

```js
if (map.setMapCenter) {
    map.setMapCenter(lat, lon);
}
```

Масштаб:

```js
if (map.setMapZoom) {
    map.setMapZoom(14);
}
```

Подробно см. [MapContainer_RU.md](MapContainer_RU.md).

## 7. Работа С Данными PILOT

Если вы показываете транспортные средства, не используйте статический массив.

Базовый источник:

```js
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: {
        vehs: 1,
        state: 1
    },
    success: function (response) {
        var data = Ext.decode(response.responseText);
        // data - иерархия групп, машины лежат внутри children.
    }
});
```

Важная деталь: ответ иерархический. Нужно рекурсивно пройти `children`.

## 8. Локализация

Используйте `l('Text')` для строк интерфейса:

```js
title: l('My Extension')
```

Для больших модулей можно загрузить `lang/lang.json` и добавить переводы в глобальный `lang`, как это сделано в `examples/communal/Module.js`.

## 8.1 Единицы Измерения И Рендереры

Перед тем как писать собственные formatter-функции, проверьте runtime helpers PILOT:

- `window.uom` / `UOM` для единиц измерения;
- `speedSS`, `mileageSS`, `volumeSS`, `consSS`, `amountSS`, `weigSS` для значений с суффиксом;
- `num`, `int`, `valuePercent` для чисел;
- `dateTimeStr`, `timeDateStr`, `dateTimeStrF`, `secondsToHumanTime` для дат и длительностей;
- `makeAddress`, `makeAddressLink`, `makeGeoZone`, `makeCoordinates` для адресов и геозон.

Пример:

```js
{
    text: l('Mileage'),
    dataIndex: 'mileage',
    renderer: function (value) {
        return typeof mileageSS === 'function' ? mileageSS(value, 1) : value;
    }
}
```

Подробно см. [PILOT_RUNTIME_UTILS_RU.md](PILOT_RUNTIME_UTILS_RU.md).

## 8.2 Highcharts И jQuery

PILOT обычно уже загружает Highcharts, модуль sunburst и jQuery. Не подключайте их повторно в Extension.

Проверяйте наличие:

```js
if (window.Highcharts) {
    // build chart
}

if (window.Highcharts && Highcharts.seriesTypes && Highcharts.seriesTypes.sunburst) {
    // build sunburst chart
}

var jq = window.jQuery || window.$;
```

Для UI на Ext JS не заменяйте компоненты через jQuery. Используйте jQuery точечно, например для placeholder-HTML или совместимости с renderer-функциями.

## 9. CSS И Пути

Если расширение подключает CSS, делайте это из `Module.js`:

```js
var css = document.createElement('link');
css.setAttribute('rel', 'stylesheet');
css.setAttribute('type', 'text/css');
css.setAttribute('href', '/store/my-extension/style.css');
document.head.appendChild(css);
```

Для переносимых расширений лучше вычислять base URL от текущего `Module.js`, особенно при публикации на Cloudflare/GitHub Pages.

Если добавляете свои стили, для новых hex-цветов предпочтительно использовать палитру Tailwind CSS. Это помогает держать generated Extensions визуально согласованными и не плодить случайные цвета. Это рекомендация по палитре цветов; сам Tailwind CSS подключать не нужно, если это явно не требуется расширению.

## 10. Backend

Backend нужен, если:

- есть секреты/API keys, которые нельзя отдавать в браузер;
- нужна собственная БД;
- нужен CORS proxy;
- нужно хранить бизнес-данные расширения.

Сложный пример:

- `examples/communal/backend`

Развертывание backend см. в [../DEPLOY.md](../DEPLOY.md).

## 11. Проверка Перед Публикацией

Проверьте:

- `Module.js` открывается по прямому URL и отдает JavaScript, а не HTML-ошибку.
- `doc/index.html` открывается.
- CSS/JSON/backend URLs доступны.
- В консоли браузера нет ошибок загрузки классов Ext JS.
- Расширение не загружает Ext JS вручную.
- Вкладка имеет `title` и `iconCls`.
- Если есть основная панель, есть `navTab.map_frame = mainPanel`.
- Если добавляете context menu, старое меню не заменяется.
- Если работаете с картой, предыдущие маркеры/линии расширения можно очистить.

## 12. Как Проверять AI-Код

Сверяйте результат с [../AI_SPECS.md](../AI_SPECS.md).

Частые ошибки AI:

- делает standalone HTML/React app вместо PILOT extension;
- вызывает `Ext.onReady`;
- пишет глобальную `initModule`;
- добавляет `<script>` в `doc/index.html`;
- создает новую карту, хотя нужна существующая `mapContainer`;
- путает `skeleton.mapframe`, `skeleton.map_frame` и компонентное свойство `map_frame`;
- использует demo vehicles вместо `/ax/tree.php`;
- заменяет штатные меню/деревья вместо добавления своего пункта.
- использует необязательный host-класс без проверки, что он есть в runtime нужной версии PILOT.

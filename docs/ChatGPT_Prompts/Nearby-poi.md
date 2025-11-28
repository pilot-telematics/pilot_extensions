# Задача
На базе этого руководства https://github.com/pilot-telematics/pilot_extensions 
мне нужно написать расширение для системы PILOT формирующее следующую функциональность: 
1. В дереве объектов в разделе online при клике на машине в контекстное меню добавить пункт 'Поиск ближайшего POI' 
2. При вызове этого меню открыть модальное окно с выбором параметров : - Что ищем (текст) , Радиус в километрах 
3. После заполнения данных (например - шинмонтаж , 10) перемещаем центр карты на выбранную машину , отрисоваваем маркеры ближайших 5 POI с использованием иконки из
 https://github.com/pilot-telematics/pilot_extensions/blob/main/docs/MarkerIconApi.md 
 и маршруты движения к ним. 
 Для того чтобы внедрить пункт контекстного меню в initModule нужно создать пункт меню: 
```
skeleton.navigation.online.online_tree.contextmenu.add({ 
  text: l('Поиск ближайшего POI'), 
  iconCls: 'fa fa-bullseye-pointer', 
  handler: this.searchPOI, 
  scope: skeleton.navigation.online.online_tree });
 ```
scope здесь добавлен для того чтобы в функции searchPOI переменная this ссылалась на дерево объектов online и был доступ к record выбранной машины. 
Чтобы вытащить из нее данные. например 
```
this.record.get('lat');
this.record.get('lon');
 ```
Но можно иметь и прямой доступ через глобальную переменную: 
```
skeleton.navigation.online.online_tree.record.get('lat');
 skeleton.navigation.online.online_tree.record.get('lon');
  ```
Вот такие данные можно получить из record: 
```
{ "id": 1081, "name": "Velavu-00Q68", "typeid": 1, "ownerid": 192, "account_id": 1000, "agentid": 1081, "info": "Velavu Meridian Anchor (hardware: meridian, category: ANCHOR, site: np1X5IwTkJ)", "driver": "", "driver_phone": "", "card_num": "", "active": 1, "on": 1, "initial_mileage": 0, "lost_connection_time": 14400, "model": "", "year": "2020", "vin": "", "current_motohours": null, "global_partner_price_id": null, "port": null, "created_date": "2025-10-28T14:03:32.000Z", "uniqid": "00Q68", "configuration": "Unknown", "created_time": 1761660212, "iconCls": "car_icon", "typename": "Car", "leaf": true, "checked": true, "ag_tags": [], "group": "Velavu", "msg": "<div id=\"st_1081\">Parking 23 d 19 h 01 min</div>", "msg1": "12:27 27.11.2025", "vehid": 1081, "text": "", "video_camera_count": 0, "minsat": 0, "minspeed": 0, "maxspeed": 0, "mintime": 0, "minparking": 0, "orgid": 0, "task_id": 0, "current_mileage": 0, "len": 0, "maxhdop": 0, "geozone": "", "ts": 1764235670, "status": "Parking 23 d 19 h 01 min", "sat": "-", "security": "", "is_server_online": true, "server_ts": 1764235670, "type": 1, "dir": 0, "firing": 1, "lon": 55.3534, "lat": 25.2208, "equipment": 1, "hl": "4" } 
```

Дополнительную панель карты не надо добавлять. 
Мы будем использовать уже существующую и связанную с панелью навигации панель карты. 
Она доступна по глобальной ссылке 
```
mapContainer. var map = mapContainer;
 ```
либо получим карту функцией: 
``` 
var map = getActiveTabMapContainer();
```
Это экземпляр класса MapContainer 
Далее найдем на карте нашу машину (маркер): 
```
map.getMarker(this.record.get('id').toString());
 ```
Теперь у нас все есть для реализации новой функциональности.
Для того чтобы показать полилинию поездки между машиной и POI используем внешний ajax вызов:
```
base_url+'/osrm/route/v1/driving/55.3022,25.2089;55.35350,25.22847?geometries=polyline6&overview=full'
 ```
он вернет структуру согласно документации OSRM : 
```{ "code": "Ok", "waypoints": [ { "hint": "eeCLg37gi4MAAAAAFgAAAAAAAAA2AAAAAAAAAA3gdkEAAAAAZDQPQgAAAAAWAAAAAAAAADYAAAClkgAA99hLAzSpgAE42EsDRKiAAQAAnwQAAAAA", "distance": 32.82145237, "name": "", "location": [ 55.302391, 25.20914 ] }, { "hint": "18J4gf___38EAAAAEgAAAAoBAABrAAAAKoEeQXY77EEBZRJEm0RuQwQAAAASAAAACgEAAGsAAAClkgAAj6BMA5P0gAGcoEwDtvSAAR4A3wYAAAAA", "distance": 4.092481988, "name": "معبر الخليج التجاري", "location": [ 55.353487, 25.228435 ] } ], "routes": [ { "legs": [ { "steps": [], "weight": 498.3, "summary": "", "duration": 498.3, "distance": 7158.6 } ], "weight_name": "routability", "geometry": "grsao@mnknhBmAeHo@iB_A_BiAuAuAgA}Aw@eBe@qBEoBPiBh@aB|@cFWsAGWjBKjBAlB?rCOhCYfDeVcBcB?cBH_BX}Af@wAt@mAAgAnAy@vAo@~Ac@fBUjB{MyACgBg@_BeAgAyAc@_BBuAl@_AjAa@bBmRwBuEg@{Fe@oAaAyAu@}Ae@cBW_AiJss@yG}v@uIiEe@{j@oFmBWeBc@yA_AgAuAq@gBYqB@uBb@gDz@iBAgBjA_BAgAhNsOtVsZxi@un@nb@kk@ri@gt@bBaCvAkCnAqCbAyCl@sf@pc@yn@v^ql@l]_j@hyAytBnt@qkAda@{o@~j@yaAvFkJrEiKfDaLxBsLlA_M^gMQiM_AcMmBwLyCgLgEoKcEuH_F}GuFeGiGkF}GoEmHqDa_@{O_IiE{HsEuH}EoHgFmYeUcBiA{Ay@yAs@uMsFctA{pAiy@_u@efA_~@}RcQwJgIcfAy{@sS}RqRoSkWw[wU{]a@s@aR_]_NaYgNs]wLe^wOom@{[q}Acr@ohDmTkgAwBuJu^acBwG_XyHqWyIaWwJoVwK{UsLeUqMoTkNySkm@{{@ya@al@mh@ss@wDiF_U{ZiUa]gMsR{L_SkLiS_LuSqK_TwOuZeO_[ij@wnAqg@ohAq@u{@qRq_@kMiWgH{PsGiRmGcToF_VeEoV}CyVwBeWeAiW]oWPoW|@oWjByVzC_WvDsVx@yD", "weight": 498.3, "duration": 498.3, "distance": 7158.6 } ] } 
```
Тут есть все чтобы отобразить линию на карте вот таким образом: 
```
  var map = getActiveTabMapContainer();
  map.removePilyline();
  var points = map.decodeRoute(data.routes[0].geometry, 6).map(function (point) { return { lat: point.lat, lng: point.lng } });
  map.setPolylineBlue(points); 
  ```
На самих POI можно расположить хинты с расстоянием и описанием самой POI. 
При вызове функции предварительно удалить с карты следы предыдущей работы.

# Решение

Сделаем отдельное расширение, которое **ничего не рисует своего** (панелей и карт не добавляем), а просто “подвешивается” к существующему дереву online и карте.

Ниже – готовый минимум для примера приложения `nearby-poi`:

---

## Структура каталога

```text
examples/
  nearby-poi/
    Module.js
    doc/
      index.html
```

---

## `examples/nearby-poi/Module.js`

```javascript
/**
 * Расширение PILOT: поиск ближайших POI через Overpass API
 *
 * Функциональность:
 * 1. В дереве online при клике по машине добавляется пункт контекстного меню
 *    "Поиск ближайшего POI".
 * 2. При выборе пункта открывается окно с параметрами:
 *      - Что ищем (строка)
 *      - Радиус в километрах (число)
 * 3. После ввода параметров:
 *      - центр карты перемещается к выбранной машине
 *      - по Overpass API находятся ближайшие POI
 *      - на карту добавляются 5 ближайших POI с иконками MarkerIconApi
 *      - для каждого POI строится маршрут через локальный OSRM
 *
 * Используем:
 *  - уже существующее дерево объектов: skeleton.navigation.online.online_tree
 *  - уже существующую карту: getActiveTabMapContainer() / mapContainer
 *  - глобальный base_url для OSRM и иконок
 */

Ext.define('Store.nearby_poi.Module', {
    extend: 'Ext.Component',

    /**
     * Массив ID маркеров POI, добавленных на карту данным модулем.
     * Нужен для последующей очистки.
     *
     * Пример: ["poi_0", "poi_1", ...]
     */
    poiMarkerIds: null,

    /**
     * Инициализация модуля.
     * Вызывается системой PILOT при загрузке расширения.
     *
     * Здесь мы:
     *  - сохраняем ссылку на экземпляр модуля в глобальную переменную,
     *    чтобы к нему можно было обратиться из обработчика контекстного меню
     *  - добавляем пункт "Поиск ближайшего POI" в контекстное меню дерева online
     */
    initModule: function () {
        var me = this;

        // Инициализируем хранилище ID маркеров
        me.poiMarkerIds = [];

        // Сохраним ссылку на модуль в глобальную область,
        // чтобы к нему можно было обратиться из функции searchPOI,
        // в которой this будет ссылаться на online_tree.
        window.nearbyPoiModule = me;

        // Безопасно проверяем наличие дерева online
        if (!window.skeleton ||
            !skeleton.navigation ||
            !skeleton.navigation.online ||
            !skeleton.navigation.online.online_tree) {

            Ext.log('Nearby POI: online_tree не найден – модуль не инициализировался');
            return;
        }

        var tree = skeleton.navigation.online.online_tree;

        /**
         * Добавляем пункт в контекстное меню дерева online.
         *
         * ВАЖНО:
         *   scope: tree
         *   Чтобы внутри searchPOI переменная this указывала на дерево online,
         *   и был доступ к this.record (выбранная машина).
         */
        tree.contextmenu.add({
            text: l('Поиск ближайшего POI'),
            iconCls: 'fa fa-bullseye-pointer',
            handler: me.searchPOI,                 // сама функция лежит в модуле
            scope: tree                            // но this внутри неё = online_tree
        });
    },

    /**
     * Обработчик пункта контекстного меню "Поиск ближайшего POI".
     *
     * ВНИМАНИЕ:
     *   Здесь this = skeleton.navigation.online.online_tree (см. scope выше).
     *
     * Для доступа к методам модуля используем глобальную ссылку
     * window.nearbyPoiModule, созданную в initModule().
     */
    searchPOI: function () {
        var tree = this; // online_tree
        var module = window.nearbyPoiModule;

        if (!module) {
            Ext.Msg.alert('POI', 'Модуль Nearby POI не инициализирован');
            return;
        }

        // В online_tree текущий выбранный объект доступен как this.record
        if (!tree.record) {
            Ext.Msg.alert('POI', 'Не выбрано транспортное средство в дереве');
            return;
        }

        var rec = tree.record;

        var lat = rec.get('lat');
        var lon = rec.get('lon');

        if (!lat || !lon) {
            Ext.Msg.alert('POI', 'Для выбранного объекта нет координат (lat/lon)');
            return;
        }

        // Открываем окно с параметрами поиска
        module.showSearchWindow(rec, lat, lon);
    },

    /**
     * Показ модального окна с параметрами:
     *  - текст запроса (что ищем)
     *  - радиус в километрах
     */
    showSearchWindow: function (record, lat, lon) {
        var me = this;

        // Форма параметров поиска
        var form = Ext.create('Ext.form.Panel', {
            bodyPadding: 10,
            border: false,
            defaults: {
                anchor: '100%',
                labelWidth: 120
            },
            items: [{
                xtype: 'textfield',
                name: 'query',
                fieldLabel: 'Что ищем',
                allowBlank: false,
                emptyText: 'Например: шиномонтаж'
            }, {
                xtype: 'numberfield',
                name: 'radius',
                fieldLabel: 'Радиус, км',
                allowBlank: false,
                minValue: 1,
                maxValue: 100,
                value: 10
            }]
        });

        var win = Ext.create('Ext.window.Window', {
            title: 'Поиск ближайшего POI',
            modal: true,
            width: 400,
            layout: 'fit',
            items: [form],
            buttons: [{
                text: 'Искать',
                handler: function () {
                    if (!form.getForm().isValid()) {
                        return;
                    }

                    var values = form.getValues();
                    var query = values.query;
                    var radiusKm = parseFloat(values.radius);

                    win.close();

                    // Запускаем поиск POI
                    me.findPOI(record, lat, lon, query, radiusKm);
                }
            }, {
                text: 'Отмена',
                handler: function () {
                    win.close();
                }
            }]
        });

        win.show();
    },

    /**
     * Запрос к Overpass API для поиска POI вокруг заданной точки.
     *
     * @param {Ext.data.Model} record  – запись объекта (ТС)
     * @param {Number} vehLat          – широта ТС
     * @param {Number} vehLon          – долгота ТС
     * @param {String} query           – текст, который ищем (по имени POI)
     * @param {Number} radiusKm        – радиус в километрах
     */
    findPOI: function (record, vehLat, vehLon, query, radiusKm) {
        var me = this;

        // Очистим карту от предыдущих результатов
        me.cleanupMap();

        radiusKm = radiusKm || 10;
        var radiusMeters = radiusKm * 1000;

        // Небольшая защита от мусора
        if (radiusMeters <= 0) {
            radiusMeters = 1000;
        }

        // Экран загрузки
        Ext.getBody().mask('Поиск POI через Overpass API...');

        // Overpass API endpoint (можно поменять на свой, если нужно)
        var overpassUrl = 'https://overpass-api.de/api/interpreter';

        // Экранируем кавычки в запросе
        var safeQuery = (query || '').replace(/"/g, '\\"');

        /**
         * Overpass запрос:
         *  - ищем узлы/дороги/отношения с тегом name ~= <query> (регистронезависимо)
         *  - в радиусе around:<radiusMeters>,<vehLat>,<vehLon>
         *  - out center: для way/relation возвращается "center" с lat/lon
         */
        var overpassData =
            '[out:json][timeout:25];' +
            '(' +
                'node(around:' + radiusMeters + ',' + vehLat + ',' + vehLon + ')[name~"' + safeQuery + '",i];' +
                'way(around:' + radiusMeters + ',' + vehLat + ',' + vehLon + ')[name~"' + safeQuery + '",i];' +
                'relation(around:' + radiusMeters + ',' + vehLat + ',' + vehLon + ')[name~"' + safeQuery + '",i];' +
            ');' +
            'out center;';

        Ext.Ajax.request({
            url: overpassUrl,
            method: 'POST',
            // Overpass ожидает параметр "data" с текстом запроса
            params: {
                data: overpassData
            },
            success: function (response) {
                Ext.getBody().unmask();

                var json;
                try {
                    json = Ext.decode(response.responseText);
                } catch (e) {
                    Ext.Msg.alert('POI', 'Ошибка разбора ответа Overpass API');
                    return;
                }

                if (!json.elements || !json.elements.length) {
                    Ext.Msg.alert('POI', 'POI не найдены в заданном радиусе');
                    return;
                }

                // Преобразуем элементы Overpass в список POI c расстоянием до ТС
                var poiList = me.preparePoiList(json.elements, vehLat, vehLon);

                if (!poiList.length) {
                    Ext.Msg.alert('POI', 'Не удалось сформировать список POI');
                    return;
                }

                // Оставляем только 5 ближайших
                poiList = poiList.slice(0, 5);

                // Отображаем на карте: маркеры + маршруты
                me.showPoiOnMap(record, vehLat, vehLon, poiList);
            },
            failure: function () {
                Ext.getBody().unmask();
                Ext.Msg.alert('POI', 'Ошибка запроса к Overpass API');
            }
        });
    },

    /**
     * Преобразование элементов Overpass в удобный массив POI.
     *
     * Каждый элемент:
     *  - type: node/way/relation
     *  - lat/lon (для node) или center.lat/center.lon (для way/relation)
     *  - tags.name – название POI
     *
     * Результат: массив объектов вида
     *  {
     *      id: 'overpass-<id>',
     *      lat: <Number>,
     *      lon: <Number>,
     *      name: <String>,
     *      distanceKm: <Number>
     *  }
     */
    preparePoiList: function (elements, vehLat, vehLon) {
        var me = this;

        var pois = [];

        Ext.Array.forEach(elements, function (el) {
            var lat, lon;

            if (el.type === 'node') {
                lat = el.lat;
                lon = el.lon;
            } else if (el.center) {
                lat = el.center.lat;
                lon = el.center.lon;
            }

            if (typeof lat !== 'number' || typeof lon !== 'number') {
                return;
            }

            var name = (el.tags && (el.tags.name || el.tags['name:ru'] || el.tags['name:en'])) || 'POI';

            var distKm = me.calcDistanceKm(vehLat, vehLon, lat, lon);

            pois.push({
                id: 'overpass-' + el.id,
                lat: lat,
                lon: lon,
                name: name,
                distanceKm: distKm
            });
        });

        // Сортируем по расстоянию
        pois.sort(function (a, b) {
            return a.distanceKm - b.distanceKm;
        });

        return pois;
    },

    /**
     * Вычисление расстояния между двумя точками (lat/lon) в км.
     * Простая формула haversine.
     */
    calcDistanceKm: function (lat1, lon1, lat2, lon2) {
        function toRad(x) {
            return x * Math.PI / 180;
        }

        var R = 6371; // радиус Земли в км
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Отрисовка POI и маршрутов на карте.
     *
     * Шаги:
     *  1. Получаем активную карту (MapContainer)
     *  2. Очищаем старые линии и маркеры модуля
     *  3. Центрируем карту на ТС
     *  4. Добавляем маркеры POI с использованием MarkerIconApi
     *  5. Для каждого POI строим маршрут через OSRM и рисуем polyline
     */
    showPoiOnMap: function (record, vehLat, vehLon, poiList) {
        var me = this;

        // Получаем карту, связанную с активной вкладкой
        var map = window.getActiveTabMapContainer ?
            getActiveTabMapContainer() :
            window.mapContainer;

        if (!map) {
            Ext.Msg.alert('POI', 'Карта не найдена (mapContainer / getActiveTabMapContainer)');
            return;
        }

        // Очищаем следы предыдущей работы модуля
        me.cleanupMap();

        // Перемещаем центр карты на выбранную машину
        // API MapContainer может отличаться; предполагаем наличие метода setCenter(lat, lon).
        if (typeof map.setCenter === 'function') {
            map.setCenter(vehLat, vehLon);
        }

        // ID маркера ТС на карте совпадает с id записи (строковый)
        var vehicleMarker = map.getMarker(record.get('id').toString());

        // Построим маркеры POI и маршруты к ним
        Ext.Array.forEach(poiList, function (poi, index) {
            var markerId = 'nearby_poi_' + index;

            // Сохраняем ID, чтобы можно было удалить при следующем поиске
            me.poiMarkerIds.push(markerId);

            /**
             * Формируем URL иконки для POI.
             * Подробности параметров – в docs/MarkerIconApi.md.
             *
             * Здесь предполагается наличие глобальной переменной base_url,
             * а серверная часть MarkerIconApi реализована, например, как
             * /marker.php?a=poi&d=<dir>&hl=<highlight>&...
             *
             * При необходимости подкорректируйте путь и параметры
             * согласно вашей реализации MarkerIconApi.
             */
            var iconUrl;
            if (typeof base_url !== 'undefined') {
                iconUrl = base_url + '/marker.php?a=poi&c=ff0000';
            } else {
                // fallback – стандартный маркер карты
                iconUrl = null;
            }

            // Хинт с названием и расстоянием
            var hintHtml = Ext.String.format(
                '{0}<br/>Расстояние: {1} км',
                Ext.String.htmlEncode(poi.name),
                poi.distanceKm.toFixed(1)
            );

            // ВАЖНО: в MapContainer API используются поля lat и lon (НЕ lng!)
            map.addMarker({
                id: markerId,
                lat: poi.lat,
                lon: poi.lon,
                icon: iconUrl,
                hint: hintHtml
            });

            // Строим маршрут от ТС до POI
            me.buildRouteToPoi(map, vehLat, vehLon, poi);
        });
    },

    /**
     * Построение маршрута от машины до одного POI через локальный OSRM.
     *
     * Используется запрос вида:
     *   base_url + '/osrm/route/v1/driving/<vehLon>,<vehLat>;<poiLon>,<poiLat>?geometries=polyline6&overview=full'
     *
     * Ответ – стандартный JSON OSRM, берем routes[0].geometry (polyline6),
     * декодируем через map.decodeRoute и рисуем линию map.setPolylineBlue(points).
     */
    buildRouteToPoi: function (map, vehLat, vehLon, poi) {
        if (typeof base_url === 'undefined') {
            Ext.log('Nearby POI: base_url не определён – OSRM недоступен');
            return;
        }

        var osrmUrl = base_url +
            '/osrm/route/v1/driving/' +
            vehLon + ',' + vehLat + ';' +
            poi.lon + ',' + poi.lat +
            '?geometries=polyline6&overview=full';

        var me = this;

        Ext.Ajax.request({
            url: osrmUrl,
            method: 'GET',

            /**
             * ВАЖНО:
             * disableCaching: false
             * иначе ExtJS добавляет параметр _dc, и OSRM может возвращать 400
             */
            disableCaching: false,

            success: function (response) {
                var data;
                try {
                    data = Ext.decode(response.responseText);
                } catch (e) {
                    Ext.log('Nearby POI: ошибка разбора ответа OSRM');
                    return;
                }

                if (!data.routes || !data.routes.length) {
                    Ext.log('Nearby POI: OSRM не вернул маршруты');
                    return;
                }

                var route = data.routes[0];

                if (!map.decodeRoute || !map.setPolylineBlue) {
                    Ext.log('Nearby POI: MapContainer не поддерживает decodeRoute/setPolylineBlue');
                    return;
                }

                // Декодируем polyline6 в массив точек
                var decoded = map.decodeRoute(route.geometry, 6) || [];

                // Преобразуем в формат {lat, lon} для API карты
                var points = Ext.Array.map(decoded, function (pt) {
                    return {
                        lat: pt.lat,
                        // Защита на случай, если decodeRoute возвращает lng, а не lon
                        lon: (typeof pt.lon !== 'undefined') ? pt.lon : pt.lng
                    };
                });

                // Рисуем синюю линию маршрута
                // (если в API один polyline – новая линия может затирать предыдущую)
                map.setPolylineBlue(points);
            },
            failure: function () {
                Ext.log('Nearby POI: ошибка запроса к OSRM');
            }
        });
    },

    /**
     * Очистка результатов предыдущего поиска:
     *  - удаление polyline с карты (если метод существует)
     *  - удаление маркеров POI, созданных модулем (если removeMarker существует)
     */
    cleanupMap: function () {
        var me = this;

        var map = window.getActiveTabMapContainer ?
            getActiveTabMapContainer() :
            window.mapContainer;

        if (!map) {
            return;
        }

        // Удаляем polyline, если есть метод removePilyline()
        if (typeof map.removePilyline === 'function') {
            map.removePilyline();
        } else if (typeof map.removePolyline === 'function') {
            // Если в вашей версии API правильное имя метода – используйте его
            map.removePolyline();
        }

        // Удаляем маркеры POI, созданные расширением
        if (typeof map.removeMarker === 'function' && Ext.isArray(me.poiMarkerIds)) {
            Ext.Array.forEach(me.poiMarkerIds, function (id) {
                map.removeMarker(id);
            });
        }

        me.poiMarkerIds = [];
    }
});
```

---

## `examples/nearby-poi/doc/index.html`

Минимальная документация (можно потом расширить):

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Расширение "Поиск ближайшего POI"</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            max-width: 900px;
            margin: 20px auto;
            line-height: 1.5;
        }
        h1, h2, h3 {
            margin-top: 1.2em;
        }
        code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }
        pre {
            background: #f5f5f5;
            padding: 8px 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>

<h1>Расширение PILOT: Поиск ближайшего POI</h1>

<p>
    Это расширение не добавляет новых вкладок и панелей, а расширяет уже существующий
    интерфейс раздела <strong>Online</strong>:
</p>

<ul>
    <li>добавляет пункт <strong>«Поиск ближайшего POI»</strong> в контекстное меню дерева объектов;</li>
    <li>по клику открывает модальное окно с параметрами поиска;</li>
    <li>по Overpass API ищет ближайшие объекты (POI) вокруг выбранного ТС;</li>
    <li>отмечает до 5 ближайших POI на карте с помощью MarkerIconApi;</li>
    <li>строит маршруты до каждого POI через локальный OSRM.</li>
</ul>

<h2>Установка</h2>

<ol>
    <li>Скопируйте папку <code>examples/nearby-poi</code> на ваш веб-сервер.</li>
    <li>Убедитесь, что файл <code>Module.js</code> доступен по URL, например:
        <br><code>https://your-server/pilot_extensions/examples/nearby-poi/Module.js</code>
    </li>
    <li>
        В админ-панели PILOT создайте новое приложение, указав URL на <code>Module.js</code>.
    </li>
    <li>Подождите ~10 минут для применения настроек прокси.</li>
</ol>

<h2>Использование</h2>

<ol>
    <li>Откройте раздел <strong>Online</strong> в PILOT.</li>
    <li>Выберите машину в дереве объектов.</li>
    <li>Кликните правой кнопкой мыши по машине и выберите
        <strong>«Поиск ближайшего POI»</strong>.
    </li>
    <li>В появившемся окне укажите:
        <ul>
            <li><strong>Что ищем</strong> – текст, по которому ищется имя объекта (например, <code>шиномонтаж</code>);</li>
            <li><strong>Радиус, км</strong> – зона поиска вокруг машины.</li>
        </ul>
    </li>
    <li>Нажмите <strong>«Искать»</strong>.</li>
</ol>

<p>После этого:</p>

<ul>
    <li>центр карты перемещается к выбранному ТС;</li>
    <li>на карту добавляются маркеры до 5 ближайших POI с иконками MarkerIconApi;</li>
    <li>для каждого POI строится маршрут (polyline) через локальный OSRM.</li>
</ul>

<h2>Технические детали</h2>

<h3>Дерево объектов</h3>

<p>
    Расширение использует существующее дерево:
    <code>skeleton.navigation.online.online_tree</code>.
</p>

<p>
    В <code>initModule()</code> в контекстное меню добавляется пункт:
</p>

<pre><code>tree.contextmenu.add({
    text: l('Поиск ближайшего POI'),
    iconCls: 'fa fa-bullseye-pointer',
    handler: me.searchPOI,
    scope: tree
});
</code></pre>

<p>
    За счёт <code>scope: tree</code> внутри <code>searchPOI</code> переменная
    <code>this</code> указывает на <code>online_tree</code>, и доступна
    текущая запись <code>this.record</code>.
</p>

<h3>Координаты ТС</h3>

<p>Из записи объекта берутся поля <code>lat</code> и <code>lon</code>:</p>

<pre><code>var lat = rec.get('lat');
var lon = rec.get('lon');
</code></pre>

<h3>Карта</h3>

<p>
    Для работы с картой используется существующий <code>MapContainer</code>, 
    доступный через <code>getActiveTabMapContainer()</code> или глобальный
    <code>mapContainer</code>.
</p>

<h3>Overpass API</h3>

<p>
    Поиск POI выполняется запросом к <code>https://overpass-api.de/api/interpreter</code>,
    в котором собирается Overpass-запрос с оператором <code>around</code> и фильтром
    по <code>name~"&lt;что ищем&gt;",i</code>.
</p>

<h3>Маркерные иконки</h3>

<p>
    Для POI используется MarkerIconApi (см. <code>docs/MarkerIconApi.md</code> этого репозитория).
    В коде формируется URL иконки на базе глобального <code>base_url</code>.
</p>

<h3>Маршруты OSRM</h3>

<p>
    Маршрут строится запросом к <code>base_url + '/osrm/route/v1/driving/...'</code>,
    в параметрах <code>geometries=polyline6&amp;overview=full</code>. Ответ OSRM
    декодируется через <code>map.decodeRoute()</code>, после чего линия рисуется
    методом <code>map.setPolylineBlue(points)</code>.
</p>

<h3>Очистка карты</h3>

<p>
    Перед каждым новым поиском модуль:
</p>

<ul>
    <li>удаляет существующий polyline методом <code>map.removePilyline()</code> (если есть);</li>
    <li>удаляет маркеры POI, созданные ранее, через <code>map.removeMarker(id)</code>.</li>
</ul>

</body>
</html>
```

---

Если хочешь, дальше можем вместе подогнать:

* точный URL и параметры MarkerIconApi под твою реализацию;
* стиль иконок (другой base, цвет и т.п.);
* логику маршрутов (например, рисовать их разными цветами или только до ближайшего POI).

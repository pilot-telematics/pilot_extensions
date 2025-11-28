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

Ext.define('Store.nearby-poi.Module', {
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

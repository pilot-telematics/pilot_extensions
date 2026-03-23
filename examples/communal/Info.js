Ext.define('Store.communal.Info', {
    extend: 'Ext.panel.Panel',
    xtype: 'store-communal-info',
    layout: 'border',

    initComponent: function () {
        this.title = l('Information');


        this.totalField = Ext.create('Ext.form.field.Display', {
            fieldLabel: l('Total'),
            labelSeparator: '',
            labelAlign: 'top',
            flex: 1,
            cls: 'comm_info',
            value: '0'
        });
        this.activeField = Ext.create('Ext.form.field.Display', {
            fieldLabel: l('Active'),
            labelSeparator: '',
            labelAlign: 'top',
            flex: 1,
            cls: 'comm_info',
            value: '0'
        });
        this.notActiveField = Ext.create('Ext.form.field.Display', {
            fieldLabel: l('Not Active'),
            labelSeparator: '',
            labelAlign: 'top',
            flex: 1,
            cls: 'comm_info',
            value: '0'
        });
        this.issuesField = Ext.create('Ext.form.field.Display', {
            fieldLabel: l('Issues'),
            labelSeparator: '',
            labelAlign: 'top',
            flex: 1,
            cls: 'comm_info',
            value: '0'
        });

        this.info = Ext.create('Ext.grid.Panel', {
            region: 'center',
            flex: 1,
            tbar: {
                items: [
                    this.totalField,
                    this.activeField,
                    this.notActiveField,
                    this.issuesField
                ]
            },
            columns: [
                {text: l('Object'), dataIndex: 'vehiclenumber', flex: 1.2},
                {text: l('Address'), dataIndex: 'addr', flex: 1.6},
                {text: l('Name'), dataIndex: 'name', flex: 1.4},
                {text: l('Group'), dataIndex: 'group', flex: 1},
                {text: l('Value'), dataIndex: 'hum_value', flex: 1},
                {
                    text: l('Updated'),
                    dataIndex: 'change_ts',
                    flex: 1.2,
                    renderer: function (value) {
                        return this.renderDateTime(value);
                    },
                    scope: this
                },
                {
                    text: l('Issues'),
                    dataIndex: 'issues',
                    width: 80,
                    align: 'center',
                    renderer: function (value) {
                        return this.renderIssues(value);
                    },
                    scope: this
                }
            ],
            store: Ext.create('Ext.data.Store', {
                fields: ['vehiclenumber', 'addr', 'name', 'group', 'hum_value', 'change_ts', 'issues', 'lat', 'lon', 'sensor_key']
            }),
            listeners: {
                itemclick: function (grid, record) {
                    this.showSensorMarker(record);
                },
                scope: this
            }
        });

        this.map = Ext.create('Pilot.utils.MapContainer', {
            mapId: 'communal',
            region: 'south',
            split: {
                size: 6
            },
            flex: 1,
            listeners: {
                resize: function () {
                    if (this.map) {
                        this.map.checkResize();
                    }
                }
            }
        });

        this.items = [
            this.info,
            this.map
        ];

        this.callParent(arguments);
    },

    updateSummary: function (stats) {
        stats = stats || {};

        this.totalField.setValue(String(stats.total || 0));
        this.activeField.setValue(String(stats.active || 0));
        this.notActiveField.setValue(String(stats.notActive || 0));
        this.issuesField.setValue(String(stats.issues || 0));
    },

    setSensorRows: function (rows) {
        rows = Ext.Array.filter(rows || [], function (row) {
            return Number(row.issues || 0) > 0;
        });

        this.info.getStore().loadData(rows, false);
        this.info.getSelectionModel().deselectAll();

        if (!rows.length) {
            this.clearSensorMarker();
        }
    },

    renderDateTime: function (value) {
        if (Ext.isEmpty(value)) {
            return '';
        }

        if (Ext.isFunction(window.dateTimeStr)) {
            return window.dateTimeStr(value);
        }

        return Ext.Date.format(new Date(Number(value) * 1000), 'Y-m-d H:i:s');
    },

    renderIssues: function (value) {
        value = Number(value || 0);

        if (value >= 2) {
            return '<div class="comm_status fa fa-circle-xmark red"></div>';
        }

        if (value === 1) {
            return '<div class="comm_status fa fa-circle-exclamation orange"></div>';
        }

        return '<div class="comm_status fa fa-circle-check green"></div>';
    },

    getMapContainer: function () {
        return this.map ? this.map.map : null;
    },

    clearSensorMarker: function () {
        var mapContainer = this.getMapContainer();

        if (this.sensorMarker && mapContainer && Ext.isFunction(mapContainer.removeMarker)) {
            mapContainer.removeMarker(this.sensorMarker);
        }

        this.sensorMarker = null;
    },

    showSensorMarker: function (record) {
        var mapContainer = this.getMapContainer(),
            lat = Number(record.get('lat')),
            lon = Number(record.get('lon')),
            title;

        if (!mapContainer || !isFinite(lat) || !isFinite(lon)) {
            return;
        }

        title = record.get('vehiclenumber') + ' / ' + record.get('name');

        this.clearSensorMarker();

        if (Ext.isFunction(mapContainer.addMarker)) {
            this.sensorMarker = mapContainer.addMarker({
                id: 'communal_sensor_marker',
                lat: lat,
                lon: lon,
                icon: base_url+'markers/get.php?l=0',
                size: 'big',
                tooltip: {
                    msg: title,
                    direction: 'top'
                },
                popupContent: title
            });
        }

        if (Ext.isFunction(mapContainer.setMapCenter)) {
            mapContainer.setMapCenter(lat, lon);
        }

        if (Ext.isFunction(mapContainer.setMapZoom)) {
            mapContainer.setMapZoom(16);
        }
    }
});

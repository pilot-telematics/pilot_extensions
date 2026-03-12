Ext.define('Store.communal.Center', {
    extend: 'Ext.panel.Panel',
    xtype: 'store-communal-center',
    layout: 'fit',

    initComponent: function () {
        this.store = Ext.create('Ext.data.Store', {
            fields: [
                'vehiclenumber',
                'name',
                'hum_value',
                'change_ts',
                'issues'
            ],
            groupField: 'vehiclenumber'
        });

        this.tools = [{
            iconCls: 'fa fa-rotate',
            xtype: 'button',
            handler: function () {
                this.up('store-communal-center').loadNodeAgents();
            }
        }];

        this.grid = Ext.create('Ext.grid.Panel', {
            border: false,
            store: this.store,
            emptyText: 'No sensors to display',
            viewConfig: {
                deferEmptyText: false,
                emptyText: 'No sensors to display'
            },
            features: [{
                ftype: 'grouping',
                startCollapsed: false,
                hideGroupedHeader:true,
                groupHeaderTpl: '{name}'
            }],
            tbar: [{
                xtype: 'textfield',
                cls: 'tree-search-field',
                emptyText: '',
                flex: 1,
                triggers: {
                    clean: {
                        cls: 'fa-times',
                        tooltip: l('Clean'),
                        handler: function () {
                            this.reset();
                            this.focus();
                        }
                    }
                },
                listeners: {
                    change: function (field, newVal) {
                        var store = field.up('grid').getStore();

                        if (newVal) {
                            store.filter('name', RegExp(newVal, 'i'));
                        } else {
                            store.removeFilter('name');
                        }
                    },
                    buffer: 500
                }
            }],
            columns: [{
                text:l('Object'),
                dataIndex: 'vehiclenumber'
            },{
                text: 'Название',
                dataIndex: 'name',
                flex: 2
            }, {
                text: 'Показатель',
                dataIndex: 'hum_value',
                flex: 1.5
            }, {
                text: 'Обновление',
                dataIndex: 'change_ts',
                flex: 1.5,
                renderer: function (value) {
                    return this.renderDateTime(value);
                },
                scope: this
            }, {
                text: 'Неполадки',
                dataIndex: 'issues',
                flex: 1,
                align:'center',
                renderer: function (value) {
                    return this.renderIssues(value);
                },
                scope: this
            }]
        });

        this.items = [this.grid];

        this.callParent(arguments);
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
        if (Number(value) === 2) {
            return '<div class="comm_status fa fa-circle-xmark red"></div>';
        }

        if (Number(value) === 1) {
            return '<div class="comm_status fa fa-circle-exclamation amber"></div>';
        }

        return '<div class="comm_status fa fa-circle-check green"></div>';
    },

    loadNodeAgents: function (agentIds) {
        if (agentIds) {
            this.ids = Ext.Array.unique(Ext.Array.clean(agentIds || []));
        }
        this.store.removeAll();

        if (!this.ids.length) {
            return;
        }

        this.setLoading(true);
        Ext.Ajax.request({
            url: base_url + '../api/v3/vehicles/status',
            method: 'GET',
            params: {
                agent_id: this.ids.join(',')
            },
            success: function (response) {
                var payload = Ext.decode(response.responseText, true),
                    rows = this.normalizeStatusRows(payload);

                this.store.loadData(rows);
            },
            failure: function () {
                this.store.removeAll();
                Ext.Msg.alert('Error', 'Failed to load vehicle status data.');
            },
            callback: function () {
                this.setLoading(false);
            },
            scope: this
        });
    },

    normalizeStatusRows: function (payload) {
        var vehicles = payload && Ext.isArray(payload.data) ? payload.data : [],
            rows = [];

        Ext.Array.each(vehicles, function (vehicle) {
            var vehicleNumber = vehicle.vehiclenumber || vehicle.name || String(vehicle.agent_id || vehicle.agentid || ''),
                sensors = Ext.isArray(vehicle.sensors) ? vehicle.sensors : (Ext.isArray(vehicle.sensors_status) ? vehicle.sensors_status : []);

            Ext.Array.each(sensors, function (sensor) {
                rows.push({
                    vehiclenumber: vehicleNumber,
                    name: sensor.name || sensor.sensor_name || '',
                    hum_value: Ext.isEmpty(sensor.hum_value) ? (Ext.isEmpty(sensor.value) ? '' : sensor.value) : sensor.hum_value,
                    change_ts: sensor.change_ts || sensor.ts || null,
                    issues: 0
                });
            });
        });

        return rows;
    }
});
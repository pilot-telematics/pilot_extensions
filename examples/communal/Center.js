Ext.define('Store.communal.Center', {
    extend: 'Ext.panel.Panel',
    xtype: 'store-communal-center',
    layout: 'fit',

    initComponent: function () {
        this.store = Ext.create('Ext.data.Store', {
            fields: [
                'vehiclenumber',
                'name',
                'group',
                'hum_value',
                'change_ts',
                'issues',
                'tags',
                'sensor_key'
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
            emptyText: l('No sensors to display'),
            viewConfig: {
                deferEmptyText: false,
                emptyText: l('No sensors to display')
            },
            features: [{
                ftype: 'grouping',
                startCollapsed: false,
                hideGroupedHeader: true,
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
            }, {
                emptyText: l('Select tags'),
                name: 'tags[]',
                xtype: 'tagfield',
                flex: 1,
                filterPickList: true,
                itemId: 'sensor_tags_combo',
                valueField: 'id',
                displayField: 'tag_name',
                store: window.tags_store,
                multiSelect: true,
                tpl: Ext.create('Ext.XTemplate',
                    '{[this.currentKey = null]}' +
                    '<tpl for=".">',
                    '<tpl if="this.shouldShowHeader(org_name)">',
                    '<div class="combo_hdr">{[this.showHeader(values.org_name)]}</div>',
                    '</tpl>',
                    '<div class="x-boundlist-item x-form-text-default"><li class="x-tagfield-item {color}" style="background-color:{color}99;"><div class="x-tagfield-item-text">{tag_name}</div></li></div>',
                    '</tpl>',
                    {
                        shouldShowHeader: function (key) {
                            return this.currentKey != key;
                        },
                        showHeader: function (key) {
                            this.currentKey = key;
                            return key;
                        }
                    }
                ),
                listeners: {
                    change: function (field, newVal) {
                        var store = field.up('grid').getStore(),
                            selectedTags = Ext.Array.from(newVal || []);

                        store.removeFilter('tags');

                        if (!selectedTags.length) {
                            return;
                        }

                        store.addFilter({
                            id: 'tags',
                            filterFn: function (record) {
                                var recordTags = Ext.Array.from(record.get('tags') || []);
                                return Ext.Array.intersect(recordTags, selectedTags).length > 0;
                            }
                        });
                    }
                }
            }, {
                xtype: 'checkbox',
                itemId: 'sensor_issues_only',
                boxLabel: l('Issues Only'),
                margin: '0 0 0 8',
                listeners: {
                    change: function (cb, checked) {
                        var store = cb.up('grid').getStore();

                        store.removeFilter('issues');

                        if (checked) {
                            store.addFilter({
                                id: 'issues',
                                filterFn: function (record) {
                                    return Number(record.get('issues')) !== 0;
                                }
                            });
                        }
                    }
                }
            }],
            columns: [{
                text: l('Object'),
                dataIndex: 'vehiclenumber'
            }, {
                text: l('Name'),
                dataIndex: 'name',
                flex: 2
            }, {
                text: l('Group'),
                dataIndex: 'group',
                flex: 1.2
            }, {
                text: l('Value'),
                dataIndex: 'hum_value',
                flex: 1.5
            }, {
                text: l('Updated'),
                dataIndex: 'change_ts',
                flex: 1.5,
                renderer: function (value) {
                    return this.renderDateTime(value);
                },
                scope: this
            }, {
                text: l('Issues'),
                dataIndex: 'issues',
                flex: 1,
                align: 'center',
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

    getInfoPanel: function () {
        var mapPanel = this.up('store-communal-map');

        return mapPanel ? mapPanel.info : null;
    },

    getMnemoPanel: function () {
        var mapPanel = this.up('store-communal-map');

        return mapPanel ? mapPanel.mnemo : null;
    },

    updateInfoSummary: function (stats) {
        var infoPanel = this.getInfoPanel();

        if (infoPanel && Ext.isFunction(infoPanel.updateSummary)) {
            infoPanel.updateSummary(stats);
        }
    },

    buildSummary: function (rows) {
        var nowTs = Math.floor(Date.now() / 1000),
            active = 0,
            issues = 0;

        Ext.Array.each(rows, function (row) {
            var changeTs = Number(row.change_ts || 0),
                issueValue = Number(row.issues || 0);

            if (changeTs > 0 && (nowTs - changeTs) < 3600) {
                active += 1;
            }

            if (issueValue > 0) {
                issues += 1;
            }
        });

        return {
            total: rows.length,
            active: active,
            notActive: rows.length - active,
            issues: issues
        };
    },

    loadNodeAgents: function (agentIds) {
        if (agentIds) {
            this.ids = Ext.Array.unique(Ext.Array.clean(agentIds || []));
        }
        this.store.removeAll();

        if (!this.ids || !this.ids.length) {
            this.updateInfoSummary({total: 0, active: 0, notActive: 0, issues: 0});
            if (this.getMnemoPanel()) {
                this.getMnemoPanel().setSensorRows([]);
            }
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
                    rows = this.normalizeStatusRows(payload),
                    summary = this.buildSummary(rows),
                    mnemo = this.getMnemoPanel();

                this.store.loadData(rows);
                this.updateInfoSummary(summary);
                if (mnemo && Ext.isFunction(mnemo.setSensorRows)) {
                    mnemo.setSensorRows(rows);
                }
            },
            failure: function () {
                this.store.removeAll();
                this.updateInfoSummary({total: 0, active: 0, notActive: 0, issues: 0});
                if (this.getMnemoPanel()) {
                    this.getMnemoPanel().setSensorRows([]);
                }
                Ext.Msg.alert(l('Error'), l('Failed to load vehicle status data.'));
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
                var sensorName = sensor.name || sensor.sensor_name || '',
                    sensorGroup = sensor.group || '',
                    sensorKey = [vehicleNumber, sensorGroup, sensorName].join('::');

                rows.push({
                    vehiclenumber: vehicleNumber,
                    name: sensorName,
                    group: sensorGroup,
                    hum_value: Ext.isEmpty(sensor.hum_value) ? (Ext.isEmpty(sensor.value) ? '' : sensor.value) : sensor.hum_value,
                    change_ts: sensor.change_ts || sensor.ts || null,
                    issues: 0,
                    sensor_key: sensorKey,
                    tags: sensor.tags ? sensor.tags.split(',').map(function (tag) {
                        return parseInt(tag, 10);
                    }).filter(function (tag) {
                        return Number.isInteger(tag) && tag > 0;
                    }) : []
                });
            });
        });

        return rows;
    }
});

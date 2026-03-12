Ext.define('Store.communal.Info', {
    extend: 'Ext.panel.Panel',
    xtype: 'store-communal-info',
    layout: 'border',

    initComponent: function () {
        this.title = l('Information');
        this.tools = [{
            iconCls: 'fa fa-broom',
            xtype: 'button',
            handler: function () {
                var map = this.up('store-communal-info').mapgetMap();
                if (map) {
                    map.removeAllHistoryTracks();
                    map.removeAllMarkers();
                    if (!map.circlemarkers) {
                        map.circlemarkers = [];
                    }
                    map.circlemarkers.forEach(function (marker) {
                        map.removeLayer(marker);
                        marker = null;
                    });
                }
            }
        }];

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
                {text: l('Address'), dataIndex: 'addr'},
                {text: l('Name'), dataIndex: 'name'},
                {text: l('Value'), dataIndex: 'value'},
                {text: l('Event time'), dataIndex: 'ts'}
            ],
            store: Ext.create('Ext.data.Store', {fields: ['addr', 'name', 'value', 'ts']})
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
    }
});
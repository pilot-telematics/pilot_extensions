Ext.define('Store.communal.Info', {
        extend: 'Ext.panel.Panel',
        xtype: 'store-communal-info',
        layout: 'border',
        initComponent: function () {
            this.title = l('Information');
            this.tools = [{
                iconCls: 'fa fa-broom',
                xtype:'button',
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
            this.info = Ext.create('Ext.grid.Panel', {
                region: "center",
                flex: 1,
                tbar: {
                    defaults:{xtype: 'displayfield', labelSeparator  :'',labelAlign: 'top',flex:1, cls:"comm_info",value:'0'},
                    items:[
                    { fieldLabel: l('Total')},
                    {fieldLabel: l('Active')},
                    {fieldLabel: l('Not Active')},
                    {fieldLabel: l('Issues')}]
                },
                columns: [
                    {text: l('Address'), dataIndex: 'addr'},
                    {text: l('Name'), dataIndex: 'name'},
                    {text: l('Value'), dataIndex: 'value'},
                    {text: l('Event time'), dataIndex: 'ts'},
                ],
                store: Ext.create("Ext.data.Store", {fields: ['addr', 'name', 'value', 'ts']})
            });
            this.map = Ext.create('Pilot.utils.MapContainer', {
                mapId: 'communal',
                region: 'south',
                split: {
                    size: 6
                },
                flex: 1,

                listeners: {
                    'resize': function () {
                        if (this.map) {
                            this.map.checkResize();
                        }
                    }
                },

            });
            this.items = [
                this.info, this.map
            ];
            this.callParent(arguments);
        }
    }
);
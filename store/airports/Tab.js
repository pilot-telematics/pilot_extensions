Ext.define('Store.airports.Tab', {
    extend: 'Ext.grid.Panel',
    xtype: 'store-airports-tab',
    iconCls: 'fa fa-plane',
    iconAlign: 'top',
    layout: 'fit',
    plugins: {
        gridfilters: true
    },
    listeners:{
      select:'selectRow'
    },
    selectRow:function(me,record){
        console.log(record);
       var geoloc=record.get('_geoloc');

        this.map_frame.map.setMapCenter(geoloc.lat,geoloc.lng);
        this.map_frame.map.setMapZoom(13);
    },
    initComponent: function () {
        var cmp = this;
        this.tooltip = l('Airports');
        this.title = l('Airports');

        this.tbar = {
            cls: 'transparent_buttons dark_form',
            items: ['->',
                {
                    iconCls: 'fa fa-rotate',
                    handler: function () {
                        this.up('grid').getStore().load();
                    }
                }
            ]
        };
        this.store = Ext.create('Ext.data.Store', {
            remoteSort: false,
            autoLoad: true,
            remoteFilter: false,
            fields: ['name', 'city', 'country', 'iata_code', '_geoloc', 'links_count', 'objectID'],
            proxy: {
                type: 'ajax',
                url: '../store/airports/airports.json'
            }
        });
        this.columns = [
            {
                text: 'Name',
                dataIndex: 'name',
                flex: 1,
                filter: {type: 'string'}
            },
            {
                text: 'City',
                dataIndex: 'city',
                flex: 1,
                filter: {type: 'string'}
            },
            {
                text: 'Country',
                dataIndex: 'country',
                flex: 1,
                filter: {type: 'string'}
            },
            {
                text: 'Code',
                dataIndex: 'iata_code',
                width: 100,
                filter: {type: 'string'}
            }

        ];
        this.callParent();

    }
    }
);
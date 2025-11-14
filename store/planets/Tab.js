Ext.define('Store.planets.Tab', {
    extend: 'Ext.grid.Panel',
    xtype: 'store-planets-tab',
    iconCls: 'fa fa-sun',
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

        this.map_frame.update('<p class="description">'+record.get('description')+'</p><center><img height="777" src="'+record.get('image')+'"></center>');
    },
    initComponent: function () {
        var cmp = this;
        this.tooltip = l('Planets of Solar System');
        this.title = l('Planets');

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
            fields: ['position','name', 'image', 'velocity', 'distance', 'description'],
            proxy: {
                type: 'ajax',
                url: '../store/planets/planets.json'
            }
        });
        this.columns = [
            {
                text: 'Position',
                dataIndex: 'position',
                width:60
            },
            {
                text: 'Name',
                dataIndex: 'name',
                flex: 1,
                filter: {type: 'string'}
            },
            {
                text: 'velocity',
                dataIndex: 'velocity',
                flex: 1,
                filter: {type: 'number'}
            },
            {
                text: 'distance',
                dataIndex: 'distance',
                flex: 1,
                filter: {type: 'number'}
            }

        ];
        this.callParent();

    }
    }
);
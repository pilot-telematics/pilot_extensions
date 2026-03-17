Ext.define('Store.communal.Map', {
        extend: 'Ext.container.Container',
        xtype: 'store-communal-map',
        cls: 'left_top_round_noboard',
        layout: {type: 'border'},
        initComponent: function () {
            this.center = Ext.create('Store.communal.Center', {
                region: 'center',
                flex: 1
            });
            this.info = Ext.create('Store.communal.Info', {
                region: 'east',
                split: {
                    size: 6
                },
                collapsible: true,

              //  hideCollapseTool: true,
              //  preventHeader: true,
                collapseMode:'mini',
              //  placeholder:{width:5},
                flex: 1
            });
            this.items = [
                this.center,
                this.info
            ];


            this.callParent();

        }
    }
);
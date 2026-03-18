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
            this.info = Ext.create('Store.communal.Info');
            this.mnemo=Ext.create("Store.communal.Mnemo");
            this.items = [
                this.center,
                {
                    xtype: 'tabpanel',
                    region: 'east',
                    split: {
                        size: 6
                    },
                    collapsible: true,
                    //  hideCollapseTool: true,
                    preventHeader: true,
                    collapseMode: 'mini',
                    //  placeholder:{width:5},
                    flex: 1,
                    items: [this.info, this.mnemo]
                }
            ];
            this.callParent();

        }
    }
);
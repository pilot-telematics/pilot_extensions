Ext.define('Store.communal.Mnemo', {
        extend: 'Ext.panel.Panel',
        xtype: 'store-communal-mnemo',
        layout: 'fit',

        initComponent: function () {
            this.tbar = {
                cls: 'transparent_buttons',
                items: [
                    '->',
                    {
                        tooltip: l('Add'),
                        iconCls: 'fa fa-plus',
                    },
                    {
                        tooltip: l('Edit'),
                        iconCls: 'fa fa-pencil',
                    },
                    {
                        tooltip: l('Delete'),
                        iconCls: 'fa fa-trash-alt',
                    }

                ]
            };
            this.title = l('Mnemo Schema');
            this.callParent(arguments);
        }
    }
);
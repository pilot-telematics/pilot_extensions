Ext.define('Store.communal.Tree', {
        cls: 'squeezed_grid',
        extend: 'Ext.tree.Panel',
        iconCls: 'fa fa-apartment',
        initComponent: function () {

            this.tooltip = l('Объекты');
            this.title = l('Объекты');


            this.tools = [
                {
                    iconCls: 'fa fa-gear',
                    xtype: 'button'

                },
                {
                    iconCls: 'fa fa-print',
                    xtype: 'button'

                },
                {
                    iconCls: 'fa fa-plus',
                    xtype: 'button'

                },
                {
                    iconCls: 'fa fa-rotate',
                    xtype: 'button',
                    handler: function () {
                        this.up('treepanel').getStore().load();
                    }
                }
            ];
            this.store = Ext.create('Ext.data.TreeStore', {
                remoteSort: false,
                autoLoad: true,
                remoteFilter: false,

                fields: ['name', 'type', 'country', 'children_count', 'issues'],
                proxy: {
                    type: 'ajax',
                    url: '/store/communal/backend/tree.json',
                    reader: {
                        type: 'json'
                    }
                },
                filterer: 'bottomup'
            });
            this.columns = [
                {
                    dataIndex: 'name',
                    filter: {type: 'string'},
                    flex: 3,
                    text: l('Name'),
                    xtype: 'treecolumn'
                },
                {
                    text: l('Object type'),
                    dataIndex: 'type',
                    flex: 1,
                    filter: {type: 'string'}
                },
                {
                    text: l('Children count'),
                    dataIndex: 'children_count',
                    flex: 1,
                    filter: {type: 'number'}

                },
                {
                    text: l('Issues count'),
                    dataIndex: 'issues',
                    flex: 1,
                    filter: {type: 'string'}
                }

            ];
            this.callParent();

        },

        layout: 'fit',
        listeners: {
            select: 'selectRow'
        },
        plugins: {
            gridfilters: true
        },
        rootVisible: false,
        selModel: {
            selType: 'checkboxmodel'
        },
        selectRow: function (me, record) {

        },
        xtype: 'store-communal-tree'
    }
);
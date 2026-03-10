Ext.define('Store.communal.Tree', {
        cls: 'squeezed_grid',
        extend: 'Ext.tree.Panel',
        iconCls: 'fa fa-apartment',
        xtype: 'store-communal-tree',
        requires: [
            'Store.communal.view.NodeEditWindow'
        ],

        addNode: function () {
            var parentNode = this.getSelection()[0] || this.getStore().getRoot();

            Ext.create('Store.communal.view.NodeEditWindow', {
                mode: 'add',
                parentNode: parentNode,
                cars: this.getCarsList(),
                tree: this
            }).show();
        },
        editNode: function (record) {
            if (!record || record.isRoot()) {
                return;
            }

            Ext.create('Store.communal.view.NodeEditWindow', {
                mode: 'edit',
                record: record,
                parentNode: record.parentNode,
                cars: this.getCarsList(),
                tree: this
            }).show();
        },
        getCarsList: function () {
            var cars = [];

            try {
                skeleton.navigation.online.online_tree.store.getRootNode().cascadeBy(function (n) {
                    if (n && n.data && n.data.leaf) {
                        cars.push({
                            agent_id: n.data.agentid,
                            name: n.data.name
                        });
                    }
                });
            } catch (e) {
            }

            return cars;
        },

        /**
         * Decide node type for a child. Adjust to your logic.
         */
        guessChildType: function (parentNode) {
            var t = parentNode.get('type');
            // root has no type
            if (!t) return 'city';
            if (t === 'city') return 'suburb';
            if (t === 'suburb') return 'street';
            if (t === 'street') return 'house';
            if (t === 'house') return 'flat';
            return 'flat';
        },

        initComponent: function () {
            var cmp = this;
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
                    xtype: 'button',
                    handler: function () {
                        var tree = this.up('treepanel');
                        tree.addNode();
                    }

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
                autoLoad: false,
                remoteFilter: false,
                root: {
                    id: 'root',
                    text: l('Все объекты'),
                    expanded: true,     // ← IMPORTANT
                    leaf: false
                },

                fields: ['name', 'type', 'country', 'children_count', 'issues'],
                proxy: {
                    type: 'ajax',
                    api: {
                        read: '/store/communal/backend/tree.php?op=read',
                        create: '/store/communal/backend/tree.php?op=create',
                        update: '/store/communal/backend/tree.php?op=update',
                        destroy: '/store/communal/backend/tree.php?op=destroy'
                    },
                    writer: {
                        type: 'json',
                        rootProperty: 'data',
                        writeAllFields: true,
                        allowSingle: true
                    }
                },
                autoSync: false, // recommended (manual control),
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
                },

                {
                    xtype: 'actioncolumn',
                    width: 62,
                    align: 'right',
                    items: [{
                        iconCls: 'fa fa-pen',
                        tooltip: l('Edit'),
                        handler: function (view, rowIndex, colIndex, item, e, record) {
                            view.up('treepanel').editNode(record);
                            }

                    },
                        {
                            iconCls: 'fa fa-trash-alt',
                            tooltip: l('Delete'),
                            handler: function (tree, rowIndex, colIndex, item, e, record) {

                                var store = tree.getStore();
                                pilot_confirm(
                                    l('Delete'),
                                    'Вы действительно хотите удалить объект <b>' + record.get('name') + '</b>  и все вложенные элементы?',
                                    'delete_icon',
                                    function () {
                                        record.erase({
                                            success: function () {
                                                // Ext automatically removes from store
                                            },
                                            failure: function () {
                                                tree.getStore().rejectChanges();
                                                Ext.Msg.alert(l('Ошибка'), l('Не удалось удалить'));
                                            }
                                        });
                                    },
                                    'ext_com_tree_del');
                            }
                        }
                    ]
                }

            ];
            Ext.GlobalEvents.on('communal-auth-ok', function (accountId, token) {
                cmp.getStore().getProxy().setHeaders({Authorization: 'Bearer ' + token});
                cmp.getStore().load();
            });
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

    }
);
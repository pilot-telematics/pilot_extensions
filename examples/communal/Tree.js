Ext.define('Store.communal.Tree', {
        cls: 'squeezed_grid',
        extend: 'Ext.tree.Panel',
        iconCls: 'fa fa-apartment',
        addNode: function () {
            var tree = this;
            var store = tree.getStore();

            var parent = tree.getSelection()[0] || store.getRoot();

            if (!parent.isExpanded()) {
                parent.expand(false);
            }

            Ext.Msg.prompt(l('Новый узел'), l('Название'), function (btn, text) {
                text = (text || '').trim();
                if (btn !== 'ok' || !text) return;

                // 1) Create client-side record
                var node = parent.appendChild({
                    name: text,
                    text: text,                 // important for treecolumn
                    type: tree.guessChildType(parent),
                    descr: '',
                    leaf: true                  // backend will correct later if needed
                });

                parent.set('leaf', false);

                // 2) Sync with backend
                store.sync({
                    success: function () {
                        // backend returned real ID → store updates it automatically
                        tree.getSelectionModel().select(node);
                    },
                    failure: function (batch) {
                        // rollback on error
                        store.rejectChanges();
                        Ext.Msg.alert(l('Ошибка'), l('Не удалось создать узел'));
                    }
                });
            });
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
        xtype: 'store-communal-tree'
    }
);
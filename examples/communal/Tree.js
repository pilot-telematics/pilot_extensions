Ext.define('Store.communal.Tree', {
        cls: 'squeezed_grid',
        extend: 'Ext.tree.Panel',
        iconCls: 'fa fa-apartment',
    addNode: function () {
        var tree = this,
            store = tree.getStore(),
            parent = tree.getSelection()[0] || store.getRoot();

        if (!parent.isExpanded()) {
            parent.expand(false);
        }

        // --- build cars list from PILOT online tree ---
        var cars = [];
        try {
            var root = skeleton.navigation.online.online_tree.store.getRootNode();
            root.cascadeBy(function (n) {
                if (n && n.data && n.data.leaf) {
                    cars.push({
                        agent_id: n.data.agentid,
                        name: n.data.name
                    });
                }
            });
        } catch (e) {
            // if online tree not ready - cars stays empty
        }

        var carsStore = Ext.create('Ext.data.Store', {
            fields: ['agent_id', 'name'],
            data: cars
        });

        var typeStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: [
                {id: 'city',   name: l('Город')},
                {id: 'suburb', name: l('Район')},
                {id: 'street', name: l('Улица')},
                {id: 'house',  name: l('Дом')},
                {id: 'flat',   name: l('Квартира')}
            ]
        });

        var win = Ext.create('Ext.window.Window', {
            title: l('Добавить узел'),
            modal: true,
            width: 420,
            layout: 'fit',
            bodyPadding: 12,
            items: [{
                xtype: 'form',
                referenceHolder: true,
                defaults: { anchor: '100%', labelWidth: 140 },
                items: [{
                    xtype: 'textfield',
                    name: 'name',
                    fieldLabel: l('Название'),
                    allowBlank: false
                },{
                    xtype: 'combobox',
                    name: 'type',
                    fieldLabel: l('Тип'),
                    store: typeStore,
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'id',
                    editable: false,
                    forceSelection: true,
                    allowBlank: false,
                    value: tree.guessChildType ? tree.guessChildType(parent) : 'city'
                },{
                    xtype: 'checkboxfield',
                    name: 'is_leaf',
                    fieldLabel: l('Конечный узел'),
                    inputValue: true,
                    uncheckedValue: false,
                    listeners: {
                        change: function (cb, checked) {
                            var form = cb.up('form');
                            var agent = form.down('[name=agent_id]');
                            if (checked) {
                                agent.setDisabled(false);
                                agent.show();
                                agent.allowBlank = false;
                            } else {
                                agent.setValue(null);
                                agent.setDisabled(true);
                                agent.hide();
                                agent.allowBlank = true;
                            }
                            agent.validate();
                        }
                    }
                },{
                    xtype: 'combobox',
                    name: 'agent_id',
                    fieldLabel: l('Привязать объект (agent)'),
                    store: carsStore,
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'agent_id',
                    editable: true,
                    forceSelection: false,
                    disabled: true,
                    hidden: true,
                    emptyText: l('Выберите объект из PILOT'),
                    allowBlank: true
                },{
                    xtype: 'textarea',
                    name: 'descr',
                    fieldLabel: l('Описание'),
                    grow: true
                },{
                    xtype: 'displayfield',
                    itemId: 'err',
                    hidden: true
                }]
            }],
            buttons: [{
                text: l('Отмена'),
                handler: function () { win.close(); }
            },{
                text: l('Создать'),
                formBind: true,
                handler: function () {
                    var formCmp = win.down('form');
                    var form = formCmp.getForm();
                    var err = formCmp.down('#err');

                    if (!form.isValid()) return;

                    if (err) { err.setHidden(true); err.setValue(''); }

                    var v = form.getValues();

                    var isLeaf = (v.is_leaf === true || v.is_leaf === 'true' || v.is_leaf === 'on' || v.is_leaf === 1 || v.is_leaf === '1');

                    if (isLeaf && (!v.agent_id || v.agent_id === '')) {
                        if (err) {
                            err.setHidden(false);
                            err.setValue('<span style="color:#c00">' + Ext.String.htmlEncode(l('Для конечного узла нужно выбрать agent')) + '</span>');
                        }
                        return;
                    }

                    // IMPORTANT: root -> parent_id must be null for backend
                    var parentId = parent.isRoot() ? null : parent.getId();

                    // create local node (phantom) - TreeStore will call op=create on sync()
                    var node = parent.appendChild({
                        parent_id: parentId,
                        name: v.name,
                        text: v.name,
                        type: v.type,
                        descr: v.descr || '',
                        is_leaf: isLeaf,
                        agent_id: isLeaf ? parseInt(v.agent_id, 10) : null,
                        leaf: isLeaf ? true : true // temporary; backend will return final leaf flag
                    });

                    // if parent had been leaf in UI, flip it
                    parent.set('leaf', false);

                    store.sync({
                        success: function () {
                            parent.expand(false);
                            tree.getSelectionModel().select(node);
                            win.close();
                        },
                        failure: function (batch) {
                            store.rejectChanges();
                            var msg = l('Не удалось создать узел');
                            try {
                                var op = batch && batch.getOperations ? batch.getOperations()[0] : null;
                                var resp = op && op.getError && op.getError().response;
                                if (resp && resp.responseText) {
                                    var r = Ext.decode(resp.responseText, true);
                                    if (r && r.message) msg = r.message;
                                }
                            } catch (e) {}
                            Ext.Msg.alert(l('Ошибка'), Ext.String.htmlEncode(msg));
                        }
                    });
                }
            }]
        });

        win.show();
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
        } catch (e) {}

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
                    width: 32,
                    align: 'right',
                    items: [
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
        xtype: 'store-communal-tree'
    }
);
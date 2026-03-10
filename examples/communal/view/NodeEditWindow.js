Ext.define('Store.communal.view.NodeEditWindow', {
    extend: 'Ext.window.Window',
    xtype: 'communal-node-edit-window',

    modal: true,
    width: 420,
    layout: 'fit',
    bodyPadding: 12,
    resizable: false,
    requires: [
        'Store.communal.store.NodeTypes'
    ],

    config: {
        mode: 'add',          // add | edit
        record: null,
        parentNode: null,
        cars: []
    },

    initComponent: function () {
        var me = this;

        me.title = me.getMode() === 'edit' ? l('Редактировать узел') : l('Добавить узел');

        me.items = [{
            xtype: 'form',
            itemId: 'form',
            defaults: {
                anchor: '100%',
                labelWidth: 140
            },
            items: [{
                xtype: 'textfield',
                name: 'name',
                fieldLabel: l('Название'),
                allowBlank: false
            }, {
                xtype: 'combobox',
                name: 'type',
                fieldLabel: l('Тип'),
                store: {
                    type: 'communal-node-types'
                },
                queryMode: 'local',
                displayField: 'name',
                valueField: 'code',
                editable: false,
                forceSelection: true,
                allowBlank: false,
                listConfig: {
                    itemTpl: [
                        '<div>',
                        '<i class="{icon_cls}" style="width:20px;"></i> ',
                        '{name}',
                        '</div>'
                    ]
                }
            }, {
                xtype: 'checkboxfield',
                name: 'is_leaf',
                fieldLabel: l('Конечный узел'),
                inputValue: true,
                uncheckedValue: false,
                listeners: {
                    change: function (cb, checked) {
                        var form = cb.up('form'),
                            agent = form.down('[name=agent_id]');

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
            }, {
                xtype: 'combobox',
                name: 'agent_id',
                fieldLabel: l('Привязать объект'),
                store: {
                    fields: ['agent_id', 'name'],
                    data: me.getCars() || []
                },
                queryMode: 'local',
                displayField: 'name',
                valueField: 'agent_id',
                editable: true,
                forceSelection: false,
                disabled: true,
                hidden: true,
                allowBlank: true,
                emptyText: l('Выберите объект из PILOT')
            }, {
                xtype: 'textarea',
                name: 'descr',
                fieldLabel: l('Описание'),
                grow: true
            }, {
                xtype: 'displayfield',
                itemId: 'err',
                hidden: true
            }]
        }];

        me.buttons = [{
            text: l('Отмена'),
            handler: function () {
                me.close();
            }
        }, {
            text: me.getMode() === 'edit' ? l('Сохранить') : l('Создать'),
            handler: function () {
                me.submitNode();
            }
        }];

        me.callParent(arguments);
        var typeField = me.down('[name=type]');
        if (typeField && typeField.getStore()) {
            typeField.getStore().load({
                callback: function () {
                    me.fillForm();
                }
            });
        } else {
            me.fillForm();
        }
    },

    fillForm: function () {
        var me = this,
            form = me.down('#form').getForm(),
            rec = me.getRecord(),
            isEdit = me.getMode() === 'edit';

        if (isEdit && rec) {
            form.setValues({
                name: rec.get('name'),
                type: rec.get('type'),
                is_leaf: !!rec.get('is_leaf'),
                agent_id: rec.get('agent_id'),
                descr: rec.get('descr') || ''
            });

            if (rec.get('is_leaf')) {
                var agent = me.down('[name=agent_id]');
                agent.setDisabled(false);
                agent.show();
                agent.allowBlank = false;
            }
        } else {
            form.setValues({
                type: me.guessChildType(me.getParentNode()),
                is_leaf: false
            });
        }
    },

    guessChildType: function (parentNode) {
        var t = parentNode ? parentNode.get('type') : null;
        if (!t) return 'city';
        if (t === 'city') return 'suburb';
        if (t === 'suburb') return 'street';
        if (t === 'street') return 'house';
        if (t === 'house') return 'flat';
        return 'flat';
    },

    getFormValuesNormalized: function () {
        var me = this,
            form = me.down('#form').getForm(),
            v = form.getValues(),
            isLeaf = (v.is_leaf === true || v.is_leaf === 'true' || v.is_leaf === 'on' || v.is_leaf === 1 || v.is_leaf === '1');

        return {
            name: v.name,
            text: v.name,
            type: v.type,
            descr: v.descr || '',
            is_leaf: isLeaf,
            agent_id: isLeaf && v.agent_id ? parseInt(v.agent_id, 10) : null,
            leaf: isLeaf
        };
    },

    submitNode: function () {
        var me = this,
            formCmp = me.down('#form'),
            form = formCmp.getForm(),
            err = me.down('#err'),
            values,
            rec,
            parentNode,
            tree,
            store;

        if (!form.isValid()) return;

        if (err) {
            err.setHidden(true);
            err.setValue('');
        }

        values = me.getFormValuesNormalized();

        if (values.is_leaf && !values.agent_id) {
            err.setHidden(false);
            err.setValue('<span style="color:#c00">' +
                Ext.String.htmlEncode(l('Для конечного узла нужно выбрать agent')) +
                '</span>');
            return;
        }

        rec = me.getRecord();
        parentNode = me.getParentNode();
        tree = me.up('treepanel') || me.tree;
        store = tree.getStore();

        if (me.getMode() === 'add') {
            values.parent_id = parentNode && !parentNode.isRoot() ? parentNode.getId() : null;
            parentNode.appendChild(values);
            parentNode.set('leaf', false);
        } else {
            rec.set(values);
        }

        store.sync({
            success: function () {
                if (me.getMode() === 'add' && parentNode) {
                    parentNode.expand(false);
                }
                me.close();
            },
            failure: function (batch) {
                store.rejectChanges();

                var msg = l('Не удалось сохранить');
                try {
                    var op = batch && batch.getOperations ? batch.getOperations()[0] : null,
                        resp = op && op.getError && op.getError().response;
                    if (resp && resp.responseText) {
                        var r = Ext.decode(resp.responseText, true);
                        if (r && r.message) {
                            msg = r.message;
                        }
                    }
                } catch (e) {}

                Ext.Msg.alert(l('Ошибка'), Ext.String.htmlEncode(msg));
            }
        });
    }
});
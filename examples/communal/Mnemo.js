Ext.define('Store.communal.Mnemo', {
    extend: 'Ext.panel.Panel',
    xtype: 'store-communal-mnemo',
    requires: [
        'Store.communal.MnemoStorage',
        'Store.communal.MnemoRenderer',
        'Store.communal.view.MnemoEditorWindow'
    ],
    layout: 'fit',

    initComponent: function () {
        this.schemaStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: []
        });
        this.schemaRecords = [];
        this.schemaRecord = null;
        this.selectedSchemaId = null;
        this.schema = Store.communal.MnemoStorage.getEmptySchema();
        this.sensorRows = [];
        this.loadRequestNodeId = null;

        this.tbar = {
            cls: 'transparent_buttons',
            items: [
                {
                    xtype: 'combo',
                    itemId: 'mnemoSchemaCombo',
                    flex:1,
                    store: this.schemaStore,
                    queryMode: 'local',
                    editable: false,
                    forceSelection: true,
                    valueField: 'id',
                    displayField: 'name',
                    emptyText: l('Select schema'),
                    listeners: {
                        change: function (field, value) {
                            this.selectSchemaById(value);
                        },
                        scope: this
                    }
                },
                {
                    itemId: 'mnemoAddBtn',
                    tooltip: l('Add'),
                    iconCls: 'fa fa-plus',
                    handler: function () {
                        this.up('store-communal-mnemo').createSchema();
                    }
                },
                {
                    itemId: 'mnemoEditBtn',
                    tooltip: l('Edit'),
                    iconCls: 'fa fa-pencil',
                    disabled: true,
                    handler: function () {
                        this.up('store-communal-mnemo').openEditor();
                    }
                },
                {
                    itemId: 'mnemoDeleteBtn',
                    tooltip: l('Delete'),
                    iconCls: 'fa fa-trash-alt',
                    disabled: true,
                    handler: function () {
                        this.up('store-communal-mnemo').deleteSchema();
                    }
                }
            ]
        };

        this.items = [{
            xtype: 'container',
            itemId: 'mnemoCanvas',
            cls: 'communal-mnemo-panel',
            html: '<div class="communal-mnemo-view-canvas"></div>'
        }];

        this.html = null;
        this.title = l('Mnemo Schema');

        this.listeners = {
            afterrender: function () {
                this.canvasEl = this.down('#mnemoCanvas').getEl().down('.communal-mnemo-view-canvas');
                this.syncSchemaSelector();
                this.renderSchema();
            },
            scope: this
        };

        this.callParent(arguments);
    },

    setCurrentNode: function (record) {
        this.currentNode = record || null;

        if (!this.currentNode) {
            this.clearSchemas();
            this.renderSchema();
            return;
        }

        this.loadSchemas();
    },

    setSensorRows: function (rows) {
        // Re-render the active scheme whenever fresh sensor values arrive.
        this.sensorRows = rows || [];
        this.renderSchema();
    },

    renderSchema: function () {
        if (!this.canvasEl) {
            return;
        }

        if (!this.currentNode) {
            this.canvasEl.dom.innerHTML = '<div class="communal-mnemo-empty">' + l('Select a node to display its mnemonic scheme.') + '</div>';
            return;
        }

        if (!this.schemaRecord || !this.schema || !this.schema.elements || !this.schema.elements.length) {
            this.canvasEl.dom.innerHTML = '<div class="communal-mnemo-empty">' + l('No mnemonic scheme is configured for the selected node.') + '</div>';
            return;
        }

        Store.communal.MnemoRenderer.renderTo(this.canvasEl, this.schema, this.sensorRows);
    },

    clearSchemas: function () {
        this.schemaRecords = [];
        this.schemaRecord = null;
        this.selectedSchemaId = null;
        this.schema = Store.communal.MnemoStorage.getEmptySchema(this.currentNode ? this.currentNode.getId() : null);
        this.syncSchemaSelector();
    },

    getSchemaRecordById: function (schemaId) {
        var selected = null;

        Ext.Array.each(this.schemaRecords || [], function (record) {
            if (Number(record.id) === Number(schemaId)) {
                selected = record;
                return false;
            }
        });

        return selected;
    },

    getNextSchemaName: function () {
        var used = {},
            next = 1;

        Ext.Array.each(this.schemaRecords || [], function (record) {
            var match = String(record.name || '').match(/^Schema\s+(\d+)$/i);

            if (match) {
                used[Number(match[1])] = true;
            }
        });

        while (used[next]) {
            next += 1;
        }

        return 'Schema ' + next;
    },

    applySchemaSelection: function (preferredSchemaId) {
        var selected = preferredSchemaId ? this.getSchemaRecordById(preferredSchemaId) : null;

        if (!selected && this.schemaRecords.length) {
            selected = this.schemaRecords[0];
        }

        this.schemaRecord = selected || null;
        this.selectedSchemaId = selected ? selected.id : null;
        this.schema = selected ? Ext.clone(selected.schema) : Store.communal.MnemoStorage.getEmptySchema(this.currentNode ? this.currentNode.getId() : null);

        this.syncSchemaSelector();
        this.renderSchema();
    },

    syncSchemaSelector: function () {
        var combo = this.down('#mnemoSchemaCombo'),
            editBtn = this.down('#mnemoEditBtn'),
            deleteBtn = this.down('#mnemoDeleteBtn'),
            addBtn = this.down('#mnemoAddBtn'),
            hasNode = !!this.currentNode,
            hasSelected = !!this.schemaRecord;

        this.schemaStore.loadData(Ext.Array.map(this.schemaRecords || [], function (record) {
            return {
                id: record.id,
                name: record.name
            };
        }), false);

        if (combo) {
            combo.suspendEvents(false);
            combo.setDisabled(!hasNode || !this.schemaRecords.length);
            combo.setValue(hasSelected ? this.schemaRecord.id : null);
            combo.resumeEvents();
        }

        if (addBtn) {
            addBtn.setDisabled(!hasNode);
        }

        if (editBtn) {
            editBtn.setDisabled(!hasSelected);
        }

        if (deleteBtn) {
            deleteBtn.setDisabled(!hasSelected);
        }
    },

    selectSchemaById: function (schemaId) {
        var record;

        if (Ext.isEmpty(schemaId)) {
            this.applySchemaSelection(null);
            return;
        }

        record = this.getSchemaRecordById(schemaId);
        if (!record) {
            return;
        }

        this.schemaRecord = record;
        this.selectedSchemaId = record.id;
        this.schema = Ext.clone(record.schema);
        this.syncSchemaSelector();
        this.renderSchema();
    },

    loadSchemas: function (preferredSchemaId) {
        var nodeId;

        if (!this.currentNode) {
            return;
        }

        nodeId = this.currentNode.getId();
        this.loadRequestNodeId = nodeId;
        this.setLoading(true);

        Store.communal.MnemoStorage.loadList(nodeId, {
            success: function (records) {
                if (!this.currentNode || this.currentNode.getId() !== nodeId || this.loadRequestNodeId !== nodeId) {
                    this.setLoading(false);
                    return;
                }

                this.schemaRecords = records || [];
                this.applySchemaSelection(preferredSchemaId);
                this.setLoading(false);
            },
            failure: function () {
                if (this.currentNode && this.currentNode.getId() === nodeId) {
                    this.clearSchemas();
                    this.renderSchema();
                    Ext.Msg.alert(l('Error'), l('Failed to load mnemonic schemes.'));
                }
                this.setLoading(false);
            },
            scope: this
        });
    },

    createSchema: function () {
        if (!this.currentNode) {
            Ext.Msg.alert(l('Mnemo editor'), l('Select a node before creating a mnemonic scheme.'));
            return;
        }

        this.openEditor({
            id: null,
            name: this.getNextSchemaName(),
            schema: Store.communal.MnemoStorage.getEmptySchema(this.currentNode.getId())
        });
    },

    openEditor: function (schemaRecord) {
        schemaRecord = schemaRecord || this.schemaRecord;

        if (!this.currentNode) {
            Ext.Msg.alert(l('Mnemo editor'), l('Select a node before editing its mnemonic scheme.'));
            return;
        }

        if (!schemaRecord) {
            return;
        }

        Ext.create('Store.communal.view.MnemoEditorWindow', {
            nodeRecord: this.currentNode,
            schema: schemaRecord.schema,
            schemaName: schemaRecord.name,
            sensorRows: this.sensorRows,
            saveHandler: function (schemaName, schema) {
                this.setLoading(true);
                Store.communal.MnemoStorage.save(this.currentNode.getId(), schemaRecord.id, schemaName, schema, {
                    success: function (savedRecord) {
                        this.setLoading(false);
                        this.loadSchemas(savedRecord.id);
                    },
                    failure: function () {
                        this.setLoading(false);
                        Ext.Msg.alert(l('Error'), l('Failed to save mnemonic scheme.'));
                    },
                    scope: this
                });
            },
            saveScope: this
        }).show();
    },

    deleteSchema: function () {
        var schemaId;

        if (!this.currentNode || !this.schemaRecord) {
            return;
        }

        schemaId = this.schemaRecord.id;
        this.setLoading(true);
        Store.communal.MnemoStorage.remove(this.currentNode.getId(), schemaId, {
            success: function () {
                this.setLoading(false);
                this.loadSchemas();
            },
            failure: function () {
                this.setLoading(false);
                Ext.Msg.alert(l('Error'), l('Failed to delete mnemonic scheme.'));
            },
            scope: this
        });
    }
});

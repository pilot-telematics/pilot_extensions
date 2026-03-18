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
        this.schema = Store.communal.MnemoStorage.getEmptySchema();
        this.sensorRows = [];
        this.loadRequestNodeId = null;

        this.tbar = {
            cls: 'transparent_buttons',
            items: [
                '->',
                {
                    tooltip: l('Add'),
                    iconCls: 'fa fa-plus',
                    handler: function () {
                        this.up('store-communal-mnemo').openEditor();
                    }
                },
                {
                    tooltip: l('Edit'),
                    iconCls: 'fa fa-pencil',
                    handler: function () {
                        this.up('store-communal-mnemo').openEditor();
                    }
                },
                {
                    tooltip: l('Delete'),
                    iconCls: 'fa fa-trash-alt',
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
                this.renderSchema();
            },
            scope: this
        };

        this.callParent(arguments);
    },

    setCurrentNode: function (record) {
        this.currentNode = record || null;

        if (!this.currentNode) {
            this.schema = Store.communal.MnemoStorage.getEmptySchema();
            this.renderSchema();
            return;
        }

        this.loadSchema();
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

        if (!this.schema || !this.schema.elements || !this.schema.elements.length) {
            this.canvasEl.dom.innerHTML = '<div class="communal-mnemo-empty">' + l('No mnemonic scheme is configured for the selected node.') + '</div>';
            return;
        }

        Store.communal.MnemoRenderer.renderTo(this.canvasEl, this.schema, this.sensorRows);
    },

    loadSchema: function () {
        var nodeId;

        if (!this.currentNode) {
            return;
        }

        nodeId = this.currentNode.getId();
        this.loadRequestNodeId = nodeId;
        this.setLoading(true);

        Store.communal.MnemoStorage.load(nodeId, {
            success: function (schema) {
                if (!this.currentNode || this.currentNode.getId() !== nodeId || this.loadRequestNodeId !== nodeId) {
                    this.setLoading(false);
                    return;
                }

                this.schema = schema;
                this.renderSchema();
                this.setLoading(false);
            },
            failure: function () {
                if (this.currentNode && this.currentNode.getId() === nodeId) {
                    this.schema = Store.communal.MnemoStorage.getEmptySchema(nodeId);
                    this.renderSchema();
                    Ext.Msg.alert(l('Error'), l('Failed to load mnemonic scheme.'));
                }
                this.setLoading(false);
            },
            scope: this
        });
    },

    openEditor: function () {
        if (!this.currentNode) {
            Ext.Msg.alert(l('Mnemo editor'), l('Select a node before editing its mnemonic scheme.'));
            return;
        }

        Ext.create('Store.communal.view.MnemoEditorWindow', {
            nodeRecord: this.currentNode,
            schema: this.schema,
            sensorRows: this.sensorRows,
            saveHandler: function (schema) {
                this.setLoading(true);
                Store.communal.MnemoStorage.save(this.currentNode.getId(), schema, {
                    success: function (savedSchema) {
                        this.schema = savedSchema;
                        this.renderSchema();
                        this.setLoading(false);
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
        if (!this.currentNode) {
            return;
        }

        this.setLoading(true);
        Store.communal.MnemoStorage.remove(this.currentNode.getId(), {
            success: function (emptySchema) {
                this.schema = emptySchema;
                this.renderSchema();
                this.setLoading(false);
            },
            failure: function () {
                this.setLoading(false);
                Ext.Msg.alert(l('Error'), l('Failed to delete mnemonic scheme.'));
            },
            scope: this
        });
    }
});

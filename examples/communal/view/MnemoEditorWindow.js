Ext.define('Store.communal.view.MnemoEditorWindow', {
    extend: 'Ext.window.Window',
    xtype: 'store-communal-mnemo-editor-window',
    requires: [
        'Store.communal.MnemoRenderer'
    ],

    width: 1400,
    height: 820,
    modal: true,
    maximizable: true,
    layout: 'border',
    bodyBorder: false,

    initComponent: function () {
        this.schema = Store.communal.MnemoRenderer.ensureCanvas(Ext.clone(this.schema || {}));
        this.schemaName = Ext.String.trim(this.schemaName || '') || 'Schema 1';
        this.elements = Ext.clone(this.schema.elements || []);
        this.selectedElementId = null;
        this.libraryItems = [];
        this.libraryUrl = base_url + '../store/communal/store/mnemo_library.json';
        this.sensorStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'label', 'vehiclenumber', 'group', 'name'],
            data: this.buildSensorOptions(this.sensorRows)
        });
        this.libraryStore = Ext.create('Ext.data.Store', {
            fields: ['key', 'group', 'title', 'preview', 'insertType'],
            data: []
        });
        this.libraryGroupStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'title'],
            data: []
        });

        this.toolbox = Ext.create('Ext.panel.Panel', {
            region: 'west',
            width: 260,
            split: true,
            title: l('Components'),
            bodyPadding: 8,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [{
                xtype: 'combo',
                itemId: 'libraryGroupCombo',
                margin: '0 0 8 0',
                store: this.libraryGroupStore,
                valueField: 'id',
                displayField: 'title',
                queryMode: 'local',
                editable: false,
                forceSelection: true,
                listeners: {
                    change: function (field, value) {
                        this.filterLibrary(value);
                    },
                    scope: this
                }
            }, {
                xtype: 'dataview',
                itemId: 'libraryView',
                cls: 'communal-mnemo-library',
                flex: 1,
                scrollable: true,
                store: this.libraryStore,
                itemSelector: '.communal-mnemo-library-item',
                tpl: Ext.create('Ext.XTemplate',
                    '<div class="communal-mnemo-library-grid">',
                    '<tpl for=".">',
                    '<div class="communal-mnemo-library-item" title="{title}">',
                    '<div class="communal-mnemo-library-thumb">{preview}</div>',
                    '<div class="communal-mnemo-library-caption">{title}</div>',
                    '</div>',
                    '</tpl>',
                    '</div>'
                ),
                listeners: {
                    itemclick: function (view, record) {
                        this.addLibraryElement(record.getData());
                    },
                    scope: this
                }
            }]
        });

        this.canvasPanel = Ext.create('Ext.panel.Panel', {
            region: 'center',
            bodyCls: 'communal-mnemo-canvas-wrap',
            tbar: {
                cls: 'transparent_buttons',
                items: [{
                    xtype: 'textfield',
                    itemId: 'schemaNameField',
                    fieldLabel: l('Schema name'),
                    flex: 1,
                    value: this.schemaName,
                    listeners: {
                        change: function (field, value) {
                            this.schemaName = Ext.String.trim(value || '');
                        },
                        scope: this
                    }
                }]
            },
            html: '<div class="communal-mnemo-editor-canvas"></div>',
            listeners: {
                afterrender: function (panel) {
                    this.canvasEl = panel.body.down('.communal-mnemo-editor-canvas');
                    panel.body.on('click', function (event) {
                        if (this.suppressSelectionClearUntil && Date.now() < this.suppressSelectionClearUntil) {
                            this.suppressSelectionClearUntil = 0;
                            return;
                        }

                        if (event.getTarget('.communal-mnemo-element')) {
                            return;
                        }

                        this.setSelectedElement(null);
                    }, this);
                    this.renderCanvas();
                },
                scope: this
            }
        });


        this.propertiesForm = Ext.create('Ext.form.Panel', {
            region: 'east',
            width: 330,
            split: true,
            title: l('Properties'),
            disabled: true,
            scrollable: true,
            bodyStyle: 'overflow-y:auto;',
            bodyPadding: 12,
            defaults: {
                anchor: '100%',
                labelWidth: 90,
                defaults: {
                    flex: 1,
                    margin: 2,
                    xtype: 'numberfield',
                    step: 1,
                    listeners: {
                        change: this.onPropertyChange,
                        scope: this
                    }
                }
            },
            items: [
                {
                    xtype: 'container', layout: 'hbox',
                    items: [{
                        xtype: 'textfield',
                        name: 'text',
                        fieldLabel: l('Text')

                    }, {
                        name: 'fontSize',
                        fieldLabel: l('Font size'),
                        minValue: 8
                    }]
                },
                {
                    xtype: 'container', layout: 'hbox',
                    items: [{
                        xtype: 'textfield',
                        name: 'prefix',
                        fieldLabel: l('Prefix')
                    }, {
                        xtype: 'textfield',
                        name: 'suffix',
                        fieldLabel: l('Suffix')
                    }
                    ]
                },
                {
                    xtype: 'combo',
                    name: 'sensor_key',
                    fieldLabel: l('Sensor'),
                    displayField: 'label',
                    valueField: 'id',
                    queryMode: 'local',
                    editable: true,
                    forceSelection: false,
                    store: this.sensorStore,
                    listeners: {
                        change: this.onPropertyChange,
                        scope: this
                    }
                }, {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [{
                        name: 'x',
                        fieldLabel: 'X'
                    }, {
                        name: 'y',
                        fieldLabel: 'Y'

                    }, {
                        name: 'rotation',
                        fieldLabel: l('Rotation')
                    }]
                }, {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [{
                        name: 'width',
                        fieldLabel: l('Width'),
                        minValue: 1
                    }, {
                        name: 'height',
                        fieldLabel: l('Height'),
                        minValue: 1
                    }]
                }, {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [{
                        xtype: 'colorcombobox',
                        fieldLabel: l('Stroke'),
                        name: 'stroke',
                        allowBlank: true,
                        allowNone: true
                    }, {
                        xtype: 'colorcombobox',
                        fieldLabel: l('Fill'),
                        name: 'fillColor',
                        allowBlank: true,
                        allowNone: true
                    }, {
                        xtype: 'colorcombobox',
                        fieldLabel: l('Text color'),
                        name: 'textColor',
                        labelAlign: 'top',
                        allowBlank: true,
                        allowNone: true
                    }]
                }, {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [{
                        name: 'strokeWidth',
                        fieldLabel: l('Stroke width'),
                        minValue: 0,
                        step: 0.5
                    }, {
                        name: 'opacity',
                        fieldLabel: l('Opacity'),
                        minValue: 0,
                        maxValue: 1,
                        step: 0.1
                    }]
                }, {
                    xtype: 'container',
                    layout: 'hbox',
                    items: [{
                        xtype: 'button',
                        tooltip: l('Send to back'),
                        iconCls: "fa fa-send-back",
                        handler: function () {
                            this.up('window').sendSelectedToBack();
                        }
                    }, {
                        xtype: 'button',
                        tooltip: l('Clone selected'),
                        iconCls: "fa fa-clone",
                        handler: function () {
                            this.up('window').duplicateSelectedElement();
                        }
                    }, {
                        xtype: 'button',
                        tooltip: l('Delete selected'),
                        iconCls: "fa fa-trash-can",
                        handler: function () {
                            this.up('window').removeSelectedElement();
                        }
                    }
                    ]
                }
            ]
        });

        this.items = [this.toolbox, this.canvasPanel, this.propertiesForm];
        this.buttons = [{
            text: l('Save'),
            cls: 'save_btn',
            handler: this.saveSchema,
            scope: this
        }, {
            text: l('Cancel'),
            handler: function () {
                this.close();
            },
            scope: this
        }];

        this.title = l('Mnemo editor') + (this.nodeRecord ? ': ' + this.nodeRecord.get('name') : '');

        this.listeners = Ext.apply(this.listeners || {}, {
            afterrender: this.bindEditorKeys,
            scope: this
        });

        this.callParent(arguments);
        this.loadLibraryDefinition();
        this.refreshProperties();
    },

    buildSensorOptions: function (rows) {
        var seen = {},
            options = [];

        Ext.Array.each(rows || [], function (row) {
            var data = row && row.isModel ? row.getData() : row,
                key = data.sensor_key || Store.communal.MnemoRenderer.buildSensorKey(data),
                label;

            if (!key || seen[key]) {
                return;
            }

            seen[key] = true;
            label = [data.vehiclenumber, data.group, data.name].join(' / ').replace(/ \/  \//g, ' / ');

            options.push({
                id: key,
                label: label,
                vehiclenumber: data.vehiclenumber,
                group: data.group,
                name: data.name
            });
        });

        return options;
    },

    normalizeColorForField: function (value) {
        value = String(value || '').replace('#', '').trim();

        return value;
    },

    normalizeColorForSave: function (value) {
        value = String(value || '').replace('#', '').trim();

        if (!value || value.toLowerCase() === '') {
            return value;
        }

        return '#' + value;
    },

    applyLibraryDefinition: function (definition) {
        var groups = definition && Ext.isArray(definition.groups) ? definition.groups : [],
            items = [],
            combo = this.down('#libraryGroupCombo'),
            firstGroupId = null;

        Ext.Array.each(groups, function (group) {
            Ext.Array.each(group.items || [], function (item) {
                var libraryItem = Ext.apply({}, item);

                libraryItem.group = l(group.title);
                libraryItem.groupId = group.id;
                libraryItem.insertType = item.insertType || item.type || 'symbol';
                libraryItem.preview = Store.communal.MnemoRenderer.previewMarkup(item);
                libraryItem.title = l(item.title);

                items.push(libraryItem);
            });
        });

        this.libraryItems = items;
        this.libraryGroupStore.loadData(Ext.Array.map(groups, function (group) {
            return {id: group.id, title: l(group.title)};
        }), false);

        if (groups.length) {
            firstGroupId = groups[0].id;
        }

        if (combo && firstGroupId) {
            combo.setValue(firstGroupId);
        } else {
            this.filterLibrary(firstGroupId);
        }
    },

    mergeLibraryDefinitions: function (definitions) {
        var groups = [];

        Ext.Array.each(definitions || [], function (definition) {
            if (definition && Ext.isArray(definition.groups)) {
                groups = groups.concat(definition.groups);
            }
        });

        return {groups: groups};
    },

    buildLibrarySourceUrl: function (source) {
        if (!source) {
            return null;
        }

        if (/^https?:/i.test(source) || source.indexOf(base_url) === 0) {
            return source;
        }

        return base_url + '../store/communal/store/' + String(source).replace(/^\/+/, '');
    },

    loadLibrarySources: function (sources) {
        var remaining = sources.length,
            loaded = [],
            hasFailure = false;

        if (!remaining) {
            this.applyLibraryDefinition({groups: []});
            return;
        }

        Ext.Array.each(sources, function (source) {
            Ext.Ajax.request({
                url: this.buildLibrarySourceUrl(source),
                method: 'GET',
                success: function (response) {
                    loaded.push(Ext.decode(response.responseText, true) || {groups: []});
                    remaining -= 1;

                    if (remaining === 0) {
                        this.applyLibraryDefinition(this.mergeLibraryDefinitions(loaded));
                    }
                },
                failure: function () {
                    hasFailure = true;
                    remaining -= 1;

                    if (remaining === 0) {
                        this.applyLibraryDefinition(this.mergeLibraryDefinitions(loaded));
                        if (hasFailure) {
                            Ext.Msg.alert(l('Error'), l('Part of the mnemo library failed to load.'));
                        }
                    }
                },
                scope: this
            });
        }, this);
    },

    loadLibraryDefinition: function () {
        Ext.Ajax.request({
            url: this.libraryUrl,
            method: 'GET',
            success: function (response) {
                var data = Ext.decode(response.responseText, true);

                if (data && Ext.isArray(data.sources)) {
                    this.loadLibrarySources(data.sources);
                    return;
                }

                this.applyLibraryDefinition(data || {groups: []});
            },
            failure: function () {
                Ext.Msg.alert(l('Error'), l('Failed to load mnemo library.'));
            },
            scope: this
        });
    },

    filterLibrary: function (groupName) {
        var items = [];

        Ext.Array.each(this.libraryItems, function (item) {
            if (!groupName || item.groupId === groupName) {
                items.push(item);
            }
        });

        this.libraryStore.loadData(items, false);
    },

    createElementConfig: function (type, extraCfg) {
        var id = this.generateElementId();

        switch (type) {
            case 'sensor':
                return Ext.apply({
                    id: id,
                    type: type,
                    x: 250,
                    y: 250,
                    width: 34,
                    height: 34,
                    text: 'P',
                    stroke: '#111111',
                    strokeWidth: 2,
                    fillColor: '',
                    textColor: '',
                    opacity: 1,
                    rotation: 0
                }, extraCfg);
            case 'symbol':
                return Ext.apply({
                    id: id,
                    type: 'symbol',
                    x: 120,
                    y: 120,
                    width: 72,
                    height: 72,
                    baseWidth: 64,
                    baseHeight: 64,
                    stroke: '#111111',
                    strokeWidth: 2,
                    fillColor: '',
                    textColor: '',
                    opacity: 1,
                    rotation: 0,
                    primitives: []
                }, extraCfg);
            case 'value':
                return Ext.apply({
                    id: id,
                    type: type,
                    x: 300,
                    y: 120,
                    width: 120,
                    height: 30,
                    text: '',
                    prefix: '',
                    suffix: '',
                    fontSize: 18,
                    placeholder: 'No data',
                    stroke: '#e2e8f0',
                    strokeWidth: 1,
                    fillColor: '#ffffff',
                    textColor: '',
                    opacity: 1,
                    rotation: 0
                }, extraCfg);
            default:
                return Ext.apply({
                    id: id,
                    type: 'label',
                    x: 300,
                    y: 80,
                    width: 120,
                    height: 30,
                    text: 'Label',
                    fontSize: 18,
                    stroke: '#e2e8f0',
                    strokeWidth: 1,
                    fillColor: '#ffffff',
                    textColor: '',
                    opacity: 1,
                    rotation: 0
                }, extraCfg);
        }
    },

    generateElementId: function () {
        var maxId = 0;

        Ext.Array.each(this.elements || [], function (element) {
            var id = parseInt(element && element.id, 10);

            if (!isNaN(id) && id > maxId) {
                maxId = id;
            }
        });

        return maxId + 1;
    },

    addElement: function (type) {
        var cfg = this.createElementConfig(type);

        this.elements.push(cfg);
        this.selectedElementId = cfg.id;
        this.renderCanvas();
        this.refreshProperties();
    },

    addLibraryElement: function (item) {
        var cfg;

        if (!item) {
            return;
        }

        if (item.insertType === 'value') {
            cfg = this.createElementConfig('value');
        } else if (item.insertType === 'sensor') {
            cfg = this.createElementConfig('sensor', {
                width: Number(item.width || 34),
                height: Number(item.height || 34),
                text: item.text || 'P',
                stemHeight: Number(item.stemHeight || 0)
            });
        } else if (item.insertType === 'label') {
            cfg = this.createElementConfig('label');
        } else {
            cfg = this.createElementConfig('symbol', {
                key: item.key,
                width: Number(item.width || 72),
                height: Number(item.height || 72),
                baseWidth: Number(item.baseWidth || 64),
                baseHeight: Number(item.baseHeight || 64),
                resizeMode: item.resizeMode || 'scale',
                stroke: item.stroke || '#111111',
                strokeWidth: Number(item.strokeWidth || 2),
                fillColor: item.fillColor !== undefined ? item.fillColor : '',
                textColor: item.textColor !== undefined ? item.textColor : '',
                opacity: item.opacity !== undefined ? Number(item.opacity) : 1,
                rotation: item.rotation !== undefined ? Number(item.rotation) : 0,
                primitives: Ext.clone(item.primitives || [])
            });
        }

        this.elements.push(cfg);
        this.selectedElementId = cfg.id;
        this.renderCanvas();
        this.refreshProperties();
    },

    removeSelectedElement: function () {
        if (!this.selectedElementId) {
            return;
        }

        Ext.Array.remove(this.elements, this.getSelectedElement());
        this.selectedElementId = null;
        this.renderCanvas();
        this.refreshProperties();
    },

    duplicateSelectedElement: function () {
        var source = this.getSelectedElement(),
            copy;

        if (!source) {
            return;
        }

        copy = Ext.clone(source);
        copy.id = this.generateElementId();
        copy.x = Number(source.x || 0) + 10;
        copy.y = Number(source.y || 0) + 10;

        this.elements.push(copy);
        this.selectedElementId = copy.id;
        this.renderCanvas();
        this.refreshProperties();
    },

    sendSelectedToBack: function () {
        var element = this.getSelectedElement();

        if (!element) {
            return;
        }

        Ext.Array.remove(this.elements, element);
        this.elements.unshift(element);
        this.renderCanvas();
        this.refreshProperties();
    },

    getSelectedElement: function () {
        var selected = null;

        Ext.Array.each(this.elements, function (element) {
            if (element.id === this.selectedElementId) {
                selected = element;
                return false;
            }
        }, this);

        return selected;
    },

    getElementById: function (id) {
        var found = null;

        Ext.Array.each(this.elements, function (element) {
            if (element.id === id) {
                found = element;
                return false;
            }
        }, this);

        return found;
    },

    bindEditorKeys: function () {
        this.keyMap = Ext.create('Ext.util.KeyMap', {
            target: this.el,
            binding: [{
                key: Ext.event.Event.DELETE,
                handler: function (keyCode, event) {
                    if (this.shouldIgnoreHotkeys(event)) {
                        return;
                    }

                    event.preventDefault();
                    this.removeSelectedElement();
                },
                scope: this
            }, {
                key: Ext.event.Event.LEFT,
                handler: function (keyCode, event) {
                    this.nudgeSelectedElement(-1, 0, event);
                },
                scope: this
            }, {
                key: Ext.event.Event.RIGHT,
                handler: function (keyCode, event) {
                    this.nudgeSelectedElement(1, 0, event);
                },
                scope: this
            }, {
                key: Ext.event.Event.UP,
                handler: function (keyCode, event) {
                    this.nudgeSelectedElement(0, -1, event);
                },
                scope: this
            }, {
                key: Ext.event.Event.DOWN,
                handler: function (keyCode, event) {
                    this.nudgeSelectedElement(0, 1, event);
                },
                scope: this
            }]
        });
    },

    shouldIgnoreHotkeys: function (event) {
        var target = event && event.getTarget ? event.getTarget() : null,
            tagName = target && target.tagName ? target.tagName.toLowerCase() : '';

        return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    },

    nudgeSelectedElement: function (deltaX, deltaY, event) {
        var element = this.getSelectedElement();

        if (this.shouldIgnoreHotkeys(event) || !element) {
            return;
        }

        event.preventDefault();
        element.x = Number(element.x || 0) + deltaX;
        element.y = Number(element.y || 0) + deltaY;
        this.renderCanvas();
        this.updatePositionFields(element.x, element.y);
    },

    setSelectedElement: function (cfg) {
        this.selectedElementId = cfg ? cfg.id : null;
        this.renderCanvas();
        this.refreshProperties();
    },

    setActiveElement: function (cfg) {
        this.selectedElementId = cfg ? cfg.id : null;
        this.refreshProperties();
    },

    renderCanvas: function () {
        if (!this.canvasEl) {
            return;
        }

        this.draw = Store.communal.MnemoRenderer.renderTo(this.canvasEl, {
            canvas: this.schema.canvas,
            elements: this.elements
        }, this.sensorRows, {
            draggable: true,
            selectedId: this.selectedElementId,
            onElementClick: function (cfg) {
                this.setSelectedElement(this.getElementById(cfg.id));
            },
            onElementDragStart: function (cfg) {
                this.setActiveElement(this.getElementById(cfg.id));
            },
            onElementDrag: function (cfg, position) {
                var element = this.getElementById(cfg.id);

                if (!element) {
                    return;
                }

                this.suppressSelectionClearUntil = Date.now() + 250;
                element.x = position.x;
                element.y = position.y;
                this.updatePositionFields(position.x, position.y);
            },
            scope: this
        });
    },

    updatePositionFields: function (x, y) {
        var xField = this.propertiesForm.down('[name=x]'),
            yField = this.propertiesForm.down('[name=y]');

        this.isUpdatingProperties = true;

        if (xField) {
            xField.setValue(Math.round(Number(x || 0)));
        }

        if (yField) {
            yField.setValue(Math.round(Number(y || 0)));
        }

        this.isUpdatingProperties = false;
    },

    refreshProperties: function () {
        var form = this.propertiesForm.getForm(),
            element = this.getSelectedElement();

        this.isUpdatingProperties = true;
        form.reset();

        if (!element) {
            this.propertiesForm.setDisabled(true);
            this.isUpdatingProperties = false;
            return;
        }

        this.propertiesForm.setDisabled(false);
        form.setValues({
            type: element.type,
            text: element.text || '',
            sensor_key: element.sensor_key || '',
            prefix: element.prefix || '',
            suffix: element.suffix || '',
            x: element.x || 0,
            y: element.y || 0,
            width: element.width || 0,
            height: element.height || 0,
            fontSize: element.fontSize || '',
            stroke: this.normalizeColorForField(element.stroke),
            strokeWidth: element.strokeWidth,
            fillColor: this.normalizeColorForField(element.fillColor),
            textColor: this.normalizeColorForField(element.textColor),
            opacity: element.opacity,
            rotation: element.rotation || 0
        });
        this.isUpdatingProperties = false;
    },

    onPropertyChange: function () {
        var formValues,
            element = this.getSelectedElement();

        if (this.isUpdatingProperties || !element || !this.propertiesForm.rendered) {
            return;
        }

        formValues = this.propertiesForm.getForm().getValues();
        element.text = formValues.text || '';
        element.sensor_key = formValues.sensor_key || '';
        element.prefix = formValues.prefix || '';
        element.suffix = formValues.suffix || '';
        element.x = Number(formValues.x || 0);
        element.y = Number(formValues.y || 0);
        element.width = Number(formValues.width || element.width || 0);
        element.height = Number(formValues.height || element.height || 0);
        element.fontSize = Number(formValues.fontSize || element.fontSize || 0);
        element.stroke = this.normalizeColorForSave(formValues.stroke);
        element.strokeWidth = Ext.isEmpty(formValues.strokeWidth) ? element.strokeWidth : Number(formValues.strokeWidth);
        element.fillColor = this.normalizeColorForSave(formValues.fillColor);
        element.textColor = this.normalizeColorForSave(formValues.textColor);
        element.opacity = Ext.isEmpty(formValues.opacity) ? element.opacity : Number(formValues.opacity);
        element.rotation = Ext.isEmpty(formValues.rotation) ? element.rotation : Number(formValues.rotation);

        this.renderCanvas();
    },

    saveSchema: function () {
        var schemaNameField = this.down('#schemaNameField'),
            schemaName = Ext.String.trim(schemaNameField ? schemaNameField.getValue() : this.schemaName || ''),
            schema = {
                canvas: this.schema.canvas,
                elements: this.elements
            };

        if (!schemaName) {
            schemaName = 'Schema 1';
        }

        if (this.saveHandler) {
            this.saveHandler.call(this.saveScope || this, schemaName, schema);
        }

        this.close();
    }
});

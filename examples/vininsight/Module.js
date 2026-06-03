/**
 * VIN Insight - PILOT Extension
 *
 * Decodes vehicle VINs through a server-side Cloudflare Worker proxy.
 * PILOT extension slug: vininsight
 */

Ext.define('Store.vininsight.Module', {
    extend: 'Ext.Component',

    extensionName: 'vininsight',
    sampleVin: '3GCUDHEL3NG668790',
    apiKeyStorageKey: 'vininsight_auto_dev_api_key',

    initModule: function () {
        var me = this;

        if (!window.skeleton || !skeleton.navigation || !skeleton.mapframe) {
            Ext.log('VIN Insight: PILOT skeleton containers are not available');
            return;
        }

        window.vinInsightModule = me;
        me.registerVehicleEditorIntegration();

        me.mainPanel = me.createMainPanel();
        me.navTab = me.createNavigationTab();
        me.navTab.map_frame = me.mainPanel;

        skeleton.navigation.add(me.navTab);
        skeleton.mapframe.add(me.mainPanel);

        me.showEmptyState();
        Ext.log('VIN Insight extension initialized');
    },

    createNavigationTab: function () {
        var me = this;
        var panelClass = Ext.ClassManager.get('Pilot.utils.LeftBarPanel') ?
            'Pilot.utils.LeftBarPanel' :
            'Ext.panel.Panel';

        return Ext.create(panelClass, {
            title: l('VIN Insight'),
            iconCls: 'fa fa-car',
            iconAlign: 'top',
            minimized: true,
            layout: 'fit',
            items: [{
                xtype: 'treepanel',
                title: l('Vehicles'),
                rootVisible: false,
                useArrows: true,
                border: false,
                emptyText: l('No vehicles found'),
                tools: [{
                    xtype: 'button',
                    iconCls: 'fa fa-rotate',
                    tooltip: l('Refresh'),
                    handler: function () {
                        this.up('treepanel').getStore().load();
                    }
                }],
                store: Ext.create('Ext.data.TreeStore', {
                    proxy: {
                        type: 'ajax',
                        url: '/ax/tree.php',
                        extraParams: {
                            vehs: 1,
                            state: 1
                        }
                    },
                    root: {
                        text: 'Vehicles',
                        expanded: true
                    },
                    autoLoad: true
                }),
                columns: [{
                    xtype: 'treecolumn',
                    text: l('Vehicle'),
                    dataIndex: 'name',
                    flex: 2,
                    renderer: me.renderSafeText
                }, {
                    text: 'VIN',
                    dataIndex: 'vin',
                    flex: 2,
                    renderer: function (value) {
                        return me.renderSafeText(value || l('Not specified'));
                    }
                }, {
                    text: l('Model'),
                    dataIndex: 'model',
                    flex: 1,
                    renderer: me.renderSafeText
                }, {
                    text: l('Year'),
                    dataIndex: 'year',
                    width: 75,
                    renderer: me.renderSafeText
                }],
                listeners: {
                    selectionchange: function (tree, selected) {
                        me.onVehicleSelect(selected && selected[0]);
                    }
                }
            }]
        });
    },

    createMainPanel: function () {
        var me = this;

        return Ext.create('Ext.panel.Panel', {
            title: 'VIN Insight',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            bodyPadding: 8,
            defaults: {
                xtype: 'panel',
                bodyPadding: 12,
                margin: '0 8 0 0',
                scrollable: true
            },
            tbar: [{
                xtype: 'button',
                text: l('Decode selected VIN'),
                iconCls: 'fa fa-barcode',
                handler: function () {
                    if (!me.currentVehicle || !me.currentVehicle.vin) {
                        Ext.Msg.alert('VIN Insight', l('Select a vehicle with a VIN first.'));
                        return;
                    }

                    me.decodeVIN(me.currentVehicle.vin);
                }
            }, {
                xtype: 'button',
                text: l('Test proxy'),
                iconCls: 'fa fa-cloud-arrow-up',
                handler: function () {
                    me.decodeVIN(me.sampleVin, true);
                }
            }, {
                xtype: 'button',
                text: l('API key'),
                iconCls: 'fa fa-key',
                handler: function () {
                    me.showApiKeyWindow();
                }
            }, '->', {
                xtype: 'tbtext',
                itemId: 'apiKeyStatus',
                text: me.getApiKeyStatusText()
            }, {
                xtype: 'tbtext',
                itemId: 'proxyStatus',
                text: me.htmlEncode(me.getApiBaseUrl())
            }],
            items: [{
                title: l('Vehicle information'),
                itemId: 'dataPanel',
                flex: 1
            }, {
                title: l('VIN decode response'),
                itemId: 'rawPanel',
                flex: 1,
                margin: 0
            }]
        });
    },

    onVehicleSelect: function (record) {
        if (!record) {
            this.currentVehicle = null;
            this.showEmptyState();
            return;
        }

        this.currentVehicle = {
            name: record.get('name') || record.get('text') || l('Unknown'),
            vin: this.normalizeVin(record.get('vin')),
            model: record.get('model') || l('Unknown'),
            year: record.get('year') || l('Unknown')
        };

        this.showVehicle(this.currentVehicle);
    },

    showEmptyState: function () {
        this.updateDataPanel(
            '<h2>' + this.htmlEncode(l('Select a vehicle')) + '</h2>' +
            '<p>' + this.htmlEncode(l('Choose a vehicle from the left panel to decode its VIN.')) + '</p>'
        );
        this.updateRawPanel(null, 'No API response yet.');
    },

    showVehicle: function (vehicle) {
        var vinHtml = vehicle.vin ?
            this.htmlEncode(vehicle.vin) :
            '<span style="color:#b45309;">' + this.htmlEncode(l('Not specified')) + '</span>';
        var decodeButton = vehicle.vin ?
            '<p style="margin-top:12px;color:#475569;">' +
                this.htmlEncode(l('Use the toolbar button to decode this VIN through the Worker proxy.')) +
            '</p>' :
            '<p style="margin-top:12px;color:#b45309;">' +
                this.htmlEncode(l('This vehicle does not have a VIN assigned.')) +
            '</p>';

        this.updateDataPanel(
            '<h2 style="margin-top:0;">' + this.htmlEncode(vehicle.name) + '</h2>' +
            '<table style="width:100%;border-collapse:collapse;">' +
                this.renderInfoRow('VIN', vinHtml, true) +
                this.renderInfoRow(l('Model'), vehicle.model) +
                this.renderInfoRow(l('Year'), vehicle.year) +
            '</table>' +
            '<div id="vininsight-status" style="margin-top:14px;">' +
                '<strong>' + this.htmlEncode(l('Status')) + ':</strong> ' +
                '<span>' + this.htmlEncode(l('Ready')) + '</span>' +
            '</div>' +
            decodeButton
        );
        this.updateRawPanel(null, 'No API response yet.');
    },

    decodeVIN: function (vin, isTest) {
        var me = this;
        var normalizedVin = me.normalizeVin(vin);

        if (!me.isValidVin(normalizedVin)) {
            Ext.Msg.alert('VIN Insight', l('VIN must be 17 characters and cannot contain I, O, or Q.'));
            return;
        }

        me.setStatus(l('Decoding through Worker proxy...'), '#b45309');
        me.updateRawPanel(null, 'Loading...');

        me.requestVinDecode(normalizedVin, function (data) {
            me.setStatus(isTest ? l('Proxy test succeeded') : l('Decoded'), '#047857');
            me.displayDecodedData(normalizedVin, data);
        }, function (message) {
            me.handleDecodeError(message);
        });
    },

    requestVinDecode: function (vin, successCallback, failureCallback) {
        var me = this;

        Ext.Ajax.request({
            url: me.getVinDecodeUrl(vin),
            method: 'GET',
            headers: me.getApiRequestHeaders(),
            timeout: 30000,
            disableCaching: false,
            success: function (response) {
                var data = me.decodeResponse(response);

                if (!data) {
                    failureCallback('The proxy returned a response that is not valid JSON.');
                    return;
                }

                successCallback(data);
            },
            failure: function (response) {
                failureCallback(me.getErrorMessage(response));
            }
        });
    },

    displayDecodedData: function (vin, data) {
        var rows = [
            this.renderInfoRow('VIN', data.vin || vin),
            this.renderInfoRow(l('Valid'), this.formatValue(data.vinValid)),
            this.renderInfoRow(l('Year'), this.pickValue(data, ['year', 'vehicle.year'])),
            this.renderInfoRow(l('Make'), this.pickValue(data, ['make', 'vehicle.make'])),
            this.renderInfoRow(l('Model'), this.pickValue(data, ['model', 'vehicle.model'])),
            this.renderInfoRow(l('Trim'), data.trim),
            this.renderInfoRow(l('Body'), data.body),
            this.renderInfoRow(l('Engine'), data.engine),
            this.renderInfoRow(l('Drive'), data.drive),
            this.renderInfoRow(l('Transmission'), data.transmission),
            this.renderInfoRow(l('Origin'), data.origin)
        ].join('');

        this.updateDataPanel(
            '<h2 style="margin-top:0;">' + this.htmlEncode(l('Decoded VIN')) + '</h2>' +
            '<table style="width:100%;border-collapse:collapse;">' + rows + '</table>'
        );
        this.updateRawPanel(data);
    },

    handleDecodeError: function (message) {
        this.setStatus(message, '#b91c1c');
        this.updateRawPanel({error: message});
        Ext.Msg.alert('VIN Insight', this.htmlEncode(message));
    },

    updateDataPanel: function (html) {
        var panel = this.mainPanel && this.mainPanel.down('#dataPanel');

        if (panel) {
            panel.update('<div class="vininsight-panel">' + html + '</div>');
        }
    },

    updateRawPanel: function (data, fallbackText) {
        var panel = this.mainPanel && this.mainPanel.down('#rawPanel');
        var text = data ? JSON.stringify(data, null, 2) : (fallbackText || '');

        if (panel) {
            panel.update(
                '<pre style="margin:0;min-height:220px;white-space:pre-wrap;' +
                'font-family:Consolas,Monaco,monospace;font-size:12px;' +
                'background:#f8fafc;border:1px solid #e2e8f0;padding:12px;">' +
                this.htmlEncode(text) +
                '</pre>'
            );
        }
    },

    setStatus: function (text, color) {
        var el = Ext.get('vininsight-status');

        if (el) {
            el.update(
                '<strong>' + this.htmlEncode(l('Status')) + ':</strong> ' +
                '<span style="color:' + color + ';">' + this.htmlEncode(text) + '</span>'
            );
        }
    },

    showApiKeyWindow: function () {
        var me = this;
        var form = Ext.create('Ext.form.Panel', {
            bodyPadding: 14,
            border: false,
            defaults: {
                anchor: '100%',
                labelWidth: 95
            },
            items: [{
                xtype: 'textfield',
                name: 'apiKey',
                fieldLabel: l('API key'),
                inputType: 'password',
                value: me.getUserApiKey(),
                emptyText: l('auto.dev API key')
            }, {
                xtype: 'displayfield',
                fieldLabel: l('Storage'),
                value: me.htmlEncode(l('Saved only in this browser localStorage.'))
            }]
        });

        var win = Ext.create('Ext.window.Window', {
            title: l('VIN Insight API key'),
            modal: true,
            width: 430,
            layout: 'fit',
            items: [form],
            buttons: [{
                text: l('Save'),
                iconCls: 'fa fa-floppy-disk',
                handler: function () {
                    var value = form.getForm().findField('apiKey').getValue();

                    me.setUserApiKey(value);
                    me.updateApiKeyStatus();
                    win.close();
                    Ext.Msg.alert('VIN Insight', l('API key saved for this browser.'));
                }
            }, {
                text: l('Clear'),
                iconCls: 'fa fa-trash',
                handler: function () {
                    me.clearUserApiKey();
                    me.updateApiKeyStatus();
                    win.close();
                }
            }, {
                text: l('Cancel'),
                handler: function () {
                    win.close();
                }
            }]
        });

        win.show();
    },

    registerVehicleEditorIntegration: function () {
        var me = this;

        if (!window.MODULE_OVERRIDER || !MODULE_OVERRIDER.append) {
            Ext.log('VIN Insight: MODULE_OVERRIDER is not available; Vehicle Editor integration skipped');
            return;
        }

        MODULE_OVERRIDER.append('Pilot.view.online.VehicleEditor', function (editorWindow) {
            editorWindow.addListener('afterLoadAgent', function (editor) {
                me.addVehicleEditorButton(editor);
            });
        });
    },

    addVehicleEditorButton: function (editor) {
        var me = this;
        var form = editor && editor.form;
        var toolbar = form && form.getDockedItems ? form.getDockedItems('toolbar[dock="bottom"]')[0] : null;

        if (!toolbar || toolbar.down('#vininsightDecodeEditorButton')) {
            return;
        }

        toolbar.insert(Math.max(toolbar.items.getCount() - 1, 1), {
            xtype: 'button',
            itemId: 'vininsightDecodeEditorButton',
            text: l('Decode VIN'),
            iconCls: 'fa fa-barcode',
            minWidth: 120,
            handler: function () {
                me.decodeVehicleEditorVin(editor);
            }
        });
    },

    decodeVehicleEditorVin: function (editor) {
        var me = this;
        var vinField = editor.down('field[name=vin]');
        var vin = me.normalizeVin(vinField ? vinField.getValue() : '');

        if (!vin && editor.record) {
            vin = me.normalizeVin(editor.record.get('vin'));
        }

        if (!me.isValidVin(vin)) {
            Ext.Msg.alert('VIN Insight', l('VIN must be 17 characters and cannot contain I, O, or Q.'));
            return;
        }

        if (!me.getUserApiKey()) {
            me.showApiKeyWindow();
            return;
        }

        editor.setLoading(l('Decoding VIN...'));
        me.requestVinDecode(vin, function (data) {
            editor.setLoading(false);
            me.fillVehicleEditorFields(editor, vin, data);
        }, function (message) {
            editor.setLoading(false);
            Ext.Msg.alert('VIN Insight', me.htmlEncode(message));
        });
    },

    fillVehicleEditorFields: function (editor, vin, data) {
        var values = this.getVehicleEditorValues(vin, data);
        var filled = [];

        filled = filled.concat(this.setEditorFieldValues(editor, values));
        this.fillCarModelCombos(editor, values);

        Ext.MessageBox.show({
            title: 'VIN Insight',
            msg: this.getFilledFieldsMessage(filled, values),
            buttons: Ext.Msg.OK,
            width: 620
        });
    },

    getFilledFieldsMessage: function (filled, values) {
        var me = this;
        var allRows = [{
            name: 'vin',
            label: 'VIN',
            value: values.vin
        }, {
            name: 'year',
            label: l('Year'),
            value: values.year
        }, {
            name: 'make',
            label: l('Make'),
            value: values.make
        }, {
            name: 'model',
            label: l('Model'),
            value: values.modelText
        }, {
            name: 'trim',
            label: l('Trim'),
            value: values.trim
        }, {
            name: 'engine',
            label: l('Engine'),
            value: values.engine
        }, {
            name: 'engine_cap',
            label: l('Engine capacity'),
            value: values.engine_cap
        }, {
            name: 'engine_horse',
            label: l('Horsepower'),
            value: values.engine_horse
        }];
        var rows = Ext.Array.map(Ext.Array.filter(allRows, function (row) {
            return row.value !== null && row.value !== undefined && row.value !== '';
        }), function (row) {
            var wasFilled = Ext.Array.indexOf(filled, row.name) !== -1 ||
                (row.name === 'make' && Ext.Array.indexOf(filled, 'car_mark') !== -1) ||
                (row.name === 'trim' && Ext.Array.indexOf(filled, 'car_mod') !== -1);

            return '<tr>' +
                '<th style="text-align:left;padding:5px 12px 5px 0;border-bottom:1px solid #e5e7eb;">' +
                    me.htmlEncode(row.label) +
                '</th>' +
                '<td style="padding:5px 12px 5px 0;border-bottom:1px solid #e5e7eb;">' +
                    me.htmlEncode(me.formatValue(row.value)) +
                '</td>' +
                '<td style="padding:5px 0;border-bottom:1px solid #e5e7eb;color:' + (wasFilled ? '#047857' : '#64748b') + ';">' +
                    me.htmlEncode(wasFilled ? l('Filled') : l('Decoded')) +
                '</td>' +
            '</tr>';
        });

        if (!rows.length) {
            return me.htmlEncode(l('VIN decoded, but no usable vehicle data was returned.'));
        }

        return '<div>' +
            '<p style="margin-top:0;">' +
                me.htmlEncode(filled.length ?
                    l('VIN data filled. Review and click Save to update the vehicle.') :
                    l('VIN decoded. No matching editor fields were filled, but decoded data is shown below.')) +
            '</p>' +
            '<table style="border-collapse:collapse;width:100%;">' +
                '<tr>' +
                    '<th style="text-align:left;padding:5px 12px 5px 0;border-bottom:1px solid #cbd5e1;">' + me.htmlEncode(l('Field')) + '</th>' +
                    '<th style="text-align:left;padding:5px 12px 5px 0;border-bottom:1px solid #cbd5e1;">' + me.htmlEncode(l('Value')) + '</th>' +
                    '<th style="text-align:left;padding:5px 0;border-bottom:1px solid #cbd5e1;">' + me.htmlEncode(l('Status')) + '</th>' +
                '</tr>' +
                rows.join('') +
            '</table>' +
        '</div>';
    },

    getVehicleEditorValues: function (vin, data) {
        var make = this.pickDecodedValue(data, ['make', 'make.name', 'vehicle.make', 'vehicle.make.name']);
        var model = this.pickDecodedValue(data, ['model', 'model.name', 'vehicle.model', 'vehicle.model.name']);
        var trim = this.pickDecodedValue(data, ['trim', 'trim.name', 'vehicle.trim', 'vehicle.trim.name']);
        var engine = this.pickDecodedValue(data, [
            'engine',
            'engine.name',
            'engine.description',
            'vehicle.engine',
            'vehicle.engine.name',
            'specifications.engine'
        ]);
        var engineCap = this.pickDecodedValue(data, [
            'engine_cap',
            'engineCapacity',
            'engine.displacement',
            'engine.displacementL',
            'specifications.engineDisplacement'
        ]);
        var horsepower = this.pickDecodedValue(data, [
            'engine_horse',
            'horsepower',
            'engine.horsepower',
            'engine.hp',
            'specifications.horsepower'
        ]);

        return {
            vin: this.pickDecodedValue(data, ['vin', 'vehicle.vin']) || vin,
            year: this.pickDecodedValue(data, ['year', 'vehicle.year']),
            make: make,
            model: model,
            modelText: this.joinNonEmpty([make, model, trim]),
            trim: trim,
            engine: engine,
            engine_cap: engineCap || this.extractEngineCapacity(engine),
            engine_horse: horsepower || this.extractHorsepower(engine)
        };
    },

    pickDecodedValue: function (data, paths) {
        for (var i = 0; i < paths.length; i++) {
            var value = this.getDecodedValue(this.getPath(data, paths[i]));

            if (value !== null && value !== undefined && value !== '') {
                return value;
            }
        }

        return null;
    },

    getDecodedValue: function (value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (Ext.isArray(value)) {
            return this.joinNonEmpty(Ext.Array.map(value, function (item) {
                return this.getDecodedValue(item);
            }, this));
        }

        if (Ext.isObject(value)) {
            return this.pickDecodedValue(value, ['name', 'value', 'text', 'label', 'description', 'display']);
        }

        return value;
    },

    setEditorFieldValues: function (editor, values) {
        var fields = [{
            name: 'vin',
            value: values.vin
        }, {
            name: 'year',
            value: values.year
        }, {
            name: 'model',
            value: values.modelText
        }, {
            name: 'engine',
            value: values.engine
        }, {
            name: 'engine_cap',
            value: values.engine_cap
        }, {
            name: 'engine_horse',
            value: values.engine_horse
        }];
        var filled = [];

        Ext.Array.forEach(fields, function (item) {
            var field = editor.down('field[name=' + item.name + ']');

            if (field && item.value !== null && item.value !== undefined && item.value !== '') {
                field.setValue(item.value);
                filled.push(item.name);
            }
        });

        return filled;
    },

    fillCarModelCombos: function (editor, values) {
        var me = this;
        var carModels = editor.down('pilotcarmodels');

        if (!carModels) {
            return;
        }

        this.selectComboByText(carModels.marksCombo, values.make, function () {
            if (carModels.modelStore && carModels.marksCombo) {
                carModels.modelStore.getProxy().setExtraParam('id', carModels.marksCombo.getValue());
                carModels.modelStore.load(function () {
                    me.selectComboByText(carModels.modelsCombo, values.model, function () {
                        if (carModels.modStore && carModels.modelsCombo) {
                            carModels.modStore.getProxy().setExtraParam('id', carModels.modelsCombo.getValue());
                            carModels.modStore.load(function () {
                                me.selectComboByText(carModels.modCombo, values.trim);
                            });
                        }
                    });
                });
            }
        });
    },

    selectComboByText: function (combo, text, callback, scope) {
        if (!combo || !text || !combo.getStore) {
            if (callback) {
                callback.call(scope || this);
            }
            return false;
        }

        var store = combo.getStore();
        var record = this.findStoreRecordByText(store, text);

        if (!record) {
            if (callback) {
                callback.call(scope || this);
            }
            return false;
        }

        combo.setValue(record.get(combo.valueField || 'id'));
        combo.fireEvent('select', combo, record);

        if (callback) {
            callback.call(scope || this);
        }

        return true;
    },

    findStoreRecordByText: function (store, text) {
        var normalizedText = this.normalizeSearchText(text);
        var match = null;

        if (!store || !normalizedText) {
            return null;
        }

        store.each(function (record) {
            var name = this.normalizeSearchText(record.get('name'));

            if (!name) {
                return;
            }

            if (name === normalizedText || name.indexOf(normalizedText) !== -1 || normalizedText.indexOf(name) !== -1) {
                match = record;
                return false;
            }
        }, this);

        return match;
    },

    extractEngineCapacity: function (engine) {
        var match = String(engine || '').match(/(\d+(?:\.\d+)?)\s*l/i);

        return match ? parseFloat(match[1]) : null;
    },

    extractHorsepower: function (engine) {
        var match = String(engine || '').match(/(\d+)\s*(?:hp|horsepower)/i);

        return match ? parseInt(match[1], 10) : null;
    },

    joinNonEmpty: function (values) {
        return Ext.Array.filter(values, function (value) {
            return value !== null && value !== undefined && value !== '';
        }).join(' ');
    },

    getModuleBaseUrl: function () {
        var scripts = document.getElementsByTagName('script');

        for (var i = scripts.length - 1; i >= 0; i--) {
            var src = scripts[i].src || '';

            if (src.indexOf('/Module.js') !== -1) {
                return src.substring(0, src.lastIndexOf('/') + 1);
            }
        }

        return '/store/' + this.extensionName + '/';
    },

    getApiBaseUrl: function () {
        var override = localStorage.getItem('vininsight_proxy_base');

        if (override) {
            return override.replace(/\/?$/, '/');
        }

        return this.getModuleBaseUrl() + 'api/';
    },

    getVinDecodeUrl: function (vin) {
        return this.getApiBaseUrl() + 'vin/' + encodeURIComponent(vin);
    },

    getApiRequestHeaders: function () {
        var apiKey = this.getUserApiKey();

        if (!apiKey) {
            return {};
        }

        return {
            Authorization: 'Bearer ' + apiKey
        };
    },

    getUserApiKey: function () {
        return (localStorage.getItem(this.apiKeyStorageKey) || '').trim();
    },

    setUserApiKey: function (apiKey) {
        var value = String(apiKey || '').trim();

        if (value) {
            localStorage.setItem(this.apiKeyStorageKey, value);
        } else {
            this.clearUserApiKey();
        }
    },

    clearUserApiKey: function () {
        localStorage.removeItem(this.apiKeyStorageKey);
    },

    updateApiKeyStatus: function () {
        var status = this.mainPanel && this.mainPanel.down('#apiKeyStatus');

        if (status) {
            status.setText(this.getApiKeyStatusText());
        }
    },

    getApiKeyStatusText: function () {
        return this.htmlEncode(this.getUserApiKey() ? l('User API key: saved') : l('User API key: not set'));
    },

    normalizeVin: function (vin) {
        return String(vin || '').replace(/\s+/g, '').toUpperCase();
    },

    normalizeSearchText: function (value) {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^\s+|\s+$/g, '');
    },

    isValidVin: function (vin) {
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
    },

    decodeResponse: function (response) {
        try {
            return Ext.decode(response.responseText);
        } catch (e) {
            return null;
        }
    },

    getErrorMessage: function (response) {
        var data = this.decodeResponse(response);

        if (data && data.error) {
            return data.error;
        }

        return 'Proxy request failed with HTTP ' + (response.status || 0) + '.';
    },

    renderInfoRow: function (label, value, rawHtml) {
        var renderedValue = rawHtml ? value : this.htmlEncode(this.formatValue(value));

        return '<tr>' +
            '<th style="width:145px;text-align:left;vertical-align:top;padding:7px 8px;' +
                'border-bottom:1px solid #e2e8f0;color:#475569;">' +
                this.htmlEncode(label) +
            '</th>' +
            '<td style="padding:7px 8px;border-bottom:1px solid #e2e8f0;">' +
                renderedValue +
            '</td>' +
        '</tr>';
    },

    renderSafeText: function (value) {
        return Ext.String.htmlEncode(value || '');
    },

    htmlEncode: function (value) {
        return Ext.String.htmlEncode(String(value == null ? '' : value));
    },

    formatValue: function (value) {
        if (value === true) {
            return l('Yes');
        }

        if (value === false) {
            return l('No');
        }

        if (value == null || value === '') {
            return l('Not available');
        }

        return String(value);
    },

    pickValue: function (data, paths) {
        for (var i = 0; i < paths.length; i++) {
            var value = this.getPath(data, paths[i]);

            if (value != null && value !== '') {
                return value;
            }
        }

        return null;
    },

    getPath: function (data, path) {
        var parts = path.split('.');
        var current = data;

        for (var i = 0; i < parts.length; i++) {
            if (!current || typeof current !== 'object') {
                return null;
            }

            current = current[parts[i]];
        }

        return current;
    }
});

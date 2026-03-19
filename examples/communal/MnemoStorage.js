Ext.define('Store.communal.MnemoStorage', {
    singleton: true,

    getEmptySchema: function (nodeId) {
        return {
            node_id: nodeId || null,
            canvas: {
                width: 1200,
                height: 800
            },
            elements: []
        };
    },

    getHeaders: function () {
        return Store.communal.Auth.getAuthHeaders();
    },

    normalizeSchema: function (nodeId, schema) {
        var data = Ext.clone(schema || this.getEmptySchema(nodeId));

        data.node_id = nodeId || null;
        data.canvas = data.canvas || {width: 1200, height: 800};
        data.elements = Ext.isArray(data.elements) ? data.elements : [];
        this.ensureUniqueElementIds(data.elements);

        return data;
    },

    ensureUniqueElementIds: function (elements) {
        var seen = {},
            invalidElements = [],
            nextId = 1;

        Ext.Array.each(elements || [], function (element) {
            var rawId = element ? element.id : null,
                trimmed = Ext.isEmpty(rawId) ? '' : String(rawId).trim(),
                id = parseInt(trimmed, 10);

            if (!isNaN(id) && id > 0 && String(id) === trimmed && !seen[id]) {
                element.id = id;
                seen[id] = true;
                if (id >= nextId) {
                    nextId = id + 1;
                }
                return;
            }

            invalidElements.push(element);
        });

        Ext.Array.each(invalidElements, function (element) {
            while (seen[nextId]) {
                nextId += 1;
            }

            element.id = nextId;
            seen[nextId] = true;
            nextId += 1;
        });
    },

    normalizeRecord: function (nodeId, record, index) {
        record = record || {};

        return {
            id: Ext.isEmpty(record.id) ? null : Number(record.id),
            name: record.name || ('Schema ' + Number(index || 1)),
            schema: this.normalizeSchema(nodeId, record.schema)
        };
    },

    loadList: function (nodeId, callbacks) {
        callbacks = callbacks || {};

        Ext.Ajax.request({
            url: '/store/communal/backend/mnemo.php?op=list',
            method: 'GET',
            headers: this.getHeaders(),
            params: {
                node_id: nodeId
            },
            success: function (response) {
                var payload = Ext.decode(response.responseText, true),
                    records = [];

                Ext.Array.each(payload && payload.schemas ? payload.schemas : [], function (record, index) {
                    records.push(this.normalizeRecord(nodeId, record, index + 1));
                }, this);

                Ext.callback(callbacks.success, callbacks.scope || this, [records]);
            },
            failure: function (response) {
                Ext.callback(callbacks.failure, callbacks.scope || this, [response]);
            },
            scope: this
        });
    },

    save: function (nodeId, schemaId, name, schema, callbacks) {
        callbacks = callbacks || {};

        Ext.Ajax.request({
            url: '/store/communal/backend/mnemo.php?op=save',
            method: 'POST',
            headers: Ext.apply({
                'Content-Type': 'application/json'
            }, this.getHeaders()),
            jsonData: {
                node_id: nodeId,
                schema_id: schemaId || null,
                name: name || '',
                schema: this.normalizeSchema(nodeId, schema)
            },
            success: function (response) {
                var payload = Ext.decode(response.responseText, true),
                    record = payload && payload.record ? payload.record : null;

                Ext.callback(callbacks.success, callbacks.scope || this, [this.normalizeRecord(nodeId, record, 1)]);
            },
            failure: function (response) {
                Ext.callback(callbacks.failure, callbacks.scope || this, [response]);
            },
            scope: this
        });
    },

    remove: function (nodeId, schemaId, callbacks) {
        callbacks = callbacks || {};

        Ext.Ajax.request({
            url: '/store/communal/backend/mnemo.php?op=delete',
            method: 'POST',
            headers: Ext.apply({
                'Content-Type': 'application/json'
            }, this.getHeaders()),
            jsonData: {
                node_id: nodeId,
                schema_id: schemaId
            },
            success: function () {
                Ext.callback(callbacks.success, callbacks.scope || this, [schemaId]);
            },
            failure: function (response) {
                Ext.callback(callbacks.failure, callbacks.scope || this, [response]);
            },
            scope: this
        });
    }
});

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

        return data;
    },

    load: function (nodeId, callbacks) {
        callbacks = callbacks || {};

        Ext.Ajax.request({
            url: '/store/communal/backend/mnemo.php?op=read',
            method: 'GET',
            headers: this.getHeaders(),
            params: {
                node_id: nodeId
            },
            success: function (response) {
                var payload = Ext.decode(response.responseText, true),
                    schema = payload && payload.schema ? payload.schema : this.getEmptySchema(nodeId);

                Ext.callback(callbacks.success, callbacks.scope || this, [this.normalizeSchema(nodeId, schema)]);
            },
            failure: function (response) {
                Ext.callback(callbacks.failure, callbacks.scope || this, [response]);
            },
            scope: this
        });
    },

    save: function (nodeId, schema, callbacks) {
        callbacks = callbacks || {};

        Ext.Ajax.request({
            url: '/store/communal/backend/mnemo.php?op=save',
            method: 'POST',
            headers: Ext.apply({
                'Content-Type': 'application/json'
            }, this.getHeaders()),
            jsonData: {
                node_id: nodeId,
                schema: this.normalizeSchema(nodeId, schema)
            },
            success: function (response) {
                var payload = Ext.decode(response.responseText, true),
                    savedSchema = payload && payload.schema ? payload.schema : this.getEmptySchema(nodeId);

                Ext.callback(callbacks.success, callbacks.scope || this, [this.normalizeSchema(nodeId, savedSchema)]);
            },
            failure: function (response) {
                Ext.callback(callbacks.failure, callbacks.scope || this, [response]);
            },
            scope: this
        });
    },

    remove: function (nodeId, callbacks) {
        callbacks = callbacks || {};

        Ext.Ajax.request({
            url: '/store/communal/backend/mnemo.php?op=delete',
            method: 'POST',
            headers: Ext.apply({
                'Content-Type': 'application/json'
            }, this.getHeaders()),
            jsonData: {
                node_id: nodeId
            },
            success: function () {
                Ext.callback(callbacks.success, callbacks.scope || this, [this.getEmptySchema(nodeId)]);
            },
            failure: function (response) {
                Ext.callback(callbacks.failure, callbacks.scope || this, [response]);
            },
            scope: this
        });
    }
});

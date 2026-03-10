Ext.define('Store.communal.store.NodeTypes', {
    extend: 'Ext.data.Store',
    alias: 'store.communal-node-types',

    requires: [
        'Store.communal.Auth'
    ],

    fields: [
        { name: 'id', type: 'string' },
        { name: 'code', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'icon_cls', type: 'string' }
    ],

    proxy: {
        type: 'ajax',
        url: '/store/communal/backend/node_types.php',
        reader: {
            type: 'json',
            rootProperty: 'data'
        }
    },

    listeners: {
        beforeload: function (store) {
            console.log('beforeload node types');
            store.getProxy().setHeaders(
                Store.communal.Auth.getAuthHeaders()
            );
        }
    },

    autoLoad: false
});
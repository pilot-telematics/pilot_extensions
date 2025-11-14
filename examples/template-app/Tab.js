/**
 * Navigation Tab Component
 * This component appears in the left navigation panel
 */

Ext.define('Store.template-app.Tab', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.template-app-tab',

    title: 'Template App',
    iconCls: 'fa fa-rocket',
    iconAlign: 'top',

    initComponent: function() {
        // Example data store
        this.store = Ext.create('Ext.data.Store', {
            fields: ['name', 'value'],
            data: [
                {name: 'Feature 1', value: 'Active'},
                {name: 'Feature 2', value: 'Inactive'},
                {name: 'Feature 3', value: 'Active'}
            ]
        });

        this.columns = [
            { text: 'Feature Name', dataIndex: 'name', flex: 1 },
            { text: 'Status', dataIndex: 'value', width: 80 }
        ];

        // Add a toolbar with buttons
        this.tbar = [{
            text: 'Refresh',
            iconCls: 'fa fa-refresh',
            handler: this.onRefreshClick,
            scope: this
        }, {
            text: 'Settings',
            iconCls: 'fa fa-cog',
            handler: this.onSettingsClick,
            scope: this
        }];

        this.callParent();
    },

    /**
     * Refresh button handler
     */
    onRefreshClick: function() {
        Ext.Msg.alert('Info', 'Refresh functionality would go here');
        // Implement your refresh logic
    },

    /**
     * Settings button handler
     */
    onSettingsClick: function() {
        Ext.Msg.alert('Info', 'Settings dialog would open here');
        // Implement settings functionality
    }
});
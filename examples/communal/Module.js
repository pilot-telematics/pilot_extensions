Ext.define('Store.communal.Module', {
    extend: 'Ext.Component',
    requires: [
        'Store.communal.Auth'
    ],

    initModule: function () {
        // Create the navigation entry shown in the left sidebar.
        var nav = Ext.create('Store.communal.Tab', {});

        // Create the main content panel linked to the navigation tab.
        nav.map_frame = Ext.create('Store.communal.Map', {});

        skeleton.navigation.add(nav);
        skeleton.mapframe.add(nav.map_frame);

        // Load extension-specific styles when the module starts.
        var css = document.createElement('link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', '/store/communal/communal.css');
        document.head.appendChild(css);
    }
});
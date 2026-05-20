/**
 * Template Application - Starter template for PILOT Extensions
 * Use this as a base for your own applications
 */

Ext.define('Store.template_app.Module', {
    extend: 'Ext.Component',

    /**
     * Main initialization function
     */
    initModule: function () {
        console.log('Template application initialized');

        // 1. CREATE NAVIGATION TAB COMPONENT
        var navTab = Ext.create('Store.template_app.Tab', {
            title: 'Template App',
            iconCls: 'fa fa-rocket'
        });

        // 2. CREATE MAIN CONTENT COMPONENT
        var mainPanel = Ext.create('Store.template_app.Map', {
            // Configuration for main panel
        });

        // 3. LINK COMPONENTS TOGETHER
        navTab.map_frame = mainPanel;

        // 4. ADD TO PILOT INTERFACE
        skeleton.navigation.add(navTab);
        skeleton.mapframe.add(mainPanel);

        // 5. LOAD CUSTOM STYLES
        this.loadStyles();

        // 6. LOAD CONFIGURATION (Example)
        this.loadConfig();
    },

    /**
     * Load custom CSS styles
     */
    loadStyles: function() {
        var cssLink = document.createElement("link");
        cssLink.setAttribute("rel", "stylesheet");
        cssLink.setAttribute("type", "text/css");
        cssLink.setAttribute("href", '/store/template_app/style.css');
        document.head.appendChild(cssLink);
    },

    /**
     * Example: Load configuration from JSON file
     */
    loadConfig: function() {
        Ext.Ajax.request({
            url: '/store/template_app/config.json',
            method: 'GET',
            success: function(response) {
                var config = Ext.JSON.decode(response.responseText);
                console.log('Application config loaded:', config);
                // Use configuration in your application
            },
            failure: function() {
                console.warn('Could not load configuration file');
            }
        });
    }
});

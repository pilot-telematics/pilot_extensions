/**
 * Hello World Example - Basic PILOT Extensions Application
 * This is the simplest possible application to demonstrate the basics
 */

Ext.define('Store.hello-world.Module', {
    extend: 'Ext.Component',

    /**
     * Initialization function - called when the application loads
     */
    initModule: function () {
        console.log('Hello World application loaded!');

        // 1. CREATE NAVIGATION TAB FOR LEFT PANEL
        var navTab = Ext.create('Ext.panel.Panel', {
            title: 'Hello World',          // Tab title
            iconCls: 'fa fa-globe',        // FontAwesome icon
            iconAlign: 'top',              // Icon position
            html: `
                <div style="padding: 20px; text-align: center;">
                    <h1>🌍 Hello PILOT Extensions!</h1>
                    <p>This is your first application running in PILOT system.</p>
                    <p>You've successfully:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Created a navigation tab</li>
                        <li>Added content to main area</li>
                        <li>Extended PILOT functionality</li>
                    </ul>
                </div>
            `,
            layout: 'fit'
        });

        // 2. CREATE MAIN CONTENT PANEL
        var mainPanel = Ext.create('Ext.panel.Panel', {
            html: `
                <div style="padding: 30px;">
                    <h2>Welcome to Your First Application!</h2>
                    <p>This panel appears in the main content area of PILOT.</p>
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 5px;">
                        <h3>🎯 What's Next?</h3>
                        <p>Try modifying this code to:</p>
                        <ul>
                            <li>Add buttons with custom functionality</li>
                            <li>Load data from PILOT API</li>
                            <li>Display markers on a map</li>
                            <li>Create interactive components</li>
                        </ul>
                    </div>
                </div>
            `,
            layout: 'fit'
        });

        // 3. LINK NAVIGATION TAB WITH MAIN PANEL
        // This ensures clicking the tab shows the correct content
        navTab.map_frame = mainPanel;

        // 4. ADD COMPONENTS TO PILOT INTERFACE
        skeleton.navigation.add(navTab);       // Add tab to left navigation
        skeleton.mapframe.add(mainPanel);      // Add panel to main area

        // 5. ADD BUTTON TO HEADER (Optional)
        skeleton.header.insert(5, {
            xtype: 'button',
            text: 'Hello!',
            iconCls: 'fa fa-rocket',
            tooltip: 'Click me!',
            handler: function() {
                Ext.Msg.alert('Congratulations!',
                    'Your Hello World application is working! 🎉\n\n' +
                    'Now you can start building more complex applications.');
            }
        });

        // 6. LOAD CUSTOM STYLES
        this.loadStyles();

        console.log('Hello World application initialized successfully!');
    },

    /**
     * Load custom CSS styles for the application
     */
    loadStyles: function() {
        var cssLink = document.createElement("link");
        cssLink.setAttribute("rel", "stylesheet");
        cssLink.setAttribute("type", "text/css");
        cssLink.setAttribute("href", '/store/hello-world/style.css');
        document.head.appendChild(cssLink);
    }
});
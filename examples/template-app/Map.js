/**
 * Main Content Component
 * This component appears in the main content area
 */

Ext.define('Store.template-app.Map', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.template-app-map',

    layout: 'fit',

    initComponent: function() {
        this.html = `
            <div style="padding: 20px;">
                <h1>Your Application Content</h1>
                <p>This is where your main application content goes.</p>
                
                <div style="display: flex; gap: 20px; margin-top: 20px;">
                    <div style="flex: 1; background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <h3>📊 Data Display</h3>
                        <p>Show charts, tables, or other data here.</p>
                    </div>
                    
                    <div style="flex: 1; background: #e8f4fd; padding: 15px; border-radius: 5px;">
                        <h3>🗺️ Map Integration</h3>
                        <p>Display maps, markers, and geodata here.</p>
                    </div>
                </div>
            </div>
        `;

        this.callParent();

        // Initialize map when component is rendered
        this.on('render', this.initializeMap, this);
    },

    /**
     * Initialize map (example)
     */
    initializeMap: function() {
        // Example map initialization
        // Uncomment and customize when you need maps

        /*
        this.map = new MapContainer('template-map');
        this.map.init(55.75, 37.65, 10, this.id + '-body', false);

        // Add example marker
        this.map.addMarker({
            id: "example-marker",
            lat: 55.75,
            lon: 37.65,
            icon: 'https://pilot-gps.com/images/icons/car.png',
            tooltip: {
                msg: "Example Marker",
                options: { direction: 'bottom' }
            }
        });
        */

        console.log('Map component ready for initialization');
    },

    /**
     * Handle component resize
     */
    onResize: function() {
        if (this.map) {
            this.map.checkResize();
        }
    }
});
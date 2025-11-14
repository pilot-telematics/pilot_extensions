Ext.define('Store.airports.Map', {
        extend: 'Ext.panel.Panel',
        xtype: 'store-airports-map',
        cls:'map_canvas',
        bodyCls: 'map_canvas',
        layout: 'fit',

        initComponent: function () {
            this.listeners= {
                render: function () {
                    var zoom = localStorage.getItem('zoom');
                    if (!zoom) {
                        zoom = 4;
                    }
                    var lat = localStorage.getItem('lat');
                    if (!lat) {
                        lat = 55.75;
                    }
                    var lon = localStorage.getItem('lon');
                    if (!lon) {
                        lon = 37.65;
                    }
                    this.map = new MapContainer('airports');
                    this.map.init(lat, lon, zoom, this.id + '-body', false);

                },
                resize: function (me, width, height, oldWidth, oldHeight, eOpts) {
                    this.map.checkResize();
                }
            };

            this.callParent();

        }
    }
);
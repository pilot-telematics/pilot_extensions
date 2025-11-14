Ext.define('Store.planets.Module', {
    extend: 'Ext.Component',
    initModule: function() {
        var nav=Ext.create('Store.planets.Tab',{});
        nav.map_frame = Ext.create('Store.planets.Map',{});

        skeleton.navigation.add(nav);
        skeleton.mapframe.add(nav.map_frame);

        //if you need to load css file
        const css = document.createElement("link");
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("type", "text/css");
        css.setAttribute("href", '/store/planets/planets.css');
        document.getElementsByTagName("head")[0].appendChild(css);

    }
});
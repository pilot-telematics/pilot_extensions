Ext.define('Store.communal.Module', {
    extend: 'Ext.Component',
    requires: [
        'Store.communal.Auth'
    ],

    loadExternalScript: function (url, callback, scope) {
        Ext.Loader.loadScript({
            url: url,
            onLoad: function () {
                Ext.callback(callback, scope || this);
            },
            onError: function () {
                console.log('Cannot load script for communal module:', url);
                Ext.callback(callback, scope || this);
            },
            scope: scope || this
        });
    },

    startModuleUi: function () {
        Ext.Ajax.request({
            url:base_url+'../store/communal/lang/lang.json',
            success:function(response){
                var data=JSON.parse(response.responseText);
                if (data[language]!=null){
                    for(var i in data[language]){
                        if(data[language][i]!==undefined){
                            lang[i]=data[language][i];
                        }
                    }
                }
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
            },
            failure :function(){
                console.log('Cannot load Language for communal module');
            }

        });
    },

    initModule: function () {
        this.loadExternalScript('/resources/js/svg.min.js', function () {
            this.loadExternalScript('/resources/js/svg.draggable.js', function () {
                this.startModuleUi();
            }, this);
        });
    }
});

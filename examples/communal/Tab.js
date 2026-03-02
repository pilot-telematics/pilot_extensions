Ext.define('Store.communal.Tab', {
    extend: 'Pilot.utils.LeftBarPanel',
    xtype: 'store-communal-tab',
    cls: 'tab_clipped leftbarpanel',
    bodyCls: 'left_top_round',
    bodyPadding: '10',
    minimized: true,
    iconCls: 'fa fa-faucet-drip',
    iconAlign: 'top',
    listeners: {
        'show': function () {
            var cmp = this;
            if (!cmp.authorized) {
                Store.communal.Auth.ensure(global_conf.conf.account_id, function (token) {
                    cmp.authorized = true;
                });
            }
        }
    },
    initComponent: function () {
        this.tooltip = l('ЖКХ');
        this.title = l('ЖКХ');
        this.tree = Ext.create('Store.communal.Tree');
        this.items = [this.tree];


        this.callParent(arguments);
    }
});
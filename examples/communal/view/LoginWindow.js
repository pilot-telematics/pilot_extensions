Ext.define('Store.communal.view.LoginWindow', {
    extend: 'Ext.window.Window',
    xtype: 'communal-login-window',

    modal: true,
    closable: true,
    resizable: false,
    width: 380,
    title: l('Communal Authorization'),
    bodyPadding: 12,
    layout: 'fit',

    config: {
        accountId: null
    },

    items: [{
        xtype: 'form',
        reference: 'form',
        defaults: {
            anchor: '100%',
            labelWidth: 90
        },
        items: [{
            xtype: 'displayfield',
            fieldLabel: l('Account'),
            name: 'account_id'
        }, {
            xtype: 'textfield',
            name: 'login',
            fieldLabel: l('Login'),
            allowBlank: false
        }, {
            xtype: 'textfield',
            name: 'password',
            fieldLabel: l('Password'),
            inputType: 'password',
            allowBlank: false
        }, {
            xtype: 'displayfield',
            itemId: 'error',
            hidden: true
        }]
    }],

    buttons: [{
        text: l('Login'),
        formBind: true,
        handler: function (btn) {
            btn.up('window').doLogin();
        }
    }],

    listeners: {
        afterrender: function () {
            var form = this.down('form').getForm();
            form.findField('account_id').setValue(this.getAccountId());

            var loginField = this.down('textfield[name=login]');
            if (loginField) {
                loginField.focus(true, 150);
            }
        }
    },

    doLogin: function () {
        var formCmp = this.down('form'),
            form = formCmp.getForm(),
            err = this.down('#error'),
            v;

        if (!form.isValid()) {
            return;
        }

        err.setHidden(true);
        err.setValue('');

        v = form.getValues();

        formCmp.setLoading(true);

        Ext.Ajax.request({
            url: '/store/communal/backend/auth_login.php',
            method: 'POST',
            jsonData: {
                account_id: parseInt(this.getAccountId(), 10),
                login: v.login,
                password: v.password
            },
            success: function (resp) {
                var data = Ext.decode(resp.responseText, true) || {},
                    msg = data.message || l('Login failed');

                formCmp.setLoading(false);

                if (data.success && data.token) {
                    this.fireEvent('loginsuccess', this, data.token);
                    return;
                }

                err.setHidden(false);
                err.setValue('<span style="color:#c00">' + Ext.String.htmlEncode(l(msg)) + '</span>');
            },
            failure: function (resp) {
                var msg = l('Login failed');

                formCmp.setLoading(false);

                try {
                    var d = Ext.decode(resp.responseText, true);
                    if (d && d.message) {
                        msg = l(d.message);
                    }
                } catch (e) {}

                err.setHidden(false);
                err.setValue('<span style="color:#c00">' + Ext.String.htmlEncode(msg) + '</span>');
            },
            scope: this
        });
    }
});

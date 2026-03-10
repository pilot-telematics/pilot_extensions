Ext.define('Store.communal.Auth', {
    singleton: true,
    requires: [
        'Store.communal.view.LoginWindow'
    ],

    tokenKey: function (accountId) {
        return 'comm_token_' + accountId;
    },

    getToken: function (accountId) {
        return localStorage.getItem(this.tokenKey(accountId)) || '';
    },

    setToken: function (accountId, token) {
        localStorage.setItem(this.tokenKey(accountId), token);
    },

    clearToken: function (accountId) {
        localStorage.removeItem(this.tokenKey(accountId));
    },
    getAuthHeaders: function (accountId) {
        accountId = accountId || (global_conf && global_conf.conf ? global_conf.conf.account_id : null);

        var token = accountId ? localStorage.getItem('comm_token_' + accountId) : null;

        return token ? {
            Authorization: 'Bearer ' + token
        } : {};
    },

    /**
     * Ensures a valid session token exists.
     * - If valid: calls onOk(token)
     * - If missing/expired: shows login window
     */
    ensure: function (accountId, onOk, scope) {
        scope = scope || this;

        var token = this.getToken(accountId);
        if (!token) {
            this.showLogin(accountId, onOk, scope);
            return;
        }

        Ext.Ajax.request({
            url: '/store/communal/backend/session.php?op=check',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            },
            success: function () {
                if (Ext.isFunction(onOk)) {
                    onOk.call(scope, token);
                }
                Ext.GlobalEvents.fireEvent('communal-auth-ok', accountId, token);
            },
            failure: function () {
                this.clearToken(accountId);
                this.showLogin(accountId, onOk, scope);
            },
            scope: this
        });
    },

    showLogin: function (accountId, onOk, scope) {
        scope = scope || this;

        Ext.create('Store.communal.view.LoginWindow', {
            accountId: accountId,
            listeners: {
                loginsuccess: function (win, token) {
                    this.setToken(accountId, token);
                    win.close();

                    if (Ext.isFunction(onOk)) {
                        onOk.call(scope, token);
                    }

                    Ext.GlobalEvents.fireEvent('communal-auth-ok', accountId, token);
                },
                scope: this
            }
        }).show();
    }
});

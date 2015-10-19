(function (App) {
    'use strict';
    var timerEvent;
    var currentIp;
    var VpnConnect = Backbone.Marionette.ItemView.extend({
        template: '#initializing-tpl',
        className: 'init-container',

        ui: {
            initstatus: '.init-status',
            inittext: '.init-text',
            initbar: '#initbar-contents',
            cancelblock: '#cancel-block'
        },

        events: {
            'click .cancel': 'cancelConnexion',
        },

        initialize: function () {
            win.info('Connecting VPN');
        },

        onDestroy: function () {
            clearInterval(timerEvent);
        },

        onShow: function () {
            var self = this;

            this.ui.initbar.animate({
                width: '25%'
            }, 1000, 'swing');

            this.ui.inittext.text(i18n.__('Please, allow ~ 1 minute'));
            this.ui.initstatus.text(i18n.__('Status: Connecting to VPN...'));
            this.ui.cancelblock.show();

            App.VPN.getIp()
                .then(function (currentIp) {
                    // we trigger our connexion
                    App.VpnConnexion = App.VPN.connect().then(function () {

                        // we'll monitor our ip change every 15 sec
                        timerEvent = setInterval(function () {
                            self.monitorIp(currentIp);
                        }, 5000);
                    });
                });

        },

        monitorIp: function (currentIp) {
            this.ui.initstatus.text(i18n.__('Status: Monitoring connection') + ' - ' + currentIp);
            var self = this;
            App.VPN.getIp()
                .then(function (newIp) {

                    win.info('VPN monitoring - IP:', currentIp);
                    win.info('VPN monitoring - IP:', newIp);

                    self.ui.initstatus.text(i18n.__('Status: Monitoring connection') + ' - ' + newIp);

                    // we have a new ip...
                    if (newIp !== currentIp) {

                        self.ui.initstatus.text(i18n.__('Status: Connected'));
                        setTimeout(function () {
                            self.destroy();
                            App.vent.trigger('movies:list');
                        }, 3000);

                    }

                });

        },

        cancelConnexion: function (e) {
            e.preventDefault();
            var self = this;
            // we kill all process
            App.VPN.disconnect()
                .then(function () {
                    App.vent.trigger('movies:list');
                    self.destroy();
                })
                .catch(function () {
                    App.vent.trigger('movies:list');
                    self.destroy();
                });
        }


    });

    App.View.VpnConnect = VpnConnect;
})(window.App);

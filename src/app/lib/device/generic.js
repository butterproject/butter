(function (App) {
    'use strict';

    var self;

    var Device = Backbone.Model.extend({
        defaults: {
            id: 'local',
            type: 'local',
            typeFamily: 'internal',
            name: Settings.projectName
        },
        play: function (streamModel) {
            App.vent.trigger('stream:local', streamModel);
        },
        getID: function () {
            return this.id;
        }
    });

    var DeviceCollection = Backbone.Collection.extend({
        selected: 'local',
        initialize: function () {
            App.vent.on('device:list', this.list);
            App.vent.on('device:pause', this.pause);
            App.vent.on('device:unpause', this.unpause);
            App.vent.on('device:stop', this.stop);
            App.vent.on('device:forward', this.forward);
            App.vent.on('device:backward', this.backward);
            App.vent.on('device:seek', this.seek);
            App.vent.on('device:seekTo', this.seekTo);
            App.vent.on('device:seekPercentage', this.seekPercentage);
            App.vent.on('device:status:update', this.updateStatus);
            self = this;
        },
        list: function () {
            _.each(self.models, function (device) {
                App.vent.trigger('device:add', device);
            });
        },
        pause: function () {
            self.selected.pause();
        },
        unpause: function () {
            self.selected.unpause();
        },
        stop: function () {
            self.selected.stop();
        },
        forward: function () {
            self.selected.forward();
        },
        backward: function () {
            self.selected.backward();
        },
        seek: function (seconds) {
            self.selected.seekBy(seconds);
        },
        seekTo: function (newCurrentTime) {
            self.selected.seekTo(newCurrentTime);
        },
        seekPercentage: function (percentage) {
            self.selected.seekPercentage(percentage);
        },
        updateStatus: function () {
            self.selected.updateStatus();
        },
        startDevice: function (streamModel) {
            if (!this.selected) {
                this.selected = this.models[0];
            }

            if (this.selected.get('typeFamily') === 'external') {
                var srcIp = require('network-address')();
                streamModel.attributes.src = streamModel.attributes.src.replace('127.0.0.1', srcIp);
            }
            return this.selected.play(streamModel);
        },

        setDevice: function (deviceID) {
            this.selected = this.findWhere({
                id: deviceID
            });
        }
    });

    var collection = new DeviceCollection(new Device());
    collection.setDevice('local');

    var ChooserView = Backbone.Marionette.ItemView.extend({
        template: '#player-chooser-tpl',
        events: {
            'click .playerchoicemenu li a': 'selectPlayer'
        },
        onRender: function () {
            var id = this.collection.selected.get('id').replace('\'', '\\\'');
            var el = $('.playerchoicemenu li#player-' + id + ' a');
            this._selectPlayer(el);
        },
        selectPlayer: function (e) {
            this._selectPlayer($(e.currentTarget));
        },
        _selectPlayer: function (el) {
            var player = el.parent('li').attr('id').replace('player-', '');
            collection.setDevice(player);
            $('.playerchoicemenu li a.active').removeClass('active');
            el.addClass('active');
            $('.imgplayerchoice').attr('src', el.children('img').attr('src'));
        }
    });

    var createChooserView = function (el) {
        return new ChooserView({
            collection: collection,
            el: el
        });
    };

    App.Device = {
        Generic: Device,
        Collection: collection,
        ChooserView: createChooserView
    };
})(window.App);

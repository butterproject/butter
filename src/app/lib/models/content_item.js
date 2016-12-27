(function (App) {
    'use strict';

    var _registry = {};

    var ContentItem = Backbone.Model.extend({
        events: {
            'change:torrents': 'updateHealth'
        },
        idAttribute: 'imdb_id',

        initialize: function (attrs) {
            var providers = Object.assign(attrs.providers,
                                                this.getProviders());
            this.set('providers', providers);
            this.set('idAttribute', this.idAttribute);

            providers.metadata &&
                providers.metadata.getImages(attrs)
                .then(this.set.bind(this))
                .catch(e => console.error('error loading metadata', e));

            this.updateHealth();
            this.on('change:torrents', this.updateHealth.bind(this));
        },

        getProviders: function() {
            return {};
        },

        updateHealth: function () {
            var torrents = this.get('torrents');

            if (!torrents) {
                console.error('tried to update health, but still no torrents here', this);
                return false;
            }

            _.each(torrents, function (torrent) {
                torrent.health = Common.healthMap[Common.calcHealth(torrent)];
            });

            this.set('torrents', torrents, {
                silent: true
            });
        }
    });

    App.Model.register = function (type, model) {
        model.type = type;
        _registry[type] = model;
    };

    App.Model.getForType = function (type) {
        return _registry[type] || console.error('Asked for unknown type:', type);
    };

    App.Model.new = function (attrs) {
        var model = App.Model.getForType(attrs.type);
        return new model(attrs);
    };

    App.Model.ContentItem = ContentItem;
})(window.App);

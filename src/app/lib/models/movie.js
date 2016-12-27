(function (App) {
    'use strict';

    var Provider = require('butter-provider');

    var Movie = App.Model.ContentItem.extend({
        getProviders: function() {
            return {
                subtitle: App.Config.getProviderForType('subtitle')
            };
        }
    });

    App.Model.register(Provider.ItemType.MOVIE, Movie);
})(window.App);

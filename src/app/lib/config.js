(function (App) {
    'use strict';

    var Config = {
        title: Settings.projectName,
        platform: process.platform,
        genres: [
            'All',
            'Action',
            'Adventure',
            'Animation',
            'Biography',
            'Comedy',
            'Crime',
            'Documentary',
            'Drama',
            'Family',
            'Fantasy',
            'Film-Noir',
            'History',
            'Horror',
            'Music',
            'Musical',
            'Mystery',
            'Romance',
            'Sci-Fi',
            'Short',
            'Sport',
            'Thriller',
            'War',
            'Western'
        ],

        sorters: [
            'popularity',
            'trending',
            'last added',
            'year',
            'title',
            'rating'
        ],

        sorters_tv: [
            'popularity',
            'trending',
            'updated',
            'year',
            'name',
            'rating'
        ],

        sorters_fav: [
            'watched items',
            'year',
            'title',
            'rating'
        ],

        sorters_anime: [
            'popularity',
            'name'
        ],

        types_anime: [
            'All',
            'Movies',
            'TV',
            'OVA',
            'ONA'
        ],

        types_fav: [
            'All',
            'Movies',
            'TV',
            'Anime'
        ],

        genres_anime: [
            'All',
            'Action',
            'Adventure',
            'Cars',
            'Comedy',
            'Dementia',
            'Demons',
            'Drama',
            'Ecchi',
            'Fantasy',
            'Game',
            'Harem',
            'Historical',
            'Horror',
            'Josei',
            'Kids',
            'Magic',
            'Martial Arts',
            'Mecha',
            'Military',
            'Music',
            'Mystery',
            'Parody',
            'Police',
            'Psychological',
            'Romance',
            'Samurai',
            'School',
            'Sci-Fi',
            'Seinen',
            'Shoujo',
            'Shoujo Ai',
            'Shounen',
            'Shounen Ai',
            'Slice of Life',
            'Space',
            'Sports',
            'Super Power',
            'Supernatural',
            'Thriller',
            'Vampire'
        ],

        genres_tv: [
            'All',
            'Action',
            'Adventure',
            'Animation',
            'Children',
            'Comedy',
            'Crime',
            'Documentary',
            'Drama',
            'Family',
            'Fantasy',
            'Game Show',
            'Home and Garden',
            'Horror',
            'Mini Series',
            'Mystery',
            'News',
            'Reality',
            'Romance',
            'Science Fiction',
            'Soap',
            'Special Interest',
            'Sport',
            'Suspense',
            'Talk Show',
            'Thriller',
            'Western'
        ],

        genres_indie: [
            'All',
            'Action',
            'Adventure',
            'Animation',
            'Biography',
            'Comedy',
            'Crime',
            'Documentary',
            'Drama',
            'Family',
            'Fantasy',
            'Film-Noir',
            'History',
            'Horror',
            'Music',
            'Musical',
            'Mystery',
            'Romance',
            'Sci-Fi',
            'Short',
            'Sport',
            'Thriller',
            'War',
            'Western'
        ],
        sorters_indie: [
            'popularity',
            'updated',
            'year',
            'alphabet',
            'rating'
        ],
        types_indie: [],

        cache: {
            name: 'cachedb',
            version: '1.7',
            tables: ['subtitle'],
            desc: 'Cache database',
            size: 10 * 1024 * 1024
        },

        cachev2: {
            name: 'cache',
            version: 5,
            tables: ['metadata']
        },

        getTabs: function () {
            var tabs = Settings.tabs;
            return Object.keys(tabs)
                .sort((a, b) => (tabs[a].order > tabs[b].order))
                .map(t => (Object.assign({type: t}, tabs[t])));
        },

        getProviderForType: function (type) {
            var provider = Settings.providers[type];

            if (!provider) {
                console.error('Provider type: \'%s\' isn\'t defined in App.Settings.providers', type);
                return null;
            }

            return App.Providers.get(provider);
        },

        getProviderForTabType: function (tabType) {
            var tab = Settings.tabs[tabType];
            var providers = tab.providers;

            if (providers instanceof Array) {
                return providers
                    .map(t => (App.Providers.get(t)));
            } else if (typeof providers === 'object') {
                return Object.values(providers)
                    .map(t => (App.Providers.get(t)));
            }

            console.error ('Couldn\'t find providers list in tab', tab);
            return null;
        },

        getProviderNameForTabType: function (tabType) {
            return this.getProviderForTabType(tabType)
                .map(p => (p.config.tabName));
        },

        getFiltredProviderNames: function (providers) {
            var ret = providers
                .reduce((a, c) => {
                    let n = c.split(':')[0];
                    a[n]++;
                    return a;
                }, {});

            return _.map(ret, function (v, k) {
                return k.concat((v > 1) ? ':' + v : '');
            });
        }

    };

    App.Config = Config;
})(window.App);

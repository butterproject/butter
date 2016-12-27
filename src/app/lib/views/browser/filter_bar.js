(function (App) {
    'use strict';
    var clipboard = nw.Clipboard.get(),
        ButterProvider = require('butter-provider');

    App.View.FilterBar = Backbone.Marionette.LayoutView.extend({
        template: '#filter-bar-tpl',
        className: 'filter-bar',
        ui: {
            searchForm: '.search form',
            searchInput: '.search input',
            search: '.search',
            searchClear: '.search .clear',
        },
        events: {
            'hover  @ui.searchInput': 'focus',
            'submit @ui.searchForm': 'search',
            'contextmenu @ui.searchInput': 'rightclick_search',
            'click  @ui.searchClear': 'clearSearch',
            'click  @ui.search': 'focusSearch',
            'click #filterbar-settings': 'settings',
            'click #filterbar-about': 'about',
            'click #filterbar-random': 'randomMovie',
            'click .contentTab': 'tabClicked',
            'click #filterbar-favorites': 'showFavorites',
            'click #filterbar-watchlist': 'showWatchlist',
            'click #filterbar-torrent-collection': 'showTorrentCollection',
            'click .triggerUpdate': 'updateDB',
        },
        regions: {
            typesDropdown: '#types-dropdown',
            genresDropdown: '#genres-dropdown',
            sortersDropdown: '#sorters-dropdown',
            searchDropdown: '#search-dropdown'
        },
        initialize: function () {
            this.views = {};

            App.vent.on('filter:types', type => (this.model.set({
                keyword: '',
                type: type
            })));

            App.vent.on('filter:genres', genre => (this.model.set({
                keyword: '',
                genre: genre
            })));

            App.vent.on('filter:sorters', sorter => (this.model.set({
                keyword: '',
                sorter: sorter
            })));
        },
        onDestroy: function () {
            App.vent.off('filter:types');
            App.vent.off('filter:genres');
            App.vent.off('filter:sorters');
        },
        focus: function (e) {
            e.focus();
        },
        setActive: function (set) {

            if (Settings.startScreen === 'Last Open') {
                AdvSettings.set('lastTab', set);
            }

            $('.right .search').show();
            $('#filterbar-random').hide();
            $('.filter-bar').find('.active').removeClass('active');
            $(`[data-value="${set}"]`).addClass('active');
            $(`#filterbar-${set}`).addClass('active');
        },
        rightclick_search: function (e) {
            e.preventDefault();
            var search_menu = new this.context_Menu(i18n.__('Cut'), i18n.__('Copy'), i18n.__('Paste'));
            search_menu.popup(e.originalEvent.x, e.originalEvent.y);
        },

        context_Menu: function (cutLabel, copyLabel, pasteLabel) {
            var menu = new nw.Menu(),

                cut = new nw.MenuItem({
                    label: cutLabel || 'Cut',
                    click: function () {
                        document.execCommand('cut');
                    }
                }),

                copy = new nw.MenuItem({
                    label: copyLabel || 'Copy',
                    click: function () {
                        document.execCommand('copy');
                    }
                }),

                paste = new nw.MenuItem({
                    label: pasteLabel || 'Paste',
                    click: function () {
                        var text = clipboard.get('text');
                        $('#searchbox').val(text);
                    }
                });

            menu.append(cut);
            menu.append(copy);
            menu.append(paste);

            return menu;
        },
        loadDropdown: function (type, dropdownClass, attrs) {
            this.views[type] && this.views[type].destroy();
            this.views[type] = new dropdownClass({
                model: new App.Model.Lang(Object.assign({type:type}, attrs))
            });
            this[`${type}Dropdown`].show (this.views[type]);
        },
        loadFilterDropdown: function (filter, attrs) {
            let translateHash = array => (
                array.reduce((a, c, i) => {
                    a[c] = i?i18n.__(c):null;
                    return a;
                }, {})
            );

            var values = this.model.get(filter);
            values && values.length && this.loadDropdown(
                filter,
                App.View.FilterDropdown,
                Object.assign({
                    selected: values[0],
                    values: translateHash(values)
                }, attrs));

        },
        loadComponents: function() {
            this.loadFilterDropdown('types', {
                title: i18n.__('Types')
            });

            this.loadFilterDropdown('genres', {
                title: i18n.__('Genres')
            });

            this.loadFilterDropdown('sorters', {
                title: i18n.__('Sorters')
            });

            this.loadDropdown('search', App.View.SearchDropdown, {
                title: i18n.__('Search')
            });
        },
        onShow: function () {
            this.loadComponents();

            var activetab;

            if (AdvSettings.get('startScreen') === 'Last Open') {
                activetab = AdvSettings.get('lastTab');
            } else {
                activetab = AdvSettings.get('startScreen');
            }

            if (typeof App.currentview === 'undefined') {
                App.currentview = activetab;
                App.previousview = 'movies';
                this.setActive(App.currentview);
            }

            this.$('.tooltipped').tooltip({
                delay: {
                    'show': 800,
                    'hide': 100
                }
            });
            this.$('.providerinfo').tooltip({
                delay: {
                    'show': 50,
                    'hide': 50
                }
            });

            if (Settings.rememberFilters) {
                try {
                    this.fixFilter();
                } catch (e) {}
            }


        },

        focusSearch: function () {
            this.$('.search input').focus();
        },
        search: function (e) {
            App.vent.trigger('about:close');
            App.vent.trigger('torrentCollection:close');
            App.vent.trigger('movie:closeDetail');
            e.preventDefault();
            var searchvalue = this.ui.searchInput.val();
            this.model.set({
                keywords: this.ui.searchInput.val(),
                genre: ''
            });

            this.ui.searchInput.blur();

            if (searchvalue === '') {
                this.ui.searchForm.removeClass('edited');
            } else {
                this.ui.searchForm.addClass('edited');
            }
        },

        clearSearch: function (e) {
            this.ui.searchInput.focus();

            App.vent.trigger('about:close');
            App.vent.trigger('torrentCollection:close');
            App.vent.trigger('movie:closeDetail');

            e.preventDefault();
            this.model.set({
                keywords: '',
                genre: ''
            });

            this.ui.searchInput.val('');
            this.ui.searchForm.removeClass('edited');
        },



        settings: function (e) {
            App.vent.trigger('about:close');
            App.vent.trigger('settings:show');
        },

        about: function (e) {
            App.vent.trigger('about:show');
        },

        showTorrentCollection: function (e) {
            e.preventDefault();

            if (App.currentview !== 'Torrent-collection') {
                App.previousview = App.currentview;
                App.currentview = 'Torrent-collection';
                App.vent.trigger('about:close');
                App.vent.trigger('torrentCollection:show');
                this.setActive('torrentCollection');
            } else {
                App.currentview = App.previousview;
                App.vent.trigger('torrentCollection:close');
                this.setActive(App.currentview);
            }
        },

        tabClicked: function (e) {
            e.preventDefault();
            var value = $(e.currentTarget).attr('data-value');
            return this.switchToTab.apply(this, [value]);
        },

        switchToTab: function (value) {
            App.currentview = value;
            App.vent.trigger('about:close');
            App.vent.trigger('torrentCollection:close');
            App.vent.trigger('show:tab', value);
            this.setActive(value);
        },

        showFavorites: function (e) {
            e.preventDefault();

            if (App.currentview !== 'Favorites') {
                App.previousview = App.currentview;
                App.currentview = 'Favorites';
                App.vent.trigger('about:close');
                App.vent.trigger('torrentCollection:close');
                App.vent.trigger('favorites:list', []);
                this.setActive('favorites');
            } else {

                if ($('#movie-detail').html().length === 0 && $('#about-container').html().length === 0) {
                    App.currentview = App.previousview;
                    App.vent.trigger(App.previousview.toLowerCase() + ':list', []);
                    this.setActive(App.currentview);

                } else {
                    App.vent.trigger('about:close');
                    App.vent.trigger('torrentCollection:close');
                    App.vent.trigger('favorites:list', []);
                    this.setActive('favorites');
                }

            }

        },

        showWatchlist: function (e) {
            e.preventDefault();

            if (App.currentview !== 'Watchlist') {
                App.previousview = App.currentview;
                App.currentview = 'Watchlist';
                App.vent.trigger('about:close');
                App.vent.trigger('torrentCollection:close');
                App.vent.trigger('watchlist:list', []);
                this.setActive('watchlist');
            } else {
                if ($('#movie-detail').html().length === 0 && $('#about-container').html().length === 0) {
                    App.currentview = App.previousview;
                    App.vent.trigger(App.previousview.toLowerCase() + ':list', []);
                    this.setActive(App.currentview);

                } else {
                    App.vent.trigger('about:close');
                    App.vent.trigger('torrentCollection:close');
                    App.vent.trigger('watchlist:list', []);
                    this.setActive('watchlist');
                }

            }
            return false;
        },

        updateDB: function (e) {
            e.preventDefault();
            App.vent.trigger(this.type + ':update', []);
        },

        randomMovie: function () {
            var that = this;
            $('.spinner').show();

            function randomArray(a) {
                return a[Math.floor(Math.random(a.length))];
            }

            var provider = randomArray(App.Providers.getByType(ButterProvider.TabType.MOVIE));
            provider.random()
                .then(function (data) {
                    if (App.watchedMovies.indexOf(data.imdb_code) !== -1) {
                        that.randomMovie();
                        return;
                    }
                    that.model.set({
                        isRandom: true,
                        keywords: data.imdb_code,
                        genre: ''
                    });
                    App.vent.trigger('movie:closeDetail');
                    App.vent.on('list:loaded', function () {
                        if (that.model.get('isRandom')) {
                            $('.main-browser .items .cover')[0].click();
                            that.model.set('isRandom', false);
                        }
                    });
                })
                .catch(function (err) {
                    $('.spinner').hide();
                    $('.notification_alert').text(i18n.__('Error loading data, try again later...')).fadeIn('fast').delay(2500).fadeOut('fast');
                });
        }

    });
})(window.App);

(function (App) {
    'use strict';

    var prevX = 0;
    var prevY = 0;

    var Item = Backbone.Marionette.ItemView.extend({
        template: '#item-tpl',

        tagName: 'li',
        className: 'item',

        attributes: function () {
            return {
                'data-imdb-id': this.model.get('imdb_id')
            };
        },

        ui: {
            coverImage: '.cover-image',
            cover: '.cover',
            bookmarkIcon: '.actions-favorites',
            watchedIcon: '.actions-watched'
        },
        events: {
            'click .actions-favorites': 'toggleFavorite',
            'click .actions-watched': 'toggleWatched',
            'click .cover': 'showDetail',
            'mouseover .cover': 'hoverItem'
        },

        initialize: function () {
            this.setModelStates();
            this.isAprilFools();
        },

        onShow: function () {
            this.loadImage();
            this.setCoverStates();
            this.setTooltips();
        },

        hoverItem: function (e) {
            if (e.pageX !== prevX || e.pageY !== prevY) {
                $('.item.selected').removeClass('selected');
                $(this.el).addClass('selected');
                prevX = e.pageX;
                prevY = e.pageY;
            }
        },

        isAprilFools: function () {
            var date = new Date();
            var today = ('0' + (date.getMonth() + 　1)).slice(-2) + ('0' + (date.getDate())).slice(-2);
            if (today === '0401') { //april's fool
                var title = this.model.get('title');
                var titleArray = title.split(' ');
                var modified = false;
                var toModify;
                if (titleArray.length !== 1) {
                    for (var i = 0; i < titleArray.length; i++) {
                        if (titleArray[i].length > 3 && !modified) {
                            if (Math.floor((Math.random() * 10) + 1) > 5) { //random
                                titleArray[i] = Settings.projectName;
                                modified = true;
                            }
                        }
                    }
                }
                this.model.set('title', titleArray.join(' '));
            }
        },

        setModelStates: function () {
            // Watched state
            var imdb = this.model.get('imdb_id');
            var itemtype = this.model.get('type');
            var watched = false;

            if (itemtype.match('movie')) {
                watched = App.watchedMovies.indexOf(imdb) !== -1;
            } else if (itemtype.match('show')) {
                watched = App.watchedShows.indexOf(imdb) !== -1;
            }

            this.model.set('watched', watched);

            // Bookmarked state
            var bookmarked = App.userBookmarks.indexOf(imdb) !== -1;
            this.model.set('bookmarked', bookmarked);
        },

        setCoverStates: function () {
            var itemtype = this.model.get('type');

            if (this.model.get('bookmarked') || itemtype.match('bookmarked')) {
                this.ui.bookmarkIcon.addClass('selected');
            }

            if (itemtype.match('movie') && this.model.get('watched')) {
                this.ui.watchedIcon.addClass('selected');

                switch (Settings.watchedCovers) {
                    case 'fade':
                        this.$el.addClass('watched');
                        break;
                    case 'hide':
                        if ($('.search input').val()) {
                            this.$el.addClass('watched');
                        } else {
                            this.$el.remove();
                        }
                        break;
                }
            }

            if (itemtype.match('show')) {
                this.ui.watchedIcon.remove();
            }
        },

        loadImage: function () {
            var noimg = 'images/posterholder.png';

            var coverUrl = function () {
                var images = this.model.get('images') || {};
                var poster = this.model.get('cover');
                return images.poster || poster || noimg;
            }.bind(this)();

            var setImage = function (img) {
                this.ui.cover.css('background-image', 'url(' + img + ')').addClass('fadein');
                this.ui.coverImage.remove();
            }.bind(this);

            var coverCache = new Image();
            coverCache.src = coverUrl;

            coverCache.onload = function () {
                if (coverUrl.indexOf('.gif') !== -1) { // freez gifs
                    var c = document.createElement('canvas');
                    var w  = c.width = coverCache.width;
                    var h = c.height = coverCache.height;

                    c.getContext('2d').drawImage(coverCache, 0, 0, w, h);
                    coverUrl = c.toDataURL();
                }
                setImage(coverUrl);
            };
            coverCache.onerror = function (e) {
                setImage(noimg);
            };
        },

        setTooltips: function () {
            this.ui.watchedIcon.attr('data-original-title', this.ui.watchedIcon.hasClass('selected') ? i18n.__('Mark as unseen') : i18n.__('Mark as Seen')).tooltip();
            this.ui.bookmarkIcon.attr('data-original-title', this.ui.bookmarkIcon.hasClass('selected') ? i18n.__('Remove from bookmarks') : i18n.__('Add to bookmarks')).tooltip();
        },

        showDetail: function (e) {
            e.preventDefault();

            var realtype = this.model.get('type');
            var itemtype = realtype.replace('bookmarked', '');
            var modelType = itemtype.charAt(0).toUpperCase() + itemtype.slice(1); // 'Movie', 'Show'
            var provider = App.Providers.get(this.model.get('provider'));

            // bookmarked movies are cached
            if (realtype === 'bookmarkedmovie') {
                return App.vent.trigger('movie:showDetail', this.model);
            }

            // display the spinner
            $('.spinner').show();
            provider.detail(this.model.get('imdb_id'), this.model.attributes).then(function (data) {
                $('.spinner').hide();

                // inject provider's name
                data.provider = provider.name;

                // load details
                App.vent.trigger(itemtype + ':showDetail', new App.Model[modelType](data));
            }).catch(function (err) {
                win.error(err);
                $('.spinner').hide();
                $('.notification_alert').text(i18n.__('Error loading data, try again later...')).fadeIn('fast').delay(2500).fadeOut('fast');
            });
        },

        toggleWatched: function (e) {
            e.stopPropagation();
            e.preventDefault();

            var watched = !this.model.get('watched');
            var imdb = this.model.get('imdb_id');
            var dbCall = watched ? 'markMovieAsWatched' : 'markMovieAsNotWatched';
            var appEvent = watched ? 'movie:watched' : 'movie:unwatched';

            // set watched state
            this.model.set('watched', watched);

            // add/delete db item
            Database[dbCall]({
                imdb_id: imdb,
                from_browser: true
            }, true);

            // reset cover state to default
            this.ui.watchedIcon.removeClass('selected');
            this.$el.removeClass('watched');

            // set cover state
            this.setCoverStates();
            this.setTooltips();

            // event propagation
            App.vent.trigger(appEvent, {
                imdb_id: imdb
            }, 'seen');
        },

        toggleFavorite: function (e) {
            e.stopPropagation();
            e.preventDefault();

            var that = this;
            var provider = App.Providers.get(this.model.get('provider'));
            var data;

            switch (this.model.get('type')) {
                case 'bookmarkedshow':
                case 'bookmarkedmovie':
                    Database.deleteBookmark(this.model.get('imdb_id')).then(function () {
                        win.info('Bookmark deleted (' + that.model.get('imdb_id') + ')');
                        App.userBookmarks.splice(App.userBookmarks.indexOf(that.model.get('imdb_id')), 1);
                        return Database.deleteMovie(that.model.get('imdb_id'));
                    }).then(function () {
                        // we'll delete this element from our list view
                        $(e.currentTarget).closest('li').animate({
                            paddingLeft: '0px',
                            paddingRight: '0px',
                            width: '0%',
                            opacity: 0
                        }, 500, function () {
                            $(this).remove();
                            $('.items').append($('<li/>').addClass('item ghost'));
                            if ($('.items li[data-imdb-id]').length === 0) {
                                App.vent.trigger('favorites:render');
                            }
                        });
                    });
                    break;

                case 'movie':
                    if (this.model.get('bookmarked')) {
                        this.ui.bookmarkIcon.removeClass('selected');
                        Database.deleteBookmark(this.model.get('imdb_id'))
                            .then(function () {
                                win.info('Bookmark deleted (' + that.model.get('imdb_id') + ')');
                                // we'll make sure we dont have a cached movie
                                return Database.deleteMovie(that.model.get('imdb_id'));
                            })
                            .then(function () {
                                that.model.set('bookmarked', false);
                            });
                    } else {
                        this.ui.bookmarkIcon.addClass('selected');

                        if (this.model.get('imdb_id').indexOf('mal') !== -1 && this.model.get('item_data') === 'Movie') {
                            // Anime
                            data = provider.detail(this.model.get('imdb_id'), this.model.attributes)
                                .catch(function () {
                                    $('.notification_alert').text(i18n.__('Error loading data, try again later...')).fadeIn('fast').delay(2500).fadeOut('fast');
                                })
                                .then(function (data) {
                                    var movie = {
                                        imdb_id: data.imdb_id,
                                        image: data.image,
                                        cover: data.cover,
                                        torrents: data.torrents,
                                        title: data.title,
                                        genre: data.genre,
                                        synopsis: data.synopsis,
                                        runtime: data.runtime,
                                        year: data.year,
                                        health: that.model.get('health'),
                                        subtitle: data.subtitle,
                                        backdrop: undefined,
                                        rating: data.rating,
                                        trailer: false,
                                        provider: that.model.get('provider'),
                                    };

                                    Database.addMovie(movie)
                                        .then(function (idata) {
                                            return Database.addBookmark(that.model.get('imdb_id'), 'movie');
                                        })
                                        .then(function () {
                                            win.info('Bookmark added (' + that.model.get('imdb_id') + ')');
                                            that.model.set('bookmarked', true);
                                            App.userBookmarks.push(that.model.get('imdb_id'));
                                        });
                                });
                        } else {
                            // Movie
                            var movie = {
                                imdb_id: this.model.get('imdb_id'),
                                image: this.model.get('image'),
                                cover: this.model.get('cover'),
                                images: this.model.get('images'),
                                torrents: this.model.get('torrents'),
                                title: this.model.get('title'),
                                genre: this.model.get('genre'),
                                synopsis: this.model.get('synopsis'),
                                runtime: this.model.get('runtime'),
                                year: this.model.get('year'),
                                health: this.model.get('health'),
                                subtitle: this.model.get('subtitle'),
                                backdrop: this.model.get('backdrop'),
                                rating: this.model.get('rating'),
                                trailer: this.model.get('trailer'),
                                provider: this.model.get('provider'),
                            };

                            Database.addMovie(movie)
                                .then(function () {
                                    return Database.addBookmark(that.model.get('imdb_id'), 'movie');
                                })
                                .then(function () {
                                    win.info('Bookmark added (' + that.model.get('imdb_id') + ')');
                                    App.userBookmarks.push(that.model.get('imdb_id'));
                                    that.model.set('bookmarked', true);
                                });
                        }
                    }
                    break;
                case 'show':
                    if (this.model.get('bookmarked') === true) {
                        this.ui.bookmarkIcon.removeClass('selected');
                        this.model.set('bookmarked', false);
                        Database.deleteBookmark(this.model.get('imdb_id'))
                            .then(function () {
                                win.info('Bookmark deleted (' + that.model.get('imdb_id') + ')');

                                App.userBookmarks.splice(App.userBookmarks.indexOf(that.model.get('imdb_id')), 1);

                                // we'll make sure we dont have a cached show
                                Database.deleteTVShow(that.model.get('imdb_id'));
                            });
                    } else {
                        data = provider.detail(this.model.get('imdb_id'), this.model.attributes)
                            .then(function (data) {
                                data.provider = that.model.get('provider');
                                promisifyDb(db.tvshows.find({
                                        imdb_id: that.model.get('imdb_id').toString(),
                                    }))
                                    .then(function (res) {
                                        if (res != null && res.length > 0) {
                                            return Database.updateTVShow(data);
                                        } else {
                                            return Database.addTVShow(data);
                                        }
                                    })
                                    .then(function (idata) {
                                        return Database.addBookmark(that.model.get('imdb_id'), 'tvshow');
                                    })
                                    .then(function () {
                                        win.info('Bookmark added (' + that.model.get('imdb_id') + ')');
                                        that.ui.bookmarkIcon.addClass('selected');
                                        that.model.set('bookmarked', true);
                                        App.userBookmarks.push(that.model.get('imdb_id'));
                                    }).catch(function (err) {
                                        win.error('promisifyDb()', err);
                                    });
                            }).catch(function (err) {
                                win.error('provider.detail()', err);
                                $('.notification_alert').text(i18n.__('Error loading data, try again later...')).fadeIn('fast').delay(2500).fadeOut('fast');
                            });
                    }
                    break;

            }

            this.setTooltips();
        }

    });

    App.View.Item = Item;
})(window.App);

(function (App) {
    'use strict';

    var API_ENDPOINT = URI('https://api-v2launch.trakt.tv'),
        CLIENT_ID = api_defines.get('trakttv').client_id,
        CLIENT_SECRET = api_defines.get('trakttv').client_secret,
        REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

    var isValid = function (id) {
        if (!id || id.toString().indexOf('mal') > -1 || id.toString().indexOf('-') > -1) {
            return false;
        } else {
            return true;
        }
    };

    function TraktTv() {
        App.Providers.CacheProviderV2.call(this, 'metadata');

        this.authenticated = false;

        var self = this;
        // Bind all "sub" method calls to TraktTv
        _.each(this.calendars, function (method, key) {
            self.calendars[key] = method.bind(self);
        });
        _.each(this.movies, function (method, key) {
            self.movies[key] = method.bind(self);
        });
        _.each(this.recommendations, function (method, key) {
            self.recommendations[key] = method.bind(self);
        });
        _.each(this.shows, function (method, key) {
            self.shows[key] = method.bind(self);
        });
        _.each(this.episodes, function (method, key) {
            self.episodes[key] = method.bind(self);
        });
        _.each(this.sync, function (method, key) {
            self.sync[key] = method.bind(self);
        });

        // Bind all custom functions to TraktTv
        _.each(this.oauth, function (method, key) {
            self.oauth[key] = method.bind(self);
        });
        _.each(this.syncTrakt, function (method, key) {
            self.syncTrakt[key] = method.bind(self);
        });

        // Refresh token on startup if needed
        setTimeout(function () {
            self.oauth.checkToken();
        }, 500);
    }

    /*
     * Cache
     */

    inherits(TraktTv, App.Providers.CacheProviderV2);

    function MergePromises(promises) {
        return Q.all(promises).then(function (results) {
            return _.unique(_.flatten(results));
        });
    }

    TraktTv.prototype.config = {
        name: 'Trakttv'
    };

    TraktTv.prototype.cache = function (key, ids, func) {
        var self = this;
        return this.fetch(ids).then(function (items) {
            var nonCachedIds = _.difference(ids, _.pluck(items, key));
            return MergePromises([
                Q(items),
                func(nonCachedIds).then(self.store.bind(self, key))
            ]);
        });
    };

    /*
     * Trakt v2
     * METHODS (http://docs.trakt.apiary.io/)
     */

    TraktTv.prototype.get = function (endpoint, getVariables) {
        var defer = Q.defer();

        getVariables = getVariables || {};


        var requestUri = API_ENDPOINT.clone()
            .segment(endpoint)
            .addQuery(getVariables);

        request({
            method: 'GET',
            url: requestUri.toString(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Settings.traktToken,
                'trakt-api-version': '2',
                'trakt-api-key': CLIENT_ID
            }
        }, function (error, response, body) {
            if (error || !body) {
                defer.reject(error);
            } else if (response.statusCode >= 400) {
                defer.resolve({});
            } else {
                defer.resolve(Common.sanitize(JSON.parse(body)));
            }
        });


        return defer.promise;
    };

    TraktTv.prototype.post = function (endpoint, postVariables) {
        var defer = Q.defer();

        postVariables = postVariables || {};

        var requestUri = API_ENDPOINT.clone()
            .segment(endpoint);

        request({
            method: 'POST',
            url: requestUri.toString(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Settings.traktToken,
                'trakt-api-version': '2',
                'trakt-api-key': CLIENT_ID
            },
            body: JSON.stringify(postVariables)
        }, function (error, response, body) {
            if (error || !body) {
                defer.reject(error);
            } else if (response.statusCode >= 400) {
                defer.resolve({});
            } else {
                defer.resolve(Common.sanitize(JSON.parse(body)));
            }
        });

        return defer.promise;
    };

    TraktTv.prototype.delete = function (endpoint, getVariables) {
        var defer = Q.defer();

        getVariables = getVariables || {};


        var requestUri = API_ENDPOINT.clone()
            .segment(endpoint)
            .addQuery(getVariables);

        request({
            method: 'DELETE',
            url: requestUri.toString(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + Settings.traktToken,
                'trakt-api-version': '2',
                'trakt-api-key': CLIENT_ID
            }
        }, function (error, response, body) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve({});
            }
        });


        return defer.promise;
    };

    TraktTv.prototype.calendars = {
        myShows: function (startDate, days) {
            var endpoint = 'calendars/my/shows';

            if (startDate && days) {
                endpoint += '/' + startDate + '/' + days;
            }

            return this.get(endpoint)
                .then(function (item) {
                    var calendar = [];
                    for (var i in item) {
                        calendar.push({
                            show_title: item[i].show.title,
                            show_id: item[i].show.ids.imdb,
                            aired: item[i].first_aired.split('T')[0],
                            episode_title: item[i].episode.title,
                            season: item[i].episode.season,
                            episode: item[i].episode.number,
                        });
                    }
                    return calendar;
                });
        }
    };

    TraktTv.prototype.movies = {
        summary: function (id) {
            return this.get('movies/' + id, {
                extended: 'full,images'
            });
        },
        aliases: function (id) {
            return this.get('movies/' + id + '/aliases');
        },
        translations: function (id, lang) {
            return this.get('movies/' + id + '/translations/' + lang);
        },
        comments: function (id) {
            return this.get('movies/' + id + '/comments');
        },
        related: function (id) {
            return this.get('movies/' + id + '/related');
        }
    };

    TraktTv.prototype.recommendations = {
        movies: function () {
            return this.get('recommendations/movies', {
                extended: 'full,images'
            });
        },
        hideMovie: function (id) {
            return this.delete('recommendations/movies/' + id);
        },
        shows: function () {
            return this.get('recommendations/shows', {
                extended: 'full,images'
            });
        },
        hideShow: function (id) {
            return this.delete('recommendations/shows/' + id);
        },
    };

    TraktTv.prototype.scrobble = function (action, type, id, progress) {
        if (type === 'movie') {
            return this.post('scrobble/' + action, {
                movie: {
                    ids: {
                        imdb: id
                    }
                },
                progress: progress
            });
        }
        if (type === 'episode') {
            return this.post('scrobble/' + action, {
                episode: {
                    ids: {
                        tvdb: id
                    }
                },
                progress: progress
            });
        }
    };

    TraktTv.prototype.search = function (query, type, year) {
        return this.get('search', {
            query: query,
            type: type,
            year: year
        });
    };

    TraktTv.prototype.shows = {
        summary: function (id) {
            return this.get('shows/' + id, {
                extended: 'full,images'
            });
        },
        aliases: function (id) {
            return this.get('shows/' + id + '/aliases');
        },
        translations: function (id, lang) {
            return this.get('shows/' + id + '/translations/' + lang);
        },
        comments: function (id) {
            return this.get('shows/' + id + '/comments');
        },
        watchedProgress: function (id) {
            if (!id) {
                return Q();
            }
            return this.get('shows/' + id + '/progress/watched');
        },
        updates: function (startDate) {
            return this.get('shows/updates/' + startDate)
                .then(function (data) {
                    return data;
                });
        },
        related: function (id) {
            return this.get('shows/' + id + '/related');
        }
    };

    TraktTv.prototype.episodes = {
        summary: function (id, season, episode) {
            return this.get('shows/' + id + '/seasons/' + season + '/episodes/' + episode, {
                extended: 'full,images'
            });
        }
    };

    TraktTv.prototype.sync = {
        lastActivities: function () {
            var defer = Q.defer();
            this.get('sync/last_activities')
                .then(function (data) {
                    defer.resolve(data);
                });
            return defer.promise;
        },
        playback: function (type, id) {
            var defer = Q.defer();

            if (type === 'movie') {
                this.get('sync/playback/movies', {
                    limit: 50
                }).then(function (results) {
                    results.forEach(function (result) {
                        if (result.movie.ids.imdb.toString() === id) {
                            defer.resolve(result.progress);
                        }
                    });
                }).catch(function (err) {
                    defer.reject(err);
                });
            }

            if (type === 'episode') {
                this.get('sync/playback/episodes', {
                    limit: 50
                }).then(function (results) {
                    results.forEach(function (result) {
                        if (result.episode.ids.tvdb.toString() === id) {
                            defer.resolve(result.progress);
                        }
                    });
                }).catch(function (err) {
                    defer.reject(err);
                });
            }

            return defer.promise;
        },
        getWatched: function (type) {
            if (type === 'movies') {
                return this.get('sync/watched/movies')
                    .then(function (data) {
                        return data;
                    });
            }
            if (type === 'shows') {
                return this.get('sync/watched/shows')
                    .then(function (data) {
                        return data;
                    });
            }
        },
        addToHistory: function (type, id) {
            if (type === 'movie') {
                return this.post('sync/history', {
                    movies: [{
                        ids: {
                            imdb: id
                        }
                    }]
                });
            }
            if (type === 'episode') {
                return this.post('sync/history', {
                    episodes: [{
                        ids: {
                            tvdb: id
                        }
                    }]
                });
            }
        },
        removeFromHistory: function (type, id) {
            if (type === 'movie') {
                return this.post('sync/history/remove', {
                    movies: [{
                        ids: {
                            imdb: id
                        }
                    }]
                });
            }
            if (type === 'episode') {
                return this.post('sync/history/remove', {
                    episodes: [{
                        ids: {
                            tvdb: id
                        }
                    }]
                });
            }
        },
        getWatchlist: function (type) {
            return this.get('sync/watchlist/' + type);
        }
    };

    TraktTv.prototype.users = {
        hiddenItems: function (type) {
            return this.get('users/hidden/' + type)
                .then(function (data) {
                    return data;
                });
        }
    };

    /*
     *  General
     * FUNCTIONS
     */

    TraktTv.prototype.oauth = {
        authenticate: function () {
            var defer = Q.defer();
            var self = this;

            trakt.get_codes().then(function(poll) {
                $('#authTraktCode input').val(poll.user_code);
                nw.Shell.openExternal(poll.verification_url);
                return trakt.poll_access(poll);
            }).then(function (auth) {
                trakt.import_token(auth);
                AdvSettings.set('traktToken', auth.access_token);
                AdvSettings.set('traktTokenRefresh', auth.refresh_token);
                AdvSettings.set('traktTokenTTL', auth.expires_in);
                self.authenticated = true;
                App.vent.trigger('system:traktAuthenticated');
                defer.resolve(true);
            }).catch(function (err) {
                AdvSettings.set('traktToken', '');
                AdvSettings.set('traktTokenTTL', '');
                AdvSettings.set('traktTokenRefresh', '');
                defer.reject(err);
            });

            return defer.promise;
        },
        checkToken: function () {
            var self = this;
            if (Settings.traktTokenTTL <= new Date().valueOf() && Settings.traktTokenRefresh !== '') {
                win.info('Trakt: refreshing access token');
                this._authenticationPromise = self.post('oauth/token', {
                    refresh_token: Settings.traktTokenRefresh,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: 'refresh_token'
                }).then(function (data) {
                    if (data.access_token && data.expires_in && data.refresh_token) {
                        Settings.traktToken = data.access_token;
                        trakt.import_token({
                            expires: new Date().valueOf() + data.expires_in * 1000,
                            access_token: data.access_token,
                            refresh_token: data.refresh_token
                        });
                        AdvSettings.set('traktToken', data.access_token);
                        AdvSettings.set('traktTokenRefresh', data.refresh_token);
                        AdvSettings.set('traktTokenTTL', new Date().valueOf() + data.expires_in * 1000);
                        self.authenticated = true;
                        App.vent.trigger('system:traktAuthenticated');
                        return true;
                    } else {
                        AdvSettings.set('traktToken', '');
                        AdvSettings.set('traktTokenTTL', '');
                        AdvSettings.set('traktTokenRefresh', '');
                        return false;
                    }
                });
            } else if (Settings.traktToken !== '') {
                this.authenticated = true;
                trakt.import_token({
                    expires: Settings.traktTokenTTL,
                    access_token: Settings.traktToken,
                    refresh_token: Settings.traktTokenRefresh
                });
                App.vent.trigger('system:traktAuthenticated');
            }
        }
    };

    TraktTv.prototype.syncTrakt = {
        isSyncing: function () {
            return this.syncing && this.syncing.isPending();
        },
        all: function () {
            var self = this;
            AdvSettings.set('traktLastSync', new Date().valueOf());
            return this.syncing = Q.all([self.syncTrakt.movies(), self.syncTrakt.shows()]);
        },
        movies: function () {
            return this.sync.getWatched('movies')
                .then(function (data) {
                    var watched = [];

                    if (data) {
                        var movie;
                        for (var m in data) {
                            try { //some movies don't have imdbid
                                movie = data[m].movie;
                                watched.push({
                                    movie_id: movie.ids.imdb.toString(),
                                    date: new Date(),
                                    type: 'movie'
                                });
                            } catch (e) {
                                win.warn('Cannot sync a movie (' + data[m].movie.title + '), the problem is: ' + e.message + '. Continuing sync without this movie...');
                            }
                        }
                    }

                    return watched;
                })
                .then(function (traktWatched) {
                    win.debug('Trakt: marked %s movie(s) as watched', traktWatched.length);
                    return Database.markMoviesWatched(traktWatched);
                });
        },
        shows: function () {
            return this.sync.getWatched('shows')
                .then(function (data) {
                    // Format them for insertion
                    var watched = [];

                    if (data) {
                        var show;
                        var season;
                        for (var d in data) {
                            show = data[d];
                            for (var s in show.seasons) {
                                season = show.seasons[s];
                                try { //some shows don't return IMDB
                                    for (var e in season.episodes) {
                                        watched.push({
                                            tvdb_id: show.show.ids.tvdb.toString(),
                                            imdb_id: show.show.ids.imdb.toString(),
                                            season: season.number.toString(),
                                            episode: season.episodes[e].number.toString(),
                                            type: 'episode',
                                            date: new Date()
                                        });
                                    }
                                } catch (e) {
                                    win.warn('Cannot sync a show (' + show.show.title + '), the problem is: ' + e.message + '. Continuing sync without this show...');
                                    break;
                                }
                            }
                        }
                    }

                    return watched;
                })
                .then(function (traktWatched) {
                    // Insert them locally
                    win.debug('Trakt: marked %s episode(s) as watched', traktWatched.length);
                    return Database.markEpisodesWatched(traktWatched);
                });
        }
    };

    function onShowWatched(show, channel) {
        win.debug('Mark Episode as watched on channel:', channel);
        switch (channel) {
        case 'database':
            setTimeout(function () {
                App.Providers.get('Watchlist').fetch({
                    update: show.imdb_id
                }).then(function () {
                    App.vent.trigger('watchlist:list');
                });
            }, 2000);
            break;
        case 'seen':
            /* falls through */
        default:
            App.Trakt.sync.addToHistory('episode', show.episode_id);
            break;
        }
    }

    function onShowUnWatched(show, channel) {
        win.debug('Mark Episode as unwatched on channel:', channel);
        switch (channel) {
        case 'database':
            break;
        case 'seen':
            /* falls through */
        default:
            App.Trakt.sync.removeFromHistory('episode', show.episode_id);
            break;
        }
    }

    function onMoviesWatched(movie, channel) {
        win.debug('Mark Movie as watched on channel:', channel);
        switch (channel) {
        case 'database':
            try {
                switch (Settings.watchedCovers) {
                case 'fade':
                    $('li[data-imdb-id="' + App.MovieDetailView.model.get('imdb_id') + '"] .actions-watched').addClass('selected');
                    $('li[data-imdb-id="' + App.MovieDetailView.model.get('imdb_id') + '"]').addClass('watched');
                    break;
                case 'hide':
                    $('li[data-imdb-id="' + App.MovieDetailView.model.get('imdb_id') + '"]').remove();
                    break;
                }
                $('.watched-toggle').addClass('selected').text(i18n.__('Seen'));
                App.MovieDetailView.model.set('watched', true);
            } catch (e) {}
            break;
        case 'seen':
            /* falls through */
        default:
            App.Trakt.sync.addToHistory('movie', movie.imdb_id);
            break;
        }
    }

    function onMoviesUnWatched(movie, channel) {
        win.debug('Mark Movie as unwatched on channel:', channel);
        switch (channel) {
        case 'database':
            break;
        case 'seen':
            /* falls through */
        default:
            App.Trakt.sync.removeFromHistory('movie', movie.imdb_id);
            break;
        }
    }

    App.vent.on('show:watched', onShowWatched);
    App.vent.on('show:unwatched', onShowUnWatched);
    App.vent.on('movie:watched', onMoviesWatched);
    App.vent.on('movie:unwatched', onMoviesUnWatched);

    App.Providers.Trakttv = TraktTv;
    App.Providers.install(TraktTv);
})(window.App);

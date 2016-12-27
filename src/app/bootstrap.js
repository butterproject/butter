(function (App) {
    'use strict';
    App.start();

    /* load all the things ! */
    var Q = require('q');
    var fs = require('fs');
    var Provider = require('butter-provider');

    function loadLocalProviders() {
        var appPath = '';
        var providerPath = './src/app/lib/providers/';

        var files = fs.readdirSync(providerPath);

        return files.map(function (file) {
            if (!file.match(/\.js$/)) {
                return null;
            }

            if (file.match(/generic.js$/)) {
                return null;
            }

            //console.log('loading local provider', file);

            var q = Q.defer();

            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');

            script.type = 'text/javascript';
            script.src = 'lib/providers/' + file;

            script.onload = function () {
                //console.log('loaded', file);
                q.resolve(file);
            };

            head.appendChild(script);

            return q.promise;
        }).filter(function (q) {
            return q;
        });
    }

    function loadFromNPM(name, fn) {
        var P = require(name);

        return Q(fn(P));
    }

    function loadFromPackageJSON(regex, fn) {
        App.Npm = require('../../package.json');

        var packages = Object.keys(App.Npm.dependencies).filter(function (p) {
            return p.match(regex);
        });

        return packages.map(function (name) {
            //console.log('loading npm', regex, name);
            return loadFromNPM(name, fn);
        });
    }

    function loadNpmProviders() {
        return loadFromPackageJSON(/butter-provider-/, App.Providers.install);
    }

    function loadNpmSettings() {
        return Q.all(loadFromPackageJSON(/butter-settings-/, function (settings) {
            Settings = _.extend(Settings, settings);
        }));
    }

    function loadProviders() {
        return Q.all(loadLocalProviders().concat(loadNpmProviders()));
    }

    App.bootstrapPromise = loadNpmSettings()
        .then(loadProviders)
        .then(values => (
            Object.keys(Settings.tabs)
                .map(tabType => ({
                    provider: App.Config.getProviderForTabType(tabType),
                    tabType: tabType
                })).filter(p => (p.provider))
        )).then(providers =>  {
            App.TabTypes = providers
                .map(p => ({
                    type: p.type,
                    tabType: p.provider.config ?
                        p.provider.config.type :
                        p.provider.map(p => (p.config.type)),
                    name: p.provider.name ||
                        p.provider.map(p => (p.name))
                })).reduce((a, c) => {
                    a[c.type] = c.name;
                    return a;
                }, {});

            return providers;
        });
})(window.App);

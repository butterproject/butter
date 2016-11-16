/** Global variables **/
var
    _ = require('underscore'),
    async = require('async'),
    inherits = require('util').inherits,
    Q = require('q'),

    // Machine readable
    os = require('os'),
    moment = require('moment'),
    crypt = require('crypto'),
    semver = require('semver'),

    // Files
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),

    // Compression
    tar = require('tar'),
    AdmZip = require('adm-zip'),
    zlib = require('zlib'),

    // Encoding/Decoding
    charsetDetect = require('jschardet'),
    iconv = require('iconv-lite'),

    // GUI
    win = nw.Window.get(),
    data_path = nw.App.dataPath,
    i18n = require('i18n'),

    // Connectivity
    url = require('url'),
    tls = require('tls'),
    http = require('http'),
    request = require('request'),

    // Web
    querystring = require('querystring'),
    URI = require('urijs'),
    Trakt = require('trakt.tv'),
    trakt = new Trakt({
        client_id: api_defines.get('trakttv').client_id,
        client_secret: api_defines.get('trakttv').client_secret,
        plugins: ['ondeck', 'matcher', 'images'],
        options: {
            images: {
                smallerImages: true,
                fanartApiKey: api_defines.get('fanart').api_key,
                tvdbApiKey: api_defines.get('tvdb').api_key,
                tmdbApiKey: api_defines.get('tmdb').api_key
            }
        }
    }),

    // Torrent engines
    WebTorrent = require('webtorrent'),

    // NodeJS
    child = require('child_process');

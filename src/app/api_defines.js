var keys = {
    opensubtitles: {
        useragent: 'Butter'
    },
    trakttv: {
        client_id: '647c69e4ed1ad13393bf6edd9d8f9fb6fe9faf405b44320a6b71ab960b4540a2',
        client_secret: 'f55b0a53c63af683588b47f6de94226b7572a6f83f40bd44c58a7c83fe1f2cb1',
    },
    tvshowtime: {
        client_id: 'iM2Vxlwr93imH7nwrTEZ',
        client_secret: 'ghmK6ueMJjQLHBwsaao1tw3HUF7JVp_GQTwDwhCn'
    },
    fanart: {
        api_key: 'a3c13d3f5a36201ae3951707f342fd08'
    },
    tvdb: {
        api_key: '80A769280C71D83B'
    },
    tmdb: {
        api_key: '1a83b1ecd56e3ac0e509b553b68c77a9'
    }
};

var api_defines = {
    get: function (key) {
        if (keys[key]) {
            return keys[key];
        } else {
            return {};
        }
    }
};
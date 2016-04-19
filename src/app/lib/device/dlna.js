(function (App) {
    'use strict';
    var dlnacasts = require('dlnacasts')();
    var xmlb = require('xmlbuilder');
    var collection = App.Device.Collection;


    var makeID = function (baseID) {
        return 'dlna-' + baseID.replace('-', '');
    };

    var Dlna = App.Device.Generic.extend({
        defaults: {
            type: 'dlna',
            typeFamily: 'external'
        },
        makeID: makeID,

        initialize: function (attrs) {
            this.player = attrs.player;
            this.attributes.name = this.player.name;
            this.attributes.address = this.player.host;
        },

        play: function (streamModel) {
            var url = streamModel.get('src');
            var self = this;
            var media;
            var url_video = url;
            var url_subtitle = 'http:' + url.split(':')[1] + ':9999/video.srt';
            var metadata = null;
            var subtitle = streamModel.get('subFile');
            if (subtitle) {
                media = {
                    title: streamModel.get('title'),
                    images: streamModel.get('cover'),
                    subtitles: ['http:' + url.split(':')[1] + ':9999/subtitle.vtt'],

                    subtitles_style: {
                        backgroundColor: AdvSettings.get('subtitle_decoration') === 'Opaque Background' ? '#000000FF' : '#00000000', // color of background - see http://dev.w3.org/csswg/css-color/#hex-notation
                        foregroundColor: AdvSettings.get('subtitle_color') + 'ff', // color of text - see http://dev.w3.org/csswg/css-color/#hex-notation
                        edgeType: AdvSettings.get('subtitle_decoration') === 'Outline' ? 'OUTLINE' : 'NONE', // border of text - can be: "NONE", "OUTLINE", "DROP_SHADOW", "RAISED", "DEPRESSED"
                        edgeColor: '#000000FF', // color of border - see http://dev.w3.org/csswg/css-color/#hex-notation
                        fontScale: ((parseFloat(AdvSettings.get('subtitle_size')) / 28) * 1.3).toFixed(1), // size of the text - transforms into "font-size: " + (fontScale*100) +"%"
                        fontStyle: 'NORMAL', // can be: "NORMAL", "BOLD", "BOLD_ITALIC", "ITALIC",
                        fontFamily: 'Helvetica',
                        fontGenericFamily: 'SANS_SERIF', // can be: "SANS_SERIF", "MONOSPACED_SANS_SERIF", "SERIF", "MONOSPACED_SERIF", "CASUAL", "CURSIVE", "SMALL_CAPITALS",
                        windowColor: '#00000000', // see http://dev.w3.org/csswg/css-color/#hex-notation
                        windowRoundedCornerRadius: 0, // radius in px
                        windowType: 'NONE' // can be: "NONE", "NORMAL", "ROUNDED_CORNERS"
                    }
                };
            } else {
                media = {
                    images: cover,
                    title: streamModel.get('title')
                };
            }
            win.info('DLNA: play ' + url + ' on \'' + this.get('name') + '\'');
            win.info('DLNA: connecting to ' + this.player.host);

            self.player.play(url_video, media , function (err, status) {
              if (err) {
                win.error('DLNA.play error: ', err);
              } else {
                win.info('Playing ' + url + ' on ' + self.get('name'));
                self.set('loadedMedia', status.media);
              }
            });
    this.player.on('status', function (status) {
                  self._internalStatusUpdated(status);
              });
          },

        stop: function () {
            this.player.stop();
        },

        pause: function () {
            this.player.pause();
        },

        forward: function () {
            this.player.seek(30);
        },

        backward: function () {
            this.player.seek(-30);
        },

        seek: function (seconds) {
            win.info('DLNA: seek %s', seconds);
            this.get('player').seek(seconds, function (err, status) {
                if (err) {
                    win.error('DLNA.seek:Error', err);
                }
            });
        },
        seekTo: function (newCurrentTime) {
            win.info('DLNA: seek to %ss', newCurrentTime);
            this.get('player').seek(newCurrentTime, function (err, status) {
                if (err) {
                    win.error('DLNA.seek:Error', err);
                }
            });
        },

        seekPercentage: function (percentage) {
          console.log(this);
            win.info('DLNA: seek percentage %s%', percentage.toFixed(2));
            var newCurrentTime = this.player._status.duration / 100 * percentage;
            this.seekTo(newCurrentTime.toFixed());
        },

        unpause: function () {
            this.player.play();
        },
        updateStatus: function () {
            var self = this;
            this.get('player').status(function (err, status) {
                if (err) {
                    return win.info('DLNA.updateStatus:Error', err);
                }
                self._internalStatusUpdated(status);
            });
        },

        _internalStatusUpdated: function (status) {
          if (status  === undefined) {
              status = this.player._status;
          }
            // If this is the active device, propagate the status event.
            if (collection.selected.id === this.id) {
              console.log(status);
                App.vent.trigger('device:status', status);
            }
        }
    });


    dlnacasts.on('update', function (player) {
        if (collection.where({
                id: player.host
            }).length === 0) {
            win.info('Found DLNA Device: %s at %s', player.name, player.host);
            collection.add(new Dlna({
                id: player.host,
                player: player
            }));
        }
    });

    win.info('Scanning: Local Network for DLNA devices');
    dlnacasts.update();


    App.Device.Dlna = Dlna;
})(window.App);

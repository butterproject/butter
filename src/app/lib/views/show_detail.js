(function(App) {
    "use strict";
        

    var ShowDetail = Backbone.Marionette.ItemView.extend({
        template: '#show-detail-tpl',
        className: 'shows-container-contain',

        ui: {
            tabsContainer: "#tabs_container div",
            seasonsList: "#tabs_season li"
        },
        events: {
            'click .startStreaming': 'startStreaming',
            'click .tv-container-close': 'closeDetails',
            'click #tabs_season li': 'clickTab',
            'click .EpisodeData': 'clickEpisode',
        },

        onShow: function() {
            this.ui.seasonsList.first().attr("id","current_season"); // Activate first tab
            this.ui.tabsContainer.fadeOut(); // hide all tabs tabs_container
            this.ui.tabsContainer.first().fadeIn(); // Show first tab tabs_container   
            $(".filter-bar").hide();    

             var background = $(".tv-poster-background").attr("data-bgr");
              $('<img/>').attr('src', background).load(function() {
                $(this).remove();
                $(".tv-poster-background").css('background-image', "url(" + background + ")");
                $(".tv-poster-background").fadeIn( 300 );
              });     
        },

        startStreaming: function(e) {
            e.preventDefault();
            var torrentStart = new Backbone.Model({torrent: $(e.currentTarget).attr('data-torrent'), backdrop: this.model.get('images').fanart, type: "episode", id: $(e.currentTarget).attr('data-episodeid'), title: this.model.get('title')});
            App.vent.trigger('stream:start', torrentStart);
            $(".filter-bar").show(); 
        },

        closeDetails: function(e) {
            e.preventDefault();
			App.vent.trigger('show:closeDetail'); 
            $(".filter-bar").show(); 	
        },

        clickTab: function(e) {
            e.preventDefault();
            if ($(e.currentTarget).attr("id") != "current_season"){           
                this.ui.tabsContainer.hide(); //Hide all tabs_container
                this.ui.seasonsList.attr("id",""); //Reset id's
                $(e.currentTarget).parent().attr("id","current_season"); // Activate this
                $( $(e.currentTarget).attr('href')).fadeIn(); // Show tabs_container for current tab
            }
            var tab_id = $(this).attr('data-tab');

            $('#tabs_season li').removeClass('active');
            $('.tabs-episode').removeClass('current');
            $('.epidoseSummary').removeClass('active');
            $(this).addClass('active');
            $("#"+tab_id).addClass('current');
        },

         clickEpisode: function(e) {
            e.preventDefault();
            
            $('.epidoseSummary').removeClass('active');
            
            $(this).parent().addClass('active');
            $(".episode-info p").text('Episode '+$(this).attr('data-id'));
            $(".episode-info div").text('Resume of Episode '+$(this).children().val());

         },




    });

    App.View.ShowDetail = ShowDetail;
})(window.App);

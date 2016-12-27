<ul class="nav nav-hor left">
    <% _.each (App.Config.getTabs(), function (tab) { %>
    <li class="source providerinfo contentTab"
        data-value="<%= tab.type %>"
        data-toggle="tooltip"
        data-placement="top"
        title="<%= App.Config.getFiltredProviderNames(tab.providers) %>">
        <%= i18n.__(tab.name) %>
    </li>
    <% }); %>
</ul>
<ul id="nav-filters" class="nav nav-hor filters">
    <li id="types-dropdown"></li>
    <li id="genres-dropdown"></li>
    <li id="sorters-dropdown"></li>
</ul>
<ul class="nav nav-hor right">
    <li id="search-dropdown"></li>

    <!-- Randomize -->
    <% if (Settings.activateRandomize) { %>
    <li style="display:block">
    <% } else { %>
    <li style="display:none">
    <% } %>
        <i id="filterbar-random" class="fa fa-random tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Randomize") %>"></i>
    </li>

    <!-- Watchlist -->
    <% if (Settings.activateWatchlist) { %>
    <li style="display:block">
    <% } else { %>
    <li style="display:none">
    <% } %>
        <i id="filterbar-watchlist" class="fa fa-inbox watchlist tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Watchlist") %>"></i>
    </li>

    <!-- Favorites -->
    <li>
        <i id="filterbar-favorites" class="fa fa-heart favorites tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Favorites") %>"></i>
    </li>

    <!-- Torrent Collection -->
    <% if (Settings.activateTorrentCollection) { %>
    <li id="torrent_col" style="display:block">
    <% } else { %>
    <li id="torrent_col" style="display:none">
    <% } %>
        <i id="filterbar-torrent-collection" class="fa fa-folder-open torrent-collection tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Torrent Collection") %>"></i>
    </li>

    <!-- About -->
    <li>
        <i id="filterbar-about" class="fa fa-info-circle about tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("About") %>"></i>
    </li>

    <!-- Settings -->
    <li>
        <i id="filterbar-settings" class="fa fa-cog settings tooltipped" data-toggle="tooltip" data-placement="left" title="<%= i18n.__("Settings") %>"></i>
    </li>
</ul>

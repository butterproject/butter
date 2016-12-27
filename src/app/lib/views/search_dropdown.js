(function (App){
    'use strict';

    App.View.SearchDropdown = App.View.Dropdown.extend({
        template: '#search-dropdown-tpl',
        ui: {
            selected: '.selected',
            items: '.search-item'
        },
    });
})(window.App);

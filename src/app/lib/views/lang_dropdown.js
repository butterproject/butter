(function (App){
    'use strict';

    App.View.LangDropdown = App.View.Dropdown.extend({
        template: '#lang-dropdown-tpl',
        ui: {
            selected: '.selected-lang'
        },
        events: {
            'click .flag-icon': 'closeDropdown'
        },

        initialize: function () {
            App.View.Dropdown.prototype.initialize.apply(this, arguments);
            this.model.on('change:selected', this.setLang.bind(this));
        },
        setLang: function (model) {
            var value = model.get('selected');
            this.ui.selected
                .removeClass()
                .addClass('flag toggle selected-lang')
                .addClass(value);
            App.vent.trigger(this.type + ':lang', value);
        },
        closeDropdown: function (e) {
            var value = $(e.currentTarget).attr('data-lang');

            if (value) {
                this.set(value);
            }
        },
    });
})(window.App);

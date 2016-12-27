(function (App){
    'use strict';

    App.View.FilterDropdown = App.View.Dropdown.extend({
        template: '#filter-dropdown-tpl',
        ui: {
            selected: '.selected',
            items: '.filter-item'
        },
        events: {
            'click .filter-item': 'closeDropdown'
        },

        initialize: function () {
            App.View.Dropdown.prototype.initialize.apply(this, arguments);
            this.model.on('change:selected', this.setValue.bind(this));
        },
        onShow: function () {
            this.model.get('selected') && this.setValue.apply(this);
        },
        setValue: function (model) {
            var value = this.model.get('selected');
            console.error ('set value', value);
            this.ui.selected.html(i18n.__(value));
            this.ui.items.removeClass('hidden');
            // HACK
            this.ui.items.closest(`[data-value="${value}"]`).addClass('hidden');

            model && App.vent.trigger('filter:' + this.type, value);
        },
        closeDropdown: function (e) {
            var value = $(e.currentTarget).attr('data-value');

            if (value) {
                this.set(value);
            }
        },
    });
})(window.App);

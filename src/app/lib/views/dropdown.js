(function (App){
    'use strict';

    App.View.Dropdown = Backbone.Marionette.ItemView.extend({
        template: '#dropdown-tpl',
        ui: {
            selected: '.selected'
        },
        events: {
            'click .close-drodpown': 'closeDropdown'
        },

        initialize: function () {
            var self = this;

            this.type = this.model.get('type');
            this.selected = this.model.get('selected');
            this.values = this.model.get('values');
            this.hasNull = this.model.get('hasNull');

            if (this.hasNull) {
                this.values = Object.assign({}, {none: undefined}, this.values);
                this.model.set('values', this.values);
            } else if (!this.selected && this.values) {
                var values = Object.keys(this.values);
                if (values.length) {
                    this.selected = values.pop();
                }
            }
        },

        onShow: function () {
            if (this.selected && this.selected !== 'none') {
                this.set(this.selected);
            }
        },

        update: function (newValues) {
            if (this.hasNull) {
                newValues = Object.assign({}, {none: undefined}, newValues);
            }
            this.model.set('values', newValues);
            this.values = newValues;
            this.render();
        },

        set: function (value) {
            this.model.set('selected', value);
        },

        closeDropdown: function (e) {
            var value = $(e.currentTarget).attr('data-value');

            if (value) {
                this.set(value);
            }
        },
    });
})(window.App);

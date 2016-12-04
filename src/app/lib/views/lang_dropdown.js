(function (App){
    'use strict';

    var objectAssign = require('es6-object-assign').assign;

    App.View.LangDropdown = Backbone.Marionette.ItemView.extend({
        template: '#lang-dropdown-tpl',
        ui: {
            selected: '.selected-lang',
        },
        events: {
            'click .dropdown-title': 'toggleDropdown',
            'click .flag-icon': 'closeDropdown',
        },

        initialize: function () {
            var self = this;

            this.type = this.model.get('type');
            this.handler = this.model.get('handler');
            this.selected = this.model.get('selected');
            this.values = this.model.get('values');
            this.hasNull = this.model.get('hasNull');

            if (this.hasNull) {
                this.values = objectAssign ({}, {none: undefined}, this.values);
                this.model.set('values', this.values);
            }

            if (!this.selected && this.values) {
                var values = Object.keys(this.values);
                if (values.length) {
                    this.selected = values.pop();
                }
            }
        },
        onShow: function () {
            if (this.selected !== 'none') {
                this.setLang(this.selected);
            }

        },
        updateLangs: function (newLangs) {
            if (this.hasNull) {
                newLangs = objectAssign ({}, {none: undefined}, newLangs);
            }
            this.model.set('values', newLangs);
            this.values = newLangs;
            this.render();
        },

        setLang: function (value) {
            this.model.set('selected', value);
            this.ui.selected.removeClass().addClass('flag toggle selected-lang').addClass(value);
            App.vent.trigger(this.type + ':lang', value);
            this.handler(value);
        },
        toggleDropdown: function (e) {
            var el = $(this.el);
            if (el.find('.dropdown-container').is('.open')) {
                this.closeDropdown(e);
            } else {
                el.find('.dropdown-container').addClass('open');
                el.find('.dropdown-arrow').addClass('down');
            }
        },

        closeDropdown: function (e) {
            e.preventDefault();
            var el = $(this.el);
            el.find('.dropdown-container').removeClass('open');
            el.find('.dropdown-arrow').removeClass('down');

            var value = $(e.currentTarget).attr('data-lang');

            if (value) {
                this.setLang(value);
            }
        },
    });
})(window.App);

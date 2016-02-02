define(['jquery', 'backbone'], function ($, Backbone) {
    var View = Backbone.View.extend({
        el: '#confirm-alert',
        initialize: function () {
            this.$el.modal({
                show: false,
                keyboard: true,
                backdrop: true
            });
        },
        events: {
            "click button.yes": "doConfirm"
        },
        display: function (vars, callback) {
            var me = this;
            if ( vars && $.isFunction(callback) ) {
                me.$el.find('button.no').text(vars.noTitle || 'Cancel');
                me.$el.find('button.yes').text(vars.yesTitle || 'Confirm');
                me.$el.modal('show');
                me.$el.find('.modal-header h4').html(vars.title);
                me.$el.find(' .modal-body').html(vars.content);
                me.callback = callback;
            }
        },
        doConfirm: function () {
//            this.$el.modal('hide');
            this.callback();
        }
    });
    return View;
});
define(['jquery', 'backbone'], function ($, Backbone) {
    var View = Backbone.View.extend({
        el: '#error-alert',
        initialize: function () {
            this.$el.modal({
                show: false,
                keyboard: true,
                backdrop: true
            });
        },
        display: function (vars, failback, onClose) {
            var me = this;
            if ( vars ) {
                me.$el.modal('show');
                me.$el.find('button.no').text(vars.noTitle || 'OK');
                me.$el.find('.modal-header h4').text(vars.title);
                me.$el.find(' .modal-body p').html(vars.content);
            }
            if ( $.isFunction(failback) ) {
                failback();
            }
            if ( $.isFunction(onClose) ) {
                me.$el.off('hidden').on('hidden', onClose);
            }
        }
    });
    return View;
});
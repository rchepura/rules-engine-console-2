define(['jquery', 'backbone'], function ($, Backbone) {
    var View = Backbone.View.extend({
        el: '#general-alert',
        initialize: function () {
            this.$el.modal({
                show: false,
                keyboard: true,
                backdrop: true
            });
        },
        events: {
            "click button": "doConfirm"
        },
        display: function (vars, url, timeout, callback) {
            var me = this;
            me.callback = function() {};
            me.redirected = false;
            if ( vars ) {
                me.$el.modal('show');
                me.$el.find('.modal-header h4').text(vars.title);
                me.$el.find(' .modal-body p').html(vars.content);
                if ( vars.btnTitle ) {
                    me.$el.find('button.no').text(vars.btnTitle);
                }
                if ( url ) {
                    $('.modal-alert button').click(function () {
                        $(this).unbind('click');
                        me.redirected = true;
                        Backbone.history.navigate(url);
                    });
                    me.autoRedirect(url, timeout);
                }
            }
            if ( $.isFunction(callback) ) {
                me.callback = callback;
            }
        },
        autoRedirect: function (url, timeout) {
            var me = this;
            setTimeout(function () {
                if ( !me.redirected ) {
                    Backbone.history.navigate(url);
                }
            }, timeout || 3000);
        },
        doConfirm: function () {
            this.$el.modal('hide');
            this.callback();
        }
    });
    return View;
});
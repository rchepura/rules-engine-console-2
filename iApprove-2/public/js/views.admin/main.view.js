define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-estee-wrapper',
        Model: Backbone.Model.extend({urlRoot : 'api/users/addtopic/'}),
        moment: Moment,
        initialize: function() {
            var me = this;           
            
            window.MAIN_VIEW_SADMIN = me;

            me.options.eventPubSub.bind("initMain", function() {
                me.init();
            });
            me.options.eventPubSub.bind("authFailed", function() {
                me.authFailed();
            });
        },
        events: {
            
        },
        init: function() {
            var me = this;
            Backbone.history.navigate('#/admin');
            me.hideLoader();
        },
        authFailed: function() {
            var me = this,
                userInfo = JSON.parse($.cookie('UserInfo'));
            
            delete userInfo.valid_token;
            
            $.cookie('UserInfo', JSON.stringify(userInfo), {expires : 365});
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });
});
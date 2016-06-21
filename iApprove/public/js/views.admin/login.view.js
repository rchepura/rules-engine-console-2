define(['jquery', 'backbone'], function($, Backbone) {
    var LoginView = Backbone.View.extend({
        el: '#id-estee-login',
        Model: Backbone.Model.extend({urlRoot : 'login'}),
        initialize: function() {
            var me = this;           
            
            top.LOGIN_VIEW = me;
        },
        events: {
            'click #btnLogin': "login"
        },
        init: function() {
            var me = this;
        },
        login: function() {
            var me = this,
                user = me.$el.find('#emailId').val(),
                pass = me.$el.find('#passwordId').val(),
                login = new me.Model();

            me.$el.find('.error-message').text('').hide();
            Util.showSpinner();
            login.save({user: user, password: pass}, {
                success: function(model, res) {
                    res = res || {};
                    if ( res.success && res.data ) {
//                        $.cookie('UserInfo', JSON.stringify(res.data), {expires : 30});
                        me.options.eventPubSub.trigger('initMain');
                    } else {
                        Util.hideSpinner();
                        me.$el.find('.error-message').text(res.message || 'Authorization Failed. Please enter correct authorization credentials.').show();
                    }
                },
                error: function() {
                    Util.hideSpinner();
                    me.$el.find('.error-message').text('Authorization Failed. Please enter correct authorization credentials.').show();
                },
                complete: function() {
//                    Util.hideSpinner();
                }
            });
            
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });

    return LoginView;
});
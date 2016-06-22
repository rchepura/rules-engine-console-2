define(['jquery', 'backbone', 'views.admin/login.view', 'views.admin/main.view', 'views.admin/admin.view', "views/alert.general.view", "views/alert.confirm.view", "views/alert.error.view"],
    function($, Backbone, LoginView, MainView, AdminView, AlertGeneralView, AlertConfirmView, AlertErrorView) {
        // bind alerts
        Alerts.General = new AlertGeneralView();
        Alerts.Confirm = new AlertConfirmView();
        Alerts.Error = new AlertErrorView();
        // login router
        var Router = Backbone.Router.extend({
            clientData: {},
            initialize: function() {
                var me = this;
                $.browser = {msie: (navigator.appName == 'Microsoft Internet Explorer') ? true : false};
                $('input, textarea').val('');
                $('#branding-logo').on('click', function() {
                    Backbone.history.navigate('#/main');
                });
                
                this.eventPubSub = _.extend({}, Backbone.Events);
                
                
                new LoginView({eventPubSub: this.eventPubSub});
                new MainView({eventPubSub: this.eventPubSub});
                new AdminView({eventPubSub: this.eventPubSub});
                
                Backbone.history.start();
            },
            routes: {
                ''                  : 'main',
                'main'              : 'main',
                'admin'             : 'admin',
                'logout'            : 'logout',
                '*notFound'         : 'main'
            },
            main: function() {
                var me = this;
                me.auth(function() {
                    if ( '/main' != Backbone.history.getHash() ) {
                        Backbone.history.navigate('#/main');
                    } else {
                        me.eventPubSub.trigger("initMain");
                    }
                });
            },
            admin: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initAdmin");
                });
            },
            auth: function(callback) {
                var me = this,
                    userInfo = JSON.parse($.cookie('UserInfo'));

                if ( !userInfo ) {
//                    $('#id-user').text('');
                    $('.wrapper-login').show();
                    $('#id-estee-signout').hide();
                    $('#id-estee-wrapper').hide();
                    Backbone.history.navigate('#/main');
                } else {
                    if ( _(['manager', 'magnet']).contains(userInfo.userName) ) {
                        $('.estee-header, .main-tabs-container').css({'min-width': '1152px'});
                        $('.main-tab-box').css({'width': '1152px'});
                        $('#id-tab-settings, #id-tab-logs').removeClass('hidden');
                    } else {
                        $('.estee-header, .main-tabs-container').css({'min-width': '860px'});
                        $('.main-tab-box').css({'width': '860px'});
                        $('#id-tab-settings, #id-tab-logs').addClass('hidden');
                    }
                    if ( '' === $('#id-current-user').text() ) {
                        me.eventPubSub.trigger("getUserByID", userInfo.userIdentifier, function(userData) {
                            $('#id-current-user').text('(' + userData.firstName + ' ' + userData.lastName + ')');
                        });
                    }
                    $('.wrapper-login').hide();
                    $('#id-estee-signout').show();
                    $('#id-estee-wrapper').fadeIn('fast');
                    callback();
                }
            },
            logout: function() {
                Util.showSpinner();
                $.ajax({
                    url: 'logout',
                    dataType: 'json',
                    type: 'POST',
                    complete: function (data) {
                        Util.hideSpinner();
                        $.removeCookie('UserInfo');
                        Backbone.history.navigate('#/main');
                        $('#id-current-user').text('');
                    }
                });
            }
        });
        return Router;
    });
    var Alerts = {};
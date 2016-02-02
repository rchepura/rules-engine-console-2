define(['jquery', 'backbone', 'views/login.view', 'views/main.view', 'views/career.view', 'views/experiences.view', 'views/users.view', 'views/analytics.view', "views/alert.general.view", "views/alert.confirm.view", "views/alert.error.view"],
    function($, Backbone, LoginView, MainView, CareerView, ExperiencesView, UsersView, AnalyticsView, AlertGeneralView, AlertConfirmView, AlertErrorView) {
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
                new CareerView({eventPubSub: this.eventPubSub});
                new ExperiencesView({eventPubSub: this.eventPubSub});
                new UsersView({eventPubSub: this.eventPubSub});
                new AnalyticsView({eventPubSub: this.eventPubSub});
                
                Backbone.history.start();
            },
            routes: {
                ''                  : 'main',
                'main'              : 'main',
                'career'            : 'career',
                'experiences'       : 'experiences',
                'users'             : 'users',
                'analytics'         : 'analytics',
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
            auth: function(callback) {
                var me = this,
                    userInfo = JSON.parse($.cookie('UserInfo'));

                if ( !userInfo ) {
//                    $('#id-user').text('');
                    $('.wrapper-login').show();
                    $('#id-estee-signout').hide();
                    $('#id-estee-wrapper').hide();
                } else {
//                    $('#id-user').text('Hello, ' + userInfo.firstName + ' ' + userInfo.lastName + ',');
                    $('.wrapper-login').hide();
                    $('#id-estee-signout').show();
                    $('#id-estee-wrapper').fadeIn('fast');
                    callback();
                }
            },
            career: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initCarrer", function(tab) {                        
                        if ( !tab.$el.hasClass('active') ) {
                            $('#' + tab.$el.attr('id').replace('content', 'tab')).click();
                        }
                    });
                });
            },
            experiences: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initExperiences", function(tab) {                        
                        if ( !tab.$el.hasClass('active') ) {
                            $('#' + tab.$el.attr('id').replace('content', 'tab')).click();
                        }
                    });
                });
            },
            users: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initUsers", function(tab) {
                        if ( !tab.$el.hasClass('active') ) {
                            $('#' + tab.$el.attr('id').replace('content', 'tab')).click();
                        }
                    });
                });
            },
            analytics: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initAnalytics", function(tab) {                        
                        if ( !tab.$el.hasClass('active') ) {
                            $('#' + tab.$el.attr('id').replace('content', 'tab')).click();
                        }
                    });
                });
            },
            logout: function() {
                Util.showSpinner();
                $.ajax({
                    url: 'logout',
                    dataType: 'json',
                    type: 'GET',
                    complete: function (data) {
                        Util.hideSpinner();
                        $.removeCookie('UserInfo');
                        Backbone.history.navigate('#/main');
                    }
                });
            }
        });
        return Router;
    });
    var Alerts = {};
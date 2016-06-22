define(['jquery', 'backbone', 'views/login.view', 'views/main.view', 'views/users.view', 'views/groups.view', 'views/configuration.view', 'views/report.view', "views/alert.general.view", "views/alert.confirm.view", "views/alert.error.view"],
    function($, Backbone, LoginView, MainView, UsersView, GroupsView, ConfigurationView, ReportView, AlertGeneralView, AlertConfirmView, AlertErrorView) {
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
                
                new UsersView({eventPubSub: this.eventPubSub});
                new GroupsView({eventPubSub: this.eventPubSub});
                new ConfigurationView({eventPubSub: this.eventPubSub});
                new ReportView({eventPubSub: this.eventPubSub});
                
                Backbone.history.start();
            },
            routes: {
                ''                  : 'main',
                'main'              : 'main',
                'macideas'          : 'macideas',
                'users'             : 'users',
                'groups'            : 'groups',
                'configuration'     : 'configuration',
                'report'            : 'report',
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
            groups: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initGroups", function(tab) {
                        if ( !tab.$el.hasClass('active') ) {
                            $('#' + tab.$el.attr('id').replace('content', 'tab')).click();
                        }
                    });
                });
            },
            configuration: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initConfiguration", function(tab) {                        
                        if ( !tab.$el.hasClass('active') ) {
                            $('#' + tab.$el.attr('id').replace('content', 'tab')).click();
                        }
                    });
                });
            },
            report: function() {
                var me = this;
                me.auth(function() {
                    me.eventPubSub.trigger("initReport", function(tab) {                        
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
define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    var UsersView = Backbone.View.extend({
        el: '#id-content-users',
        Model: Backbone.Model.extend(),
        moment: Moment,
        Settings: {},
        StatisticsReport: {},
        initialize: function() {
            var me = this;           
            
            window.USERS_VIEW = me;

            me.options.eventPubSub.bind("initUsers", function(callback) {
                callback(me);
                me.init();
            });
            
        },
        events: {
            'click .main-tab': "switchTab"
        },
        getUsers: function(callback) {
            var me = this,
                user = new me.Model();
            
            Util.showSpinner();
            user.fetch({
                url: 'api/experience/users/EXPERIENCE9BHU51BRLK3K37DQEI0M0I0PZ',
                success: function(model, res) {
                    res = res || {};
                    
                    if ( res && false !== res.success ) {
                        me.Users = res;
                        if ( callback ) {
                            callback(res);
                        } else {
                            me.render(res);
                        }
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
                        Backbone.history.navigate('#/logout');
                    }
                },
                complete: function(res) {
                    Util.hideSpinner();
                }
            });
        },
        render: function(data) {
            var me = this,
                template = $(_.template($('#templateUsersListView').html(), {data: data}));
            
            me.$el.html(template);
        },
        init: function() {
            var me = this;
            
            me.getUsers(function(users) {
                me.render(users);
            });
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });

    return UsersView;
});
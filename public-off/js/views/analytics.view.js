define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    var AnalyticsView = Backbone.View.extend({
        el: '#id-content-analytics',
        Model: Backbone.Model.extend(),
        moment: Moment,
        Settings: {},
        StatisticsReport: {},
        initialize: function() {
            var me = this;           
            
            window.ANALYTICS_VIEW = me;

            me.options.eventPubSub.bind("initAnalytics", function(callback) {
                callback(me);
                me.init();
            });
            
        },
        events: {
            'click .main-tab': "switchTab"
        },
        getAnalytics: function(callback) {
            var me = this,
                user = new me.Model();
            
            Util.showSpinner();
            user.fetch({
                url: 'api/assignment/all?filter=NONE&searchTerm=vmvjhm&sort=DATE',
                success: function(model, res) {
                    res = res || {};
                    
                    if ( res && false !== res.success ) {
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
                template = $(_.template($('#templateAnalyticsView').html(), {data: data}));
            
            me.$el.html(template);
        },
        init: function() {
            var me = this;
            
            me.getAnalytics(function(data) {
                me.render(data);
            });            
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });

    return AnalyticsView;
});
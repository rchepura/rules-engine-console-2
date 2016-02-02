define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    var ExperiencesView = Backbone.View.extend({
        el: '#id-content-experiences',
        Model: Backbone.Model.extend(),
        moment: Moment,
        Settings: {},
        StatisticsReport: {},
        initialize: function() {
            var me = this;           
            
            window.EXPERIENCES_VIEW = me;

            me.options.eventPubSub.bind("initExperiences", function(callback) {
                callback(me);
                me.init();
            });
            
        },
        events: {
            'click .main-tab': "switchTab"
        },
        getExperiences: function(callback) {
            var me = this,
                user = new me.Model();
            
            Util.showSpinner();
            user.fetch({
                url: 'api/experience/all?sort=DATE&exkeys=INTERNATIONAL&functions=&rating=4',
                success: function(model, res) {
                    res = res || {};
                    
                    me.AllExperiences = res;
                    
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
                template = $(_.template($('#templateExperiencesListView').html(), {data: data}));
            
            me.$el.html(template);
        },
        init: function() {
            var me = this;
            
            me.getExperiences(function(data) {
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

    return ExperiencesView;
});
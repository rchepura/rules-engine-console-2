define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: 'body',
        defaultTab: 'action',
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.MAIN_VIEW = me;

            me.options.eventPubSub.bind("initMain", function() {
                me.init();
            });
            
            $('#new-iapprove .save-iapprove').off().on('click', function(e) {
                me.saveIapprove(e);
            });
            $('#new-action .save-action').off().on('click', function(e) {
                me.saveAction(e);
            });
        },
        events: {
            'click .main-tab': "switchTab"            
        },
        init: function() {
            var me = this;
            
            Backbone.history.navigate('#/' + me.defaultTab);
            me.hideLoader();
        },
        switchTab: function(e) {
            var me = this,
                elem = $(e.currentTarget),
                boxId = null;
            if ( !elem.hasClass('active') ) {
                elem.parent().find('.active').removeClass('active');
                elem.addClass('active');
                elem.closest('.rules-wrapper').find('.main-contents-container.active').removeClass('active');
                boxId = elem.attr('id').replace('tab', 'content');
                me.$el.find('#' + boxId).addClass('active');               
                Backbone.history.navigate('#/' + boxId.replace('id-content-', ''));
            }
            
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });
});
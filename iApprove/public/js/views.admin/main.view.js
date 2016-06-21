define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-rules-wrapper',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.MAIN_VIEW = me;

            me.options.eventPubSub.bind("initMain", function() {
                me.init();
            });
            
            $('#new-rule .save-rule').off().on('click', function(e) {
                me.saveRule(e);
            });
            $('#new-action .save-action').off().on('click', function(e) {
                me.saveAction(e);
            });
            
//            me.$el.find('input[name="timeCreated"]').datepick({
//                inline: true,
////                showOnFocus: false,
////                showTrigger: '<img src="images/assets/ic_calendar.png" class="datepick-trigger exp-col-edit">',
////                minDate: new Date(),
//                onSelect: function (date) {
//                    me.$el.find('input[name="timeCreated"]').val($.datepick.formatDate("mm/dd/yyyy", date[0]));
//                }
//            });
        },
        events: {
            
        },
        init: function() {
            var me = this;
            
            me.options.eventPubSub.trigger("initRule");
            me.options.eventPubSub.trigger("initAction");
            me.options.eventPubSub.trigger("initDevice");
            
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });
});
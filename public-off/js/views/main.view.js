define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    var LoginView = Backbone.View.extend({
        el: '#id-estee-wrapper',
        defaultTab: 'career',
        Model: Backbone.Model.extend({urlRoot : 'api/users/addtopic/'}),
        moment: Moment,
        Settings: {},
        StatisticsReport: {},
        initialize: function() {
            var me = this;           
            
            window.MAIN_VIEW = me;

            me.options.eventPubSub.bind("initMain", function() {
                me.init();
            });
            $('input#topicIcon').off().on('change', function () {
                var file = ($(this)[0].files || [])[0],
                    maxIconWidth = 80,
                    maxIconHeight = 80;
                
//                MAIN_VIEW.ICCON = file;
//                return;

                if (file && -1 == file.type.search('image')) {
                    Alerts.Error.display({
                        title: 'Error',
                        content: 'Please select to upload image file.'
                    });
                } else {
                    Util.maxImageSize(file, maxIconWidth, maxIconHeight, function(correctIconSize) {
                        
                        if ( !correctIconSize ) {
                            Alerts.Error.display({
                                title: 'Error',
                                content: 'Please select an image file with dimensions of less than or equal to ' + maxIconWidth + 'px' + ' x ' + maxIconHeight + 'px.'
                            });
                            return;
                        }
                        
                        me.doUploadPreview(file, function (iconURL) {
                           
                        });
                    });
                }
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
        doUploadPreview: function (file, callback) {
            var me = this,
                formData = new FormData();

            if (!file) {
                return;
            }

            formData.append('image', file);

            me.showLoader();
            $.ajax({
                url: 'tmpFile' + ( ( me.defaultTopicIcon ) ? '?defIcon=true' : '' ),
                data: formData,
                contentType: false,
                type: "POST",
                processData: false,
                complete: function (res) {
                    var data = (res.responseJSON || {}).data;
                    me.hideLoader();
                    callback(data);
                }
            });
        },
        authFailed: function() {
            var me = this,
                userInfo = JSON.parse($.cookie('UserInfo'));
            
            delete userInfo.valid_token;
            
            $.cookie('UserInfo', JSON.stringify(userInfo), {expires : 365});
        },
        switchTab: function(e) {
            var me = this,
                elem = $(e.currentTarget),
                boxId = null;
            
            if ( !elem.hasClass('active') ) {
                elem.parent().find('.active').removeClass('active');
                elem.addClass('active');
                elem.closest('.estee-wrapper').find('.main-content.active').removeClass('active');
                boxId = elem.attr('id').replace('tab', 'content');
                me.$el.find('#' + boxId).addClass('active');
                
                switch ( boxId ) {
                    case 'id-content-career_insignts':
//                        me.options.eventPubSub.trigger('initCarrer');
                        Backbone.history.navigate('#/career');
                    break;
                    case 'id-content-experiences':
                        Backbone.history.navigate('#/experiences');
//                        me.options.eventPubSub.trigger('initExperiences');
                    break;
                    case 'id-content-users':
                        Backbone.history.navigate('#/users');
//                        me.options.eventPubSub.trigger('initUsers');
                    break;
                    case 'id-content-analytics':
                        Backbone.history.navigate('#/analytics');
//                        me.options.eventPubSub.trigger('initAnalytics');
                    break;
                    default:
                        /*  */;
                }
                
            }
            
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
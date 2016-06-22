define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-estee-wrapper',
        Model: Backbone.Model.extend({urlRoot : 'api/users/addtopic/'}),
        moment: Moment,
        initialize: function() {
            var me = this;           
            
            window.MAIN_VIEW_SADMIN = me;

            me.options.eventPubSub.bind("initMain", function() {
                me.init();
            });
            me.options.eventPubSub.bind("authFailed", function() {
                me.authFailed();
            });
            $('input#topicIcon').off().on('change', function () {
                var file = ($(this)[0].files || [])[0],
                    maxIconWidth = 200,
                    maxIconHeight = 200;
                
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
            'click #id-client-icon': "clientIcon",
        },
        init: function() {
            var me = this;
            Backbone.history.navigate('#/admin');
            me.hideLoader();
        },
        clientIcon: function (e) {
            var me = this;

            me.doUploadPreview.defaultUserIcon = true;

            $('input#topicIcon').val('').click();
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
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });
});
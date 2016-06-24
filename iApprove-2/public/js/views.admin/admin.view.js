define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-estee-wrapper',
        Model: Backbone.Model.extend({urlRoot : 'api/users/addtopic/'}),
        moment: Moment,
        initialize: function() {
            var me = this;           
            
            window.ADMIN_VIEW = me;

            me.options.eventPubSub.bind("initAdmin", function() {
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
                        
//                        if ( !correctIconSize ) {
//                            Alerts.Error.display({
//                                title: 'Error',
//                                content: 'Please select an image file with dimensions of less than or equal to ' + maxIconWidth + 'px' + ' x ' + maxIconHeight + 'px.'
//                            });
//                            return;
//                        }
                        
                        me.doUploadPreview(file, function (iconURL) {
                           if ( me.currUploadPic ) {
                                switch ( me.currUploadPic ) {
                                    case 'clientIcon':
                                        me.$el.find('input#id-app-icon').val(iconURL);
                                        me.$el.find('input.js-app-icon').css('background-image', 'url(' + iconURL + ')');
                                        break;
                                    case 'clientBackground':
                                        me.$el.find('input#id-background').val(iconURL);
                                        me.$el.find('input.js-client-background').css('background-image', 'url(' + iconURL + ')');
                                        break;
                                    default : ;
                                }
                           }
                        });
                    });
                }
            });
        },
        events: {
            'click #id-client-icon': "newClient",
            'click .js-modal-add-new-client-btn': "createNewClient",
            'click .js-app-icon': "clientIcon",
            'click .js-client-background': "clientBackground"
        },
        init: function() {
            var me = this;
            me.hideLoader();
        },
        newClient: function (e) {
            var me = this;

            $('#modal-add-new-client').modal('show');
        },
        createNewClient: function (e) {
            var me = this,
                clientData = {},
                pFields = $('#modal-add-new-client input, #modal-add-new-client select'),
                isValid = true;
              
            pFields.each(function () {
                var curID = ($(this).attr('id') || '').replace('id-', '');
                
                if ( curID && '' !== curID ) {

                    $(this).val($.trim($(this).val()));
                    if ( !isValid || !$(this).validationEngine('validate') ) {
                        isValid = false;
                        return;
                    }
                    clientData[curID] = $(this).val();
                }
            });

            if ( !isValid || ( _.isEmpty(clientData) ) ) {
                return;
            }
            
            Alerts.Error.display({
                title: 'Client Info',
                content: (function () {
                    var res = '';
                    
                    _.each(clientData, function(m, i) {
                        res += i + ': ' + m + '<br>';
                    });
                    
                    return res;
                })()
            });
            
        },
        clientIcon: function (e) {
            var me = this;
            me.currUploadPic = 'clientIcon';
            $('input#topicIcon').val('').click();
        },
        clientBackground: function (e) {
            var me = this;
            me.currUploadPic = 'clientBackground';
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
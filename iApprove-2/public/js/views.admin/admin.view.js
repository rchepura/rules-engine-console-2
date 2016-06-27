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
            'click .js-modal-edit-client-btn': "onEditClient",
            'click .js-app-icon': "clientIcon",
            'click .js-client-background': "clientBackground",
            'click .client-menu-item.client-settings': "onClientMenuItem"
        },
        getClients: function(callback) {
            var me = this,
                user = new me.Model();
            
            callback([
                {
                    clientId: '11111',
                    title: 'General Motors',
                    createdStr: '06/16/2016',
                    bg: 'images/assets/Clients/bg_gm.png',
                    logo: 'images/assets/Clients/logo_gm.png'
                },
                {
                    clientId: '22222',
                    title: 'Estee Lauder Companies',
                    createdStr: '06/16/2016',
                    bg: 'images/assets/Clients/bg_estee.png',
                    logo: 'images/assets/Clients/logo_estee.png'
                },
                {
                    clientId: '333333',
                    title: 'Mac Cosmetics',
                    createdStr: '06/16/2016',
                    bg: 'images/assets/Clients/bg_mac.png',
                    logo: 'images/assets/Clients/logo_mac.png'
                },
                {
                    clientId: '44444',
                    title: 'MITRE Corporation',
                    createdStr: '06/16/2016',
                    bg: 'images/assets/Clients/bg_mitre.png',
                    logo: 'images/assets/Clients/logo_mitre.png'
                }
            ]);
            return;

            Util.showSpinner();
            user.fetch({
                url: 'api/clients',
                success: function(model, res) {
                    var topics;

                    if ( res && false !== res.success ) {
                        topics = res || {};
                        callback(topics);
                    } else {
                        Backbone.history.navigate('#/logout');
                    }
                },
                complete: function(res) {
                    if ( 401 == (res || {}).status ) {
                        Backbone.history.navigate('#/logout');
                    }
                    Util.hideSpinner();
                }
            });
        },
        onClientMenuItem: function(e) {
            var me = this,
                $el = $(e.currentTarget),
                $elParent = $el.closest('.client-btn'),
                clientId = $el.attr('data-id'),
                tmpClientData = {
                    appIcon: $elParent.find('img').attr('src'),
                    background: $elParent.attr('data-id'),
                    clientId: $elParent.find('.client-settings').attr('data-id'),
                    clientName: $elParent.next('.client-description').attr('data-id'),
                    clientUrl: 'test.magnet.com',
                    firstName: 'test',
                    lastName: 'test',
                    email: 'test@magnet.com',
                    company: 'test',
                    city: 'Palo Alto',
                    state: 'CA',
                    zip: '94301',
                    group: 'Admin'
                };
            
            me.editClient(tmpClientData);
        },
        init: function() {
            var me = this;
            
            me.getClients(function(clients) {
                me.render(clients);
                me.hideLoader();
            });            
        },
        render: function(clients) {
            var me = this,
                template = $(_.template(me.$el.find('#templateClientListView').html(), {data: clients}));
                
            me.$el.find('.clients-pane-icons ul').html(template);
        },
        newClient: function () {
            var me = this,
                $newModal = $('#modal-add-new-client');

            $newModal.find('input').val('');
            $('#modal-add-new-client').modal('show');
        },
        editClient: function (clientInfo) {
            var me = this,
                $editModal = $('#modal-edit-client'),
                $currEl = null;

            clientInfo = clientInfo || {};
            $editModal.find('input').val('');
            
            for ( var i in clientInfo ) {
                $currEl = $editModal.find('#id-edit-' + i);
                if ( 0 < $currEl.length ) {
                    if ( 'appIcon' == i ) {
                        $editModal.find('.js-app-icon').css('background-image',  'url(' + clientInfo[i] + ')');
                    } else if ( 'background' == i ) {
                        $editModal.find('.js-client-background').css('background-image',  'url(' + clientInfo[i] + ')');
                    }
                    $currEl.val(clientInfo[i] || '');
                }
            }
            
            $editModal.modal('show');
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
        onEditClient: function (e) {
            var me = this,
                clientData = {},
                pFields = $('#modal-edit-client input, #modal-edit-client select'),
                isValid = true;
              
            pFields.each(function () {
                var curID = ($(this).attr('id') || '').replace('id-edit-', '');
                
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
                title: 'Updated Client Info',
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
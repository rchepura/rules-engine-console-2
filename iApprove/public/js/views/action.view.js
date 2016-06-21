define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-content-action',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.ACTION_VIEW = me;

            me.options.eventPubSub.bind("initAction", function(callback) {
                callback(me);
                me.init();
            });
            me.options.eventPubSub.bind("getActions", function(callback) {
                if ( !_.isEmpty(me.AllActions) ) {
                    callback(me.AllActions);
                } else {
                    me.getActions(function() {
                        callback(me.AllActions);
                    });
                }
            });
        },
        events: {
            'click .add-action': "onAddAction",
            'click .remove-action': "removeAction",
            'click .tab-row': "openDetails",
            'click .tab-row .tab-box, .tab-row input': "onClickRowItem",
            'click .js-cancel': "closeDetails",
            'click #id-search-action-btn-search': "onSearch",
            'click span.icon-search-reset': "onSearchReset",
            'click .js-del-action': "removeAction",
            'click .js-save-action': "saveAction",
            'click .check-box': "onCheckbox"
        },
        onClickRowItem: function (e) {
//            e.stopPropagation();
        },
        closeDetails: function(e) {
            var me = this,
                $elem = $(e.currentTarget).closest('.tab-row');
            
            $elem.find('.tab-row-collaps').click();
        },
        onCheckbox: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                template,
                extBox = $elem.closest('.action-details-row').find('.ext-box');

            $elem.toggleClass('active');
            if( $elem.hasClass('active') ) {
                template = _.template($($elem.attr('did')).html(), {data: {}});
                extBox.html(template);
            } else {
                extBox.empty();
            }
        },
        fillExtBox: function($elem, data) {
            var me = this,
                template,
                extBox = $elem.closest('.action-details-row').find('.ext-box');

            $elem.toggleClass('active');
            if( $elem.hasClass('active') ) {
                template = _.template($($elem.attr('did')).html(),{data: data});
                extBox.html(template);
            } else {
                extBox.empty();
            }
        },
        openDetails: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                template;

            if ( !($(e.target).hasClass('exp-col') || $(e.target).hasClass('arrow-expand')) ) {
                return;
            }
            me.closeNewAction();
        
            if ( !$elem.hasClass('active') ) {
                me.getDevices(function(devices) {
                    var cAction = (me.AllActions[$elem.attr('did')] || {});
                    cAction.devices = devices;
                    
                    $elem.parent().find('> .active .exp-col-edit').hide();
                    $elem.parent().find('> .active .exp-col-read').show();
                    $elem.parent().find('> .active').removeClass('active').find('.tab-box').slideUp('fast');

                    template = $(_.template($('#templateActionDetailsView').html(), {model: cAction}));
                    $elem.find('.tab-box').html(template);
                    
                    if ( cAction.push ) {
                        me.fillExtBox($elem.find('.check-box[did="#templateActionNotificationView"]'), cAction);
                    }
                    if ( cAction.sendEmail ) {
                        me.fillExtBox($elem.find('.check-box[did="#templateActionSendEmailView"]'), cAction);
                    }

                    $elem.addClass('active').find('.tab-box').slideDown('fast', function() {
                        $elem.find('.tab-box select').select2();
                    });
                    $elem.find('.exp-col-edit').show();
                    $elem.find('.exp-col-read').hide();
                });
            } else {
                $elem.find('.exp-col-edit').hide();
                $elem.find('.exp-col-read').show();
                $elem.removeClass('active').find('.tab-box').slideUp('fast', function() {
                    me.$el.find('.tab-box').empty();
                });
            }
        },
        closeNewAction: function() {
            var me = this,
                $elem = me.$el.find('.js-new-action');
            
            if ( $elem.hasClass('active') ) {
                $elem.find('.tab-box').slideUp('fast', function() {
                    $elem.remove();
                });
            }
        },
        onSearch: function() {
            var me = this,
                strSearch = $.trim(me.$el.find('input#id-search-action').val()).toLowerCase(),
                res = [];

            if ( me.AllActionList ) {

                if ( '' !== strSearch ) {
                    for ( var i = 0, len = me.AllActionList.length; i < len; i++ ) {
                        if ( 0 === (me.AllActionList[i].actionTemplateName || '').toLowerCase().indexOf(strSearch) ) {
                            res.push(me.AllActionList[i]);
                        }
                    }
                } else {
                    res = me.AllActionList;
                }
                me.render(res);
            }
        },
        onSearchReset: function() {
            var me = this;

            me.$el.find('input#id-search-action').val('');
            me.render(me.AllActionList);
        },
        onAddAction: function(e) {
            var me = this,
                template = $(_.template($('#templateActionRowView').html(), {data: [{strTimeCreated: me.moment().format('MM/DD/YYYY')}]}));
            
            me.$el.find('.js-new-action').remove();
            
            template.addClass('js-new-action');
            
            me.$el.find('.content-action-list').prepend(template);
            me.$el.find('.content-action-list .js-new-action .tab-row-collaps').click();
        },
        getActions: function(cb) {
            var me = this,
                action = new me.Model();

            me.AllActions = {};
            me.AllActionList = [];
            
            Util.showSpinner();
            action.fetch({
                url: 'api/iapprove/actions',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        me.AllActionList = res || [];
                        
                        _.each(me.AllActionList, function(model, key) {
                            model.strTimeCreated = me.moment(model.timeCreated || 0).format('MM/DD/YYYY');
                        });
                        
                        me.AllActionList.forEach(function(item) {
                            me.AllActions[item.actionTemplateId] = item;
                        });
                        
                        if ( cb ) {
                            cb(res || []);
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
                    if ( 401 == (res || {}).status ) {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
                        Backbone.history.navigate('#/logout');
                    }
                    Util.hideSpinner();
                }
            });
        },
        saveAction: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                actionId = $elem.attr('did'),
                $parent = $elem.closest('.tab-row'),
                model = new me.Model(),
                data = {},
                dataType = 'json',
                loc = 'api/iapprove/action',
                isValid = true;
            
                if ( !$parent.find('input.js-action-title').validationEngine('validate') ) {
                    return false;
                }
                data.actionTemplateName = $.trim($parent.find('input.js-action-title').val());
                data.actionTemplateDescription = $.trim($parent.find('input.js-action-description').val());
                data.timeCreated = (new Date().getTime());
                data.expirationDays = parseInt($parent.find('select[name="num-of-days"]').val());
                data.expirationHour = parseInt($parent.find('select[name="at-time-hour"]').val());
                data.expirationMin = parseInt($parent.find('select[name="at-time-min"]').val());
                data.card = ( 'none' != $parent.find('select[name="device-card"]').val() );
                data.deviceType = me.AllDevices[$parent.find('select[name="device-card"]').val()];
                data.push = false;                    
                data.sendEmail = false;
                data.apiUrl = $.trim($parent.find('input[name="api-call"]').val());
                
                if ( $parent.find('.check-box[did="#templateActionNotificationView"]').hasClass('active') ) {                    
                    data.push = true;
                    data.pushPayload = $.trim($parent.find('input[name="text-to-display"]').val());
                }
                
                if ( $parent.find('.check-box[did="#templateActionSendEmailView"]').hasClass('active') ) {                    
                    data.sendEmail = true;
                    data.emailRecipient = $.trim($parent.find('input[name="recipient-email"]').val());
                    data.emailSubject = $.trim($parent.find('input[name="email-subject"]').val());
                    data.emailContents = $.trim($parent.find('input[name="email-body"]').val());
                }
                
                $parent.find('.ext-box input').each(function() {
                    if ( !$(this).validationEngine('validate') ) {
                        isValid = false;
                    }
                });
                if ( !isValid ) {
                    return false;
                }

                if ( 'PM' ==  $parent.find('select[name="at-time-am-pm"]').val() ) {
                    data.expirationHour += 12;
                }
                
                $parent.find('.action-details-list .js-data-row').each(function() {
                    var cKey = $.trim($(this).find('.js-data-key').text()),
                        cVal = $.trim($(this).find('select').val());
                    if ( cKey  ) {
                        data.capability[cKey] = cVal;
                    }
                });                
                
                if ( actionId ) {
                    dataType = 'text';
                    data.actionTemplateId = actionId;
                } else {
                    data.id = 1;
                }
                
//                top.ACTIONSSDATA = data; return;
                
            me.showLoader();
            
            model.save(data, {
                url: loc,
                dataType: dataType,
                success: function (model, res) {
                    me.hideLoader();
                    if ( (actionId && (res && /SUCCESS/.test(res) )) || (res && false !== res.success) ) {
                        me.getActions(function(actions) {
                            me.render(actions);
                        });
                        me.$el.find('.new-action-container .new-window-box').fadeOut();
                        $('#new-action').modal('hide');
                    } else {
                        Alerts.Error.display({title: 'Error', content: 'Failed during save Action (' + res + ')'});
                    }
                },
                error: function (model, res) {
                    Alerts.Error.display({title: 'Error', content: (res.responseJSON || {}).error || "Failed during save Action"});
                    me.hideLoader();
                }
            });
            return false;
        },
        removeAction: function(e) {
            var me = this,            
                model = new me.Model({id: 'del'}),
                $elem = $(e.currentTarget),
                actionId = $elem.attr('did');
        
            Alerts.Confirm.display({
                title: 'Are you sure you want to delete “' + me.AllActions[actionId].actionTemplateName + '” action?',
                yesTitle: 'Delete'
            }, function() {
                if ( actionId ) {
                    Util.showSpinner();
                    model.destroy({
                        url: 'api/iapprove/action/' + actionId,
                        complete: function(res) {
                            if ( 200 == (res || {}).status ) {
                                me.getActions(function(actions) {
                                    me.render(actions);
                                });
                            } else {
                                Alerts.Error.display({
                                    title: 'Error',
                                    content: 'Failed Delete'
                                });
                            }
                            Util.hideSpinner();
                        }
                    });
                }
            });
        },
        render: function(data) {
            var me = this,
                template = $(_.template($('#templateActionRowView').html(), {data: data}));
            
            me.$el.find('.content-action-list').html(template);
        },
        init: function() {
            var me = this;            
            
            me.AllDevices = {};            
            me.getActions(function(actions) {
                me.render(actions);
            });
        },
        getDevices: function(cb) {
            var me = this,
                device = new me.Model();
            
            if ( !_.isEmpty(me.AllDevices) ) {
                cb(me.AllDevices);
                return;
            }

            me.AllDevices = {};
            
            Util.showSpinner();
            device.fetch({
                url: 'api/dtcontroller/device/type',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        res = res || [];
                        
                        res.forEach(function(item) {
                            me.AllDevices[item.name] = item;
                        });
                        
                        if ( cb ) {
                            cb(me.AllDevices);
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
                    if ( 401 == (res || {}).status ) {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
                        Backbone.history.navigate('#/logout');
                    }
                    Util.hideSpinner();
                }
            });
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });
});
define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-actions-container',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.ACTION_VIEW = me;

            me.options.eventPubSub.bind("initAction", function() {
                me.init();
            });
            me.options.eventPubSub.bind("getAllActions", function(callback) {
                callback(me.AllActions);
            });
            $('#new-action .save-action').off().on('click', function(e) {
                me.saveAction(e);
            });
        },
        events: {
            'click .add-action': "onAddAction",
            'click .remove-action': "removeAction",
            'click .list-row': "selectListRow"
        },
        selectListRow: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                $elParent = $elem.parent(),
                $cKeys = me.$el.find('.new-action-container .capability-keys').empty(),
                itemId = $elem.attr('did'),
                cData = {},
                devType = {};
            
            if ( !$elem.hasClass('active') ) {
                $elParent.find('.list-row.active').removeClass('active');
                $elem.addClass('active');
                $elParent.find('.remove-action').attr('disabled', false);
                if ( me.AllActions[itemId] ) {
                    me.$el.find('.new-action-container .new-window-box').fadeIn();
                    cData = me.AllActions[itemId];
                    devType = cData.deviceType || {};
                    for ( var d in cData ) {
                        $('#action-' + d).text(cData[d]);
                    }
                    $('#device-type-name').text(devType.name || 'N/A');
                    $cKeys.html(_.template($('#templateActionDeviceCapabilityRowView').html(), {data: (devType.capability || {})}));
                }
                
            } else {
                $elem.removeClass('active');
                $elParent.find('.remove-action').attr('disabled', true);
                if ( me.AllActions[itemId] ) {
                    me.$el.find('.new-action-container .new-window-box').fadeOut();
                }
            }
        },
        getActions: function(cb) {
            var me = this,
                action = new me.Model();
            
            Util.showSpinner();
            action.fetch({
                url: 'api/rules/actions',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        if ( cb ) {
                            cb(res || []);
                        }
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
//                        Backbone.history.navigate('#/logout');
                    }
                },
                complete: function(res) {
                    if ( 401 == (res || {}).status ) {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
//                        Backbone.history.navigate('#/logout');
                    }
                    Util.hideSpinner();
                }
            });
        },
        onAddAction: function(e) {
            var me = this;

            $('#new-action').modal('show');
//            me.$el.find('.new-action-container .new-window-box').fadeIn();
        },
        saveAction: function(e, actionID) {
            var me = this,
                $elem = $(e.currentTarget),
                $parent = $elem.closest('.modal-content'),
                $inputFields = $parent.find('input'),
                model = new me.Model(),
                data = {};
                
                $inputFields.each(function() {
                    var $this = $(this);
                    
                    if ( -1 == $this.attr('name').indexOf('device') ) {
                        if ( 'checkbox' == $this.attr('type') ) {
                            data[$this.attr('name')] = $this.get(0).checked;
                        } else {
                            data[$this.attr('name')] = $.trim($this.val());
                        }
                    }
                });
                
                data.deviceType = {
                    name: $parent.find('input[name="device-name"]').val(),
                    capability: {}
                };
                
                if ( !actionID ) {
                    data.id = 1;
                    
                    $parent.find('.capability-keys .form-group').each(function() {
                        var cKey = $.trim($(this).find('label').text()),
                            cVal = $.trim($(this).find('input').val());
                        if ( cKey  ) {
                            data.deviceType.capability[cKey] = cVal;
                        }
                    });
                    
                }
                
                data.timeCreated = (new Date()).getTime();
                
                top.NEW_ACTION_DATA = data;
                
                if ( !data.actionTemplateName ) {
                    Alerts.Error.display({title: 'Error', content: "Rule Action Name cannot be empty"});
                    return;
                }
 
            me.showLoader();
            
            model.save(data, {
                url: 'api/rules/action',
                success: function (model, res) {
                    me.hideLoader();
                    if ( _.isObject(res) ) {
                        if ( !_.isEmpty(res) ) {
                            me.getActions(function(actions) {
                                me.renderActions(actions);
                            });
                            me.$el.find('.new-action-container .new-window-box').fadeOut();
                        } else {
                            Alerts.Error.display({title: 'Error', content: "Failed during create Action"});
                        }
                    }
                },
                error: function () {
                    Alerts.Error.display({title: 'Error', content: "Failed during create Action"});
                    me.hideLoader();
                }
            });
            return false;

        },
        addAction: function(text) {
            var me = this,
                $container = me.$el.find('.actions-container .item-list'),
                listSize = $container.find('.list-row').length;
        
            if ( 0 !== listSize ) {
                $container.find('.list-row').last().after(_.template($('#templateActionRow').html(), {model: {title: text}}));
            } else {
                $container.prepend(_.template($('#templateActionRow').html(), {model: {title: text}}));
            }
        },
        removeAction: function(e) {            
            var me = this,            
                model = new me.Model({id: 'del'}),
                $elem = $(e.currentTarget),
                $container = $elem.closest('.item-list'),
                actionID = $container.find('.list-row.active').attr('did');
        
            if ( actionID ) {
                Util.showSpinner();
                model.destroy({
                    url: 'api/rules/action/' + actionID,
                    complete: function(res) {
                        if ( 200 == (res || {}).status ) {
                            me.getActions(function(actions) {
                                me.renderActions(actions);
                            });
                        } else {
                            Alerts.Error.display({
                                title: 'Error',
                                content: 'Failed Delete Action'
                            });
                        }
                        Util.hideSpinner();
                    }
                });
            }       
        },
        renderActions: function(actions) {
            var me = this,
                template = _.template($('#templateActionsView').html(), {data: actions}),
                $actionSelect = $('#new-rule .new-rule-container select[name="action"]').empty();

            me.$el.find('.new-action-container .new-window-box').fadeOut();
            me.AllActions = {};
            
            _.each(actions, function (model, key) {
                me.AllActions[model.actionTemplateId] = model;
                $actionSelect.append('<option value="' + model.actionTemplateId + '">' + model.actionTemplateName + '</option>');
            });
            
            me.$el.find('.actions-container .item-list').html(template);
            $actionSelect.on('change', function() {
                me.renderNewRuleActions($(this).val());
            });
            me.renderNewRuleActions($actionSelect.val());
        },
        renderNewRuleActions: function(actionTemplateId) {
            var me = this,                
                template = _.template($('#templateActionFormView').html(), {model: me.AllActions[actionTemplateId] || {}});
            
            $('#new-rule .new-rule-container .rule-action-pane').html(template);
        },
        init: function() {
            var me = this;
                      
            me.getActions(function(actions) {
                me.renderActions(actions);
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
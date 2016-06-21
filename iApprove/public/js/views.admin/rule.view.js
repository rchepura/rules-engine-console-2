define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-rules-container',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.RULE_VIEW = me;

            me.options.eventPubSub.bind("initRule", function() {
                me.init();
            });
            
            $('#new-rule .save-rule').off().on('click', function(e) {
                me.options.eventPubSub.trigger('getAllActions', function(allActions) {
                    me.saveRule(e, allActions || {});
                });
            });
        },
        events: {
            'click .add-rule': "onAddRule",
            'click .remove-rule': "removeRule",
            'click .list-row': "selectListRow"
        },
        selectListRow: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                $elParent = $elem.parent(),
                $cKeys = me.$el.find('.new-rule-container .capability-keys').empty(),
                itemId = $elem.attr('did'),
                cData = {},
                devType = {};
            
            if ( !$elem.hasClass('active') ) {
                $elParent.find('.list-row.active').removeClass('active');
                $elem.addClass('active');
                $elParent.find('.remove-rule').attr('disabled', false);

                if ( me.AllRules[itemId] ) {
                    me.$el.find('.new-rule-container .new-window-box').fadeIn();
                    cData = me.AllRules[itemId];
                    for ( var d in cData ) {
                        if ( 'action' == d ) {
                            for ( var a in cData[d] ) {
                                if ( 'deviceType' == a ) {
                                    devType = cData[d][a] || {};
                                    me.$el.find('.action-device-type-name').text(devType.name || 'N/A');
                                    $cKeys.html(_.template($('#templateActionDeviceCapabilityRowView').html(), {data: (devType.capability || {})}));
                                } else {
                                    $('#rule-action-' + a).text(cData[d][a]);
                                }
                            }
                        } else {
                            if ( 'conditionJexl' == d ) {
                                $('#rule-' + d).text(unescape(cData[d]));
                            } else {
                                $('#rule-' + d).text(cData[d]);
                            }
                        }
                    }
                    
                }
                
            } else {
                $elem.removeClass('active');
                $elParent.find('.remove-rule').attr('disabled', true);
                
                if ( me.AllRules[itemId] ) {
                    me.$el.find('.new-rule-container .new-window-box').fadeOut();
                }
            }
        },
        onAddRule: function(e) {
            var me = this;
            
            me.buildJexl();
            $('#new-rule').modal('show');
        },
        addRule: function(text) {
            var me = this,
                $container = me.$el.find('.rules-container .item-list'),
                listSize = $container.find('.list-row').length;
        
            if ( 0 !== listSize ) {
                $container.find('.list-row').last().after(_.template($('#templateRoleRow').html(), {model: {title: text}}));
            } else {
                $container.prepend(_.template($('#templateRoleRow').html(), {model: {title: text}}));
            }
        },
        getRules: function(cb) {
            var me = this,
                rule = new me.Model();
            
            Util.showSpinner();
            rule.fetch({
                url: 'api/rules/rules',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        me.currRules = res || [];
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
        saveRule: function(e, allActions) {
            var me = this,
                $elem = $(e.currentTarget),
                $parent = $elem.closest('.modal-content'),
                $inputFields = $parent.find('input.rule-field'),
                model = new me.Model(),
                data = {},
                actionID = $parent.find('select[name="action"]').val();
                
                $inputFields.each(function() {
                    var $this = $(this);
                    data[$this.attr('name')] = $.trim($this.val());
                });
                
                data.action = allActions[actionID] || {};                
                data.conditionJexl = escape($('code.condition-jexl').text());
                
//                top.RULESDATA = data; return;
                
                if ( !data.ruleName ) {
                    Alerts.Error.display({title: 'Error', content: "Rule name cannot be empty"});
                    return;
                }
                
            me.showLoader();
            
            model.save(data, {
                url: 'api/rules/rule',
                success: function (model, res) {
                    me.hideLoader();
                    if ( _.isObject(res) ) {
                        if ( !_.isEmpty(res) ) {
                            me.getRules(function(rules) {
                                me.renderRules(rules);
                            });
                            me.$el.find('.new-rule-container .new-window-box').fadeOut();
                        } else {
                            Alerts.Error.display({title: 'Error', content: "Failed during create Rule"});
                        }
                    }
                },
                error: function () {
                    Alerts.Error.display({title: 'Error', content: "Failed during create Rule"});
                    me.hideLoader();
                }
            });
            return false;
        },
        removeRule: function(e) {
            var me = this,            
                model = new me.Model({id: 'del'}),
                $elem = $(e.currentTarget),
                $container = $elem.closest('.item-list'),
                ruleID = $container.find('.list-row.active').attr('did');
        
            if ( ruleID ) {
                Util.showSpinner();
                model.destroy({
                    url: 'api/rules/rule/' + ruleID,
                    complete: function(res) {
                        if ( 200 == (res || {}).status ) {
                            me.getRules(function(rules) {
                                me.renderRules(rules);
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
        },
        renderRules: function(rules) {
            var me = this,
                template = _.template($('#templateRulesView').html(), {data: rules});

            me.$el.find('.new-rule-container .new-window-box').fadeOut();
            me.AllRules = {};

            _.each(rules, function (model, key) {
                me.AllRules[model.hotpotCardsRuleId] = model;
            });
            
            me.$el.find('.rules-container .item-list').html(template);
        },
        renderNewRuleActions: function(actionTemplateId) {
            var me = this,                
                template = _.template($('#templateActionFormView').html(), {model: me.AllActions[actionTemplateId] || {}});            
            
            $('#new-rule .new-rule-container .rule-action-pane').html(template);
        },
        buildJexl: function() {
            var me = this,
                templateHours = _.template($('#templateHoursView').html(), {model: {}}),
                templateMins = _.template($('#templateMinsView').html(), {model: {}}),
                $startHour = $('#start-hour').html(templateHours),
                $endHour = $('#end-hour').html(templateHours),
                $startMin = $('#start-min').html(templateMins),
                $endMin = $('#end-min').html(templateMins),
                $ruleType = $('input[name="condition-type"]').val(''),
                updateRules = function($elem) {
                    var currDateStart = 0,
                        endDate = parseInt($endHour.val() || 0);
                    
                    if ( 'start-hour' == $elem.attr('id') ) {
                        currDateStart = parseInt($elem.val());
                        $endHour.html(_.template($('#templateHoursView').html(), {model: {start: currDateStart || 0}}));
                        if ( currDateStart > endDate ) {
                            endDate = currDateStart;
                        }
                        $endHour.find('option').each(function(i, el) {
                            if ( endDate == parseInt($(this).val()) ) {
                                el.parentElement.selectedIndex = i;
                            }
                        });
                    }

                    $('code.condition-jexl').text(
                        'type == \'' + $ruleType.val() + '\' && '
                        + '( (time.hourOfDay > ' + $startHour.val() + ' && time.hourOfDay < ' + $endHour.val() + ') || '
                        + '(time.hourOfDay == ' + $startHour.val() + ' && time.minuteOfHour > ' + $startMin.val() + ') || '
                        + '(time.hourOfDay == ' + $endHour.val() + ' && time.minuteOfHour < ' + $endMin.val() + ') )');
                    
                };

            $('code.condition-jexl').text('');

            $('.condition-jexl-box').off().on('change', 'select', function () {
                updateRules($(this));                
            });
            
            $ruleType.off().on('keyup', function () {
                updateRules($(this));
            });            
        },
        init: function() {
            var me = this;
            
            me.buildJexl();
            
            me.getRules(function(rules) {
                me.renderRules(rules);
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
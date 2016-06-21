define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-content-iapprove',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.RULE_VIEW = me;

            me.options.eventPubSub.bind("initIapprove", function(callback) {
                callback(me);
                me.init();
            });
        },
        events: {
            'click .add-iapprove': "onAddIapprove",
            'click .remove-iapprove': "removeIapprove",
            'click .tab-row': "openDetails",
            'click .tab-row .tab-box, .tab-row input': "onClickRowItem",
            'click .js-cancel': "closeDetails",
            'click #id-search-iapprove-btn-search': "onSearch",
            'click span.icon-search-reset': "onSearchReset",
            'click .js-del-iapprove': "removeIapprove",
            'click .js-save-iapprove': "saveIapprove"
        },
        onClickRowItem: function (e) {
            e.stopPropagation();
        },
        closeDetails: function(e) {
            var me = this,
                $elem = $(e.currentTarget).closest('.tab-row');
            
            $elem.find('.tab-row-collaps').click();
        },
        openDetails: function(e) {
            var me = this,
                $elem = $(e.currentTarget);
            
            me.closeNewIapprove();
        
            if ( !$elem.hasClass('active') ) {
                
                me.options.eventPubSub.trigger("getActions", function(actions) {
                    me.getDevices(function(devices) {
                        var cIapprove = (me.AllIapproves[$elem.attr('did')] || {}),
                            template,
                            devTemplate,
                            deviceSelect,
                            conditionStr = (cIapprove.conditionJexl || '').split(' && ('),
                            capabilityCondition = me.parseDeviceConditionStr(conditionStr[0]),
                            timeCondition = me.parseTimeConditionStr(conditionStr[1]);

                        me.currentIapprove = cIapprove;
                        me.Actions = actions;                    
                        cIapprove.actions = actions;
                        cIapprove.devices = devices;
                        
                        

                        $elem.parent().find('> .active .exp-col-edit').hide();
                        $elem.parent().find('> .active .exp-col-read').show();
                        $elem.parent().find('> .active').removeClass('active').find('.tab-box').slideUp('fast');
                        
                        template = $(_.template($('#templateIapproveDetailsView').html(), {model: cIapprove, timeCondition: timeCondition}));
                        $elem.find('.tab-box').html(template);
                        
                        deviceSelect = $elem.find('select[name="device"]');
                        devTemplate = $(_.template($('#templateKeyDevicesView').html(), {model: (devices[deviceSelect.val()] || {}), capabilityCondition : capabilityCondition}));
                        
                        $elem.find('.tab-box .table-device-type').html(devTemplate);

                        $elem.addClass('active').find('.tab-box').slideDown('fast', function() {
                            $elem.find('.tab-box select').select2();
                        });
                        deviceSelect.on('change', function() {
                            devTemplate = $(_.template($('#templateKeyDevicesView').html(), {model: (devices[$(this).val()] || {}), capabilityCondition : capabilityCondition}));
                            $elem.find('.tab-box .table-device-type').html(devTemplate);
                        });
                        $elem.find('.exp-col-edit').show();
                        $elem.find('.exp-col-read').hide();
                    });
                });
                
            } else {
                $elem.find('.exp-col-edit').hide();
                $elem.find('.exp-col-read').show();
                $elem.removeClass('active').find('.tab-box').slideUp('fast', function() {
                    me.$el.find('.tab-box').empty();
                });
            }
        },
        parseDeviceConditionStr: function(str) {
            var me = this,
                condArr = (str || '').split(' && '),
                condObj = {};
            
            condArr.shift();
            condArr.forEach(function(v, i) {
                var currCond = (v || '').split(' == '), key;
                if ( 2 == currCond.length ) {
                    key = (currCond[0] || '').replace(/(.*)\(\'|\'\)(.*)/g, '');
                    condObj[key] = (currCond[1] || '').replace(/\'|\s/g, '');
                }
            });
            
            return condObj;
        },
        parseTimeConditionStr: function(str) {
            var me = this,
                timeArr = (str || '').split(' || '),
                timeObj = {};
            
            timeObj.startHour = parseInt(((timeArr[0] || '').split(' && ')[0] || '').split(' > ')[1] || 0);
            timeObj.startMin = parseInt(((timeArr[1] || '').split(' && ')[1] || '').split(' > ')[1] || 0);
            timeObj.endHour = parseInt(((timeArr[0] || '').split(' && ')[1] || '').split(' < ')[1] || 0);
            timeObj.endMin = parseInt(((timeArr[2] || '').split(' && ')[1] || '').split(' < ')[1] || 0);
            
            if ( 12 < timeObj.startHour ) {
                timeObj.startHourPM = true;
                timeObj.startHour -= 12;
            }
            
            if ( 12 < timeObj.endHour ) {
                timeObj.endHourPM = true;
                timeObj.endHour -= 12;
            }
            
            return timeObj;
        },
        buildTimeCondition: function() {
            var me = this,
                $currIapproveUI = me.$el.find('.tab-row.active'),
                $startHour,
                $startMin,
                $startPM,
                $endHour,
                $endMin,
                $endPM,
                strCond = '';
            
            if ( $currIapproveUI.length ) {
                $startHour = parseInt($currIapproveUI.find('select[name="start-hour"]').val());
                $startMin = parseInt($currIapproveUI.find('select[name="start-min"]').val());
                $startPM = 'PM' == $currIapproveUI.find('select[name="start-am-pm"]').val();
                $endHour = parseInt($currIapproveUI.find('select[name="end-hour"]').val());
                $endMin = parseInt($currIapproveUI.find('select[name="end-min"]').val());
                $endPM = 'PM' == $currIapproveUI.find('select[name="end-am-pm"]').val();
                
                if ( $startPM ) {
                    $startHour += 12;
                }
                if ( $endPM ) {
                    $endHour += 12;
                }
                
                if ( $startHour || $startMin || $endHour || $endMin ) {
                    strCond = '( (time.hourOfDay > ' + $startHour + ' && time.hourOfDay < ' + $endHour + ') || '
                        + '(time.hourOfDay == ' + $startHour + ' && time.minuteOfHour > ' + $startMin + ') || '
                        + '(time.hourOfDay == ' + $endHour + ' && time.minuteOfHour < ' + $endMin + ') )';
                }
            }
            
            return strCond;
        },
        closeNewIapprove: function() {
            var me = this,
                $elem = me.$el.find('.js-new-iapprove');
            
            if ( $elem.hasClass('active') ) {
                $elem.find('.tab-box').slideUp('fast', function() {
                    $elem.remove();
                });
                me.currentIapprove = {};
            }
        },
        onSearch: function() {
            var me = this,
                strSearch = $.trim(me.$el.find('input#id-search-iapprove').val()).toLowerCase(),
                res = [];

            if ( me.AllIapproveList ) {

                if ( '' !== strSearch ) {
                    for ( var i = 0, len = me.AllIapproveList.length; i < len; i++ ) {
                        if ( 0 === (me.AllIapproveList[i].ruleName || '').toLowerCase().indexOf(strSearch) ) {
                            res.push(me.AllIapproveList[i]);
                        }
                    }
                } else {
                    res = me.AllIapproveList;
                }
                me.render(res);
            }
        },
        onSearchReset: function() {
            var me = this;

            me.$el.find('input#id-search-iapprove').val('');
            me.render(me.AllIapproveList);
        },
        onAddIapprove: function(e) {
            var me = this,
                template = $(_.template($('#templateIapproveRowView').html(), {data: [{strTimeCreated: me.moment().format('MM/DD/YYYY')}]}));
            
            me.$el.find('.js-new-iapprove').remove();
            
            template.addClass('js-new-iapprove');
            
            me.$el.find('.content-iapprove-list').prepend(template);
            me.$el.find('.content-iapprove-list .js-new-iapprove .tab-row-collaps').click();
        },
        getIapproves: function(cb) {
            var me = this,
                iapprove = new me.Model();

            me.AllIapproves = {};
            me.AllIapproveList = [];
            
            Util.showSpinner();
            iapprove.fetch({
                url: 'api/iapprove/iapprove',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        me.AllIapproveList = res || [];
                        
                        _.each(me.AllIapproveList, function(model, key) {
                            model.strTimeCreated = me.moment(model.timeCreated).format('MM/DD/YYYY');
                        });
                        
                        me.AllIapproveList.forEach(function(item) {
                            me.AllIapproves[item.hotpotCardsIapproveId] = item;
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
        saveIapprove: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                ruleId = $elem.attr('did'),
                $parent = $elem.closest('.tab-row'),
                model = new me.Model(),
                data = {},
                curDeviceName = '',
                condItemArr = [],
                loc = 'api/iapprove/iapprove',
                timeCond = me.buildTimeCondition();
            
                if ( !$parent.find('input.js-iapprove-title').validationEngine('validate') ) {
//                    Alerts.Error.display({title: 'Error', content: "Iapprove name cannot be empty"});
                    return false;
                }
                data.ruleName = $.trim($parent.find('input.js-iapprove-title').val());
                data.action = me.Actions[$parent.find('select[name="action"]').val()];
                data.description = $.trim($parent.find('input.js-iapprove-description').val());
                data.timeCreated = (new Date().getTime());
                
                curDeviceName = $parent.find('select[name="device"]').val();
//                data.action.deviceType = me.AllDevices[curDeviceName];
                data.conditionDevice1 = me.AllDevices[curDeviceName];
                
                
                data.conditionJexl = "type.getName() == '" + curDeviceName;
                
                $parent.find('.table-device-type tr').each(function(i, m) {
                    var $this = $(this),
                        cKey = $($this.find('td')[0]).find('span').text(),
                        cVal = $($this.find('td')[2]).find('input').val();
                    if ( cVal && '' != cVal ) {
                        condItemArr.push(" type.getCapability().get('" + cKey + "') == '" + cVal + "'");
                    }
                });
                
                if ( timeCond ) {
                    condItemArr.push(timeCond);
                }
                
                if ( !_.isEmpty(condItemArr) ) {
                    data.conditionJexl +=  "' && " + condItemArr.join(' && ');
                }
                
//                data.conditionJexl = escape(data.conditionJexl);
                
                $parent.find('.iapprove-details-list .js-data-row').each(function() {
                    var cKey = $.trim($(this).find('.js-data-key').text()),
                        cVal = $.trim($(this).find('select').val());
                    if ( cKey  ) {
                        data.capability[cKey] = cVal;
                    }
                });                
                
//                if ( ruleId ) {
//                    loc += '/' + ruleId;
//                } else {
//                    data.id = 1;
//                }
                
//                top.RULESSDATA = data; return;
                
            me.showLoader();
            
            model.save(data, {
                url: loc,
                dataType: 'json',
                success: function (model, res) {
                    me.hideLoader();
                    res = res || {};
                    if ( res && false !== res.success ) {
                        me.getIapproves(function(iapprove) {
                            me.render(iapprove);
                        });
                        me.$el.find('.new-iapprove-container .new-window-box').fadeOut();
                        $('#new-iapprove').modal('hide');
                    } else {
                        Alerts.Error.display({title: 'Error', content: (res || {}).error || 'Failed during save Iapprove (' + res + ')'});
                    }
                },
                error: function (model, res) {
                    Alerts.Error.display({title: 'Error', content: (res.responseJSON || {}).error || "Failed during save Iapprove"});
                    me.hideLoader();
                }
            });
            return false;
        },
        removeIapprove: function(e) {
            var me = this,            
                model = new me.Model({id: 'del'}),
                $elem = $(e.currentTarget),
                ruleId = $elem.attr('did');
        
            Alerts.Confirm.display({
                title: 'Are you sure you want to delete “' + me.AllIapproves[ruleId].ruleName + '” iapprove?',
                yesTitle: 'Delete'
            }, function() {
                if ( ruleId ) {
                    Util.showSpinner();
                    model.destroy({
                        url: 'api/iapprove/iapprove/' + ruleId,
                        complete: function(res) {
                            if ( 200 == (res || {}).status ) {
                                me.getIapproves(function(iapprove) {
                                    me.render(iapprove);
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
                template = $(_.template($('#templateIapproveRowView').html(), {data: data}));
            
            me.$el.find('.content-iapprove-list').html(template);
        },
        init: function() {
            var me = this;
            me.Actions = {};
            me.AllDevices = {};
            me.getIapproves(function(iapprove) {
                me.render(iapprove);
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
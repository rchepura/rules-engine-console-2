define(['jquery', 'backbone'], function($, Backbone) {
    return Backbone.View.extend({
        el: '#id-content-report',
        Model: Backbone.Model.extend(),
        GraphHeight: 260,
        GraphWidth: 400,
        enableInteractivity: true,
        initialize: function() {
            var me = this;

            window.REPORT_VIEW = me;

            me.options.eventPubSub.bind("initReport", function(callback) {
                callback(me);
                if ( me.options.graphData ) {
                    me.GraphHeight = me.options.graphData.height || me.GraphHeight;
                    me.GraphWidth = me.options.graphData.width || me.GraphWidth;
                    me.enableInteractivity = !me.options.graphData.disableInteractivity;
                }
                me.init();
            });
        },
        events: {

        },
        getTopics: function(callback) {
            var me = this,
                user = new me.Model();
            
            callback();
            return;

            Util.showSpinner();
            user.fetch({
                url: 'api/topiccontroller/analytics',
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
        renderActiveApprovalRequestors: function(data) {
            var me = this,
                graphData, options,
                template = $(_.template($('#templateReportActiveApprovalRegquestorsView').html(), {data: data || {}}));

            me.$el.find('.content-active-approval-requestors-list').html(template);

            graphData = google.visualization.arrayToDataTable((function() {
                var resData = [['activeApprovalRequestors', '% of Active Approval Requestors']];
                _.each( (data || []).reverse(), function(model, key) {
                    resData.push([model.level, model.value]);
                });
                return resData;
            })());
            options = {
//                height: me.GraphHeight,
//                width: me.GraphWidth,
                enableInteractivity: me.enableInteractivity,
                chartArea: {top: 15, bottom: 15},
                legend: {position: 'none'},
                slices: {
                    0: { color: '#C55C57' },
                    1: { color: '#A3BC65' }
                }
            };
            new google.visualization.PieChart(document.getElementById('active-approval-requestors')).draw(graphData, options);
        },
        renderApprovalRates: function(data) {
            var me = this,
                graphData, options,
                template = $(_.template($('#templateReportApprovalRatesView').html(), {data: data || {}}));

            me.$el.find('.content-approval-rates-list').html(template);

            graphData = google.visualization.arrayToDataTable((function() {
                var resData = [['Approval Rates', {type: "number"}, {role: "style"}]];
                _.each(data || [], function(model, key) {
                    resData.push([model.level, model.value, model.color]);
                });
                return resData;
            })());            
            options = {
//                height: me.GraphHeight,
//                width: me.GraphWidth,
                enableInteractivity: me.enableInteractivity,
                chartArea: {top: 15, bottom: 20},
                legend: {position: 'none'},
                hAxis: {textPosition: 'none'},
                vAxis: {
                    title: 'Number of Approvals',
                    titleTextStyle: {bold: true},
                    minValue: 0,
                    format: ''
                }
            };
            new google.visualization.ColumnChart(document.getElementById('approval-rates')).draw(graphData, options);
        },
        renderApprovalResponseTime: function(data) {
            var me = this,
                graphData, options,
                template = $(_.template($('#templateApprovalResponseTimeView').html(), {data: {Actual: '#578BC1', Average: '#C6C6C6'}}));

            me.$el.find('.content-approval-response-time-list').html(template);

            graphData = google.visualization.arrayToDataTable((function() {
                var resData = [['Month', 'Actual', 'Average']];
                _.each(data || [], function(model, key) {
                    resData.push([model.level].concat(model.value));
                });
                return resData;
            })());
            options = {
//                height: me.GraphHeight,
//                width: me.GraphWidth,
                enableInteractivity: me.enableInteractivity,
                chartArea: {top: 15, bottom: 20},
                legend: {position: 'none'},
//                hAxis: {textPosition: 'none'},
                vAxis: {
                    title: 'Number Days',
                    titleTextStyle: {bold: true},
                    minValue: 0,
                    format: ''
                },
                colors: ['#578BC1','#C6C6C6']
            };
            new google.visualization.AreaChart(document.getElementById('approval-response-time')).draw(graphData, options);
        },
        init: function() {
            var me = this;
  
            me.getTopics(function(sData) {
                me.render(sData);
            });
        },
        render: function(reportData) {
            var me = this, renderDashboard, regCount = 0,
                colors = ['#A3BC65', '#C55C57', '#578BC1', '#5EBACF', '#6296C7', '#ABC370'],
                colors2 = ['#578BC1', '#C6C6C6'],
                ActiveApprovalRequestors = [], ApprovalRates = [], ApprovalResponseTime = [];
            
            reportData = reportData || {
                ActiveApprovalRequestors: {
                    'Approvals requested': 62,
                    'No approvals requested': 38
                },
                ApprovalRates: {
                    'Approved': 50,
                    'Rejected': 15,
                    'Pending': 10
                },
                ApprovalResponseTime: {
                    Apr: [0.8, 1],
                    May: [2.5, 2.3],
                    Jun: [2.3, 2]
//                    Actual : {
//                        Apr: 0.8,
//                        May: 2.5,
//                        Jun: 2.3
//                    },
//                    Average : {
//                        Apr: 1,
//                        May: 2.3,
//                        Jun: 2
//                    }
//                    Actual : {
//                        Apr: [0.8, 1.2, 2.5],
//                        May: [2,0, 1.5, 2.0],
//                        Jun: [1.8, 2.0, 2.2]
//                    },
//                    Average : {
//                        Apr: [1.0, 1.2, 2.4],
//                        May: [1,9, 1.4, 2.0],
//                        Jun: [1.8, 2.3, 2.0]
//                    }
                }
            };
            
            _.each((reportData.ActiveApprovalRequestors || {}), function(val, key) {
                ActiveApprovalRequestors.push({level: key, value: val, color: colors[regCount++]});
                if ( !colors[regCount] ) {
                    regCount = 0;
                }
            });
            regCount = 0;
            _.each((reportData.ApprovalRates || {}), function(val, key) {
                ApprovalRates.push({level: key, value: val, color: colors[regCount++]});
                if ( !colors[regCount] ) {
                    regCount = 0;
                }
            });
            _.each((reportData.ApprovalResponseTime || {}), function(val, key) {
                ApprovalResponseTime.push({level: key, value: val, color: colors2[regCount++]});
                if ( !colors2[regCount] ) {
                    regCount = 0;
                }
            });
            renderDashboard = function() {
                me.renderActiveApprovalRequestors(ActiveApprovalRequestors);
                me.renderApprovalRates(ApprovalRates);
                me.renderApprovalResponseTime(ApprovalResponseTime);
            };

            if ( !google.visualization ) {
                google.charts.load('current', {packages: ['corechart', 'bar']});
                google.charts.setOnLoadCallback(renderDashboard);
            } else {
                renderDashboard();
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
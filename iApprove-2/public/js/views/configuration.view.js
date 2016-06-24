define(['jquery', 'backbone', 'moment', 'matcher', 'select2'], function($, Backbone, Moment, Matcher, Select2) {
    return Backbone.View.extend({
        el: '#id-content-configuration',
        Model: Backbone.Model.extend(),
        moment: Moment,
        PagingSize: 10,
        initialize: function() {
            var me = this,
                now = new Date();           
            
            window.CONFIGURATION_VIEW = me;

            me.options.eventPubSub.bind("initConfiguration", function(callback) {
                callback(me);
                me.init();
            });
            
            me.$el.find('.js-select-logs-startdate').datepick({
                inline: true,
//                showOnFocus: false,
//                showTrigger: '<img src="images/assets/ic_calendar.png" class="datepick-trigger exp-col-edit">',
//                minDate: now,
                onSelect: function (date) {
                    me.$el.find('.js-select-logs-startdate').val($.datepick.formatDate("mm/dd/yyyy", date[0]));
                    me.onChangeTimeFrame();
                }
            }).val(me.moment().subtract('month', 1).format('MM/DD/YYYY'));
            me.$el.find('.js-select-logs-enddate').datepick({
                inline: true,
//                showOnFocus: false,
//                showTrigger: '<img src="images/assets/ic_calendar.png" class="datepick-trigger exp-col-edit">',
                maxDate: now,
                onSelect: function (date) {
                    me.$el.find('.js-select-logs-enddate').val($.datepick.formatDate("mm/dd/yyyy", date[0]));
                    me.onChangeTimeFrame();
                }
            }).val(me.moment().format('MM/DD/YYYY'));
        },
        events: {
            'click .users-row .tab-box': "onClickRowItem",
            'click #id-search-logs-btn-search': "onLogSearch",
            'click span.icon-search-reset': "onLogSearchReset",
            'click .sort-by-name': "onSortName",
            'change .content-logs-list .pagination-size select': "onChangePaginationSize",
            'click .js-download-report': "getReportLogs",
            'change select#id-select-log-users': "onChangeUser"
        },
        onClickRowItem: function (e) {
            e.stopPropagation();
        },
        onChangeUser: function (e) {
            var me = this,
                userId = $(e.currentTarget).val(),
                from = new Date(me.$el.find('.js-select-logs-startdate').val()).getTime(),
                to = new Date(me.moment(me.$el.find('.js-select-logs-enddate').val(), 'MM/DD/YYYY').add('days', 1).unix() * 1000).getTime();
            
            me.LogList = [];
            me.CurrentUserID = userId;
            
            me.getLogs(function(logs) {
                me.render(logs);
            }, 0, userId, from, to);
        },
        onChangeTimeFrame: function () {
            var me = this,
                from = new Date(me.$el.find('.js-select-logs-startdate').val()).getTime(),
                to = new Date(me.moment(me.$el.find('.js-select-logs-enddate').val(), 'MM/DD/YYYY').add('days', 1).unix() * 1000).getTime();

            me.LogList = [];
            
            me.getLogs(function(logs) {
                me.render(logs);
            }, 0, me.CurrentUserID, from, to);
        },
        getReportLogs: function (e) {
            e.stopPropagation();
            var me = this,
                model = new me.Model();

            Util.showSpinner();
            model.save({LogList: me.LogList}, {
                url: 'report/logs',
                success: function (model, res) {
                    Util.hideSpinner();
                    if ( _.isObject(res) ) {
                        if ( res.success && (res.data || {}).report ) {
                            $('#downloadFrame').attr('src', 'report/' + res.data.report);
                        } else {
                            Alerts.Error.display({title: 'Error', content: "Failed during generate report"});
                        }
                    }
                },
                error: function () {
                    Alerts.Error.display({title: 'Error', content: "Failed during generate report"});
                    Util.hideSpinner();
                }
            });
            return false;
        },
        onSortName: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                col = $elem.attr('data-id'),
                sortedLogs = [],
                tmpArr = [];
            
            if ( me.LogList ) {
                
                if ( !$elem.hasClass('active') ) {
                
                    for ( var i = 0, len = me.LogList.length; i < len; i++ ) {
                        if ( !_(tmpArr).contains(me.LogList[i][col]) ) {
                            tmpArr.push(me.LogList[i][col]);
                        }
                    }
                    tmpArr.sort();
                    for ( var t = 0; t < tmpArr.length; t++ ) {
                        for ( i = 0; i < len; i++ ) {
                            if ( tmpArr[t] === me.LogList[i][col] ) {
                                sortedLogs.push(me.LogList[i]);
                            }
                        }
                    }
                
                    me.LogList = sortedLogs;                
                
                    $elem.parent().find('.user-cell.active').removeClass('active');
                    if ( $elem.find('span').hasClass('arrow-sort-up') ) {
                        $elem.find('span').toggleClass('arrow-sort-dn arrow-sort-up');
                    }
                    $elem.addClass('active');
                } else {
                    me.LogList.reverse();
                    $elem.find('span').toggleClass('arrow-sort-dn arrow-sort-up');
                }
                me.getLogPage(function(sortedLogs) {
                    me.render(sortedLogs);    
                }, 1);                
            }            
        },
        onLogSearch: function() {
            var me = this,
                strSearch = $.trim(me.$el.find('input#id-search-logs').val()).toLowerCase(),
                sortedLogs = [];
            
            if ( me.LogList ) {
                
                if ( '' !== strSearch ) {                
                    for ( var i = 0, len = me.LogList.length; i < len; i++ ) {
//                        if ( ( 0 === (me.LogList[i].firstName || '').toLowerCase().indexOf(strSearch) ) || ( 0 === (me.LogList[i].lastName || '').toLowerCase().indexOf(strSearch) )) {
                        if ( ( 0 === (me.LogList[i].email || '').toLowerCase().indexOf(strSearch) ) ) {
                            sortedLogs.push(me.LogList[i]);
                        }
                    }
                } else {
                    sortedLogs = me.LogList;
                }
                me.getLogPage(function(pagedLogs, serchedLogs) {
                    me.render(pagedLogs, 1, serchedLogs);    
                }, 1, sortedLogs);
            }            
        },
        onLogSearchReset: function() {
            var me = this;
            
            me.$el.find('input#id-search-logs').val('');
            me.getLogPage(function(pagedLogs) {
                me.render(pagedLogs);    
            }, 1);
        },
        getLogPage: function(callback, page_index, dLogs) {
            var me = this,
                pagedLogs = [],
                countLogs = 0,
                startIndex = 0,
                endIndex = 0,
                logs = dLogs || me.LogList;
            
            countLogs = logs.length;
            startIndex = ( me.PagingSize * (page_index - 1) );

            endIndex = startIndex + me.PagingSize;

            if ( countLogs < endIndex ) {
               endIndex = countLogs;
            }                        

            for ( var i = startIndex; i < endIndex; i++ ) {
                pagedLogs.push(logs[i]);
            }
            
            callback(pagedLogs, dLogs);
        },
        getUsers: function(callback) {
            var me = this,
                log = new me.Model();
        
            me.LogUsers = [];
            
            Util.showSpinner();
            log.fetch({
                url: 'api/log/users',
                dataType: 'json',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        me.LogUsers = res || [];
                        if ( callback ) {
                            callback(me.LogUsers);
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
                    if ( callback ) {
                        callback(me.LogUsers);
                    }
                    Util.hideSpinner();
                }
            });
        },
        getLogs: function(callback, page_index, userId, from, to) {
            var me = this,
                log = new me.Model();
            
            page_index = page_index || 1;
            from = from || new Date(me.$el.find('.js-select-logs-startdate').val()).getTime();
            to = to || new Date(me.$el.find('.js-select-logs-enddate').val()).getTime();
            
            
            if ( !_.isEmpty(me.LogList) ) {
                if ( callback ) {
                    me.getLogPage(function(pagedLogs) {
                        callback(pagedLogs);
                    }, page_index);
                } else {
                    me.getLogPage(function(pagedLogs) {
                        me.render(pagedLogs);
                    }, page_index);
                }
                return;
            }
            
            me.LogList = [];
            me.Logs = {};
            
            Util.showSpinner();
            log.fetch({
                url: 'api/log?offset=0&page_size=200&from=' + (from || 0) + '&to=' + (to || (new Date().getTime())) + '&forUser=' + (userId || ''),
                success: function(model, res) {
                    var logs, fixedLogs = [];
                    
                    if ( res && false !== res.success ) {
                        
                        logs = (res || {}).list || [];
                        
                        for ( var i = 0 ; i < logs.length; i++ ) {                                
                            if ( logs[i] ) {
                                logs[i].strCreated = me.moment(logs[i].timestamp).format('MM/DD/YYYY hh:mm:ss');
                                logs[i].email = ( logs[i].user || {} ).email || 'N/A';
                                me.Logs[logs[i].id] = logs[i];
                                fixedLogs.push(logs[i]);
                            }
                        }
                        
                        me.LogList = fixedLogs;
                        
                        if ( callback ) {
                            me.getLogPage(function(pagedLogs) {
                                callback(pagedLogs);
                            }, page_index);
                        } else {
                            me.getLogPage(function(pagedLogs) {
                                me.render(pagedLogs);
                            }, page_index);
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
        render: function(data, currPage, serchedLogs) {
            data = data ||[];
            var me = this,
                paging = null,
                pages = 0,
                pagingItem = null,
                template = $(_.template($('#templateLogsListView').html(), {data: data}));
            
            currPage = currPage || 1;
                
            paging = template.find('nav ul.pagination').empty();
            pages = Math.ceil(( serchedLogs || me.LogList ).length / me.PagingSize);

            if ( 1 < pages ) {
                for ( var c = 1, len = pages; c <= len; c++ ) {
                    if ( ( 15 - currPage ) < pages ) {
                        if ( ( c < currPage && ( pages - c ) > 14 ) || ( ( 10 + currPage ) < c && c < ( pages - 1 ) ) ) {
                            continue;
                        }
                        if ( ( 10 + currPage ) === c && c < ( pages - 3 ) ) {
                            paging.append($('<li class="dots"><span>...</span></li>'));
                            continue;
                        }
                    }
                    (function (ci) {
                        pagingItem = $('<li><span>' + ci + '</span></li>');
                        if ( currPage === ci ) {
                            pagingItem.addClass('active');
                        }
                        pagingItem.find('span').on('click', function() {
                            if ( !$(this).parent().hasClass('active') ) {
                                me.$el.find('input#id-search-logs').val('');
                                me.getLogs(function (pData) {
                                    me.render(pData, ci);
                                }, ci);
                            }                            
                        });
                        paging.append(pagingItem);
                    })(c);
                }
                paging.prepend('<li class="js-previous-page"><span>Previous</span></li>');
                paging.append('<li class="js-next-page"><span>Next</span></li>');
                if ( 1 < currPage ) {
                    paging.find('.js-previous-page span').on('click', function() {
                        var pg = currPage - 1;
                        me.getLogs(function (pData) {
                            me.render(pData, pg);
                        }, pg);
                        me.$el.find('input#id-search-logs').val('');
                    });
                } else {
                    paging.find('.js-previous-page').addClass('disabled');
                }
                if ( pages > currPage ) {
                    paging.find('.js-next-page span').on('click', function() {
                        var pg = currPage + 1;
                        me.getLogs(function (pData) {
                            me.render(pData, pg);
                        }, pg);
                        me.$el.find('input#id-search-logs').val('');
                    });
                } else {
                    paging.find('.js-next-page').addClass('disabled');
                }
            }
                
            
            me.$el.find('.content-logs-list').html(template);
            me.$el.find('.content-logs-list .pagination-size select option').each(function(i) {                
                if ( $(this).val() == me.PagingSize ) {
                    $(this).parent().get(0).selectedIndex = i;
                }
            });
            me.$el.find('.content-logs-list .pagination-size select').select2({minimumResultsForSearch: -1});
        },
        renderUsers: function(users) {
            var me = this,
                $elem = me.$el.find('.log-user-list'),
                template = $(_.template($('#templateLogUsersView').html(), {data: users}));

            $elem.html(template);
            $elem.find("select").select2({
                matcher: Matcher(function (term, text) {
                    if (text.toUpperCase().indexOf(term.toUpperCase()) == 0) {
                        return true;
                    }
                    return false;
                })
            });
        },
        init: function() {
            var me = this;
            
            me.LogList = [];
            me.Logs = {};
            
            me.$el.find('input#id-search-logs').val('');
            me.getLogs(function(logs) {
                me.render(logs);
            });
            me.getUsers(function(users) {
                me.renderUsers(users);
            });
        },
        onChangePaginationSize: function() {
            var me = this;
            
            me.PagingSize = parseInt(me.$el.find('.content-logs-list .pagination-size select').val());
            me.getLogs();
        }
    });
});

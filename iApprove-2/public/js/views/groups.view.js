define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-content-groups',
        Model: Backbone.Model.extend(),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.GROUPS_VIEW = me;

            me.options.eventPubSub.bind("initGroups", function(callback) {
                callback(me);
                me.init();
            });
            me.options.eventPubSub.bind("getGroups", function(callback) {
                me.getGroups(function(data) {
                    callback(data);
                });
            });
            $('button#modal-add-new-group-btn-add').click(function() {
                me.doAddGroup();
            });
            $('button#modal-remove-group-user-btn-remove').click(function() {
                if ( me.CurrentGroupRow && me.CurrentGroupRow.attr('data-id') ) {
                    me.doRemoveUserFromGroup(me.CurrentGroupRow.attr('data-id'), $(this).attr('data-id'));
                }
            });
            $('button#modal-search-users-btn-search').click(function(e) {
                me.onSearchMember(e);
            });
            $('button#modal-add-user-to-group-btn-add').click(function(e) {
                me.onAddMember(e);
            });
            $('button#modal-add-new-group-btn-delete').click(function() {
                me.onClickDeleteGroup();
            });
            $('button#modal-delete-group-btn-delete').click(function(e) {
                me.doDeleteGroup(e);
            });
        },
        events: {
            'click .main-tab': "switchTab",
            'click .row.groups-row': "onClickGroupRow",
            'click .row.groups-row .groups-box': "onClickGroupBox",
            'dblclick .row.groups-row': "onDblclickGroupRow",
            'click .row.groups-row .groups-box-row .icon-group-del': "onClickRemoveUser",
            'click #id-add-new-group': "onAddGroup",
            'click .js-add-new-member': "onPlusMember",
            'click #id-search-groups-btn-search': "onSearch",
            'click span.icon-search-reset': "onSearchReset",
            'click .js-download-report': "onClickDownloadReport"
        },
        onSearch: function() {
            var me = this,
                strSearch = $.trim(me.$el.find('input#id-search-groups').val()).toLowerCase(),
                res = [];

            if ( me.currGroupList ) {

                if ( '' !== strSearch ) {
                    for ( var i = 0, len = me.currGroupList.length; i < len; i++ ) {
                        if ( 0 === (me.currGroupList[i].name || '').toLowerCase().indexOf(strSearch) ) {
                            res.push(me.currGroupList[i]);
                        }
                    }
                } else {
                    res = me.currGroupList;
                }
                me.serchedGroupList = res;
                me.render(res);
            }
        },
        onSearchReset: function() {
            var me = this;

            delete me.serchedGroupList;
            me.$el.find('input#id-search-groups').val('');
            me.render(me.currGroupList);
        },
        onClickDownloadReport: function (e) {
            e.stopPropagation();
            var me = this,
                groups = (me.serchedGroupList || me.currGroupList),
                cntGroups = groups.length;
            
            if ( _.isEmpty(groups) ) {
                return;
            }
            
            for ( var i = 0; i < groups.length; i++ ) {
                
                if ( !groups[i].members ) {
                    me.getGroupUsers(groups[i].name, function() {
                        cntGroups--;
                        if ( 0 === cntGroups ) {
                            me.doDownloadReport(groups);
                        }
                    });
                } else {
                    cntGroups--;
                    if ( 0 === cntGroups ) {
                        me.doDownloadReport(groups);
                    }
                }                
            }
            
            return false;
        },
        doDownloadReport: function (groups) {
            var me = this,
                model = new me.Model();
            
            if ( _.isEmpty(groups) ) {
                return;
            }
            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            me.showLoader();
            model.save({GroupList: groups}, {
                url: 'report/groups',
                success: function (model, res) {
                    me.hideLoader();
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
                    me.hideLoader();
                },
                complete: function() {
                    delete me.saveInprocess;
                }
            });
            return false;
        },
        onClickGroupRow: function(e) {
            var me = this,
                $elem = $(e.currentTarget);
            
            e.stopPropagation();
            
            setTimeout(function() {
                if ( $elem.data('dblclk') ) {
                    $elem.data('dblclk', parseInt($elem.data('dblclk')) - 1);
                } else {
                    if ( !$elem.hasClass('active') ) {
                        me.CurrentGroupRow = $elem;
                        me.$el.find('.row.groups-row.active').removeClass('active').find('.groups-box').slideUp('fast');
                        me.getGroupUsers($elem.attr('data-id'), function(users) {
                            var template = $(_.template($('#templateGroupUsersView').html(), {data: users}));
                            $elem.find('.row.groups-box').html(template);
                            $elem.addClass('active').find('.row.groups-box').slideDown('fast');
                        });
                    } else {
                        delete me.CurrentGroupRow;
                        $elem.find('.row.groups-box').slideDown('fast', function() {
                            $elem.removeClass('active').find('.groups-box').slideUp('fast');
                        });
                    }
                }
            }, 300);
        },
        onDblclickGroupRow: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                groupData = me.currGroups[$elem.attr('data-id')] || {};
            
            me.SelectedGroup = groupData;
            
            e.stopPropagation();
            $elem.data('dblclk', 2);

            $('input#id-add-group-name').val(groupData.name);
            $('textarea#id-add-group-descr').val(groupData.descr);
            $('#modal-add-new-group .modal-row-delete-group').show();
            $('button#modal-add-new-group-btn-add').text('Save Changes');
            $('#modal-add-new-group .modal-title').text('Edit Group');
            $('#modal-add-new-group').modal('show');
        },
        onClickGroupBox: function(e) {
           e.stopPropagation();
        },
        onClickRemoveUser: function(e) {
            var me = this,
                $elem = $(e.currentTarget);
            
            $('button#modal-remove-group-user-btn-remove').attr('data-id', $elem.attr('data-id'));            
            $('#modal-remove-group-user').modal('show');
        },
        doRemoveUserFromGroup: function(groupName, userID) {
            var me = this,
                groupUser = new me.Model({id: groupName});
            
            Util.showSpinner();
            groupUser.destroy({
                url: 'api/leadercontroller/group/user/' + groupName + '?userID=' + userID,
                dataType: 'text',
                success: function(model, res) {
                    if ( /SUCCESS/.test(res) ) {
                        if ( me.CurrentGroupRow ) {
                            me.getGroupUsers(groupName, function(users) {
                                var template = $(_.template($('#templateGroupUsersView').html(), {data: users}));
                                me.CurrentGroupRow.find('.row.groups-box').html(template);
                            });
                        } else {
                            me.init();
                        }
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + res + ')'
                        });
                    }
                    $('#modal-remove-group-user').modal('hide');
                    Util.hideSpinner();                    
                }
            });
        },
        onClickDeleteGroup: function(e) {
            var me = this;
            
            $('#modal-delete-group').modal('show');
        },
        doDeleteGroup: function(e) {
            var me = this,
                group;
            
            if ( !me.SelectedGroup ) {
                return;
            }
            
            group = new me.Model({id: 'del'});
            
            Util.showSpinner();
            group.destroy({
                url: 'api/leadercontroller/group/' + me.SelectedGroup.name,
                dataType: 'text',
                success: function(model, res) {
                    if ( /SUCCESS/.test(res) ) {
                        me.init();
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + res + ')'
                        });
                    }
                    $('#modal-delete-group').modal('hide');
                    Util.hideSpinner();                    
                }
            });
        },
        onAddGroup: function(e) {
            var me = this;
            e.stopPropagation();
            
            delete me.SelectedGroup;
            
            $('input#id-add-group-name').val('');
            $('textarea#id-add-group-descr').val('');
            $('#modal-add-new-group .modal-row-delete-group').hide();
            $('button#modal-add-new-group-btn-add').text('Create Group');
            $('#modal-add-new-group .modal-title').text('Create New Group');
            $('#modal-add-new-group').modal('show');
        },
        onPlusMember: function(e) {
            var me = this;
            
            e.stopPropagation();
            
//            $('#modal-add-user-to-group input').val('');
//            $('#modal-add-user-to-group .add-user-to-group-box > div').html('');
//            $('#modal-add-user-to-group').modal('show');
            
            me.options.eventPubSub.trigger("getUsers", function(users) {                
                var template = $(_.template($('#templateAddMembersInGroupView').html(), {data: users}));
                
                template.find('.group-box-row-cell').parent().click(function() {
                    $(this).toggleClass('active');
                });
            
                $('#modal-add-user-to-group .add-user-to-group-box > div').html(template);
                $('#modal-add-user-to-group input').val('');
                $('#modal-add-user-to-group').modal('show');
            });
        },
        onSearchMember: function(e) {
            var me = this,
                template,
                searchStr = $.trim($('#modal-add-user-to-group input').val());
            
            e.stopPropagation();
            
            me.options.eventPubSub.trigger("getUsers", function(users) {
                var searchResult = [];
                
                for ( var i = 0; i < users.length; i++ ) {
                    if ( !( me.currGroupUsers || {} )[users[i].id] ) {
                        if ( -1 !== users[i].firstName.toLowerCase().indexOf(searchStr) ||  -1 !== users[i].lastName.toLowerCase().indexOf(searchStr) ) {
                            searchResult.push(users[i]);
                        }
                    }
                }
                
                template = $(_.template($('#templateAddMembersInGroupView').html(), {data: searchResult}));
                
                template.find('.group-box-row-cell').parent().click(function() {
                    $(this).toggleClass('active');
                });
            
                $('#modal-add-user-to-group .add-user-to-group-box > div').html(template);
            });
        },
        onAddMember: function (e) {
            var me = this,
                groupUser = null,
                groupName = me.CurrentGroupRow.attr('data-id'),
                loc = 'api/leadercontroller/group/assign/' + groupName,
                $elem = $(e.currentTarget),
                $elemBox = $elem.closest('.modal-content'),
                currUserIDs = [];
            
            $elemBox.find('.add-user-to-group-box-row.active').each(function() {
                currUserIDs.push($(this).attr('data-id'));
            });
            
            if ( _(currUserIDs).isEmpty() ) {
                return;
            }

            groupUser = new me.Model({groupMembers: currUserIDs});

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            groupUser.save( null, {
                url: loc,
                dataType: 'text',
                success: function(model, res) {
                    if ( /SUCCESS/.test(res) ) {
                        if ( me.CurrentGroupRow ) {
                            me.getGroupUsers(groupName, function(users) {
                                var template = $(_.template($('#templateGroupUsersView').html(), {data: users}));
                                me.CurrentGroupRow.find('.row.groups-box').html(template);
                            });
                        } else {
                            me.init();
                        }
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + res + ')'
                        });
                    }
                    $('#modal-add-user-to-group').modal('hide')
                    Util.hideSpinner();
                },
                complete: function() {
                    delete me.saveInprocess;
                }
            });
        },
        doAddGroup: function () {
            var me = this,
                group = null,
                loc = 'api/leadercontroller/group',
                data = {
                    formData: {
                        groupName: $('#id-add-group-name').val(),
                        descr: $('#id-add-group-descr').val()
                    }
                };
            
            if ( !$('input#id-add-group-name').validationEngine('validate') ) {
                Alerts.Error.display({title: 'WARNING', content: 'Not all fields filled'});
                return;
            }
            
            if ( me.SelectedGroup ) {
                loc = 'api/leadercontroller/group/' + me.SelectedGroup.name;                
                data.id = 1;
            }
            
            group = new me.Model(data);

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            group.save( null, {
                url: loc,
                dataType: 'text',
                success: function(model, res) {
                    if ( /SUCCESS/.test(res) ) {
                        me.init();
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + res + ')'
                        });
                    }
                    $('#modal-add-new-group').modal('hide');
                    Util.hideSpinner();
                },
                complete: function() {
                    delete me.saveInprocess;
                }
            });
        },
        getGroups: function(callback) {
            var me = this,
                group = new me.Model();
            
            if ( !_.isEmpty(me.currGroupList) ) {
                if ( callback ) {
                    callback(me.currGroupList);
                } else {
                    me.render(me.currGroupList);
                }
                return;
            }
            
            me.currGroups = {};
            me.currGroupList = [];
            
            Util.showSpinner();
            group.fetch({
                url: 'api/leadercontroller/group',
                success: function(model, res) {
                    res = res || [];
                    var fixedGroups = [];
                    
                    if ( res && false !== res.success ) {

                        for ( var i = 0; i < res.length; i++ ) {
                            if ( res[i] && res[i].name ) {
                                me.currGroups[res[i].name] = res[i];
                                if ( res[i].created ) {
                                    res[i].strCreated = me.moment(res[i].created).format('MM / DD / YYYY');
                                } else {
                                    res[i].strCreated = 'N/A';
                                }
                                fixedGroups.push(res[i]);
                            }
                        }
                        me.currGroupList = fixedGroups;
                        if ( callback ) {
                            callback(fixedGroups);
                        } else {
                            me.render(fixedGroups);
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
        getGroupUsers: function(groupName ,callback) {
            var me = this,
                group = new me.Model();
            
            me.currGroupUsers = {};
            
            Util.showSpinner();
            group.fetch({
                url: 'api/leadercontroller/group/users/' + groupName,
                success: function(model, res) {
                    res = res || {users: []};
                    var users = res.users || [],
                        fixedUsersArr = [];
                    
                    if ( res && false !== res.success ) {
                        
                        for ( var i = 0; i < users.length; i++ ) {
                            if ( users[i] ) {
                                me.currGroupUsers[users[i].id] = users[i];
                                fixedUsersArr.push(users[i]);
                            }
                        }
                        
                        for ( var g = 0; g < me.currGroupList.length; g++ ) {
                            if ( groupName === me.currGroupList[g].name ) {
                                me.currGroupList[g].members = fixedUsersArr;
                            }
                        }
                        
                        if ( callback ) {
                            callback(fixedUsersArr);
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
//                        me.options.eventPubSub.trigger("authFailed");
//                        me.getGroupUsers(groupName ,callback);
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
        render: function(data) {
            var me = this,
                template = $(_.template($('#templateGroupsView').html(), {data: data}));
            
            me.$el.find('.content-groups-list').html(template);
        },
        init: function() {
            var me = this;
            
            me.currGroups = {};
            me.currGroupList = [];
            
            me.getGroups(function(data) {
                me.render(data);
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
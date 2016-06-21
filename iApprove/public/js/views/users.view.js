define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-content-users',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.USERS_VIEW = me;

            me.options.eventPubSub.bind("initUsers", function(callback) {
                callback(me);
                me.init();
            });
        },
        events: {
            'click .add-user': "onAddUser",
            'click .remove-user': "removeUser",
            'click .tab-row': "openDetails",
            'click .tab-row .tab-box, .tab-row input': "onClickRowItem",
            'click .js-cancel': "closeDetails",
            'click #id-search-user-btn-search': "onSearch",
            'click span.icon-search-reset': "onSearchReset",
            'click .js-del-user': "removeUser",
            'click .js-save-user': "saveUser"
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
            
            me.closeNewUser();
        
            if ( !$elem.hasClass('active') ) {
                                
            } else {
                $elem.find('.exp-col-edit').hide();
                $elem.find('.exp-col-read').show();
                $elem.removeClass('active').find('.tab-box').slideUp('fast', function() {
                    me.$el.find('.tab-box').empty();
                });
            }
        },
        closeNewUser: function() {
            var me = this,
                $elem = me.$el.find('.js-new-user');
            
            if ( $elem.hasClass('active') ) {
                $elem.find('.tab-box').slideUp('fast', function() {
                    $elem.remove();
                });
                me.currentUser = {};
            }
        },
        onSearch: function() {
            var me = this,
                strSearch = $.trim(me.$el.find('input#id-search-user').val()).toLowerCase(),
                res = [];

            if ( me.AllUserList ) {

                if ( '' !== strSearch ) {
                    for ( var i = 0, len = me.AllUserList.length; i < len; i++ ) {
                        if ( 0 === (me.AllUserList[i].userName || '').toLowerCase().indexOf(strSearch) ) {
                            res.push(me.AllUserList[i]);
                        }
                    }
                } else {
                    res = me.AllUserList;
                }
                me.render(res);
            }
        },
        onSearchReset: function() {
            var me = this;

            me.$el.find('input#id-search-user').val('');
            me.render(me.AllUserList);
        },
        onAddUser: function(e) {
            var me = this,
                template = $(_.template($('#templateUserRowView').html(), {data: [{strTimeCreated: me.moment().format('MM/DD/YYYY')}]}));
            
            me.$el.find('.js-new-user').remove();
            
            template.addClass('js-new-user');
            
            me.$el.find('.content-user-list').prepend(template);
            me.$el.find('.content-user-list .js-new-user .tab-row-collaps').click();
        },
        getUsers: function(cb) {
            var me = this,
                user = new me.Model();

            me.AllUsers = {};
            me.AllUserList = [];
            
            Util.showSpinner();
            user.fetch({
                url: 'api/iapprove/admin/iapprove/users',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        me.AllUserList = res || [];
                        
                        _.each(me.AllUserList, function(model, key) {
                            model.strTimeCreated = me.moment(model.timeCreated).format('MM/DD/YYYY');
                        });
                        
                        me.AllUserList.forEach(function(item) {
                            me.AllUsers[item.hotpotCardsUserId] = item;
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
        saveUser: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                userId = $elem.attr('did'),
                $parent = $elem.closest('.tab-row'),
                model = new me.Model(),
                data = {},
                loc = 'api/iapprove/admin/iapprove/users';
            
                if ( !$parent.find('input.js-user-title').validationEngine('validate') ) {
                    return false;
                }
                
//                top.USERSSDATA = data; return;
                
            me.showLoader();
            
            model.save(data, {
                url: loc,
                dataType: 'json',
                success: function (model, res) {
                    me.hideLoader();
                    res = res || {};
                    if ( res && false !== res.success ) {
                        me.getUsers(function(users) {
                            me.render(users);
                        });
                        me.$el.find('.new-user-container .new-window-box').fadeOut();
                        $('#new-user').modal('hide');
                    } else {
                        Alerts.Error.display({title: 'Error', content: (res || {}).error || 'Failed during save User (' + res + ')'});
                    }
                },
                error: function (model, res) {
                    Alerts.Error.display({title: 'Error', content: (res.responseJSON || {}).error || "Failed during save User"});
                    me.hideLoader();
                }
            });
            return false;
        },
        removeUser: function(e) {
            var me = this,            
                model = new me.Model({id: 'del'}),
                $elem = $(e.currentTarget),
                userId = $elem.attr('did');
        
            Alerts.Confirm.display({
                title: 'Are you sure you want to delete “' + me.AllUsers[userId].userName + '” user?',
                yesTitle: 'Delete'
            }, function() {
                if ( userId ) {
                    Util.showSpinner();
                    model.destroy({
                        url: 'api/iapprove/rule/' + userId,
                        complete: function(res) {
                            if ( 200 == (res || {}).status ) {
                                me.getUsers(function(users) {
                                    me.render(users);
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
                template = $(_.template($('#templateUserRowView').html(), {data: data}));
            
            me.$el.find('.content-user-list').html(template);
        },
        init: function() {
            var me = this;
            me.getUsers(function(users) {
                me.render(users);
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
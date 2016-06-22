define(['jquery', 'backbone', 'moment', 'matcher', 'select2'], function($, Backbone, Moment, Matcher, Select2) {
    return Backbone.View.extend({
        el: '#id-content-users',
        Model: Backbone.Model.extend(),
        PagingSize: 10,
        moment: Moment,
        currFilters: {},
        initialize: function() {
            var me = this;

            window.USERS_VIEW = me;

            me.options.eventPubSub.bind("initUsers", function(callback) {
                callback(me);
                me.init();
            });
            me.options.eventPubSub.bind("getUsers", function(callback) {
                me.getUsers(function() {
                    callback(me.UserList || []);
                });
            });
            me.options.eventPubSub.bind("getUserByID", function(id, callback) {
                me.getUserByID(id, function(userData) {
                    callback(userData);
                });
            });
            $('input#userPicture').off().on('change', function () {
                var file = ($(this)[0].files || [])[0],
                    maxIconWidth = 80,
                    maxIconHeight = 80;

                if ( file && -1 == file.type.search('image') ) {
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
                            if ( me.doUploadPreview.defaultUserIcon ) {
                                me.$el.find('#id-default-user-icon img').attr('src', iconURL + '?_=' + $.now());
                                me.$el.find('img.user-icon').each(function () {
                                    if ( /^images\/assets\/misc\/profile_default/.test($(this).attr('src')) ) {
                                        $(this).attr('src', iconURL + '?_=' + $.now());
                                    }
                                });
                                delete me.doUploadPreview.defaultUserIcon;
                            } else {
                                me.NewImageToUploadURL = iconURL;
                                $('img#add-user-pic').attr('src', iconURL + '?_=' + $.now());
                            }
                        });
                    });
                }
            });
            $('#add-user-sel-pic').click(function() {
                $('#userPicture').val('').click();
            });
            $('button#modal-add-new-user-btn-add').click(function() {
                me.doAddUser($(this).attr('data-id'));
            });
            $('button#modal-delete-users-btn-delete').click(function() {
                me.doDeleteUser();
            });
        },
        events: {
            'click .main-tab': "switchTab",
            'click #id-default-user-icon': "defIcon",
            'click .users-row': "onOpenUserDetails",
            'click .js-edit-user': "onEditUser",
            'click button#id-add-new-user': "onAddUser",
            'click .js-del-user': "onDeleteUsers",
            'click #id-search-users-btn-search': "onUserSearch",
            'click span.icon-search-reset': "onUserSearchReset",
            'click .sort-by-name': "onSortName",
            'click .users-row .tab-box': "onClickRowItem",
            'click .sort-by-user-password': "onSortUserPassword",
            'change .content-users-list .pagination-size select': "onChangePaginationSize",
            'click .js-download-report': "onClickDownloadReport"
        },
        onClickRowItem: function (e) {
            e.stopPropagation();
        },
        onOpenUserDetails: function (e) {
            var me = this,
                $elem = $(e.currentTarget).closest('.users-row'),
                userId = $elem.attr('data-id');

            if ( $elem.hasClass('header-row') ) {
                return;
            }
            if ( !$elem.hasClass('active') ) {
                me.getUserStatsByID(userId, function(userStatsData) {
                    var template;

                    userStatsData.id = userId;
                    me.CURR_USER = userStatsData;

                    template = $(_.template($('#templateUserEditView').html(), {model: userStatsData, userDetails: ((me.Users || {})[userId] || {}).userDetails || []}));

                    $elem.find('.tab-box').html(template);
                    $elem.parent().find('> div.active').removeClass('active').find('.tab-box').slideUp('fast');
                    $elem.addClass('active').find('.tab-box').slideDown('fast');
                });
            } else {
                $elem.removeClass('active').find('.tab-box').slideUp('fast');
            }
        },
        onClickDownloadReport: function (e) {
            e.stopPropagation();
            var me = this,
                model = new me.Model();           

            if ( !me.UserList || me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            me.showLoader();
//            model.save({Users: (me.serchedUsers || me.UserList)}, {
            model.save({UserFilters: (me.currFilters || {})}, {
                url: 'report/users',
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
        onSortName: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                col = $elem.attr('data-id'),
                sortedUsers = [],
                tmpArr = [],
                UserList = ( me.serchedUsers || me.UserList ),
                currValue = '';

            if ( UserList ) {

                if ( !$elem.hasClass('active') ) {
                    
                    me.currFilters.sortName = {
                        field: col,
                        order: 'ASC'
                    };

                    for ( var i = 0, len = UserList.length; i < len; i++ ) {
                        currValue = ( UserList[i][col] || '' ).toLowerCase();
                        if ( !_(tmpArr).contains(currValue) ) {
                            tmpArr.push(currValue);
                        }
                    }
                    tmpArr.sort();
                    for ( var t = 0; t < tmpArr.length; t++ ) {
                        for ( i = 0; i < len; i++ ) {
                            if ( tmpArr[t] === ( UserList[i][col] || '' ).toLowerCase() ) {
                                sortedUsers.push(UserList[i]);
                            }
                        }
                    }

                    if ( me.serchedUsers ) {
                        me.serchedUsers = sortedUsers;
                    } else {
                        me.UserList = sortedUsers;
                    }

                    $elem.parent().find('.user-cell.active').removeClass('active');
                    if ( $elem.find('span').hasClass('arrow-sort-up') ) {
                        $elem.find('span').toggleClass('arrow-sort-dn arrow-sort-up');
                    }
                    $elem.addClass('active');
                } else {
                    if ( col ==  ( me.currFilters.sortName || {}).field ) {
                        me.currFilters.sortName = {
                            field: col,
                            order: ( 'DESC' == ((me.currFilters || {}).sortName || {}).order ) ? 'ASC' : 'DESC'
                        };
                        if ( me.serchedUsers ) {
                            me.serchedUsers.reverse();
                        } else {
                            me.UserList.reverse();
                        }
                    } else {
                        delete me.currFilters.sortName;
                    }
                    $elem.find('span').toggleClass('arrow-sort-dn arrow-sort-up');
                }
                me.getUserPage(function(pagedUsers) {
                    me.render(pagedUsers);
                }, 1);
            }
        },
        onUserSearch: function() {
            var me = this,
                strSearch = $.trim(me.$el.find('input#id-search-users').val()).toLowerCase(),
                resUsers = [];

            if ( me.UserList ) {

                if ( '' !== strSearch ) {
                    me.currFilters.strSearch = strSearch;
                    for ( var i = 0, len = me.UserList.length; i < len; i++ ) {
                        if ( ( 0 === (me.UserList[i].email || '').toLowerCase().indexOf(strSearch) ) || ( 0 === (me.UserList[i].firstName || '').toLowerCase().indexOf(strSearch) ) || ( 0 === (me.UserList[i].lastName || '').toLowerCase().indexOf(strSearch) )) {
                            resUsers.push(me.UserList[i]);
                        }
                    }
                } else {
                    resUsers = me.UserList;
                }
                me.serchedUsers = resUsers;
                me.getUserPage(function(pagedUsers) {
                    me.render(pagedUsers, 1);
                }, 1);
            }
        },
        onUserSearchReset: function() {
            var me = this;

            delete me.serchedUsers;
            delete me.currFilters.strSearch;
            me.$el.find('input#id-search-users').val('');
            me.getUserPage(function(pagedUsers) {
                me.render(pagedUsers);
            }, 1);
        },
        onSortUserPassword: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                sortedUsers = [],
                UserList = ( me.serchedUsers || me.UserList );

            if ( me.UserList ) {

                if ( !$elem.hasClass('active') ) {
                    me.currFilters.sortName = {
                        field: 'tempPassword',
                        order: 'ASC'
                    };
                    for ( var t = 0; t < 2; t++ ) {
                        for ( var i = 0, len = me.UserList.length; i < len; i++ ) {
                            if ( ( !t === !me.UserList[i].tempPassword ) ) {
                                sortedUsers.push(me.UserList[i]);
                            }
                        }
                    }

                    if ( me.serchedUsers ) {
                        me.serchedUsers = sortedUsers;
                    } else {
                        me.UserList = sortedUsers;
                    }

                    $elem.parent().find('.user-cell.active').removeClass('active');
                    if ( $elem.find('span').hasClass('arrow-sort-up') ) {
                        $elem.find('span').toggleClass('arrow-sort-dn arrow-sort-up');
                    }
                    $elem.addClass('active');
                } else {
                    if ( 'tempPassword' ==  ( me.currFilters.sortName || {}).field ) {
                        me.currFilters.sortName = {
                            field: 'tempPassword',
                            order: ( 'DESC' == ((me.currFilters || {}).sortName || {}).order ) ? 'ASC' : 'DESC'
                        };
                        if ( me.serchedUsers ) {
                            me.serchedUsers.reverse();
                        } else {
                            me.UserList.reverse();
                        }
                    } else {
                        delete me.currFilters.sortName;
                    }
                    $elem.find('span').toggleClass('arrow-sort-dn arrow-sort-up');
                }
                me.getUserPage(function(pagedUsers) {
                    me.render(pagedUsers);
                }, 1);
            }
        },
        defIcon: function (e) {
            var me = this;

            me.doUploadPreview.defaultUserIcon = true;

            $('#userPicture').val('').click();
        },
        doUploadPreview: function (file, callback) {
            var me = this,
                formData = new FormData(),
                loc = 'tmpFile';

            if (!file) {
                return;
            }

            formData.append('image', file);

            if ( me.doUploadPreview.defaultUserIcon ) {
                loc = 'tmpFile?defIcon=images/assets/misc/profile_default.png';
            }

            me.showLoader();
            $.ajax({
                url: loc,
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
        onAddUser: function(e) {
            var me = this;

            delete me.SelectedUser;
            delete me.NewImageToUploadURL;

            $('img#add-user-pic').attr('src', 'images/assets/misc/profile_default.png?_=' + $.now());
            $('button#modal-add-new-user-btn-add').removeAttr('data-id').text('Add User');
            $('#modal-add-new-user input').val('');
            $('input#id-add-user-email').attr('readonly', false);
            $('select#id-add-user-role').get(0).selectedIndex = 0;
            $('#id-add-user-role').select2();
            $('#modal-add-new-user .modal-title').text('Add New User');
            $('#modal-add-new-user .modal-row-delete-user').hide();
            $('#id-add-user-firstName,#id-add-user-lastName').attr('class', 'form-control validate[required]');
            $('#modal-add-new-user').modal('show');
        },
        onDeleteUsers: function(e) {
            var me = this,
                $elem = $(e.currentTarget);

            me.SelectedUser = me.Users[$elem.attr('data-id')];

            $('#modal-delete-users').modal('show');
        },
        doDeleteUser: function(e) {
            var me = this,
                user;

            if ( !me.SelectedUser ) {
                return;
            }

            user = new me.Model({id: 'del'});

            Util.showSpinner();
            user.destroy({
                url: 'api/leadercontroller/user/' + me.SelectedUser.id,
                complete: function(res) {
                    if ( 200 == (res || {}).status ) {
                        me.init();
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + (res || {}).status + ')'
                        });
                    }
                    $('#modal-delete-users').modal('hide');
                    Util.hideSpinner();
                }
            });
        },
        onEditUser: function(e) {
            var me = this,
                elem = $(e.currentTarget);

            delete me.NewImageToUploadURL;
            me.SelectedUser = me.Users[elem.attr('data-id')];

            if ( !me.SelectedUser ) {
                return;
            }
            $('#modal-add-new-user input').val('');

            $('img#add-user-pic').attr('src', ( ( ((me.SelectedUser || {} ).picInfo || {} ).url ) || 'images/assets/misc/profile_default.png' ) + '?_=' + $.now());
            $('input#id-add-user-firstName').val((me.SelectedUser || {} ).firstName || '');
            $('input#id-add-user-lastName').val((me.SelectedUser || {} ).lastName || '');
            $('input#id-add-user-email').val((me.SelectedUser || {} ).email || '').attr('readonly', true);
            $('select#id-add-user-role option').each(function(i) {
                if ( $(this).val() == (me.SelectedUser || {} ).role ) {
                    $(this).parent().get(0).selectedIndex = i;
                }
            });
            $('button#modal-add-new-user-btn-add').attr('data-id', (me.SelectedUser || {} ).id).text('Apply Changes');
            $('#modal-add-new-user .modal-title').text('Edit User');
            $('#id-add-user-role').select2();
            $('#modal-add-new-user .modal-row-delete-user').show();
            $('#id-add-user-firstName,#id-add-user-lastName').attr('class', 'form-control validate[required]');
            $('#modal-add-new-user').modal('show');
        },
        doAddUser: function (userID) {
            var me = this,
                pFields = $('#modal-add-new-user input, #modal-add-new-user select'),
                isValid = true,
                user = null,
                loc = 'api/leadercontroller/createuser',
                modelData = {},
                userData = {};


            pFields.each(function () {
                var curID = $(this).attr('id').replace('id-add-user-', '');

                $(this).val($.trim($(this).val()));
                if ( !isValid || !$(this).validationEngine('validate') ) {
                    isValid = false;
                    return;
                }
                if ( 'passconfirm' != curID ) {
                    if ( !userID || ( me.SelectedUser && me.SelectedUser[curID] != $(this).val() && 'email' != curID ) ) {
                        if ( $(this).val() ) {
                            userData[curID] = $(this).val();
                        }
                    }
                }
            });

            if ( !isValid || ( _.isEmpty(userData) && !me.NewImageToUploadURL ) ) {
                return;
            }

            if ( userID ) {
                modelData = {formData: userData, id: userID}
                loc = 'api/leadercontroller/update/' + userID;
            } else {
                modelData = userData;
            }

            if ( me.NewImageToUploadURL ) {
                modelData.file = me.NewImageToUploadURL;
            }

            user = new me.Model(modelData);

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            user.save( null, {
                url: loc,
                complete: function(res) {
                    if ( 200 == (res || {}).status ) {
                        if ( 'ALREADY_EXISTS' == (res || {}).responseText ) {
                            Alerts.Error.display({
                                title: 'Warning',
                                content: 'User already exists.'
                            });
                        } else {
                            me.init();
                        }
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + (res || {}).status + ')'
                        });
                    }
                    $('#modal-add-new-user').modal('hide');
                    delete me.saveInprocess;
                    Util.hideSpinner();
                }
            });
        },
        getUserPage: function(callback, page_index) {
            var me = this,
                pagedUsers = [],
                countUsers = 0,
                startIndex = 0,
                endIndex = 0,
                users = me.serchedUsers || me.UserList;

            countUsers = users.length;
            startIndex = ( me.PagingSize * (page_index - 1) );

            endIndex = startIndex + me.PagingSize;

            if ( countUsers < endIndex ) {
               endIndex = countUsers;
            }

            for ( var i = startIndex; i < endIndex; i++ ) {
                pagedUsers.push(users[i]);
            }

            callback(pagedUsers);
        },
        getUserStatsByID: function(id, callback) {
            var me = this;
            callback((me.Users || {})[id].stats);
        },
        getUserByID: function(id, callback) {
            var me = this,
                user = new me.Model();

            Util.showSpinner();
            user.fetch({
                url: 'api/leadercontroller/user/' + id,
                success: function(model, res) {
                    res = res || {};

                    if ( res && false !== res.success ) {
                        if ( callback ) {
                            callback(res.user || {});
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
        getUsers: function(callback, page_index) {
            var me = this,
                user = new me.Model();

            page_index = page_index || 1;

            if ( !_.isEmpty(me.UserList) ) {
                if ( callback ) {
                    me.getUserPage(function(pagedUsers) {
                        callback(pagedUsers);
                    }, page_index);
                } else {
                    me.getUserPage(function(pagedUsers) {
                        me.render(pagedUsers);
                    }, page_index);
                }
                return;
            }

            me.UserList = [];
            me.Users = {};

            Util.showSpinner();
            user.fetch({
//                url: 'api/leadercontroller/users',
//                url: 'api/leadercontroller/all/console/?offset=0&page_size=1000',
                url: 'api/topiccontroller/users/?offset=0&page_size=20000',
                success: function(model, res) {
                    var users, fixedUsers = [], stats;
                    res = res || {};

                    if ( res && false !== res.success ) {
                        users = (res || {}).perUserStats || [];
                        me.Users = {};

                        for ( var i = 0; i < users.length; i++ ) {
                            if ( users[i].user && (/@/).test(users[i].user.email) ) {
                                users[i].user.userDetails = me.buildUserDetails(users[i].user);
                                me.Users[users[i].user.id] = users[i].user;
                                stats = _.clone(users[i]);
                                delete stats.user;
                                me.Users[users[i].user.id].stats = stats;
                                fixedUsers.push(users[i].user);
                            }
                        }

                        me.UserList = fixedUsers;

                        if ( callback ) {
                            me.getUserPage(function(pagedUsers) {
                                callback(pagedUsers);
                            }, page_index);
                        } else {
                            me.getUserPage(function(pagedUsers) {
                                me.render(pagedUsers);
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
        buildUserDetails: function(userData) {
            var me = this, mapDetails = {
                gender: {name: "Gender"},
                fssPartnerDoor: {name: " FSS/Partner Door"},
                ageRange: {name: "Age"},
                storeRegion: {name: "Store Region"},
                maritalStatus: {name: "Marital Status"},
                licensedEsthetician: {name: "Licensed Esthetician"},
                ethnicity: {name: "Ethnicity"},
                title: {name: "Title"},
                latino: {name: "Hispanic or Latino"},
                instagram: {name: "Instagram Name"},
                employmentStatus: {name: "Employment Status"},
                youtube: {name: "YouTube Channel"},
                tenure: {name: "Tenure at MAC"},
                blog: {name: "Blog Name"},
                twitter: {name: "Twitter Handle"}
            }, res = [];
        
           for ( var md in mapDetails ) {
               mapDetails[md].value = userData[md];
               res.push(mapDetails[md]);
           }
           return res;
        },
        render: function(data, currPage) {
            data = data ||[];
            var me = this,
                paging = null,
                pages = 0,
                pagingItem = null,
                template = $(_.template($('#templateUsersListView').html(), {data: data}));

            currPage = currPage || 1;
            
            me.CurrPage = data;

            paging = template.find('nav ul.pagination').empty();
            pages = Math.ceil(( me.serchedUsers || me.UserList ).length / me.PagingSize);

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
                                me.getUsers(function (pData) {
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
                        me.getUsers(function (pData) {
                            me.render(pData, pg);
                        }, pg);
                    });
                } else {
                    paging.find('.js-previous-page').addClass('disabled');
                }
                if ( pages > currPage ) {
                    paging.find('.js-next-page span').on('click', function() {
                        var pg = currPage + 1;
                        me.getUsers(function (pData) {
                            me.render(pData, pg);
                        }, pg);
                    });
                } else {
                    paging.find('.js-next-page').addClass('disabled');
                }
            }


            me.$el.find('.content-users-list').html(template);
            me.$el.find('.content-users-list .pagination-size select option').each(function(i) {
                if ( $(this).val() == me.PagingSize ) {
                    $(this).parent().get(0).selectedIndex = i;
                }
            });
            me.$el.find('.content-users-list .pagination-size select').select2({minimumResultsForSearch: -1});
        },
        init: function() {
            var me = this;
            me.UserList = [];
            me.Users = {};

            me.$el.find('input#id-search-users').val('');
            me.getUsers(function(users) {
                me.render(users);
            });
        },
        onChangePaginationSize: function() {
            var me = this;

            me.PagingSize = parseInt(me.$el.find('.content-users-list .pagination-size select').val());
            me.getUsers();
        },
        showLoader: function() {
            Util.showSpinner();
        },
        hideLoader: function() {
            Util.hideSpinner();
        }
    });
});

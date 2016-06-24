define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-content-report',
        Model: Backbone.Model.extend(),
        moment: Moment,
        Settings: {},
        StatisticsReport: {},
        initialize: function() {
            var me = this;           
            
            window.REPORT_VIEW = me;

            me.options.eventPubSub.bind("initReport", function(callback) {
                callback(me);
                me.init();
            });
            $('input#userCSV').off().on('change', function () {
                var file = ($(this)[0].files || [])[0];

                me.doUploadCSV(file, function(filePath) {
                    me.sendCSV(filePath);
                });
            });
            
        },
        events: {            
            'click .settins-email-apply': "onClickEmailApply",
            'click button#update-password': "onClickUpdatePassword",
            'click button#id-reset-eula': "onClickResetEula",
            'click button#id-upload-user-csv': "onClickUploadUserCSV",
            'click #id-setings-admins span.user-checkbox': "onEnableAdmin"
        },
        onEnableAdmin: function (e) {
            var me = this,
                $elem = $(e.currentTarget),
                currUserEmail = $elem.attr('data-id');
            
            if ( $elem.hasClass('active') ) {
                me.deleteAdmin(currUserEmail, function() {
                    $elem.removeClass('active');
                });
            } else {
                me.addAdmin(currUserEmail, function() {
                    $elem.addClass('active');
                });
            }            
        },
        onClickUploadUserCSV: function (e) {
            var me = this;
            
            $('#userCSV').val('').click();
        },
        doUploadCSV: function (file, callback) {
            var me = this,
                formData = new FormData(),
                loc = 'tmpFile';

// csv file data:
//             
//firstName,lastName,email,role,password
//John,Smith,11234@123.com,ARTIST,123
//John,Smith,2123@123.com,LEADER,123

            if (!file) {
                return;
            }

            formData.append('usercsv', file);

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
        sendCSV: function(filePath) {
            var me = this,
                csvModel = new me.Model({filecsv: filePath, formData: {}});

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            csvModel.save( null, {
                url: 'api/leadercontroller/users/script',
                complete: function(res) {
                    if ( (/^2\d{2}$/).test( (res || {}).status ) ) {
                        Alerts.General.display({
                            title: 'Success',
                            content: 'User CSV file has been uploaded successfully.'
                        });
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + (res || {}).status + ')'
                        });
                    }
                    delete me.saveInprocess;
                    Util.hideSpinner();
                }
            });
        },
        addAdmin: function(userAdmin, callback) {
            var me = this,
                user = new me.Model();

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            user.save({userAdmin: userAdmin}, {
                url: 'admin',
                success: function(model, res) {                    
                    if ( res && false !== res.success ) {                        
                        callback(res.data || []);
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
                        Backbone.history.navigate('#/logout');
                    }
                    Util.hideSpinner();
                },
                error: function(res) {
                    callback([]);
                },
                complete: function() {
                    delete me.saveInprocess;
                }
            });
        },
        deleteAdmin: function(userAdmin, callback) {
            var me = this,
                user = new me.Model({id: 'del'});
            
            Util.showSpinner();
            user.destroy({
                url: 'admin/' + userAdmin,
                success: function(model, res) {                    
                    if ( res && false !== res.success ) {                        
                        callback(res.data || []);
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
                        Backbone.history.navigate('#/logout');
                    }
                    Util.hideSpinner();
                },
                error: function(res) {
                    callback([]);
                }
            });
        },
        getAdmins: function(callback) {
            var me = this,
                user = new me.Model();
            
            Util.showSpinner();
            user.fetch({
                url: 'admin',
                success: function(model, res) {                    
                    if ( res && false !== res.success ) {                        
                        callback(res.data || []);
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Authorization Failed.'
                        });
                        Backbone.history.navigate('#/logout');
                    }
                },
                error: function(res) {
                    callback([]);
                    Util.hideSpinner();
                }
            });
        },
        getUsers: function(callback) {
            var me = this,
                user = new me.Model();
            
            me.AdminUsers = {};
            me.AdminUserList = [];
            
            Util.showSpinner();
            user.fetch({
                url: 'api/leadercontroller/all/console/?offset=0&page_size=20000',
                success: function(model, res) {
                    var users,
                        fixedUsers = [];
                    
                    if ( res && false !== res.success ) {
                        
                        users = (res || {}).users || [];
                        
                        me.getAdmins(function(admins) {
                            for ( var i = 0 ; i < users.length; i++ ) {
                                if ( users[i] && (/@/).test(users[i].email) && _(['LEADER','ADMIN']).contains(users[i].role) ) {
                                    if ( _(admins).contains(users[i].email) ) {
                                        users[i].accessConsole = true;
                                    }
                                    me.AdminUsers[users[i].id] = users[i];
                                    fixedUsers.push(users[i]);
                                }
                            }
                            me.AdminUserList = fixedUsers;
                            callback(fixedUsers);
                        });                        
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
        onClickUpdatePassword: function(e) {
            var me = this,
                pass = new me.Model(),
                isValid = true,
                iFields = $('input#currentPassword, input#newPassword, input#confirmPassword'),
                userInfo = JSON.parse($.cookie('UserInfo')) || {};

            iFields.each(function() {
                if ( !isValid || !$(this).validationEngine('validate') ) {
                    isValid = false;
                    return;
                }
            });
            
            if ( !isValid || me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            pass.save({
                id: userInfo.userIdentifier,
                oldPassword: $('input#currentPassword').val(),
                formData: {
                    password: $('input#newPassword').val()
                }
            }, {
                url: 'api/leadercontroller/update/' + userInfo.userIdentifier,
                dataType: 'text',
                success: function(model, res) {
                    if ( (/SUCCESS/).test(res) ) {
                        iFields.val('');
                        Alerts.General.display({
                            title: 'Success',
                            content: 'Password has been updated successfully.'
                        });
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: (res || {}).message || 'Failed during update password.'
                        });
                    }
                },
                complete: function(res) {
                    delete me.saveInprocess;
                    Util.hideSpinner();                    
                }
            });
        },
        getEmailAddress: function(callback) {
            var me = this,
                email = new me.Model();
            
            me.CurrEmail = '';
            
            Util.showSpinner();
            email.fetch({
                url: 'api/leadercontroller/helpemail',
                dataType: 'text',
                success: function(model, res) {
                    res = res || {};
                    
                    if ( res && false !== res.success ) {
                        me.CurrEmail = res || 'N/A';

                        if ( callback ) {
                            callback();
                        } else {
                            me.render();
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
        onClickEmailApply: function () {
            var me = this,
                email = me.$el.find('input#id-settings-email'),
                emailModel;
        
            
            if ( !email.validationEngine('validate') ) {
                return;
            }
            
            emailModel = new me.Model({id: 1, formData: {email: email.val()}});

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            emailModel.save( null, {
                url: 'api/leadercontroller/helpemail',
                complete: function(res) {
                    if ( 200 == (res || {}).status ) {
                        Alerts.General.display({
                            title: 'Success',
                            content: 'Email Address has been updated successfully.'
                        });
                        me.getEmailAddress();
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + (res || {}).status + ')'
                        });
                    }
                    delete me.saveInprocess;
                    Util.hideSpinner();
                }
            });
        },
        onClickResetEula: function() {
            var me = this,
                eulaModel = new me.Model();

            if ( me.saveInprocess ) {
                return;
            }
            me.saveInprocess = true;
            Util.showSpinner();
            eulaModel.save( null, {
                url: 'api/leadercontroller/eula/reset',
                complete: function(res) {
                    if ( (/^2\d{2}$/).test( (res || {}).status ) ) {
                        Alerts.General.display({
                            title: 'Success',
                            content: 'EULA for Users has been reseted successfully.'
                        });
                    } else {
                        Alerts.Error.display({
                            title: 'Error',
                            content: 'Failed. (' + (res || {}).status + ')'
                        });
                    }
                    delete me.saveInprocess;
                    Util.hideSpinner();
                }
            });
        },
        render: function() {
            var me = this;
            
            me.$el.find('input#id-settings-email').val(me.CurrEmail || '');
        },
        renderAdmins: function(userAdmins) {
            var me = this,
                template = $(_.template($('#templateAdminsListView').html(), {data: userAdmins}));
            
            me.$el.find('#id-setings-admins .content-users-list').html(template);
        },
        init: function() {
            var me = this;
            
            $('input#currentPassword, input#newPassword, input#confirmPassword').val('');
            
            me.getEmailAddress(function(data) {
                me.render();
            });
            me.getUsers(function(data) {
                me.renderAdmins(data);
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

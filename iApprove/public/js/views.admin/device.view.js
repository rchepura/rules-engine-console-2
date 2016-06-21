define(['jquery', 'backbone', 'moment'], function($, Backbone, Moment) {
    return Backbone.View.extend({
        el: '#id-devices-container',
        Model: Backbone.Model.extend({urlRoot : 'api'}),
        moment: Moment,
        initialize: function() {
            var me = this;
            
            window.DEVICE_VIEW = me;

            me.options.eventPubSub.bind("initDevice", function() {
                me.init();
            });
            $('#new-device .save-device').off().on('click', function(e) {
                me.saveDevice(e);
            });
        },
        events: {
            'click .add-device': "onAddDevice",
            'click .update-device': "onUpdateDevice",
            'click .remove-device': "removeDevice",
            'click .list-row': "selectListRow"
        },
        selectListRow: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                $elParent = $elem.parent(),
                $cKeys = me.$el.find('.new-device-container .capability-keys').empty(),
                itemId = $elem.attr('did'),
                cData = {};
            
            if ( !$elem.hasClass('active') ) {
                $elParent.find('.list-row.active').removeClass('active');
                $elem.addClass('active');
                $elParent.find('.remove-device').attr('disabled', false);
                if ( me.AllDevices[itemId] ) {
                    me.$el.find('.new-device-container .new-window-box').fadeIn();
                    cData = me.AllDevices[itemId];
                    
                    $('#device-name').text(cData.name);
                    
                    $cKeys.html(_.template($('#templateCapabilityKeysView').html(), {data: (cData.capability || {}) }));
                }
                
            } else {
                $elem.removeClass('active');
                $elParent.find('.remove-device').attr('disabled', true);
                
                if ( me.AllDevices[itemId] ) {
                    me.$el.find('.new-device-container .new-window-box').fadeOut();
                }
            }
        },
        onAddDevice: function(e) {
            var me = this,
                modalNewDevice = $('#new-device'),
                keysBox = modalNewDevice.find('.capability-keys').empty();

            keysBox.append(_.template($('#templateCapabilityKeyView').html(), {}));
            keysBox.off().on('click', '.remove-capability', function() {
                $(this).closest('.form-group').remove();
            });
            modalNewDevice.find('.add-capability').off().on('click', function() {
                keysBox.append(_.template($('#templateCapabilityKeyView').html(), {}));
            });
            $('#new-device').modal('show');
        },
        getDevices: function(cb) {
            var me = this,
                device = new me.Model();
            
            Util.showSpinner();
            device.fetch({
                url: 'api/dtcontroller/device/type',
                success: function(model, res) {
                    if ( res && false !== res.success ) {
                        me.currDevices = res || [];
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
        saveDevice: function(e, updateDeviceType) {
            var me = this,
                $elem = $(e.currentTarget),
                $parent = $elem.closest('.new-device-container'),
                model = new me.Model(),
                data = {                    
                    capability: {
                        Storage: $parent.find('select[name="Storage"]').val(),
                        Recording: $parent.find('select[name="Recording"]').val()
                    }
                },
                loc = 'api/dtcontroller/device/type';
                
                if ( updateDeviceType ) {
                    loc += '/' + updateDeviceType;
                    data.name = updateDeviceType;
                } else {
                    data.id = 1;
                    data.name = $.trim($parent.find('input[name="name"]').val());
                    data.capability = {};
                
                    $parent.find('.capability-keys .form-group').each(function() {
                        var cKey = $.trim($(this).find('input[name="capability-key"]').val()),
                            cVal = $.trim($(this).find('input[name="capability-value"]').val());
                        if ( cKey  ) {
                            data.capability[cKey] = cVal;
                        }
                    });
                    
                
                    if ( !data.name ) {
                        Alerts.Error.display({title: 'Error', content: "Device name cannot be empty"});
                        return false;
                    }
                }
                
//                top.DEVICESSDATA = data; return;
                
            me.showLoader();
            
            model.save(data, {
                url: loc,
                dataType: 'text',
                success: function (model, res) {
                    me.hideLoader();
                    if ( res && /SUCCESS/.test(res) ) {
                        me.getDevices(function(devices) {
                            me.renderDevices(devices);
                        });
                        me.$el.find('.new-device-container .new-window-box').fadeOut();
                        $('#new-device').modal('hide');
                    } else {
                        Alerts.Error.display({title: 'Error', content: 'Failed during save Davice Type (' + res + ')'});
                    }
                },
                error: function () {
                    Alerts.Error.display({title: 'Error', content: "Failed during save Davice Type"});
                    me.hideLoader();
                }
            });
            return false;
        },
        onUpdateDevice: function(e) {
            var me = this,
                $elem = $(e.currentTarget),
                $parent = $elem.closest('.new-device-container');
            
            me.saveDevice(e, $parent.find('h5#device-name').text());
        },
        removeDevice: function(e) {
            var me = this,            
                model = new me.Model({id: 'del'}),
                $elem = $(e.currentTarget),
                $container = $elem.closest('.item-list'),
                deviceTypeName = $container.find('.list-row.active').attr('did');
        
            if ( deviceTypeName ) {
                Util.showSpinner();
                model.destroy({
                    url: 'api/dtcontroller/device/type/' + deviceTypeName,
                    complete: function(res) {
                        if ( 200 == (res || {}).status ) {
                            me.getDevices(function(devices) {
                                me.renderDevices(devices);
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
        renderDevices: function(devices) {
            var me = this,
                template = _.template($('#templateDevicesView').html(), {data: devices}),
                $deviceSelect = $('#new-action .new-action-container select[name="deviceType"]').empty();

            me.$el.find('.new-device-container .new-window-box').fadeOut();
            me.AllDevices = {};

            _.each(devices, function (model, key) {
                me.AllDevices[model.name] = model;
                $deviceSelect.append('<option value="' + model.name + '">' + model.name + '</option>');
            });
            
            me.$el.find('.devices-container .item-list').html(template);
            $deviceSelect.on('change', function() {
                me.renderNewActionDeviceTypes($(this).val());
            });
            me.renderNewActionDeviceTypes($deviceSelect.val());
        },
        renderNewActionDeviceTypes: function(deviceType) {
            var me = this,                
                template = _.template($('#templateActionDeviceTypeFormView').html(), {model: me.AllDevices[deviceType] || {}});            
            
            $('#new-action .new-action-container .action-device-type-pane').html(template);
        },
        init: function() {
            var me = this;
            
            me.getDevices(function(devices) {
                me.renderDevices(devices);
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
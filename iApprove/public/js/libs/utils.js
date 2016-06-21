var opts = {
    lines: 13 // The number of lines to draw
    , length: 28 // The length of each line
    , width: 14 // The line thickness
    , radius: 42 // The radius of the inner circle
    , scale: 1 // Scales overall size of the spinner
    , corners: 1 // Corner roundness (0..1)
    , color: '#000' // #rgb or #rrggbb or array of colors
    , opacity: 0.25 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 1 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '50%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
}

var spinner = new Spinner(opts);

var Util = {
    getRandomPastel : function() {
        var red = Math.round(_.random(230,250));
        var green = Math.round(_.random(230,250));
        var blue = Math.round(_.random(230, 250));
        var rgb = 'rgb(' + [red, green, blue].join() + ')';
        return rgb;
    },

    showSpinner : function() {
        $('#center_spinner').css('z-index', 2000000);
        var target = document.getElementById('center_spinner')
        spinner.spin(target);
    },

    hideSpinner : function() {
        spinner.stop()
        $('#center_spinner').css('z-index', -1);
    },

    showDate : function() {
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var date = new Date();
        var day = date.getDate() < 10 ? '0' + date.getDate() : '' + date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var  seconds = date.getSeconds();

        var s1 = [monthNames[monthIndex], day, year].join(' ')
        var s2 = [hours, minutes, seconds].join(':')

        $('#date').text(s1 + ' ' + s2)
    },

    decorateNavbar : function() {
        var menuDescriptor = {
            sandbox : '#sandbox',
            visitors : '#visitors',
            downloads : '#downloads'
        }

        var tabs = _.keys(menuDescriptor);
        _.each(tabs, function (tab) {
            $(menuDescriptor[tab]).attr("class", "inactive");
            $(menuDescriptor[tab]).bind('menuClicked',(function(){
                $(menuDescriptor[tab]).attr("class", "active");
                _.each(_.without(tabs, tab), function(other){
                    $(menuDescriptor[other]).attr("class", "inactive");
                })
            }));
        })
    },

    initRouter : function() {
        var router = new DashboardRouter();
        Backbone.history.start();
        return router;
    },
    
    fixImgContent: function(content) {
        if ( (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/).test(content) ) {            
            return 'data:image/png;base64,' + content;
        }
        return false;
    },
    
    maxImageSize: function(file, w, h, callback) {
        var image;
        callback = callback || function() {};        
        if ( file ) {
            image = new Image();
            image.onload = function() {
                callback( ( this.width <= w && this.height <= h ) );
            };
            image.src = ( window.URL || window.webkitURL ).createObjectURL(file);
        } else {
            callback();
        }
    }
}



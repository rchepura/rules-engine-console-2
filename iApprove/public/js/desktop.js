require.config({
    urlArgs: "_=" + (new Date()).getTime(),
//    urlArgs: "_=1424584667109",
    paths: {
        ampstore: 'libs/ampstore',
        jquery: 'libs/jquery.min',
        json2: 'libs/json2',
        backbone: 'libs/backbone.min',
        underscore: 'libs/underscore.min',
        bootstrap: 'libs/bootstrap.min',
        moment: 'libs/moment',
//        jqueryui: "../libs/jqueryui",
        jqueryplugin: "libs/jquery.plugin.min",
        datepicker: "libs/jquery.datepick.min",
//        resources: '../libs/resources',
        'jquery.validationEngine': 'libs/jquery.validationEngine',
        'jquery.validationEngine-en': 'libs/jquery.validationEngine-en',
//        lightbox: '../libs/jquery.lightbox',
        cookies: 'libs/jquery.cookie',
        select2: 'libs/select2.min',
        matcher: 'libs/matcher'
    },
    shim: {
//        resources: {
//            deps: ["backbone", "jquery", "ampstore"]
//        },
        ampstore: {
            deps: ["jquery", "json2"]
        },
//        lightbox: {
//            deps: ["jquery"]
//        },
        backbone: {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        bootstrap: {
            deps: ["jquery"]
        },
        moment: {
            deps: ["jquery"]
        },
//        jqueryui: {
//            deps: ["jquery"]
//        },
        jqueryplugin: {
            deps: ["jquery"]
        },
        datepicker: {
            deps: ["jqueryplugin", "jquery"]
        },
        'jquery.validationEngine-en': {
            deps: ["jquery"]
        },
        'jquery.validationEngine': {
            deps: ["jquery", "jquery.validationEngine-en"]
        },
        cookies: {
            deps: ["jquery"]
        }
    }
});
require(['jquery', 'backbone', 'router', 'bootstrap', 'cookies', 'ampstore', 'moment', 'jqueryplugin', 'datepicker', 'jquery.validationEngine', 'jquery.validationEngine-en'],
    function($, Backbone, Router) {
        var foo = JSON.parse;
        JSON.parse = function(str) {str = str || null; return foo(str);}
        this.router = new Router();
    }
);
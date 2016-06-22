var express = require('express');
var router = express.Router();
var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();
var config = require('../config');
var url = require('url');
var fs = require('fs');
var path = require('path');
var querystring = require('querystring');
var index = require('./index');


//console.log(router.all);


router.all('/*', function (req, res, next) {
    var userInfo = null;
    
    console.log('req.cookies: ');
    console.log(req.cookies);
    
    if ( req.cookies && req.cookies.UserInfo ) {
        userInfo = JSON.parse(req.cookies.UserInfo);
    }

//    console.log('userInfo: ');
//    console.log(userInfo);

    if ( !userInfo ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
    } else {
        next();
    }
});


/* rest api GET. */
router.get('/*', function (req, res) {
    var storageUrl = index.getApiUrl(req) + '/storage';
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    console.log('storage Url: ' + storageUrl);
    console.log('req Url: ' + req.url);
    
    apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
        proxyReq.setHeader('Authorization', 'Bearer ' + req.session.access_token);
    });

    apiProxy.web(req, res, {
        target: storageUrl
    }, function (err) {
        res.send({
            success: false,
            message: err
        });
    });
    
    apiProxy.on('error', function(e) {
        console.log('ON ERROR: ');
        console.log(e);
    });
});

module.exports = router;
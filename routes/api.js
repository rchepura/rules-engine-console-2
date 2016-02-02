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
//    } else if ( !userInfo.valid_token ) {
//        index.loginUser(req, res, function() {
//            next();
//        });
    } else {
        next();
    }
});


/* rest api GET. */
router.get('/*', function (req, res) {
    var apiUrl = config.apiUrl;
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    console.log('API Url: ' + apiUrl);
    console.log('req Url: ' + req.url);
    
    apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
        proxyReq.setHeader('Authorization', 'Bearer ' + req.session.access_token);
    });

    apiProxy.web(req, res, {
        target: apiUrl
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

/* rest api delete. */
router.delete('/*', function (req, res) {
    var apiUrl = config.apiUrl;
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    console.log('API delete Url: ' + apiUrl);
    console.log('req delete Url: ' + req.url);
    
    apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
        proxyReq.setHeader('Authorization', 'Bearer ' + req.session.access_token);
    });
    
//    res.send({
//        success: true,
//        data: apiUrl + req.url
//    });
//    return;

    apiProxy.web(req, res, {
        target: apiUrl
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

var request = require('request');


/* rest api PUT. */
router.put('/*', function (req, res) {
    var reqUrl = config.apiUrl + req.url;
    var bodyData = JSON.stringify(req.body || {});
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }


//console.log('req.body: ');
//console.log(req.body);
//console.log('body: ');
//console.log(body);
    
    console.log('PUT API Url: ' + reqUrl);

    req.pipe(request({
        method: 'PUT',
        uri: reqUrl,
        headers: {
            'Content-Length': bodyData.length,
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token
        },
        body: bodyData
    }, function (err, httpResponse, body) {
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
        } else {
            console.log('BODY: ');
            console.log(body);
        }
    })).pipe(res);
});

/* rest api POST. */
router.post('/*', function (req, res) {
    var topics = [],
        topicsRows = 0;
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    if ( req.body.icon ) {
        var iconFile = path.join(__dirname, '../public/' + req.body.icon);
        fs.exists(iconFile, function (fileExists) {
            console.log('fileExists: ' + fileExists);
//            console.log('file: ' + iconFile);

            if ( !fileExists ) {
                console.log('File not found.');
                sendPost(req, res, (req.body || {}));
            } else {
                fs.readFile(iconFile, 'base64', function (err, content) {
                    console.log(err || content);
                    req.body.icon = content || 'images/assets/ic_default.png';
                    sendPost(req, res, (req.body || {}));
                });
            }
        });
    } else if ( req.body.updateTopics ) {
        
        topics = req.body.updateTopics || [];
        topicsRows = topics.length;
        for ( var i = 0; i < topicsRows; i++ ) {
            (function (ii) {
                fs.exists(path.join(__dirname, '../public/' + topics[ii].icon), function (fileExists) {
                    var curIcon = path.join(__dirname, '../public/' + topics[ii].icon);
                    console.log('fileExists: ' + fileExists);
//                    console.log('file: ' + curIcon);

                    if ( !fileExists ) {
                        console.log('File not found.');
                        if ( ( topicsRows - 1 ) === ii ) {
                            sendPost(req, res, (req.body.updateTopics || []));
                        }
                    } else {
                        fs.readFile(curIcon, 'base64', function (err, content) {
                            console.log(err || content);
                            req.body.updateTopics[ii].icon = content || 'images/assets/ic_default.png';
                            if ( ( topicsRows - 1 ) === ii ) {
                                sendPost(req, res, (req.body.updateTopics || []));
                            }
                        });
                    }
                });
            })(i);            
        }
    } else if ( req.body.updateFeeds ) {
        sendPost(req, res, (req.body.updateFeeds || []));
    } else {
        sendPost(req, res, (req.body || {}));
    }
});

function sendPost(req, res, body) {
    var reqUrl = config.apiUrl + req.url;
    
    var bodyData = JSON.stringify(body || {});

//console.log('req.body: ');
//console.log(req.body);
//console.log('body: ');
//console.log(body);
    
    console.log('POST API Url: ' + reqUrl);

    req.pipe(request({
        method: 'POST',
        uri: reqUrl,
        headers: {
            'Content-Length': bodyData.length,
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token
        },
        body: bodyData
    }, function (err, httpResponse, body) {
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
        } else {
            console.log('BODY: ');
            console.log(body);
        }
    })).pipe(res);
}

module.exports = router;
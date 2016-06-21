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

    if ( !userInfo && !req.query.token ) {
//    if ( 0 ) {
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
    var apiUrl = index.getApiUrl(req) + '/api';
    var hrtoken = req.query.token;

    console.log('API Url: ' + apiUrl);
    console.log('req Url: ' + req.url);
    console.log('req hrtoken: ' + hrtoken);
    
    apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
        proxyReq.setHeader('Authorization', 'Bearer ' + (req.session.access_token || hrtoken));
//        proxyReq.setHeader('console', true);
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
    var apiUrl = index.getApiUrl(req) + '/api';

    console.log('API delete Url: ' + apiUrl);
    console.log('req delete Url: ' + req.url);
    
    if ( req.query.userID ) {
        sendReq(req, res);
        return;
    }
    
    apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
        proxyReq.setHeader('Authorization', 'Bearer ' + req.session.access_token);
//        proxyReq.setHeader('console', true);
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

var request = require('request');


function checkFile(body, callback) {
    if ( body.file || body.pic || body.filecsv || body.base64 ) {
        var filePath = path.join(__dirname, '../public/' + ( body.file || body.pic || body.filecsv || body.base64 ));
        var cType = 'base64';
        fs.exists(filePath, function (fileExists) {
            console.log('fileExists: ' + fileExists);
            console.log('file: ' + filePath);

            if ( !fileExists ) {
                console.log('File not found.');
                callback();
            } else {
                fs.readFile(filePath, cType, function (err, content) {
                    console.log(err);
                    callback(content);
                });
            }
        });
    } else  {
        callback();
    }
}


/* rest api PUT. */
router.put('/*', function (req, res) {
    var body = req.body || {};
    
    checkFile(body, function(file) {
        sendReq(req, res, body, file);
    });
    
});

function sendReq(req, res, body, file) {
    var reqUrl = index.getApiUrl(req) + '/api' + req.url;
    var bodyData = null;
    var contentType = "application/json";
    
    if ( 'DELETE' == req.method && req.query.userID ) {
        bodyData = require('querystring').stringify({userId:req.query.userID});
        contentType = "application/x-www-form-urlencoded";
    } else if ( body.groupMembers ) {
        bodyData = JSON.stringify(body.groupMembers || {});
    } else if ( body.formData ) {
        if ( body.base64 ) {
            body.formData.base64 = file;
        } else if ( file ) {
            if ( body.formData.attachment ) {
                body.formData.attachment = {
                    type: 'IMAGE',
                    content: file
                }
            } else {
                body.formData.file = file;
            }
        }
        bodyData = require('querystring').stringify(body.formData);
        contentType = "application/x-www-form-urlencoded";
    } else {
        if ( file ) {
            if ( body.base64 ) {
                body.base64 = file;
            } else if ( body.pic ) {
                body.pic = file;
            } else if ( body.attachment ) {
                body.attachment = {
                    type: 'IMAGE',
                    content: file
                }
                delete body.file;
            } else {
                body.file = file;
            }
        }
        bodyData = JSON.stringify(body || {});
    }


console.log('req.method: ');
console.log(req.method);
console.log('bodyData: ');
console.log(bodyData);
    
    console.log('POST/PUT API Url: ' + reqUrl);

    req.pipe(request({
        method: req.method,
        uri: reqUrl,
        headers: {
            'Content-Length': bodyData.length,
            "Content-Type": contentType,
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        },
        body: bodyData
    }, function (err, httpResponse, body) {
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            res.send({
                success: false,
                message: err
            });
        } else {
            console.log('BODY: ');
            console.log(body);
        }
    })).pipe(res);    
}

/* rest api POST. */
router.post('/*', function (req, res) {
    var body = req.body || {};
    
//    console.log('\n\n\nPOST BODY: ');
//    console.log(body);
    
    if ( body.oldPassword ) {
        if ( req.session.current_password !== body.oldPassword ) {
            res.send({
                success: false,
                message: 'Old password is wrong.'
            });
            return;
        } else {
            delete body.oldPassword;
        }
    }

    checkFile(body, function(file) {
        sendReq(req, res, body, file);
    });
});

module.exports = router;
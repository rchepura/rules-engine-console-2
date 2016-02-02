var express = require('express');
var router = express.Router();
var config = require('../config');
var url = require('url');
var authParsedUrl = url.parse(config.apiUrl);
var http = ('https:' == authParsedUrl.protocol) ? require('https') : require('http');
var fs = require('fs');
var path = require('path');


/* GET Test page. */
router.get('/test', function (req, res) {
    req.session.access_token = 'sfdgdfdsfgs';
    res.send('The ESTEE HR');
});

function loginUser(req, res, callback) {
    var loginUrl = config.apiUrl + config.loginPath;
    var querystring = require('querystring');
    var formBody = {
        grant_type: 'password',
        username: req.body.user,
        password: req.body.password,
        client_id: config.client_id,
        scope: 'public'
    };    
    
    var formData = querystring.stringify(formBody);
    
    console.log('POST API LOGIN Url: ' + loginUrl);
    console.log('formData: ');
    console.log(formData);
    
    var request = require('request');

    request({
        method: 'POST',
        uri: loginUrl,
        headers: {
            'Content-Length': formData.length,
            "Content-Type": "application/x-www-form-urlencoded",
            "MMS-DEVICE-ID": config.MMS_DEVICE_ID
        },
        body: formData
    }, function (err, httpResponse, body) {
        var userInfo = null;
//            
//        if ( req.cookies && req.cookies.UserInfo ) {
//            userInfo = JSON.parse(req.cookies.UserInfo);
//        } else if ( req.body && req.body.user ) {
//            userInfo = {user: req.body.user}
//        }
// test    test  test  test  test      
//        setUserCookie(res, userInfo);
//        callback('tetettettest');
//        return;
// test    test  test  test  test  

        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback();
        } else {
            var resJSON = JSON.parse(body || "{}");
            console.log('BODY: ');
            console.log(body);
            
            if ( !resJSON.access_token ) {
                callback();
            } else {            
                req.session.access_token = resJSON.access_token;
                userInfo = ( (resJSON.user || {}).members || {} );
                setUserCookie(res, userInfo);
                callback(req.session.access_token);
            }
        }
    });
}

/* POST Login. */
router.post('/login', function (req, res) {
    
    loginUser(req, res, function(access_token) {
        if ( access_token ) {
            res.send({
                success: true,
                data: req.body
            });
        } else {
            res.send({
                success: false,
                message: "Authorization Failed."
            });
        }
    });
    
//    return;
//    
//    var creds =  path.join(__dirname, '/creds');
//    
//    fs.exists(creds, function (fileExists) {
//        console.log('fileExists: ' + fileExists);
//            console.log('file: ' + creds);
//
//        if ( fileExists ) {
//            isValidCreds(req.body.user + ':' + req.body.password, function (err, isValid) {
//                console.log(err);
//                if ( err || !isValid ) {
//                    res.send({
//                        success: false,
//                        message: "Authorization Failed."
//                    });
//                    return;
//                }
//
//                delete req.body.password;
//                
//                loginUser(req, res, function(access_token) {
//                    if ( access_token ) {
//                        res.send({
//                            success: true,
//                            data: req.body
//                        });
//                    } else {
//                        res.send({
//                            success: false,
//                            message: "Authorization Failed."
//                        });
//                    }
//                });
//            });
//        } else {
//            res.send({
//                success: false,
//                message: 'Authorization Failed.'
//            });
//        }
//    });
   
});

function setUserCookie(res, userInfo) {
    var exdate=new Date();                   
        exdate.setDate(exdate.getDate() + 365);

    res.cookie('UserInfo', JSON.stringify(userInfo), { path: '/', expires: exdate });    
}

function isValidCreds(creds, callback, newCreds) {
    var creds_file =  path.join(__dirname, '/creds');
    var isValid = false;
    
    fs.readFile(creds_file, 'utf8', function (err, content) {
        var Creds;

        
        Creds = content.split("\n");
        console.log('Creds: ');
        console.log(Creds);

        for ( var i = 0; i < Creds.length; i++ ) {
            console.log(Creds[i] + ' == ' +  creds);
            if ( Creds[i] == creds ) {
                if ( newCreds ) {
                    Creds[i] = newCreds;
                }
                isValid = true;
                break;
            }
        }
    
        callback(err, isValid, Creds);
    });
}

/* POST Login. */
router.post('/password', function (req, res) {
    var creds =  path.join(__dirname, '/creds');
        
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    if ( !req.body.user ) {
        res.send({
            success: false,
            message: 'Username required.'
        });
    }
    
    if ( !req.body.oldPassword ) {
        res.send({
            success: false,
            message: 'Old password required.'
        });
    }
    
    if ( !req.body.newPassword ) {
        res.send({
            success: false,
            message: 'New password required.'
        });
    }
    
    fs.exists(creds, function (fileExists) {
        console.log('fileExists: ' + fileExists);
        console.log('file: ' + creds);

        if ( fileExists ) {
            isValidCreds(req.body.user + ':' + req.body.oldPassword, function (err, validCreds, arrCreds) {
                
                console.log(err);
                
                if ( err ) {
                    res.send({
                        success: false,
                        message: "Failed."
                    });
                    
                    return;
                }
                
                if ( !validCreds ) {
                    res.send({
                        success: false,
                        message: 'Old password is wrong.'
                    });
                } else {
                    fs.writeFile(creds, arrCreds.join("\n"), function (err) {
                        if ( err ) {
                            res.send({
                                success: false,
                                message: "Failed."
                            });
                        } else {
                            res.send({
                                success: true,
                                data: 'Password has been updated successfully.'
                            });
                            console.log('creds saved');
                        }                    
                    });
                }
            }, req.body.user + ':' + req.body.newPassword);
        } else {
            res.send({
                success: false,
                message: 'Authorization Failed.'
            });
        }
    });
   
});

/* get report. */
router.get('/report/*', function (req, res) {
    var report = req.path.replace(/(.*)\//, '');
    var report_file = path.join(__dirname, '/reports/' + report);
    
    res.set('Content-Type', 'application/octet-stream');
    
    fs.exists(report_file, function (fileExists) {
        console.log('fileExists: ' + fileExists);
        console.log('file: ' + report_file);

        if ( !fileExists ) {
            res.send({
                success: false,
                message: "Report not found. Please try again later."
            });
        } else {
            fs.readFile(report_file, 'utf8', function (err, content) {
                res.send(err || content);
            });
        }
    });
});

/* POST Report. */
router.post('/report', function (req, res) {
    var now = new Date();
    var reports_dir =  path.join(__dirname, '/reports/');
    var report_file = reports_dir + 'report_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' 
        + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds() + '.csv'; // ex. report_2015-05-17_5-48-02
    var file_name = report_file.substr(report_file.replace(/\\/g, '/').lastIndexOf('/') + 1);
    var Categories = req.body.Categories || [];
    var Usages = req.body.Usages || [];
    var Devices = req.body.Devices || [];
    var SearchRanking = req.body.SearchRanking || [];
    var new_line = ",,\n";
    var csvFile = new_line + "Apps Opened," + (req.body.AppsOpened || 0) + ",\n" + new_line + new_line + "Topics,Cumulative Subscription,Cumulative Clicks / Views\n";
    
    
    
    for ( var i = 0; i < Categories.length; i++ ) {
        csvFile += Categories[i].name;
        csvFile += "," + Categories[i].subscriptions;
        csvFile += "," + Categories[i].clicks + "\n";
    }
    
    csvFile += new_line + new_line + "Main Menu Items,,# Times Selected\n";
    
    for ( var i = 0; i < Usages.length; i++ ) {
        csvFile += Usages[i].name;
        csvFile += ",," + Usages[i].value + "\n";
    }
    
    // Devices
    csvFile += new_line + new_line + "Device Types,# Apps Installed / 1st Time opened,# Apps Opened\n";
    
    for ( var i = 0; i < Devices.length; i++ ) {
        csvFile += Devices[i].name;
        csvFile += "," + Devices[i].value_1st;
        csvFile += "," + Devices[i].value + "\n";
    }
    
    csvFile += new_line + new_line + "Search Ranking,Search Term,# of searches\n";
    
    for ( i = 0; i < SearchRanking.length; i++ ) {
        csvFile += (i + 1);
        csvFile += "," + SearchRanking[i].searchKey;
        csvFile += "," + SearchRanking[i].searchCount + "\n";
    }
    
    if ( !fs.existsSync(reports_dir) ) {
        fs.mkdirSync(reports_dir);
    }
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    fs.writeFile(report_file, csvFile, function (err) {
        if ( err ) {
            res.send({
                success: false,
                message: "Failed."
            });
        } else {
            res.send({
                success: true,
                data: {report: file_name}
            });
            console.log('file saved');
            setTimeout(function () {
                fs.unlink(report_file);
                console.log('file removed');
            }, 10000 * 60);
        }                
    });
});

/* GET Logout. */
router.get('/logout', function (req, res) {
    
    delete req.session.access_token;
    
    res.send({
        success: true,
        data: {}
    });
});

/* GET home page. */
router.get('/', function (req, res) {        
    res.render('index', {
        title: 'ESTEE HR'
    });
});



/* rest api GET. */
router.get('/search/log', function (req, res) {
   getSearchLog(req, res);
});


function getSearchLog(req, res) {
    var apiUrl = config.apiUrl;
    var now = new Date();
    var log_file = 'search_result_' + now.getFullYear() 
        + '-' + (now.getMonth() + 1) + '-' + now.getDate() 
        + '_' + now.getHours() + '-' + now.getMinutes() 
        + '-' + now.getSeconds() + '.txt';
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    res.set('Content-Disposition', 'attachment;filename="' + log_file + '"');
    res.set('Content-Type', 'application/octet-stream');

    console.log('API Urlq: ' + apiUrl);
    console.log('req Urlq: ' + req.url);
    
    var request = require('request');
    
    
    request({
        method: 'GET',
        uri: apiUrl + '/analytics/search/counters/file',
        headers: {
            'Authorization': 'Bearer ' + req.session.access_token
        }
    }, function (err, httpResponse, body) {
        if ( err ) {
            console.log('SEARCH LOG ERROR: ');
            console.log(err);
            res.send({
                success: false,
                message: err
            });
        } else {
            console.log('SEARCH LOG BODY: ');
            console.log(body);
            
            console.log('SEARCH LOG httpResponse.statusCode: ');
            console.log(httpResponse.statusCode);
            
            if ( 200 == httpResponse.statusCode ) {
                res.send(body);
            } else if ( 401 == httpResponse.statusCode ) {
                loginUser(req, res, function(access_token) {
                    if ( access_token ) {
                        getSearchLog(req, res);
                    } else {
                        res.send({
                            success: false,
                            message: "Authorization Failed."
                        });
                    }
                });
            } else {            
                res.send({
                    success: false,
                    message: "Failed. (" + httpResponse.statusCode + ")"
                });
            }
        }
    });
}


router.loginUser = loginUser;

module.exports = router;
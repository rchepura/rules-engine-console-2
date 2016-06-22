var express = require('express');
var router = express.Router();
var config = require('../config');
var url = require('url');
var fs = require('fs');
var path = require('path');


/* GET Test page. */
router.get('/test', function (req, res) {
//    req.session.access_token = 'sfdgdfdsfgs';
    console.log(req.protocol + "://" + req.host);
    res.send('The ESTEE HR: ' + getApiUrl(req) + '/api');
});
    
function getApiUrl(req) {
    return ( config.apiProtocol || req.protocol ) 
        + '://' + ( config.apiHost || req.host )
        + ':' + ( config.apiPort || '8443' );
}

function loginUser(req, res, callback) {
    var loginUrl = getApiUrl(req) + '/api' + config.loginPath;
    var querystring = require('querystring');
    var formBody = {
        grant_type: 'password',
//        username: config.apiUsername,
//        password: config.apiPass,
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

        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback();
        } else {
            var resJSON = {};
            
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
            
            console.log('BODY: ');
            console.log(body);
            
            if ( !resJSON.access_token ) {
                callback();
            } else {            
                req.session.access_token = resJSON.access_token;
                req.session.current_password = req.body.password;
                userInfo = ( (resJSON.user || {}).members || resJSON.user || {} );
//                userInfo.user = req.body.user;
//                userInfo.valid_token = true;
                setUserCookie(res, userInfo);
                sendLog(req, res, 'LOGIN');
                callback(req.session.access_token);
            }
        }
    });
}

/* POST Login. */
router.post('/login', function (req, res) {
    
    checkValidAdmin(req.body.user, function(err, adminAccess) {
        
        if ( !adminAccess ) {
            res.send({
                success: false,
                message: "You are not authorized to use the admin UI."
            });
            return;
        }
    
        loginUser(req, res, function(access_token) {
            if ( access_token ) {
                res.send({
                    success: true,
                    data: {user: req.body.user}
                });
            } else {
                res.send({
                    success: false,
                    message: "Authorization Failed."
                });
            }
        });
    });   
});

function getAdmins(callback) {
    var admins =  path.join(__dirname, '../../admins');
    
    fs.readFile(admins, 'utf8', function (err, content) {
        var Admins = [];
        
        if ( content ) {
            Admins = content.split("\n");
        }
    
        callback(err, Admins);
    });
}

function checkValidAdmin(user, callback) {
    var isValid = false;
    
    callback(null, true);
    return;
    getAdmins(function (err, Admins) {

        for ( var i = 0; i < Admins.length; i++ ) {
            console.log(Admins[i] + ' == ' + user);
            if ( Admins[i] == user ) {
                isValid = true;
                break;
            }
        }
    
        callback(err, isValid);
    });
}

/* Get Console Admins. */
router.get('/admin', function (req, res) {        
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    getAdmins(function (err, Admins) {
        if ( err ) {
            res.send({
                success: false,
                message: err
            });
        } else {
            res.send({
                success: true,
                data: Admins
            });
        }
    });   
});

/* Add Console Admin. */
router.post('/admin', function (req, res) {
    var admins =  path.join(__dirname, '../../admins');
    var content;
        
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    if ( !req.body.userAdmin ) {
        res.send({
            success: false,
            message: 'User Info required.'
        });
        return;
    }
    
    getAdmins(function (err, Admins) {
        
        Admins.push(req.body.userAdmin);
        content = Admins.join('\n');
        
        fs.writeFile(admins, content, function(err) {
            if ( err ) {
                res.send({
                    success: false,
                    message: err
                });
            } else {
                res.send({
                    success: true
                });
            }
        });
    });   
});

/* Delete Console Admin. */
router.delete('/admin/*', function (req, res) {
    var admins =  path.join(__dirname, '../../admins');
    var content;
    var userAdmin = (req.url.split('/')[2]);
        
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    if ( !userAdmin ) {
        res.send({
            success: false,
            message: 'User Info required.'
        });
        return;
    }
    
    getAdmins(function (err, Admins) {
        var updatedAdmins = [];
        
        for ( var i = 0; i < Admins.length; i++ ) {
            if ( Admins[i] !== userAdmin ) {
                updatedAdmins.push(Admins[i]);
            }
        }
        content = updatedAdmins.join('\n');
        
        fs.writeFile(admins, content, function(err) {
            if ( err ) {
                res.send({
                    success: false,
                    message: err
                });
            } else {
                res.send({
                    success: true
                });
            }
        });
    });   
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


/* POST Users Report. */
router.post('/report/users', function (req, res) {
    var request = require('request');
    var FilterData = req.body.UserFilters || {};
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
   request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/topiccontroller/users/?offset=0&page_size=20000',
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        var UserList = [];
        var users = [];
        var sortData = FilterData.sortName || {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            res.send({
                success: false,
                message: err
            });
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
            
            users = (resJSON || {}).perUserStats || [];

            for ( var i = 0; i < users.length; i++ ) {
                if ( users[i].user && (/@/).test(users[i].user.email) ) {
                    users[i].user.strCreated = require('moment')(users[i].user.creationTime).format('MM/DD/YYYY');
                    users[i].user.userDetails = buildUserDetails(users[i].user);
                    UserList.push(users[i].user);
                }
            }
            
            if ( FilterData.strSearch && '' !== FilterData.strSearch ) {
                onUserSearch(FilterData.strSearch, UserList, function(searchedUserList) {                    
                    if ( (sortData || {}).field ) {
                        onSortName(sortData, searchedUserList, function(sortedUserList) {                            
                            createUserReport(req, res, sortedUserList);
                        });
                    } else {
                        createUserReport(req, res, searchedUserList);
                    }
                });
            } else if ( (sortData || {}).field ) {
                onSortName(sortData, UserList, function(sortedUserList) {                            
                    createUserReport(req, res, sortedUserList);
                });
            } else  {
                createUserReport(req, res, UserList);
            }
            
        }
    })
});

function buildUserDetails(userData) {
    var mapDetails = {
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
}


function onUserSearch(strSearch, UserList, callback) {
    var resUsers = [];
    
    strSearch = (strSearch || '').toLowerCase();

    if ( '' !== strSearch ) {
        for ( var i = 0, len = UserList.length; i < len; i++ ) {
            if ( ( 0 === (UserList[i].email || '').toLowerCase().indexOf(strSearch) ) || ( 0 === (UserList[i].firstName || '').toLowerCase().indexOf(strSearch) ) || ( 0 === (UserList[i].lastName || '').toLowerCase().indexOf(strSearch) )) {
                resUsers.push(UserList[i]);
            }
        }
    } else {
        resUsers = UserList;
    }
    UserList = resUsers;
    callback(UserList);
}

function onSortName(sortData, UserList, callback) {
    var col = sortData.field,
        sortedUsers = [],
        tmpArr = [],
        currValue = '';

    UserList = UserList || [];
    
    if ( 'tempPassword' === col ) {
        for ( var t = 0; t < 2; t++ ) {
            for ( var i = 0, len = UserList.length; i < len; i++ ) {
                if ( ( !t === !UserList[i].tempPassword ) ) {
                    sortedUsers.push(UserList[i]);
                }
            }
        }
    } else {

        for ( var i = 0, len = UserList.length; i < len; i++ ) {
            currValue = ( UserList[i][col] || '' ).toLowerCase();
            if ( -1 === tmpArr.indexOf(currValue) ) {
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
    }

    UserList = sortedUsers;

    if ( 'DESC' == sortData.order ) {
        UserList.reverse();
    }
    callback(UserList);
}


function createUserReport(req, res, Users) {
    Users = Users || [];
    var userDetails = Users[0].userDetails || [];
    var csvContent = "Post Date,First Name,Last Name,Email,Role,Active,Password,"
        + "IDEA Posts,IDEA Comments,IDEA Likes,Feedback Responses,My Artistry Posts,My Artistry Comments,My Artistry Likes,Alerts Posts,Alerts Comments,Alerts Likes";

console.log('userDetails: ');
console.log(userDetails);

    for ( var d = 0; d < userDetails.length; d++ ) {
        csvContent += "," + userDetails[d].name;
    }
    csvContent += "\n";
    
    for ( var i = 0; i < Users.length; i++ ) {              
        csvContent += Users[i].strCreated;
        csvContent += "," + (Users[i].firstName || 'N/A');
        csvContent += "," + (Users[i].lastName || 'N/A');
        csvContent += "," + (Users[i].email || 'N/A');
        csvContent += "," + ({ARTIST: 'Artist', LEADER: 'Leader'})[Users[i].role];
        csvContent += "," + (Users[i].status || 'N/A');        
        csvContent += "," + (!Users[i].tempPassword ? 'Yes': '');
        
        // User Statistics
        csvContent += "," + ((Users[i].stats || {}).ideaPosted || '0');
        csvContent += "," + ((Users[i].stats || {}).ideaComments || '0');
        csvContent += "," + ((Users[i].stats || {}).ideaLikes || '0');
        csvContent += "," + ((Users[i].stats || {}).feedbackResponses || '0');
        csvContent += "," + ((Users[i].stats || {}).artistryPosts || '0');
        csvContent += "," + ((Users[i].stats || {}).artistryComments || '0');
        csvContent += "," + ((Users[i].stats || {}).artistryLikes || '0');
        csvContent += "," + ((Users[i].stats || {}).alertPosts || '0');
        csvContent += "," + ((Users[i].stats || {}).alertComments || '0');
        csvContent += "," + ((Users[i].stats || {}).alertLikes || '0');
        
        // User Details
        userDetails = Users[i].userDetails || [];
        for ( d = 0; d < userDetails.length; d++ ) {
            csvContent += ',"' + ((userDetails[d] || {}).value || 'N/A') + '"';
        }
        csvContent += "\n";
    }
    
    saveReport(res, csvContent);
}

/* POST Macideas Groups Report. */
router.post('/report/ideagroups', function (req, res) {
    var IdeasGroupList = req.body.IdeasGroupList || [];
    var csvContent = "Post Date,Title,End Date,Posted by\n";
    var ideas;
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    for ( var i = 0; i < IdeasGroupList.length; i++ ) {
        csvContent += (IdeasGroupList[i].strCreated || 'N/A');
        csvContent += "," + (IdeasGroupList[i].title || 'N/A');
        csvContent += "," + (IdeasGroupList[i].strEnds || 'N/A');
        csvContent += "," + ((IdeasGroupList[i].author || {}).firstName || 'N/A' ) + ' ' + ((IdeasGroupList[i].author || {}).lastName || 'N/A') + "\n";
            
        //ideas = IdeasGroupList[i].ideas || [];
        //
        //csvContent += "Ideas:,Post Date,Title,Posted by\n";
        //
        //for ( var m = 0; m < ideas.length; m++ ) {
        //    csvContent += "," + (ideas[m].strCreated || 'N/A');
        //    csvContent += "," + (ideas[m].title || 'N/A');
        //    csvContent += "," + ((ideas[m].author || {}).firstName || 'N/A' ) + ' ' + ((ideas[m].author || {}).lastName || 'N/A') + "\n";
        //}
        //csvContent += ",,\n";
    }

    saveReport(res, csvContent);
});

function getIdeas(req, res, groupId, callback) {
    var request = require('request');
    
    request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/ideacontroller/group/' + groupId + '?offset=0&page_size=2000',
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback(resJSON);
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
//            console.log('resJSON: ');
//            console.log(resJSON);
            callback(resJSON.ideas || []);
        }
    })
}

/* POST Mac Ideas  Report. */
router.post('/report/ideas', function (req, res) {
    var groupId = req.body.groupId || null;

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    getIdeas(req, res, groupId, function(IdeaList) {
        createIdeaReport(req, res, IdeaList);
    });    
});

function getIdeaByID(req, res, ideaId, callback) {
    var request = require('request');
    
    request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/ideacontroller/idea/' + ideaId,
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback(resJSON);
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
//            console.log('resJSON: ');
//            console.log(resJSON);
            callback(resJSON.idea || {});
        }
    })
}

function createIdeaReport(req, res, IdeaList) {
    IdeaList = IdeaList || [];
    var uLen = IdeaList.length;
    var boundleSize = 200;
    
    var runBundle = function(start, end) {
        var countQueries = 0;
        for ( var ii = start; ii < end; ii++ ) {
            countQueries++;
            (function(i) {
                getIdeaByID(req, res, IdeaList[i].id, function(idea) {
                    
                    IdeaList[i].comments = (idea || {}).answers || [];

                    countQueries--;
                    if ( 0 === countQueries ) {
                        if ( end < uLen ) {
                            runBundle((start + boundleSize), ( ( (end + boundleSize) < uLen) ? (end + boundleSize) : uLen ));
                        } else {
                            getIdeaCSVContent(IdeaList, function(csvContent) {
                                saveReport(res, csvContent);
                            });
                        }
                    }
                });
            })(ii);
        }        
    };
    
    runBundle(0, ( (boundleSize < uLen) ? boundleSize : uLen ));
    
}


function getIdeaCSVContent(IdeaList, callback) {
    var csvContent = "Post Date,Title,# Likes,# Comments,# Views,Posted by,Comment Date,Comment by,Comment\n";
    var comments = [];
    

    for ( var i = 0; i < IdeaList.length; i++ ) {
        csvContent += (IdeaList[i].strCreated || 'N/A')
            + ',"' + (IdeaList[i].title || 'N/A').replace(/"/g, " ") + '"'
            + "," + (IdeaList[i].likesCount || '0')
            + "," + (IdeaList[i].answersCount || '0')
            + "," + (IdeaList[i].viewsCount || '0')
            + "," + ((IdeaList[i].author || {}).firstName || 'N/A' ) + ' ' + ((IdeaList[i].author || {}).lastName || 'N/A') + ",,\n";

        comments = IdeaList[i].comments || [];

        if ( 0 < comments.length ) {            
            for ( var j = 0; j < comments.length; j++ ) {
                csvContent += ',,,,,,'
                    + require('moment')((comments[j] || {}).created).format('MM/DD/YYYY')
                    + "," + ((comments[j].author || {}).firstName || '') + ' ' + ((comments[j].author || {}).lastName || '')
                    + ',"' + ( comments[j].text || '' ).replace(/"/g, " ") + '"\n';
            }
        }
    }
    callback(csvContent);
}

/* POST Feedbacks Report. */
router.post('/report/feedbacks', function (req, res) {
    var Feedbacks = req.body.Feedbacks || [];
//    var csvContent = "Post Date,Title,Starts,Ends,# Likes,# Comments,# Views,Posted by\n";
    var csvContent = "Post Date,Title,Starts,Ends,# Likes,# Comments,Posted by\n";
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    for ( var i = 0; i < Feedbacks.length; i++ ) {
        csvContent += (Feedbacks[i].strCreated || 'N/A')
            + "," + (Feedbacks[i].title || 'N/A')
            + "," + (Feedbacks[i].strStarts || 'N/A')
            + "," + (Feedbacks[i].strExpires || 'N/A')
            + "," + (Feedbacks[i].likesCount || '0')
            + "," + (Feedbacks[i].answersCount || '0')
//            + "," + (Feedbacks[i].viewsCount || '0')
            + "," + ((Feedbacks[i].author || {}).firstName || 'N/A' ) + ' ' + ((Feedbacks[i].author || {}).lastName || 'N/A') + "\n";
    }

    saveReport(res, csvContent);
});

function getMyartistries(req, res, callback) {
    var request = require('request');
    var timeFrom = req.body.from;
    var timeTo = req.body.to;
    
    request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/artistrycontroller/all/period?offset=0&page_size=2000&from=' + timeFrom + '&to=' + timeTo,
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback(resJSON);
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
//            console.log('resJSON: ');
//            console.log(resJSON);
            callback(resJSON.artistries || []);
        }
    })
}

/* POST Myartistry Report. */
router.post('/report/myartistry', function (req, res) {
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    getMyartistries(req, res, function(MyartistryList) {
        createMyArtistryReport(req, res, MyartistryList);
    });
});

function getMyartistryByID(req, res, topicId, callback) {
    var request = require('request');
    
    request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/artistrycontroller/' + topicId,
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback(resJSON);
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
//            console.log('resJSON: ');
//            console.log(resJSON);
            callback(resJSON.artistry || {});
        }
    })
}

function createMyArtistryReport(req, res, MyartistryList) {
    MyartistryList = MyartistryList || [];
    var uLen = MyartistryList.length;
    var boundleSize = 200;
    
    var runBundle = function(start, end) {
        var countQueries = 0;
        for ( var ii = start; ii < end; ii++ ) {
            countQueries++;
            (function(i) {
                getMyartistryByID(req, res, MyartistryList[i].id, function(topic) {
                    
                    MyartistryList[i].comments = (topic || {}).comments || [];

                    countQueries--;
                    if ( 0 === countQueries ) {
                        if ( end < uLen ) {
                            runBundle((start + boundleSize), ( ( (end + boundleSize) < uLen) ? (end + boundleSize) : uLen ));
                        } else {
                            getMyArtistryCSVContent(MyartistryList, function(csvContent) {
                                saveReport(res, csvContent);
                            });
                        }
                    }
                });
            })(ii);
        }        
    };
    
    runBundle(0, ( (boundleSize < uLen) ? boundleSize : uLen ));
    
}

function getMyArtistryCSVContent(MyartistryList, callback) {
    var csvContent = "Post Date,Title,# Likes,# Comments,Posted by,Comment Date,Comment by,Comment\n";
    var comments = [];
    
    for ( var i = 0; i < MyartistryList.length; i++ ) {
        csvContent += require('moment')((MyartistryList[i] || {}).created).format('MM/DD/YYYY')
            + ',"' + (MyartistryList[i].title || 'N/A').replace(/"/g, " ") + '"'
            + "," + (MyartistryList[i].likesCount || '0')
            + "," + (MyartistryList[i].commentsCount || '0')
            + "," + ((MyartistryList[i].author || {}).firstName || 'N/A' ) + ' ' + ((MyartistryList[i].author || {}).lastName || 'N/A') + ",,\n";

        comments = MyartistryList[i].comments || [];

        if ( 0 < comments.length ) {            
            for ( var j = 0; j < comments.length; j++ ) {
                csvContent += ',,,,,'
                    + require('moment')((comments[j] || {}).created).format('MM/DD/YYYY')
                    + "," + ((comments[j].author || {}).firstName || '') + ' ' + ((comments[j].author || {}).lastName || '')
                    + ',"' + ( comments[j].text || '' ).replace(/"/g, " ") + '"\n';
            }
        }
    }
    callback(csvContent);
}

function getAlerts(req, res, callback) {
    var request = require('request');
    var timeFrom = req.body.from;
    var timeTo = req.body.to; 
    
    request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/trendcontroller/getalltrends/period?offset=0&page_size=2000&from=' + timeFrom + '&to=' + timeTo,
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback(resJSON);
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
//            console.log('resJSON: ');
//            console.log(resJSON);
            callback(resJSON.trends || []);
        }
    })
}

/* POST Alerts Report. */
router.post('/report/alerts', function (req, res) {
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    getAlerts(req, res, function(AlertsList) {
        createAlertsReport(req, res, AlertsList);
    });    
});

function getAlertsByID(req, res, topicId, callback) {
    var request = require('request');
    
    request({
        method: 'GET',
        uri: getApiUrl(req) + '/api/trendcontroller/gettrend/' + topicId,
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        }
    }, function (err, httpResponse, body) {
        var resJSON = {};
        if ( err ) {
            console.log('ERROR: ');
            console.log(err);
            callback(resJSON);
        } else {
            try {
                resJSON = JSON.parse(body || "{}");
            } catch (e) {
                console.log('PARSE EROR: ');
                console.log(e);
            }
//            console.log('resJSON: ');
//            console.log(resJSON);
            callback(resJSON.trend || {});
        }
    })
}

function createAlertsReport(req, res, AlertsList) {
    AlertsList = AlertsList || [];
    var uLen = AlertsList.length;
    var boundleSize = 200;
    
    var runBundle = function(start, end) {
        var countQueries = 0;
        for ( var ii = start; ii < end; ii++ ) {
            countQueries++;
            (function(i) {
                getAlertsByID(req, res, AlertsList[i].id, function(topic) {
                    
                    AlertsList[i].comments = (topic || {}).comments || [];

                    countQueries--;
                    if ( 0 === countQueries ) {
                        if ( end < uLen ) {
                            runBundle((start + boundleSize), ( ( (end + boundleSize) < uLen) ? (end + boundleSize) : uLen ));
                        } else {
                            getAlertsCSVContent(AlertsList, function(csvContent) {
                                saveReport(res, csvContent);
                            });
                        }
                    }
                });
            })(ii);
        }        
    };
    
    runBundle(0, ( (boundleSize < uLen) ? boundleSize : uLen ));
    
}

function getAlertsCSVContent(AlertsList, callback) {
    var csvContent = "Post Date,Title,# Likes,# Comments,Posted by,Comment Date,Comment by,Comment\n";
    var comments = [];
    
    for ( var i = 0; i < AlertsList.length; i++ ) {
        csvContent += require('moment')((AlertsList[i] || {}).created).format('MM/DD/YYYY')
            + ',"' + (AlertsList[i].title || 'N/A').replace(/"/g, " ") + '"'
            + "," + (AlertsList[i].likesCount || '0')
            + "," + (AlertsList[i].commentsCount || '0')
            + "," + ((AlertsList[i].author || {}).firstName || 'N/A') + ' ' + ((AlertsList[i].author || {}).lastName || 'N/A') + ",,\n";

        comments = AlertsList[i].comments || [];

        if ( 0 < comments.length ) {            
            for ( var j = 0; j < comments.length; j++ ) {
                csvContent += ',,,,,'
                    + require('moment')((comments[j] || {}).created).format('MM/DD/YYYY')
                    + "," + ((comments[j].author || {}).firstName || '') + ' ' + ((comments[j].author || {}).lastName || '')
                    + ',"' + ( comments[j].text || '' ).replace(/"/g, " ") + '"\n';
            }
        }
    }
    callback(csvContent);
}

/* POST Analytics User Report. */
router.post('/report/analytics/user', function (req, res) {
    var perUserStats = req.body.perUserStats || [];
    var csvContent = "ACTIVITES,IDEA,,,FEEDBACK,MY ARTISTRY,,EYES & EARS,\n";
    
    csvContent += "Name,Ideas Posted,Comments,Votes,Responces,Posts,Comments,Posts,Comments\n";
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    for ( var i = 0; i < perUserStats.length; i++ ) {
        csvContent += ((perUserStats[i].user || {}).firstName || 'N/A') + ' ' + ((perUserStats[i].user || {}).lastName || 'N/A');
        csvContent += "," + (perUserStats[i].ideaPosted || '0');
        csvContent += "," + (perUserStats[i].ideaComments || '0');
        csvContent += "," + (perUserStats[i].ideaVotes || '0');
        csvContent += "," + (perUserStats[i].feedbackResponses || '0');
        csvContent += "," + (perUserStats[i].artistryPosts || '0');
        csvContent += "," + (perUserStats[i].artistryComments || '0');
        csvContent += "," + (perUserStats[i].alertPosts || '0');
        csvContent += "," + (perUserStats[i].alertComments || '0') + "\n";
    }

    saveReport(res, csvContent);
});

/* POST Analytics Ideas Report. */
router.post('/report/analytics/dashboard', function (req, res) {
    var StatsList = req.body.StatsList || [];
    var csvContent = "Users Report\n";

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    csvContent += "Total registered," 
        + (StatsList.totalUsers || 0)
        + "\nTotal active (password set),"
        + (StatsList.totalActiveUsers || 0) + "\n";
    
    csvContent += ",\n\nPosting Percentages\n"
        + "MAC Ideas," + (StatsList.totalIdeas || 0) + "\n"
        + "Feedback," + (StatsList.totalFeedbacks || 0) + "\n"
        + "My Artistry," + (StatsList.totalArtistries || 0) + "\n"
        + "Eyes & Ears," + (StatsList.totalAlerts || 0);

    saveReport(res, csvContent);
});

/* POST Analytics Ideas Report. */
router.post('/report/analytics/macideas', function (req, res) {
    var IdeasData = req.body.StatsList || {};
    var ideaAnalytics = IdeasData.ideaAnalytics || {};
    var ideaQuestions = IdeasData.ideaQuestions || [];
    var csvContent = "Mac Idea Posts\n";

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    csvContent += ",,\n\nPosting Percentages\n"
        + "Total # of Idea Questions Posted," + (ideaAnalytics.totalIdeaQuestions || 0) + "\n"
        + "Total # of Ideas Posted," + (ideaAnalytics.totalIdeas || 0) + "\n"
        + "Total # of Ideas Liked," + (ideaAnalytics.totalIdeasLiked || 0) + "\n";
    
    csvContent += ",\nData Created,Name,Description,# Ideas,# Likes,# Comments,# Views\n";

    for ( var i = 0; i < ideaQuestions.length; i++ ) {
        csvContent += (ideaQuestions[i].strCreated || 'N/A')
            + "," + (ideaQuestions[i].title || 'N/A')
            + "," + (ideaQuestions[i].text || 'N/A')
            + "," + (ideaQuestions[i].ideasCount || '0')
            + "," + (ideaQuestions[i].likesCount || '0')
            + "," + (ideaQuestions[i].commentsCount || '0')
            + "," + (ideaQuestions[i].viewsCount || '0') + "\n";
    }

    saveReport(res, csvContent);
});

/* POST Analytics Feedback Report. */
router.post('/report/analytics/feedback', function (req, res) {
    var FeedbackData = req.body.StatsList || {};
    var yesNo = FeedbackData.yesNo || [];
    var multipleChoice = FeedbackData.multipleChoice || [];
    var discussion = FeedbackData.discussion || [];
    var maxVotes = FeedbackData.maxVotes || [];
    var new_line = ",,\n";
    var csvContent = "Feedback Posts\n";

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    

    csvContent += "Total # of Feedback Questions Posted," 
        + (FeedbackData.totalQuestions || 0) + "\n"
        + "\nTotal # of Feedback Responses),"
        + (FeedbackData.totalResponses || 0) + "\n";
    
    csvContent += new_line;
    
    csvContent += "Yes/No Feedback Questions"
        + ",Total # of Questions: " + (FeedbackData.totalYesNoQuestions || 0)
        + ",Total # of Yes Votes: " + (FeedbackData.totalYesVotes || 0)
        + ",Total # of No Votes: " + (FeedbackData.totalNoVotes || 0) + "\n";

    csvContent += "Data Created,Name,End Date,# Yes,# No\n";

    for ( var i = 0; i < yesNo.length; i++ ) {
        csvContent += (yesNo[i].strCreated || 'N/A')
            + "," + (yesNo[i].title || 'N/A')
            + "," + (yesNo[i].strEnds || 'N/A')
            + "," + (yesNo[i].yesVotes || '0')
            + "," + (yesNo[i].noVotes || '0') + "\n";
    }
   
    csvContent += new_line;
    csvContent += "Multiple Choice Feedback Questions" 
        + ",Total # of Questions: " + (FeedbackData.totalMultipleQuestions || 0)
        + ",Total # of Responses: " + (FeedbackData.totalMultipleResponses || 0) + "\n";

    csvContent += "Data Created,Name,End Date";

    for (i = 0; i < maxVotes.length; i++ ) {
        csvContent += ',' + String.fromCharCode(i + 65);
    }

    csvContent += "\n";

    for ( i = 0; i < multipleChoice.length; i++ ) {
        csvContent += (multipleChoice[i].strCreated || 'N/A');
        csvContent += "," + (multipleChoice[i].title || 'N/A');
        csvContent += "," + (multipleChoice[i].strEnds || 'N/A');

        for (var j = 0; j < maxVotes.length; j++ ) {
            csvContent += "," + ((undefined !== (multipleChoice[i].votes || [])[j]) ? multipleChoice[i].votes[j] : '');
        }
        csvContent += "\n";
    }
   
    csvContent += new_line;
    csvContent += "Comments Choice Feedback Questions" 
        + ",Total # of Questions: " + (FeedbackData.totalDiscussionQuestions || 0)
        + ",Total # of Comments: " + (FeedbackData.totalDiscussionComments || 0) + "\n";
    
    csvContent += "Data Created,Name,End Date,Total Comments\n";

    for ( i = 0; i < discussion.length; i++ ) {
        csvContent += (discussion[i].strCreated || 'N/A');
        csvContent += "," + (discussion[i].title || 'N/A');
        csvContent += "," + (discussion[i].strEnds || 'N/A');
        csvContent += "," + (discussion[i].commentsCount || '0') + "\n";
    }

    saveReport(res, csvContent);
});

/* POST Analytics My Artistry Posts Report. */
router.post('/report/analytics/myartistry', function (req, res) {
    var StatsList = req.body.StatsList || {};
    var csvContent = "My Artistry Posts\n";

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    csvContent += ",\nPosting Percentages\n"
        + "Total # of My Artisrty Posts," + (StatsList.postsCount || 0) + "\n"
        + "Total # of Likes in My Artisrty," + (StatsList.likesCount || 0) + "\n"
        + "Total # of Comments in My Artisrty," + (StatsList.commentsCount || 0);

    saveReport(res, csvContent);
});

/* POST Analytics Alert Posts Report. */
router.post('/report/analytics/alerts', function (req, res) {
    var StatsList = req.body.StatsList || {};
    var csvContent = "Mac Idea Posts\n";

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    csvContent += ",\nPosting Percentages\n"
        + "Total # of Eyes & Ears Posted," + (StatsList.postsCount || 0) + "\n"
        + "Total # of Likes in Eyes & Ears," + (StatsList.likesCount || 0) + "\n"
        + "Total # of of Comments in Eyes & Ears," + (StatsList.commentsCount || 0);

    saveReport(res, csvContent);
});

/* POST Groups Report. */
router.post('/report/groups', function (req, res) {
    var GroupList = req.body.GroupList || [];
    var members = [];
    var csvContent = "Post Date,Title,Description,Posted by\n";
    
    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }
    
    for ( var i = 0; i < GroupList.length; i++ ) {
        csvContent += (GroupList[i].strCreated || 'N/A');
        csvContent += "," + (GroupList[i].name || 'N/A');
        csvContent += "," + (GroupList[i].descr || 'N/A');
        csvContent += "," + ((GroupList[i].author || {}).firstName || 'N/A') 
                + ' ' + ((GroupList[i].author || {}).lastName || 'N/A') + "\n";
            
        members = GroupList[i].members || [];
        
        csvContent += "Members:,First Name,Last Name,Email Address\n";
        
        for ( var m = 0; m < members.length; m++ ) {
            csvContent += "," + (members[m].firstName || 'N/A');
            csvContent += "," + (members[m].lastName || 'N/A');
            csvContent += "," + (members[m].email || 'N/A') + "\n";
        }
        csvContent += ",,\n";
    }

    saveReport(res, csvContent);
});

/* POST Logs Report. */
router.post('/report/logs', function (req, res) {
    var LogList = req.body.LogList || [];
    var csvContent = "Logs\n";

    if ( !req.session.access_token ) {
        res.send({
            success: false,
            message: "Authorization Failed."
        });
        return;
    }

    csvContent += "Date/time,User,Action\n";

    for ( var a = 0; a < LogList.length; a++ ) {
        csvContent += LogList[a].strCreated + ',' + LogList[a].email + ',"' + LogList[a].message + '"\n';
    }

   saveReport(res, csvContent);
});

function saveReport(res, csvContent) {
    var now = new Date();
    var reports_dir =  path.join(__dirname, '/reports/');
    var report_file = reports_dir + 'report_' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' 
        + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds() + '.csv'; // ex. report_2015-05-17_5-48-02
    var file_name = report_file.substr(report_file.replace(/\\/g, '/').lastIndexOf('/') + 1);    
    if ( !fs.existsSync(reports_dir) ) {
        fs.mkdirSync(reports_dir);
    }
    fs.writeFile(report_file, csvContent, function (err) {
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
}


/* GET Logout. */
router.get('/logout', function (req, res) {
    
    delete req.session.access_token;
    delete req.session.current_password;
    
    res.send({
        success: true,
        data: {}
    });
});



function sendLog(req, res, type) {
    var reqUrl = getApiUrl(req) + '/api/log';
    var request = require('request');
    var bodyData = require('querystring').stringify({event: type});
    
    console.log('SEND LOG: ' + reqUrl + '; TYPE ' + type);
    
    request({
        method: req.method,
        uri: reqUrl,
        headers: {
            'Content-Length': bodyData.length,
            "Content-Type": "application/x-www-form-urlencoded",
            'Authorization': 'Bearer ' + req.session.access_token,
            'console': true
        },
        body: bodyData
    }, function (err, httpResponse, body) {
        console.log('RESPONSE LOG: ' + type);
        console.log(body);
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
            
            if ( 'LOGOUT' == type ) {
                delete req.session.access_token;
                delete req.session.current_password;
                res.send({
                    success: true,
                    data: {}
                });
            }
        }
    }); 
}

/* POST Logs Report. */
router.post('/logout', function (req, res) {
    sendLog(req, res, 'LOGOUT');
});

/* GET home page. */
router.get('/', function (req, res) {        
    res.render('index', {
        title: 'iApprove'
    });
});

/* GET EULA html page. */
router.get('/eula', function (req, res) {
    res.render('eula');
});


/* GET ANALYTICS DASHBOARD html page. */
router.get('/analytics_dashboard', function (req, res) {
    res.render('analytics_dashboard');
});

/* GET ANALYTICS DASHBOARD MOBILE html page. */
router.get('/macstat', function (req, res) {
    res.render('macstat', {
        token: req.query.token || ''
    });
});


/* GET Super Admin Home page. */
router.get('/super-admin', function (req, res) {        
    res.render('super-admin', {
        title: 'iApprove'
    });
});

/* GET EULA html page. */
//router.get('/eula.html', function (req, res) {
//    res.render('eula');
//});

router.getApiUrl = getApiUrl;
router.loginUser = loginUser;

module.exports = router;
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var compression = require('compression');
var config = require('./config');
var url = require('url');
var fs = require('fs');


var routes = require('./routes/index');

var session = require('express-session');

var app = express();

var oneYear = 31557600000;
// app.use(express.static(__dirname + '/public', { maxAge: oneYear }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());


app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());

app.use(session({secret: 'keyboard cat', resave: true, saveUninitialized: true}));

app.use('/', routes);

/*
 * API
 */
app.use('/api', require('./routes/api'));

app.use(busboy());


/* POST Uploading the Preview Icon */
app.post('/tmpFile', function (req, res) {
    var access_token = req.session.access_token || req.session.sa_access_token;
    var now = new Date();
    var tmp_file = 'images/assets/' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' 
        + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
    
    console.log("POST Uploading the Icon");

    if ( !access_token || '' == access_token ) {
        res.send({success: false, message: 'Autorization failed.'});
        return;
    }
        
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        var tmp_file_name = tmp_file + '_' + filename;     
       
        if ( req.query.defIcon ) {
            tmp_file_name = 'images/assets/ic_default.png';
        }
        
        var full_file_name = path.join(__dirname, '/public/' + tmp_file_name);   
        
        console.log("Def File Uploading: " + req.query.defIcon);
        console.log("tmpFile Uploading: " + filename);
        console.log('write location : ' + tmp_file_name);


        fstream = fs.createWriteStream(full_file_name);

        console.log("before calling file.pipe");

        file.pipe(fstream);

        fstream.on('close', function () {
            
            res.send({
                success: true,
                data: tmp_file_name
            });
            
            if ( !req.query.defIcon ) {
                setTimeout(function () {
                    fs.unlink(full_file_name);
                    console.log('file removed');
                }, 10 * 1000 * 60); // 10 minutes
            }            
        });
    });
    
});


/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if ( app.get('env') === 'development' ) {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

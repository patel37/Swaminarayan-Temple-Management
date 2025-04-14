'use strict';
//configurations
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const jsonResponse = require('./utils/json-response');
const errors = require('./utils/dz-errors');
const cors = require('cors');
const cron = require('node-cron');
const request = require('request');
const exec = require('child_process').exec;
const fs = require('fs');
const AWS = require('aws-sdk');
const moment = require('moment')
const config = require('./config')

//routes
const routes = require('./routes/index');
const language = require('./routes/language');
const consumer = require('./routes/haribhagat');
const admin = require('./routes/admin');
const city = require('./routes/city');
const country = require('./routes/country');
const state = require('./routes/state');

const dashboard = require('./routes/dashboard');
const setting = require('./routes/setting');
const currency = require('./routes/currency');

const mail = require('./routes/mail');
const loginlog = require('./routes/loginlog');
const emailTemplate = require('./routes/email-template');
const common = require('./routes/common');
const role = require('./routes/role');
const smsTemplate = require('./routes/sms-template');
const tokenHandler = require('./model_handlers/token-handler')
const apiToken = require('./routes/token')
const sabha = require('./routes/sabha')
const _ = require('underscore');
const basicAuth = require('basic-auth');

    //other configurations
const passport = require('passport');
const favicon = require('serve-favicon');
const multiparty = require('connect-multiparty');
const upload = require('express-fileupload');
const multipartyMiddleWare = multiparty();

//express configurations
const app = express();
app.use(express.static(path.join(__dirname, './frontend/dist')));
app.use(favicon(path.join(__dirname, './public/img', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());
app.use(multipartyMiddleWare);
const auth = (req, res, next) => {
    const credentials = basicAuth(req);
    console.log("---------------credentials-------",credentials);
    // Check if credentials are present and match the desired username and password
    if (!credentials || credentials.name !== 'george' || credentials.pass !== '123@george') {
        res.status(401).send('Unauthorized');
    } else {
        next();
    }
};

var authToken = () => {
        console.log("call")
        console.log(`-----------------req.url--dsss--------------`)
        return (req, res, next) => {
            console.log(`-----------------req.url----------------`,req.url)
            console.log(`---------------req.body-----------------`,req.body)
            // next()
            let url = req.url
            if (req.query) {
                console.log(req.query)
                url = url.split("?")[0] || url
            }
            if (req.url == '/get-language' || req.url == '/get-label' || req.url == '/get-setting' || req.url == '/otp-verification' ||
                req.url == '/consumer-authentication' || req.url == '/upload-image' || req.url == '/admin-register' || req.url == '/get-url' || req.url == '/admin-authentication' ||
                req.url == '/get-vehicle-type-admin' || req.url == '/loginweb' || req.url == '/verify-authentication-otp' ||
                req.url == '/resend-otp' || req.url == '/create-admin' || req.url == '/login' || req.url == '/active-admin' ||
                req.url == '/forgot-password' || req.url == '/reset-password' ||
                req.url == '/logout' ) {
                    next()
            } else {
                console.log(`-----------------req.Authorization----------------`,req.Authorization)
                // console.log(`---------------req.body-----------------`,req.body)
                tokenHandler.authenticate(req, res, (err, res) => {

                    next()
                })
            }
        }
}
// import routes
app.use('/', routes);
app.use('/api/token/', apiToken)
app.use('/api/dashboard/', authToken(), dashboard);
app.use('/api/language/', authToken(), language);
app.use('/api/haribhagat/', authToken(), consumer);
app.use('/api/admin/', authToken(), admin);
app.use('/api/city/', authToken(), city);
app.use('/api/state/', authToken(), state);
app.use('/api/country/', authToken(), country);
app.use('/api/setting/', authToken(), setting);
app.use('/api/sabha/', authToken(), sabha);
app.use('/api/currency/', authToken(), currency);
app.use('/api/mail/', authToken(), mail);
app.use('/api/loginlog/', authToken(), loginlog);
app.use('/api/email-template/', authToken(), emailTemplate);
app.use('/api/common/', authToken(), common);
app.use('/api/role/', authToken(), role);
app.use('/api/sms-template/', authToken(), smsTemplate);
app.get('/api/app-logs', auth, (req, res) => {
    // Read the logfile and send its content as the response         
    res.sendFile(path.join(__dirname, 'logfile.log'));
});


app.get('/getZip', (req, res) => {
    const date = moment(new Date()).format('DD-MM-YYYY');
    const fileName = date + '_dump';
    exec(`mongodump --db cabappdev-test-1 --out ./db/${fileName}`, (err, stdout, stderr) => {
      if (err) {
        console.log('::db dump ERROR::', err);
        return res.status(500).send({ error: 'error dumping database' });
      }
  
      exec(`zip -r ./db/${fileName}.zip ./db/${fileName}`, (error, stdout, stderr) => {
        if (error) {
          console.log('::zip ERROR::', error);
          return res.status(500).send({ error: 'error zipping file' });
        }
  
        console.log('::-create zip successfully-::');
        const dir = `./db/${fileName}.zip`;
        fs.readFile(dir, function (err, files) {
          if (err) {
            return res.status(500).send({ error: 'error reading file' });
          }
  
          res.set('Content-Type', 'application/zip');
          res.set('Content-Disposition', `attachment; filename=${fileName}.zip`);
          return res.status(200).send(files);
        });
      });
    });
});
app.get('*', function (req, res) {
    console.log("testtt")
    // res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    res.sendFile(path.join(__dirname, './frontend/dist', 'index.html'));
});






// cron.schedule('* 23 * * * ', () => {
//     exec('mongodump --db cabappdev-test-1 --out ./dump/',(err,stdout,stderr)=>{
//         console.log('-----------mongodump-------------',err)
//         if(err){
//             console.log('::db dump ERROR::',err)
//             throw err;
//         }
//         try {
//         const date = moment(new Date()).format('DD-MM-YYYY')
//         const fileName= date + '_dump'
//         exec(`zip -r ./dump/${fileName} ./dump/cabappdev-test-1`,(error,stdout,stderr)=>{
//             console.log('-----------error-------------',error)
//             if(error){
//                 console.log('::zip ERROR::',error);
//                 console.log('-----------error-------------');
//                 console.log('::zip STDERR::', stderr);
//             }
//             console.log('::-create zip successfully-::')
//             const dir = `./dump/${fileName}.zip` 
//                 fs.readFile(dir, function (err, files) {
//                     if (err) throw err;
//                         AWS.config.update({
//                             accessKeyId: config.aws.keyId,
//                             secretAccessKey: config.aws.key,
//                             region: config.aws.sesRegion
//                         });
//                     let bucket = config.aws.s3.dbdumpBucket;
//                     var s3bucket = new AWS.S3({ params: { Bucket: bucket+"/" + fileName } });
//                     s3bucket.createBucket(function () {
//                         var params = {
//                             Key: fileName, 
//                             Body: files
//                         };
//                         s3bucket.upload(params, function (err, data) {
//                             if (err) {
//                                 console.log('::S3BUCKET ERROR::', err);
//                             } else {
//                                 console.log('|| database dump store successfully ||');
//                                 // fs.unlink(dir, function(err){
//                                 //     if (err) console.log('Delete Zip Error:-',err);
//                                 //     console.log('::-Delete Zip File successfully-::');
//                                 // });
//                             }
//                         });
                        
//                 });
//             });
//         })     
//     } catch (e) {
//         console.error('Exception during zip command:', e);
//     }
//     })
// });


module.exports = app;
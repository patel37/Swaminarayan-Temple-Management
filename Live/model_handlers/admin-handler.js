'use strict';

const logger = require('../utils/logger');
const jsonResponse = require('../utils/json-response');
const errors = require('../utils/dz-errors');
const dbConstants = require('../constants/db-constants');
const driverConstants = require('../constants/admin-constants');
const tripConstants = require('../constants/trip-constants');
const notificationConstants = require('../constants/notification-constants');
const mailConstants = require('../constants/mail-constants');
const passwordHandler = require('../utils/password-handler');
const query = require('../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Admin = require('./../models/admin');
const Setting = require('../models/setting');
const Haribhagat = require('../models/haribhagat');
const fs = require('file-system');
const config = require('../config');
const moment = require('moment');
const formatCurrency = require('format-currency');
const geolib = require('geolib');
const S3Handler = require('../utils/s3-handler');
const s3Handler = new S3Handler();
let bucketNameProfile = config.aws.s3.driverBucket;
let bucketNameLicense = config.aws.s3.driverBucket;
let assetsbucket = config.aws.s3.assetsBucket;
const commonHandler = require('./common-handler');
const { formatString } = require('../utils/stringGenerator');
const humanizeDuration = require("humanize-duration");
const tokenHandler = require('../model_handlers/token-handler')
const token = require('../utils/token');
const responseCodes = require('../helpers/response-codes');

// const twilio = require('twilio');
// const accountSid = config.twilio.accountSid;
// const authToken = config.twilio.authToken;
// let client = new twilio(accountSid, authToken);

// const mailgun = require('mailgun-js')({
//     apiKey: config.mailgunInfo.api_key,
//     domain: config.mailgunInfo.domain
// });

//SES
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: config.aws.keyId,
    secretAccessKey: config.aws.key,
    region: config.aws.sesRegion
});
const awsSES = new AWS.SES({ apiVersion: '2010-12-01' });
//ses

const replaceOnce = require('replace-once');
const apn = require('apn');
const FCM = require('fcm-node');
const adminConstants = require('../constants/admin-constants');


// code for ios push notification
// const p8FilePath = config.push_notification.p8FilePath;
// const options = {
//     token: {
//         key: p8FilePath,
//         keyId: config.push_notification.key_id,
//         teamId: config.push_notification.team_id
//     },
//     production: false
// };
// const apnProvider = new apn.Provider(options);
// end of code for ios push notification

// code for android push notification
// const serverKey = config.push_notification.server_key; //put your server key here
// const fcm = new FCM(serverKey);
// end of code for android push notification

const updateAppVersionCode = async (requestParam, req, done) => {
    query.updateAndFindSingle(dbConstants.dbSchema.admins, requestParam, {
        admin_id: requestParam.admin_id
    }, {
        _id: 0,
        admin_id: 1,
        version_code: 1,
    }, (error, admin) => {
        if (error) {
            done(errors.internalServer(true), null);
            return;
        }
        done(null, admin);
    });
};

// const getFirebaseTrips = function(requestParam, done) {
//     var q = config.firebase.tripRef.child(requestParam.trip_id);
//     q.update({
//         status: requestParam.status,
//         admin_id: requestParam.admin
//     });
//     done(null, {})
//     return
//     // query.updateSingle(dbConstants.dbSchema.trips, { status: 'Cancel' }, { trip_id: requestParam.trip_id }, (error, response) => {
//     //     if (error) {
//     //         console.log("error while update status in firebase")
//     //     }
//     //     done(null, {})
//     //     return
//     // })
// }

// const notificationStatusUsingFirebase = function(requestParam, done) {
//     let columnsAndValuesUpdate;
//     if (requestParam.type == 'notification') {
//         columnsAndValuesUpdate = {
//             notification: requestParam.status
//         }
//     } else {
//         columnsAndValuesUpdate = {
//             online_status: requestParam.status
//         }
//     }
//     query.updateSingle(dbConstants.dbSchema.admins, columnsAndValuesUpdate, {
//         admin_id: requestParam.admin_id
//     }, function(error, admin) {
//         if (error) {
//             logger('Error: can not update admins');
//             done(error, null);
//             return;
//         }
//         //done(null, 'Record Updated Successfully.');
//         return
//     });
// };

// const getFirebaseDriverLatLng = function(requestParam, done) {
//     let columnsAndValuesLatLng = {};
//     var query = config.firebase.driverRef.child(requestParam.admin_id);
//     query.once("value", function(snapshot) {
//         columnsAndValuesLatLng.latitude = snapshot.val().latitude;
//         columnsAndValuesLatLng.longitude = snapshot.val().longitude;
//         done(null, columnsAndValuesLatLng);
//     }, function(errorObject) {
//         done(null, errorObject);
//     });
// }

// const getFirebaseDrivers = function(req, done) {
//     const fullUrl = req.protocol + '://' + req.get('host');
//     var markers = [];
//     config.firebase.driverRef.once("value", function(snapshot) {
//         markers = snapshot.val();
//         var firebaseDriverArr = [];
//         let columnAndValuesJobDetail = [];
//         async.forEachSeries(markers, function(single_marker, callback_single_marker) {
//             columnAndValuesJobDetail = [];
//             query.selectWithAndOne(dbConstants.dbSchema.admins, {
//                 'admin_id': single_marker.admin_id
//             }, function(error, admin) {
//                 if (error) {
//                     callback_single_marker();
//                 } else {
//                     if (admin != null && admin.vehicle_type_id) {
//                         query.selectWithAnd(dbConstants.dbSchema.tripdrivers, {
//                             'admin_id': single_marker.admin_id,
//                             status: 'Accept'
//                         }, function(error, tripDriver) {
//                             async.forEachSeries(tripDriver, function(singleTrip, callback_job) {
//                                 query.selectWithAndOne(dbConstants.dbSchema.trips, {
//                                     'trip_id': singleTrip.trip_id
//                                 }, function(error, trip) {
//                                     if (trip == null) {
//                                         callback_job();
//                                     } else {
//                                         if (trip.status == tripConstants.status.ongoing) {
//                                             query.selectWithAndOne(dbConstants.dbSchema.vehicleTypes, {
//                                                 'vehicle_type_id': trip.vehicle_type_id
//                                             }, function(error, vehicle) {
//                                                 query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
//                                                     'haribhagat_id': trip.haribhagat_id
//                                                 }, function(error, consumer) {
//                                                     if (vehicle == null || consumer == null) {
//                                                         callback_job();
//                                                     } else {
//                                                         let name;
//                                                         if (consumer.first_name == '' || consumer.last_name == '') {
//                                                             name = consumer.mobile;
//                                                         } else {
//                                                             name = consumer.first_name + ' ' + consumer.last_name;
//                                                         }
//                                                         columnAndValuesJobDetail.push({
//                                                             trip_id: trip.trip_id,
//                                                             vehicle: vehicle.name['EN'],
//                                                             consumer: name,
//                                                             price: trip.total_price,
//                                                             // created_at: moment(trip.created_at).format("Do MMM YYYY h:mm A"),
//                                                             created_at: moment(commonHandler.converTotimeZone(trip.created_at)).format("Do MMM YYYY h:mm A"),
//                                                         });
//                                                         callback_job();
//                                                     }
//                                                 });
//                                             });
//                                         } else {
//                                             callback_job();
//                                         }
//                                     }
//                                 });
//                             }, function() {
//                                 if (!admin.first_name || !admin.last_name) {
//                                     admin.first_name = '';
//                                     admin.last_name = '';
//                                 }
//                                 let innerObj = {
//                                     'admin_id': single_marker.admin_id,
//                                     'lat': parseFloat(single_marker.latitude),
//                                     'lng': parseFloat(single_marker.longitude),
//                                     'label': admin.first_name + ' ' + admin.last_name,
//                                     'mobile': admin.mobile,
//                                     'draggable': false,
//                                     'www': '',
//                                     'icon': '',
//                                     'data': columnAndValuesJobDetail
//                                 }
//                                 firebaseDriverArr.push(innerObj);
//                                 callback_single_marker();
//                             });
//                         });
//                     } else {
//                         callback_single_marker();
//                     }
//                 }
//             })
//         }, function() {
//             done(null, firebaseDriverArr);
//         })
//     }, function(errorObject) {
//         done(null, markers);
//     });
// };

// const getMapboxDrivers = function(req, done) {
//     const fullUrl = req.protocol + '://' + req.get('host');
//     var markers = [];
//     var firebaseDriverArr = [];
//     let columnAndValuesJobDetail = [];
//     config.firebase.driverRef.once("value", function(snapshot) {
//         markers = snapshot.val();
//         async.forEachSeries(markers, function(single_marker, callback_single_marker) {
//             columnAndValuesJobDetail = [];
//             query.selectWithAndOne(dbConstants.dbSchema.admins, {
//                 'admin_id': single_marker.admin_id
//             }, function(error, admin) {
//                 if (error) {
//                     callback_single_marker();
//                 } else {
//                     if (admin != null && admin.vehicle_type_id) {
//                         if (!admin.first_name || !admin.last_name) {
//                             admin.first_name = '';
//                             admin.last_name = '';
//                         }
//                         query.selectWithAnd(dbConstants.dbSchema.tripdrivers, {
//                             'admin_id': single_marker.admin_id,
//                             status: 'Accept'
//                         }, function(error, tripDriver) {
//                             async.forEachSeries(tripDriver, function(singleTrip, callback_job) {
//                                 let joinArr = [{
//                                     $lookup: {
//                                         from: 'haribhagats',
//                                         localField: 'haribhagat_id',
//                                         foreignField: 'haribhagat_id',
//                                         as: 'consumerDetails'
//                                     }
//                                 }, {
//                                     $unwind: "$consumerDetails"
//                                 }, {
//                                     $lookup: {
//                                         from: 'vehicletypes',
//                                         localField: 'vehicle_type_id',
//                                         foreignField: 'vehicle_type_id',
//                                         as: 'vehicleDetails'
//                                     }
//                                 }, {
//                                     $unwind: "$vehicleDetails"
//                                 }, {
//                                     $match: { trip_id: singleTrip.trip_id, status: 'Ongoing' }
//                                 }, {
//                                     $project: {
//                                         _id: 0,
//                                         trip_id: "$trip_id",
//                                         price: "$total_price",
//                                         created_at: "$created_at",
//                                         mobile: "$consumerDetails.mobile",
//                                         consumer: {
//                                             $concat: ["$consumerDetails.first_name", " ", "$consumerDetails.last_name"]
//                                         },
//                                         vehicle: "$vehicleDetails.name",
//                                     }
//                                 }];
//                                 query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
//                                     if (error) {
//                                         logger('Error: can not get record.');
//                                         done(errors.internalServer(true), null);
//                                         return;
//                                     }
//                                     for (var i = 0; i < response.length; i++) {
//                                         if (response[i].consumer == '') {
//                                             response[i].consumer = response[i].mobile;
//                                         }
//                                         response[i].vehicle = response[i].vehicle['EN'];
//                                     }
//                                     if (response[0] != undefined) {
//                                         columnAndValuesJobDetail.push(response[0]);
//                                     }
//                                     callback_job();
//                                 });
//                             }, function() {
//                                 let innerObj = {
//                                     'admin_id': single_marker.admin_id,
//                                     'lat': parseFloat(single_marker.latitude),
//                                     'lng': parseFloat(single_marker.longitude),
//                                     'label': admin.first_name + ' ' + admin.last_name,
//                                     'mobile': admin.mobile,
//                                     'draggable': false,
//                                     'www': '',
//                                     'icon': '',
//                                     'data': columnAndValuesJobDetail
//                                 }
//                                 firebaseDriverArr.push(innerObj);
//                                 callback_single_marker();
//                             });
//                         });
//                     } else {
//                         callback_single_marker();
//                     }
//                 }
//             })
//         }, function() {
//             let array = [];
//             for (var i = 0; i < firebaseDriverArr.length; i++) {
//                 array.push({
//                     "type": "Feature",
//                     "properties": {
//                         "data": firebaseDriverArr[i].data,
//                         "name": firebaseDriverArr[i].label,
//                         "mobile": firebaseDriverArr[i].mobile,
//                         "icon": "theatre"
//                     },
//                     "geometry": {
//                         "type": "Point",
//                         "coordinates": [firebaseDriverArr[i].lng, firebaseDriverArr[i].lat]
//                     }
//                 })
//             }
//             var url = {
//                 "type": "FeatureCollection",
//                 "features": array
//             }
//             done(null, url);
//         })
//     }, function(errorObject) {
//         done(null, markers);
//     });
// };


// const deleteFirebaseDrivers = function(req, done) {
//     // driverRef.child('DRI12291').remove()
//     // .then(function() {
//     //    	done(null,{ status: 'ok' })
//     //    })
//     //    .catch(function(error) {
//     //    	console.log('Error deleting data:', error);
//     //    	done(null,{ status: 'error', error: error });
//     //    });

//     config.firebase.driverRef.remove()
//         .then(function() {
//             done(null, {
//                 status: 'ok'
//             })
//         })
//         .catch(function(error) {
//             done(null, {
//                 status: 'error',
//                 error: error
//             });
//         });
// };

// const trackBackend = function(requestParam, done) {
//     let firebaseDriverArr = [];
//     query.selectWithAndOne(dbConstants.dbSchema.tripdrivers, { 'trip_id': requestParam.trip_id, status: 'Accept' }, function(error, tripDriver) {
//         var queryFirebase = config.firebase.driverRef.child(tripDriver.admin_id);
//         queryFirebase.once("value", function(snapshot) {
//             query.selectWithAndOne(dbConstants.dbSchema.admins, { 'admin_id': tripDriver.admin_id }, function(error, admin) {
//                 let innerObj = {
//                     'lat': snapshot.val().latitude,
//                     'lng': snapshot.val().longitude,
//                     'admin': admin.first_name + ' ' + admin.last_name,
//                     'mobile': admin.mobile
//                 }
//                 firebaseDriverArr.push(innerObj)
//                 let array = [];
//                 for (var i = 0; i < firebaseDriverArr.length; i++) {
//                     array.push({
//                         "type": "Feature",
//                         "properties": {
//                             "description": firebaseDriverArr[i].admin + " >> " + firebaseDriverArr[i].mobile,
//                             "icon": "theatre"
//                         },
//                         "geometry": {
//                             "type": "Point",
//                             "coordinates": [firebaseDriverArr[i].lng, firebaseDriverArr[i].lat]
//                         }
//                     })
//                 }
//                 var url = {
//                     "type": "FeatureCollection",
//                     "features": array
//                 }
//                 done(null, url);
//             });
//         }, function(errorObject) {
//             done(null, errorObject);
//         });
//     });
// }



//for image Upload on AWS

// const uploadImageLicense = function(req, done) {
//     let fileType;
//     fileType = req.files.driver_license.name.split('.').pop();
//     const fileName = Math.floor(Date.now() / 1000);
//     req.files[_.keys(req.files)[0]]['file_name'] = fileName + '.' + fileType;
//     s3Handler.upload(req.files[_.keys(req.files)[0]], bucketNameLicense, fileType, (error, imageData) => {
//         if (error) {
//             logger('Error: failed to Upload  ', +fileType + ' ' + 'Image' + 'Failed with error:', error);
//             done(error, null);
//             return;
//         }
//         done(null, imageData.Location);
//     });
// };


//for image Upload on AWS

// const uploadImageProfile = function(req, done) {
//     let fileType;
//     fileType = req.files.profile_picture.name.split('.').pop();
//     const fileName = Math.floor(Date.now() / 1000);
//     req.files[_.keys(req.files)[0]]['file_name'] = fileName + '.' + fileType;
//     s3Handler.upload(req.files[_.keys(req.files)[0]], bucketNameProfile, fileType, (error, imageData) => {
//         if (error) {
//             logger('Error: failed to Upload  ', +fileType + ' ' + 'Image' + 'Failed with error:', error);
//             done(error, null);
//             return;
//         }
//         let finalimagename = getImageNameFromURL(imageData.Location)
//         query.updateSingle(dbConstants.dbSchema.admins, { profile_picture: finalimagename }, {
//             admin_id: req.body.admin_id
//         }, function(error, updatedDriver) {

//             done(null, imageData.Location);
//         });
//     });
// };


//for image upload on AWS

const removePhoto = function (requestParam, done) {
    const fileName = /[^/]*$/.exec(requestParam.profilePic)[0];
    s3Handler.deleteFile(fileName, bucketNameProfile, (errS3FileDelete, removePhoto) => {
        let columnsAndValues = {
            profile_picture: ''
        }
        query.updateSingle(dbConstants.dbSchema.admins, columnsAndValues, {
            admin_id: requestParam.admin_id
        }, function (error, driverUpdated) {
            if (error) {
                done(null, [{
                    code: '0'
                }])
            } else {
                done(null, [{
                    code: '1'
                }])
            }
        });
    });

};

// const getAssignDriverList = function(requestParam, done) {
//     query.selectWithAnd(dbConstants.dbSchema.admins, { status: 'Active' }, function(error, admins) {
//         if (error) {
//             logger('Error: can not get admin', dbConstants.dbSchema.admins);
//             done(error, null);
//             return;
//         }
//         done(null, admins)
//     });
// }

/*
 * Used to get admin with get methods
 * @param {Function} done - Callback function with error
 */
const getDriver = async function (requestParam, req, done) {
    const fullUrl = req.protocol + '://' + req.get('host').split(":")[0];
    if (requestParam.admin_id) {
        query.selectWithAndOne(dbConstants.dbSchema.admins, requestParam, async function (error, admin) {
            if (error) {
                logger('Error: can not get admin', dbConstants.dbSchema.admins);
                done(error, null);
                return;
            }
            if (!admin.first_name) {
                admin.first_name = '';
            }
            if (!admin.last_name) {
                admin.last_name = '';
            }
            if (!admin.current_balance) {
                admin.current_balance = '0';
            }
            admin = JSON.parse(JSON.stringify(admin));
            admin.displayEmail = (admin.email);
            admin.displayMobile = admin.mobile;
            // admin.displayMobile = formatString(admin.mobile);
            done(null, admin);
        });
    } else if (requestParam.type) {
        let joinArr = [{
            $lookup: {
                from: 'languages',
                localField: 'language_id',
                foreignField: 'language_id',
                as: 'languageDetails'
            }
        }, {
            $unwind: "$languageDetails"
        }, {
            $match: { admin_id: requestParam.type }
        }, {
            $project: {
                _id: 0,
                language_id: "$languageDetails.title",
                first_name: "$first_name",
                last_name: "$last_name",
                email: "$email",
                mobile_country_code: "$mobile_country_code",
                mobile: "$mobile",
                created_at: "$created_at",
                profile_picture: "$profile_picture",
                notification: "$notification",
                online_status: "$online_status",
                is_login: "$is_login",
                total_earned: "$total_earned",
                total_cashout: "$total_cashout",
                current_balance: "$current_balance",
                photo_id: "$photo_id",
                address: "$address",
            }
        }];
        query.joinWithAnd(dbConstants.dbSchema.admins, joinArr, async (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }

            done(null, response[0])
        });
    } else {
        let joinArr1 = [{
            "$match": { is_archive: 'false' }
        }, {
            $lookup: {
                from: 'trips',
                localField: 'admin_id',
                foreignField: 'admin_id',
                as: 'tripsDetails'
            }
        }, {
            $project: {
                _id: 0,
            }
        },
        ];
        query.selectWithAnd(dbConstants.dbSchema.admins, {}, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            done(null, response)
        });
    }
};

/*
 *  Used to get getVehiclePrice with params
 * @param {Function} done - Callback function with error, data params
 */
// const checkEmailExist = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.admins, requestParam, function(error, admin) {
//         if (error) {
//             logger('Error: can not get admin', dbConstants.dbSchema.admins);
//             done(error, null);
//             return;
//         }
//         if (admin == null) {
//             done(null, errors.customError('Not Exists.', '1', 'Not exists', true));
//         } else {
//             done(null, errors.customError('Already exists.', '0', 'exists', true));
//         }
//     });
// };

/*
 * Used to create admin & signup & send-mail
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createAdmin = function (req, requestParam, done) {
    console.log("requestParam-----", requestParam)
    let columnAndValues = {};

     // Set default status if not provided
     if (!requestParam.status) {
        requestParam.status = "Pending"; // Default value
    }

    requestParam.role = requestParam.is_superuser ? "admin" : "user";
    if (requestParam.email && requestParam.mobile) {
        columnAndValues['$or'] = [{
            email: requestParam.email,
        }, {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    } else if (requestParam.email) {
        columnAndValues['$or'] = [{
            email: requestParam.email,
        }];
    } else if (requestParam.mobile) {
        columnAndValues['$or'] = [{
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    }
    passwordHandler.newHash(requestParam.password, (hashedPW) => {
        requestParam.password = hashedPW;
        console.log("requestParam", requestParam);
        query.insertSingle(dbConstants.dbSchema.admins, requestParam, function (error, admin) {
            if (error) {
                logger('Error: while creating admin', errors.errorWithMessage(error));
                done(errors.internalServer(true), null);
                return;
            }
            if (admin) {
                done(null, [{ code: '1' }]);
            } else {

                // commonHandler.sendEmail({ email: requestParam.email, code: 'DSU', language_code: 'EN' }, (error, response) => {
                //     if (error == 500) {
                //         logger('Error: while sending email.');
                //         done(errors.internalServer(true), null);
                //         return;
                //     }

                //     if (error == 404) {
                //         logger('Error: template not get');
                //         done(errors.emailTemplateNotExist(true), null);
                //         return;
                //     }
                //     done(null, [{ code: '1' }]);
                //     //done(null, customer);
                // });
                done(null, [{ code: '1' }]);
            }
        });
    });
};

// const loginAdmin = function(req, requestParam, done) {
//     // passwordHandler.newHash(requestParam.password, (hashedPW) => {
//     //     requestParam.password = hashedPW;
//     // });
//     let columnAndValues = {};
//     if (requestParam.email && requestParam.mobile) {
//         columnAndValues['$or'] = [{
//             email: requestParam.email,
//         }, {
//             mobile: requestParam.mobile,
//             mobile_country_code: requestParam.mobile_country_code,
//         }];
//     } else if (requestParam.email) {
//         columnAndValues['$or'] = [{
//             email: requestParam.email,
//         }];
//     } else if (requestParam.mobile) {
//         columnAndValues['$or'] = [{
//             mobile: requestParam.mobile,
//             mobile_country_code: requestParam.mobile_country_code,
//         }];
//     }
//     checkEmailExist(columnAndValues, async(err, emailExist) => {
//         if (emailExist.code == '0') {
//             done(null, [{
//                 code: '0'
//             }]);
//         } else {
//             console.log("requestParam", requestParam);
//             query.insertSingle(dbConstants.dbSchema.admins, requestParam, function(error, admin) {
//                 if (error) {
//                     logger('Error: while creating admin', errors.errorWithMessage(error));
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 if(admin){
//                     done(null, [{ code: '1' }]);
//                 }else{
//                 // commonHandler.sendEmail({ email: requestParam.email, code: 'DSU', language_code: 'EN' }, (error, response) => {
//                 //     if (error == 500) {
//                 //         logger('Error: while sending email.');
//                 //         done(errors.internalServer(true), null);
//                 //         return;
//                 //     }

//                 //     if (error == 404) {
//                 //         logger('Error: template not get');
//                 //         done(errors.emailTemplateNotExist(true), null);
//                 //         return;
//                 //     }
//                 //     done(null, [{ code: '1' }]);
//                 //     //done(null, customer);
//                 // });
//                 done(null, [{
//                     code: '1'
//                 }]);}
//             });
//         }
//     });
// };

/*
 * Used to create admin & signup & send-mail
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const driverRegister = function (requestParam, req, done) {
    requestParam.nric_front = getImageNameFromURL(requestParam.nric_front)
    requestParam.nric_back = getImageNameFromURL(requestParam.nric_back)
    requestParam.profile_picture = getImageNameFromURL(requestParam.profile_picture)
    requestParam.driver_license = getImageNameFromURL(requestParam.driver_license)
    requestParam.driver_license_back = getImageNameFromURL(requestParam.driver_license_back)
    let columnAndValues = {};
    if (requestParam.email && requestParam.mobile) {
        columnAndValues['$or'] = [{
            email: requestParam.email
        }, {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    } else if (requestParam.email) {
        columnAndValues['$or'] = [{
            email: requestParam.email
        }];
    } else if (requestParam.mobile) {
        columnAndValues['$or'] = [{
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    }
    query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: requestParam.language_id }, (error, language) => {
        query.selectWithAndOne(dbConstants.dbSchema.admins, columnAndValues, (error, isUserExist) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
                done(errors.internalServer(true), null);
                return;
            }

            if (isUserExist && !_.isEmpty(columnAndValues)) {
                console.log(isUserExist.is_archive);
                if (isUserExist.is_archive == 'true') {
                    logger('Error: account is archived by admin');
                    done(errors.archivedUser(true), null);
                    return;
                }
                logger('Error: admin already exist.');
                done(errors.duplicateUser(true), null);
                return;
            } else {
                const vehicle_id = 'VID' + Math.floor(Math.random() * 8999 + 10000);
                requestParam.vehicles = [{
                    vehicle_id: vehicle_id,
                    vehicle_type_id: requestParam.vehicle_type_id,
                    vehicle_number: requestParam.vehicle_number,
                    vehicle_brandormodel: requestParam.vehicle_brandormodel || '',
                    road_tax: getImageNameFromURL(requestParam.road_tax),
                    insurance_photo: getImageNameFromURL(requestParam.insurance_photo),
                    vehicle_photo_front: getImageNameFromURL(requestParam.vehicle_photo_front),
                    vehicle_photo_rear: getImageNameFromURL(requestParam.vehicle_photo_rear),
                    vehicle_photo_right: getImageNameFromURL(requestParam.vehicle_photo_right),
                    vehicle_photo_left: getImageNameFromURL(requestParam.vehicle_photo_left),
                    status: 'Active',
                    is_default: true
                }];
                // requestParam.package_expiry_date = moment().format("YYYY-MM-DD HH:mm:ss");
                query.insertSingle(dbConstants.dbSchema.admins, requestParam, function (error, admin) {
                    admin.nric_front = generateFullURL(admin.nric_front)
                    admin.nric_back = generateFullURL(admin.nric_back)
                    admin.profile_picture = generateFullURL(admin.profile_picture)
                    admin.driver_license = generateFullURL(admin.driver_license)
                    admin.driver_license_back = generateFullURL(admin.driver_license_back)
                    admin.vehicles[0].insurance_photo = generateFullURL(admin.vehicles[0].insurance_photo)
                    admin.vehicles[0].vehicle_photo_front = generateFullURL(admin.vehicles[0].vehicle_photo_front)
                    admin.vehicles[0].vehicle_photo_rear = generateFullURL(admin.vehicles[0].vehicle_photo_rear)
                    admin.vehicles[0].vehicle_photo_left = generateFullURL(admin.vehicles[0].vehicle_photo_left)
                    admin.vehicles[0].vehicle_photo_right = generateFullURL(admin.vehicles[0].vehicle_photo_right)
                    if (error) {
                        logger('Error: while creating admin', errors.errorWithMessage(error));
                        done(errors.internalServer(true), null);
                        return;
                    }

                    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
                        if (!setting || error) {
                            done(errors.resourceNotFound(true), null);
                            return;
                        }
                        query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
                            code: 'DSU'
                        }, (error, template) => {
                            if (!template || error) {
                                done(errors.resourceNotFound(true), null);
                                return;
                            }
                            let findArr = ['#FACEBOOK#', '#TWITTER#', '#LINKEDIN#', '#PINTEREST#', '#INSTAGRAM#', '#ADDRESS#'];
                            let replaceArr = [setting.fb_url, setting.twitter_url, setting.linkedin_url, setting.pinterest_url, setting.instagram_url, setting.address];
                            let emailtemplate = template.description[language.code];
                            const data = {
                                from: template.from_email,
                                to: admin.email,
                                subject: template.email_subject,
                                html: (findArr.length > 0) ? replaceOnce(emailtemplate, findArr, replaceArr, 'gi') : emailtemplate,
                            };

                            const params = {
                                Destination: {
                                    ToAddresses: [data.to]
                                },
                                Message: {
                                    Body: {
                                        Html: {
                                            Charset: 'UTF-8',
                                            Data: data.html
                                        }
                                    },
                                    Subject: {
                                        Charset: 'UTF-8',
                                        Data: data.subject
                                    }
                                },
                                ReturnPath: data.from,
                                Source: data.from,
                            };
                            commonHandler.sendEmailToUser(data, (err, data) => {
                                if (err) {
                                    console.log(err, err.stack);
                                } else {
                                    admin = JSON.parse(JSON.stringify(admin));
                                    admin.earned = 0;
                                    const otp = Math.floor(Math.random() * 8999 + 1000);
                                    query.updateSingle(dbConstants.dbSchema.admins, { otp: otp }, { admin_id: admin.admin_id }, (err, updatedDriver) => {

                                        getDriverRating({ admin_id: admin.admin_id, date: moment() }, (error, driverRating) => {
                                            if (!admin.profile_picture || admin.profile_picture == '') {
                                                admin.profile_picture = fullUrl + '/upload/admin/avatar.jpg';
                                            }
                                            let columnsAndValuesDriver = {
                                                admin_id: admin.admin_id,
                                                first_name: admin.first_name,
                                                last_name: admin.last_name,
                                                email: admin.email,
                                                mobile: admin.mobile,
                                                mobile_country_code: admin.mobile_country_code,
                                                rating: driverRating.rating,
                                                earned: setting.currency + driverRating.earned,
                                                profile_picture: admin.profile_picture,
                                                is_bank_detail: admin.is_bank_detail,
                                                status: admin.status,
                                                otp: otp.toString()
                                            }
                                            done(null, columnsAndValuesDriver);
                                            return
                                        })
                                    })
                                }

                            });

                            // awsSES.sendEmail(params, (err, data) => {
                            //     if (err) {
                            //      console.log(err, err.stack);
                            //     } else {
                            //         admin = JSON.parse(JSON.stringify(admin));
                            //         admin.earned = 0;
                            //         const otp = Math.floor(Math.random() * 8999 + 1000);
                            //         query.updateSingle(dbConstants.dbSchema.admins, { otp: otp }, { admin_id: admin.admin_id }, (err, updatedDriver) => {

                            //             getDriverRating({ admin_id: admin.admin_id, date: moment() }, (error, driverRating) => {
                            //                 if (!admin.profile_picture || admin.profile_picture == '') {
                            //                     admin.profile_picture = fullUrl + '/upload/admin/avatar.jpg';
                            //                 }
                            //                 let columnsAndValuesDriver = {
                            //                     admin_id: admin.admin_id,
                            //                     first_name: admin.first_name,
                            //                     last_name: admin.last_name,
                            //                     email: admin.email,
                            //                     mobile: admin.mobile,
                            //                     mobile_country_code: admin.mobile_country_code,
                            //                     rating: driverRating.rating,
                            //                     earned: setting.currency + driverRating.earned,
                            //                     profile_picture: admin.profile_picture,
                            //                     is_bank_detail: admin.is_bank_detail,
                            //                     status: admin.status,
                            //                     otp: otp.toString()
                            //                 }
                            //                 done(null, columnsAndValuesDriver);
                            //                 return
                            //             })
                            //         })
                            //     }
                            //     //return;
                            // });
                            /*mailgun.messages().send(data, function(error, body) {
                                admin = JSON.parse(JSON.stringify(admin));
                                admin.earned = 0;
                                const otp = Math.floor(Math.random() * 8999 + 1000);
                                query.updateSingle(dbConstants.dbSchema.admins, { otp: otp }, { admin_id: admin.admin_id }, (err, updatedDriver) => {

                                    getDriverRating({ admin_id: admin.admin_id, date: moment() }, (error, driverRating) => {
                                        if (!admin.profile_picture || admin.profile_picture == '') {
                                            admin.profile_picture = fullUrl + '/upload/admin/avatar.jpg';
                                        }
                                        let columnsAndValuesDriver = {
                                            admin_id: admin.admin_id,
                                            first_name: admin.first_name,
                                            last_name: admin.last_name,
                                            email: admin.email,
                                            mobile: admin.mobile,
                                            mobile_country_code: admin.mobile_country_code,
                                            rating: driverRating.rating,
                                            earned: setting.currency + driverRating.earned,
                                            profile_picture: admin.profile_picture,
                                            is_bank_detail: admin.is_bank_detail,
                                            status: admin.status,
                                            otp: otp.toString()
                                        }
                                        done(null, columnsAndValuesDriver);
                                        return
                                    })
                                })

                                // done(null, admin);
                            });*/
                        });
                    });
                });
            }
        });
    });
};


/*
 * Used to authenticate admin
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const authentication = async function (requestParam, req, done) {
    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, function (error, setting) {
        // const fullUrl = req.protocol + '://' + req.get('host');
        const comparisonColumnsAndValues = {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code
        };
        getDriverPost(comparisonColumnsAndValues, (err, rows) => {
            if (err) {
                logger("Error getting admin" + err);
                done(errors.internalServer(true), null);
            }
            console.log("--------------rows", rows)
            if (!rows || rows.length === 0) {
                logger("Error: admin not exists with this mobile no");
                done(errors.unauthorizedAccess(true), null);
            } else {
                if (rows[0].status == driverConstants.status.active) {
                    if (rows[0].password === requestParam.password) {

                        let access_token = token.generateToken({ user_id: rows[0].id });
                        let response = { access_token: access_token, user_id: rows[0].id };
                        done(null, response);

                    } else {
                        done(errors.invalidPassword(true), null);
                        return;
                    }

                } else {
                    if (rows[0].status == driverConstants.status.banned) {
                        if (rows[0].is_archive == 'true') {
                            logger('Error: account is archived by admin');
                            done(errors.archivedUser(true), null);
                            return;
                        }
                        done(errors.customError('Your account is banned. Please contact to administrator.', '203', 'Banned', true), null);
                        return;
                    }
                    if (rows[0].is_archive == 'true') {
                        logger('Error: account is archived by admin');
                        done(errors.archivedUser(true), null);
                        return;
                    }
                    done(errors.customError('Your account is not acivate. Please contact to administrator.', '201', 'Not activate', true), null);
                    return;
                }
            }
        });
    });
};

const authenticationWeb = async function (req, requestParam, done) {
    console.log("--------------requestParam", requestParam);
    
    let responseSent = false; // Flag to check if a response has been sent

    // Check if the credentials match the super admin
    const isSuperAdmin = requestParam.username === config.SUPER_ADMIN_EMAIL &&
                         requestParam.password === config.SUPER_ADMIN_PASSWORD;

    if (isSuperAdmin) {
        // Check if the super admin already exists
        const superAdminExists = await Admin.findOne({ email: config.SUPER_ADMIN_EMAIL });

        if (!superAdminExists) {
            // Create the super admin record
            passwordHandler.newHash(config.SUPER_ADMIN_PASSWORD, async (hashedPassword) => {
                const superAdmin = new Admin({
                    email: config.SUPER_ADMIN_EMAIL,
                    password: hashedPassword,
                    role: config.ROLE_ID,
                    first_name: config.ADMIN_FIRST_NAME,
                    last_name: config.ADMIN_LAST_NAME,
                    status: 'Pending'
                });

                // Save the new super admin to the database
                try {
                    await superAdmin.save();
                    console.log("Super admin created successfully.");

                    // Generate token for super admin
                    let access_token = token.generateToken({ user_id: config.ADMIN_ID });
                    let response = {
                        access_token: access_token,
                        user_id: config.ADMIN_ID,
                        user_type: 'admin'
                    };

                    if (!responseSent) {
                        responseSent = true; // Mark response as sent
                        done(null, response);
                    }
                } catch (saveError) {
                    console.error("Error saving super admin", saveError);
                    if (!responseSent) {
                        responseSent = true; // Mark response as sent
                        done(errors.internalServer(true), null);
                    }
                }
            });
            return; // Exit to prevent further execution
        } else {
            console.log("Super admin already exists.");

            // Generate token for super admin
            let access_token = token.generateToken({ user_id: config.ADMIN_ID });
            let response = {
                access_token: access_token,
                user_id: config.ADMIN_ID,
                user_type: 'admin'
            };
            if (!responseSent) {
                responseSent = true; // Mark response as sent
                done(null, response);
            }
            return; // Exit to prevent further execution
        }
    }

    const comparisonColumnsAndValues = {
        email: requestParam.username,
    };

    // Assuming getDriverPost is defined elsewhere
    getDriverPost(comparisonColumnsAndValues, (err, rows) => {
        console.log("--------------err", err);
        if (err) {
            console.error("Error getting admin", err);
            if (!responseSent) {
                responseSent = true; // Mark response as sent
                done(errors.internalServer(true), null);
            }
            return;
        }

        console.log("--------------rows", rows);
        if (!rows || rows.length === 0) {
            console.log("Error: admin not exists with this mobile no");
            if (!responseSent) {
                responseSent = true; // Mark response as sent
                done(errors.unauthorizedAccess(true), null);
            }
            return;
        } else {
            console.log("requestParam.password", requestParam.password);
            console.log(rows[0].password);
            passwordHandler.verify(requestParam.password, rows[0].password, (adminObj) => {
                if (adminObj) {
                    let access_token = token.generateToken({ user_id: rows[0].id });
                    let response = {
                        access_token: access_token,
                        user_id: rows[0].id,
                        user_type: rows[0].role
                    };
                    if (!responseSent) {
                        responseSent = true; // Mark response as sent
                        done(null, response);
                    }
                } else {
                    // Check account status and handle errors...
                    // [Your error handling logic]
                }
            });
        }
    });
};

// const sendOTP = function(requestParam, admin, otp, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: admin[0].language_id }, function(error, language) {
//         query.selectWithAndOne(dbConstants.dbSchema.sms_templates, { code: 'SEND_OTP' }, function(error, sms) {
//             if (error) {
//                 logger('Error: can not get sms', dbConstants.dbSchema.sms_templates);
//                 done(error, null);
//                 return;
//             }
//             if (!sms) {
//                 done(errors.resourceNotFound(true), null);
//                 return;
//             }
//             let message = sms.value[language.code];
//             message = message.replace('#OTP#', otp);
//             client.messages.create({
//                     body: message,
//                     to: requestParam.mobile_country_code + requestParam.mobile,
//                     from: config.twilio.mobileNo
//                 })
//                 .then((message) => {
//                     console.log('Send otp text msg ',message.accountSid);
//                     return false;
//                 }).catch((err)=>{
//                     console.log('Text msg Error:-',err)
//                 });
//         });
//     });
// }

/*
 * Retrieves the details of get admins
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const getDriverPost = (comparisonColumnsAndValues, done) => {
    console.log("comparisonColumnsAndValues", comparisonColumnsAndValues)
    query.selectWithAnd(dbConstants.dbSchema.admins, comparisonColumnsAndValues, function (error, admins) {
        console.log("comparisonColumnsAndValues------", dbConstants.dbSchema.admins)
        if (error) {
            logger('Error: can not get admins', dbConstants.dbSchema.admins);
            done(error, null);
            return;
        }
        done(null, admins);
    });
};

/*
 * Retrieves the details of get admin profile
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const getDriverProfile = (comparisonColumnsAndValues, req, done) => {
    const fullUrl = req.protocol + '://' + req.get('host');
    query.selectWithAnd(dbConstants.dbSchema.admins, comparisonColumnsAndValues, function (error, admins) {
        query.selectWithAndOne(dbConstants.dbSchema.settings, async function (error, setting) {
            if (error) {
                logger('Error: can not get admins', dbConstants.dbSchema.admins);
                done(error, null);
                return;
            }
            if (admins.length == 0) {
                done(null, errors.customError('Admin not exist with this admin_id.', '2', 'Not exists', true));
                return;
            }
            // if (!admins[0].profile_picture) {
            //     admins[0].profile_picture = fullUrl + '/upload/admin/avatar.jpg';
            // }
            // if (!admins[0].current_balance) {
            //     admins[0].current_balance = '0';
            // } else if (isNaN(admins[0].current_balance)) {
            //     const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: comparisonColumnsAndValues.admin_id }, { _id: 0 }, {})
            //     const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
            //     const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
            //     const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
            //     const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
            //     const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
            //     admins[0].current_balance = finalBalance
            // } 

            let columnsAndValues = {
                email: admins[0].email,
                is_active: true,
                is_superuser: false,
                full_name: admins[0].first_name + " " + admins[0].last_name,
                admin_id: admins[0].id,
            }


            done(null, columnsAndValues);
            // });
        });
    });
};

/*
 * Retrieves the details of get admin
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
// const getDriverRating = (requestParam, done) => {
//     console.log("method call=>" + JSON.stringify(requestParam))
//     let columnsAndValueTripDriver = {
//         admin_id: requestParam.admin_id,
//         status: 'Accept'
//     }
//     let count = 0;
//     let customerCount = 0;
//     let rating = 0;
//     let customer_ratting = 0;
//     let totalEarned = 0;
//     let todayEarned = 0;
//     let columnAndValues = {
//         admin_id: requestParam.admin_id,
//         status: 'Complete'
//     }
//     //for current day rating of admin
//     if (requestParam.date) {
//         let date = moment().format('YYYY-MM-DD');
//         let startDate = new Date(date + 'T00:00:00.000');
//         let endDate = new Date(date + 'T23:59:00.000');
//         columnAndValues.finish_time = {
//             $gte: startDate,
//             $lte: endDate,
//         }
//     }
//     console.log("columnAndValues=>" + JSON.stringify(columnAndValues))
//     query.selectWithAnd(dbConstants.dbSchema.trips, columnAndValues, function(error, trips) {
//         // console.log("trips=>" + JSON.stringify(trips))
//         async.forEachSeries(trips, function(singleTrip, Callback_s1) {

//             if (!singleTrip.consumer2driver_rating || singleTrip.consumer2driver_rating == null || singleTrip.consumer2driver_rating == '') {
//                 singleTrip.consumer2driver_rating = '0';
//             }
//             if (!singleTrip.driver2consumer_rating || singleTrip.driver2consumer_rating == null || singleTrip.driver2consumer_rating == '') {
//                 singleTrip.driver2consumer_rating = '0';
//             }
//             if (singleTrip.consumer2driver_rating != 0) {
//                 count++;
//             }
//             if (singleTrip.driver2consumer_rating != 0) {
//                 customerCount++;
//             }

//             // console.log("count=>" + count)
//             rating = parseFloat(rating) + parseFloat(singleTrip.consumer2driver_rating);
//             // console.log("ratting=>" + rating)
//             customer_ratting = parseFloat(customer_ratting) + parseFloat(singleTrip.driver2consumer_rating)
//                 // FOR EARNED
//             if (!singleTrip.fetch_deduct_amount) {
//                 singleTrip.fetch_deduct_amount = 0;
//             }
//             let totalPrice = singleTrip.total_price.replace(/^\D+/g, '');
//             let driverEarn = parseFloat(totalPrice) - parseFloat(singleTrip.fetch_deduct_amount);
//             totalEarned = totalEarned + driverEarn;
//             if (moment(singleTrip.finish_time).format("YYYY-MM-DD") === moment().format("YYYY-MM-DD")) {
//                 todayEarned = todayEarned + driverEarn;
//             }
//             // END FOR EARNED 
//             Callback_s1();
//         }, function() {
//             let driverRating
//             let customerRating
//             if (count == 0) {

//                 driverRating = 0;
//             } else {
//                 driverRating = parseFloat(rating / count);

//             }
//             if (customer_ratting == 0) {

//                 customerRating = 0;
//             } else {
//                 customerRating = parseFloat(customer_ratting / customerCount);

//             }
//             console.log("driverRating=>" + driverRating)
//             done(null, { rating: parseFloat(driverRating).toFixed(2), earned: parseFloat(totalEarned).toFixed(2), todayEarned: parseFloat(todayEarned).toFixed(2), customerRating: parseFloat(customerRating).toFixed(2) });
//             return
//         });
//     });
// };

// const getConsumerRating = (requestParam, done) => {

//     let columnsAndValueTripDriver = {
//         haribhagat_id: requestParam.haribhagat_id,
//         status: 'Accept'
//     }
//     let count = 0;
//     let customerCount = 0;
//     let rating = 0;
//     let customer_ratting = 0;
//     let totalEarned = 0;
//     let columnAndValues = {
//         haribhagat_id: requestParam.haribhagat_id,
//         status: 'Complete'
//     }
//     if (requestParam.date) {
//         let date = moment().format('YYYY-MM-DD');
//         console.log(date)
//         let startDate = new Date(date + 'T00:00:00.000Z');
//         let endDate = new Date(date + 'T23:59:00.000Z');
//         columnAndValues.finish_time = {
//             $gte: startDate,
//             $lte: endDate,
//         }
//     }

//     query.selectWithAnd(dbConstants.dbSchema.trips, columnAndValues, function(error, trips) {

//         async.forEachSeries(trips, function(singleTrip, Callback_s1) {

//             if (!singleTrip.consumer2driver_rating || singleTrip.consumer2driver_rating == null || singleTrip.consumer2driver_rating == '') {
//                 singleTrip.consumer2driver_rating = '0';
//             }
//             if (!singleTrip.driver2consumer_rating || singleTrip.driver2consumer_rating == null || singleTrip.driver2consumer_rating == '') {
//                 singleTrip.driver2consumer_rating = '0';
//             }
//             if (singleTrip.consumer2driver_rating != 0) {
//                 count++;
//             }
//             if (singleTrip.driver2consumer_rating != 0) {
//                 customerCount++;
//             }


//             rating = parseFloat(rating) + parseFloat(singleTrip.consumer2driver_rating);

//             customer_ratting = parseFloat(customer_ratting) + parseFloat(singleTrip.driver2consumer_rating)
//                 // FOR EARNED
//             if (!singleTrip.fetch_deduct_amount) {
//                 singleTrip.fetch_deduct_amount = 0;
//             }
//             let totalPrice = singleTrip.total_price.replace(/^\D+/g, '');
//             let driverEarn = parseFloat(totalPrice) - parseFloat(singleTrip.fetch_deduct_amount);
//             totalEarned = totalEarned + driverEarn;
//             // END FOR EARNED 
//             Callback_s1();
//         }, function() {
//             let driverRating
//             let customerRating
//             if (count == 0) {

//                 driverRating = 0;
//             } else {
//                 driverRating = parseFloat(rating / count);

//             }
//             if (customer_ratting == 0) {

//                 customerRating = 0;
//             } else {
//                 customerRating = parseFloat(customer_ratting / customerCount);

//             }

//             done(null, { rating: parseFloat(driverRating).toFixed(2), earned: parseFloat(totalEarned).toFixed(2), customerRating: parseFloat(customerRating).toFixed(2) });
//             return
//         });
//     });
// };

const updateUserSettings = async (req, res) => {
    console.log("req----", req.body)
    const { id, pdfViewPreference } = req;

    if (!id) {
        return res.status(400).send('User ID is required.');
    }

    if (!['table', 'grid'].includes(pdfViewPreference)) {
        return res.status(400).send('Invalid PDF view preference');
    }

    try {
        await Admin.findOneAndUpdate(
            { id },
            { pdfViewPreference },
            { new: true, upsert: true }
        );
        res.status(200).send('Settings updated successfully');
    } catch (error) {
        res.status(500).send('Error updating settings');
    }
};

/*
 * Retrieves the details of get admin
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const updateDriverProfile = (requestParam, req, done) => {
    const fullUrl = req.protocol + '://' + req.get('host');

    let columnAndValues = {};
    if (requestParam.email && requestParam.mobile) {
        columnAndValues['$or'] = [{
            email: requestParam.email,
        }, {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    } else if (requestParam.email) {
        columnAndValues['$or'] = [{
            email: requestParam.email,
        }];
    } else if (requestParam.mobile) {
        columnAndValues['$or'] = [{
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    }
    query.selectWithAndOne(dbConstants.dbSchema.admins, {
        $and: [{
            $or: [{
                id: {
                    $ne: requestParam.id,
                },
            }],
        },
            columnAndValues,
        ],
    }, (error, isDriverExist) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.admins);
            done(errors.internalServer(true), null);
            return;
        }
        if (isDriverExist && !_.isEmpty(columnAndValues)) {
            done(errors.duplicateUser(true), null);
            return;
        }
        query.updateSingle(dbConstants.dbSchema.admins, requestParam, {
            id: requestParam.id
        }, function (error, admins) {
            if (error) {
                logger('Error: can not update admins');
                done(error, null);
                return;
            }
            console.log("id----",requestParam.id)
            query.selectWithAnd(dbConstants.dbSchema.admins, { id: requestParam.id }, function (error, admins) {
                if (error) {
                    logger('Error: can not get admins');
                    done(error, null);
                    return;
                }
                // if (!admins[0].profile_picture) {
                //     admins[0].profile_picture = fullUrl + '/upload/admin/avatar.jpg';

                // }
                // else {
                //     let bucket = bucketNameProfile;
                //     admins[0].profile_picture = generateFullURL(admins[0].profile_picture)

                // }
                let columnsAndValues = {
                    id: admins[0].id,
                    first_name: admins[0].first_name,
                    last_name: admins[0].last_name,
                    email: admins[0].email,
                    mobile: admins[0].mobile,
                    mobile_country_code: admins[0].mobile_country_code,
                    // profile_picture: admins[0].profile_picture,
                    status: admins[0].status
                }
                done(null, columnsAndValues);
            });
        });
    });
};

/*
 * Retrieves the details of get admin
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const updateDriver = (requestParam, done) => {
    let columnAndValues = [];

    console.log("Request Params:", requestParam); // Log the request parameters
    // if (!requestParam.status) {
    //     requestParam.status = "Pending"; // Default value
    // }
    requestParam.status = requestParam.is_active ? "Active" : "Inactive"; 
    // Set role based on is_superuser status
    // requestParam.role = requestParam.is_superuser ? "admin" : "user"; // Set role to admin if is_superuser is true, otherwise set to user

    if (requestParam.email) {
        columnAndValues.push({ email: requestParam.email });
    }
    if (requestParam.mobile) {
        columnAndValues.push({
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code
        });
    }

    if (columnAndValues.length > 0) {
        query.selectWithAndOne(dbConstants.dbSchema.admins, {
            $and: [
                { admin_id: { $ne: requestParam.id } }, // Exclude current record
                { $or: columnAndValues }
            ]
        }, (error, isDriverExist) => {
            if (error) {
                console.error('Database Query Error:', error);
                done(errors.internalServer(true), null);
                return;
            }

            if (!isDriverExist) {
                console.warn("Warning: Duplicate driver exists, but continuing with update.");
            }

            // Call to update the admin record after checking for duplicates
           updateAdminRecord(requestParam);
        });
    } else {
        updateAdminRecord(requestParam);
    }
    function updateAdminRecord(requestParam) {
        // Check if the password is provided
        console.log("---------requestParam", requestParam.password);
        // Prepare the update object
        const updateData = { ...requestParam };
        console.log("---------updateData", updateData);
        // If the password is provided, hash it
        if (requestParam.password) {
            passwordHandler.newHash(requestParam.password, (hashedPW) => {
                updateData.password = hashedPW; // Set the hashed password
                console.log("Hashed password", updateData.password);
                // Update the admin record in the database with the hashed password
                query.updateSingle(dbConstants.dbSchema.admins, updateData, { _id: requestParam._id }, (error, admin) => {
                    if (error) {
                        done(error, null); // Handle database update error
                        return;
                    }
                    done(null, admin); // Send response with the updated admin record
                });
            });
        } else {
            // If the password is not provided, update the admin record without changing the password
            console.log("Password is null. Updating admin record without changing the password.");
            // Remove password from update data to prevent it from being updated
            delete updateData.password;
            // Update the admin record in the database without changing the password
            query.updateSingle(dbConstants.dbSchema.admins, updateData, { _id: requestParam._id }, (error, admin) => {
                if (error) {
                    done(error, null); // Handle database update error
                    return;
                }
                done(null, admin); // Send response with the updated admin record
            });
        }
    }     
};

/*
 * Used to admin change password
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const changePassword = function (requestParam, done) {
    const comparisonColumnsAndValues = {
        id: requestParam.id
    };
    getDriverPost(comparisonColumnsAndValues, (err, rows) => {
        // console.log("rows------",rows)
        if (err) {
            logger("Error getting admin" + err);
            done(errors.internalServer(true), null);
        }
        if (!rows || rows.length === 0) {
            logger("Error: doesn't exists admin with this admin_id");
            done(errors.unauthorizedAccess(true), null);
        } else {
            passwordHandler.verify(requestParam.current_password, rows[0].password, (driverObj) => {
                if (driverObj == false) {
                    done(errors.invalidPassword(true), null);
                } else {
                    passwordHandler.newHash(requestParam.new_password, (hashedPW) => {
                        requestParam.new_password = hashedPW;
                        let columnsAndValues = {
                            id: requestParam.id,
                            password: requestParam.new_password
                        }
                        query.updateSingle(dbConstants.dbSchema.admins, columnsAndValues, {
                            id: requestParam.id
                        }, function (error, driverUpdate) {
                            done(null, errors.customError('Passsword has been changed.', '1', 'Success', true));
                        });
                    });
                }
            });
        }
    });
};


/*
 * Used to reset password of admin 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const forgotpassword = function (requestParam, req, done) {
    query.selectWithAnd(dbConstants.dbSchema.admins, requestParam, function (error, admin) {
        if (error) {
            logger('Error: can not sent email to admin');
            done(error, null);
            return;
        }
        if (admin.length > 0) {
            const length = 6;
            const code = 'DRI' + Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
            let fullUrl = req.protocol + '://' + req.get('host');
            const link = fullUrl + '/resetpassword.html?code=' + code;
            let emailtemplate;
            emailtemplate = fs.readFileSync('./public/forgotpassword.html', "utf8");
            emailtemplate = emailtemplate.replace('#NAME#', admin[0].first_name + " " + admin[0].last_name);
            emailtemplate = emailtemplate.replace('#EMAIL#', admin[0].email);
            emailtemplate = emailtemplate.replace("#LINK#", link);
            const data = {
                from: mailConstants.forgot_password.from,
                to: admin[0].email,
                subject: mailConstants.forgot_password.reset,
                html: emailtemplate
            };
            const params = {
                Destination: {
                    ToAddresses: [data.to]
                },
                Message: {
                    Body: {
                        Html: {
                            Charset: 'UTF-8',
                            Data: data.html
                        }
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: data.subject
                    }
                },
                ReturnPath: data.from,
                Source: data.from,
            };
            commonHandler.sendEmailToUser(data, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                    done(errors.cannotSendEmail(true), null);
                    return;
                } else {
                    query.updateSingle(dbConstants.dbSchema.admins, {
                        code: code
                    }, {
                        admin_id: admin[0].admin_id
                    }, function (error, providerUpdate) {
                        done(null, errors.customError('We have sent you link to your email address.', '1', 'Success', true));
                    });
                }
                return;
            })

            // awsSES.sendEmail(params, (err, data) => {
            //     if (err) {
            //      console.log(err, err.stack);
            //     } else {
            //         query.updateSingle(dbConstants.dbSchema.admins, {
            //             code: code
            //         }, {
            //             admin_id: admin[0].admin_id
            //         }, function(error, providerUpdate) {
            //             done(null, errors.customError('We have sent you link to your email address.', '1', 'Success', true));
            //         });
            //     }
            //     //done(null, {});
            //     return;
            // });
            /*mailgun.messages().send(data, function(error, body) {
                console.log(body)
                query.updateSingle(dbConstants.dbSchema.admins, {
                    code: code
                }, {
                    admin_id: admin[0].admin_id
                }, function(error, providerUpdate) {
                    done(null, errors.customError('We have sent you link to youe email address.', '1', 'Success', true));
                });
            });*/

        } else {
            done(errors.unauthorizedAccess(true), null);
        }
    });
};

/*
 * Used to delete admin by id 
 * @param {driverDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteAccount = function (driverDetails, done) {
    console.log("driverDetails----",driverDetails)
    query.removeMultiple(dbConstants.dbSchema.admins, {'admin_id': { $in: driverDetails.id}}, function (error, admin) {
        if (error) {
            logger('Error: can not delete admin');
            done(error, null);
            return;
        }
        done(null, errors.customError('Account deleted.', '1', 'Success', true));
    });
};

/*
 * Used to update notification status admin by id 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const notificationStatus = function(requestParam, done) {
//     let columnsAndValuesUpdate;
//     if (requestParam.type == 'notification') {
//         columnsAndValuesUpdate = {
//             notification: requestParam.status
//         }
//     } else {
//         columnsAndValuesUpdate = {
//             online_status: requestParam.status
//         }
//     }
//     query.updateSingle(dbConstants.dbSchema.admins, columnsAndValuesUpdate, {
//         admin_id: requestParam.admin_id
//     }, function(error, admin) {
//         if (error) {
//             logger('Error: can not update admins');
//             done(error, null);
//             return;
//         }
//         //done(null, 'Record Updated Successfully.');
//         query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
//             query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, admin) => {
//                 if (error) {
//                     logger('Error: can not get ', dbConstants.dbSchema.admins);
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 if (!admin) {
//                     done(errors.driverNotFound(true), null);
//                     return;
//                 }
//                 getDriverRating({ admin_id: requestParam.admin_id, date: moment() }, (err, driverRating) => {
//                     let obj = {
//                         online_status: admin.online_status,
//                         notification: admin.notification,
//                         rating: driverRating.rating,
//                         earned: setting.currency +' '+parseInt(driverRating.earned)
//                     }
//                     console.log('obj------',obj)
//                     done(null, obj);
//                 });
//                 if(requestParam.type === "online_offline" && requestParam.status === "On"){
//                     query.selectWithAndOne(dbConstants.dbSchema.settings,{},function (error, setting) {
//                         const p8FilePath = config.push_notification.p8FilePath;
//                         const options = {
//                             token: {
//                                 key: p8FilePath,
//                                 keyId: config.push_notification.key_id,
//                                 teamId: config.push_notification.team_id
//                             },
//                             production: setting.is_production //false
//                         };
//                         const apnProvider = new apn.Provider(options);
//                         // end of code for ios push notification

//                         // code for android push notification
//                         const serverKey = config.push_notification.server_key; //put your server key here
//                         const fcm = new FCM(serverKey);
//                         const columnAndValueTrip={
//                             status:'New'
//                         }
//                         query.selectWithAnd(dbConstants.dbSchema.trips,columnAndValueTrip,function (error, trip) {
//                             if (error) {
//                                 logger('Error: can not get ', dbConstants.dbSchema.trips);
//                                 done(errors.internalServer(true), null);
//                                 return;
//                             }
//                             if(trip.length>0){
//                                 _.each(trip, function(singleTrip) {
//                                     const tripData = JSON.parse(JSON.stringify(singleTrip))
//                                     query.selectWithAndOne(dbConstants.dbSchema.admins,  { vehicles: { $elemMatch: { vehicle_type_id: tripData.vehicle_type_id, is_default: true } },admin_id:requestParam.admin_id,status:'approved' }, async function (error, admin) {
//                                        console.log('----------admin',JSON.parse(JSON.stringify(admin)),'tripData.vehicle_type_id',tripData.vehicle_type_id)
//                                        if(admin != null){
//                                             const singleDriver = JSON.parse(JSON.stringify(admin))
//                                             console.log('start',tripData.start_latitude,'end',tripData.start_longitude)
//                                             var geoQuery = config.firebase.geoDriverRef.query({
//                                                 center: [parseFloat(tripData.start_latitude), parseFloat(tripData.start_longitude)],
//                                                 radius: parseInt(setting.driver_trip_radius)
//                                             });
//                                             let userId = []
//                                             geoQuery.on("key_entered", (key, location, distance) => {
//                                                 userId.push(key)
//                                             });
//                                             geoQuery.on("ready", (key, location, distance) => {
//                                                 let arrayDriver = userId;
//                                                 console.log("FIREBASE DRIVER")
//                                                 console.log(arrayDriver)
//                                                 console.log('arrayDriver.includes(singleDriver.admin_id)',arrayDriver.includes(singleDriver.admin_id))
//                                                 if(arrayDriver.includes(singleDriver.admin_id)){
//                                                   let  requested_drivers=[];
//                                                             let columnAndValueTripDriver={
//                                                                 admin_id:singleDriver.admin_id,
//                                                                 status: 'Accept'
//                                                             };
//                                                             query.selectWithAnd(dbConstants.dbSchema.tripdrivers,columnAndValueTripDriver, function (error, currentTrip) {
//                                                                 console.log('currentTrip.length',currentTrip.length)
//                                                                 if(currentTrip.length==0){
//                                                                     let vehicle = []
//                                                                     admin.vehicles.map(function(i){
//                                                                         if(i.is_default== true) {
//                                                                             vehicle.push(i) 
//                                                                         }
//                                                                     });
//                                                                     let vehicle_type_id = _.pluck(vehicle, 'vehicle_type_id');
//                                                                     if (vehicle_type_id.includes(singleTrip.vehicle_type_id)) {
//                                                                         console.log('admin.device_type===============1=======',admin.device_type)
//                                                                         if(admin.device_type=='android'){
//                                                                             requested_drivers.push(singleDriver.admin_id);
//                                                                             getNotificationValue('NEW_RIDE',admin.language_id,tripData.trip_id,(err, title) => {
//                                                                                 const message = { //this may lety according to the message type (single recipient, multicast, topic, et cetera)
//                                                                                     to: admin.device_token, 
//                                                                                     collapse_key: 'green',
//                                                                                     data:{
//                                                                                         data: {
//                                                                                             message:title,
//                                                                                             type:'new_ride'
//                                                                                         }
//                                                                                     }
//                                                                                 };
//                                                                                 let columnsAndValueTripDriver={
//                                                                                     trip_id:tripData.trip_id,
//                                                                                     admin_id:singleDriver.admin_id,
//                                                                                     status:tripDriverConstants.status.none
//                                                                                 }
//                                                                                 query.insertSingle(dbConstants.dbSchema.tripdrivers,columnsAndValueTripDriver,function (error, tripDriver) {
//                                                                                     if(admin.notification !='Off'){
//                                                                                         let obj = {
//                                                                                             user_type: 'admin',
//                                                                                             user_id: singleDriver.admin_id,
//                                                                                             name: admin.first_name+' '+admin.last_name,
//                                                                                             message: title,
//                                                                                             status: (error) ? 'failure' : 'success',
//                                                                                         };
//                                                                                         query.insertSingle(dbConstants.dbSchema.notificationlogs, obj, (error, response) => {
//                                                                                             fcm.send(message, function(err, response){
//                                                                                                 console.log(err)
//                                                                                                 console.log(response)

//                                                                                             });
//                                                                                         });
//                                                                                     }
//                                                                                 });
//                                                                             });
//                                                                         }else if(admin.device_type=='ios'){
//                                                                             requested_drivers.push(singleDriver.admin_id);
//                                                                             getNotificationValue('NEW_RIDE',admin.language_id,tripData.trip_id,(err, title) => {
//                                                                                 const deviceToken = admin.device_token;
//                                                                                 let note = new apn.Notification();

//                                                                                 note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
//                                                                                 note.badge = 1;
//                                                                                 note.sound = 'Fetch_tone.wav';
//                                                                                 note.alert = title;
//                                                                                 note.payload = {'messageFrom': config.push_notification.msg_from,type:'new_ride'};
//                                                                                 note.topic = config.push_notification.bundle_id;

//                                                                                 let columnsAndValueTripDriver={
//                                                                                     trip_id:tripData.trip_id,
//                                                                                     admin_id:singleDriver.admin_id,
//                                                                                     status:tripDriverConstants.status.none
//                                                                                 }
//                                                                                 query.insertSingle(dbConstants.dbSchema.tripdrivers,columnsAndValueTripDriver,function (error, tripDriver) {
//                                                                                     if(admin.notification !='Off'){
//                                                                                         let obj = {
//                                                                                             user_type: 'admin',
//                                                                                             user_id: singleDriver.admin_id,
//                                                                                             name: admin.first_name+' '+admin.last_name,
//                                                                                             message: title,
//                                                                                             status: 'success',
//                                                                                         };
//                                                                                         query.insertSingle(dbConstants.dbSchema.notificationlogs, obj, (error, response) => {
//                                                                                             apnProvider.send(note, deviceToken).then((result) => {

//                                                                                             });
//                                                                                         });
//                                                                                     }
//                                                                                 });
//                                                                             });
//                                                                         }
//                                                                     }
//                                                                 }
//                                                             });
//                                                 }
//                                             });

//                                         }

//                                     })
//                                 })
//                             }                        

//                         })
//                     });
//                 }
//             });
//         });
//     });
// };

/*
 * Used to update admin location admin by id 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const updateDriverLocation = function(requestParam, done) {
//     query.updateSingle(dbConstants.dbSchema.admins, requestParam, {
//         admin_id: requestParam.admin_id
//     }, function(error, admins) {
//         if (error) {
//             logger('Error: can not update admins');
//             done(error, null);
//             return;
//         }
//         done(null, errors.customError('Updated Successfully.', '1', 'Success', true));
//     });
// };

/*
 * Retrieves the details of when admin came
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
// const driverIsComing = (requestParam, req, done) => {
//     const fullUrl = req.protocol + '://' + req.get('host');
//     let columnsAndValuesTrip = {
//         trip_id: requestParam.trip_id
//     }
//     if (requestParam.type == 'complete') {
//         const columnAndValueTripDriver = {
//             'trip_id': requestParam.trip_id,
//             'status': tripDriverConstants.status.accept
//         };
//         query.selectWithAndOne(dbConstants.dbSchema.tripdrivers, columnAndValueTripDriver, function(error, tripdriver) {
//             if (tripdriver == null) {
//                 done(errors.customError('Can not get any admin with this trip_id.', '2', 'Not exists', true), {});
//                 return;
//             }
//             query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: tripdriver.admin_id }, function(error, admin) {
//                 if (admin == null) {
//                     done(errors.customError('Can not get any admin with this trip_id.', '2', 'Not exists', true), {});
//                     return;
//                 }
//                 query.selectWithAndOne(dbConstants.dbSchema.trips, columnsAndValuesTrip, function(error, trip) {
//                     if (trip == null) {
//                         done(errors.customError('Can not get any tirp with this trip_id.', '2', 'Not exists', true), {});
//                         return;
//                     }
//                     if (!admin.profile_picture || admin.profile_picture == '') {
//                         admin.profile_picture = fullUrl + '/upload/admin/avatar.jpg';
//                     }
//                     let columnsAndValuesFinishTrip = {
//                         admin_id: admin.admin_id,
//                         first_name: admin.first_name,
//                         last_name: admin.last_name,
//                         profile_picture: admin.profile_picture,
//                         vehicle_name: '',
//                         total_price: trip.total_price,
//                         code: '403'
//                     }
//                     done(null, columnsAndValuesFinishTrip);
//                 });
//             });
//         });
//     } else {
//         let columnsAndValuesDriver = {
//             admin_id: requestParam.admin_id
//         }
//         let columnsAndValuesLanguage = {
//             language_id: requestParam.language_id
//         }
//         query.selectWithAndOne(dbConstants.dbSchema.languages, columnsAndValuesLanguage, function(error, language) {
//             query.selectWithAndOne(dbConstants.dbSchema.trips, columnsAndValuesTrip, function(error, trip) {
//                 if (trip == null) {
//                     done(errors.customError('Can not get any tirp with this trip_id.', '2', 'Not exists', true), {});
//                     return;
//                 }
//                 if (trip.status == tripConstants.status.ongoing) {
//                     done(errors.customError('Trip started Successfully.', '405', 'Started', true), {});
//                     return;
//                 } else {
//                     query.selectWithAndOne(dbConstants.dbSchema.admins, columnsAndValuesDriver, function(error, admin) {
//                         if (admin == null) {
//                             done(null, errors.customError('Admin not exist with this admin_id.', '2', 'Not exists', true));
//                             return;
//                         }
//                         let columnsAndValuesVehicle = {
//                             vehicle_type_id: admin.vehicle_type_id
//                         }
//                         query.selectWithAndOne(dbConstants.dbSchema.vehicleTypes, columnsAndValuesVehicle, function(error, vehicletypes) {
//                             if (trip.status == tripConstants.status.complete) {
//                                 if (!admin.profile_picture) {
//                                     admin.profile_picture = fullUrl + '/upload/admin/avatar.jpg';
//                                 }
//                                 let columnsAndValuesFinishTrip = {
//                                     admin_id: admin.admin_id,
//                                     first_name: admin.first_name,
//                                     last_name: admin.last_name,
//                                     profile_picture: admin.profile_picture,
//                                     vehicle_name: vehicletypes.name[language.code],
//                                     total_price: trip.total_price,
//                                     code: '403'
//                                 }
//                                 done(null, columnsAndValuesFinishTrip);
//                             } else {
//                                 const randomNo = Math.floor(Math.random() * 1) + 0;
//                                 const distance = require('google-distance');
//                                 distance.apiKey = config.googleDistance.apiKey[randomNo];
//                                 distance.get({
//                                         index: 1,
//                                         //origin: admin.latitude + ',' + admin.longitude,
//                                         origin: requestParam.driver_latitude + ',' + requestParam.driver_longitude,
//                                         destination: requestParam.start_latitude + ',' + requestParam.start_longitude
//                                     },
//                                     function(err, data) {
//                                         if (data == undefined) {
//                                             done(null, errors.customError('Can not get admin time.', '401', 'Not exists', true));
//                                             return;
//                                         } else {
//                                             let gotDuration = data.duration.split(' ');
//                                             if (gotDuration[0] <= 1) {
//                                                 done(errors.customError('Admin is reached at Your Location.', '402', 'Success', true), {});
//                                                 return;
//                                             } else {
//                                                 if (!admin.profile_picture) {
//                                                     admin.profile_picture = fullUrl + '/upload/admin/avatar.jpg';
//                                                 }
//                                                 if (!trip.consumer2driver_rating) {
//                                                     trip.consumer2driver_rating = "0";
//                                                 }
//                                                 if (!trip.driver2consumer_rating) {
//                                                     trip.driver2consumer_rating = "0";
//                                                 }
//                                                 let columnsAndValuesTime = {
//                                                     admin_id: admin.admin_id,
//                                                     first_name: admin.first_name,
//                                                     last_name: admin.last_name,
//                                                     email: admin.email,
//                                                     mobile: admin.mobile,
//                                                     vehicle_number: admin.vehicle_number,
//                                                     vehicle_type_id: admin.vehicle_type_id,
//                                                     driver_license: admin.driver_license,
//                                                     profile_picture: admin.profile_picture,
//                                                     vehicle_name: vehicletypes.name[language.code],
//                                                     latitude: admin.latitude,
//                                                     longitude: admin.longitude,
//                                                     start_address: trip.start_address,
//                                                     finish_address: trip.finish_address,
//                                                     total_price: trip.total_price,
//                                                     start_latitude: trip.start_latitude,
//                                                     start_longitude: trip.start_longitude,
//                                                     finish_latitude: trip.finish_latitude,
//                                                     finish_longitude: trip.finish_longitude,
//                                                     distance: data.distance,
//                                                     payment_type: 'Cash',
//                                                     consumer2driver_rating: trip.consumer2driver_rating,
//                                                     driver2consumer_rating: trip.driver2consumer_rating,
//                                                     coming_time: data.duration,
//                                                     code: '200'
//                                                 }
//                                                 done(null, columnsAndValuesTime);
//                                             }
//                                         }
//                                     });
//                             }
//                         });
//                     });
//                 }
//             });
//         });
//     }
// };


/*
 * Used to active admin by id 
 * @param {driverDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeDriverOld = function (driverDetails, done) {
    let columnsToUpdate = {
        status: driverConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.admins, columnsToUpdate, {
        'admin_id': {
            $in: driverDetails
        }
    }, function (error, admin) {
        if (error) {
            logger('Error: can not update admin');
            done(error, null);
            return;
        }

        done(null, {});
    });
};

const activeDriver = function (driverDetails, done) {
    let columnsToUpdate = {
        status: driverConstants.status.active
    };
    query.updateSingle(dbConstants.dbSchema.admins, columnsToUpdate, {
        'id': driverDetails.admin_id
    }, function (error, admin) {
        if (error) {
            logger('Error: can not update admin');
            done(error, null);
            return;
        }

        done(null, admin);
    });
};

/*
 * Used to inactive admin by id 
 * @param {driverDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveDriver = function (driverDetails, done) {
    let columnsToUpdate = {
        status: driverConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.admins, columnsToUpdate, {
        'admin_id': {
            $in: driverDetails
        }
    }, function (error, admin) {
        if (error) {
            logger('Error: can not update admin');
            done(error, null);
            return;
        }
        console.log(driverDetails)
        for (let i = 0; i < driverDetails.length; i++) {
            var ref = config.firebase.userRef.child(driverDetails[i]);
            ref.once("value").then(function (snapshot) {
                if (snapshot.exists()) {
                    ref.update({ status: 'inactive' });
                }
            });
        }
        done(null, admin);
    });
};

/*
 * Used to delete admin by id 
 * @param {driverDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteDriver = function (driverDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.admins, {
        'admin_id': {
            $in: driverDetails
        }
    }, function (error, admin) {
        if (error) {
            logger('Error: can not update admin');
            done(error, null);
            return;
        }
        for (let i = 0; i < driverDetails.length; i++) {
            var ref = config.firebase.userRef.child(driverDetails[i]);
            ref.once("value").then(function (snapshot) {
                if (snapshot.exists()) {
                    ref.update({ status: 'delete' });
                }
            });
            var ref2 = config.firebase.driverRef.child(driverDetails[i]);
            ref2.remove().then((snapshot) => {
                console.log(snapshot)
            }).catch((error) => {
                console.log(error)
            });
        }
        done(null, admin);
        return
    });
};

/*
 * Used to action update by id
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const actionUpdateProvider = (requestParam, done) => {
    if (requestParam['actionType'] == "archive") {
        let columnsToUpdate = {
            is_archive: true,
            is_login: false,
            online_status: 'Off',
            status: driverConstants.status.inactive
        };
        query.updateMultiple(dbConstants.dbSchema.admins, columnsToUpdate, { 'admin_id': { $in: requestParam['id'] } }, function (error, data) {
            if (error) {
                logger('Error: can not delete ');
                done(error, null);
                return;
            }
            for (let i = 0; i < requestParam.id.length; i++) {
                var ref = config.firebase.userRef.child(requestParam.id[i]);
                ref.once("value").then(function (snapshot) {
                    if (snapshot.exists()) {
                        ref.update({ status: 'delete' });
                    }
                });
                var ref2 = config.firebase.driverRef.child(requestParam.id[i]);

                ref2.remove().then((res) => {
                    console.log(res)
                }).catch((error) => {
                    console.log(error)
                })
            }
            done(null, data);
            return
        });

    } else {
        let columnsToUpdate = {
            status: requestParam['actionType'],
        };
        query.updateMultiple(dbConstants.dbSchema.admins, columnsToUpdate, {
            'admin_id': {
                $in: requestParam['id'],
            },
        }, function (error, data) {
            if (error) {
                logger('Error: can not update ');
                done(error, null);
                return;
            }
            if (requestParam['actionType'] == 'approved') {
                console.log(requestParam['actionType'])
                // query.selectWithAndOne(dbConstants.dbSchema.settings,{},function (error, setting) {
                // })
                async.forEachSeries(requestParam.id, function (singleDriver, Callback_s1) {
                    let joinArr = [{
                        $lookup: {
                            from: 'languages',
                            localField: 'language_id',
                            foreignField: 'language_id',
                            as: 'languageDetails',
                        },
                    }, {
                        $unwind: "$languageDetails",
                    }, {
                        $match: { admin_id: singleDriver },
                    }, {
                        $project: {
                            _id: 0,
                            language_id: "$language_id",
                            admin_id: "$admin_id",
                            first_name: "$first_name",
                            last_name: "$last_name",
                            email: "$email",
                            device_type: "$device_type",
                            device_token: "$device_token",
                            langauge_code: "$languageDetails.code",
                            status: "$status",
                        },
                    }];
                    query.joinWithAnd(dbConstants.dbSchema.admins, joinArr, (error, response) => {
                        if (error) {
                            Callback_s1();
                        }
                        query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
                            code: 'DAA'
                        }, function (error, template) {
                            if (!template || error) {
                                Callback_s1();
                            }
                            let emailtemplate = template.description[response[0].langauge_code];
                            const data = {
                                from: template.from_email,
                                to: response[0].email,
                                subject: template.email_subject,
                                html: emailtemplate
                            };
                            const params = {
                                Destination: {
                                    ToAddresses: [data.to]
                                },
                                Message: {
                                    Body: {
                                        Html: {
                                            Charset: 'UTF-8',
                                            Data: data.html
                                        }
                                    },
                                    Subject: {
                                        Charset: 'UTF-8',
                                        Data: data.subject
                                    }
                                },
                                ReturnPath: data.from,
                                Source: data.from,
                            };

                            commonHandler.sendEmailToUser(data, (err, data) => {
                                if (err) {
                                    console.log(err, err.stack);
                                    done(errors.cannotSendEmail(true), null);
                                    return;
                                } else {
                                    if (response[0].device_type == notificationConstants.device.android) {
                                        const message = { //this may lety according to the message type (single recipient, multicast, topic, et cetera)
                                            to: response[0].device_token,
                                            collapse_key: 'green',
                                            data: {
                                                data: {
                                                    message: 'Congratulations! Your Cab admin account has been approved!',
                                                    type: 'active',
                                                    status: requestParam['actionType']
                                                }
                                            }
                                        };
                                        fcm.send(message, function (err, response) {
                                            Callback_s1();
                                        });
                                    } else if (response[0].device_type == notificationConstants.device.ios) {
                                        const deviceToken = response[0].device_token;
                                        let note = new apn.Notification();

                                        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                                        note.badge = 1;
                                        note.sound = "ping.aiff";
                                        note.alert = 'Congratulations! Your Cab admin account has been approved!';
                                        note.payload = { 'messageFrom': 'Cab', type: 'active', 'status': requestParam['actionType'] };
                                        note.topic = config.push_notification.bundle_id;

                                        // code for ios push notification
                                        const p8FilePath = config.push_notification.p8FilePath;
                                        const options = {
                                            token: {
                                                key: p8FilePath,
                                                keyId: config.push_notification.key_id,
                                                teamId: config.push_notification.team_id
                                            },
                                            production: false
                                        };
                                        const apnProvider = new apn.Provider(options);
                                        // end of code for ios push notification

                                        apnProvider.send(note, deviceToken).then((result) => {
                                            Callback_s1();
                                        });
                                    } else {
                                        Callback_s1();
                                    }
                                }
                            })
                            // awsSES.sendEmail(params, (err, data) => {
                            //     if (err) {
                            //      console.log(err, err.stack);
                            //     } else {
                            //          if (response[0].device_type == notificationConstants.device.android) {
                            //             const message = { //this may lety according to the message type (single recipient, multicast, topic, et cetera)
                            //                 to: response[0].device_token,
                            //                 collapse_key: 'green',
                            //                 data: {
                            //                     data: {
                            //                         message: 'Congratulations! Your Cab admin account has been approved!',
                            //                         type: 'active',
                            //                         status: requestParam['actionType']
                            //                     }
                            //                 }
                            //             };
                            //             fcm.send(message, function(err, response) {
                            //                 Callback_s1();
                            //             });
                            //         } else if (response[0].device_type == notificationConstants.device.ios) {
                            //             const deviceToken = response[0].device_token;
                            //             let note = new apn.Notification();

                            //             note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                            //             note.badge = 1;
                            //             note.sound = "ping.aiff";
                            //             note.alert = 'Congratulations! Your Cab admin account has been approved!';
                            //             note.payload = { 'messageFrom': 'Cab', type: 'active', 'status': requestParam['actionType'] };
                            //             note.topic = config.push_notification.bundle_id;

                            //             // code for ios push notification
                            //             const p8FilePath = config.push_notification.p8FilePath;
                            //             const options = {
                            //                 token: {
                            //                     key: p8FilePath,
                            //                     keyId: config.push_notification.key_id,
                            //                     teamId: config.push_notification.team_id
                            //                 },
                            //                 production: false
                            //             };
                            //             const apnProvider = new apn.Provider(options);
                            //             // end of code for ios push notification

                            //             apnProvider.send(note, deviceToken).then((result) => {
                            //                 Callback_s1();
                            //             });
                            //         } else {
                            //             Callback_s1();
                            //         }
                            //     }
                            //     //done(null, {});
                            //     //return;
                            // });
                            /*mailgun.messages().send(data, function(error, body) {
                                if (response[0].device_type == notificationConstants.device.android) {
                                    const message = { //this may lety according to the message type (single recipient, multicast, topic, et cetera)
                                        to: response[0].device_token,
                                        collapse_key: 'green',
                                        data: {
                                            data: {
                                                message: 'Congratulations! Your Cab admin account has been approved!',
                                                type: 'active',
                                                status: requestParam['actionType']
                                            }
                                        }
                                    };
                                    fcm.send(message, function(err, response) {
                                        Callback_s1();
                                    });
                                } else if (response[0].device_type == notificationConstants.device.ios) {
                                    const deviceToken = response[0].device_token;
                                    let note = new apn.Notification();

                                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                                    note.badge = 1;
                                    note.sound = "ping.aiff";
                                    note.alert = 'Congratulations! Your Cab admin account has been approved!';
                                    note.payload = { 'messageFrom': 'Cab', type: 'active', 'status': requestParam['actionType'] };
                                    note.topic = config.push_notification.bundle_id;

                                    // code for ios push notification
                                    const p8FilePath = config.push_notification.p8FilePath;
                                    const options = {
                                        token: {
                                            key: p8FilePath,
                                            keyId: config.push_notification.key_id,
                                            teamId: config.push_notification.team_id
                                        },
                                        production: false
                                    };
                                    const apnProvider = new apn.Provider(options);
                                    // end of code for ios push notification

                                    apnProvider.send(note, deviceToken).then((result) => {
                                        Callback_s1();
                                    });
                                } else {
                                    Callback_s1();
                                }
                                //Callback_s1();
                            });*/

                        })
                    });
                }, function () {
                    for (let i = 0; i < requestParam.id.length; i++) {
                        var ref = config.firebase.userRef.child(requestParam.id[i]);
                        ref.once("value").then(function (snapshot) {
                            if (snapshot.exists()) {
                                ref.update({ status: 'active' });
                            }
                        });
                    }
                    done(null, data);
                    return
                });
            } else {
                for (let i = 0; i < requestParam.id.length; i++) {
                    var ref = config.firebase.userRef.child(requestParam.id[i]);
                    ref.once("value").then(function (snapshot) {
                        if (snapshot.exists()) {
                            let status = '';
                            if (requestParam['actionType'] == 'pending') status = 'inactive'
                            if (requestParam['actionType'] == 'banned') status = 'banned'
                            ref.update({ status: status });
                        }
                    });
                }
                done(null, data);
            }
        });
    }
};

/*
 * Used to add credit of admin
 * @param {creditDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const addCredit = function(creditDetails, done) {
//     creditDetails.wallet_transaction_type = 'company';
//     creditDetails.transaction_id = moment().unix() + Math.floor((Math.random() * 999999999) + 1);
//     creditDetails.amount = creditDetails.amount.replace(/,/g, '');
//     //creditDetails.message = 'Added by admin';
//     let columnsAndValuesDriver = {
//             admin_id: creditDetails.user_id
//         }
//         //query.selectWithAndOne(dbConstants.dbSchema.driver_credit_histories, columnsAndValuesDriver, function(error, creditDriver) {
//     query.selectWithAndOne(dbConstants.dbSchema.admins, columnsAndValuesDriver, async function(error, admin) {
//         if (admin == null) {
//             logger('Error: while creating admin', errors.errorWithMessage(error));
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!admin.current_balance) {
//             admin.current_balance = '0';
//         } else if (isNaN(admin.current_balance)) {
//                 const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: creditDetails.user_id },{_id : 0}, {})
//                 const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
//                 const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
//                 const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
//                 const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
//                 const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
//                 admin.current_balance = finalBalance
//         }
//         let current_balance = parseFloat(admin.current_balance) + parseFloat(creditDetails.amount);
//         if (parseFloat(current_balance) < 0) {
//             logger('Error: Wallet Balance is low');
//             done(errors.customError('Error: Wallet Balance is low', 404, 'Low Balance'), null);
//             return;
//         } else {
//             if (parseFloat(creditDetails.amount) < 0) {
//                 //creditDetails.message = 'Debit by admin';
//                 creditDetails.type = 'substraction';
//                 creditDetails.amount = Math.abs(creditDetails.amount);
//             } else {
//                 //creditDetails.message = 'Credit added by admin';
//                 creditDetails.type = 'addition';
//             }
//             console.log(creditDetails)
//             query.insertSingle(dbConstants.dbSchema.wallet_history, creditDetails, function(error, credit) {
//                 if (error) {
//                     logger('Error: while creating credit', errors.errorWithMessage(error));
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 let columnsAndValuesDriverUpdate = {
//                     current_balance: current_balance
//                 }
//                 query.updateMultiple(dbConstants.dbSchema.admins, columnsAndValuesDriverUpdate, {
//                     'admin_id': creditDetails.user_id
//                 }, function(error, driverUpdate) {
//                     if (error) {
//                         logger('Error: can not update admin');
//                         done(error, null);
//                         return;
//                     }
//                     let mailData = {
//                         code: 'DSU',
//                         language_code: 'EN',
//                         amount: credit.amount,
//                         email: admin.email
//                     } 
//                     admin.code = "CREDIT_AMOUNT"
//                     admin.user_type = "admin"
//                     admin.request_type = "admin"
//                     admin.credit_amount_by = creditDetails.amount
//                     notificationHandler.sendCreditNotification(admin)
//                     commonHandler.sendEmail(mailData, (error, response) => {
//                         done(null, driverUpdate);
//                     })
//                 });
//             });
//         }
//     });

//     // let todayDate = moment().format();
//     // creditDetails.date_selection = todayDate;
//     // creditDetails.deposit_amount = creditDetails.deposit_amount.replace(/,/g, '');
//     // //creditDetails.message = 'Added by admin';
//     // let columnsAndValuesDriver = {
//     //     admin_id: creditDetails.admin_id
//     // }
//     // //query.selectWithAndOne(dbConstants.dbSchema.driver_credit_histories, columnsAndValuesDriver, function(error, creditDriver) {
//     // query.selectWithAndOne(dbConstants.dbSchema.admins, columnsAndValuesDriver, function(error, admin) {
//     //     if (admin == null) {
//     //         logger('Error: while creating admin', errors.errorWithMessage(error));
//     //         done(errors.internalServer(true), null);
//     //         return;
//     //     }
//     //     if (!admin.current_balance) {
//     //         admin.current_balance = '0';
//     //     }
//     //     let current_balance = parseFloat(admin.current_balance) + parseFloat(creditDetails.deposit_amount);
//     //     if(parseFloat(current_balance) < 0 ){
//     //         logger('Error: Wallet Balance is low');
//     //         done(errors.customError('Error: Wallet Balance is low',404,'Low Balance'), null);
//     //         return;
//     //     } else {
//     //         if(parseFloat(creditDetails.deposit_amount) < 0){
//     //             creditDetails.message = 'Debit by admin';
//     //         } else {
//     //             creditDetails.message = 'Credit added by admin';
//     //         }
//     //         query.insertSingle(dbConstants.dbSchema.driver_credit_histories, creditDetails, function(error, credit) {
//     //             if (error) {
//     //                 logger('Error: while creating credit', errors.errorWithMessage(error));
//     //                 done(errors.internalServer(true), null);
//     //                 return;
//     //             }
//     //             let columnsAndValuesDriverUpdate = {
//     //                 current_balance: current_balance
//     //             }
//     //             query.updateMultiple(dbConstants.dbSchema.admins, columnsAndValuesDriverUpdate, {
//     //                 'admin_id': creditDetails.admin_id
//     //             }, function(error, driverUpdate) {
//     //                 if (error) {
//     //                     logger('Error: can not update admin');
//     //                     done(error, null);
//     //                     return;
//     //                 }
//     //                 done(null, driverUpdate);
//     //             });
//     //         });
//     //     }
//     // });
// };

/*
 * Used to get getCredit with params
 * @param {Function} done - Callback function with error, data params
 */
// const getCredit = function(requestParam, done) {
//     if (requestParam.credit_id) {
//         query.selectWithAndOne(dbConstants.dbSchema.driver_credit_histories, requestParam, function(error, credit) {
//             if (error) {
//                 logger('Error: can not get language', dbConstants.dbSchema.languages);
//                 done(error, null);
//                 return;
//             }
//             let todayDate = moment(new Date());
//             // let createdDate = moment(credit.created_at);
//             let createdDate = moment(commonHandler.converTotimeZone(credit.created_at));
//             let duration = moment.duration(todayDate.diff(createdDate));
//             let minutes = duration.asMinutes();
//             if (parseInt(minutes) > 60) {
//                 done(null, [{
//                     done: '0'
//                 }]);
//             } else {
//                 let columnsAndValuesCredits = [];
//                 columnsAndValuesCredits.push({
//                     'id': credit.credit_id,
//                     'credit_id': credit.credit_id,
//                     'date_selection': moment(credit.date_selection).format("MM/DD/YYYY"),
//                     'deposit_amount': credit.deposit_amount
//                 });
//                 done(null, columnsAndValuesCredits);
//             }
//         });
//     } else {
//         let compairData = {
//             user_id: requestParam.admin_id
//         }
//         query.selectWithAnd(dbConstants.dbSchema.wallet_history, compairData, function (error, credits) {
//             let columnsAndValues = [];
//             async.forEachSeries(credits, function(singleCredit, Callback_s1) {
//                 let getLabel = {};
//                 if (singleCredit.wallet_transaction_type == 'consumer') {
//                     getLabel = {
//                         code: 'ADDED_BY_YOU'
//                     }
//                 } else if (singleCredit.wallet_transaction_type == 'company' && singleCredit.type == 'addition') {
//                     getLabel = {
//                         code: 'ADDED_BY_COMPANY'
//                     }
//                 } else if (singleCredit.wallet_transaction_type == 'company' && singleCredit.type == 'substraction') {
//                     getLabel = {
//                         code: 'DEDUCT_BY_COMPANY'
//                     }
//                 } else if (singleCredit.wallet_transaction_type == 'invite_friend') {
//                     getLabel = {
//                         code: 'ADDED_BY_REFERRAL_CODE'
//                     }
//                 } else if (singleCredit.wallet_transaction_type == 'admin' && singleCredit.type == 'addition') {
//                     getLabel = {
//                         code: 'ADDED_BY_YOU'
//                     }
//                 } else if (singleCredit.wallet_transaction_type == 'admin' && singleCredit.type == 'substraction') {
//                     getLabel = {
//                         code: 'DEDUCT_BY_WALLET_FOR_PACKAGE'
//                     }
//                 } else {
//                     getLabel = {
//                         code: 'DEDUCT_FOR_TRIP_BOOKING'
//                     }
//                 }
//                 query.selectWithAndOne(dbConstants.dbSchema.languageLabels, getLabel, (error, languageLabel) => {
//                     if (error) {
//                         Callback_s1();
//                     }
//                     if (!languageLabel) {
//                         Callback_s1();
//                     }
//                     let data = {
//                         wallet_id: singleCredit.wallet_id,
//                         transaction_id: singleCredit.transaction_id,
//                         created_at: moment(singleCredit.created_at).format("Do MMM YYYY h:mm A"),
//                         date: singleCredit.created_at,
//                         type: singleCredit.type,
//                         message: languageLabel.value.EN,
//                         amount: singleCredit.amount
//                     }
//                     columnsAndValues.push(data)
//                     Callback_s1();
//                 })
//             }, function() {
//                 done(null, columnsAndValues);
//             });
//         });
//     }
// };

/*
 * Used to update credit of admin
 * @param {creditDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const updateCredit = function(creditDetails, done) {
//     // let todayDate=moment().format();
//     // creditDetails.date_selection=todayDate;
//     creditDetails.deposit_amount = creditDetails.deposit_amount.replace(/,/g, '');
//     let columnsAndValuesCredit = {
//         credit_id: creditDetails.credit_id
//     }
//     let updateColumnsAndValues = {
//         credit_id: creditDetails.credit_id,
//         deposit_amount: creditDetails.deposit_amount
//     }
//     query.selectWithAndOne(dbConstants.dbSchema.driver_credit_histories, columnsAndValuesCredit, function(error, creditDriver) {
//         query.updateSingle(dbConstants.dbSchema.driver_credit_histories, updateColumnsAndValues, {
//             'credit_id': creditDetails.credit_id
//         }, function(error, credit) {
//             if (error) {
//                 logger('Error: while updating credit', errors.errorWithMessage(error));
//                 done(errors.internalServer(true), null);
//                 return;
//             }
//             let columnsAndValuesDriver = {
//                 admin_id: creditDriver.admin_id
//             }
//             query.selectWithAndOne(dbConstants.dbSchema.admins, columnsAndValuesDriver, function(error, admin) {
//                 if (admin == null) {
//                     logger('Error: while creating admin', errors.errorWithMessage(error));
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 if (!admin.current_balance) {
//                     admin.current_balance = '0';
//                 }
//                 let current_balance = parseFloat(admin.current_balance) - parseFloat(creditDriver.deposit_amount);
//                 current_balance = current_balance + parseFloat(creditDetails.deposit_amount);
//                 let columnsAndValuesDriverUpdate = {
//                     current_balance: current_balance
//                 }
//                 query.updateMultiple(dbConstants.dbSchema.admins, columnsAndValuesDriverUpdate, {
//                     'admin_id': creditDriver.admin_id
//                 }, function(error, driverUpdate) {
//                     if (error) {
//                         logger('Error: can not update admin');
//                         done(error, null);
//                         return;
//                     }
//                     done(null, driverUpdate);
//                 });
//             });
//         });
//     });
// };

/*
 * Used to get trip  haribhagats job using post method
 * @param {Function} done - Callback function with error
 */
// const getTrip = function(requestParam, done) {
//     const columnAndValueTripDriver = {
//         admin_id: requestParam.admin_id,
//         status: tripDriverConstants.status.accept
//     };
//     query.selectWithAnd(dbConstants.dbSchema.tripdrivers, columnAndValueTripDriver, function(error, trips) {
//         if (error) {
//             logger('Error: can not get any delivery');
//             done(error, null);
//             return;
//         }
//         let columnsAndValues = [];
//         async.forEachSeries(trips, function(singleTrip, Callback_s1) {
//             const columnAndValueTrip = {
//                 trip_id: singleTrip.trip_id,
//             };
//             query.selectWithAndOne(dbConstants.dbSchema.trips, columnAndValueTrip, function(error, trip) {
//                 if (trip == null) {
//                     Callback_s1();
//                 } else {
//                     query.selectWithAndOne(dbConstants.dbSchema.admins, requestParam, function(error, admin) {
//                         let columnsAndValuesConsumer = {
//                             haribhagat_id: trip.haribhagat_id
//                         }
//                         query.selectWithAndOne(dbConstants.dbSchema.haribhagats, columnsAndValuesConsumer, function(error, consumer) {
//                             if (consumer == null) {
//                                 Callback_s1();
//                             } else {
//                                 let name;
//                                 if (!consumer.first_name && !consumer.last_name) {
//                                     name = consumer.mobile;
//                                 } else {
//                                     name = consumer.first_name + " " + consumer.last_name;
//                                 }
//                                 columnsAndValues.push({
//                                     'id': trip.trip_id,
//                                     'trip_id': trip.trip_id,
//                                     'consumer': name,
//                                     'admin': admin.first_name + " " + admin.last_name,
//                                     'trip_date': moment(trip.trip_datetime).format("Do MMM YYYY h:mm A"),
//                                     'start_address': trip.start_address,
//                                     'finish_address': trip.finish_address,
//                                     'price': trip.total_price,
//                                     'status': trip.status
//                                 });
//                                 Callback_s1();
//                             }
//                         });
//                     });
//                 }
//             });
//         }, function() {
//             done(null, columnsAndValues);
//         });
//     });
// };

// for send notification to admin including cron..
// const getFirebaseDriverScheduleTrip = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.settings, {}, function(error, setting) {
//         var geoQuery = config.firebase.geoDriverRef.query({
//             center: [parseFloat(requestParam.start_latitude), parseFloat(requestParam.start_longitude)],
//             radius: parseInt(setting.driver_trip_radius)
//         });
//         let userId = []
//         geoQuery.on("key_entered", (key, location, distance) => {
//             userId.push(key)
//         });
//         geoQuery.on("ready", (key, location, distance) => {
//             let arrayDriver = userId;
//             let columnsAndValuesDriver = {
//                 admin_id: arrayDriver.toString(),
//                 trip_id: requestParam.trip_id
//             }
//             console.log("columnsAndValuesDriver");
//             console.log(columnsAndValuesDriver);
//             notificationHandler.sendNotification(columnsAndValuesDriver, (err, admin) => {
//                 done(null, admin);
//             });
//         });
//     });
//     // let markers=[];
//     // let admins=[];
//     // config.firebase.driverRef.once("value", function(snapshot) {
//     //     markers = snapshot.val();
//     //     async.forEachSeries(markers, function(singleMarker, Callback_driver) {
//     //         if(singleMarker.latitude && singleMarker.longitude){
//     //             let isInCircle = geolib.isPointInCircle(
//     //                 {latitude: requestParam.start_latitude, longitude: requestParam.start_longitude},// My Current Address
//     //                 {latitude :singleMarker.latitude,longitude: singleMarker.longitude},
//     //                 5000
//     //             );
//     //             if(isInCircle == true){
//     //                 admins.push(singleMarker.admin_id);
//     //                 Callback_driver();
//     //             }
//     //             else{
//     //                 Callback_driver();
//     //             }
//     //         }
//     //         else{
//     //             Callback_driver();
//     //         }
//     //     },function(err){
//     //         let columnsAndValuesDriver={
//     //             admin_id:admins.toString(),
//     //             trip_id:requestParam.trip_id
//     //         }
//     //         notificationHandler.sendNotification(columnsAndValuesDriver, (err, admin) => {
//     //             done(null,admin);
//     //         });
//     //     });
//     // }, function (errorObject) {
//     //     done(null,markers);
//     // });
// };

/*
 * OTP verification 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const otpVerification = function(requestParam, done) {
//     let columnsAndValue = {
//         'mobile': requestParam.mobile,
//         "mobile_country_code": requestParam.mobile_country_code
//     }
//     query.selectWithAnd(dbConstants.dbSchema.admins, columnsAndValue, function(error, admin) {
//         if (error) {
//             logger('Error: can not get admin', dbConstants.dbSchema.admins);
//             done(error, null);
//             return;
//         }
//         if (admin.length > 0) {
//             if (admin[0].otp == requestParam.otp) {
//                 done(null, "Successfully Verified");
//                 return
//             } else {
//                 done(errors.customError('Invalid OTP', '402', 'Invalid', true), null);
//                 return;
//             }
//         } else {
//             done(errors.customError('Admin not exist with this mobile no.', '401', 'Not exists', true), null);
//             return;
//         }
//     });
// };

/*
 * Name : check-email-mobile
 * Purpose : Admin Can check Email and Mobile duplication from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 28th May 2019
 */
// const checkEmailMobile = function(requestParam, done) {
//     let columnAndValues = {};
//     if (requestParam.email && requestParam.mobile) {
//         columnAndValues['$or'] = [{
//             email: requestParam.email,
//         }, {
//             mobile: requestParam.mobile,
//             mobile_country_code: requestParam.mobile_country_code,
//         }];
//     } else if (requestParam.email) {
//         columnAndValues['$or'] = [{
//             email: requestParam.email,
//         }];
//     } else if (requestParam.mobile) {
//         columnAndValues['$or'] = [{
//             mobile: requestParam.mobile,
//             mobile_country_code: requestParam.mobile_country_code,
//         }];
//     }

//     let compairColumn = {};
//     if (requestParam.actionType == 'edit') {
//         compairColumn = {
//             $and: [{
//                     $or: [{
//                         admin_id: {
//                             $ne: requestParam.admin_id,
//                         },
//                     }],
//                 },
//                 columnAndValues,
//             ],
//         };
//     } else {
//         compairColumn = { $and: [columnAndValues] };
//     }
//     query.selectWithAndOne(dbConstants.dbSchema.admins, compairColumn, (error, isExist) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.admins);
//             done(errors.internalServer(true), null);
//             return;
//         }

//         if (isExist && !_.isEmpty(columnAndValues)) {
//             if (isExist.is_archive == 'true') {
//                 logger('Error: account is archived by admin');
//                 done(errors.archivedUser(true), null);
//                 return;
//             }
//             logger('Error: provider already exist.');
//             done(errors.duplicateUser(true), null);
//             return;
//         } else {
//             done(null, {});
//         }
//     });
// };

/*
 * Name : addVehicleBackend
 * Purpose : Admin Can add Admin Vehicle from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 29th May 2019
 */
// const addVehicleBackend = function(requestParam, done) {
//     if (requestParam.vehicle_id) {
//         query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, driverVehicle) => {

//             driverVehicle.vehicles.map(function(i) {
//                 if (i.vehicle_id == requestParam.vehicle_id) {
//                     i.vehicle_type_id = requestParam.vehicle_type_id || i.vehicle_type_id;
//                     i.vehicle_number = requestParam.vehicle_number || i.vehicle_number;
//                     i.road_tax = getImageNameFromURL(requestParam.road_tax) || i.road_tax;
//                     i.insurance_photo = getImageNameFromURL(requestParam.insurance_photo) || i.insurance_photo;
//                     i.vehicle_photo_front = getImageNameFromURL(requestParam.vehicle_photo_front) || i.vehicle_photo_front;
//                     i.vehicle_photo_rear = getImageNameFromURL(requestParam.vehicle_photo_rear) || i.vehicle_photo_rear;
//                     i.vehicle_photo_right = getImageNameFromURL(requestParam.vehicle_photo_right) || i.vehicle_photo_right;
//                     i.vehicle_photo_left = getImageNameFromURL(requestParam.vehicle_photo_left) || i.vehicle_photo_left;
//                     i.vehicle_brandormodel = requestParam.vehicle_brandormodel || i.vehicle_brandormodel;
//                     i.status = requestParam.status || i.status;
//                 }
//                 return i;
//             });
//             query.updateSingle(dbConstants.dbSchema.admins, { vehicles: driverVehicle.vehicles }, {
//                 admin_id: requestParam.admin_id
//             }, function(error, driverUpdated) {
//                 done(null, driverUpdated);
//             });
//         });
//     } else {
//         const vehicle_id = 'VID' + Math.floor(Math.random() * 8999 + 10000);
//         query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, admin) => {
//             if (error) {
//                 done(errors.resourceNotFound(true), null);
//                 return
//             }
//             let vehicle = {
//                 vehicle_id: vehicle_id,
//                 vehicle_type_id: requestParam.vehicle_type_id,
//                 vehicle_number: requestParam.vehicle_number,
//                 road_tax: getImageNameFromURL(requestParam.road_tax) || '',
//                 insurance_photo: getImageNameFromURL(requestParam.insurance_photo) || '',
//                 vehicle_photo_front: getImageNameFromURL(requestParam.vehicle_photo_front) || '',
//                 vehicle_photo_rear: getImageNameFromURL(requestParam.vehicle_photo_rear) || '',
//                 vehicle_photo_right: getImageNameFromURL(requestParam.vehicle_photo_right) || '',
//                 vehicle_photo_left: getImageNameFromURL(requestParam.vehicle_photo_left) || '',
//                 vehicle_brandormodel: requestParam.vehicle_brandormodel || '',
//                 status: requestParam.status || '',
//                 is_default: false
//             }
//             if (admin.vehicles.length == 0) {
//                 vehicle.is_default = true
//             }
//             query.updateSingle(dbConstants.dbSchema.admins, { $push: { vehicles: vehicle } }, {
//                 admin_id: requestParam.admin_id
//             }, function(error, driverUpdated) {
//                 done(null, driverUpdated);
//                 return
//             });
//         })
//     }
// }

/*
 * Name : getVehicleBackend
 * Purpose : Admin Can get Admin Vehicle from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 29th May 2019
 */
// const getVehicleBackend = function(requestParam, done) {
//     if (requestParam.vehicle_id) {
//         query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, driverVehicle) => {
//             let vehicle = _.find(driverVehicle.vehicles, function(o) { return o.vehicle_id == requestParam.vehicle_id; })
//             vehicle.insurance_photo = generateFullURL(vehicle.insurance_photo)
//             vehicle.road_tax = generateFullURL(vehicle.road_tax)
//             vehicle.vehicle_photo_front = generateFullURL(vehicle.vehicle_photo_front)
//             vehicle.vehicle_photo_left = generateFullURL(vehicle.vehicle_photo_left)
//             vehicle.vehicle_photo_rear = generateFullURL(vehicle.vehicle_photo_rear)
//             vehicle.vehicle_photo_right = generateFullURL(vehicle.vehicle_photo_right)
//             done(null, vehicle);
//         });
//     } else {
//         query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, driverVehicle) => {
//             let columnsAndValues = [];
//             async.forEachSeries(driverVehicle.vehicles, function(singleVehicle, callbackSingleVehicle) {
//                 query.selectWithAndOne(dbConstants.dbSchema.vehicleTypes, { vehicle_type_id: singleVehicle.vehicle_type_id }, (error, vehicleType) => {
//                     singleVehicle.typeName = vehicleType.name.EN;
//                     columnsAndValues.push(singleVehicle);
//                     callbackSingleVehicle();
//                 });
//             }, function(err) {
//                 var PushedFullURL = pushFullUrlInObj(columnsAndValues)
//                 done(null, columnsAndValues);
//             });
//         });
//     }
// }

/*
 * Name : deleteVehicleBackend
 * Purpose : Admin Can delete Admin Vehicle from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 29th May 2019
 */
// const deleteVehicleBackend = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, driverVehicle) => {
//         let vehicle = []
//         if (requestParam.type == 'delete') {
//             vehicle = _.without(driverVehicle.vehicles, _.findWhere(driverVehicle.vehicles, { vehicle_id: requestParam.vehicle_id }));
//         } else if (requestParam.type == 'default') {
//             vehicle = driverVehicle.vehicles.map(function(i) {
//                 if (i.vehicle_id == requestParam.vehicle_id) {
//                     i.is_default = true;
//                 } else {
//                     i.is_default = false;
//                 }
//                 return i;
//             });

//         } else if (requestParam.type == 'status') {
//             vehicle = driverVehicle.vehicles;
//         }
//         query.updateSingle(dbConstants.dbSchema.admins, { vehicles: vehicle }, {
//             admin_id: requestParam.admin_id
//         }, function(error, driverUpdated) {
//             done(null, driverUpdated);
//         });
//     });
// }

/*
 * Resend OTP
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const resendOtp = function(requestParam, done) {
//     query.selectWithAnd(dbConstants.dbSchema.admins, requestParam, function(error, admin) {
//         if (error) {
//             logger('Error: can not get admin', dbConstants.dbSchema.admins);
//             done(error, null);
//             return;
//         }
//         if (admin.length > 0) {
//             const otp = Math.floor(Math.random() * 8999 + 1000);
//             sendOTP({ mobile_country_code: admin[0].mobile_country_code, mobile: admin[0].mobile }, admin, otp);
//             query.updateSingle(dbConstants.dbSchema.admins, { otp: otp }, requestParam, function(error, admin) {
//                 if (error) {
//                     logger('Error: can not update admin');
//                     done(error, null);
//                     return;
//                 }
//                 query.selectWithAndOne(dbConstants.dbSchema.admins, requestParam, function(error, updatedDriver) {
//                     if (error) {
//                         logger('Error: can not get admin', dbConstants.dbSchema.admins);
//                         done(error, null);
//                         return;
//                     }
//                     let columnsAndValue = {
//                         otp: otp.toString(),
//                         message: 'OTP resend successfully.'
//                     }
//                     done(null, columnsAndValue);
//                 });
//             });
//         } else {
//             done(errors.customError('Admin not exist with this admin_id.', '404', 'Not exists', true), null);
//             return;
//         }
//     });
// };

/*
 * getDriverLastStatus
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const getDriverLastStatus = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
//         query.selectWithAndOne(dbConstants.dbSchema.admins, requestParam, (error, admin) => {
//             if (error) {
//                 logger('Error: can not get ', dbConstants.dbSchema.admins);
//                 done(errors.internalServer(true), null);
//                 return;
//             }
//             if (!admin) {
//                 done(errors.driverNotFound(true), null);
//                 return;
//             }
//             //requestParam.date=moment();
//             requestParam.date = moment();
//             getDriverRating(requestParam, (err, driverRating) => {
//                 if (moment() > moment(admin.package_expiry_date)) {
//                     admin.package_expiry_date = moment().format('YYYY-MM-DD HH:mm:ss');
//                 }
//                 let obj = {
//                     online_status: admin.online_status,
//                     notification: admin.notification,
//                     rating: driverRating.rating,
//                     earned: setting.currency + driverRating.earned,
//                     display_date: admin.package_expiry_date,
//                     is_subscription: setting.is_subscription
//                 }
//                 done(null, obj);
//                 return
//             });
//         });
//     });
// };

// function makeTripPayment(requestParam) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let response;
//             if (requestParam.for == "trip" || requestParam.for == "walletConsumer") {
//                 response = await query.selectWithAndOnePromise(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, customer_id: 1, name: 1, password: 1, consumer_cards: 1, default_card: 1, stripe_profile_id: 1, email: 1, profile_picture: 1, player_id: 1 });
//             } else {
//                 response = await query.selectWithAndOnePromise(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, { _id: 0, admin_id: 1, name: 1, password: 1, driver_cards: 1, default_card: 1, stripe_profile_id: 1, email: 1, profile_picture: 1, player_id: 1 });
//             }
//             let settings = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0, is_stripe_payment_live: 1, currency: 1 });
//             let currencyDetail = await query.selectWithAndOnePromise(dbConstants.dbSchema.currency, {symbole:settings.currency}, { _id: 0, stripe_code: 1 });
//             if (requestParam.for == "trip") {
//                 requestParam.total_price = requestParam.total_price.split(settings.currency)[1]
//             } else {
//                 requestParam.total_price = requestParam.amount
//             }
//             let stripeRes = await (new Promise(async (resolve1, reject) => {
//                 let stripe = require("stripe")(settings.is_stripe_payment_live ? config.stripeInfo.key_live : config.stripeInfo.key);
//                 let chargeAmount = Math.round(parseFloat(requestParam.total_price) * 100).toFixed(2);
//                 stripe.charges.create({
//                     amount: parseFloat(chargeAmount),
//                     currency:currencyDetail.stripe_code ,
//                     // source: response.default_card,
//                     customer: response.stripe_profile_id,
//                     description: response.email
//                 }, async function (err, charge) {
//                     if (err) {
//                         logger('Error: stripe error');
//                         resolve1({
//                             charge:null,
//                             status:err.raw.code == "amount_too_small" ? err.statusCode : 401
//                         })
//                     }
//                     const obj ={
//                         charge:charge,
//                         status:200
//                     }
//                     resolve1(obj)
//                 })
//             }));
//             if (requestParam.for == "trip") {
//                 let insertTransaction = {
//                     stripe_transaction_id: stripeRes.charge.id,
//                     haribhagat_id: requestParam.haribhagat_id,
//                     admin_id: "",
//                     trip_id: tripConstants.trip_initials.trip + moment().unix() + Math.floor(Math.random() * 8999 + 10000),
//                     payment_type: 'Card',
//                     payment_status: 'Success',
//                     charge: settings.currency + "" + parseFloat(requestParam.total_price),
//                 }
//                 const res = await query.insertSinglePromise(dbConstants.dbSchema.transactions, insertTransaction);
//                 resolve(res);
//                 return

//             } else {
//                 resolve(stripeRes);
//                 return
//             }
//         } catch (error) {
//             console.log(error)
//             reject(errors.internalServer(true, requestParam.code));
//             return
//         }
//     })


// };

// const addWallet = async function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, async (error, admin) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.admins);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!admin) {
//             done(errors.driverNotFound(true), null);
//             return;
//         }
//         if (!admin.current_balance || admin.current_balance == '') admin.current_balance = 0;
//         if (isNaN(admin.current_balance)) {
//             const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: requestParam.admin_id }, { _id: 0 }, {})
//             const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
//             const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
//             const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
//             const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
//             const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
//             admin.current_balance = finalBalance
//         }
//         let current_balance = parseFloat(requestParam.amount) + parseFloat(admin.current_balance);
//         if (requestParam.amount) {
//             try {
//                 requestParam.for = "walletDriver"
//                 console.log('requestParam',requestParam)
//                 if(requestParam.payment_type && requestParam.payment_type.toLowerCase() == "wave"){
//                   let wavePayment = await commonHandler.makeTripPaymentWithWave(requestParam)
//                     wavePayment =JSON.parse(JSON.stringify(wavePayment))
//                         console.log('wavePayment++wallet++d',wavePayment)
//                         if(wavePayment == null){
//                             done(errors.paymentFailure(true), null);
//                             return;
//                         }else{
//                             done(null, wavePayment);
//                         }
//                 } else {
//                     const payment = await makeTripPayment(requestParam)
//                     console.log("payment", payment)
//                     if (!payment.charge && payment.status == 400) {
//                         done(errors.customError('Amount must be at least 50 cents.',400,'Amount must be at least 50 cents.',true),null)
//                         return;
//                     }else if(!payment.charge && payment.status != 400){
//                         done(errors.paymentFailure(true), null);
//                         return;
//                     }
//                     requestParam.stripe_transaction_id = payment.charge.id
//                 }

//             } catch (error) {
//                 console.log(error)
//                 done(errors.paymentFailure(true), null);
//                 return;
//             }

//         }
//         console.log('++++++++++++++++',requestParam)
//         if(!requestParam.payment_type || requestParam.payment_type.toLowerCase() != "wave"){
//             query.updateSingle(dbConstants.dbSchema.admins, { current_balance: current_balance }, {
//                 admin_id: requestParam.admin_id
//             }, function(error, driverUpdated) {
//                 let insertObj = {
//                         user_id: requestParam.admin_id,
//                         user_type: 'admin',
//                         amount: requestParam.amount,
//                         stripe_transaction_id: requestParam.stripe_transaction_id,
//                         transaction_id: requestParam.transaction_id,
//                         type: 'addition',
//                         wallet_transaction_type: 'admin',
//                         payment_type:'stripe'
//                     }
//                 query.insertSingle(dbConstants.dbSchema.wallet_history, insertObj, function(error, admin) {
//                     done(null, "Add amount successfully");
//                 });
//             });
//         }       
//     });
// };




// const getWallet = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
//         query.selectWithAndOne(dbConstants.dbSchema.admins, requestParam, async(error, admin) => {
//             if (error) {
//                 logger('Error: can not get ', dbConstants.dbSchema.admins);
//                 done(errors.internalServer(true), null);
//                 return;
//             }
//             if (!admin) {
//                 done(errors.driverNotFound(true), null);
//                 return;
//             }
//             if (!admin.current_balance || admin.current_balance == '') {
//                 admin.current_balance = 0
//             }
//             if (isNaN(admin.current_balance)) {
//                 console.log("hello")
//                 const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: requestParam.admin_id }, { _id: 0 }, {})
//                 const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
//                 const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
//                 const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
//                 const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
//                 const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
//                 admin.current_balance = finalBalance
//             }
//             done(null, { current_balance: setting.currency +' '+parseInt(admin.current_balance) , currency_symbol: setting.currency });
//         });
//     });
// };
// const buyPackage = function(requestParam, done) {
//     requestParam.buy_date = new Date();
//     console.log("buy_date=>" + requestParam.buy_date)
//     query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, admin) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.admins);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!admin) {
//             done(errors.unauthorizedAccess(true), null);
//             return;
//         }
//         let package_date;
//         let package_expiry_date;
//         if (!admin.package_expiry_date) {
//             if (requestParam.date) {
//                 package_date = new Date(requestParam.date).getTime();
//             } else {
//                 package_date = moment()
//             }
//         } else package_date = moment(admin.package_expiry_date);
//         if (moment() > moment(admin.package_expiry_date)) {
//             if (requestParam.date) {
//                 package_date = new Date(requestParam.date).getTime();
//             } else {
//                 package_date = moment()
//             }
//         }
//         console.log("package_date=>" + package_date)
//         console.log("====>" + new Date(package_date))
//         console.log("package_date=>" + package_date)
//         query.selectWithAndOne(dbConstants.dbSchema.packages, { package_id: requestParam.package_id }, (error, packages) => {
//             console.log("packages.package_type=>" + packages.package_type)
//             if (packages.package_type == 'day') {
//                 package_expiry_date = moment(package_date).add(packages.package_value, 'days').format('YYYY-MM-DD HH:mm:ss');
//             } else if (packages.package_type == 'week') {
//                 package_expiry_date = moment(package_date).add(packages.package_value * 7, 'days').format('YYYY-MM-DD HH:mm:ss');
//             } else if (packages.package_type == 'month') {
//                 package_expiry_date = moment(package_date).add(packages.package_value, 'month').format("YYYY-MM-DD HH:mm:ss");
//             } else if (packages.package_type == 'year') {
//                 package_expiry_date = moment(package_date).add(packages.package_value, 'year').format("YYYY-MM-DD HH:mm:ss");
//             } else if (packages.package_type == 'hour') {
//                 package_expiry_date = moment(package_date).add(packages.package_value, 'hours').format("YYYY-MM-DD HH:mm:ss");
//                 console.log("package expirey date1=>" + package_expiry_date)
//             }
//             query.insertSingle(dbConstants.dbSchema.package_history, requestParam, function(error, packageHistory) {
//                 if (error) {
//                     logger('Error: can not get ', dbConstants.dbSchema.admins);
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 if (requestParam.payment_type == 'wallet') {
//                     let insertObj = {
//                         user_id: requestParam.admin_id,
//                         user_type: 'admin',
//                         amount: requestParam.amount,
//                         transaction_id: moment().unix() + Math.floor((Math.random() * 999999999) + 1),
//                         type: 'substraction',
//                         wallet_transaction_type: 'admin'
//                     }
//                     query.insertSingle(dbConstants.dbSchema.wallet_history, insertObj, async function(error, wallet) {
//                         if (!admin.current_balance || admin.current_balance == '') admin.current_balance = 0;
//                         if (isNaN(admin.current_balance)) {
//                             const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: requestParam.admin_id }, { _id: 0 }, {})
//                             const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
//                             const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
//                             const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
//                             const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
//                             const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
//                             admin.current_balance = finalBalance
//                         }
//                         let current_balance = isNaN(admin.current_balance) ? parseFloat(admin.current_balance) : (parseFloat(admin.current_balance) - parseFloat(requestParam.amount));
//                         query.updateSingle(dbConstants.dbSchema.admins, { current_balance: current_balance, package_expiry_date: package_expiry_date }, {
//                             admin_id: requestParam.admin_id
//                         }, function(error, driverUpdated) {
//                             let obj = {
//                                 package_id: packageHistory.package_id,
//                                 transaction_id: packageHistory.transaction_id,
//                                 admin_id: packageHistory.admin_id,
//                                 buy_date: packageHistory.buy_date,
//                                 display_date: package_expiry_date,
//                             }
//                             done(null, obj);
//                         });
//                     });
//                 } else {
//                     query.updateSingle(dbConstants.dbSchema.admins, { package_expiry_date: package_expiry_date }, {
//                         admin_id: requestParam.admin_id
//                     }, function(error, driverUpdated) {
//                         let obj = {
//                             package_id: packageHistory.package_id,
//                             transaction_id: packageHistory.transaction_id,
//                             admin_id: packageHistory.admin_id,
//                             buy_date: packageHistory.buy_date,
//                             display_date: package_expiry_date,
//                         }
//                         done(null, obj);
//                     });
//                 }
//             });
//         });
//     });
// }
// const packageHistory = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: requestParam.language_id }, (error, language) => {
//         query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
//             query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, (error, admin) => {
//                 if (error) {
//                     logger('Error: can not get ', dbConstants.dbSchema.admins);
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 if (!admin) {
//                     done(errors.driverNotFound(true), null);
//                     return;
//                 }
//                 let joinArr = [{
//                     $lookup: {
//                         from: 'packages',
//                         localField: 'package_id',
//                         foreignField: 'package_id',
//                         as: 'packageDetails'
//                     }
//                 }, {
//                     $unwind: "$packageDetails"
//                 }, {
//                     $sort: { buy_date: -1 }
//                 }, {
//                     $match: { admin_id: requestParam.admin_id }
//                 }, {
//                     $project: {
//                         _id: 0,
//                         package_id: "$package_id",
//                         transaction_id: "$transaction_id",
//                         buy_date: "$buy_date",
//                         title: "$packageDetails.title",
//                         amount: "$packageDetails.amount",
//                         package_type: "$packageDetails.package_type",
//                         package_value: "$packageDetails.package_value",
//                     }
//                 }];
//                 query.joinWithAnd(dbConstants.dbSchema.package_history, joinArr, (error, response) => {
//                     if (error) {
//                         logger('Error: can not get record.');
//                         done(errors.internalServer(true), null);
//                         return;
//                     }
//                     console.log("")
//                     _.each(response, (element, index, list) => {
//                         element.title = element.title[language.code];
//                         element.buy_date = moment(element.buy_date).format('D MMMM, YYYY');
//                         element.amount = setting.currency + element.amount;
//                     });
//                     let todayDate = moment();
//                     let packageDate = moment(admin.package_expiry_date);
//                     if (!admin.package_expiry_date || admin.package_expiry_date == '') {
//                         packageDate = moment();
//                     }
//                     if (moment() > moment(admin.package_expiry_date)) {
//                         packageDate = moment();
//                     }
//                     const remain_time = moment.duration(packageDate.diff(todayDate));
//                     let obj = {
//                         remain_day: humanizeDuration(remain_time.asMilliseconds(), {
//                             language: "shortEn",
//                             languages: {
//                                 shortEn: {
//                                     y: () => "y",
//                                     mo: () => "mo",
//                                     w: () => "w",
//                                     d: () => "d",
//                                     h: () => "h",
//                                     m: () => "m",
//                                     s: () => "s",
//                                     ms: () => "ms",
//                                 },
//                             },
//                             round: true,
//                             units: ["d","h","m"],
//                         }),
//                         data: response
//                     }
//                     done(null, obj);
//                 });
//             });
//         });
//     });
// };
// const walletHistory = function(requestParam, done) {
//     let startDate = new Date(requestParam.date + 'T00:00:00.000Z');
//     let endDate = new Date(requestParam.date + 'T23:59:00.000Z');
//     let columnsAndValues = {
//         created_at: {
//             $gte: startDate,
//             $lte: endDate,
//         },
//         user_id: requestParam.admin_id,
//     };
//     query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
//         query.selectWithAndFilter(dbConstants.dbSchema.wallet_history, columnsAndValues, {
//             _id: 0,
//             transaction_id: 1,
//             amount: 1,
//             type: 1,
//             wallet_id: 1,
//             user_id: 1,
//             created_at: 1,
//             wallet_transaction_type: 1
//         }, { created_at: -1 }, {}, (error, history) => {
//             if (error) {
//                 logger('Error: can not get ', dbConstants.dbSchema.wallet_history);
//                 done(errors.internalServer(true), null);
//                 return;
//             }
//             for (var i = 0; i < history.length; i++) {
//                 history[i] = JSON.parse(JSON.stringify(history[i]));
//                 history[i].amount = setting.currency +' '+history[i].amount;
//                 history[i].display_date = moment(commonHandler.converTotimeZone(history[i].created_at)).format("h:mm A")
//                 if (history[i].wallet_transaction_type == 'consumer') {
//                     history[i].code = 'ADDED_BY_YOU';
//                 } else if (history[i].wallet_transaction_type == 'company' && history[i].type == 'addition') {
//                     history[i].code = 'ADDED_BY_COMPANY';
//                 } else if (history[i].wallet_transaction_type == 'company' && history[i].type == 'substraction') {
//                     history[i].code = 'DEDUCT_BY_COMPANY';
//                 } else if (history[i].wallet_transaction_type == 'invite_friend') {
//                     history[i].code = 'ADDED_BY_REFERRAL_CODE';
//                 } else if (history[i].wallet_transaction_type == 'admin' && history[i].type == 'addition') {
//                     history[i].code = 'ADDED_BY_YOU';
//                 } else if (history[i].wallet_transaction_type == 'admin' && history[i].type == 'substraction') {
//                     history[i].code = 'DEDUCT_BY_WALLET_FOR_PACKAGE'
//                 } else {
//                     history[i].code = 'DEDUCT_FOR_TRIP_BOOKING'
//                 }
//             }
//             done(null, history)
//         });
//     });
// }

/*
 * Used to get trip  haribhagats job using post method
 * @param {Function} done - Callback function with error
 */
// const getTripBackend = function(requestParam, done) {
//     let compairData = {
//         admin_id: requestParam.admin_id,
//         status: tripConstants.status.complete
//     }
//     let joinArr = [{
//         $lookup: {
//             from: 'haribhagats',
//             localField: 'haribhagat_id',
//             foreignField: 'haribhagat_id',
//             as: 'consumerDetails'
//         }
//     }, {
//         $unwind: "$consumerDetails"
//     }, {
//         $lookup: {
//             from: 'admins',
//             localField: 'admin_id',
//             foreignField: 'admin_id',
//             as: 'driverDetails'
//         }
//     }, {
//         $unwind: "$driverDetails"
//     }, {
//         $match: compairData
//     }, {
//         $project: {
//             _id: 0,
//             id: "$trip_id",
//             trip_id: "$trip_id",
//             consumer: "$consumerDetails.first_name",
//             admin: "$driverDetails.first_name",
//             trip_date: "$trip_datetime",
//             start_address: "$start_address",
//             finish_address: "$finish_address",
//             created_at: "$created_at",
//             price: "$amount_pay",
//             //price: "$total_price",
//             status: "$status",
//         }
//     }];
//     query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, async (error, response) => {
//         const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {} , { currency  : 1  })
//         if (error) {
//             logger('Error: can not get record.');
//             done(errors.internalServer(true), null);
//             return;
//         }
//         _.each(response, function(data) {
//             // data.trip_date = moment(data.trip_date).format("Do MMM YYYY h:mm A")
//             data.trip_date = moment(commonHandler.converTotimeZone(data.trip_date)).format("Do MMM YYYY h:mm A")
//             data.date = data.created_at
//             data.price = parseFloat(data.price.replace(/^\D+/g, ''))
//         });
//         done(null, response)
//     });
// }

/*
 * Used to get credit of admin
 * @param {creditDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const getCreditBackend = function(creditDetails, req, done) {
//     console.log("creditDetails");
//     console.log(creditDetails);
//     let compairData = {
//         user_id: creditDetails.admin_id
//     }
//     let columnsAndValues = [];
//     query.selectWithAnd(dbConstants.dbSchema.wallet_history, compairData, function(error, credits) {
//         for (var i = 0; i < credits.length; i++) {
//             credits[i] = JSON.parse(JSON.stringify(credits[i]));
//             credits[i].created_at = moment(credits[i].created_at).format('llll');
//         }
//         done(null, credits);
//     });
// };

//for image Upload on AWS

// const withDrawPaidReq = function (requestParam, done) {
//     let updateColumnsAndValues = {
//         status: 'Paid',
//     }
//     query.updateAndFindSingle(dbConstants.dbSchema.transfer_requests, updateColumnsAndValues, {
//         transfer_id: requestParam.transfer_id, admin_id: requestParam.admin_id
//     }, { admin_id: 1, amount : 1 }, async function (error, updatedTransfer) {
//         // await query.insertSinglePromise(dbConstants.dbSchema.charge_earnings, { $inc: { total_cashout: requestParam.amount * -1 } }, { admin_id: requestParam.admin_id })
//         done(null, updatedTransfer);
//     });
// };

//for image Upload on AWS

// const withDrawUnpaidReq = function(requestParam, done) {
//     query.selectWithAndOneNew(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, {
//         _id: 0,
//         admin_id: 1,
//         first_name: 1,
//         last_name: 1,
//         language_id: 1,
//         email: 1,
//         total_earned: 1,
//         total_cashout: 1

//     }, (error, admin) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.settings);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!admin) {
//             logger('Error: resource not found');
//             done(errors.resourceNotFound(true), null);
//             return;
//         }
//         //requestParam.status = 'Unpaid';
//         let updateColumnsAndValues = {
//             status: 'Reject',
//             reason: requestParam.reason
//         }
//         query.selectWithAndOneNew(dbConstants.dbSchema.languages, { language_id: admin.language_id }, {
//             _id: 0,
//             code: 1,
//             language_id: 1,
//         }, (error, language) => {
//             let languageCode = language.code || 'EN';
//             query.selectWithAndOneNew(dbConstants.dbSchema.settings, {}, {
//                 _id: 0,
//                 currency: 1,
//                 admin_email: 1,
//             }, (error, setting) => {
//                 query.selectWithAndOne(dbConstants.dbSchema.email_templates, { code: 'RJCO' }, function(error, template) {
//                     if (error) {
//                         logger('Error: can not get ', dbConstants.dbSchema.email_templates);
//                         done(errors.internalServer(true), null);
//                         return;
//                     }
//                     let emailDescription = (template.description[languageCode] || '');
//                     let findArr = [];
//                     let replaceArr = [];

//                     findArr = ['#DRIVERID#', '#NAME#', '#ID#', '#AMOUNT#', '#REASON#'];
//                     replaceArr = [admin.admin_id, admin.first_name + ' ' + admin.last_name, requestParam.transfer_id, setting.currency + '' + requestParam.amount, requestParam.reason];

//                     let emailSubject = template.email_subject;
//                     const data = {
//                         from: setting.admin_email,
//                         to: admin.email,
//                         subject: emailSubject,
//                         html: (findArr.length > 0) ? replaceOnce(emailDescription, findArr, replaceArr, 'gi') : emailDescription,
//                     };
//                     const params = {
//                         Destination: {
//                             ToAddresses: [data.to]
//                         },
//                         Message: {
//                             Body: {
//                                 Html: {
//                                     Charset: 'UTF-8',
//                                     Data: data.html
//                                 }
//                             },
//                         Subject: {
//                             Charset: 'UTF-8',
//                             Data: data.subject
//                         }
//                     },
//                     ReturnPath: data.from,
//                         Source: data.from,
//                     };
//                     query.updateAndFindSingle(dbConstants.dbSchema.transfer_requests, updateColumnsAndValues, {
//                         transfer_id: requestParam.transfer_id, admin_id: requestParam.admin_id
//                     }, { _id: 0, amount: 1 }, async function (error, updatedTransfer) {
//                         await query.updateSingleWithPromise(dbConstants.dbSchema.admins, { $inc: { total_cashout: parseFloat(parseFloat(updatedTransfer.amount) + 1) } }, { admin_id: requestParam.admin_id })
//                         commonHandler.sendEmailToUser(data, (err, data) => {
//                             if (err) {
//                                 console.log(err, err.stack);
//                             } 
//                             done(null, updatedTransfer);
//                             return;
//                         })

//                     })
//                     /*const mailgun = require('mailgun-js')({
//                         apiKey: config.mailgunInfo.api_key,
//                         domain: config.mailgunInfo.domain
//                     });

//                     mailgun.messages().send(data, function(error, body) {
//                         query.updateSingle(dbConstants.dbSchema.transfer_requests, updateColumnsAndValues, {
//                             transfer_id: requestParam.transfer_id
//                         }, function(error, updatedTransfer) {
//                             query.updateSingle(dbConstants.dbSchema.admins, { $inc: { total_cashout: requestParam.amount } }, { admin_id: requestParam.admin_id }, function(error, driverUpdated) {
//                                 //done(null,transfer_req);
//                                 done(null, updatedTransfer);
//                             });
//                         })
//                     });*/

//                 })
//             });
//         })
//     });
// };

function getImageNameFromURL(URL) {
    if (URL) {
        var mainImageUploadURL = URL; //uploadPhoto = AWS return object 
        var normalImageUploadURL = mainImageUploadURL.lastIndexOf('/');
        var finalImageURL = mainImageUploadURL.substring(normalImageUploadURL + 1);
        return finalImageURL;
    }
}

function generateFullURL(imgName) {
    if (imgName) {
        return config.AWS_BASE_URL + "/" + bucketNameProfile + "/" + imgName
    }
}

function pushFullUrlInObj(Obj) {
    let bucket = config.aws.s3.driverBucket;
    for (const vehicle of Obj) {
        vehicle.road_tax = config.AWS_BASE_URL + "/" + bucket + "/" + vehicle.road_tax
        vehicle.insurance_photo = config.AWS_BASE_URL + "/" + bucket + "/" + vehicle.insurance_photo
        vehicle.vehicle_photo_front = config.AWS_BASE_URL + "/" + bucket + "/" + vehicle.vehicle_photo_front
        vehicle.vehicle_photo_rear = config.AWS_BASE_URL + "/" + bucket + "/" + vehicle.vehicle_photo_rear
        vehicle.vehicle_photo_right = config.AWS_BASE_URL + "/" + bucket + "/" + vehicle.vehicle_photo_right
        vehicle.vehicle_photo_left = config.AWS_BASE_URL + "/" + bucket + "/" + vehicle.vehicle_photo_left
    }
    return Obj;
}
const restoreArchiveDriver = function (driverDetails, done) {
    let columnsToUpdate = {
        is_archive: 'false',
        status: driverConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.admins, columnsToUpdate, { 'admin_id': { $in: driverDetails } }, function (error, admin) {
        if (error) {
            logger('Error: can not update admin');
            done(error, null);
            return;
        }
        // var userRef = config.firebase.userRef;
        // var newData = {};
        done(null, admin);
    });
};

// const getSetting = async function (requestParam, req, done) {
//     const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { driver_offline_time : 1 });
//     return setting;
// }


module.exports = {
    updateAppVersionCode: updateAppVersionCode,
    driverRegister: driverRegister,
    authentication: authentication,
    getDriverProfile: getDriverProfile,
    updateDriverProfile: updateDriverProfile,
    changePassword: changePassword,
    forgotpassword: forgotpassword,
    deleteAccount: deleteAccount,
    getDriver: getDriver,
    activeDriver: activeDriver,
    updateUserSettings: updateUserSettings,
    inactiveDriver: inactiveDriver,
    deleteDriver: deleteDriver,
    createAdmin: createAdmin,
    loginAdminWeb: authenticationWeb,
    updateDriver: updateDriver,
    restoreArchiveDriver,
    removePhoto: removePhoto,
    // getDriverRating: getDriverRating,
    // getFirebaseDrivers: getFirebaseDrivers,
    // deleteFirebaseDrivers: deleteFirebaseDrivers,
    // notificationStatusUsingFirebase: notificationStatusUsingFirebase,
    // checkEmailExist: checkEmailExist,
    // getDriverPost: getDriverPost,
    // notificationStatus: notificationStatus,
    // updateDriverLocation: updateDriverLocation,
    // driverIsComing: driverIsComing,
    // loginAdmin:authentication,
    // getTrip: getTrip,
    // addCredit: addCredit,
    // getCredit: getCredit,
    // updateCredit: updateCredit,
    // uploadImageLicense: uploadImageLicense,
    // uploadImageProfile: uploadImageProfile,
    // getFirebaseTrips,
    // getFirebaseDriverLatLng,
    // getFirebaseDriverScheduleTrip,
    // trackBackend,
    // getMapboxDrivers,
    // getAssignDriverList,
    // actionUpdateProvider,
    // otpVerification,
    // checkEmailMobile,
    // addVehicleBackend,
    // getVehicleBackend,
    // deleteVehicleBackend,
    // resendOtp,
    // getDriverLastStatus,
    // addWallet,
    // getWallet,
    // buyPackage,
    // packageHistory,
    // walletHistory,
    // getTripBackend,
    // getCreditBackend,
    // getConsumerRating,
    // withDrawPaidReq,
    // withDrawUnpaidReq,
    // makeTripPayment,
    // getSetting:getSetting
};
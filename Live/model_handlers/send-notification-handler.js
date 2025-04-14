'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Send_notification = require('./../models/send-notification');
const config = require('./../config');
const apn = require('apn');
const FCM = require('fcm-node');

// // code for ios push notification
// const p8FilePath = config.push_notification.p8FilePath;
// let options = {
//     token: {
//         key: p8FilePath,
//         keyId: config.push_notification.key_id,
//         teamId: config.push_notification.team_id
//     },
//     production: true
// };
// const apnProvider = new apn.Provider(options);
// // end of code for ios push notification

// code for android push notification
const serverKey = config.push_notification.server_key; //put your server key here
const fcm = new FCM(serverKey);
// end of code for android push notification



/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getNotification = function(requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.send_notifications, {}, function(error, data) {
        if (error) {
            logger('Error: can not get send_notifications', dbConstants.dbSchema.send_notifications);
            done(error, null);
            return;
        }
        data = JSON.parse(JSON.stringify(data))
        _.each(data, singleData => {
            singleData.total_users = singleData.users.length
        })
        done(null, data);
    });
};


/*
 * Used to create cms 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createNotication = function(requestParam, done) {
    requestParam.users = _.pluck(requestParam.users, 'value');
    query.insertSingle(dbConstants.dbSchema.send_notifications, requestParam, function(error, data) {
        if (error) {
            logger('Error: can not create send_notifications');
            done(error, null);
            return;
        }
        sendNotification(requestParam);
        done(null, data);
    });
};


const sendNotification = function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, function(error, setting) {
        async.forEachSeries(requestParam.users, function(singleRec, callback_singleRec) {
            query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { haribhagat_id: singleRec, status: 'Active' }, function(error, data) {
                if (data == null) {
                    callback_singleRec();
                } else {
                    if (data.device_type == 'android' && data.notification == 'On') {
                        const message = {
                            to: data.device_token,
                            collapse_key: 'green',
                            data: {
                                data: {
                                    messageFrom: 'Cab',
                                    message: requestParam.message,
                                    push_type: requestParam.title,
                                    name: '',
                                    date: '',
                                    type: '',
                                    status_caption: ''
                                }
                            }
                        };
                        fcm.send(message, function(err, response) {
                            console.log(data.first_name)
                            console.log(response);
                            let notificationObj = {
                                app_user_id: singleRec,
                                name: '',
                                message: requestParam.message,
                                status: (err) ? 'failure' : 'success'
                            }
                            query.insertSingle(dbConstants.dbSchema.notificationlogs, notificationObj, (error, notification) => {
                                if (error) {
                                    logger('Error: can not add notification');
                                    done(errors.internalServer(true), null);
                                    return;
                                }
                                callback_singleRec();
                            })
                        });
                    } else if (data.device_type == 'ios' && data.notification == 'On') {
                        const deviceToken = data.device_token;
                        let note = new apn.Notification();
                        note.expiry = Math.floor(Date.now() / 1000) + 3600;
                        note.badge = 1;
                        note.sound = "ping.aiff";
                        note.alert = requestParam.title;
                        note.payload.body = {
                            messageFrom: 'Cab',
                            message: requestParam.message,
                            push_type: requestParam.title,
                            name: data.first_name,
                            date: '',
                            type: '',
                            status_caption: '',
                            order_id: ''
                        };
                        note.topic = config.push_notification.bundle_id_consumer;
                        console.log(setting.is_production)
                        console.log(data.first_name)
                            // code for ios push notification
                        const p8FilePath = config.push_notification.p8FilePath;
                        let options = {
                            token: {
                                key: p8FilePath,
                                keyId: config.push_notification.key_id,
                                teamId: config.push_notification.team_id
                            },
                            production: setting.is_production
                        };
                        const apnProvider = new apn.Provider(options);
                        // end of code for ios push notification

                        apnProvider.send(note, deviceToken).then((result) => {
                            console.log(result);
                            let notificationObj = {
                                app_user_id: singleRec,
                                name: data.first_name,
                                message: requestParam.message,
                                status: 'success'
                            }
                            query.insertSingle(dbConstants.dbSchema.notificationlogs, notificationObj, (error, notification) => {
                                if (error) {
                                    logger('Error: can not add notification');
                                    done(errors.internalServer(true), null);
                                    return;
                                }
                                console.log(notification)
                                callback_singleRec();
                            })
                        });
                    } else {
                        console.log(data.first_name)
                        console.log("else")
                        callback_singleRec();
                    }
                }
            });
        }, function() {
            console.log("success");
            return;
        });
    });
}

const getUsers = function(requestParam, done) {
    if (requestParam.type == 'consumer') {
        query.selectWithAnd(dbConstants.dbSchema.haribhagats, { status: 'Active' }, function(error, data) {
            if (error) {
                logger('Error: can not get haribhagats', dbConstants.dbSchema.haribhagats);
                done(error, null);
                return;
            }
            for (var i = 0; i < data.length; i++) {
                data[i] = JSON.parse(JSON.stringify(data[i]));
                if (!data[i].first_name || data[i].first_name == '') {
                    data[i].name = data[i].mobile;
                } else {
                    data[i].name = data[i].first_name + ' ' + data[i].last_name;
                }
                data[i].user_id = data[i].haribhagat_id
            }
            done(null, data);
        });
    }
}

const getCustomerName = function(requestParam, done) {
    let compairData = {
        haribhagat_id: { $in: requestParam }
    }
    query.selectWithAnd(dbConstants.dbSchema.haribhagats, compairData, function(error, data) {
        if (error) {
            logger('Error: can not get haribhagats', dbConstants.dbSchema.haribhagats);
            done(error, null);
            return;
        }
        done(null, data);
    });
}


module.exports = {
    getNotification,
    createNotication,
    getUsers,
    sendNotification,
    getCustomerName
};
'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Setting = require('./../models/setting');
const moment = require('moment');
const passwordHandler = require('./../utils/password-handler');
const config = require('./../config');
const driverHandler = require('./../model_handlers/admin-handler');
const commonHandler = require('./../model_handlers/common-handler')
    /*
     * Used to get url 
     * @param {requestParam} - request parameters from body
     * @param {Function} done - Callback function with error, data params
     */
const getSetting = function(requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.settings, function(error, setting) {
        if (error) {
            logger('Error: can not get setting data');
            done(error, null);
            return;
        }
        done(null, setting);
    });
};


/*
 * Used to update administrator by id 
 * @param {userDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateSetting = function(userDetails, done) {
    query.updateSingle(dbConstants.dbSchema.settings, userDetails, { _id: userDetails._id }, function(error, setting) {
        if (error) {
            logger('Error: can not update setting');
            done(error, null);
            return;
        }
        done(null, setting);
    });
};


/*
 * Used to resetpasswprd
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const resetPassword = function(requestParam, done) {
    let subId = requestParam.code.substring(0, 3);
    if (subId == 'CUS') {
        passwordHandler.newHash(requestParam.password, (hashedPW) => {
            requestParam.password = hashedPW;
        });
        let columnAndValuesUpdate = {
            verification_code: '',
            password: requestParam.password
        }
        query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { verification_code: requestParam.code }, function(error, customer) {
            if (customer == null) {
                done(null, '0');
            } else {
                query.updateSingle(dbConstants.dbSchema.haribhagats, columnAndValuesUpdate, { haribhagat_id: customer.haribhagat_id }, function(error, updateConsumer) {
                    if (error) {
                        done(null, '0');
                    } else {
                        done(null, '1');
                    }
                });
            }
        });
    } else if (subId == 'DRI') {
        passwordHandler.newHash(requestParam.password, (hashedPW) => {
            requestParam.password = hashedPW;
        });
        let columnAndValuesUpdate = {
            code: '',
            password: requestParam.password
        }
        query.selectWithAndOne(dbConstants.dbSchema.admins, { code: requestParam.code }, function(error, provider) {
            if (provider == null) {
                done(null, '0');
            } else {
                query.updateSingle(dbConstants.dbSchema.admins, columnAndValuesUpdate, { admin_id: provider.admin_id }, function(error, updateConsumer) {
                    if (error) {
                        done(null, '0');
                    } else {
                        done(null, '1');
                    }
                });
            }
        });
    } else {
        passwordHandler.newHash(requestParam.password, (hashedPW) => {
            requestParam.password = hashedPW;
        });
        let columnAndValuesUpdate = {
            code: '',
            password: requestParam.password
        }
        query.selectWithAndOne(dbConstants.dbSchema.administrators, { code: requestParam.code }, function(error, admin) {
            if (admin == null) {
                done(null, '0');
            } else {
                query.updateSingle(dbConstants.dbSchema.administrators, columnAndValuesUpdate, { admin_id: admin.admin_id }, function(error, updateAdmin) {
                    if (error) {
                        done(null, '0');
                    } else {
                        done(null, '1');
                    }
                });
            }
        });
    }
};

/*
 * Used to send notification admin for schedule ride 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const notificationScheduleTirp = function(requestParam, done) {
    console.log("requestParam")
    console.log(requestParam)
    let columnAndValuesSchedule = {
        status: 'New'
    }
    columnAndValuesSchedule['$or'] = [{
        book_type: 'Schedule'
    }, {
        book_type: 'Later'
    }];
    let todayDate = moment(new Date());

    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, function(error, setting) {
        query.selectWithAnd(dbConstants.dbSchema.trips, columnAndValuesSchedule, function(error, trips) {
            if (error) {
                logger('Error: can not get trips data');
                done(error, null);
                return;
            }

            let columnsAndValues = [];
            async.forEachSeries(trips, function(singleTrip, Callback_s1) {
                // let scheduleDate = moment(singleTrip.schedule_datetime);
                let scheduleDate = moment(commonHandler.converTotimeZone(singleTrip.schedule_datetime))
                    // let diffMinutes = scheduleDate.diff(todayDate, 'minutes');
                let diffMinutes = scheduleDate.diff(todayDate, 'minutes');
                console.log("diffMinutes=>" + diffMinutes)
                if (diffMinutes == setting.schedule_trip_time) {
                    console.log("call");
                    driverHandler.getFirebaseDriverScheduleTrip(singleTrip, (err, admin) => {
                        _.each(singleTrip.requested_drivers, (element, index, list) => {
                            let ref = config.firebase.providerRef.ref('assigntrip_api/' + element + '/').set({
                                status: 'new',
                            });
                        });
                        Callback_s1();
                    });
                } else {
                    Callback_s1();
                }
            }, function() {
                done(null, 'Sccessfully send.');
            });
        });
    });
};

/*
 * Used to send notification admin for schedule ride 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const notAcceptTripCron = function(requestParam, done) {
    let columnAndValuesSchedule = {
        book_type: 'Now',
        status: 'New'
    }
    let todayDate = moment(new Date());
    console.log("In Not Accept Trip")
    query.selectWithAndOneNew(dbConstants.dbSchema.settings, {}, { _id: 0, consumer_trip_time_out: 1 }, (error, setting) => {
        if (error) {
            logger('Error: can not get trips data');
            done(error, null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.trips, columnAndValuesSchedule, function(error, trips) {
            if (error) {
                logger('Error: can not get trips data');
                done(error, null);
                return;
            }
            let columnsAndValues = [];
            async.forEachSeries(trips, function(singleTrip, Callback_s1) {
                // let scheduleDate = moment(singleTrip.created_at);
                let scheduleDate = moment(commonHandler.converTotimeZone(singleTrip.created_at));
                let diffMinutes = todayDate.diff(scheduleDate, 'minutes');
                console.log("diffMinutes1=>" + diffMinutes)
                    //if(diffMinutes>=5){
                if (diffMinutes >= setting.consumer_trip_time_out) {

                    driverHandler.getFirebaseTrips({ status: 'not_accept', admin: '', trip_id: singleTrip.trip_id }, (err, firebase) => {
                        Callback_s1();
                    });
                } else {
                    Callback_s1();
                }
            }, function() {
                done(null, 'Sccessfully Fired Cron.');
            });
        });
    })
};

const notAcceptSheduleTripCron = function(requestParam, done) {
    let columnAndValuesSchedule = {
        status: 'New'
    }
    columnAndValuesSchedule['$or'] = [{
        book_type: 'Schedule'
    }, {
        book_type: 'Later'
    }];
    let todayDate = moment(new Date());
    console.log("In Not Accept shedule  Trip")
    query.selectWithAndOneNew(dbConstants.dbSchema.settings, {}, { _id: 0, consumer_trip_time_out: 1 }, (error, setting) => {
        if (error) {
            logger('Error: can not get trips data');
            done(error, null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.trips, columnAndValuesSchedule, function(error, trips) {
            if (error) {
                logger('Error: can not get trips data');
                done(error, null);
                return;
            }
            console.log(JSON.stringify(trips))
            let columnsAndValues = [];
            async.forEachSeries(trips, function(singleTrip, Callback_s1) {
                // let scheduleDate = moment(singleTrip.created_at);
                let scheduleDate = moment(singleTrip.schedule_datetime);
                let diffMinutes = todayDate.diff(scheduleDate, 'minutes');
                console.log("diffMinutes=>" + diffMinutes)
                    //if(diffMinutes>=5){
                if (diffMinutes >= setting.consumer_trip_time_out) {
                    console.log("call--1");
                    driverHandler.getFirebaseTrips({ status: 'not_accept', admin: '', trip_id: singleTrip.trip_id }, (err, firebase) => {
                        query.updateSingle(dbConstants.dbSchema.trips, { status: 'Cancel' }, { trip_id: singleTrip.trip_id }, (error, response) => {
                            if (error) {
                                console.log("error while update status in firebase")
                            }
                            const columnsAndValuesConsumer = {
                                trip_id: singleTrip.trip_id,
                                title: `Your schedule ride ${singleTrip.trip_id} Canclled`,
                                type : "cancle_schedule_trip"
                            }
                            notificationHandler.sendNotificationConsumer(columnsAndValuesConsumer, (err, rows) => { 
                                if (err) {
                                    console.log("error while sent notification")
                                }
                                Callback_s1();
                            })

                            // done(null, {})
                            // return
                        })

                    });
                } else {
                    Callback_s1();
                }
            }, function() {
                done(null, 'Sccessfully Fired Cron.');
            });
        });
    })
};

/*
 * Used to resetpasswprd
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const paymentType = function(requestParam, done) {
    query.updateSingle(dbConstants.dbSchema.settings, requestParam, {}, function(error, updateAdmin) {
        if (error) {
            done(null, '0');
        } else {
            done(null, '1');
        }
    });
};

const paymentTypeList = async (requestParam, done) => {
    try {
        const list = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id : 0, is_cash: 1, is_wallet: 1, is_stripe: 1 })
        done(null, list)
    } catch (error) {
        logger('Error: can not get payment list type');
        done(error, null);
        return;
    }
}
module.exports = {
    getSetting: getSetting,
    updateSetting: updateSetting,
    resetPassword: resetPassword,
    notificationScheduleTirp,
    notAcceptTripCron,
    paymentType,
    notAcceptSheduleTripCron,
    paymentTypeList
};
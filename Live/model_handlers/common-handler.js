'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const config = require('./../config');

// const mailgun = require('mailgun-js')({
//     apiKey: config.mailgunInfo.api_key,
//     domain: config.mailgunInfo.domain,
// });
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//SES
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: config.aws.keyId,
    secretAccessKey: config.aws.key,
    region: config.aws.sesRegion
});
const awsSES = new AWS.SES({apiVersion: '2010-12-01'});
//ses

const replaceOnce = require('replace-once');

// const moment = require('moment');
const S3Handler = require('./../utils/s3-handler');
const s3Handler = new S3Handler();
const {
    generateString
} = require('./../utils/random-string-generator');

const twilio = require('twilio');
// const accountSid = config.twilio.accountSid;
// const authToken = config.twilio.authToken;
// let client = new twilio(accountSid, authToken);
const moment = require('moment-timezone')
const S3Manager = require('./../utils/s3-manager');
const { formatString } = require('./../utils/stringGenerator');
const request = require('request');
const tripConstants = require('./../constants/trip-constants');
const FCM = require('fcm-node');
const apn = require('apn');
const fs = require('fs')

/*
 * This function will delete all data of admin and its all relational data from database
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteDriverDataPermanently = function(requestParam, done) {
    const asyncForEach = async(array, callback) => {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array)
        }
    }
    return new Promise(async(resolve, reject) => {
        try {
            const start = async() => {
                await asyncForEach(requestParam, async(admin_id) => {
                    try {
                        query.selectWithAndOne(dbConstants.dbSchema.admins, { 'admin_id': admin_id }, function(error, admins) {
                            if (error) {
                                reject(errors.internalServer(true))
                                return
                            }
                            let images = {};
                            images = [
                                admins.profile_picture,
                                admins.nric_front,
                                admins.nric_back,
                                admins.driver_license,
                                admins.driver_license_back
                            ]
                            let vehicles = admins.vehicles
                            vehicles.forEach(vehicles_arr => {
                                images.push(vehicles_arr.road_tax)
                                images.push(vehicles_arr.insurance_photo)
                                images.push(vehicles_arr.vehicle_photo_front)
                                images.push(vehicles_arr.vehicle_photo_rear)
                                images.push(vehicles_arr.vehicle_photo_right)
                                images.push(vehicles_arr.vehicle_photo_left)
                            });
                            let bucketName = config.aws.s3.driverBucket;
                            let imagedelete = S3Manager.removeMultiImages(images, bucketName)
                            let response = DeleteFromCollection(dbConstants.dbSchema.contact_us, 'user_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.rating_reviews, 'from_user_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.rating_reviews, 'to_user_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.notificationlogs, 'user_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.package_history, 'admin_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.tripdrivers, 'admin_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.wallet_history, 'user_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.trips, 'admin_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.transfer_requests, 'admin_id', admin_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.admins, 'admin_id', admin_id)
                            resolve(response)
                        });
                    } catch (error) {
                        reject(errors.internalServer(true))
                        return
                    }
                })
            }
            start()
        } catch (error) {
            reject(errors.internalServer(true))
            return
        }
    })
};

/*
 * This function will delete all data of consumer and its all relational data from database
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteConsumerDataPermanently = function(requestParam, done) {
    console.log("requestParam")
    console.log(requestParam)
    const asyncForEach = async(array, callback) => {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array)
        }
    }
    return new Promise(async(resolve, reject) => {
        try {
            const start = async() => {
                await asyncForEach(requestParam, async(haribhagat_id) => {
                    try {
                        query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { 'haribhagat_id': haribhagat_id }, function(error, consumer) {
                            if (error) {
                                reject(errors.internalServer(true))
                                return
                            }
                            let bucketName = config.aws.s3.consumerBucket;
                            let images = [
                                consumer.profile_picture,
                                consumer.nric_photo,
                                consumer.passport_photo
                            ]
                            let imagedelete = S3Manager.removeMultiImages(images, bucketName)
                            let response = DeleteFromCollection(dbConstants.dbSchema.trips, 'haribhagat_id', haribhagat_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.contact_us, 'user_id', haribhagat_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.rating_reviews, 'from_user_id', haribhagat_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.rating_reviews, 'to_user_id', haribhagat_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.notificationlogs, 'user_id', haribhagat_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.wallet_history, 'user_id', haribhagat_id)
                            response = DeleteFromCollection(dbConstants.dbSchema.haribhagats, 'haribhagat_id', haribhagat_id)
                            resolve(response)
                        });
                    } catch (error) {
                        reject(errors.internalServer(true))
                        return
                    }
                })
            }
            start()
        } catch (error) {
            reject(errors.internalServer(true))
            return
        }
    })
};

const DeleteFromCollection = (model, field, value) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (field == 'haribhagat_id') {
                query.removeMultipleformDb(model, { haribhagat_id: value }, function(error, data) {
                    if (error) {
                        reject(errors.internalServer(true))
                        return;
                    }
                    resolve(data)
                });
            } else if (field == 'user_id') {
                query.removeMultipleformDb(model, { user_id: value }, function(error, data) {
                    if (error) {
                        reject(errors.internalServer(true))
                        return;
                    }
                    resolve(data)
                });
            } else if (field == 'to_user_id') {
                query.removeMultipleformDb(model, { to_user_id: value }, function(error, data) {
                    if (error) {
                        reject(errors.internalServer(true))
                        return;
                    }
                    resolve(data)
                });
            } else if (field == 'from_user_id') {
                query.removeMultipleformDb(model, { from_user_id: value }, function(error, data) {
                    if (error) {
                        reject(errors.internalServer(true))
                        return;
                    }
                    resolve(data)
                });
            } else if (field == 'admin_id') {
                query.removeMultipleformDb(model, { admin_id: value }, function(error, data) {
                    if (error) {
                        reject(errors.internalServer(true))
                        return;
                    }
                    resolve(data)
                });
            }

        } catch (error) {
            reject(errors.internalServer(true))
            return
        }
    })
};
/*
 * Used to get admin with get methods
 * @param {Function} done - Callback function with error
 */
const getArchivedData = function(requestParam, done) {
    console.log(requestParam);
    if (requestParam.type == 'admin') {
        let joinArr = [{
                "$match": { is_archive: 'true' }
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
                    totaljobs: "$tripsDetails.status",
                    id: "$admin_id",
                    admin_id: "$admin_id",
                    name: {
                        $concat: ["$first_name", " ", "$last_name"]
                    },
                    email: "$email",
                    mobile_country_code: "$mobile_country_code",
                    mobile: "$mobile",
                    created_at: "$created_at",
                    created_date: "$created_at",
                    current_balance: "$current_balance",
                    otp: "$otp",
                    online_status: "$online_status",
                    is_login: "$is_login",
                    status: "$status",
                    status_driver: "$tripsDetails.status"
                }
            },
            { $sort: { created_at: -1 } }
        ];
        query.joinWithAnd(dbConstants.dbSchema.admins, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            _.each(response, function(data) {
                data.mobile = formatString(data.mobile);
            })
            done(null, response)
        });
    } else {
        let joinArr = [{
                "$match": { is_archive: 'true' }
            }, {
                $lookup: {
                    from: 'trips',
                    localField: 'haribhagat_id',
                    foreignField: 'haribhagat_id',
                    as: 'tripsDetails'
                }
            }, {
                $project: {
                    _id: 0,
                    totaljobs: "$tripsDetails.status",
                    id: "$haribhagat_id",
                    haribhagat_id: "$haribhagat_id",
                    name: { $concat: ["$first_name", " ", "$last_name"] },
                    email: "$email",
                    mobile_country_code: "$mobile_country_code",
                    mobile: "$mobile",
                    created_at: "$created_at",
                    status: "$status",
                    verification_code: "$verification_code",
                }
            },
            { $sort: { created_at: -1 } }
        ];
        query.joinWithAnd(dbConstants.dbSchema.haribhagats, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            _.each(response, function(data) {
                data.mobile = formatString(data.mobile);
            })
            done(null, response)
        });
    }


};
/*
 * Used to upload image on s3 bucket
 * @param {requestParam}
 * @param {Function} done - Callback function with error, data params
 */
const uploadImage = (req, requestParam, done) => {
    let bucketName;
    if (requestParam.type) {
        bucketName = config.aws.s3.consumerBucket;
    } else {
        bucketName = config.aws.s3.driverBucket;
    }
    let randomStr = generateString(8, true, false, false);
    console.log("-------------req.name----------------",req.name)
    let fileType = req.name.split('.').pop();
    req['file_name'] = moment().unix() + randomStr + '.' + fileType;
    s3Handler.upload(req, bucketName, fileType, (error, imageData) => {
        if (error) {
            logger('Error: can not upload image on aws server', '');
            done(errors.internalServer(true), null);
            return;
        }
        console.log(imageData.Location)
        done(null, imageData.Location);
    });
};

/* 
 * notification logs
 * @param {requestParam} - user_type required
 * @param {Function} done - Callback function with error, data params
 */
const getNotificationLog = (requestParam, req, done) => {
    let columnsAndValues = [];
    query.selectWithAnd(dbConstants.dbSchema.notificationlogs, {}, (error, getNotificationLog) => {
        if (error) {
            logger('Error: can not get getNotificationLog', dbConstants.dbSchema.notificationlogs);
            done(errors.internalServer(true), null);
            return;
        }
        console.log("notification=>" + getNotificationLog)
        getNotificationLog = JSON.parse(JSON.stringify(getNotificationLog))
        for (let x in getNotificationLog) {
            // getNotificationLog.formated_date = moment(getNotificationLog[x].created_at).format('YYYY-MM-DD')
            // getNotificationLog.formated_time = moment(getNotificationLog[x].created_at).format('HH:mm:ss')
            getNotificationLog.formated_date = moment(converTotimeZone(getNotificationLog[x].created_at)).format('YYYY-MM-DD')
            getNotificationLog.formated_time = moment(converTotimeZone(getNotificationLog[x].created_at)).format('HH:mm:ss')
        }
        console.log(getNotificationLog)
        done(null, getNotificationLog);
    });
};


/*
 * Used to delete notification log us by id
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteNotificationLog = function(notificationDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.notificationlogs, {
        'notification_log_id': {
            $in: notificationDetails
        }
    }, function(error, notification) {
        if (error) {
            logger('Error: can not delete notification');
            done(error, null);
            return;
        }
        done(null, notification);
    });
};

/*
 * feedback
 * @param {requestParam} - user_type required
 * @param {Function} done - Callback function with error, data params
 */
const getFeedback = (requestParam, req, done) => {
    let columnsAndValues = [];
    query.selectWithAnd(dbConstants.dbSchema.feedbacks, {}, (error, getFeedback) => {
        if (error) {
            logger('Error: can not get getFeedback', dbConstants.dbSchema.feedbacks);
            done(errors.internalServer(true), null);
            return;
        }
        done(null, getFeedback);
    });
};

/*
 * contactUs
 * @param {requestParam} - user_type required
 * @param {Function} done - Callback function with error, data params
 */
const getContactUs = (requestParam, req, done) => {
    let columnsAndValues = [];
    query.selectWithAnd(dbConstants.dbSchema.contact_us, {}, (error, getContactUs) => {
        if (error) {
            logger('Error: can not get getContactUs', dbConstants.dbSchema.contact_us);
            done(errors.internalServer(true), null);
            return;
        }
        getContactUs = _.sortBy(getContactUs, 'created_at').reverse();
        getContactUs = JSON.parse(JSON.stringify(getContactUs))
        _.each(getContactUs, function(data) {
            data.created_at = moment(data.created_at).format("Do MMM YYYY h:mm A")
                //console.log(moment(data.created_at).format("Do MMM YYYY h:mm A"))
        })
        done(null, getContactUs);
    });
};

/*
 * Used to delete contact us by id
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteContactUS = function(ContactUsDetail, done) {
    query.removeMultiple(dbConstants.dbSchema.contact_us, {
        'contact_us_id': {
            $in: ContactUsDetail
        }
    }, function(error, contact) {
        if (error) {
            logger('Error: can not delete Contact us');
            done(error, null);
            return;
        }
        done(null, contact);
    });
};
/*
 * Used to delete contact us by id
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteFeedback = function(feedbackDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.feedbacks, {
        'feedback_id': {
            $in: feedbackDetails
        }
    }, function(error, feedbacks) {
        if (error) {
            logger('Error: can not delete feedbacks');
            done(error, null);
            return;
        }
        done(null, feedbacks);
    });
};

/*
 * Used to create contact us by id
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const contactUS = function(requestParam, done) {
    if (requestParam.user_type == 'consumer') {
        query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
            haribhagat_id: requestParam.user_id
        }, (error, consumer) => {
            requestParam.name = consumer.first_name + ' ' + consumer.last_name;
            requestParam.email = consumer.email;
            requestParam.mobile = consumer.mobile;
            query.insertSingle(dbConstants.dbSchema.contact_us, requestParam, function(error, contact_us) {
                if (error) {
                    logger('Error: can not create consumer');
                    done(error, null);
                    return;
                }
                done(null, contact_us);
            });
        });
    } else {
        query.selectWithAndOne(dbConstants.dbSchema.admins, {
            admin_id: requestParam.user_id
        }, (error, admin) => {
            requestParam.name = admin.first_name + ' ' + admin.last_name;
            requestParam.email = admin.email;
            requestParam.mobile = admin.mobile;
            query.insertSingle(dbConstants.dbSchema.contact_us, requestParam, function(error, contact_us) {
                if (error) {
                    logger('Error: can not create consumer');
                    done(error, null);
                    return;
                }
                done(null, contact_us);
            });
        });
    }
};

const sendEmailToUser = async (data,done) => {
    try {
        data.from = "gajeramj@gmail.com"
        await sgMail.send(data);
        done(null, {});
    } catch (error) {
        if (error.response) {
            console.error(error.response.body)
            done(errors.cannotSendEmail(true), null);
            return;
        }
    }
}
const sendEmail = (requestParam, done) => {
    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
        if (error) {
            done(500, {});
            return;
        }

        query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
            code: requestParam.code,
        }, async (error, template) => {
            if (error) {
                done(500, {});
                return;
            }

            if (!template) {
                done(404, {});
                return;
            }

            let emailDescription = (template.description[requestParam.language_code] || '');
            let findArr = [];
            let replaceArr = [];
            if (requestParam.code == 'CSU' || requestParam.code == 'DSU') {
                findArr = ['#FACEBOOK#', '#TWITTER#', '#LINKEDIN#', '#YOUTUBE#', '#INSTAGRAM#', '#ADDRESS#'];
                replaceArr = [setting.fb_url, setting.twitter_url, setting.linkedin_url, setting.youtube_url, setting.instagram_url, setting.address];
            } else if (requestParam.code == 'INVOICE') {
                let fareBreakUp = "";
                let taxBreakUp = "";
                if (requestParam.min_fare > 0) {
                    fareBreakUp += "<tr style='height:30px'><td style='width:75%'>Minimum KM:</td><td>#MIN_KM#</td></tr><tr style='height:30px'><td style='width:75%'>Minimum Fare:</td><td>&#8377; #MIN_FARE#</td></tr><tr style='height:30px'><td style='width:75%'>Admin Bata Charge:</td><td>&#8377; #DRI_BATA#</td></tr><tr style='height:30px'><td style='width:75%'>Toll Tax Charge:</td><td>&#8377; #TOLL_TAX#</td></tr><tr style='height:30px'><td style='width:75%'>Parking Charge:</td><td>&#8377; #PARKING#</td></tr><tr style='height:30px'><td style='width:75%'>Sub Total</td><td>&#8377; #SUBTOTAL#</td></tr><tr style='height:30px'><td style='width:75%'>Discount</td><td>- &#8377; #DISCOUNT#</td></tr><tr style='height:30px'><td style='width:75%'>Total</td><td>&#8377; #TOTAL#</td></tr>";
                    taxBreakUp += "<tr style='height:30px'><td style='width:75%'>GST Percentage</td><td>#GST_PERCENTAGE#</td></tr><tr style='height:30px'><td style='width:75%'>GST</td><td>&#8377; #GST#</td></tr><tr style='height:30px'><td style='width:75%' colspan='2'>(Taxes added to your total fare)</td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr>";
                } else {
                    fareBreakUp += "<tr style='height:30px'><td style='width:75%'>Base Fare:</td><td>&#8377; #BASE_FARE#</td></tr><tr style='height:30px'><td style='width:75%'>Rate for (#TOTAL_DISTANCE#):</td><td>&#8377; #DIS_FARE#</td></tr><tr style='height:30px'><td style='width:75%'>Free ride time (#FREE_DURATION#):</td><td>&nbsp;</td></tr><tr style='height:30px'><td style='width:75%'>Ride time charge for (#CHARGE_DURATION#):</td><td>&#8377; #DUR_FARE#</td></tr><tr style='height:30px'><td style='width:75%'>Free waiting time (#FREE_WAITING_DURATION#):</td><td>&nbsp;</td></tr><tr style='height:30px'><td style='width:75%'>Waiting time charge for (#CHARGE_WAIT#):</td><td>&#8377; #WAIT_FARE#</td></tr><tr style='height:30px'><td style='width:75%'>Admin Bata Charge:</td><td>&#8377; #DRI_BATA#</td></tr><tr style='height:30px'><td style='width:75%'>Toll Tax Charge:</td><td>&#8377; #TOLL_TAX#</td></tr><tr style='height:30px'><td style='width:75%'>Parking Charge:</td><td>&#8377; #PARKING#</td></tr><tr style='height:30px'><td style='width:75%'>Sub Total</td><td>&#8377; #SUBTOTAL#</td></tr><tr style='height:30px'><td style='width:75%'>Discount</td><td>- &#8377; #DISCOUNT#</td></tr><tr style='height:30px'><td style='width:75%'>Total</td><td>&#8377; #TOTAL#</td></tr>";
                    taxBreakUp += "<tr style='height:30px'><td style='width:75%'>GST Percentage</td><td>#GST_PERCENTAGE#</td></tr><tr style='height:30px'><td style='width:75%'>GST</td><td>&#8377; #GST#</td></tr><tr style='height:30px'><td style='width:75%' colspan='2'>(Taxes added to your total fare)</td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr><tr style='height:30px'><td></td><td></td></tr>";
                }

                fareBreakUp = fareBreakUp.replace("#MIN_KM#", requestParam.min_km);
                fareBreakUp = fareBreakUp.replace("#MIN_FARE#", requestParam.min_fare.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#BASE_FARE#", requestParam.base_fare.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#TOTAL_DISTANCE#", requestParam.formatted_total_distance);
                fareBreakUp = fareBreakUp.replace("#DIS_FARE#", requestParam.distance_charge.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#FREE_DURATION#", requestParam.free_ride_mins + ' mins');
                fareBreakUp = fareBreakUp.replace("#CHARGE_DURATION#", (Math.round((requestParam.total_duration / 60) - requestParam.free_ride_mins) + ' mins'));
                fareBreakUp = fareBreakUp.replace("#DUR_FARE#", requestParam.duration_charge.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#FREE_WAITING_DURATION#", requestParam.free_waiting_mins + ' mins');
                fareBreakUp = fareBreakUp.replace("#CHARGE_WAIT#", requestParam.waiting_mins + ' mins');
                fareBreakUp = fareBreakUp.replace("#WAIT_FARE#", requestParam.waiting_charge.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#DRI_BATA#", requestParam.driver_bata_charge.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#TOLL_TAX#", requestParam.toll_tax_charge.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#PARKING#", requestParam.parking_charge.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#SUBTOTAL#", requestParam.subtotal.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#DISCOUNT#", requestParam.discount.toFixed(2));
                fareBreakUp = fareBreakUp.replace("#TOTAL#", requestParam.total.toFixed(2));

                taxBreakUp = taxBreakUp.replace("#GST_PERCENTAGE#", requestParam.gst_percentage + '%');
                taxBreakUp = taxBreakUp.replace("#GST#", requestParam.gst_charge.toFixed(2));

                findArr = ['#INVOICE_NO#', '#POSTED_AT#', '#TOTAL_FARE#', '#TOTAL_DISTANCE#', '#TOTAL_DURATION#', '#WALLET#', '#PAYMENT_TYPE#', '#FARE_BREAKUP_SECTION#', '#TAX_BREAKUP_SECTION#', '#TRIP_ID#', '#PICK_UP#', '#DROP_OFF#', '#TRIP_OPTION#', '#TRIP_TYPE#', '#TYPE#', '#DATE_TIME#', '#FAMILY_FULL_NAME#', '#FAMILY_EMAIL#', '#FAMILY_MOBILE_NO#', '#DRIVER_NAME#', '#DRIVER_MOBILE_NO#', '#VEHICLE_TYPE#', '#VEHICLE_NAME#', '#VEHICLE_PLATE_NO#', '#ADDRESS#', '#TELEPHONE#', '#FAX#', '#WEBSITE#'];
                replaceArr = [requestParam.invoice_no, moment(requestParam.created_at).format('Do MMMM YYYY, hh:mm A'), requestParam.total.toFixed(2), requestParam.formatted_total_distance, requestParam.formatted_total_duration, requestParam.wallet.toFixed(2), requestParam.payment_type.join(',').toUpperCase(), fareBreakUp, taxBreakUp, requestParam.job_id, requestParam.pick_up_location, requestParam.drop_off_location, requestParam.trip_option.toUpperCase(), requestParam.trip_types.toUpperCase(), requestParam.job_type.toUpperCase(), moment(requestParam.job_date_time).format('Do MMMM YYYY, hh:mm A'), requestParam.family_full_name, requestParam.family_email, requestParam.family_mobile_country_code + requestParam.family_mobile_no, requestParam.provider_name, requestParam.provider_mobile_no, requestParam.fleet_type_title, requestParam.formatted_provider_vehicle, requestParam.vehicle_plate_no, setting.company_address, setting.company_telephone, setting.company_fax, setting.company_website];
            } else if (requestParam.code == 'OTP') {
                findArr = ['#NAME#', '#OTP#', '#OTPDATE#', '#OTPTIME#'];
                replaceArr = [requestParam.name, requestParam.otp, requestParam.otp_date, requestParam.otp_time];
            } else if(requestParam.code == 'WAM'){
                findArr = ['#NAME#', '#AMOUNT#'];
                replaceArr = [requestParam.name, requestParam.amount];
            }

            let emailSubject = template.email_subject;
            const data = {
                from: template.from_email,
                to: requestParam.email,
                subject: emailSubject,
                html: (findArr.length > 0) ? replaceOnce(emailDescription, findArr, replaceArr, 'gi') : emailDescription,
            };
            await sendEmailToUser(data, (error, data) => {
                if (error) {
                    done(500, {});
                    return;
                } else {
                    done(null, {});
                }
            })
            /*
            console.log(data)
            mailgun.messages().send(data, (error, body) => {
                //console.log(error);
                console.log(body);
                done(null, {});
            });*/
        });
    });
};

/*
 * Used to get Rating and Review for Haribhagat
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const getRatingReviewConsumer = function(requestParam, done) {
    let compairData = {
        to_user_type: requestParam.user
    }
    console.log(requestParam.user)
    let joinArr = []
    if (requestParam.user == 'consumer') {
        joinArr = [{
            $lookup: {
                from: 'haribhagats',
                localField: 'to_user_id',
                foreignField: 'haribhagat_id',
                as: 'consumerDetails',
            },
        }, {
            $unwind: "$consumerDetails",
        }, {
            $lookup: {
                from: 'admins',
                localField: 'from_user_id',
                foreignField: 'admin_id',
                as: 'driverDetails',
            },
        }, {
            $unwind: "$driverDetails",
        }, {
            $match: compairData,
        }, {
            $project: {
                _id: 0,
                rating_review_id: "$rating_review_id",
                trip_id: "$trip_id",
                from_user_type: "$from_user_type",
                from_user_id: "$from_user_id",
                to_user_id: "$to_user_id",
                customer_name: "$consumerDetails.first_name",
                driver_name: "$driverDetails.first_name",
                rating: "$rating",
                comment: "$comment",
                created_at: "$created_at",
            },
        }, {
            $sort: { created_at: -1 }
        }];
    } else {
        joinArr = [{
            $lookup: {
                from: 'haribhagats',
                localField: 'from_user_id',
                foreignField: 'haribhagat_id',
                as: 'consumerDetails',
            },
        }, {
            $unwind: "$consumerDetails",
        }, {
            $lookup: {
                from: 'admins',
                localField: 'to_user_id',
                foreignField: 'admin_id',
                as: 'driverDetails',
            },
        }, {
            $unwind: "$driverDetails",
        }, {
            $match: compairData,
        }, {
            $project: {
                _id: 0,
                rating_review_id: "$rating_review_id",
                trip_id: "$trip_id",
                from_user_type: "$from_user_type",
                from_user_id: "$from_user_id",
                to_user_id: "$to_user_id",
                customer_name: "$consumerDetails.first_name",
                driver_name: "$driverDetails.first_name",
                rating: "$rating",
                comment: "$comment",
                created_at: "$created_at",
            },
        }, {
            $sort: { created_at: -1 }
        }];
    }
    query.joinWithAnd(dbConstants.dbSchema.rating_reviews, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        done(null, response);
    });
};

const notification = function(requestParam, done) {

    if (requestParam.type == 'get') {
        query.selectWithAndFilter(dbConstants.dbSchema.notificationlogs, {
            user_id: requestParam.user_id
        }, {}, { created_at: -1 }, {}, (error, getNotificationLog) => {
            if (error) {
                logger('Error: can not get getNotificationLog', dbConstants.dbSchema.notificationlogs);
                done(errors.internalServer(true), null);
                return;
            }

            getNotificationLog = JSON.parse(JSON.stringify(getNotificationLog))
            for (let x in getNotificationLog) {

                getNotificationLog[x].formated_date = moment(converTotimeZone(getNotificationLog[x].created_at)).format('YYYY-MM-DD')
                getNotificationLog[x].formated_time = moment(converTotimeZone(getNotificationLog[x].created_at)).format('hh:mm a')
            }
            done(null, getNotificationLog);
            return
        });
    } else {
        query.removeMultiple(dbConstants.dbSchema.notificationlogs, {
            'user_id': {
                $in: requestParam.user_id
            }
        }, function(error, notification) {
            if (error) {
                logger('Error: can not delete notification');
                done(error, null);
                return;
            }
            done(null, []);
        });
    }
};

/*
 * Used to get package
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const packageList = function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.languages, {
        language_id: requestParam.language_id
    }, (error, language) => {
        query.selectWithAnd(dbConstants.dbSchema.packages, {
            status: 'Active'
        }, (error, packages) => {
            if (error) {
                logger('Error: can not get packages');
                done(error, null);
                return;
            }
            let columnAndValues = [];
            for (var i = 0; i < packages.length; i++) {
                columnAndValues.push({
                    'package_id': packages[i].package_id,
                    'package_type': packages[i].package_type,
                    'package_value': packages[i].package_value,
                    'amount': packages[i].amount,
                    'title': packages[i].title[language.code],
                    'description': packages[i].description[language.code],
                });
            }
            done(null, columnAndValues);
        });
    });
};

/*
 * Used to logout user
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const logout = function(requestParam, done) {
    if (requestParam.type == 'consumer') {
        query.updateSingle(dbConstants.dbSchema.haribhagats, {
            device_token: ''
        }, {
            haribhagat_id: requestParam.user_id,
            device_token: requestParam.device_token
        }, function(error, res) {
            if (error) {
                logger('Error: can not update consumer');
                done(error, null);
                return;
            }
            done(null, 'Successfully logged out.')
        });
    } else {
        query.updateSingle(dbConstants.dbSchema.admins, {
            device_token: '',
            online_status: "Off",
            is_login: false
        }, {
            admin_id: requestParam.user_id,
            device_token: requestParam.device_token
        }, function(error, res) {
            if (error) {
                logger('Error: can not update admin');
                done(error, null);
                return;
            }
            let ref = config.firebase.providerRef.ref('admins/' + requestParam.user_id + '/').update({
                status: 'offline',
            });
            done(null, 'Successfully logged out.')
        });
    }
};

const verifyCoupon = async function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.coupons, requestParam, async (error, coupon) => {
        if (error) {
            logger('Error: can not get coupon.', dbConstants.dbSchema.coupons);
            done(errors.internalServer(true), null);
            return;
        }
        if (!coupon) {
            done(errors.unauthorizedAccess(true), null);
            return;
        }
        if (coupon.status == 'Inactive') {
            done(errors.notActivate(true), null);
            return;
        }
        if (coupon.total_usage <= coupon.total_used) {
            done(errors.expired(true), null);
            return;
        }
        let todayDate = new Date();
        todayDate = moment(todayDate).format('YYYY-MM-DD');
        if (moment(todayDate).isBetween(moment(coupon.start_date).format('YYYY-MM-DD'), moment(coupon.end_date).format('YYYY-MM-DD'), null, '[]')) {
            let columnAndValuesPrice = {
                'coupon_id': coupon.coupon_id,
                'coupon_code': coupon.coupon_code,
                'discount_type': coupon.discount_type,
                'value': parseFloat(coupon.value).toFixed(2)
            }
            await query.updateSingleWithPromise(dbConstants.dbSchema.coupons, { total_used: coupon.total_used + 1 }, { coupon_id: coupon.coupon_id })
            done(null, columnAndValuesPrice);
        } else {
            done(errors.expired(true), null);
            return;
        }
    });
};

const removeCoupon = async function (requestParam, done) {
    try {
        const coupon = await query.selectWithAndOnePromise(dbConstants.dbSchema.coupons, { coupon_code: requestParam.coupon_code }, { _id: 0 })
        if (!coupon) {
            done(errors.resourceNotFound(true), null);
            return;
        }
       let total = coupon.total_used - 1
        if (total < 0) {
            total = 0
        }
        const remove = await query.updateSingleWithPromise(dbConstants.dbSchema.coupons, { total_used: total }, { coupon_code: coupon.coupon_code })
        done(null, remove);
    } catch (error) {
        done(errors.internalServer(true), null);
        return;
    }
}
const getAdditionalCharge = function(requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.additional_charge_types, {
        status: 'Active'
    }, (error, additional_charges) => {
        if (error) {
            logger('Error: can not get packages');
            done(error, null);
            return;
        }
        done(null, additional_charges)
    });
}

/**
 * getSuggestionAmount
 * Use to get suggestion amount list
 * Meet Aghera
 * 1 july 2019
 */

const getSuggestionAmount = (requestParam) => {
    return new Promise((resolve, reject) => {
        try {
            query.selectWithAndFilter(dbConstants.dbSchema.suggestion_amounts, {
                status: 'active'
            }, {
                _id: 0,
                amount: 1,
                suggestion_amount_id: 1
            }, {
                amount: 1
            }, {}, (error, amount) => {
                if (error) {
                    reject(errors.internalServer(true))
                    return
                }
                if (Object.keys(amount).length == 0) {
                    resolve([])
                    return
                }
                query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (err, setting) => {
                    if (err) {
                        reject((errors.internalServer(true)))
                        return
                    }
                    setting = JSON.parse(JSON.stringify(setting));
                    amount = JSON.parse(JSON.stringify(amount))
                    for (let x in amount) {
                        console.log("==>" + `${setting.currency}${amount[x].amount}`)
                        amount[x].amount = `${setting.currency} ${amount[x].amount}`
                    }
                    resolve(amount)
                    return
                })

            })
        } catch (error) {
            console.log(error)
            reject(errors.internalServer(true), null)
            return
        }
    })
}

/*
 * Used to delete Rating and Review
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteRatingReview = function(ratingReviewDetail, done) {
    //console.log(ratingReviewDetail);
    query.removeMultiple(dbConstants.dbSchema.rating_reviews, { 'rating_review_id': { $in: ratingReviewDetail } }, function(error, ratingReview) {
        if (error) {
            logger('Error: can not delete ratingReview');
            done(error, null);
            return;
        }
        done(null, ratingReview);
    });
}

const listPaymentTypes = (requestParam, done) => {
    query.selectWithAndOneNew(dbConstants.dbSchema.settings, {}, {
        _id: 0,
        is_cash: 1,
        is_wallet: 1,
        is_stripe: 1,
        is_wave:1
    }, (error, setting) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.settings);
            done(errors.internalServer(true), null);
            return;
        }

        if (!setting) {
            logger('Error: resource not found');
            done(errors.internalServer(true), null);
            return;
        }

        done(null, setting);
    });
};

const sendTransferRequests = (requestParam, done) => {
    if (!requestParam.amount) {
        done(errors.missingParameter(true), null);
        return;
    }
    query.selectWithAndOneNew(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, {
        _id: 0,
        admin_id: 1,
        first_name: 1,
        language_id: 1,
        email: 1,
        total_earned: 1,
        total_cashout: 1

    }, (error, admin) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.settings);
            done(errors.internalServer(true), null);
            return;
        }
        if (!admin) {
            logger('Error: resource not found');
            done(errors.resourceNotFound(true), null);
            return;
        }
        requestParam.status = 'Unpaid';
        requestParam.admin_charge = 1;
        if (admin.total_cashout >= requestParam.amount) { 
            query.insertSingle(dbConstants.dbSchema.transfer_requests, requestParam, async function (error, transfer_req) {
                requestParam.amount = parseFloat(parseFloat(requestParam.amount) + parseInt(1))
                console.log("requestParam.amount", requestParam.amount)
                await query.updateSingleWithPromise(dbConstants.dbSchema.admins, { $inc: { total_cashout: requestParam.amount * -1 } }, { admin_id: requestParam.admin_id })
                query.selectWithAndOneNew(dbConstants.dbSchema.settings, {}, {
                    _id: 0,
                    currency: 1,
                    admin_email: 1,
                }, (error, setting) => {
                    query.selectWithAndOneNew(dbConstants.dbSchema.languages, { language_id: admin.language_id }, {
                        _id: 0,
                        code: 1,
                        language_id: 1,
                    }, async (error, language) => {
                        let languageCode = language.code || 'EN';
                        query.selectWithAndOne(dbConstants.dbSchema.email_templates, { code: 'RCO' }, function (error, template) {
                            if (error) {
                                logger('Error: can not get ', dbConstants.dbSchema.email_templates);
                                done(errors.internalServer(true), null);
                                return;
                            }
                            let emailDescription = (template.description[languageCode] || '');
                            let findArr = [];
                            let replaceArr = [];

                            findArr = ['#DRIVERID#', '#NAME#', '#ID#', '#AMOUNT#'];
                            replaceArr = [admin.admin_id, admin.first_name, transfer_req.transfer_id, setting.currency + '' + requestParam.amount];

                            let emailSubject = template.email_subject;
                            const data = {
                                from: setting.admin_email,
                                to: setting.admin_email,
                                subject: emailSubject,
                                html: (findArr.length > 0) ? replaceOnce(emailDescription, findArr, replaceArr, 'gi') : emailDescription,
                            };

                            // const params = {
                            //     Destination: {
                            //         ToAddresses: [data.to]
                            //     },
                            //     Message: {
                            //         Body: {
                            //             Html: {
                            //                 Charset: 'UTF-8',
                            //                 Data: data.html
                            //             }
                            //         },
                            //     Subject: {
                            //         Charset: 'UTF-8',
                            //         Data: data.subject
                            //     }
                            // },
                            // ReturnPath: data.from,
                            //     Source: data.from,
                            // };
                            sendEmailToUser(data, async (err, data) => {
                                if (err) {
                                    console.log(err, err.stack);
                                } 
                               done(null, {});
                               return
                            })

                            /*const mailgun = require('mailgun-js')({
                                apiKey: config.mailgunInfo.api_key,
                                domain: config.mailgunInfo.domain
                            });
    
                            mailgun.messages().send(data, function(error, body) {
                                // let totalEarned = parseFloat(admin.total_earned) - parseFloat(requestParam.amount);
                               
    
                            });*/

                        })
                    })
                })
            });
        } else {
            logger('Error: total cashout is less then total transfer request');
            done(errors.customError('Transfer request amount is greater then total cashout', 505, "Transfer request amount is greater then total cashout", true), null);
            return
        }
    });
};

const getDriverTotalEarn = function(requestParam, done) {
    query.selectWithAndOneNew(dbConstants.dbSchema.settings, {}, {
        _id: 0,
        currency: 1,
    }, (error, setting) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.settings);
            done(errors.internalServer(true), null);
            return;
        }
        query.selectWithAndOneNew(dbConstants.dbSchema.admins, requestParam, {
            _id: 0,
            admin_id: 1,
            total_earned: 1,
            total_cashout: 1,
        }, (error, admin) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.admins);
                done(errors.internalServer(true), null);
                return;
            }
            if (!admin) {
                logger('Error: resource not found');
                done(errors.resourceNotFound(true), null);
                return;
            }
            let sendData = {
                admin_id: admin.admin_id,
                total_earned: setting.currency + '' + admin.total_earned,
                total_cashout: setting.currency + '' + admin.total_cashout
            }
            done(null, sendData)
            return
        });
    })
};

/*
 * Used to list of Withdraw 
 * @param {jobDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const listWithdraw = function(WithdrawDetails, done) {
    let compairData = {
        admin_id: WithdrawDetails.admin_id
    }
    let joinArr = [{
            $lookup: {
                from: 'admins',
                localField: 'admin_id',
                foreignField: 'admin_id',
                as: 'driverDetails'
            }
        }, { 
           $unwind: {
                path: "$driverDetails",
            "preserveNullAndEmptyArrays": true
          }
         }, {
            $match: compairData,
        }, {
            $project: {
                _id: 0,
                transfer_id: "$transfer_id",
                amount: "$amount",
                admin_id: "$admin_id",
                date: "$date",
                status: "$status",
                admin_charge: "$admin_charge",
                driver_name: "$driverDetails.first_name",
                recipient_name: "$driverDetails.recipient_name",
                bank_name: "$driverDetails.bank_name",
                account_number: "$driverDetails.account_number",
            }
        },
        {
            $sort: { date: -1 }
        }
    ];
    query.joinWithAnd(dbConstants.dbSchema.transfer_requests, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        for (var i = 0; i < response.length; i++) {
            response[i].date = moment(converTotimeZone(response[i].date)).format("Do MMM YYYY h:mm A");
            response[i].admin_charge = response[i].admin_charge ? response[i].admin_charge : 0
            // response[i].date1 = moment(converTotimeZone(response[i].date)).format('YYYY-MM-DD')
            // response[i].date2 = moment(converTotimeZone(response[i].date)).format('LTS')
            // response[i].date = response[i].date1 + " " + response[i].date2

        }
        console.log(response)
        done(null, response)
    });
};

/*
 * Used to list of Withdraw 
 * @param {jobDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const listWithdrawAPI = function(WithdrawDetails, done) {
    let startDate = new Date(WithdrawDetails.date + 'T00:00:00.000Z');
    let endDate = new Date(WithdrawDetails.date + 'T23:59:00.000Z');
    let compairData = {
        admin_id: WithdrawDetails.admin_id,
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    }
    let joinArr = [{
            $lookup: {
                from: 'admins',
                localField: 'admin_id',
                foreignField: 'admin_id',
                as: 'driverDetails'
            }
        }, {
            $unwind: "$driverDetails"
        }, {
            $match: compairData,
        }, {
            $project: {
                _id: 0,
                transfer_id: "$transfer_id",
                amount: "$amount",
                admin_id: "$admin_id",
                date: "$date",
                status: "$status",
                driver_name: "$driverDetails.first_name",
                recipient_name: "$driverDetails.recipient_name",
                bank_name: "$driverDetails.bank_name",
                account_number: "$driverDetails.account_number",
                reason: "$reason"

            }
        },
        {
            $sort: { date: -1 }
        }
    ];
    query.joinWithAnd(dbConstants.dbSchema.transfer_requests, joinArr, async (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings,{}, {_id : 0, currency : 1 })
        for (var i = 0; i < response.length; i++) {
            response[i].date = moment(converTotimeZone(response[i].date)).format("Do MMM YYYY h:mm A");
            response[i].amount = setting.currency +' '+response[i].amount
        }
        console.log(response)
        done(null, response)
    });
};

/*
 * Used to action update by id
 * @param {withdrawDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const changeWithdrawStatus = (withdrawDetails, done) => {
    let columnsToUpdate = {
        status: withdrawDetails['actionType'],
    };
    console.log(withdrawDetails);
    query.updateMultiple(dbConstants.dbSchema.transfer_requests, columnsToUpdate, {
        'transfer_id': {
            $in: withdrawDetails['id'],
        },
    }, function(error, data) {
        if (error) {
            logger('Error: can not update ');
            done(error, null);
            return;
        }
        done(null, data);
    });
};

/*
 * Used to action update by id
 * @param {withdrawDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const sendOtp = async (requestParam, done) => {
    let dbSchema
    let columnAndValues = {}
    if (requestParam.user_type == 'consumer') {
        dbSchema = dbConstants.dbSchema.haribhagats
        columnAndValues = {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
            haribhagat_id: {
                $ne: requestParam.user_id
            }
        }
    } else {
        dbSchema = dbConstants.dbSchema.admins
        columnAndValues = {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
            admin_id: {
                $ne: requestParam.user_id
            }
        }
    }
    query.selectWithAndOne(dbSchema, columnAndValues, function(error, getUser) {
        if (error) {
            logger('Error: can not update ');
            done(error, null);
            return;
        }
        if (getUser) {
            logger('Error: Mobile Already Exists');
            done(errors.customError('Mobile Already Exists', 504, 'Mobile Already Exists', true), null);
            return;
        } else {
            const otp = Math.floor(Math.random() * 8999 + 1000);
            console.log(otp)
            query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: requestParam.language_id }, function(error, language) {
                if (error) {
                    logger('Error: can not update ');
                    done(error, null);
                    return;
                }
                let langCode = language.code
                if (!language) {
                    langCode = 'EN'
                }
                query.selectWithAndOne(dbConstants.dbSchema.sms_templates, { code: 'SEND_OTP' }, async function(error, sms) {
                    if (error) {
                        logger('Error: can not update ');
                        done(error, null);
                        return;
                    }
                    if (!sms) {
                        logger('Error: can not find sms ');
                        done(errors.internalServer(true), null);
                        return;
                    }
                    let message = sms.value[langCode];
                    message = message.replace('#OTP#', otp);
                    try {
                        client.messages.create({
                            body: message,
                            to: `${requestParam.mobile_country_code}${requestParam.mobile}`, // Text this number
                            from: config.twilio.mobileNo
                          }).then((message) => {
                                console.log("message", message)
                                if (requestParam.user_type == 'consumer') {
                                    console.log('consumer')
                                    query.updateSingle(dbConstants.dbSchema.haribhagats, {
                                        verification_code: otp,
                                    }, { haribhagat_id: requestParam.user_id }, function (error, consumerUpdated) {
                                        if (error) {
                                            logger('Error: can not update consumer');
                                            done(error, null);
                                            return;
                                        }
                                        done(null, { otp: otp });
                                        //done(null,consumer[0]);
                                    }).catch((error) => {
                                        console.log("error", error)
                                    })
                                } else {
                                    console.log('admin')
                                    query.updateSingle(dbConstants.dbSchema.admins, {
                                        otp: otp,
                                    }, { admin_id: requestParam.user_id }, function (error, Updated) {
                                        if (error) {
                                            logger('Error: can not update admin');
                                            done(error, null);
                                            return;
                                        }
                                        done(null, { otp: otp });
                                    });
                                }
                            });
                    } catch (error) {
                        console.log(error)
                    }
                });
            })
        }
    })
}

/*
 * Used to action update by id
 * @param {withdrawDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const verifyOtp = (requestParam, done) => {
    let dbSchema
    let columnAndValues = {}
    let getColumn = {}
    let columnsToUpdate = {}
    if (requestParam.user_type == 'consumer') {
        dbSchema = dbConstants.dbSchema.haribhagats
        columnAndValues = {
            haribhagat_id: requestParam.user_id
        }
        getColumn = {
            _id: 0,
            verification_code: 1
        }
        columnsToUpdate = {
            verification_code: '',
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code
        }
    } else {
        dbSchema = dbConstants.dbSchema.admins
        columnAndValues = {
            admin_id: requestParam.user_id
        }
        getColumn = {
            _id: 0,
            otp: 1
        }
        columnsToUpdate = {
            otp: '',
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code
        }
    }
    query.selectWithAndOneNew(dbSchema, columnAndValues, getColumn, function(error, response) {
        if (error) {
            logger('Error: can not update ');
            done(error, null);
            return;
        }
        response = JSON.parse(JSON.stringify(response));
        if (requestParam.user_type == 'consumer') {
            response.otp = response.verification_code
        }
        console.log(response.otp)
        console.log(requestParam.otp)
        if (response.otp == requestParam.otp) {
            query.updateSingle(dbSchema, columnsToUpdate, columnAndValues, function(error, Updated) {
                if (error) {
                    logger('Error: can not update data');
                    done(error, null);
                    return;
                }
                done(null, {});
            });
        } else {
            logger('Error: Invalid Otp');
            done(errors.customError('Invalid Otp', 404, 'Invalid Code', true), null);
            return;
        }
    })
}

const converTotimeZone = (dateTobeformated) => {
    console.log("process.env.TZ", process.env.TZ)
    console.log(dateTobeformated)
    var myTime = moment.tz(dateTobeformated,process.env.TZ)
    if (isNaN(myTime)) {
        console.log("time zone converter not work")
        return dateTobeformated
    }
    return myTime
}

const newUploadFileObj = (fileObject, type, done) => {
    let bucketName;
    if (type == 'consumer') {
        bucketName = config.aws.s3.consumerBucket;
    } else if (type == 'admin') {
        bucketName = config.aws.s3.driverBucket;
    } else if (type == 'vehicle') {
        bucketName = config.aws.s3.vehicleBucket;
    } else if (type == 'administrator') {
        bucketName = config.aws.s3.adminBucket;
    }
    S3Manager.uploadFileObj(fileObject, bucketName, (errMediaUpload, filePath) => {
        if (errMediaUpload) {
            logger('Error: ', errMediaUpload);
            done(errors.internalServer(true), null);
            return;
        }
        console.log(filePath);
        done(null, filePath);
    });
};

const readCSV = done => {
  return new Promise((resolve, reject) => {
    try {
      
      const csvFilePath = "/var/www/cab/public_html/cab-api/public/languagelabels.csv";
      const csv = require("csvtojson");
      csv()
        .fromFile(csvFilePath)
        .then(jsonObj => {
          let lableArr = [];
          _.each(jsonObj, (element, index, list) => {
            if (element.en) {
              let typeSplit = element.type.split(",");

              let obj = {
                label_id: `LBL${Math.floor(Math.random() * 99999999999 + 111111111)}`,
                title: element.title,
                code: element.code,
                value: {
                  EN: element.en,
                  FR: element.fr,
                },
                type: element.type,
                status: "Active"
              };
         
              query.insertSingle(
                dbConstants.dbSchema.languageLabels,
                obj,
                (error, response) => {
                  if (error) {
                    logger("Error: while inserting language_labels.");
                  }
                }
              );
            }
          });
        });
    } catch (error) {

      reject(error);

      return;
    }
  });
};


const generateImageFromMap = (requestParam,done) => {
    return new Promise(async (resolve, reject) => {
        try {
            let directionUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${requestParam.start_latitude},${requestParam.start_longitude}&destination=${requestParam.finish_latitude},${requestParam.finish_longitude}&mode=driving&key=${config.googleDistance.apiKey[0]}`;
            console.log("directionUrl", directionUrl)
            request(directionUrl, async (err, res, body) => {
                if (err) {
                    reject(errors.resourceNotFound(true), null);
                    return;
                }
                body = JSON.parse(body);
                if (body.routes.length == 0) {
                    reject(errors.resourceNotFound(true), null);
                    return;
                }
                let mapStyle = "feature:administrative|element:all|saturation:-100&style=feature:administrative.province|element:all|visibility:off&style=feature:landscape|element:all|saturation:-100|lightness:65|visibility:on&style=feature:poi|element:all|saturation:-100|lightness:50|visibility:simplified&style=feature:road|element:all|saturation:-100&style=feature:road.highway|element:all|visibility:simplified&style=feature:road.arterial|element:all|lightness:30&style=feature:road.local|element:all|lightness:40&style=feature:transit|element:all|saturation:-100|visibility:simplified&style=feature:water|element:geometry|hue:0xffff00|lightness:-25|saturation:-97&style=feature:water|element:labels|lightness:-25|saturation:-100";
                let polyline = body.routes[0].overview_polyline.points;
                requestParam.image_url = `https://maps.googleapis.com/maps/api/staticmap?&zoom=12&size=600x400&maptype=roadmap&markers=color:green%7C${requestParam.start_latitude},${requestParam.start_longitude}&markers=color:red%7C${requestParam.finish_latitude},${requestParam.finish_longitude}&path=enc:${polyline}&key=${config.googleDistance.apiKey[0]}&style=${mapStyle}`;
                var options = {
                    uri: requestParam.image_url,
                    encoding: null
                };
                request(options, async function (error, response, body) {
          var s3 = new AWS.S3();
          let fileName =
            Math.random()
              .toString(36)
              .substring(5) +
            moment().unix() +
            ".png";
          s3.putObject(
            {
              Body: body,
              Key: fileName,
              Bucket: config.aws.s3.tripBucket,
              ContentType: "image/png",
              ACL: "public-read"
            },
            async (error, data) => {
              if (error) {
                requestParam.image_url = "https://via.placeholder.com/400x115";
              } else {
                requestParam.image_url =
                  "https://s3." +
                  config.aws.region +
                  ".amazonaws.com/" +
                  config.aws.s3.tripBucket +
                  "/" +
                  fileName;
              }
              resolve(requestParam);
              return;
            }
          );
                });
            });
        } catch (error) {
            reject(error);
            return;
        }
    });
};
const waveTrasanction = async(requestParam)=> {
    const options = {
      method: 'POST',
      url: config.waveInfo.wave_url,
      headers: {
        // Authorization: config.waveInfo.authorization_token,
        // 'Content-Type': 'application/json'
        'Authorization':`Bearer ${config.waveInfo.authorization_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: requestParam.amount,
        client_reference:requestParam.reference_id,
        currency: 'XOF',
        error_url: config.waveInfo.wave_error_url,
        success_url: config.waveInfo.wave_success_url
      })
    };
  
    return new Promise((resolve, reject) => {
      request(options, function (error, response) {
        if (error) {
          reject(error);
        } else {
          const obj ={
            data:response.body,
            status:response.statusCode
          }
          resolve(obj);
        }
      });
    });
}

const webHook = function(requestParam, done) {
    console.log('requestParam-----',requestParam)
    // fs.appendFileSync('file.json', '\n' + JSON.stringify(requestParam), (err) => {       
    //     if (err) throw err;
    //         console.log("Data written to file");
    // });
    const columnAndValuesUpdate ={
        webhook_id:requestParam.id,
        webhook_type:requestParam.type,
        payment_status:requestParam.data.payment_status,
        last_payment_error:requestParam.data.last_payment_error,
        when_completed:requestParam.data.when_completed
    }
    const client_reference_id = requestParam.data.client_reference.split('#');
    const haribhagat_id =client_reference_id[0];
    const transaction_type = client_reference_id[1];
    const trip_id = client_reference_id[2];
    const admin_id = client_reference_id[3];
    const user_arr=[];
    if(requestParam.data.payment_status == "succeeded"){
        if(transaction_type == "trip"){
            query.updateSingle(dbConstants.dbSchema.trips, {status:tripConstants.status.complete}, {
                trip_id:trip_id
            }, (error) => {
                if(error){
                    logger('Error: can not update data');
                    // done(error, null);
                    // return;
                }
                query.selectWithAndOne(dbConstants.dbSchema.haribhagats,  { haribhagat_id: haribhagat_id }, async (error, haribhagats) => {
                    if (error) {
                        logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
                    }

                    user_arr.push({
                        id:haribhagats.haribhagat_id,
                        device_type:haribhagats.device_type,
                        user_type:'consumer',
                        first_name:haribhagats.first_name,
                        last_name:haribhagats.last_name,
                        device_token:haribhagats.device_token,
                        language_id:haribhagats.language_id
                    })
                    query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: admin_id}, async (error, admin) => {
                        if (error) {
                            logger('Error: can not get ', dbConstants.dbSchema.admins);
                            // done(errors.internalServer(true), null);
                            // return;
                        }
                        if (!admin) {
                            // done(errors.driverNotFound(true), null);
                            // return;
                        }

                        user_arr.push({
                            id:admin.admin_id,
                            device_type:admin.device_type,
                            user_type:'admin',
                            first_name:admin.first_name,
                            last_name:admin.last_name,
                            device_token:admin.device_token,
                            language_id:admin.language_id
                        })
                        user_arr.map((data)=>{
                            if(data.device_type=='android'){
                                // driverHandler.getFirebaseTrips({ status: 'wave_payment_confirmation', admin: admin_id, trip_id: trip_id }, (err, firebase) => {
                                    getNotificationValue(data.user_type == 'admin' ? 'WAVE_PAYMENT_CONFIRMATION' :'WAVE_PAYMENT_SUCCESSFULL',data.language_id,trip_id,(err, title) => {
                                        const message = { //this may lety according to the message type (single recipient, multicast, topic, et cetera)
                                            to: data.device_token, 
                                            collapse_key: 'green',
                                            data:{
                                                data: {
                                                    message:title,
                                                    type:'wave_payment_confirmation'
                                                }
                                            }
                                        };
                                        let obj = {
                                            user_type: data.user_type,
                                            user_id: data.id,
                                            name: data.first_name+' '+data.last_name,
                                            message: title,
                                            status: (error) ? 'failure' : 'success',
                                        };
                                        // code for android push notification
                                        const serverKey = config.push_notification.server_key; //put your server key here
                                        const fcm = new FCM(serverKey);
                                        query.insertSingle(dbConstants.dbSchema.notificationlogs, obj, (error, response) => {
                                        fcm.send(message, function(err, response){
                                            console.log('err',err)
                                            console.log('response',response)
                                            // return;
                                            });
                                        });
                                    });
                                // })
                            }else if(data.device_type=='ios'){
                                // driverHandler.getFirebaseTrips({ status: 'wave_payment_confirmation', admin: admin_id, trip_id: trip_id }, (err, firebase) => {
                                    getNotificationValue(data.user_type == 'admin' ? 'WAVE_PAYMENT_CONFIRMATION' :'WAVE_PAYMENT_SUCCESSFULL',data.language_id,trip_id,async(err, title) => {
                                        const deviceToken = data.device_token;
                                        let note = new apn.Notification();
                                        const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0 })
                                        const p8FilePath = config.push_notification.p8FilePath;
                                        const options = {
                                            token: {
                                                key: p8FilePath,
                                                keyId: config.push_notification.key_id,
                                                teamId: config.push_notification.team_id
                                            },
                                            production: setting.is_production //false
                                        };
                                        const apnProvider = new apn.Provider(options);
                
                                        note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                                        note.badge = 1;
                                        note.sound = 'Fetch_tone.wav';
                                        note.alert = title;
                                        note.payload = {'messageFrom': config.push_notification.msg_from,type:'wave_payment_confirmation'};
                                        note.topic = config.push_notification.bundle_id;
                                        let obj = {
                                            user_type: data.user_type,
                                            user_id: data.id,
                                            name: data.first_name+' '+data.last_name,
                                            message: title,
                                            status: 'success',
                                        };
                                        query.insertSingle(dbConstants.dbSchema.notificationlogs, obj, (error, response) => {
                                            apnProvider.send(note, deviceToken).then((result) => {
                                            });
                                        });
                                    });
                                // })
                            }
                        })
                        
                    });
                })
                
            });           
        }else if(transaction_type == "walletDriver" && admin_id != ""){
            query.selectWithAndOne(dbConstants.dbSchema.admins, { admin_id: admin_id}, async (error, admin) => {
                if (error) {
                    logger('Error: can not get ', dbConstants.dbSchema.admins);
                    // done(errors.internalServer(true), null);
                    // return;
                }
                if (!admin) {
                    // done(errors.driverNotFound(true), null);
                    // return;
                }
                if (!admin.current_balance || admin.current_balance == '') admin.current_balance = 0;
                if (isNaN(admin.current_balance)) {
                    const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: admin_id }, { _id: 0 }, {})
                    const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
                    const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
                    const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
                    const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
                    const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
                    admin.current_balance = finalBalance
                }
                let current_balance = parseFloat(requestParam.data.amount) + parseFloat(admin.current_balance);
    
                    query.updateSingle(dbConstants.dbSchema.admins, { current_balance: current_balance }, {
                        admin_id: admin_id
                    }, function(error, driverUpdated) {
                        let insertObj = {
                                user_id: admin_id,
                                user_type: 'admin',
                                amount: requestParam.data.amount,
                                stripe_transaction_id: '',
                                wave_transaction_id:requestParam.data.id,
                                transaction_id: "Added by you",
                                type: 'addition',
                                wallet_transaction_type: 'admin',
                                payment_type:'wave'
                            }
                        query.insertSingle(dbConstants.dbSchema.wallet_history, insertObj, function(error, admin) {
                            // done(null, "Add amount successfully");
                        });
                    });
            });
        }else if(transaction_type == "walletConsumer" && haribhagat_id != "") {
            query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { haribhagat_id: haribhagat_id }, async (error, consumer) => {
                if (error) {
                    logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
                    // done(errors.internalServer(true), null);
                    // return;
                }
                if (!consumer) {
                    // done(errors.consumerNotFound(true), null);
                    // return;
                }
                if (!consumer.wallet_balance) consumer.wallet_balance = 0;
                if (isNaN(consumer.wallet_balance)) {
                    const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: haribhagat_id }, { _id: 0 }, {})
                    const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
                    const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
                    const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
                    const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
                    const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
                    consumer.wallet_balance = finalBalance
                }
                let wallet_balance = parseFloat(requestParam.data.amount) + parseFloat(consumer.wallet_balance);
                query.updateSingle(dbConstants.dbSchema.haribhagats, { wallet_balance: wallet_balance }, {
                    haribhagat_id: haribhagat_id
                }, function(error, consumerUpdated) {
                    let insertObj = {
                            user_id: haribhagat_id,
                            user_type: 'consumer',
                            amount: requestParam.data.amount,
                            stripe_transaction_id: '',
                            wave_transaction_id:requestParam.data.id,
                            transaction_id: "Added by you",
                            type: 'addition',
                            wallet_transaction_type: 'consumer',
                            payment_type:'wave'
                        }
                    query.insertSingle(dbConstants.dbSchema.wallet_history, insertObj, function(error, consumer) {
                        // done(null, "Add amount successfully");
                        // return;
                    });
                });
            });
        }
    }  
    const columnAndValuesUpdate1 = {
        payment_status:requestParam.data.payment_status
    }
    query.updateSingle(dbConstants.dbSchema.wave_transaction, columnAndValuesUpdate, {
        wave_transaction_id: requestParam.data.id
    }, (error) => {
        if(error){
            logger('Error: can not update data',error);
            done(error, null);
        }
        if(transaction_type == "trip"){
            query.updateSingle(dbConstants.dbSchema.transactions, columnAndValuesUpdate1, {
                wave_transaction_id: requestParam.data.id
            }, (error) => {
                if(error){
                    logger('Error: can not update data');
                    done(error, null);
                    // return;
                }
                done(null, 'success');
            });  
        }else{
            done(null, 'success');
        }
    });
    
};

function makeTripPaymentWithWave (requestParam) {
    return new Promise(async (resolve, reject) => {
        try {
            let settings = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0, is_stripe_payment_live: 1, currency: 1 });
            let total = 0;
            if (requestParam.for == "trip") {
                total = requestParam.amount_pay
            } else {
                total = requestParam.amount
            }            
            const checkout_data = await waveTrasanction({amount:total,reference_id:`${requestParam.haribhagat_id}#${requestParam.for}#${requestParam.for == "trip" && requestParam.trip_id}#${requestParam.admin_id}`})
            console.log('checkout_data',checkout_data)
            if(checkout_data.status == 200){
                const response_data = JSON.parse(checkout_data.data)
              console.log('++++++++++response_data',response_data)
                let insertTransaction = {
                    wave_transaction_id:  response_data.id,
                    // wave_transaction_id:  "CUS_1234567868",
                    refund_id: "",
                    webhook_id: "",
                    webhook_type: "",
                    amount: response_data.amount,
                    checkout_status: response_data.checkout_status,
                    client_reference: response_data.client_reference,
                    business_name: response_data.business_name,
                    currency:response_data.currency,
                    last_payment_error: response_data.last_payment_error,
                    payment_status: response_data.payment_status,
                    wave_launch_url:  response_data.wave_launch_url,
                    when_completed: response_data.when_completed,
                    when_created: response_data.when_created,
                    when_expires: response_data.when_expires,
                }
                const res = await query.insertSinglePromise(dbConstants.dbSchema.wave_transaction, insertTransaction);
                resolve(res);
                if (requestParam.for == "trip") {         
                    let insertTransaction = {
                        stripe_transaction_id:"",
                        haribhagat_id:requestParam.haribhagat_id,
                        admin_id:requestParam.admin_id,
                        trip_id: requestParam.trip_id,
                        payment_type: 'wave',
                        payment_status: response_data.payment_status,
                        charge: settings.currency + "" + parseFloat(response_data.amount),
                        wave_transaction_id:response_data.id
                    }
                    const res1 = await query.insertSinglePromise(dbConstants.dbSchema.transactions, insertTransaction);
                    resolve(res);
                    return
                                        
                } else {
                    resolve(res);
                    return
                }
            } else {
                resolve(null)
                return 
            }
            
        } catch (error) {
            console.log(error)
            reject(null);
            return
        }
    })
   

};

const checkWavePaymentStatus = function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.wave_transaction, requestParam, (error, transaction) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.wave_transaction);
            done(errors.internalServer(true), null);
            return;
        }
        if (!transaction) {
            done(errors.customError('Transaction is not Exist', 401, "Transaction is not Exist", true), null);
            return;
        }        
        done(null, JSON.parse(JSON.stringify(transaction)));
    });
};
module.exports = {
    getNotificationLog,
    deleteNotificationLog,
    getFeedback,
    deleteContactUS,
    deleteFeedback,
    getContactUs,
    contactUS,
    sendEmail,
    uploadImage,
    getRatingReviewConsumer,
    notification,
    packageList,
    logout,
    verifyCoupon,
    getAdditionalCharge,
    getSuggestionAmount,
    deleteRatingReview,
    listPaymentTypes,
    sendTransferRequests,
    listWithdraw,
    changeWithdrawStatus,
    getDriverTotalEarn,
    sendOtp,
    verifyOtp,
    converTotimeZone,
    listWithdrawAPI,
    newUploadFileObj,
    getArchivedData,
    deleteConsumerDataPermanently,
    deleteDriverDataPermanently,
    readCSV,
    DeleteFromCollection,
    sendEmailToUser,
    generateImageFromMap,
    removeCoupon,
    waveTrasanction,
    webHook,
    makeTripPaymentWithWave,
    checkWavePaymentStatus
};
'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const cityConstants = require('./../constants/city-constants');
const tripConstants = require('./../constants/trip-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const City = require('./../models/city');
const Country = require('./../models/country');
const State = require('./../models/state');
const fs = require('file-system');
const moment = require('moment');
const formatCurrency = require('format-currency');
const commonHandler = require('./common-handler');
const { selectWithAnd } = require('./../utils/query-creator');
const { pluck, get, each } = require('underscore');
    /*
     * Used to get city with params
     * @param {Function} done - Callback function with error, data params
     */
const getReport = function(requestParam, done) {
    let joinArr = [{
        $lookup: {
            from: 'haribhagats',
            localField: 'haribhagat_id',
            foreignField: 'haribhagat_id',
            as: 'consumerDetails',
        },
    }, {
        $unwind: "$consumerDetails",
    }, {
        $lookup: {
            from: 'admins',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'driverDetails',
        },
    }, {
        $unwind: "$driverDetails",
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            admin_id: "$admin_id",
            haribhagat_id: "$haribhagat_id",
            from_location: "$start_address",
            to_location: "$finish_address",
            total_price: "$total_price",
            fetch_deduct_amount: "$fetch_deduct_amount",
            fetch_deduct_percentage: "$fetch_deduct_percentage",
            finish_time: "$finish_time",
            admin: "$driverDetails.first_name",
            consumer: "$consumerDetails.first_name",
        },
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        let columnsAndValues = [];
        _.each(response, function(data) {
            let driver_earning;
            if (!data.fetch_deduct_amount) {
                data.fetch_deduct_amount = '0';
            }
            if (!data.fetch_deduct_percentage) {
                data.fetch_deduct_percentage = '10';
            }
            let totlePrice = data.total_price.replace(/^\D+/g, '');
            driver_earning = parseFloat(totlePrice) - parseFloat(data.fetch_deduct_amount);
            if (!data.finish_time) {
                data.finish_time = data.created_at
            }
            columnsAndValues.push({
                'id': data.trip_id,
                'trip_id': data.trip_id,
                'haribhagat_id': data.haribhagat_id,
                'consumer': data.consumer,
                'admin': data.admin,
                'admin_id': data.admin_id,
                'from_location': data.from_location,
                'to_location': data.to_location,
                'payment': data.total_price,
                'driver_earning': parseFloat(driver_earning).toFixed(2),
                'fetch_earning': parseFloat(data.fetch_deduct_amount).toFixed(2),
                'fetch_deduct_percentage': data.fetch_deduct_percentage + "%",
                // 'payment_timeDate':moment(data.finish_time).format("Do MMM YYYY h:mm A")
                'payment_timeDate': moment().format("Do MMM YYYY h:mm A")
            });
        });
        done(null, columnsAndValues);
    });
};


/*
 * Used to get report with params
 * @param {Function} done - Callback function with error, data params
 */
const getCreditReport =  function(requestParam, done) {
    let compairData = {}
    // if(requestParam.start_date){
    //      compairData.created_at = {$gte: new Date(moment(requestParam.start_date).format('YYYY-MM-DD')+'T00:00:00.000Z'), $lte: new Date(moment(requestParam.end_date).format('YYYY-MM-DD')+'T23:59:59.000Z')};
    // }
    let joinArr1 = [
        {
            $match: { is_archive: "false" }
        },
        {
            $lookup: {
                from: 'admins',
                localField: 'transfer_id',
                foreignField: 'admin_id',
                as: 'driverDetails',
            },
        },
        // {
        //     $unwind: {
        //         path: "$driverDetails",
        //         "preserveNullAndEmptyArrays": true
        //     }
        // }, 
        {
        $lookup: {
            from: 'transfer_requests',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'transferDetails',
        },
        },
        // {
        //     $unwind: {
        //         path: "$transferDetails",
        //         "preserveNullAndEmptyArrays": true
        //     }
        // },
        {
        $project: {
            _id: 0,
            admin_id: "$admin_id",
            first_name: "$first_name",
            last_name: "$last_name",
            amount: "$transferDetails.amount",
            admin_charge: "$transferDetails.admin_charge",
            status: "$transferDetails.status"
            
        },
    }];
    query.joinWithAnd(dbConstants.dbSchema.admins, joinArr1, async (error, response) => { 
        const setting =  await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {},{currency : 1})
        let columnAndValues = [];
        response = JSON.parse(JSON.stringify(response));
        _.each(response, function (data) {
            console.log("data", data)
            data.first_name = data.first_name + " " + data.last_name
            let totalEarned = 0;
            let AdminEarned = 0
            _.each(data.amount, (singleAmount,index) => {
                if (data.status[index] == "Paid") {
                    totalEarned += singleAmount
                }
            })
            _.each(data.admin_charge, (singleAmount, index) => {
                if (data.status[index] == "Paid") {
                    AdminEarned += singleAmount
                }
            })
            data.totalEarned = totalEarned.toFixed(2)
            data.AdminEarned = AdminEarned.toFixed(2)
            columnAndValues.push(data)
        })
        done(null, columnAndValues);
        return
    })


    // let joinArr = [{
    //     $lookup: {
    //         from: 'trips',
    //         localField: 'admin_id',
    //         foreignField: 'admin_id',
    //         as: 'tripDetails',
    //     },
    // }, {
    //     $match: compairData
    // }, {
    //     $project: {
    //         _id: 0,
    //         admin_id: "$admin_id",
    //         first_name: "$first_name",
    //         last_name: "$last_name",
    //         trip_id: "$tripDetails.trip_id",
    //         status:"$tripDetails.status",
    //         fetch_deduct_amount: "$tripDetails.fetch_deduct_amount",
    //         total_price: "$tripDetails.total_price",
    //     },
    // }];
    // query.joinWithAnd(dbConstants.dbSchema.admins, joinArr, (error, response) => {
    //     if (error) {
    //         logger('Error: can not get record.');
    //         done(errors.internalServer(true), null);
    //         return;
    //     }
    //     let columnAndValues = [];
    //     response = JSON.parse(JSON.stringify(response));
    //     _.each(response, function (data) {
    //         data.first_name = data.first_name+" "+data.last_name
    //         let totalEarned = 0;
    //         if (data.trip_id.length > 0) {
    //             _.each(data.total_price, function (price, index) {
    //                 if ((data.status[index] === "Complete")) {
    //                     let totalPrice = price.replace(/^\D+/g, '');
    //                     let driverEarn = parseFloat(totalPrice) - parseFloat(data.fetch_deduct_amount);
    //                     totalEarned = totalEarned + driverEarn;
    //                 }
    //             })
    //             data.totalEarned = totalEarned.toFixed(2)
    //             columnAndValues.push(data)
    //         } else {
    //             data.totalEarned = 0
    //         }
    //     })
    //     done(null, columnAndValues);
    // });
};

/*
 * Used to get filtering report with params
 * @param {Function} done - Callback function with error, data params
 */
const getFilterReport = function(requestParam, done) {
    // let start_date = moment(requestParam.start_date).format('L');
    // let end_date = moment(requestParam.end_date).format('L');
    console.log(requestParam)
    let compairData = {}
    let joinArr = [{
        $lookup: {
            from: 'trips',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'tripDetails',
        },
    }, {
        $match: compairData
    }, {
        $project: {
            _id: 0,
            admin_id: "$admin_id",
            first_name: "$first_name",
            last_name: "$last_name",
            // tripDetails: "$tripDetails",
            tripDetails: {
                $filter: {
                    input: "$tripDetails",
                    as: "trip",
                    cond: {
                        $and: [{"$trip.created_at": {$gte: new Date(moment(requestParam.start_date).format('YYYY-MM-DD')+'T00:00:00.000Z')}},{"$trip.created_at": {$lte: new Date(moment(requestParam.end_date).format('YYYY-MM-DD')+'T23:59:59.000Z')}}]
                    }
                }
            }
        },
    }];
    query.joinWithAnd(dbConstants.dbSchema.admins, joinArr, (error, response) => {
        console.log(error)
        // console.log(response)
        _.each(response, data=>{
            console.log(data.tripDetails)
        })
        return false
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        let columnAndValues = [];
        response = JSON.parse(JSON.stringify(response));
        _.each(response, function(data) {
            data.first_name = data.first_name+" "+data.last_name
            let totalEarned = 0;
            if (data.trip_id.length > 0) {
                _.each(data.total_price, function(price) {
                    let totalPrice = price.replace(/^\D+/g, '');
                    let driverEarn = parseFloat(totalPrice) - parseFloat(data.fetch_deduct_amount);
                    totalEarned = totalEarned + driverEarn;
                })
                data.totalEarned = totalEarned.toFixed(2)
                columnAndValues.push(data)
            } else {
                data.totalEarned = 0
            }
        })
        console.log(columnAndValues)
        done(null, columnAndValues);
    });
    // query.selectWithAndOne(dbConstants.dbSchema.settings, function(error, setting) {
    //     let currency;
    //     if (setting == null) {
    //         currency = 'Rs';
    //     } else {
    //         currency = setting.currency;
    //     }
    //     query.selectWithAnd(dbConstants.dbSchema.driver_credit_histories, function(error, credits) {
    //         let columnsAndValues = [];
    //         async.forEachSeries(credits, function(singleCredit, Callback_s1) {
    //             let creditDate = moment(singleCredit.date_selection).format('L');
    //             if (moment(creditDate).isBetween(start_date, end_date, null, '[]')) {
    //                 let date = moment(singleCredit.date_selection).format('L');
    //                 let time = moment(singleCredit.date_selection).format('LT');
    //                 let opts = { format: '%s%v', symbol: currency + ' ' }
    //                 columnsAndValues.push({
    //                     'id': singleCredit.credit_id,
    //                     'credit_id': singleCredit.credit_id,
    //                     'date': date,
    //                     'time': time,
    //                     'admin_id': singleCredit.admin_id,
    //                     'credit_amount': formatCurrency(singleCredit.deposit_amount, opts)
    //                 });
    //                 Callback_s1();
    //             } else {
    //                 Callback_s1();
    //             }
    //         }, function() {
    //             done(null, columnsAndValues);
    //         });
    //     });
    // });
};

/*
 * Used for coupon report
 *
 * @param {requestParam} - Object
 *
 * @param {Function} done - Callback function with error, payload params
 */
const discountReport = (requestParam, done) => {
    let columnAndValues = {
        status: 'Complete'
    }
    query.selectWithAndFilter(dbConstants.dbSchema.trips, columnAndValues, {}, { created_at: -1 }, {}, (error, trips) => {
        if (error) {
            logger('Error: can not get order.');
            done(errors.internalServer(true), null);
            return;
        }

        const couponIds = _.compact(_.pluck(trips, 'coupon_id').join().split(','));

        query.selectWithAnd(dbConstants.dbSchema.coupons, { coupon_id: { $in: couponIds } }, (error, coupons) => {
            if (error) {
                logger('Error: can not get coupons.');
                done(errors.internalServer(true), null);
                return;
            }

            let couponReportArr = [];
            async.forEachSeries(coupons, function(singleCoupon, callbackSingleCoupon) {
                let columnsAndValues = {
                    status: 'Complete',
                    coupon_id: singleCoupon.coupon_id,
                };

                query.selectWithAndFilter(dbConstants.dbSchema.trips, columnsAndValues, {}, { created_at: -1 }, {}, (error, trips) => {
                    if (error) {
                        logger('Error: can not get order.');
                        done(errors.internalServer(true), null);
                        return;
                    }

                    let sum = trips.reduce((s, f) => {
                        f.discount = parseFloat(f.discount.replace(/^\D+/g, ''));
                        return s + parseFloat(f.discount); // return the sum of the accumulator and the current time, as the the new accumulator
                    }, 0);
                    let couponObj = {
                        id: singleCoupon.coupon_id,
                        coupon_id: singleCoupon.coupon_id,
                        title: singleCoupon.title,
                        discount_type: singleCoupon.discount_type.toUpperCase(),
                        total_orders: trips.length,
                        discount: sum.toFixed(2)
                    }
                    couponReportArr.push(couponObj);
                    callbackSingleCoupon();
                })
            }, function() {
                console.log(couponReportArr)
                done(null, couponReportArr);
            })
        });

    });
}

/*
 * Used for finance report
 *
 * @param {requestParam} - Object
 *
 * @param {Function} done - Callback function with error, payload params
 */
const tripReport = (requestParam, done) => {
    let columnsAndValues = {
        status: 'Complete'
    };
    let joinArr = [{
        $lookup: {
            from: 'haribhagats',
            localField: 'haribhagat_id',
            foreignField: 'haribhagat_id',
            as: 'consumerDetails',
        },
    }, {
        $unwind: "$consumerDetails",
    }, {
        $match: columnsAndValues,
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            haribhagat_id: "$haribhagat_id",
            consumer: "$consumerDetails.first_name",
            amount_pay: "$amount_pay",
            book_type: "$book_type",
            trip_datetime: "$trip_datetime",
            discount: "$discount",
            total_price: "$total_price",
        },
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }

        query.selectWithAndOne(dbConstants.dbSchema.settings, function(error, setting) {
            let currency;
            if (setting == null) {
                currency = '$';
            } else {
                currency = setting.currency;
            }
            response = JSON.parse(JSON.stringify(response));
            _.each(response, function(data) {
                if (!data.amount_pay) {
                    data.amount_pay = '$0'
                }
                if (!data.discount || data.discount == '') {
                    data.discount = '$0'
                }
                if (!data.total_price) {
                    data.total_price = '$0'
                }
                data.total_price = currency + ' ' + data.total_price.replace(/^\D+/g, '');
                data.discount = currency + ' ' + data.discount.replace(/^\D+/g, '');
                data.amount_pay = currency + ' ' + data.amount_pay.replace(/^\D+/g, '');
            });
            done(null, response);
        })
    });

    //    let columnsAndValues = {
    //        status:'Complete'
    //    };
    //    query.selectWithAndOne(dbConstants.dbSchema.settings,function (error, setting) {
    // 	let currency;
    // 	if(setting==null){
    // 		currency='Rs';
    // 	}
    // 	else{
    // 		currency=setting.currency;
    // 	}
    //     query.selectWithAndFilter(dbConstants.dbSchema.trips, columnsAndValues, {}, {created_at: -1}, {}, function(error, trips) {
    //         if (error) {
    //             logger('Error: can not get trips');
    //             done(errors.internalServer(true), null);
    //             return;
    //         }
    //         let tripArr = [];
    //         tripArr = JSON.parse(JSON.stringify(trips));
    //         for(let i=0; i<tripArr.length; i++){
    //         	if(!tripArr[i].amount_pay){
    //         		tripArr[i].amount_pay='Rs 0'
    //         	}
    //         	if(!tripArr[i].discount){
    //         		tripArr[i].discount='Rs 0'
    //         	}
    //         	if(!tripArr[i].total_price){
    //         		tripArr[i].total_price='Rs 0'
    //         	}
    //         	tripArr[i].total_price = currency+' '+tripArr[i].total_price.replace( /^\D+/g, ''); 
    //         	tripArr[i].discount = currency+' '+tripArr[i].discount.replace( /^\D+/g, ''); 
    //         	tripArr[i].amount_pay = currency+' '+tripArr[i].amount_pay.replace( /^\D+/g, ''); 
    //         }
    //         done(null, tripArr);
    //     })
    // });
}

/*
 * Used for sales report
 *
 * @param {requestParam} - Object
 *
 * @param {Function} done - Callback function with error, payload params
 */
const salesReport = (requestParam, done) => {
    let columnAndValue = {};
    if (requestParam.type == "daily") {
        var start = new Date();
        start.setHours(0, 0, 0, 0);
        var end = new Date();
        end.setHours(23, 59, 59, 999);
        columnAndValue.start_date = moment(start).format("YYYY-MM-DD")
        columnAndValue.end_date = moment(end).format("YYYY-MM-DD")
    } else if (requestParam.type == 'monthly') {
        var firstDay, lastDay;
        if (requestParam.month) {
            var date = new Date();
            date.setMonth(parseInt(requestParam.month)), y = date.getFullYear(), m = date.getMonth();
            firstDay = new Date(y, m, 1);
            lastDay = new Date(y, m + 1, 0);
        } else {
            var date = new Date(),
                y = date.getFullYear(),
                m = date.getMonth();
            firstDay = new Date(y, m, 1);
            lastDay = new Date(y, m + 1, 0);
        }
        columnAndValue.start_date = moment(firstDay).format("YYYY-MM-DD")
        columnAndValue.end_date = moment(lastDay).format("YYYY-MM-DD")
    } else if (requestParam.type == "weekly") {
        var curr = new Date;
        var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
        var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
        columnAndValue.start_date = moment(firstday).format("YYYY-MM-DD")
        columnAndValue.end_date = moment(lastday).format("YYYY-MM-DD")
    } else if (requestParam.start_date) {
        columnAndValue.start_date = moment(requestParam.start_date).format('YYYY-MM-DD')
        columnAndValue.end_date = moment(requestParam.end_date).format('YYYY-MM-DD')
    }
    var salesReport = {};
    query.selectWithAndFilter(dbConstants.dbSchema.trips, { status: { $in: ["Cancel", "Complete"] } }, { _id: 0, trip_id: 1, status: 1, discount: 1, fetch_deduct_amount: 1, amount_pay: 1, created_at: 1, trip_datetime: 1, book_type: 1, schedule_datetime: 1 }, {}, {}, async function (error, trips) {
        const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { currency: 1 })
        let completed = _.where(trips, { status: tripConstants.status.complete });
        let cancelled = _.where(trips, { status: tripConstants.status.cancel });
        const completedTrips = []
        const cancelledTrips = []
        if(requestParam.type == "daily" || requestParam.type == "weekly" || requestParam.type == "monthly" || requestParam.start_date){
            each(completed, (singleTrip => {
                let compareDate = singleTrip.book_type === "Now" ? moment(singleTrip.created_at).format("YYYY-MM-DD") : moment(singleTrip.schedule_datetime).format("YYYY-MM-DD")
                    if (requestParam.type == "daily") {
                        if (moment(moment().format("YYYY-MM-DD")).isSame(compareDate)) {
                            completedTrips.push(singleTrip)
                        }
                    } else if (requestParam.type == "weekly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            completedTrips.push(singleTrip)
                        }
                    }
                    else if (requestParam.type == "monthly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            completedTrips.push(singleTrip)
                        }
                    } else if (requestParam.start_date) {
                        if (moment(moment(columnAndValue.start_date).format("YYYY-MM-DD")).isSame(compareDate)) {
                            completedTrips.push(singleTrip)
                        }
                    }
                }))

                each(cancelled, (singleTrip => {
                    let compareDate = singleTrip.book_type === "Now" ? moment(singleTrip.created_at).format("YYYY-MM-DD") : moment(singleTrip.schedule_datetime).format("YYYY-MM-DD")
                    if (requestParam.type == "daily") {
                        if (moment(moment(new Date()).format("YYYY-MM-DD")).isSame(compareDate)) {
                            cancelledTrips.push(singleTrip)
                        }
                    } else if (requestParam.type == "weekly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            cancelledTrips.push(singleTrip)
                        }
                    }
                    else if (requestParam.type == "monthly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            cancelledTrips.push(singleTrip)
                        }
                    } else if (requestParam.start_date) {
                        if (moment(moment(columnAndValue.start_date).format("YYYY-MM-DD")).isSame(compareDate)) {
                            cancelledTrips.push(singleTrip)
                        }
                    }
                }))
        }else{
            completedTrips.push(...completed)
            cancelledTrips.push(...cancelled)
        }
            let totalEarn = 0;
            let totalDiscount = 0;
         _.each(completedTrips, function (data) {
            const discount = data.discount ? data.discount.replace(/^\D+/g, '') : 0
            const earning = data.fetch_deduct_amount ? data.fetch_deduct_amount.replace(/^\D+/g, '') : 0
            let total = discount > 0 ? (-1 * parseFloat(discount)) : parseFloat(earning)
            totalEarn += total
        })
 
        salesReport.comTrips = completedTrips.length;
        salesReport.cancelTrips = cancelledTrips.length;
        salesReport.totTrips = completedTrips.length + cancelledTrips.length;
        salesReport.totalEarn = setting.currency + (totalEarn).toFixed(2);
        salesReport.message = "Revenue from " + completedTrips.length + " Rides";
        done(null, salesReport);
        return
    })
     //old code 
    // let columnAndValue = {};
    // if (requestParam.type == "daily") {
    //     var start = new Date();
    //     start.setHours(0, 0, 0, 0);
    //     var end = new Date();
    //     end.setHours(23, 59, 59, 999);
    //     columnAndValue.created_at = { $gte: start, $lt: end };
    // } else if (requestParam.type == 'monthly') {
    //     var firstDay, lastDay;
    //     if (requestParam.month) {
    //         var date = new Date();
    //         date.setMonth(parseInt(requestParam.month)), y = date.getFullYear(), m = date.getMonth();
    //         firstDay = new Date(y, m, 1);
    //         lastDay = new Date(y, m + 1, 0);
    //     } else {
    //         var date = new Date(),
    //             y = date.getFullYear(),
    //             m = date.getMonth();
    //         firstDay = new Date(y, m, 1);
    //         lastDay = new Date(y, m + 1, 0);
    //     }
    //     columnAndValue.created_at = { $gte: firstDay, $lt: lastDay };
    //     // var date = new Date(), y = date.getFullYear(), m = date.getMonth();
    //     // var firstDay = new Date(y, m, 1);
    //     // var lastDay = new Date(y, m + 1, 0);
    //     // columnAndValue.created_at={$gte: firstDay, $lt: lastDay};
    // } else if (requestParam.type == "weekly") {
    //     var curr = new Date;
    //     var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    //     var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
    //     columnAndValue.created_at = { $gte: firstday, $lt: lastday };
    // } else if(requestParam.start_date){
    //     columnAndValue.created_at = {$gte: new Date(moment(requestParam.start_date).format('YYYY-MM-DD')+'T00:00:00.000Z'), $lte: new Date(moment(requestParam.end_date).format('YYYY-MM-DD')+'T23:59:59.000Z')};
    // }
    // columnAndValue.status = { $in: ["Cancel", "Complete"]}
    // console.log(columnAndValue)
    // var salesReport = {};
    // query.selectWithAndFilter(dbConstants.dbSchema.trips, columnAndValue, { _id: 0, trip_id: 1, status: 1, discount: 1, fetch_deduct_amount : 1, amount_pay: 1, created_at: 1, trip_datetime:1 }, {}, {}, async function(error, trips) {
    //     salesReport.totTrips = trips.length;
    //     var completed = _.where(trips, { status: tripConstants.status.complete });
    //     let totalEarn = 0;
    //     let totalDiscount = 0;
    //     const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { currency: 1 })
    //     _.each(completed, function (data) {
    //         const discount = data.discount ? data.discount.replace(/^\D+/g, '') : 0
    //         const earning = data.fetch_deduct_amount.replace(/^\D+/g, '')
    //         let total = discount > 0 ? (-1 * parseFloat(discount)) : parseFloat(earning)
    //         console.log(total)
    //         totalEarn += total
    //     })
    //     var cancelled = _.where(trips, { status: tripConstants.status.cancel });
    //     salesReport.comTrips = completed.length;
    //     salesReport.cancelTrips = cancelled.length;
    //     salesReport.totalEarn = setting.currency + totalEarn.toFixed(2);
    //     salesReport.message = "Revenue from " + completed.length + " Rides";
    //     done(null, salesReport);
    // })
}

/*
 * Used for sales report
 *
 * @param {requestParam} - Object
 *
 * @param {Function} done - Callback function with error, payload params
 */
const salesDataReport = (requestParam, done) => {
   let columnAndValue = {};
    if (requestParam.type == "daily") {
        var start = new Date();
        start.setHours(0, 0, 0, 0);
        var end = new Date();
        end.setHours(23, 59, 59, 999);
        columnAndValue.start_date = moment(start).format("YYYY-MM-DD")
        columnAndValue.end_date = moment(end).format("YYYY-MM-DD")
    } else if (requestParam.type == 'monthly') {
        var firstDay, lastDay;
        if (requestParam.month) {
            var date = new Date();
            date.setMonth(parseInt(requestParam.month)), y = date.getFullYear(), m = date.getMonth();
            firstDay = new Date(y, m, 1);
            lastDay = new Date(y, m + 1, 0);
        } else {
            var date = new Date(),
                y = date.getFullYear(),
                m = date.getMonth();
            firstDay = new Date(y, m, 1);
            lastDay = new Date(y, m + 1, 0);
        }
        columnAndValue.start_date = moment(firstDay).format("YYYY-MM-DD")
        columnAndValue.end_date = moment(lastDay).format("YYYY-MM-DD")
    } else if (requestParam.type == "weekly") {
        var curr = new Date;
        var firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
        var lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
        columnAndValue.start_date = moment(firstday).format("YYYY-MM-DD")
        columnAndValue.end_date = moment(lastday).format("YYYY-MM-DD")
    } else if (requestParam.start_date) {
        columnAndValue.start_date = moment(requestParam.start_date).format('YYYY-MM-DD')
        columnAndValue.end_date = moment(requestParam.end_date).format('YYYY-MM-DD')
    }
    let joinArr = [{
        $lookup: {
            from: 'haribhagats',
            localField: 'haribhagat_id',
            foreignField: 'haribhagat_id',
            as: 'consumerDetails',
        },
    }, {
        //$unwind: "$consumerDetails",
        $unwind: {
           path: "$consumerDetails",
           "preserveNullAndEmptyArrays": true
         }
    }, {
        $lookup: {
            from: 'admins',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'driverDetails',
        },
    }, {
        $unwind: {
            path: "$driverDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $match: { status : { $in: [tripConstants.status.complete, tripConstants.status.cancel] }}
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            admin_id: "$admin_id",
            haribhagat_id: "$haribhagat_id",
            from_location: "$start_address",
            to_location: "$finish_address",
            total_price: "$total_price",
            amount_pay: "$amount_pay",
            payment_type: "$payment_type",
            fetch_deduct_amount: "$fetch_deduct_amount",
            fetch_deduct_percentage: "$fetch_deduct_percentage",
            finish_time: "$finish_time",
            created_at: "$created_at",
            discount: "$discount",
            coupon_code: "$coupon_code",
            schedule_datetime: "$schedule_datetime",
            trip_datetime:"$trip_datetime",
            status: "$status",
            book_type: "$book_type",
            admin: "$driverDetails.first_name",
            driver_last_name: "$driverDetails.last_name",
            consumer: "$consumerDetails.first_name",
            consumer_last_name: "$consumerDetails.last_name",
            charges: "$charges",
        },
    },{
        $sort: { finish_time: -1 }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, async(error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        let completed =  _.where(response, { status: tripConstants.status.complete });
        let cancelled =  _.where(response, { status: tripConstants.status.cancel });
        const completedTrips = []
        const cancelledTrips = []
        console.log("columnAndValue", columnAndValue)
        if(requestParam.type == "daily" || requestParam.type == "weekly" || requestParam.type == "monthly" || requestParam.start_date){
            each(completed, (singleTrip => {
                let compareDate = singleTrip.book_type === "Now" ? moment(singleTrip.created_at).format("YYYY-MM-DD") : moment(singleTrip.schedule_datetime).format("YYYY-MM-DD")
                    if (requestParam.type == "daily") {
                        if (moment(moment(new Date()).format("YYYY-MM-DD")).isSame(compareDate)) {
                            completedTrips.push(singleTrip)
                        }
                    } else if (requestParam.type == "weekly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            completedTrips.push(singleTrip)
                        }
                    }
                    else if (requestParam.type == "monthly") {
                        console.log("compareDate", compareDate, columnAndValue.start_date, columnAndValue.end_date)
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            completedTrips.push(singleTrip)
                        }
                    } else if (requestParam.start_date) {
                        if (moment(moment(columnAndValue.start_date).format("YYYY-MM-DD")).isSame(compareDate)) {
                            completedTrips.push(singleTrip)
                        }
                    }
                }))

                each(cancelled, (singleTrip => {
                    let compareDate = singleTrip.book_type === "Now" ? moment(singleTrip.created_at).format("YYYY-MM-DD") : moment(singleTrip.schedule_datetime).format("YYYY-MM-DD")
                    if (requestParam.type == "daily") {
                        if (moment(moment().format("YYYY-MM-DD")).isSame(compareDate)) {
                            cancelledTrips.push(singleTrip)
                        }
                    } else if (requestParam.type == "weekly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            cancelledTrips.push(singleTrip)
                        }
                    }
                    else if (requestParam.type == "monthly") {
                        if (moment(compareDate).isBetween(columnAndValue.start_date, columnAndValue.end_date)) {
                            cancelledTrips.push(singleTrip)
                        }
                    } else if (requestParam.start_date) {
                        if (moment(moment(columnAndValue.start_date).format("YYYY-MM-DD")).isSame(compareDate)) {
                            cancelledTrips.push(singleTrip)
                        }
                    }
                }))
        }else{
            completedTrips.push(...completed)
            cancelledTrips.push(...cancelled)
        }
        const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { currency : 1 })
       
        let columnsAndValues = [];
        const finalResponse = completedTrips.concat(cancelledTrips)
        _.each(finalResponse, function(data) {
            let driver_earning;
            if (!data.fetch_deduct_amount) {
                data.fetch_deduct_amount = '0';
            }
            if (!data.fetch_deduct_percentage) {
                data.fetch_deduct_percentage = '0';
            }
            let totlePrice = data.total_price.replace(/^\D+/g, '');
            if (!data.finish_time) {
                data.finish_time = data.created_at
            }
            data.discount = data.discount.replace(/^\D+/g, '');
            let totalPrice = data.total_price.replace(/^\D+/g, '');
            if (data.charges.length > 0) {
                let amount = _.pluck(data.charges, 'amount');
                amount = _.reduce(amount, function (memo, num) { return memo + num; }, 0);
                totalPrice = parseFloat(totalPrice)+amount
            }
            driver_earning = parseFloat(totalPrice) - parseFloat(data.fetch_deduct_amount);
            columnsAndValues.push({
                'id': data.trip_id,
                'trip_id': data.trip_id,
                'haribhagat_id': data.haribhagat_id,

                // 'consumer':data.consumer +" "+data.consumer_last_name,
                // 'admin':driver_name,

                'consumer': (data.consumer) ? data.consumer + " " + data.consumer_last_name : '',
                'admin': (data.admin) ? data.admin + " " + data.driver_last_name : '',

                'admin_id': data.admin_id,
                'from_location': data.from_location,
                'to_location': data.to_location,
                // 'payment':  parseFloat(data.amount_pay.replace(/^\D+/g, '')),
                'payment':  parseFloat(totalPrice),
                'status': data.status,
                'driver_earning': parseFloat(driver_earning).toFixed(2),
                'fetch_earning': data.discount ? (`-` + data.discount) :  parseFloat(data.fetch_deduct_amount).toFixed(2),
                'fetch_deduct_percentage': data.discount ? (`(${(data.coupon_code)}) Code Applied`) : data.fetch_deduct_percentage + "%",
                'payment_timeDate': (data.book_type != "Now" && data.status == "Cancel") ? moment(commonHandler.converTotimeZone(data.schedule_datetime)).format("Do MMM YYYY h:mm A") : moment(commonHandler.converTotimeZone(data.finish_time)).format("Do MMM YYYY h:mm A"),
                'created_at': data.created_at
                // 'payment_timeDate':moment(data.finish_time).format("Do MMM YYYY h:mm A")
                // 'payment_timeDate': data.payment_type === "Stripe" ? moment(commonHandler.converTotimeZone(data.created_at)).format("Do MMM YYYY h:mm A") : moment(commonHandler.converTotimeZone(data.finish_time)).format("Do MMM YYYY h:mm A")
            });
        });
        done(null, columnsAndValues);
    });
}

const tripCommissionReport = (requestParam, done) => {
    let columnAndValue = {};
    columnAndValue.status = { $in: [tripConstants.status.complete] }
    let joinArr = [{
        $lookup: {
            from: 'haribhagats',
            localField: 'haribhagat_id',
            foreignField: 'haribhagat_id',
            as: 'consumerDetails',
        },
    }, {
        $unwind: {
           path: "$consumerDetails",
           "preserveNullAndEmptyArrays": true
         }
    }, {
        $lookup: {
            from: 'admins',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'driverDetails',
        },
    }, {
        $unwind: {
            path: "$driverDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $match: columnAndValue
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            admin_id: "$admin_id",
            haribhagat_id: "$haribhagat_id",
            from_location: "$start_address",
            to_location: "$finish_address",
            total_price: "$total_price",
            amount_pay: "$amount_pay",
            payment_type: "$payment_type",
            fetch_deduct_amount: "$fetch_deduct_amount",
            fetch_deduct_percentage: "$fetch_deduct_percentage",
            finish_time: "$finish_time",
            created_at: "$created_at",
            discount: "$discount",
            coupon_code: "$coupon_code",
            status: "$status",
            admin: "$driverDetails.first_name",
            driver_last_name: "$driverDetails.last_name",
            consumer: "$consumerDetails.first_name",
            consumer_last_name: "$consumerDetails.last_name",
            charges: "$charges",
        },
    },{
        $sort: { finish_time: -1 }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        let columnsAndValues = [];
        _.each(response, function(data) {
            let driver_earning;
            let totlePrice = data.total_price.replace(/^\D+/g, '');
            if (!data.finish_time) {
                data.finish_time = data.created_at
            }
            data.discount = data.discount.replace(/^\D+/g, '');
            let totalPrice = data.total_price.replace(/^\D+/g, '');
            if (data.charges.length > 0) {
                let amount = _.pluck(data.charges, 'amount');
                amount = _.reduce(amount, function (memo, num) { return memo + num; }, 0);
                totalPrice = parseFloat(totalPrice)+amount
            }
            driver_earning = parseFloat(totalPrice) - parseFloat(data.fetch_deduct_amount);
            if(!data.coupon_code && !data.discount){
                columnsAndValues.push({
                    'id': data.trip_id,
                    'trip_id': data.trip_id,
                    'haribhagat_id': data.haribhagat_id,
                    'consumer': (data.consumer) ? data.consumer + " " + data.consumer_last_name : '',
                    'admin': (data.admin) ? data.admin + " " + data.driver_last_name : '',    
                    'admin_id': data.admin_id,
                    'from_location': data.from_location,
                    'to_location': data.to_location,
                    // 'payment': data.amount_pay.replace(/^\D+/g, '$'),
                    'payment':  parseFloat(totalPrice),
                    'status': data.status,
                    'driver_earning': parseFloat(driver_earning).toFixed(2),
                    'fetch_earning': parseFloat(data.fetch_deduct_amount).toFixed(2),
                    'fetch_deduct_percentage': data.fetch_deduct_percentage + "%",
                    'payment_timeDate': moment(commonHandler.converTotimeZone(data.finish_time)).format("Do MMM YYYY h:mm A")
                });
            }
           
        });
        done(null, columnsAndValues);
    });
}

const tripDiscountReport = (requestParam, done) => {
    let columnAndValue = {};
    columnAndValue.status = { $in: [tripConstants.status.complete] }
    let joinArr = [{
        $lookup: {
            from: 'haribhagats',
            localField: 'haribhagat_id',
            foreignField: 'haribhagat_id',
            as: 'consumerDetails',
        },
    }, {
        $unwind: {
           path: "$consumerDetails",
           "preserveNullAndEmptyArrays": true
         }
    }, {
        $lookup: {
            from: 'admins',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'driverDetails',
        },
    }, {
        $unwind: {
            path: "$driverDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $match: columnAndValue
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            admin_id: "$admin_id",
            haribhagat_id: "$haribhagat_id",
            from_location: "$start_address",
            to_location: "$finish_address",
            total_price: "$total_price",
            amount_pay: "$amount_pay",
            payment_type: "$payment_type",
            fetch_deduct_amount: "$fetch_deduct_amount",
            fetch_deduct_percentage: "$fetch_deduct_percentage",
            finish_time: "$finish_time",
            created_at: "$created_at",
            discount: "$discount",
            coupon_code: "$coupon_code",
            status: "$status",
            admin: "$driverDetails.first_name",
            driver_last_name: "$driverDetails.last_name",
            consumer: "$consumerDetails.first_name",
            consumer_last_name: "$consumerDetails.last_name",
        },
    },{
        $sort: { finish_time: -1 }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        let columnsAndValues = [];
        _.each(response, function(data) {
            let driver_earning,payment_amount;
            let totlePrice = data.total_price.replace(/^\D+/g, '');
            // driver_earning = parseFloat(totlePrice) - parseFloat(data.fetch_deduct_amount);
            payment_amount = parseFloat(totlePrice) - parseFloat(data.discount.replace(/^\D+/g, ''))
            if (!data.finish_time) {
                data.finish_time = data.created_at
            }
            data.discount = data.discount.replace(/^\D+/g, '');
            if(data.coupon_code && data.discount){
                columnsAndValues.push({
                    'id': data.trip_id,
                    'trip_id': data.trip_id,
                    'haribhagat_id': data.haribhagat_id,
                    'consumer': (data.consumer) ? data.consumer + " " + data.consumer_last_name : '',
                    'admin': (data.admin) ? data.admin + " " + data.driver_last_name : '',    
                    'admin_id': data.admin_id,
                    'from_location': data.from_location,
                    'to_location': data.to_location,
                    'payment': payment_amount,
                    'status': data.status,
                    'coupon_code':data.coupon_code,
                    'total_price':data.total_price.replace(/^\D+/g, ' '),
                    // 'driver_earning': parseFloat(driver_earning).toFixed(2),
                    'discount': data.discount,
                    'payment_timeDate': moment(commonHandler.converTotimeZone(data.finish_time)).format("Do MMM YYYY h:mm A")
                });
            }
           
        });
        done(null, columnsAndValues);
    });
}

const packageHistory = function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
    let joinArr = [{
        $lookup: {
            from: 'packages',
            localField: 'package_id',
            foreignField: 'package_id',
            as: 'packageDetails'
        }
    }, {
        $unwind: "$packageDetails"
    },  {
        $lookup: {
            from: 'admins',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'driverDetails',
        },
    }, {
        $unwind: "$driverDetails",
    }, {
        $project: {
            _id: 0,
            package_id: "$packageDetails.package_id",
            transaction_id: "$transaction_id",
            buy_date: "$buy_date",
            title: "$packageDetails.title",
            amount: "$packageDetails.amount",
            package_type: "$packageDetails.package_type",
            driver_fName:'$driverDetails.first_name',
            driver_lName:'$driverDetails.last_name',
            package_value: "$packageDetails.package_value",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.package_history, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        _.each(response, (element, index) => {
            element.buy_date = moment(element.buy_date).format('D MMMM, YYYY');
            element.amount = setting.currency + element.amount;
            element.package_value= element.package_value + " " + element.package_type
            element.admin = element.driver_fName + " " + element.driver_lName
        })
        done(null, response);
    });
})
};

const getWithdrawalCharge =  function(requestParam, done) {
    let joinArr1 = [
        {
        $lookup: {
            from: 'transfer_requests',
            localField: 'admin_id',
            foreignField: 'admin_id',
            as: 'transferDetails',
        },
        },{
            $unwind: "$transferDetails"
        }, 
        {
        $project: {
            _id: 0,
            transfer_id:'$transferDetails.transfer_id',
            admin_id: "$admin_id",
            first_name: "$first_name",
            last_name: "$last_name",
            amount: "$transferDetails.amount",
            admin_charge: "$transferDetails.admin_charge",
            status: "$transferDetails.status",
            transafer_date:'$transferDetails.date'
            
        },
    }];
    query.joinWithAnd(dbConstants.dbSchema.admins, joinArr1, (error, response) => { 
        let columnAndValues = [];
        response = JSON.parse(JSON.stringify(response));
        _.each(response, function (data) {
            if(data.status == 'Paid'){
                data.admin = data.first_name + " " + data.last_name;
                data.transafer_date = moment(data.transafer_date).format('D MMMM, YYYY');
                data.amount = data.amount.replace(/^\D+/g, ' ')
                columnAndValues.push(data)
            }
        })
        done(null, columnAndValues);
        return
    })
};

const getReffralAmount =  function(requestParam, done) {
    let joinArr1 = [
        {
        $lookup: {
            from: 'haribhagats',
            localField: 'user_id',
            foreignField: 'haribhagat_id',
            as: 'consumerDetails',
        },
        },{
            $unwind: "$consumerDetails"
        }, 
       { $match: {wallet_transaction_type : 'invite_friend'}},
        {
        $project: {
            _id: 1,
            wallet_id:'$wallet_id',
            haribhagat_id:'$consumerDetails.haribhagat_id',
            fname:'$consumerDetails.first_name',
            lname:'$consumerDetails.last_name',
            transaction_id:'$transaction_id',
            invite_code:'$consumerDetails.invite_code',
            amount:'$amount',
            debit_date:'$created_at'
            
        },
    }];
    query.joinWithAnd(dbConstants.dbSchema.wallet_history, joinArr1, (error, response) => { 
        let columnAndValues = [];
        response = JSON.parse(JSON.stringify(response));
        _.each(response, function (data) {
                data.id = data._id
                data.name = data.fname + " " + data.lname;
                data.debit_date = moment(data.debit_date).format('D MMMM, YYYY');
                columnAndValues.push(data)
        })
        done(null, columnAndValues);
        return
    })
};
const getAdminEarning =  function(requestParam, done) {
    let response_obj={}
    query.selectWithAnd(dbConstants.dbSchema.transfer_requests, { status: "Paid" }, (err, withdraw) => {
        let joinArr = [{
            $lookup: {
                from: 'packages',
                localField: 'package_id',
                foreignField: 'package_id',
                as: 'packageDetails'
            }
        }, {
            $unwind: "$packageDetails"
        }, {
            $project: {
                _id: 0,
                amount: "$packageDetails.amount",
            }
        }];
    query.joinWithAnd(dbConstants.dbSchema.package_history, joinArr, (err, packages) => {  
        query.selectWithAnd(dbConstants.dbSchema.trips, {status: 'Complete'}, (error, trips) => {
            query.selectWithAnd(dbConstants.dbSchema.wallet_history, { wallet_transaction_type: 'invite_friend' }, (err, refferal) => {
                let totalCommission=0, totalDiscount=0,totalRefferal=0;
                let getData = pluck(withdraw, "admin_charge")
                let withdrawalChargeTotal = _.reduce(getData, function (prevValue, currentValue) {
                    return prevValue + currentValue;
                },0);
                response_obj.withdrawalCharge = withdrawalChargeTotal
                let getPackageData = pluck(packages,"amount")
                let package_amount_total = _.reduce(getPackageData, function (prevValue, currentValue) {
                    return prevValue + currentValue;
                },0);
                response_obj.packageAmount = package_amount_total
                _.each(trips, function (data) {
                    if(data.discount == '' && data.coupon_code==''){
                        totalCommission+= data.fetch_deduct_amount ? parseFloat(data.fetch_deduct_amount) : 0
                    }else if(data.discount && data.coupon_code){
                        totalDiscount+=parseFloat(data.discount.replace(/^\D+/g, ''))
                    }
                })
                let getReffralData = pluck(refferal, "amount")
                totalRefferal = _.reduce(getReffralData, function (prevValue, currentValue) {
                    return prevValue + currentValue;
                },0);
                response_obj.totalCommission = totalCommission.toFixed(2)
                response_obj.totalDiscount = totalDiscount.toFixed(2)
                // let totalEarning =withdrawalChargeTotal + package_amount_total + totalCommission - totalDiscount -totalRefferal
                let totalEarning =withdrawalChargeTotal + totalCommission - totalDiscount -totalRefferal
                response_obj.totalEarning = totalEarning.toFixed(2)
                response_obj.totalReferralAmount = totalRefferal.toFixed(2)
                done(null, response_obj)
            })            
        })
        
    })
    })
};

const AdminEarning = async (requestParam, done) => {
       try {
           query.selectWithAnd(dbConstants.dbSchema.transfer_requests, { status: "Paid" }, (err, res) => {
              let getData = pluck(res, "admin_charge")
              let adminTotal = _.reduce(getData, function (memo, num) {
                  return memo + num;
              },0);
              done(null, { data: res, totalEarn: adminTotal })
         })
       } catch (error) {
           console.log("error", error)
           done(errors.internalServer(true), null);
           return;
       }
}
module.exports = {
    getReport: getReport,
    getCreditReport: getCreditReport,
    getFilterReport: getFilterReport,
    discountReport,
    tripReport,
    salesReport,
    salesDataReport,
    AdminEarning,
    tripCommissionReport,
    tripDiscountReport,
    packageHistory,
    getWithdrawalCharge,
    getAdminEarning,
    getReffralAmount
};
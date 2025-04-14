'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const tripConstants = require('./../constants/trip-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
let moment = require('moment');
const Admin = require('./../models/admin');
const Haribhagat = require('../models/haribhagat');
// const VehicleType = require('./../models/vehicle-type');
const config = require('./../config');
const commonHandler = require('./common-handler')

/*
 * Used to delete coupon by id 
 * @param {DashboardDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const getData = function(DashboardDetails, done) {
//     query.selectWithAndNew(dbConstants.dbSchema.haribhagats, { is_archive: 'false' } , function (error, haribhagats) {
//         let columnAndValuesDone = {
//             total_haribhagt: 10,
//             total_family_members: 20,
//             total_monthly_donated: 2
//         }
//         done(null, columnAndValuesDone);
//     })
// };
const getData = function (DashboardDetails, done) {
    let total_haribhagat = 0;
    let total_family_members = 0;
    let total_monthly_donated = 0;
    let total_sabha = 0;
    let last_sabha_attendees = 0;
    let last_sabha_id = null;
    let new_attendees_count = 0;

    query.selectWithAnd(dbConstants.dbSchema.haribhagats, async function (error, haribhagats) {
        if (error) {
            return done(error);
        }

        total_haribhagat = haribhagats.length;

        haribhagats.forEach(function (haribhagat) {
            total_family_members += haribhagat.number_of_family_member;
            if (haribhagat.is_memeber_of_land_donation) {
                total_monthly_donated++;
            }
        });
        query.selectWithAnd(dbConstants.dbSchema.sabha, {}, async function (error, sabha) {
            if (error) {
                return done(error);
            }

            total_sabha = sabha.length;
           

                // Sort sabhas by date (descending) so we can easily find the current and previous sabhas
                const sortedSabhas = sabha.sort((a, b) => b.sabha_date - a.sabha_date);
                console.log("data ",sortedSabhas)
                last_sabha_id=sortedSabhas[0].sabha_id;
                // Initialize variables to track the new attendees
                let lastSabhaAttendees = [];
                let currentSabhaAttendees = [];
                let last_sabha_attendees=sortedSabhas[0].attendees.length;
                // Iterate over all sabhas to find new attendees for each
                new_attendees_count = 0;
            // We will now check the most recent sabha against its previous sabha
            for (let i = 0; i < sortedSabhas.length - 1; i++) {
                const currentSabha = sortedSabhas[i];
                const lastSabha = sortedSabhas[i + 1];

                // Ensure both sabhas have attendees
                if (currentSabha && lastSabha) {
                    currentSabhaAttendees = currentSabha.attendees || [];
                    lastSabhaAttendees = lastSabha.attendees || [];

                    // Find attendees who are in the current sabha but not in the previous sabha
                    const newAttendees = currentSabhaAttendees.filter(attendee => !lastSabhaAttendees.includes(attendee));

                    // Increment the count of new attendees
                    new_attendees_count += newAttendees.length;
                }
            }



                const today = new Date();
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Get date for next week
                
                const query1 = {
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$birth_date" }, today.getMonth() + 1] }, // Adding 1 because $month returns 1-based month
                            { $gte: [{ $dayOfMonth: "$birth_date" }, today.getDate()] },
                            { $lte: [{ $dayOfMonth: "$birth_date" }, nextWeek.getDate()] }
                        ]
                    }
                };

                query.selectWithAnd(dbConstants.dbSchema.haribhagats, query1, function (error, count) {
                    if (error) {
                        logger('Error: can not get haribhagats count', dbConstants.dbSchema.haribhagats);
                        done(error, null);
                        return;
                    }
                    let columnAndValuesDone = {
                        total_haribhagat: total_haribhagat,
                        total_family_members: total_family_members,
                        total_monthly_donated: total_monthly_donated,
                        upcoming_birthdays: count.length,
                        total_sabha: total_sabha,
                        last_sabha_attendees: last_sabha_attendees,
                        last_sabha_id: last_sabha_id,
                        new_attendees_count: new_attendees_count  // Count of new attendees across all sabhas
                    };
                    
                    done(null, columnAndValuesDone);
                });
                
            // });
        });
    });
};

/*
 * Used to get month wise created user and admin
 * @param {DashboardDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const getDataMonthWise = function (DashboardDetails, done) {
    let month = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    let jan = 0;
    let feb = 0;
    let mar = 0;
    let apr = 0;
    let may = 0;
    let june = 0;
    let july = 0;
    let aug = 0;
    let sep = 0;
    let oct = 0;
    let nov = 0;
    let dec = 0;
    query.selectWithAnd(dbConstants.dbSchema.haribhagats, function (error, haribhagats) {

        for (var i = 0; i < haribhagats.length; i++) {
            for (var j = 0; j < month.length; j++) {
                if (moment(haribhagats[i].created_at).format('M') == month[j]) {
                    if (month[j] == '1') {
                        jan++;
                    } else if (month[j] == '2') {
                        feb++;
                    } else if (month[j] == '3') {
                        mar++;
                    } else if (month[j] == '4') {
                        apr++;
                    } else if (month[j] == '5') {
                        may++;
                    } else if (month[j] == '6') {
                        june++;
                    } else if (month[j] == '7') {
                        july++;
                    } else if (month[j] == '8') {
                        aug++;
                    } else if (month[j] == '9') {
                        sep++;
                    } else if (month[j] == '10') {
                        oct++;
                    } else if (month[j] == '11') {
                        nov++;
                    } else if (month[j] == '12') {
                        dec++;
                    }
                }
            }
        }

        let consumerChart = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Total haribhagats',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data: [jan, feb, mar, apr, may, june, july, aug, sep, oct, nov, dec]
            }]
        };

        jan = 0;
        feb = 0;
        mar = 0;
        apr = 0;
        may = 0;
        june = 0;
        july = 0;
        aug = 0;
        sep = 0;
        oct = 0;
        nov = 0;
        dec = 0;
        let onDriver = 0;
        let offDriver = 0;

        query.selectWithAnd(dbConstants.dbSchema.admins, function (error, admins) {
            for (var k = 0; k < admins.length; k++) {
                for (var m = 0; m < month.length; m++) {
                    if (moment(admins[k].created_at).format('M') == month[m]) {
                        if (admins[k].online_status == 'On') {
                            onDriver++;
                        } else {
                            offDriver++;
                        }

                        if (month[m] == '1') {
                            jan++;
                        } else if (month[m] == '2') {
                            feb++;
                        } else if (month[m] == '3') {
                            mar++;
                        } else if (month[m] == '4') {
                            apr++;
                        } else if (month[m] == '5') {
                            may++;
                        } else if (month[m] == '6') {
                            june++;
                        } else if (month[m] == '7') {
                            july++;
                        } else if (month[m] == '8') {
                            aug++;
                        } else if (month[m] == '9') {
                            sep++;
                        } else if (month[m] == '10') {
                            oct++;
                        } else if (month[m] == '11') {
                            nov++;
                        } else if (month[m] == '12') {
                            dec++;
                        }
                    }
                }
            }

            let driverChart = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Total Drivers',
                    backgroundColor: 'rgba(255,99,132,0.2)',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                    hoverBorderColor: 'rgba(255,99,132,1)',
                    data: [jan, feb, mar, apr, may, june, july, aug, sep, oct, nov, dec]
                }]
            };
            let onOffDriverChart = {
                labels: [
                    'Online Drivers',
                    'Offline Drivers'
                ],
                datasets: [{
                    data: [onDriver, offDriver],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB'
                    ],
                    hoverBackgroundColor: [
                        '#FF6384',
                        '#36A2EB'
                    ]
                }]
            };

            let columnAndValues = {
                consumerChart: consumerChart,
                driverChart: driverChart,
                onOffDriverChart: onOffDriverChart
            }
            done(null, columnAndValues);
        });

    });
};


/*
 * Retrieves the details of get admin
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const getRatingRevenue = (requestParam, done) => {
    let columnAndValuesDrivers = [];
    let columnAndValuesRatings = [];
    let columnAndValuesRevenues = [];
    query.selectWithAnd(dbConstants.dbSchema.admins, { status: 'Active' }, function (error, admins) {
        async.forEachSeries(admins, function (singleDri, Callback_dri) {
            let columnsAndValueTripDriver = {
                admin_id: singleDri.admin_id,
            }
            let count = 0;
            let rating = 0;
            let revenue = 0;
            query.selectWithAnd(dbConstants.dbSchema.tripdrivers, columnsAndValueTripDriver, function (error, tripDriver) {
                if (tripDriver.length > 0) {
                    async.forEachSeries(tripDriver, function (singleTrip, Callback_s1) {
                        let columnsAndValueTrip = {
                            trip_id: singleTrip.trip_id
                        }
                        query.selectWithAndOne(dbConstants.dbSchema.trips, columnsAndValueTrip, function (error, trip) {
                            if (trip != null && trip.status == tripConstants.status.complete) {
                                // for rating
                                if (!trip.consumer2driver_rating || trip.consumer2driver_rating == null || trip.consumer2driver_rating == '') {
                                    trip.consumer2driver_rating = '0';
                                }
                                count++;
                                rating = parseFloat(rating) + parseFloat(trip.consumer2driver_rating);
                                //end rating
                                // for revenue
                                if (!trip.fetch_deduct_amount || trip.fetch_deduct_amount == null || trip.fetch_deduct_amount == '') {
                                    trip.fetch_deduct_amount = '0';
                                }
                                let totalPrice = trip.total_price.replace(/^\D+/g, '');
                                let driRevenue = parseFloat(totalPrice) - parseFloat(trip.fetch_deduct_amount);
                                revenue = parseFloat(revenue) + parseFloat(driRevenue);
                                //end revenue
                                Callback_s1();
                            } else {
                                Callback_s1();
                            }
                        });
                    }, function () {
                        let driverRating
                        if (count == 0) {
                            driverRating = 0;
                        } else {
                            driverRating = parseFloat(rating / count).toFixed(1);
                        }
                        columnAndValuesDrivers.push(singleDri.first_name + ' ' + singleDri.last_name);
                        columnAndValuesRatings.push(driverRating);
                        columnAndValuesRevenues.push(parseFloat(revenue).toFixed(2));
                        Callback_dri();
                    });
                } else {
                    Callback_dri();
                }
            });
        }, function () {
            let ratingChart = {
                labels: columnAndValuesDrivers,
                datasets: [{
                    label: 'Ratings',
                    backgroundColor: 'rgba(255,99,132,0.2)',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                    hoverBorderColor: 'rgba(255,99,132,1)',
                    data: columnAndValuesRatings
                }]
            };
            let revenueChart = {
                labels: columnAndValuesDrivers,
                datasets: [{
                    label: 'Revenues',
                    backgroundColor: 'rgba(255,99,132,0.2)',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                    hoverBorderColor: 'rgba(255,99,132,1)',
                    data: columnAndValuesRevenues
                }]
            };
            let columnAndValuesDone = {
                ratingChart: ratingChart,
                revenueChart: revenueChart
            }
            done(null, columnAndValuesDone);
        });
    });
};

/*
 * order commission statistics
 *
 * @param {requestParam} - null
 *
 * @param {Function} done - Callback function with error, payload params
 */
const commision = (req, done) => {
    let year = moment().format('YYYY');
    let monthArr = _.range(1, 13);
    let tripCntArr = [];
    let commissionCntArr = [];
    async.forEachSeries(monthArr, function (singleMonth, callbackSingleMonth) {
        query.selectWithAggregation(dbConstants.dbSchema.trips, singleMonth, year, (error, trip) => {
            if (error) {
                logger('Error: can not get trip');
                done(errors.internalServer(true), null);
                return;
            }
            let sum = trip.reduce((s, f) => {
                f.total_price = f.total_price.replace(/^\D+/g, '');
                return s + parseFloat(f.total_price); // return the sum of the accumulator and the current time, as the the new accumulator
            }, 0);
            tripCntArr.push(parseInt(sum));
            //commissionCntArr.push(trip.reduce((s, f) => parseInt(s + f.chefsy_earning), 0));
            callbackSingleMonth();
        })
    }, function () {
        let tripCommissionObj = {
            sales: tripCntArr,
            //commission: commissionCntArr
        };
        done(null, tripCommissionObj);
    })
};


const mapboxDriverDashboard = function (req, done) {
    var markers = [];
    var firebaseDriverArr = [];
    config.firebase.driverRef.once("value", function (snapshot) {
        markers = snapshot.val();
        async.forEachSeries(markers, function (single_marker, callback_single_marker) {
            query.selectWithAndOne(dbConstants.dbSchema.admins, {
                'admin_id': single_marker.admin_id
            }, function (error, admin) {
                if (error) {
                    callback_single_marker();
                } else {
                    if (admin != null && admin.vehicle_type_id) {
                        let innerObj = {
                            'lat': single_marker.latitude,
                            'lng': single_marker.longitude,
                            'admin': admin.first_name + ' ' + admin.last_name,
                            'mobile': admin.mobile
                        }
                        firebaseDriverArr.push(innerObj);
                        callback_single_marker();
                    } else {
                        callback_single_marker();
                    }
                }
            })
        }, function () {
            let array = [];
            for (var i = 0; i < firebaseDriverArr.length; i++) {
                array.push({
                    "type": "Feature",
                    "properties": {
                        "description": firebaseDriverArr[i].admin + " >> " + firebaseDriverArr[i].mobile,
                        "icon": "theatre"
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [firebaseDriverArr[i].lng, firebaseDriverArr[i].lat]
                    }
                })
            }
            var url = {
                "type": "FeatureCollection",
                "features": array
            }
            done(null, url);
        })
    }, function (errorObject) {
        done(null, markers);
    });
};


module.exports = {
    getData: getData,
    getDataMonthWise: getDataMonthWise,
    getRatingRevenue: getRatingRevenue,
    commision,
    mapboxDriverDashboard
};
'use strict';

const logger = require('../utils/logger');
const jsonResponse = require('../utils/json-response');
const errors = require('../utils/dz-errors');
const dbConstants = require('../constants/db-constants');
const consumerConstants = require('../constants/consumer-constants');
const query = require('../utils/query-creator');
const config = require('../config');
let async = require('async');
let _ = require('underscore');
const WhatsAppMessage = require('../utils/wwebjs-handler')
const Haribhagat = require('../models/haribhagat');
const Admin = require('../models/admin')
const ConsumerAddress = require('../models/consumer-addresses');
const Sabha = require('../models/sabha')
const twilio = require('twilio');
const path = require('path')
const PDFDocument = require('pdfkit');
const fs = require('file-system');
const sortBy = require('sort-array');
const moment = require('moment');
const unique = require('array-unique');
require('../models/setting')
const passwordHandler = require('../utils/password-handler');
const S3Manager = require('../utils/s3-manager');
const {
    generateString,
} = require('../utils/random-string-generator');
const accountSid = 'AC44e1748e159d39718a4517c5184b9bac';   // Twilio Account SID
const authToken = "4cbcfe6f0dbbdc5b11de3f0847386f61";     // Twilio Auth Token
const fromMobileNo = process.env.TWILIO_MOBILE_NO;
// const client = twilio(accountSid, authToken);

//SES
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: config.aws.keyId,
    secretAccessKey: config.aws.key,
    region: config.aws.sesRegion
});
const awsSES = new AWS.SES({ apiVersion: '2010-12-01' });
//ses
const s3 = new AWS.S3();
const S3Handler = require('../utils/s3-handler');
const s3Handler = new S3Handler();
let bucketName = config.aws.s3.consumerBucket;
let assetsbucket = config.aws.s3.assetsBucket;

const commonHandler = require('./common-handler');
const driverHandler = require('./admin-handler')

// const mailgun = require('mailgun-js')({
//     apiKey: config.mailgunInfo.api_key,
//     domain: config.mailgunInfo.domain
// });
const replaceOnce = require('replace-once');
const { formatString } = require('../utils/stringGenerator');
const urlExists = require('url-exists');
const adminConstants = require('../constants/admin-constants');
const cron = require('node-cron');
const { count } = require('console');


//for image upload on AWS

const uploadImage = function (req, done) {
    let fileType;
    fileType = req.files.profile_picture.name.split('.').pop();
    const fileName = Math.floor(Date.now() / 1000);
    req.files[_.keys(req.files)[0]]['file_name'] = fileName + '.' + fileType;
    s3Handler.upload(req.files[_.keys(req.files)[0]], bucketName, fileType, (error, imageData) => {
        if (error) {
            logger('Error: failed to Upload  ', +fileType + ' ' + 'Image' + 'Failed with error:', error);
            done(error, null);
            return;
        }
        done(null, imageData.Location);
    });
};

//for image upload on AWS
// const removePhoto = function(requestParam, done) {
//     const fileName = /[^/]*$/.exec(requestParam.profilePic)[0];
//     s3Handler.deleteFile(fileName, bucketName, (errS3FileDelete, removePhoto) => {
//         let columnsAndValues = {
//             profile_picture: ''
//         }
//         query.updateSingle(dbConstants.dbSchema.haribhagats, columnsAndValues, { haribhagat_id: requestParam.haribhagat_id }, function(error, consumerUpdated) {
//             if (error) {
//                 done(null, [{ code: '0' }])
//             } else {
//                 done(null, [{ code: '1' }])
//             }
//         });
//     });

// };

/*
 * Used to get consumer with get methods
 * @param {Function} done - Callback function with error
 */
const getHaribhagat = async function (requestParam, req, done) {
    const fullUrl = req.protocol + '://' + req.get('host').split(":")[0];
    const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { currency: 1 })
    // done(null, haribhagatDetails);
    
    if (requestParam.haribhagat_id) {
        query.selectWithAndOne(dbConstants.dbSchema.haribhagats, requestParam, async function (error, consumer) {
            if (error) {
                logger('Error: can not get consumer', dbConstants.dbSchema.haribhagats);
                done(error, null);
                return;
            }
         

            if (!consumer) {
                done(errors.resourceNotFound(true), null);
                return;
            }
    
            // Fetch sabhas attended by this Haribhagat
            const totalSabhas = await Sabha.count({});
            const attendedSabhas = await Sabha.find({ attendees: consumer.haribhagat_id });
            const totalSabhaCount = totalSabhas

            const haribhagatDetails = {
                haribhagat_id: consumer.haribhagat_id,
                _id: 0,
                surname: consumer.surname,
                first_name: consumer.first_name,
                middle_name: consumer.middle_name,
                gender: consumer.gender,
                address: consumer.address,
                house_no: consumer.house_no,
                street: consumer.street,
                landmark: consumer.landmark,
                native_place : consumer.native_place,
                post_office: consumer.post_office,
                area: consumer.area,
                district: consumer.district,
                sub_district: consumer.sub_district,
                state: consumer.state,
                pin_code: consumer.pin_code,
                number_of_family_member:consumer.number_of_family_member,
                business_name:consumer.business_name,
                birth_date:consumer.birth_date,
                anniversary_date:consumer.anniversary_date,
                email: consumer.email,
                mobile_country_code: consumer.mobile_country_code,
                mobile: consumer.mobile,
                created_at: consumer.created_at,
                profile_picture: consumer.profile_picture,
                is_memeber_of_sahajanadi_sabha: consumer.is_memeber_of_sahajanadi_sabha,
                is_member_of_other_donation: consumer.is_member_of_other_donation,
                is_memeber_of_land_donation: consumer.is_memeber_of_land_donation,
                is_own_home: consumer.is_own_home,
                total_sabha_count: totalSabhaCount, // total sabha count
                attended_sabhas: attendedSabhas.map(sabha => ({
                    sabha_id: sabha.sabha_id,
                    sabha_name: sabha.sabha_name,
                    sabha_date: sabha.sabha_date,
                }))
            };


            haribhagatDetails.displayEmail = consumer.email;
            haribhagatDetails.displayMobile = consumer.mobile;
            haribhagatDetails.profile_picture = consumer.profile_picture || `${fullUrl}${adminConstants.placeholder.admin}`;
            done(null, haribhagatDetails);
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
            $match: { haribhagat_id: requestParam.type }
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
                id_number: "$id_number",
                location_sharing: "$location_sharing",
                location_updates: "$location_updates",
                wallet_balance: "$wallet_balance",
                suppoer_contact: "$suppoer_contact",
                notification: "$notification",               
                total_sabha_count: "$total_sabha_count",    // Ensure these fields are included
                attended_sabhas: "$attended_sabhas" 
            }
        }];
        query.joinWithAnd(dbConstants.dbSchema.haribhagats, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }

            response[0].email = (response[0].email);
            response[0].mobile = response[0].mobile;
            response[0].account_trip_updates = response[0].notification.account_trip_updates;
            response[0].discount_news_updates = response[0].notification.discount_news_updates;
            response[0].wallet_balance = setting.currency + response[0].wallet_balance;

            urlExists(generateFullURL(response[0].profile_picture), (errImageUrl, exists) => {
                response[0].profile_picture = exists ? generateFullURL(response[0].profile_picture) : `${fullUrl}${adminConstants.placeholder.admin}`,
                    done(null, response[0])
            });
        });
    } else {
        let joinArr = [{
            "$match": { is_archive: 'false' }
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
            }
        }];

        if (requestParam.family_id == true) {
            query.selectWithAnd(dbConstants.dbSchema.haribhagats, { family_id: { $ne: "" } }, function (error, haribhagats) {
                if (error) {
                    logger('Error: can not get countries', dbConstants.dbSchema.haribhagats);
                    done(error, null);
                    return;
                }
                done(null, haribhagats);
            });
        } else {
            if (req.query.is_memeber_of_land_donation == 'true') {
                query.selectWithAnd(dbConstants.dbSchema.haribhagats, { is_memeber_of_land_donation: true }, function (error, haribhagats) {
                    if (error) {
                        logger('Error: can not get countries', dbConstants.dbSchema.haribhagats);
                        done(error, null);
                        return;
                    }
                    done(null, haribhagats);
                });
            } else if (req.query.upcoming_birthdays == 'true') {
                const today = new Date();
                const birthdayLimitDays = parseInt(req.query.birthday_limit_days) || 7;

                const startDate = new Date(today);
                const endDate = new Date(today.getTime() + birthdayLimitDays * 24 * 60 * 60 * 1000);

                const query1 = {
                    $expr: {
                        $and: [
                            { $gte: [{ $month: "$birth_date" }, startDate.getMonth() + 1] },
                            { $lte: [{ $month: "$birth_date" }, endDate.getMonth() + 1] },
                            {
                                $or: [
                                    { $gt: [{ $month: "$birth_date" }, startDate.getMonth() + 1] },
                                    {
                                        $and: [
                                            { $eq: [{ $month: "$birth_date" }, startDate.getMonth() + 1] },
                                            { $gte: [{ $dayOfMonth: "$birth_date" }, startDate.getDate()] }
                                        ]
                                    }
                                ]
                            },
                            {
                                $or: [
                                    { $lt: [{ $month: "$birth_date" }, endDate.getMonth() + 1] },
                                    {
                                        $and: [
                                            { $eq: [{ $month: "$birth_date" }, endDate.getMonth() + 1] },
                                            { $lt: [{ $dayOfMonth: "$birth_date" }, endDate.getDate()] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };

                const nextYearQuery = {
                    $expr: {
                        $and: [
                            { $gt: [{ $year: "$birth_date" }, today.getFullYear()] },
                            {
                                $or: [
                                    { $lt: [{ $month: "$birth_date" }, endDate.getMonth() + 1] },
                                    {
                                        $and: [
                                            { $eq: [{ $month: "$birth_date" }, endDate.getMonth() + 1] },
                                            { $lt: [{ $dayOfMonth: "$birth_date" }, endDate.getDate()] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };

                const combinedQuery = { $or: [query1, nextYearQuery] };
                query.selectWithAnd(dbConstants.dbSchema.haribhagats, combinedQuery, async function (error, haribhagats) {
                    if (error) {
                        logger('Error: can not get haribhagats', dbConstants.dbSchema.haribhagats);
                        done(error, null);
                    }
                    cron.schedule('0 4 * * *', async () => {
                        if (haribhagats.length > 0) {
                            for (const haribhagat of haribhagats) {
                                if (!haribhagat.messageSent) {
                                    const phoneNumber = `${haribhagat.mobile_country_code}${haribhagat.mobile}`;
                                    const firstName = haribhagat.first_name || '';
                                    const message = `Hello ${firstName}, we wish you a happy and blessed birthday! 🎉`;

                                    try {
                                        const recipientWid = `${phoneNumber.replace('+', '')}@c.us`;
                                        await WhatsAppMessage.sendWhatsAppMessage(recipientWid, message);
                                        console.log(`Message sent to ${phoneNumber}`);

                                        Haribhagat.updateOne({ haribhagat_id: haribhagat.haribhagat_id }, { messageSent: true }, (updateError) => {
                                            if (updateError) {
                                                console.error(`Failed to update messageSent for ${phoneNumber}:`, updateError);
                                            } else {
                                                console.log(`Message sent status updated for ${phoneNumber}`);
                                            }
                                        });
                                    } catch (error) {
                                        console.error(`Failed to send message to ${phoneNumber}:`, error);
                                    }
                                }
                            }
                        } else {
                            console.log('No upcoming birthdays found.');
                        }
                    });
                    done(null, haribhagats);
                });
            } else {
                query.selectWithAnd(dbConstants.dbSchema.haribhagats, {}, function (error, haribhagats) {
                    if (error) {
                        logger('Error: can not get countries', dbConstants.dbSchema.haribhagats);
                        done(error, null);
                        return;
                    }
                    done(null, haribhagats);
                });
            }
        }
    }
};


// const getHaribhagat1 = async (data, res, done) => {
//     try {
//         const { 
//             page = 1, 
//             limit = 10, 
//             search = '', 
//             sort_key = 'haribhagat_id', 
//             sort_order = 'asc', 
//             is_own_home = '', 
//             is_verified = '', 
//             is_memeber_of_land_donation = '', 
//             is_archive = '',
//             printPdf = ''
//         } = data;

//         const pageLimit = parseInt(limit);
//         const pageNumber = parseInt(page);
//         const sortOrder = sort_order === 'desc' ? -1 : 1;

//         const searchQuery = {
//             $or: [
//                 { haribhagat_id: { $regex: search, $options: 'i' } },
//                 { surname: { $regex: search, $options: 'i' } },
//                 { first_name: { $regex: search, $options: 'i' } },
//                 { middle_name: { $regex: search, $options: 'i' } },
//                 { mobile: { $regex: search, $options: 'i' } }
//             ]
//         };

//         // Additional filters
//         if (data.is_own_home === 'true') searchQuery.is_own_home = is_own_home;
//         if (data.is_archive === 'true') searchQuery.is_archive = is_archive;
//         if (data.is_verified === 'true') searchQuery.is_verified = is_verified;
//         if (data.is_memeber_of_land_donation === 'true') searchQuery.is_memeber_of_land_donation = is_memeber_of_land_donation;

//         // const sort = {};
//         // if (sort_key === 'haribhagat_id') {
//         //     sort.haribhagat_id_numeric = sortOrder; // Numeric sorting for haribhagat_id
//         // } else if (['surname', 'first_name', 'middle_name', 'mobile'].includes(sort_key)) {
//         //     sort[sort_key] = sortOrder; // Alphanumeric sorting for other fields
//         // } else {
//         //     sort.haribhagat_id = sortOrder;
//         // }
//         // console.log("Sorting by:", sort);
//         // Aggregate pipeline
//         const haribhagats = await Haribhagat.aggregate([
//             { $match: searchQuery },
//             {
//                 $addFields: {
//                     haribhagat_id_numeric: { $toInt: "$haribhagat_id" } // Convert haribhagat_id to number for sorting
//                 }
//             },
//             { $sort:{ [sort_key]: sortOrder } }, // Apply sorting here
//             { $skip: (pageNumber - 1) * pageLimit },
//             { $limit: pageLimit }
//         ]);
//         if (!haribhagats || haribhagats.length === 0) {
//             return res.status(404).send('No records found.');
//         }

//         const admin_id = data.admin_id;
//         const userSettings = await Admin.findOne({ admin_id });
//         // const pdfViewPreference = userSettings?.pdfViewPreference || 'table'; // Default to 'table'
//         const pdfViewPreference=userSettings?.pdfViewPreference || 'table';
//         console.log("get-haribhaata.printPdft", printPdf);
//         if (printPdf) {
//             const haribhagats = await Haribhagat.find(searchQuery).sort({ [sort_key]: sortOrder });
//             return done(null, {
//                 data: haribhagats,
//                 pdfViewPreference 
//             });
//         }

//         const totalRecords = await Haribhagat.count(searchQuery);

//         return done(null, {
//             data: haribhagats,
//             pagination: {
//                 totalRecords,
//                 totalPages: Math.ceil(totalRecords / pageLimit),
//                 currentPage: pageNumber
//             },
//             pdfViewPreference
//         });

//     } catch (error) {
//         return done({
//             code: 500,
//             message: "Error fetching Haribhagats",
//             error: error.message
//         }, null);
//     }
// };

const getHaribhagat1 = async (data, res, done) => { 
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sort_key = '',
            sort_order = 'asc',
            is_own_home,
            is_verified,
            is_memeber_of_land_donation,
            is_archive,
            printPdf = '',
            haribhagatId,
            sabha_page = 1,
            is_memeber_of_sahajanadi_sabha,
            sabha_limit = 10,
            gender = '',
        } = data;

        const pageLimit = parseInt(limit);
        const pageNumber = parseInt(page);
        const sortOrder = sort_order === 'desc' ? -1 : 1;
        const sabhaPageLimit = parseInt(sabha_limit);
        const sabhaPageNumber = parseInt(sabha_page);

        // Initialize the search query for Haribhagat
        const searchQuery = {
            $or: [
                { haribhagat_id: { $regex: search, $options: 'i' } },
                { surname: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { middle_name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ]
        };
        if (gender) {
            searchQuery.gender = gender;
        }

        if (is_memeber_of_sahajanadi_sabha === 'true') {
            searchQuery.is_memeber_of_sahajanadi_sabha = true;
        } else if (is_memeber_of_sahajanadi_sabha === 'false') {
            searchQuery.is_memeber_of_sahajanadi_sabha = false;
        }

        // Apply filters for Haribhagat
        if (is_own_home === 'true') searchQuery.is_own_home = true;
        else if (is_own_home === 'false') searchQuery.is_own_home = false;

        if (is_archive === 'true') searchQuery.is_archive = true;
        else if (is_archive === 'false') searchQuery.is_archive = false;

        if (is_verified === 'true') searchQuery.is_verified = true;
        else if (is_verified === 'false') searchQuery.is_verified = false;

        if (is_memeber_of_land_donation === 'true') searchQuery.is_memeber_of_land_donation = true;
        else if (is_memeber_of_land_donation === 'false') searchQuery.is_memeber_of_land_donation = false;

        // Sorting logic for Haribhagat
        const sort = {};
        if (sort_key === 'haribhagat_id') {
            sort.haribhagat_id_numeric = sortOrder;
        } else if (['surname', 'first_name', 'middle_name', 'mobile'].includes(sort_key)) {
            sort[sort_key] = sortOrder;
        } else {
            sort.haribhagat_id = sortOrder;
        }

        // Fetch and paginate sabha data
        const sabhaSearchQuery = {
            $or: [
                { sabha_id: { $regex: search, $options: 'i' } },
                { sabha_name: { $regex: search, $options: 'i' } },
                { from_time: { $regex: search, $options: 'i' } },
                { to_time: { $regex: search, $options: 'i' } }
            ]
        }; // Add any sabha-specific filters here
        const sabhas = await Sabha.aggregate([
            [
                { $match: sabhaSearchQuery },
                {
                  '$project': {
                    'sabha_name': 1, 
                    'sabha_date': 1, 
                    'admin_id': 1, 
                    '__v': 1, 
                    'sabha_id': 1, 
                    'to_time': 1, 
                    'from_time': 1, 
                    'is_present': {
                      '$cond': {
                        'if': {
                          '$in': [
                            haribhagatId, '$attendees'
                          ]
                        }, 
                        'then': true, 
                        'else': false
                      }
                    }
                  }
                },
                { $sort: sort },
                { $skip: (pageNumber - 1) * pageLimit },
                { $limit: pageLimit }
            ]
        
        ])
        console.log("sabhas",sabhas)
        const totalSabhas = await Sabha.count(sabhaSearchQuery);
        console.log("totalsabha",totalSabhas)
        // Aggregate pipeline for Haribhagat
        const haribhagats = await Haribhagat.aggregate([
            { $match: searchQuery },
            {
                $addFields: {
                    haribhagat_id_numeric: { $toInt: "$haribhagat_id" }
                }
            },
            { $sort: sort },
            { $skip: (pageNumber - 1) * pageLimit },
            { $limit: pageLimit }
        ]);

        if (!haribhagats || haribhagats.length === 0) {
            return done(null, {
                data: [],
                sabhas: [],
                pagination: {
                    totalRecords: 0,
                    totalPages: 0,
                    currentPage: 1,
                    totalSabhas: 0,
                    totalSabhaPages: 0,
                    currentSabhaPage: 1
                }
            });
        }

        const admin_id = data.admin_id;
        const userSettings = await Admin.findOne({ id: admin_id });
        const pdfViewPreference = userSettings?.pdfViewPreference || 'table';

        // Handle PDF generation
        if (printPdf) {
            const pdfRecords = await Haribhagat.find(searchQuery).sort(sort);
            return done(null, {
                data: pdfRecords,
                sabhas,
                pdfViewPreference,
                gender
            });
        }

        // Count total Haribhagat records
        const totalRecords = await Haribhagat.count(searchQuery);
       
        // Send the final response
        return done(null, {
            data: haribhagats,
            sabhas,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / pageLimit),
                currentPage: pageNumber,
                totalSabhas,
                totalSabhaPages: Math.ceil(totalSabhas / sabhaPageLimit),
                currentSabhaPage: sabhaPageNumber,
            },
            pdfViewPreference
        });

    } catch (error) {
        console.error("Error:", error);
        return done({
            code: 500,
            message: "Error fetching Haribhagats",
            error: error.message
        }, null);
    }
};

const updateAppVersionCode = async (requestParam, req, done) => {
    query.updateAndFindSingle(dbConstants.dbSchema.haribhagats, requestParam, {
        haribhagat_id: requestParam.haribhagat_id,
    }, {
        _id: 0,
        haribhagat_id: 1,
        version_code: 1,
    }, (error, consumer) => {
        if (error) {
            done(errors.internalServer(true), null);
            return;
        }
        done(null, consumer);
    });
};

/*
 * Used to create consumer
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
//const createConsumer = function(requestParam, done) {
const uploadImageToS3 = async (imageData, mobile) => {
    // Decode base64 image data
    const imageBuffer = Buffer.from(imageData, 'base64');
    // // Generate a unique filename
    // const fileName = `${mobile}.jpg`; // Adjust the extension as needed
    const now = new Date();

    // Function to add leading zero if needed
    const padZero = (num) => num.toString().padStart(2, '0');

    // Format the date and time as YYYY-MM-DD_HH-MM-SS
    const fileName = `${mobile}-${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}_${padZero(now.getHours())}-${padZero(now.getMinutes())}-${padZero(now.getSeconds())}.jpg`;
    // Upload image to S3
    try {
        const params = {
            Bucket: bucketName,
            Key: fileName,
            Body: imageBuffer,
            ACL: 'public-read', // Adjust the ACL as needed
            ContentType: 'image/jpeg', // Adjust content type based on the image format
        };
        const { Location } = await s3.upload(params).promise();
        return Location;
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        throw error;
    }
};

const duplicationHaribhagat = async (data, res, done) => {

    try {
        // Find the newly added Haribhagat
        const newHaribhagat = await Haribhagat.findOne({ haribhagat_id: data.haribhagat_id });

        if (!newHaribhagat) {
            throw new Error('Haribhagat not found');
        }

        // Create a query to find potential family members
        const duplicateQuery = {
            $or: [
                {
                    surname: { $regex: `^${newHaribhagat.surname}`, $options: 'i' } // Matches surname starting with (case-insensitive)
                },
                {
                    middle_name: { $regex: newHaribhagat.middle_name, $options: 'i' } // Matches address (case-insensitive)
                }
            ],
            is_verified: true, // Only include verified records
            _id: { $ne: newHaribhagat._id } // Exclude the current record
        };

        // Fetch potential family members
        const potentialFamilyMembers = await Haribhagat.find(duplicateQuery);
        console.log("potentialFamilyMembers", potentialFamilyMembers)
        done(null, potentialFamilyMembers);
        return;
    } catch (error) {
        throw new Error(`Error finding potential family members: ${error.message}`);
    }
};

const createConsumer = async (req, requestParam, done) => {
    console.log("--------------requestParam----------", requestParam)
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
    requestParam.signup_with = 'Normal';
    requestParam.is_registered = true;
    getConsumerPost(columnAndValues, async (err, consumer) => {
        console.log("------------consumer------ddd------------", consumer)
        if (consumer.length > 0) {
            if (consumer[0].is_archive == 'true') {
                logger('Error: account is archived by admin');
                done(errors.archivedUser(true), null);
                return;
            }
            done(errors.duplicateUser(true), [{ code: '0' }]);
        } else {
            if (requestParam.profile_picture_base63) {
                const imageUrl = await uploadImageToS3(requestParam.profile_picture_base63, requestParam.mobile);
                requestParam.profile_picture = imageUrl;
                console.log("imageurl ", imageUrl)
            }
            if (requestParam.anniversary_date === '') {
                requestParam.anniversary_date = null
            }
            requestParam.number_of_family_member = parseInt(requestParam.number_of_family_member);
            requestParam.is_verified = false;
            // if (requestParam.middle_name && requestParam.surname) {
            //     requestParam.is_verified = false;
            // } else {
            //     requestParam.is_verified = true;  // Default: not verified
            // }
            console.log("requestParam.is_verified", requestParam.is_verified)
            query.insertSingle(dbConstants.dbSchema.haribhagats, requestParam, function (error, consumer) {
                if (error) {
                    logger('Error: can not create haribhagt', error);
                    console.log("----error", error)
                    done(error, null);
                    return;
                }
                done(null, [{ code: '1' }]);
            });
        }
    });
};


/*
 * Used to authenticate consumer
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const authentication = function (requestParam, done) {
    requestParam.nric_photo = getImageNameFromURL(requestParam.nric_photo)
    requestParam.passport_photo = getImageNameFromURL(requestParam.passport_photo)
    query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
        if (error) {
            done(errors.resourceNotFound(true), null);
            return;
        }
        if (requestParam.request_type == 'signup') {
            let columnAndValues = {};
            columnAndValues['$or'] = [{
                email: requestParam.email
            }, {
                mobile: requestParam.mobile,
                mobile_country_code: requestParam.mobile_country_code
            }];
            getConsumerPost(columnAndValues, (err, consumer) => {
                if (consumer.length > 0) {
                    if (consumer[0].is_archive == 'true') {
                        logger('Error: account is archived by admin');
                        done(errors.archivedUser(true), null);
                        return;
                    } else {
                        console.log(consumer.is_archive);
                        logger('Error: account not activated');
                        done(errors.duplicateUser(true), null);
                        return;
                    }
                }
                let otp;

                if ((requestParam.mobile_country_code == '+91' || requestParam.mobile_country_code == '+1' || requestParam.mobile_country_code == '+221') && requestParam.mobile == '9999999999') {
                    console.log("----------------true---------------", otp);
                    otp = 1234;
                } else {
                    console.log("----------------otp---------------", otp);
                    otp = Math.floor(Math.random() * 8999 + 1000);
                    console.log("-------------after---otp---------------", otp);
                    sendOTP(requestParam, consumer, otp);
                }
                requestParam.verification_code = otp;
                requestParam.is_registered = true;
                requestParam.invite_code = Math.random().toString(36).substring(7);

                if (requestParam.refferal_code) {
                    const string = requestParam.refferal_code.trim();
                    const regex = new RegExp(['^', string, '$'].join(''), 'i');
                    console.log(requestParam.refferal_code)
                    console.log(regex)
                    console.log(consumer)
                    query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { invite_code: regex }, (error, consumer) => {
                        if (error) {
                            logger('Error: can not get ', dbConstants.dbSchema.customers);
                            done(errors.internalServer(true), null);
                            return;
                        }
                        consumer = JSON.parse(JSON.stringify(consumer))
                        console.log(consumer)
                        let inviteConsumer = false;
                        if (consumer) {
                            if (requestParam.refferal_code != '') {
                                requestParam.wallet_balance = setting.invite_friend_commission;
                            }
                            inviteConsumer = true;
                        } else {
                            done(errors.customError("Invalid referral code", 405, "Invalid referral code", true))
                            return
                        }
                        query.insertSingle(dbConstants.dbSchema.haribhagats, requestParam, function (error, consumer) {
                            if (error) {
                                logger('Error: can not create consumer');
                                done(error, null);
                                return;
                            }
                            sendMail(consumer, setting);
                            if (inviteConsumer == true && requestParam.refferal_code != '') {
                                let insertObj = {
                                    user_id: consumer.haribhagat_id,
                                    user_type: 'consumer',
                                    amount: setting.invite_friend_commission,
                                    transaction_id: moment().unix() + Math.floor((Math.random() * 999999999) + 1),
                                    type: 'addition',
                                    wallet_transaction_type: 'invite_friend'
                                }
                                query.insertSingle(dbConstants.dbSchema.wallet_history, insertObj, function (error, wallet) {
                                    consumer = JSON.parse(JSON.stringify(consumer))
                                    consumer.verification_code = otp

                                    done(null, consumer);
                                    return
                                });
                            } else {
                                consumer = JSON.parse(JSON.stringify(consumer))
                                consumer.verification_code = otp
                                done(null, consumer);
                                return
                            }
                        });
                    });
                } else {
                    query.insertSingle(dbConstants.dbSchema.haribhagats, requestParam, function (error, consumer) {
                        if (error) {
                            logger('Error: can not create consumer');
                            done(error, null);
                            return;
                        }
                        consumer = JSON.parse(JSON.stringify(consumer))
                        consumer.verification_code = otp
                        sendMail(consumer, setting);
                        done(null, consumer);
                        return
                    })
                }

            });
        } else {
            let comparisonColumnsAndValues = {
                mobile: requestParam.mobile,
                mobile_country_code: requestParam.mobile_country_code
            }
            requestParam.signup_with = 'mobile';
            getConsumerPost(comparisonColumnsAndValues, (err, consumer) => {
                if (consumer.length > 0) {
                    if (consumer[0].is_archive == 'true') {
                        logger('Error: account is archived by admin');
                        done(errors.archivedUser(true), null);
                        return;
                    } else if (consumer[0].status == 'Inactive') {
                        done(errors.customError('Your account is not acivate. Please contact to administrator.', '201', 'Not activate', true), null);
                        return;
                    }
                    let otp;
                    if ((requestParam.mobile_country_code == '+91' || requestParam.mobile_country_code == '+1' || requestParam.mobile_country_code == '+221') && requestParam.mobile == '9999999999') {
                        console.log("----------------true---------------", otp);
                        otp = 1234;
                    } else {
                        console.log("----------------true---------------", otp);
                        otp = Math.floor(Math.random() * 8999 + 1000);
                        console.log("-------------after---otp---------------", otp);
                        sendOTP(requestParam, consumer, otp);
                    }

                    query.updateSingle(dbConstants.dbSchema.haribhagats, {
                        verification_code: otp,
                        device_type: requestParam.device_type,
                        device_token: requestParam.device_token,
                        admin_id: requestParam.admin_id,
                        device_name: requestParam.device_name,
                        version_code: requestParam.version_code,
                        is_registered: true
                    }, { mobile: requestParam.mobile }, function (error, consumerUpdated) {
                        if (error) {
                            logger('Error: can not update consumer');
                            done(error, null);
                            return;
                        }
                        consumer[0] = JSON.parse(JSON.stringify(consumer[0]));
                        if (!consumer[0].is_registered) {
                            consumer[0].is_registered = true;
                        }
                        consumer[0] = JSON.parse(JSON.stringify(consumer[0]))
                        consumer[0].verification_code = otp
                        console.log(consumer[0])
                        done(null, consumer[0]);
                    });
                } else {
                    done(null, { is_registered: false });
                }
            });
        }
    });
};

const gridViewHaribhagatPDF = async (haribhagats, res) => {
    try {
        if (!haribhagats || haribhagats.length === 0) {
            return res.status(404).send('No records found.');
        }

        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        const fontPath = path.join(__dirname, '../public/fonts/HindVadodara-Light.ttf');
        const fontBold = path.join(__dirname, '../public/fonts/HindVadodara-SemiBold.ttf');
        doc.registerFont('Gujarati', fontPath);
        doc.registerFont('GujaratiBold', fontBold);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=haribhagat_data_grid.pdf');

        doc.pipe(res);

        const cellPadding = 5;
        const pageWidth = doc.page.width - doc.options.margin * 2;
        const numberOfColumns = 3; // 3 columns per row
        const cellWidth = (pageWidth - cellPadding * (numberOfColumns + 1)) / numberOfColumns; // Fixed cell width
        const maxTextLength = 100; // Maximum text length before truncation

        // Function to draw each grid cell and adjust height dynamically based on content
        const drawGridCell = (x, y, fullName, mobile, address) => {
            let currentY = y + cellPadding; // Starting Y position for text inside the cell
            let cellHeight = 0; // Initialize cell height

            // Draw name with text next to the label
            currentY = drawWrappedText(doc, 'નામ:', fullName, x + cellPadding, currentY, cellWidth - cellPadding * 2);
            cellHeight = Math.max(cellHeight, currentY - y);

            // Draw mobile with text next to the label
            currentY = drawWrappedText(doc, 'મોબાઇલ:', mobile, x + cellPadding, currentY, cellWidth - cellPadding * 2);
            cellHeight = Math.max(cellHeight, currentY - y);

            // Draw address with text next to the label
            currentY = drawWrappedText(doc, 'સરનામું:', address, x + cellPadding, currentY, cellWidth - cellPadding * 2);
            cellHeight = Math.max(cellHeight, currentY - y);

            // Draw the cell border based on the final dynamic height
            doc.rect(x, y, cellWidth, cellHeight).stroke();

            return cellHeight; // Return the final cell height for adjusting the next row
        };

        // Function to handle text wrapping inside the grid cell
        const drawWrappedText = (doc, label, text, x, y, maxWidth) => {
            const labelWidth = 50; // Width for the label
            const availableWidth = maxWidth - labelWidth; // Adjust available width for text

            // Truncate the text if it exceeds max length
            if (text.length > maxTextLength) {
                text = text.substring(0, maxTextLength) + '...';
            }

            // Print label
            doc.font('GujaratiBold').fontSize(12).text(label, x, y);

            // Draw text next to the label, with some space
            doc.font('Gujarati').fontSize(12).text(text, x + labelWidth, y, {
                width: availableWidth,
                align: 'left',
            });

            // Calculate the height used for the text
            const textHeight = doc.heightOfString(text, { width: availableWidth });

            return y + textHeight; // Return the new Y position after drawing the text
        };

        let xPosition = doc.options.margin; // Start x position
        let yPosition = 80; // Start y position
        let rowCount = 0; // Count of records in the current row
        let rowHeight = 0; // Track the maximum height of the current row

        // Iterate over all Haribhagats and apply the grid layout
        haribhagats.forEach((hb, index) => {
            const fullName = `${hb.first_name} ${hb.middle_name} ${hb.surname}`;
            const addressParts = [hb.address, hb.district, hb.state, hb.pin_code].filter(Boolean);
            const address = addressParts.join(', ');
            const mobile = hb.mobile;

            // Calculate cell height for the current record
            const cellHeight = drawGridCell(xPosition, yPosition, fullName, mobile, address);

            // Update the height for the row and x position
            rowHeight = Math.max(rowHeight, cellHeight);
            rowCount++; // Increment the record count for the current row
            xPosition += cellWidth + cellPadding * 2; // Move to the next cell in the row

            // Check if the current row is complete
            if (rowCount === numberOfColumns) {
                // Move down for the next row
                yPosition += rowHeight + cellPadding * 2;

                // Add a new page if the next row can't fit on the current page
                if (yPosition + rowHeight + cellPadding * 2 > doc.page.height - doc.options.margin) {
                    doc.addPage(); // Add a new page
                    yPosition = 80; // Reset y position for new page
                }

                xPosition = doc.options.margin; // Reset x position for new row
                rowCount = 0; // Reset row count
                rowHeight = 0; // Reset row height
            }
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
};

const tableviewHaribhagatPDF = async (haribhagats, res) => {
    try {
        if (!haribhagats || haribhagats.length === 0) {
            return res.status(404).send('No records found.');
        }
        // console.log("garibhgat",haribhagats)
        // console.log("---------tsblr-----get-haribhagat haribhagats", haribhagats);
        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        const fontPath = path.join(__dirname, '../public/fonts/HindVadodara-Light.ttf');
        const fontBold = path.join(__dirname, '../public/fonts/HindVadodara-SemiBold.ttf');
        doc.registerFont('Gujarati', fontPath);
        doc.registerFont('GujaratiBold', fontBold);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=haribhagat_data_table.pdf');

        doc.pipe(res);

        const tableTop = 80;
        const cellPadding = 5;
        const pageWidth = doc.page.width - doc.options.margin * 2;
        const columnWidths = {
            number: 30,
            name: 200,
            mobile: 70,
            address: 200,
        };
        // Default heading
//         let headingText  // Default heading if gender is not found

// // Check if gender is defined and set heading accordingly
//         if (haribhagats[0]?.gender === 'Male') {
//             headingText = 'Male Haribhagat';
//         } else if (haribhagats[0]?.gender === 'Female') {
//             headingText = 'Female Haribhagat';
//         } else {
//             headingText = 'હરિભક્તોની યાદી'; // If gender is undefined, print this
//         }
console.log("garibhgat",haribhagats.gender)
        // Then, generate the PDF content with the dynamic heading
        const genderText = haribhagats.gender ? `${haribhagats.gender =="Female" ? "મહિલા" : "પુરૂષ" } હરિભક્તોની યાદી` : 'હરિભક્તોની યાદી';

        doc.font('GujaratiBold').fontSize(14).text(genderText, 30, 50);
        

        const drawTableHeaders = (y) => {
            // doc.font('GujaratiBold').text(heading, { align: 'center' })
            doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
            // Draw header text
            doc.font('GujaratiBold').fontSize(12).text('ક્ર.', 45, 85);   // Column for index
            doc.font('GujaratiBold').fontSize(12).text('નામ', 150, 85);   // Column for name
            doc.font('GujaratiBold').fontSize(12).text('મોબાઇલ', 285, 85);   // Column for mobile
            doc.font('GujaratiBold').fontSize(12).text('સરનામું', 440, 85);   // Column for address

            // Draw horizontal line beneath the headers
            doc.moveTo(30, y + 30).lineTo(doc.page.width - 30, y + 30).stroke();

            // Draw vertical lines for header columns
            doc.moveTo(30, y).lineTo(30, y + 30).stroke();     // Left-most vertical line
            doc.moveTo(70, y).lineTo(70, y + 30).stroke();     // Line separating number and name
            doc.moveTo(260, y).lineTo(260, y + 30).stroke();   // Line separating name and mobile
            doc.moveTo(350, y).lineTo(350, y + 30).stroke();   // Line separating mobile and address
            doc.moveTo(565, y).lineTo(565, y + 30).stroke();   // Right-most vertical line
        };


        const drawTableRow = (y, index, fullName, mobile, address) => {
            if (!fullName || !mobile || !address) {
                console.error('Invalid input:', { fullName, mobile, address });
                return y; // Return the same y-position to avoid moving down in case of invalid inputs
            }

            // Calculate height required for each field (specifically the wrapped address)
            const nameHeight = doc.heightOfString(fullName, { width: columnWidths.name });
            const mobileHeight = doc.heightOfString(mobile, { width: columnWidths.mobile });
            const addressHeight = doc.heightOfString(address, { width: columnWidths.address });

            // Calculate the row height based on the tallest column content (usually address)
            const calculatedRowHeight = Math.max(nameHeight, mobileHeight, addressHeight) + cellPadding * 2;

            // Draw content for each column
            doc.font('Gujarati').fontSize(10).text(index, 30 + cellPadding, y + cellPadding, {
                width: columnWidths.number,
                align: 'center',
            });
            doc.text(fullName, 70 + cellPadding, y + cellPadding, { width: columnWidths.name });
            doc.text(mobile, 260 + cellPadding, y + cellPadding, { width: columnWidths.mobile });

            // Set maximum width for address and allow text to wrap
            doc.text(address, 350 + cellPadding, y + cellPadding, {
                width: columnWidths.address,
                align: 'left',
                continued: false  // Allow text wrapping if needed
            });

            // Draw vertical lines for the columns based on the calculated row height
            doc.moveTo(30, y).lineTo(30, y + calculatedRowHeight).stroke();
            doc.moveTo(70, y).lineTo(70, y + calculatedRowHeight).stroke();
            doc.moveTo(260, y).lineTo(260, y + calculatedRowHeight).stroke();
            doc.moveTo(350, y).lineTo(350, y + calculatedRowHeight).stroke();
            doc.moveTo(565, y).lineTo(565, y + calculatedRowHeight).stroke();

            // Draw horizontal line after the row (once all text wrapping is complete)
            doc.moveTo(30, y + calculatedRowHeight).lineTo(doc.page.width - 30, y + calculatedRowHeight).stroke();

            // Return the updated y position (move down for the next row)
            return y + calculatedRowHeight;
        };

        let yPosition = tableTop;

        // Draw the table headers at the start of the document
        drawTableHeaders(yPosition);
        yPosition += 30; // Move down after headers

        let rowCount = 1;

        // Iterate over all the haribhagats and apply the row drawing logic
        haribhagats.forEach((hb) => {
            const fullName = `${hb.first_name} ${hb.middle_name} ${hb.surname}`;
            const addressParts = [hb.address, hb.district, hb.state, hb.pin_code].filter(Boolean);
            const address = addressParts.join(', ');
            const mobile = hb.mobile;

            // Check if the current row fits on the page, add a new page if necessary
            if (yPosition + 50 > doc.page.height - doc.options.margin) {
                doc.addPage();
                yPosition = tableTop; // Reset position for new page
                drawTableHeaders(yPosition); // Redraw headers on new page
                yPosition += 30; // Move down after headers
            }

            // Draw the data row, and update yPosition for the next row based on the current row height
            yPosition = drawTableRow(yPosition, rowCount, fullName, mobile, address);
            rowCount++;
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
};

// const sendMail = function(consumer, setting) {
//     query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: consumer.language_id }, (error, language) => {
//         if (!language || error) {        
//             return false;
//         }
//         query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
//             code: 'CSU'
//         }, (error, template) => {
//             if (!template || error) {
//                 return false;
//             }
//             let findArr = ['#FACEBOOK#', '#TWITTER#', '#LINKEDIN#', '#PINTEREST#', '#INSTAGRAM#', '#ADDRESS#'];
//             let replaceArr = [setting.fb_url, setting.twitter_url, setting.linkedin_url, setting.pinterest_url, setting.instagram_url, setting.address];
//             let emailtemplate = template.description[language.code];
//             const data = {
//                 from: template.from_email,
//                 to: consumer.email,
//                 subject: template.email_subject,
//                 html: (findArr.length > 0) ? replaceOnce(emailtemplate, findArr, replaceArr, 'gi') : emailtemplate,
//             };
//             const params = {
//                 Destination: {
//                     ToAddresses: [data.to]
//                 },
//                 Message: {
//                     Body: {
//                         Html: {
//                             Charset: 'UTF-8',
//                             Data: data.html
//                         }
//                     },
//                 Subject: {
//                     Charset: 'UTF-8',
//                     Data: data.subject
//                 }
//             },
//             ReturnPath: data.from,
//                 Source: data.from,
//             };
//             commonHandler.sendEmailToUser(data, (err, data) => { 
//                 if (err) {
//                     console.log(err, err.stack);
//                     done(errors.cannotSendEmail(true), null);
//                     return;
//                 } else {
//                     console.log("Email sent.", data);
//                     done(null, {});
//                     return;
//                 }
//             })

//             // awsSES.sendEmail(params, (err, data) => {
//             //     if (err) {
//             //      console.log(err, err.stack);
//             //     } else {
//             //         console.log("Email sent.", data);
//             //     }
//             //     //done(null, {});
//             //     return;
//             // });
//             /*mailgun.messages().send(data, function(error, body) {
//                 return false;
//             });*/
//         });
//     });
// }

// const sendOTP = function(requestParam, consumer, otp, done) {
//     let language_id;
//     if (requestParam.request_type) {
//         if (requestParam.request_type == 'signup') language_id = requestParam.language_id;
//         else language_id = consumer[0].language_id;
//     } else language_id = consumer[0].language_id;
//     query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: language_id }, function(error, language) {
//         if (!language) {
//             return false;
//         }
//         query.selectWithAndOne(dbConstants.dbSchema.sms_templates, { code: 'SEND_OTP' }, function(error, sms) {
//             if (error) {
//                 console.log("error",error);
//                 return false;
//             }
//             if (!sms) {
//                 return false;
//             }
//             let message = sms.value[language.code];
//             message = message.replace('#OTP#', otp);
//             client.messages.create({
//                     body: message,
//                     to: requestParam.mobile_country_code + requestParam.mobile,
//                     from: config.twilio.mobileNo
//                 })
//                 .then((message) => {
//                     console.log("---------------------------------Send Gride--------------------------------------");
//                     console.log(message);
//                     console.log("---------------------------------Send Gride------- enf-------------------------------");
//                     return false;
//                 }).catch((err)=>{
//                     console.log('Text msg Error:-',err)
//                 });
//         });
//     });
// }

// const tableviewHaribhagatPDF = async (haribhagats, res) => {
//     try {
//         // const haribhagats = await Haribhagat.find();
//         if (!haribhagats || haribhagats.length === 0) {
//             return res.status(404).send('No records found.');
//         }

//         const doc = new PDFDocument({ size: 'A4', margin: 30 });

//         const fontPath = path.join(__dirname, '../public/fonts/HindVadodara-Light.ttf');
//         const fontBold = path.join(__dirname, '../public/fonts/HindVadodara-SemiBold.ttf');
//         doc.registerFont('Gujarati', fontPath);
//         doc.registerFont('GujaratiBold', fontBold);

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=haribhagat_data_table.pdf');

//         doc.pipe(res);

//         // Set page margins and header
//         const tableTop = 80;
//         const cellPadding = 5;
//         const pageWidth = doc.page.width - doc.options.margin * 2;
//         const columnWidths = {
//             number: 30,
//             name: 200,
//             mobile: 70,
//             address: 270,
//         }; // Name, Mobile, Address

//         // Draw table headers
//         const drawTableHeaders = (y) => {
//             doc.font('GujaratiBold').fontSize(12).text('ક્ર.', 45, y);
//             doc.font('GujaratiBold').fontSize(12).text('નામ', 150, y);
//             doc.font('GujaratiBold').fontSize(12).text('મોબાઇલ', 285, y);
//             doc.font('GujaratiBold').fontSize(12).text('સરનામું', 440, y);
//             doc.moveTo(30, y + 30).lineTo(doc.page.width - 30, y + 30).stroke();

//             // Draw vertical lines for headers
//             doc.moveTo(30, y).lineTo(30, y + 30).stroke(); // Number column
//             doc.moveTo(70, y).lineTo(70, y + 30).stroke(); // Name column
//             doc.moveTo(260, y).lineTo(260, y + 30).stroke(); // Mobile column
//             doc.moveTo(350, y).lineTo(350, y + 30).stroke(); // Address column
//         };

//         // Draw content rows
//         const drawTableRow = (y, index, fullName, mobile, address) => {
//             const addressLines = doc.font('Gujarati').fontSize(10).text(address, 350 + cellPadding, y + cellPadding, {
//                 width: columnWidths.address,
//                 align: 'left',
//                 lineBreak: true,
//                 continued: true,
//             });

//             const rowHeight = Math.max(addressLines.length * 10, 25); // Adjust row height based on address lines

//             // Draw content
//             doc.font('Gujarati').fontSize(10).text(index, 30 + cellPadding, y + cellPadding, {
//                 width: columnWidths.number,
//                 align: 'center',
//             });
//             doc.text(fullName, 70 + cellPadding, y + cellPadding, { width: columnWidths.name });
//             doc.text(mobile, 260 + cellPadding, y + cellPadding, { width: columnWidths.mobile });

//             // Draw vertical lines for rows
//             doc.moveTo(30, y).lineTo(30, y + rowHeight).stroke(); // Number column
//             doc.moveTo(70, y).lineTo(70, y + rowHeight).stroke(); // Name column
//             doc.moveTo(260, y).lineTo(260, y + rowHeight).stroke(); // Mobile column
//             doc.moveTo(350, y).lineTo(350, y + rowHeight).stroke(); // Address column
//         };

//         let yPosition = tableTop;

//         // Initial draw of headers
//         drawTableHeaders(yPosition);
//         yPosition += 30; // Move down for the next row
//         let rowCount = 1;
//         haribhagats.forEach((hb) => {
//             const fullName = `${hb.first_name} ${hb.middle_name} ${hb.surname}`;
//             const addressParts = [hb.address, hb.district, hb.state, hb.pin_code].filter(Boolean);
//             const address = addressParts.join(', ');
//             const mobile = hb.mobile;

//             // Check if the current row fits on the page
//             if (yPosition + 25 > doc.page.height - doc.options.margin) {
//                 doc.addPage();
//                 yPosition = tableTop; // Reset position for new page
//                 drawTableHeaders(yPosition); // Draw headers again
//                 yPosition += 30; // Move down for the next row
//             }

//             // Draw the data row
//             const rowHeights = drawTableRow(yPosition, rowCount, fullName, mobile, address);
//             rowCount++;
//             yPosition += rowHeights; // Move down for the next row
//         });

//         doc.end();
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error generating PDF');
//     }
// };


/*
 * Used to authenticate consumer
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const loginWithSocial = function(requestParam, done) {
//     requestParam.signup_with = 'social';
//     query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
//         socialmedia_id: requestParam.socialmedia_id
//     }, (error, consumer) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//             done(errors.internalServer(true), null);
//             return;
//         }

//         if (consumer) {
//             if (consumer.status == 'Inactive') {
//                 logger('Error: account not activated');
//                 done(errors.notActivate(true), null);
//                 return;
//             }
//             if (consumer.profile_picture.includes('crypticpoint.projects.upload') == true) {
//                 requestParam.profile_picture = consumer.profile_picture;
//             }
//             query.updateSingle(dbConstants.dbSchema.haribhagats, requestParam, {
//                 socialmedia_id: requestParam.socialmedia_id,
//             }, (error) => {
//                 if (error) {
//                     logger('Error: while updating consumer.');
//                     done(errors.internalServer(true), null);
//                     return;
//                 }

//                 query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
//                     socialmedia_id: requestParam.socialmedia_id
//                 }, (error, consumer) => {
//                     if (error) {
//                         logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//                         done(errors.internalServer(true), null);
//                         return;
//                     }
//                     done(null, consumer);
//                 })
//             })

//             // let columnAndValues = {};
//             // if (requestParam.email && requestParam.mobile) {
//             //     columnAndValues['$or'] = [{
//             //         email: requestParam.email
//             //     }, {
//             //         mobile: requestParam.mobile
//             //     }];
//             // } else if (requestParam.email) {
//             //     columnAndValues['$or'] = [{
//             //         email: requestParam.email
//             //     }];
//             // } else if (requestParam.mobile) {
//             //     columnAndValues['$or'] = [{
//             //         mobile: requestParam.mobile
//             //     }];
//             // }

//             // query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
//             //     $and: [{
//             //             $or: [{
//             //                 socialmedia_id: {
//             //                     $ne: requestParam.socialmedia_id
//             //                 }
//             //             }]
//             //         },
//             //         columnAndValues
//             //     ]
//             // }, (error, isUserExist) => {
//             //     if (error) {
//             //         logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//             //         done(errors.internalServer(true), null);
//             //         return;
//             //     }

//             //     if (isUserExist && !_.isEmpty(columnAndValues)) {
//             //         logger('Error: consumer already exist.');
//             //         //done(errors.duplicateUser(true), null);
//             //         done(null, isUserExist);
//             //         return;
//             //     } else {
//             //         query.updateSingle(dbConstants.dbSchema.haribhagats, requestParam, {
//             //             socialmedia_id: requestParam.socialmedia_id,
//             //         }, (error) => {
//             //             if (error) {
//             //                 logger('Error: while updating consumer.');
//             //                 done(errors.internalServer(true), null);
//             //                 return;
//             //             }

//             //             query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
//             //                 socialmedia_id: requestParam.socialmedia_id
//             //             }, (error, consumer) => {
//             //                 if (error) {
//             //                     logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//             //                     done(errors.internalServer(true), null);
//             //                     return;
//             //                 }
//             //                 done(null, consumer);
//             //             })
//             //         })
//             //     }
//             // })
//         } else {
//             if (requestParam.email || requestParam.mobile) {
//                 let columnAndValues = {};

//                 if (requestParam.email && requestParam.mobile) {
//                     columnAndValues['$or'] = [{
//                         email: requestParam.email
//                     }, {
//                         mobile: requestParam.mobile
//                     }];
//                 } else if (requestParam.email) {
//                     columnAndValues['$or'] = [{
//                         email: requestParam.email
//                     }];
//                 } else if (requestParam.mobile) {
//                     columnAndValues['$or'] = [{
//                         mobile: requestParam.mobile
//                     }];
//                 }

//                 query.selectWithAndOne(dbConstants.dbSchema.haribhagats, columnAndValues, (error, consumer) => {
//                     if (error) {
//                         logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//                         done(errors.internalServer(true), null);
//                         return;
//                     }

//                     if (consumer) {
//                         logger('Error: consumer already exist.');
//                         //done(errors.duplicateUser(true), null);
//                         done(null, consumer);
//                         return;
//                     }
//                     query.insertSingle(dbConstants.dbSchema.haribhagats, requestParam, (error, consumer) => {
//                         if (error) {
//                             logger('Error: while updating consumer.');
//                             done(errors.internalServer(true), null);
//                             return;
//                         }
//                         done(null, consumer);
//                     })
//                 })
//             } else {
//                 query.insertSingle(dbConstants.dbSchema.haribhagats, requestParam, (error, consumer) => {
//                     if (error) {
//                         logger('Error: while updating consumer.');
//                         done(errors.internalServer(true), null);
//                         return;
//                     }
//                     done(null, consumer);
//                 })
//             }
//         }
//     });
//     // let comparisonColumnsAndValues;
//     // if(requestParam.email!=''){
//     //  comparisonColumnsAndValues={
//     //      email:requestParam.email
//     //  }
//     // }
//     // if(requestParam.mobile!=''){
//     //  comparisonColumnsAndValues={
//     //      mobile:requestParam.mobile
//     //  }
//     // }
//     // getConsumerPost(comparisonColumnsAndValues, (err, consumer) => {
//     //  if (consumer.length > 0) {
//     //      let columnsAndValuesConsumer={
//     //          haribhagat_id:consumer[0].haribhagat_id
//     //      }
//     //      query.updateSingle(dbConstants.dbSchema.haribhagats,requestParam, {haribhagat_id: consumer[0].haribhagat_id},function (error, consumer) {
//     //          if (error) {
//     //              logger('Error: can not update consumer');
//     //              done(error, null);
//     //              return;
//     //          }
//     //          query.selectWithAndOne(dbConstants.dbSchema.haribhagats, columnsAndValuesConsumer,function (error, updatedharibhagats) {
//     //              if (error) {
//     //                  logger('Error: can not get haribhagats', dbConstants.dbSchema.haribhagats);
//     //                  done(error, null);
//     //                  return;
//     //              }
//     //              done(null,updatedharibhagats);
//     //          });
//     //      });
//     //  }
//     //  else{
//     //      query.insertSingle(dbConstants.dbSchema.haribhagats,requestParam,function (error, consumer) {
//     //          if (error) {
//     //              logger('Error: can not create consumer');
//     //              done(error, null);
//     //              return;
//     //          }
//     //          done(null, consumer);
//     //      });
//     //  }
//     // });
// };

/*
 * Retrieves the details of get consumer
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const getConsumerPost = (comparisonColumnsAndValues, done) => {
    query.selectWithAnd(dbConstants.dbSchema.haribhagats, comparisonColumnsAndValues, function (error, haribhagats) {
        if (error) {
            logger('Error: can not get haribhagats', dbConstants.dbSchema.haribhagats);
            done(error, null);
            return;
        }
        console.log("consumer=>" + JSON.stringify(haribhagats))
        done(null, haribhagats);
    });
};

/*
 * Retrieves the details of get consumer profile
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const getConsumerProfile = (comparisonColumnsAndValues, req, done) => {
    const fullUrl = req.protocol + '://' + req.get('host');
    query.selectWithAnd(dbConstants.dbSchema.haribhagats, comparisonColumnsAndValues, function (error, haribhagats) {
        if (error) {
            logger('Error: can not get haribhagats', dbConstants.dbSchema.haribhagats);
            done(error, null);
            return;
        }
        if (haribhagats.length == 0) {
            logger('Error: consumer not exist.');
            done(errors.consumerNotFound(true), null);
            return;
        }
        // if (!haribhagats[0].profile_picture) {
        //     haribhagats[0].profile_picture = fullUrl + '/upload/consumer/avatar.jpg';
        // }
        haribhagats = JSON.parse(JSON.stringify(haribhagats))
        driverHandler.getConsumerRating(comparisonColumnsAndValues, async (error, ratting) => {
            if (error) {
                done(errors.internalServer(true), null)
                return
            }
            haribhagats[0].customer_ratting = ratting.customerRating
            if (!haribhagats[0].profile_picture) {
                haribhagats[0].profile_picture = "";
            } else {
                haribhagats[0].profile_picture = generateFullURL(haribhagats[0].profile_picture)
            }
            const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { currency: 1, is_wallet: 1, is_cash_out: 1, is_stripe_payment_live: 1, android_version_code_user: 1, ios_version_code_user: 1 })
            haribhagats[0].currency = setting.currency;
            haribhagats[0].is_wallet = setting.is_wallet;
            haribhagats[0].is_cash_out = setting.is_cash_out;
            haribhagats[0].is_stripe_payment_live = setting.is_stripe_payment_live;
            haribhagats[0].android_version_code = setting.android_version_code_user;
            haribhagats[0].ios_version_code = setting.ios_version_code_user;
            console.log(haribhagats[0].profile_picture)
            done(null, haribhagats[0]);
            return
        })

    });
};

/*
 * Retrieves the details of get consumer
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const updateConsumerProfile = async (requestParam, req, done) => {
    const fullUrl = req.protocol + '://' + req.get('host');
    if (req.files) {
        requestParam.profile_picture = await new Promise((resolve, reject) => {
            uploadImage(req, (error, path) => {
                resolve(path)
            });
        });
        requestParam.profile_picture = getImageNameFromURL(requestParam.profile_picture);
    }

    query.updateAndFindSingle(dbConstants.dbSchema.haribhagats, requestParam, {
        haribhagat_id: requestParam.haribhagat_id,
    }, {
        _id: 0,
        haribhagat_id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        mobile: 1,
        mobile_country_code: 1,
        profile_picture: 1,
        favourite_places: 1,
        status: 1,
    }, (error, consumer) => {
        if (error) {
            done(errors.internalServer(true), null);
            return;
        }
        if (!consumer.profile_picture || consumer.profile_picture == '') {
            consumer.profile_picture = fullUrl + '/upload/consumer/avatar.jpg';
        }
        consumer.profile_picture = generateFullURL(consumer.profile_picture)
        done(null, consumer);
    });
};

/*
 * Retrieves the details of get consumer
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const updateConsumer = (requestParam, req, done) => {
    const fullUrl = req.protocol + '://' + req.get('host');
    let columnAndValues = {};
    if ( requestParam.mobile) {
        columnAndValues['$or'] = [ {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    }else if (requestParam.mobile) {
        columnAndValues['$or'] = [{
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }];
    }
    query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
        $and: [{
            $or: [{
                haribhagat_id: {
                    $ne: requestParam.haribhagat_id,
                },
            }],
        },
            columnAndValues,
        ],
    }, async (error, isCustomerExist) => {
        console.log("---isCustomerExist", isCustomerExist)
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
            done(errors.internalServer(true), null);
            return;
        }
        if (isCustomerExist && !_.isEmpty(columnAndValues)) {
            done(errors.duplicateUser(true), null);
            return;
        } else {
            // if (requestParam.type == "Admin") {
            //     requestParam.profile_picture = getImageNameFromURL(requestParam.profile_picture)
            //     requestParam.nric_photo = getImageNameFromURL(requestParam.nric_photo)
            //     requestParam.passport_photo = getImageNameFromURL(requestParam.passport_photo)
            // }
            // console.log(imageUrl);
            if (requestParam.profile_picture_base63) {
                // Upload new profile image to S3
                if (requestParam.profile_picture_base63) {
                    const imageUrl = await uploadImageToS3(requestParam.profile_picture_base63, requestParam.mobile);
                    requestParam.profile_picture = imageUrl;
                    console.log(imageUrl);
                }

                requestParam.number_of_family_member = parseInt(requestParam.number_of_family_member);
                query.updateSingle(dbConstants.dbSchema.haribhagats, requestParam, { haribhagat_id: requestParam.haribhagat_id }, function (error, consumer) {
                    if (error) {
                        logger('Error: can not update consumer');
                        done(error, null);
                        return;
                    }

                    done(null, consumer);
                });
            } else {
                console.log("imageUrl---2-", requestParam);
                if (requestParam.number_of_family_member) {
                    requestParam.number_of_family_member = parseInt(requestParam.number_of_family_member);
                }
                query.updateSingle(dbConstants.dbSchema.haribhagats, requestParam, { haribhagat_id: requestParam.haribhagat_id }, function (error, consumer) {
                    if (error) {
                        logger('Error: can not update consumer');
                        done(error, null);
                        return;
                    }

                    done(null, consumer);
                });
            }


        }
    });
};

/*
 * OTP verification 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const otpVerification = function(requestParam, done) {
//     console.log(requestParam.mobile)
//     let columnsAndValue = {
//         'mobile': requestParam.mobile
//     }
//     query.selectWithAnd(dbConstants.dbSchema.haribhagats, columnsAndValue, function(error, consumer) {
//         if (error) {
//             logger('Error: can not get consumer', dbConstants.dbSchema.haribhagats);
//             done(error, null);
//             return;
//         }
//         if (consumer.length > 0) {
//             console.log("in")
//             console.log(requestParam.mobile == 7878780046 && requestParam.verification_code == 1234)

//             if (requestParam.mobile == 78787800466 && requestParam.verification_code == 1234) {
//                 done(null, "Successfully Verified");
//                 return
//             }
//             if (consumer[0].verification_code == requestParam.verification_code) {
//                 done(null, "Successfully Verified");
//                 return
//             } else {
//                 done(errors.customError('Invalid OTP', '402', 'Invalid', true), null);
//                 return;
//             }
//         } else {
//             done(errors.customError('Haribhagat not exist with this mobile no.', '401', 'Not exists', true), null);
//             return;
//         }
//     });
// };

/*
 * Resend OTP
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const resendOtp = function(requestParam, done) {
//     query.selectWithAnd(dbConstants.dbSchema.haribhagats, requestParam, function(error, consumer) {
//         if (error) {
//             logger('Error: can not get consumer', dbConstants.dbSchema.haribhagats);
//             done(error, null);
//             return;
//         }
//         if (consumer.length > 0) {
//             const otp = Math.floor(Math.random() * 8999 + 1000);
//             sendOTP({ mobile_country_code: consumer[0].mobile_country_code, mobile: consumer[0].mobile }, consumer, otp);
//             let columnsAndValues = {
//                 verification_code: otp,
//             }
//             query.updateSingle(dbConstants.dbSchema.haribhagats, columnsAndValues, requestParam, function(error, consumer) {
//                 if (error) {
//                     logger('Error: can not update consumer');
//                     done(error, null);
//                     return;
//                 }
//                 query.selectWithAndOne(dbConstants.dbSchema.haribhagats, requestParam, function(error, updatedConsumer) {
//                     if (error) {
//                         logger('Error: can not get consumer', dbConstants.dbSchema.haribhagats);
//                         done(error, null);
//                         return;
//                     }
//                     let columnsAndValue = {
//                         verification_code: otp.toString(),
//                         message: 'OTP resend successfully.'
//                     }
//                     done(null, columnsAndValue);
//                 });
//             });
//         } else {
//             done(errors.customError('Haribhagat not exist with this haribhagat_id.', '404', 'Not exists', true), null);
//             return;
//         }
//     });
// };

/*
 * Used to delete consumer by id 
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteAccount = function (consumerDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.haribhagats, { 'haribhagat_id': { $in: consumerDetails.haribhagat_id } }, function (error, consumer) {
        if (error) {
            logger('Error: can not update consumer');
            done(error, null);
            return;
        }
        done(null, errors.customError('Account deleted.', '1', 'Success', true));
    });
};

/*
 * Used to active consumer by id 
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeConsumer = function (consumerDetails, done) {
    let columnsToUpdate = {
        status: consumerConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.haribhagats, columnsToUpdate, { 'haribhagat_id': { $in: consumerDetails } }, function (error, consumer) {
        if (error) {
            logger('Error: can not update consumer');
            done(error, null);
            return;
        }
        var userRef = config.firebase.userRef;
        var newData = {};
        for (let i = 0; i < consumerDetails.length; i++) {
            var ref = config.firebase.userRef.child(consumerDetails[i]);
            ref.once("value").then(function (snapshot) {
                if (snapshot.exists()) {
                    newData[consumerDetails[i] + "/status"] = 'active';
                    userRef.update(newData);
                }
            });
        }
        // for(let i=0; i<consumerDetails.length; i++){
        //     var ref = config.firebase.userRef.child(consumerDetails[i]);
        //     ref.once("value").then(function(snapshot) {
        //         if(snapshot.exists()){
        //             ref.update({ status: 'active'});
        //         }
        //     });
        // }
        done(null, consumer);
    });
};

/*
 * Used to archive consumer by id
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const archiveConsumer = function(consumerDetails, done) {
//     let columnsToUpdate = {
//         is_archive: 'true',
//         status: consumerConstants.status.inactive
//     };
//     query.updateMultiple(dbConstants.dbSchema.haribhagats, columnsToUpdate, { 'haribhagat_id': { $in: consumerDetails } }, function(error, consumer) {
//         if (error) {
//             logger('Error: can not update consumer');
//             done(error, null);
//             return;
//         }
//         var userRef = config.firebase.userRef;
//         var newData = {};
//         for (let i = 0; i < consumerDetails.length; i++) {
//             var ref = config.firebase.userRef.child(consumerDetails[i]);
//             ref.once("value").then(function(snapshot) {
//                 if (snapshot.exists()) {
//                     newData[consumerDetails[i] + "/status"] = 'delete';
//                     userRef.update(newData);
//                 }
//             });
//         }
//         done(null, consumer);
//     });
// };

// function makeTripPayment (requestParam) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let response;
//             if (requestParam.for == "trip" || requestParam.for == "walletConsumer") {
//                 response = await query.selectWithAndOnePromise(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, customer_id: 1, name: 1, password: 1, consumer_cards: 1, default_card: 1, stripe_profile_id: 1, email: 1, profile_picture: 1, player_id: 1 });
//             } else {
//                 response = await query.selectWithAndOnePromise(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, { _id: 0, admin_id: 1, name: 1, password: 1, driver_cards: 1, default_card: 1, stripe_profile_id: 1, email: 1, profile_picture: 1, player_id: 1 });
//             }
//             let settings = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0, is_stripe_payment_live: 1, currency: 1 ,fetch_deduct_percentage :1 });
//             let currencyDetail = await query.selectWithAndOnePromise(dbConstants.dbSchema.currency, {symbole:settings.currency}, { _id: 0, stripe_code: 1 });
//             let total = 0;
//             let stripeAccountId="";
//             let driverInfo;
//             if (requestParam.for == "trip") {
//                 total = requestParam.amount_pay
//                 driverInfo = await query.selectWithAndOnePromise(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, { _id: 0, stripeAccountId: 1 });
//             } else {
//                 total = requestParam.amount
//             }
//             let stripeRes = await (new Promise(async (resolve1, reject) => {
//                 let stripe = require("stripe")(settings.is_stripe_payment_live ? config.stripeInfo.key_live : config.stripeInfo.key);
//                 let chargeAmount = Math.round(parseFloat(total) * 100).toFixed(2);
//                 console.log("driverInfo",driverInfo);
//                if(requestParam.for === "walletConsumer"){
//                 stripe.charges.create({
//                     amount: parseFloat(chargeAmount),
//                     currency:currencyDetail.stripe_code ,
//                     // source: response.default_card,
//                     customer: response.stripe_profile_id,
//                     description: response.email
//                 }, async function (err, charge) {
//                     if (err) {
//                         logger('Error: stripe error');
//                         console.log("-------------err",err);
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
//                 });
//             }else{
//                 stripe.charges.create({
//                     amount: parseFloat(chargeAmount),
//                     currency:currencyDetail.stripe_code ,
//                     // source: response.default_card,
//                     customer: response.stripe_profile_id,
//                     description: response.email,
//                     transfer_data: {
//                         // Send the amount for the pilot after collecting a 20% platform fee:
//                         // the `amountForPilot` method simply computes `ride.amount * 0.8`
//                         amount: chargeAmount - (chargeAmount * (settings.fetch_deduct_percentage / 100)),
//                         // The destination of this charge is the pilot's Stripe account
//                         destination: driverInfo.stripeAccountId,
//                       },
//                 }, async function (err, charge) {
//                     if (err) {
//                         logger('Error: stripe error');
//                         console.log("-------------err",err);
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
//             }
//             }));
//             if (requestParam.for == "trip") {
//                 let insertTransaction = {
//                     stripe_transaction_id: stripeRes.charge.id,
//                     haribhagat_id: requestParam.haribhagat_id,
//                     admin_id: "",
//                     trip_id: tripConstants.trip_initials.trip + moment().unix() + Math.floor(Math.random() * 8999 + 10000),
//                     payment_type: 'Stripe',
//                     payment_status: 'Success',
//                     charge: settings.currency + "" + parseFloat(total),
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

// function makeAdditionTripPayment(requestParam) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             // Fetch settings and currency details
//             let settings = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0, is_stripe_payment_live: 1, currency: 1, fetch_deduct_percentage: 1 });
//             let currencyDetail = await query.selectWithAndOnePromise(dbConstants.dbSchema.currency, { symbole: settings.currency }, { _id: 0, stripe_code: 1 });

//             // Fetch trip details
//             let trip = await query.selectWithAndOnePromise(dbConstants.dbSchema.trips, { trip_id: requestParam.trip_id });

//             if (trip == null) {
//                 reject(errors.customError('There are not any jobs with this trip_id.', '401', 'Null', true), null);
//                 return;
//             }

//             // Fetch consumer details
//             let response = await query.selectWithAndOnePromise(dbConstants.dbSchema.haribhagats, { haribhagat_id: trip.haribhagat_id }, { _id: 0, customer_id: 1, name: 1, password: 1, consumer_cards: 1, default_card: 1, stripe_profile_id: 1, email: 1, profile_picture: 1, player_id: 1 });

//             if (trip.charges.length > 0) {
//                 // Calculate the total amount from trip charges
//                 let amount = _.pluck(trip.charges, 'amount');
//                 amount = _.reduce(amount, function (memo, num) { return memo + num; }, 0);
//                 let finalcharge = amount;

//                 // Fetch admin details
//                 let driverInfo = await query.selectWithAndOnePromise(dbConstants.dbSchema.admins, { admin_id: trip.admin_id }, { _id: 0, stripeAccountId: 1 });

//                 // Create Stripe charge
//                 stripe.charges.create({
//                     amount: parseFloat(finalcharge),
//                     currency: currencyDetail.stripe_code,
//                     // source: response.default_card,
//                     customer: response.stripe_profile_id,
//                     description: response.email,
//                     transfer_data: {
//                         amount: finalcharge - (finalcharge * (settings.fetch_deduct_percentage / 100)),
//                         destination: driverInfo.stripeAccountId,
//                     },
//                 }, async function (err, charge) {
//                     if (err) {
//                         logger('Error: stripe error');
//                         console.log("-------------err", err);
//                         reject({
//                             charge: null,
//                             status: err.raw.code == "amount_too_small" ? err.statusCode : 401
//                         });
//                         return;
//                     }

//                     // Insert transaction record
//                     let insertTransaction = {
//                         stripe_transaction_id: charge.id,
//                         haribhagat_id: trip.haribhagat_id,
//                         admin_id: "",
//                         trip_id: requestParam.trip_id,
//                         payment_type: 'Stripe',
//                         payment_status: 'Success',
//                         charge: settings.currency + "" + parseFloat(finalcharge),
//                     };
//                     const res = await query.insertSinglePromise(dbConstants.dbSchema.transactions, insertTransaction);
//                     notificationHandler.sendDriverNotificationExtraCharge({credit_amount_by:finalcharge, trip_id: requestParam.trip_id});
//                     resolve(res);
//                 });
//             }
//         } catch (error) {
//             console.log(error);
//             reject(errors.internalServer(true, requestParam.code));
//             return;
//         }
//     });
// }

// function holdTripPayment (requestParam) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             let response = await query.selectWithAndOnePromise(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, customer_id: 1, name: 1, password: 1, consumer_cards: 1, default_card: 1, stripe_profile_id: 1, email: 1, profile_picture: 1, player_id: 1 });

//             let settings = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0, is_stripe_payment_live: 1, currency: 1 ,fetch_deduct_percentage :1 });
//             let currencyDetail = await query.selectWithAndOnePromise(dbConstants.dbSchema.currency, {symbole:settings.currency}, { _id: 0, stripe_code: 1 });
//             // let numericCharge = parseFloat(transactionInfo.charge.replace(/[^\d.-]/g, ''));
//             let total =  parseFloat(requestParam.amount_pay.replace(/[^\d.-]/g, ''));
//             console.log(" ----------------------requestParam.admin_id--------------")
//             console.log(requestParam.admin_id)
//             let driverInfo = await query.selectWithAndOnePromise(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, { _id: 0, stripeAccountId: 1 });

//             let stripeRes = await (new Promise(async (resolve1, reject) => {
//                 let stripe = require("stripe")(settings.is_stripe_payment_live ? config.stripeInfo.key_live : config.stripeInfo.key);
//                 let chargeAmount = Math.round(parseFloat(total) * 100).toFixed(2);
//                console.log(" driverInfo.stripeAccountId---------------")
//                console.log(driverInfo)
//                 stripe.paymentIntents.create({
//                     amount: parseFloat(chargeAmount),
//                     currency:currencyDetail.stripe_code ,
//                     source: response.default_card,
//                     payment_method_types: ['card'],
//                     customer: response.stripe_profile_id,
//                     capture_method: 'manual',
//                     // transfer_data: {
//                     //     // Send the amount for the pilot after collecting a 20% platform fee:
//                     //     // the `amountForPilot` method simply computes `ride.amount * 0.8`
//                     //     amount: chargeAmount - (chargeAmount * (settings.fetch_deduct_percentage / 100)),
//                     //     // The destination of this charge is the pilot's Stripe account
//                         //  destination: driverInfo.stripeAccountId,
//                     //  },
//                 }, async function (err, charge) {
//                     if (err) {
//                         logger('Error: stripe error');
//                         console.log("-------------err",err);
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
//             console.log("--------------------requestParam.for ==---------------------",requestParam.for)
//             if (requestParam.for == "trip") {
//                 let insertTransaction = {
//                     stripe_transaction_id: stripeRes.charge.id,
//                     haribhagat_id: requestParam.haribhagat_id,
//                     admin_id: "",
//                     trip_id: tripConstants.trip_initials.trip + moment().unix() + Math.floor(Math.random() * 8999 + 10000),
//                     payment_type: 'Stripe',
//                     payment_status: 'Held',
//                     charge: settings.currency + "" + parseFloat(total),
//                 }
//                 console.log("--------------------insertTransaction ==---------------------",insertTransaction)
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

// function finishHoldTripPayment(requestParam) {
//     return new Promise(async (resolve, reject) => {
//       try {
//         let transactionInfo = await query.selectWithAndOnePromise(dbConstants.dbSchema.transactions, { trip_id: requestParam.trip_id }, { _id: 0, stripe_transaction_id: 1, charge: 1 });
//         let settings = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { _id: 0, is_stripe_payment_live: 1, currency: 1, fetch_deduct_percentage: 1 });
//         let driverInfo = await query.selectWithAndOnePromise(dbConstants.dbSchema.admins, { admin_id: requestParam.admin_id }, { _id: 0, stripeAccountId: 1 });
//         let stripe = require("stripe")(settings.is_stripe_payment_live ? config.stripeInfo.key_live : config.stripeInfo.key);
//         console.log("transactionInfo------");
//         console.log(transactionInfo);
//         console.log(transactionInfo);
//         if(transactionInfo && transactionInfo.charge != null && transactionInfo.charge != ''){
//             let numericCharge = parseFloat(transactionInfo.charge.replace(/[^\d.-]/g, ''));
//             const intent = await stripe.paymentIntents.retrieve(transactionInfo.stripe_transaction_id);
//             console.log("-------intent------");
//             console.log(intent);
//             // const paymentIntentUpdate = await stripe.paymentIntents.update(
//             //     transactionInfo.stripe_transaction_id,
//             //     {
//             //         transfer_data: {
//             //                 // destination: driverInfo.stripeAccountId,
//             //                 // amount: numericCharge - (numericCharge * (settings.fetch_deduct_percentage / 100)),
//             //                 amount: Math.floor(numericCharge - (numericCharge * settings.fetch_deduct_percentage / 100)) <= 1 ? 1 : Math.floor(numericCharge - (numericCharge * settings.fetch_deduct_percentage / 100)),
//             //                 // destination: driverInfo.stripeAccountId,
//             //       },     
//             //       transfer_group : driverInfo.stripeAccountId            
//             //     },

//             // );
//         }else{
//             // const paymentIntentUpdate = await stripe.paymentIntents.update(
//             //     transactionInfo.stripe_transaction_id,
//             //     {
//             //         transfer_group: driverInfo.stripeAccountId
//             //     }
//             // );
//             // console.log("-------paymentIntentUpdate------");
//             // console.log(paymentIntentUpdate);
//         }


//         // Confirm the payment intent
//         const paymentIntent = await stripe.paymentIntents.confirm(transactionInfo.stripe_transaction_id);

//         if (paymentIntent.id) {
//           // Consider using async/await here as well for better readability
//           query.updateSingle(dbConstants.dbSchema.transactions, { payment_status: 'Success' }, { trip_id: requestParam.trip_id }, function (error, transactions) {
//             if (error) {
//               console.log("Error updating transaction status:", error);
//               reject(errors.internalServer(true, requestParam.code));
//             } else {
//               resolve(transactions);
//             }
//           });
//         } else {
//           reject(errors.paymentFailure);
//         }
//       } catch (error) {
//         console.log("Error in finishHoldTripPayment:", error);
//         reject(errors.internalServer(true, requestParam.code));
//       }
//     });
// }


// const restoreArchiveConsumer = function(consumerDetails, done) {
//     let columnsToUpdate = {
//         is_archive: 'false',
//         status: consumerConstants.status.inactive
//     };
//     query.updateMultiple(dbConstants.dbSchema.haribhagats, columnsToUpdate, { 'haribhagat_id': { $in: consumerDetails } }, function(error, consumer) {
//         if (error) {
//             logger('Error: can not update consumer');
//             done(error, null);
//             return;
//         }
//         var userRef = config.firebase.userRef;
//         var newData = {};
//         done(null, consumer);
//     });
// };

/*
 * Used to inactive consumer by id 
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveConsumer = function (consumerDetails, done) {
    let columnsToUpdate = {
        status: consumerConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.haribhagats, columnsToUpdate, { 'haribhagat_id': { $in: consumerDetails } }, function (error, consumer) {
        if (error) {
            logger('Error: can not update consumer');
            done(error, null);
            return;
        }
        console.log(consumerDetails)

        var userRef = config.firebase.userRef;
        var newData = {};
        for (let i = 0; i < consumerDetails.length; i++) {
            var ref = config.firebase.userRef.child(consumerDetails[i]);
            ref.once("value").then(function (snapshot) {
                if (snapshot.exists()) {
                    newData[consumerDetails[i] + "/status"] = 'inactive';
                    userRef.update(newData);
                }

            });
        }
        // for(let i=0; i<consumerDetails.length; i++){
        //     var ref = config.firebase.userRef.child(consumerDetails[i]);
        //     ref.once("value").then(function(snapshot) {
        //         if(snapshot.exists()){
        //             ref.update({ status: 'inactive'});
        //         }
        //     });
        // }
        done(null, consumer);
    });
};

const deleteImageFromS3 = async (imageUrl) => {
    // Extract the key from the image URL
    const key = imageUrl.split('/').pop();

    // Specify the parameters for S3 object deletion
    const params = {
        Bucket: bucketName,
        Key: key,
    };

    // Delete the object from S3
    try {
        await s3.deleteObject(params).promise();
        console.log(`Image ${key} deleted from S3.`);
    } catch (error) {
        console.error('Error deleting image from S3:', error);
        throw error;
    }
};

/*
 * Used to delete consumer by id 
 * @param {consumerDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteConsumer = async function (consumerDetails, done) {
    console.log(consumerDetails);
    try {
        // Iterate over each consumer
        for (const consumerId of consumerDetails) {
            // Fetch the consumer's profile picture URL from the database
            const consumer = await query.selectWithAndOnePromise(dbConstants.dbSchema.haribhagats, { haribhagat_id: consumerId }, { _id: 0, profile_picture: 1 });
            console.log("Consumer:", consumer);

            // If the consumer has a profile picture, delete it from S3
            if (consumer && consumer.profile_picture) {
                await deleteImageFromS3(consumer.profile_picture);
                console.log(`Profile picture deleted for consumer with ID ${consumerId}`);
            }
        }
        // Proceed to delete the consumers from the database
        // const deletedConsumers = await query.removeMultiple(dbConstants.dbSchema.haribhagats, { 'haribhagat_id': { $in: consumerDetails } });
        // console.log("Deleted consumers:", deletedConsumers);
        // done(null, deletedConsumers);
        query.removeMultiple(dbConstants.dbSchema.haribhagats, { 'haribhagat_id': { $in: consumerDetails } }, function (error, consumer) {
            if (error) {
                logger('Error: can not delete haribhagat');
                done(error, null);
                return;
            }
            console.log("delete", consumer)
            done(null, consumer);
        });
    } catch (error) {
        console.error('Error deleting consumers:', error);
        logger('Error: can not delete haribhagat');
        done(error, null);
    }
};

/*
 * Used to get trip  haribhagats job using post method
 * @param {Function} done - Callback function with error
 */
const uploadFileObj = (fileObject, type, done) => {
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
    S3Manager.uploadFileObj(fileObject.url, bucketName, (errMediaUpload, filePath) => {
        if (errMediaUpload) {
            logger('Error: ', errMediaUpload);
            done(errors.internalServer(true), null);
            return;
        }
        console.log(filePath);
        done(null, filePath);
    });
};

/*
 * Used to remove image
 * @param {file} - Object
 * @param {Function} done - Callback function with error, data params
 */
const removeFileObj = (requestParam, req, done) => {
    let bucketName, db;
    let updateValue = {};
    let updateID = {};
    if (requestParam.type == 'consumer') {
        bucketName = config.aws.s3.consumerBucket;
        db = dbConstants.dbSchema.haribhagats;
        updateValue = { profile_picture: '' },
            updateID = { haribhagat_id: requestParam.haribhagat_id }
    } else if (requestParam.type == 'consumer_photo_id') {
        bucketName = config.aws.s3.consumerBucket;
        db = dbConstants.dbSchema.haribhagats;
        updateValue = { photo_id: '' },
            updateID = { haribhagat_id: requestParam.haribhagat_id }
    } else if (requestParam.type == 'profile_picture') {
        bucketName = config.aws.s3.driverBucket;
        db = dbConstants.dbSchema.admins;
        updateValue = { profile_picture: '' },
            updateID = { admin_id: requestParam.admin_id }
    } else if (requestParam.type == 'driver_license') {
        bucketName = config.aws.s3.driverBucket;
        db = dbConstants.dbSchema.admins;
        updateValue = { driver_license: '' },
            updateID = { admin_id: requestParam.admin_id }
    } else if (requestParam.type == 'vehicle') {
        bucketName = config.aws.s3.vehicleBucket;
        db = dbConstants.dbSchema.vehicleTypes;
        updateValue = { icon: '' },
            updateID = { vehicle_type_id: requestParam.vehicle_type_id }
    } else if (requestParam.type == 'administrator') {
        bucketName = config.aws.s3.adminBucket;
        db = dbConstants.dbSchema.administrators;
        updateValue = { profile_picture: '' },
            updateID = { admin_id: requestParam.admin_id }
    }
    S3Manager.removeFileObj(requestParam.url, bucketName, (errRemoveMedia, removeRes) => {
        if (errRemoveMedia) {
            logger('Error: ', errRemoveMedia);
            done(errors.internalServer(true), null);
            return;
        }
        query.updateSingle(db, updateValue, updateID, function (error, updated) {
            if (error) {
                logger('Error: ', errRemoveMedia);
                done(errors.internalServer(true), null);
                return;
            } else {
                done(null, removeRes);
            }
        });
    });
};

/*
 * Used to authenticate consumer
 * @param {requestParam} - request parameters from body
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
//     query.updateSingle(dbConstants.dbSchema.haribhagats, columnsAndValuesUpdate, {
//         haribhagat_id: requestParam.haribhagat_id
//     }, function(error, admin) {
//         if (error) {
//             logger('Error: can not update admins');
//             done(error, null);
//             return;
//         }
//         done(null, "notification status updated successfully");
//     });
// };

/*
 * Used to reset password of administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const forgotPassword = function (requestParam, req, done) {
    let columnsAndValuesLanguage = {
        language_id: requestParam.language_id
    }
    query.selectWithAndOne(dbConstants.dbSchema.languages, columnsAndValuesLanguage, function (error, language) {
        query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { email: requestParam.email }, function (error, consumer) {
            if (error) {
                logger('Error: can not sent email to admin');
                done(error, null);
                return;
            }
            if (consumer) {
                const length = 6;
                const code = 'CUS' + Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
                let fullUrl = req.protocol + '://' + req.get('host');
                const link = fullUrl + '/resetpassword.html?code=' + code;
                let emailTemplate;
                query.selectWithAndOne(dbConstants.dbSchema.email_templates, { code: 'FP' }, (error, template) => {
                    if (error) {
                        logger('Error: can not get email template.');
                        done(errors.internalServer(true), null);
                        return;
                    }
                    emailTemplate = template.description[language.code];
                    emailTemplate = emailTemplate.replace('#NAME#', consumer.first_name + " " + consumer.last_name);
                    emailTemplate = emailTemplate.replace("#LINK#", link);
                    const data = {
                        from: template.from_email,
                        to: consumer.email,
                        subject: template.email_subject,
                        html: emailTemplate
                    };
                    /*mailgun.messages().send(data, (error, body) => {
                        let columnAndValuesUpdate = {
                            verification_code: code
                        }
                        query.updateSingle(dbConstants.dbSchema.haribhagats, columnAndValuesUpdate, {
                            haribhagat_id: consumer.haribhagat_id
                        }, (error) => {
                            done(null, 'success');
                        });
                    });*/
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
                            let columnAndValuesUpdate = {
                                verification_code: code
                            }
                            query.updateSingle(dbConstants.dbSchema.haribhagats, columnAndValuesUpdate, {
                                haribhagat_id: consumer.haribhagat_id
                            }, (error) => {
                                done(null, 'success');
                            });
                        }
                        return;
                    })
                    // awsSES.sendEmail(params, (err, data) => {
                    //     if (err) {
                    //          console.log(err, err.stack);
                    //     } else {
                    //         let columnAndValuesUpdate = {
                    //              verification_code: code
                    //          }
                    //         query.updateSingle(dbConstants.dbSchema.haribhagats, columnAndValuesUpdate, {
                    //              haribhagat_id: consumer.haribhagat_id
                    //         }, (error) => {
                    //              done(null, 'success');
                    //         });
                    //     }
                    //     //done(null, {});
                    //     return;
                    // });
                });
            } else {
                logger('Error: consumer not exist.');
                done(errors.resourceNotFound(true), null);
                return;
            }
        });
    });
};

// const favouritePlace = (requestParam, res, done) => {
//     query.selectWithAndOne(dbConstants.dbSchema.haribhagats, {
//         haribhagat_id: requestParam.haribhagat_id,
//     }, (error, response) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//             done(errors.internalServer(true), null);
//             return;
//         }

//         if (!response) {
//             logger('Error: resource not found');
//             done(errors.consumerNotFound(true), null);
//             return;
//         }

//         let favouritePlaceArr = response.favourite_places;

//         if (requestParam.type == 'add' && requestParam.address_type && requestParam.address && requestParam.latitude && requestParam.longitude) {
//             let addressArr = _.where(favouritePlaceArr, {
//                 address: requestParam.address
//             });
//             if (addressArr.length > 0) {
//                 done(errors.recordExist(true), null);
//                 return;
//             }

//             let obj = {
//                 address_id: generateString(10, false, true, false).toUpperCase(),
//                 address_type: requestParam.address_type,
//                 address: requestParam.address,
//                 title: requestParam.title,
//                 latitude: parseFloat(requestParam.latitude),
//                 longitude: parseFloat(requestParam.longitude),
//             };

//             favouritePlaceArr.push(obj);
//             query.updateSingle(dbConstants.dbSchema.haribhagats, { favourite_places: favouritePlaceArr }, {
//                 haribhagat_id: requestParam.haribhagat_id
//             }, function(error, consumer) {
//                 if (error) {
//                     logger('Error: can not update consumer');
//                     done(error, null);
//                     return;
//                 }
//                 done(null, favouritePlaceArr.reverse());
//             });
//         } else if (requestParam.type == 'remove' && requestParam.address_id) {
//             let addressArr = _.where(favouritePlaceArr, {
//                 address_id: requestParam.address_id
//             });
//             if (addressArr.length == 0) {
//                 logger('Error: resource not found');
//                 done(errors.resourceNotFound(true), null);
//                 return;
//             }

//             addressArr = _.reject(favouritePlaceArr, function(item) {
//                 return item.address_id == requestParam.address_id;
//             });
//             query.updateSingle(dbConstants.dbSchema.haribhagats, { favourite_places: addressArr }, {
//                 haribhagat_id: requestParam.haribhagat_id
//             }, function(error, consumer) {
//                 if (error) {
//                     logger('Error: can not update consumer');
//                     done(error, null);
//                     return;
//                 }
//                 done(null, addressArr);
//             });
//         } else if (requestParam.type == 'update' && requestParam.address_id && requestParam.address_type && requestParam.address && requestParam.latitude && requestParam.longitude) {
//             let addressArr = _.where(favouritePlaceArr, {
//                 address_id: requestParam.address_id
//             });
//             if (addressArr.length == 0) {
//                 logger('Error: resource not found');
//                 done(errors.resourceNotFound(true), null);
//                 return;
//             }

//             addressArr = _.reject(favouritePlaceArr, function(item) {
//                 return item.address_id == requestParam.address_id;
//             });
//             let obj = {
//                 address_id: requestParam.address_id,
//                 address_type: requestParam.address_type,
//                 address: requestParam.address,
//                 title: requestParam.title,
//                 latitude: parseFloat(requestParam.latitude),
//                 longitude: parseFloat(requestParam.longitude),
//             };
//             addressArr.push(obj);
//             query.updateSingle(dbConstants.dbSchema.haribhagats, { favourite_places: addressArr }, {
//                 haribhagat_id: requestParam.haribhagat_id
//             }, function(error, consumer) {
//                 if (error) {
//                     logger('Error: can not update consumer');
//                     done(error, null);
//                     return;
//                 }
//                 done(null, addressArr);
//             });
//         } else if (requestParam.type == 'get' && requestParam.haribhagat_id) {
//             done(null, response.favourite_places.reverse());
//         } else {
//             logger('Error: Parameter missing');
//             done(errors.resourceNotFound(true), null);
//             return;
//         }
//     });
// };

/*
 * Used to get credit of customer
 * @param {creditDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const getCustomerCredit = function(creditDetails, req, done) {
//     let compairData = {
//         user_id: creditDetails.haribhagat_id
//     }
//     query.selectWithAnd(dbConstants.dbSchema.wallet_history, compairData, function(error, credits) {
//         let columnsAndValues = [];
//         async.forEachSeries(credits, function(singleCredit, Callback_s1) {
//             let getLabel = {};
//             if (singleCredit.wallet_transaction_type == 'consumer') {
//                 getLabel = {
//                     code: 'ADDED_BY_YOU'
//                 }
//             } else if (singleCredit.wallet_transaction_type == 'company' && singleCredit.type == 'addition') {
//                 getLabel = {
//                     code: 'ADDED_BY_COMPANY'
//                 }
//             } else if (singleCredit.wallet_transaction_type == 'company' && singleCredit.type == 'substraction') {
//                 getLabel = {
//                     code: 'DEDUCT_BY_COMPANY'
//                 }
//             } else if (singleCredit.wallet_transaction_type == 'invite_friend') {
//                 getLabel = {
//                     code: 'ADDED_BY_REFERRAL_CODE'
//                 }
//             } else if (singleCredit.wallet_transaction_type == 'admin' && singleCredit.type == 'addition') {
//                 getLabel = {
//                     code: 'ADDED_BY_YOU'
//                 }
//             } else if (singleCredit.wallet_transaction_type == 'admin' && singleCredit.type == 'substraction') {
//                 getLabel = {
//                     code: 'DEDUCT_BY_WALLET_FOR_PACKAGE'
//                 }
//             } else {
//                 getLabel = {
//                     code: 'DEDUCT_FOR_TRIP_BOOKING'
//                 }
//             }
//             query.selectWithAndOne(dbConstants.dbSchema.languageLabels, getLabel, (error, languageLabel) => {
//                 if (error) {
//                     Callback_s1();
//                 }
//                 if (!languageLabel) {
//                     Callback_s1();
//                 }
//                 let data = {
//                     wallet_id: singleCredit.wallet_id,
//                     transaction_id: singleCredit.transaction_id,
//                     // created_at: moment(singleCredit.created_at).format("Do MMM YYYY h:mm A"),
//                     created_at: moment(commonHandler.converTotimeZone(singleCredit.created_at)).format("Do MMM YYYY h:mm A"),
//                     date: singleCredit.created_at,
//                     type: singleCredit.type,
//                     message: languageLabel.value.EN,
//                     amount: singleCredit.amount
//                 }
//                 columnsAndValues.push(data)
//                 Callback_s1();
//             })
//         }, function() {

//             done(null, columnsAndValues);
//         });
//     });
// };

/*
 * Used to add credit of consumer
 * @param {creditDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
// const addCredit = function(creditDetails, done) {
//     creditDetails.wallet_transaction_type = 'company';
//     creditDetails.transaction_id = moment().unix() + Math.floor((Math.random() * 999999999) + 1);
//     creditDetails.amount = creditDetails.amount.replace(/,/g, '');
//     //creditDetails.credit = creditDetails.credit.replace(/,/g, '');
//     let columnsAndValuesConsumer = {
//             haribhagat_id: creditDetails.user_id
//         }
//         //query.selectWithAndOne(dbConstants.dbSchema.customer_credit_histories, columnsAndValuesConsumer, function(error, creditConsumer) {
//     query.selectWithAndOne(dbConstants.dbSchema.haribhagats, columnsAndValuesConsumer, async function(error, consumer) {
//         if (consumer == null) {
//             logger('Error: while creating consumer', errors.errorWithMessage(error));
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!consumer.wallet_balance) {
//             consumer.wallet_balance = '0';
//         } else if (isNaN(consumer.wallet_balance)) {
//             const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: creditDetails.user_id }, { _id: 0 }, {})
//                 const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
//                 const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
//                 const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
//                 const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
//                 const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
//                 consumer.wallet_balance = finalBalance
//         }
//         let wallet_balance = parseFloat(consumer.wallet_balance) + parseFloat(creditDetails.amount);
//         if (parseFloat(wallet_balance) < 0) {
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
//             query.insertSingle(dbConstants.dbSchema.wallet_history, creditDetails, function(error, credit) {
//                 if (error) {
//                     logger('Error: while creating credit', errors.errorWithMessage(error));
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 let mailData = {
//                     code: 'CSU',
//                     language_code: 'EN',
//                     amount: credit.amount,
//                     email: consumer.email
//                 } 
//                 consumer.code = "CREDIT_AMOUNT"
//                 consumer.user_type = "consumer"
//                 consumer.request_type = "consumer"
//                 consumer.credit_amount_by = creditDetails.amount
//                 notificationHandler.sendCreditNotification(consumer)
//                 commonHandler.sendEmail(mailData, (error, response) => {
//                     let columnsAndValuesConsumerUpdate = {
//                         wallet_balance: wallet_balance
//                     }
//                     query.updateMultiple(dbConstants.dbSchema.haribhagats, columnsAndValuesConsumerUpdate, {
//                         'haribhagat_id': creditDetails.user_id
//                     }, function(error, consumerUpdate) {
//                         if (error) {
//                             logger('Error: can not update consumer');
//                             done(error, null);
//                             return;
//                         }
//                         done(null, consumerUpdate);
//                     });
//                 })
//             });
//         }
//     });
//     //});
// }

// const uploadEditedFileObj = (fileObject, type, requestParam, done) => {
//     let bucketName, db;
//     let updateValue = {};
//     let updateID = {};
//     if (type == 'consumer') {
//         bucketName = config.aws.s3.consumerBucket;
//     } else if (type == 'admin') {
//         bucketName = config.aws.s3.driverBucket;
//     } else if (type == 'vehicle') {
//         bucketName = config.aws.s3.vehicleBucket;
//     } else if (type == 'administrator') {
//         bucketName = config.aws.s3.adminBucket;
//     }

//     S3Manager.uploadFileObj(fileObject.url, bucketName, (errMediaUpload, filePath) => {
//         if (errMediaUpload) {
//             logger('Error: ', errMediaUpload);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         console.log(filePath);
//         if (requestParam.type) {
//             if (requestParam.type == 'profile_picture' && type == 'consumer') {
//                 bucketName = config.aws.s3.consumerBucket;
//                 db = dbConstants.dbSchema.haribhagats;
//                 updateValue = { profile_picture: getImageNameFromURL(filePath) },
//                     updateID = { haribhagat_id: requestParam.haribhagat_id }
//             } else if (requestParam.type == 'profile_picture') {
//                 bucketName = config.aws.s3.driverBucket;
//                 db = dbConstants.dbSchema.admins;
//                 updateValue = { profile_picture: getImageNameFromURL(filePath) },
//                     updateID = { admin_id: requestParam.admin_id }
//             } else if (requestParam.type == 'driver_license') {
//                 bucketName = config.aws.s3.driverBucket;
//                 db = dbConstants.dbSchema.admins;
//                 updateValue = { driver_license: getImageNameFromURL(filePath) },
//                     updateID = { admin_id: requestParam.admin_id }
//             } else if (requestParam.type == 'driver_license_back') {
//                 bucketName = config.aws.s3.driverBucket;
//                 db = dbConstants.dbSchema.admins;
//                 updateValue = { driver_license_back: getImageNameFromURL(filePath) },
//                     updateID = { admin_id: requestParam.admin_id }
//             } else if (requestParam.type == 'nric_front') {
//                 bucketName = config.aws.s3.driverBucket;
//                 db = dbConstants.dbSchema.admins;
//                 updateValue = { nric_front: getImageNameFromURL(filePath) },
//                     updateID = { admin_id: requestParam.admin_id }
//             } else if (requestParam.type == 'nric_back') {
//                 bucketName = config.aws.s3.driverBucket;
//                 db = dbConstants.dbSchema.admins;
//                 updateValue = { nric_back: getImageNameFromURL(filePath) },
//                     updateID = { admin_id: requestParam.admin_id }
//             } else if (requestParam.type == 'vehicle') {
//                 bucketName = config.aws.s3.vehicleBucket;
//                 db = dbConstants.dbSchema.vehicleTypes;
//                 updateValue = { icon: getImageNameFromURL(filePath) },
//                     updateID = { vehicle_type_id: requestParam.vehicle_type_id }
//             } else if (requestParam.type == 'nric_photo') {
//                 bucketName = config.aws.s3.consumerBucket;
//                 db = dbConstants.dbSchema.haribhagats;
//                 updateValue = { nric_photo: getImageNameFromURL(filePath) },
//                     updateID = { haribhagat_id: requestParam.haribhagat_id }
//             } else if (requestParam.type == 'passport_photo') {
//                 bucketName = config.aws.s3.consumerBucket;
//                 db = dbConstants.dbSchema.haribhagats;
//                 updateValue = { passport_photo: getImageNameFromURL(filePath) },
//                     updateID = { haribhagat_id: requestParam.haribhagat_id }
//             }
//             else if (requestParam.type == 'administrator') {
//                 bucketName = config.aws.s3.adminBucket;
//                 db = dbConstants.dbSchema.administrators;
//                 updateValue = { profile_picture: getImageNameFromURL(filePath) },
//                     updateID = { admin_id: requestParam.admin_id }
//             }

//             S3Manager.removeFileObj(requestParam.url, bucketName, (errRemoveMedia, removeRes) => {
//                 if (errRemoveMedia) {
//                     logger('Error: ', errRemoveMedia);
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 console.log(updateValue)
//                 query.updateSingle(db, updateValue, updateID, function(error, updated) {
//                     if (error) {
//                         logger('Error: ', errRemoveMedia);
//                         done(errors.internalServer(true), null);
//                         return;
//                     } else {
//                         //done(null, removeRes);
//                         done(null, filePath);
//                     }
//                 });
//             });
//         } else {
//             done(null, filePath);
//         }
//     });
// };

// const uploadEditedVehiclePhoto = (fileObject, type, requestParam, done) => {
//     let db;
//     let updateValue = {};
//     let updateID = {};
//     let bucketName = config.aws.s3.driverBucket;
//     S3Manager.uploadFileObj(fileObject.url, bucketName, (errMediaUpload, filePath) => {
//         if (errMediaUpload) {
//             logger('Error: ', errMediaUpload);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (requestParam.type) {
//             S3Manager.removeFileObj(requestParam.url, bucketName, (errRemoveMedia, removeRes) => {
//                 if (errRemoveMedia) {
//                     logger('Error: ', errRemoveMedia);
//                     done(errors.internalServer(true), null);
//                     return;
//                 }
//                 done(null, filePath);
//             });
//         } else {
//             done(null, filePath);
//         }
//     });
// };

// const recentPlace = (requestParam, done) => {
//     requestParam.status = 'Complete'
//     query.selectWithAndFilter(dbConstants.dbSchema.trips, requestParam, {
//         _id: 0,
//         start_address: 1,
//         start_latitude: 1,
//         start_longitude: 1,
//     }, { created_at: -1 }, {}, (error, trips) => {
//         if (error) {
//             logger('Error: can not get any delivery');
//             done(error, null);
//             return;
//         }
//         trips = _.uniq(trips, 'start_address');
//         trips = _.first(trips, 3);
//         done(null, trips)
//     });
// }

/*
 * Retrieves the details of get admin
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
// const getConsumerRating = (requestParam, done) => {
//     let count = 0;
//     let rating = 0;

//     query.selectWithAnd(dbConstants.dbSchema.trips, { haribhagat_id: requestParam.haribhagat_id, status: 'Complete' }, function(error, trips) {
//         async.forEachSeries(trips, function(singleTrip, Callback_s1) {
//             if (!singleTrip.driver2consumer_rating || singleTrip.driver2consumer_rating == null || singleTrip.driver2consumer_rating == '') {
//                 singleTrip.driver2consumer_rating = '0';
//             }
//             count++;
//             rating = parseFloat(rating) + parseFloat(singleTrip.driver2consumer_rating);
//             Callback_s1();
//         }, function() {
//             let consumerRating
//             if (count == 0) {
//                 consumerRating = 0;
//             } else {
//                 consumerRating = parseFloat(rating / count);
//             }
//             done(null, { rating: parseFloat(consumerRating).toFixed(2) });
//         });
//     });
// };

/*
 * getConsumerLastStatus
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
// const getConsumerLastStatus = function(requestParam, done) {getWallet
//     query.selectWithAndOne(dbConstants.dbSchema.haribhagats, requestParam, (error, consumer) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!consumer) {
//             done(errors.unauthorizedAccess(true), null);
//             return;
//         }
//         getConsumerRating(requestParam, (err, consumerRating) => {
//             let obj = {
//                 notification: consumer.notification,
//                 rating: consumerRating.rating,
//             }
//             done(null, obj);
//         });
//     });
// };

// const addWallet = async function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, async (error, consumer) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.admins);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!consumer) {
//             done(errors.consumerNotFound(true), null);
//             return;
//         }
//         if (!consumer.wallet_balance) consumer.wallet_balance = 0;
//         if (isNaN(consumer.wallet_balance)) {
//             const res = await query.selectWithAndPromise(dbConstants.dbSchema.wallet_history, { user_id: requestParam.haribhagat_id }, { _id: 0 }, {})
//             const add = _.pluck(_.where(res, { type: "addition" }), 'amount')
//             const sub = _.pluck(_.where(res, { type: "substraction" }), 'amount')
//             const addSum = _.reduce(add, function (memo, num) { return memo + num; }, 0);
//             const deductSum = _.reduce(sub, function (memo, num) { return memo + num; }, 0);
//             const finalBalance = parseFloat(addSum) - parseFloat(deductSum)
//             consumer.wallet_balance = finalBalance
//         }
//         let wallet_balance = parseFloat(requestParam.amount) + parseFloat(consumer.wallet_balance);
//         if (requestParam.amount) {
//             try {
//                 requestParam.for = "walletConsumer"
//                 if(requestParam.payment_type && requestParam.payment_type.toLowerCase() == "wave"){
//                    let wavePayment = await commonHandler.makeTripPaymentWithWave(requestParam)
//                     wavePayment =JSON.parse(JSON.stringify(wavePayment))
//                         console.log('wavePayment++wallet++c',wavePayment)
//                         if(wavePayment == null){
//                             done(errors.paymentFailure(true), null);
//                             return;
//                         }else{
//                             done(null, wavePayment); 
//                         }
//                 }else {
//                     const payment = await makeTripPayment(requestParam)
//                     if (!payment.charge && payment.status == 400) {
//                         done(errors.customError('Amount must be at least 50 cents.',400,'Amount must be at least 50 cents.',true),null)
//                         return;
//                     }else if(!payment.charge && payment.status != 400){
//                         done(errors.paymentFailure(true), null);
//                         return;
//                     }
//                     console.log("payment", payment)
//                     requestParam.stripe_transaction_id = payment.charge.id
//                 }

//             } catch (error) {
//                 done(errors.paymentFailure(true), null);
//                 return;
//             }

//         }
//         if(!requestParam.payment_type || requestParam.payment_type.toLowerCase() != "wave"){
//             query.updateSingle(dbConstants.dbSchema.haribhagats, { wallet_balance: wallet_balance }, {
//                 haribhagat_id: requestParam.haribhagat_id
//             }, function(error, consumerUpdated) {
//                 let insertObj = {
//                         user_id: requestParam.haribhagat_id,
//                         user_type: 'consumer',
//                         amount: requestParam.amount,
//                         stripe_transaction_id: requestParam.stripe_transaction_id,
//                         transaction_id: requestParam.transaction_id,
//                         type: 'addition',
//                         wallet_transaction_type: 'consumer',
//                         payment_type:'stripe'
//                     }
//                 query.insertSingle(dbConstants.dbSchema.wallet_history, insertObj, function(error, consumer) {
//                     done(null, "Add amount successfully");
//                 });
//             });
//         }
//     });
// };

// const getWallet = function(requestParam, done) {
//     query.selectWithAndOne(dbConstants.dbSchema.settings, {}, (error, setting) => {
//         query.selectWithAndOne(dbConstants.dbSchema.haribhagats, requestParam, (error, consumer) => {
//             if (error) {
//                 logger('Error: can not get ', dbConstants.dbSchema.haribhagats);
//                 done(errors.internalServer(true), null);
//                 return;
//             }
//             if (!consumer) {
//                 done(errors.unauthorizedAccess(true), null);
//                 return;
//             }
//             if (!consumer.wallet_balance) consumer.wallet_balance = 0;
//             done(null, { wallet_balance: setting.currency +' '+parseInt(consumer.wallet_balance), currency_symbol: setting.currency });
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
//         user_id: requestParam.haribhagat_id,
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
//             wallet_transaction_type: 1,
//             trip_id: 1
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
//         haribhagat_id: requestParam.haribhagat_id,
//         //status: tripConstants.status.complete
//         status: { $in: [tripConstants.status.complete, tripConstants.status.cancel] }
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
//         //$unwind: "$driverDetails"
//         $unwind: {
//             path: "$driverDetails",
//             "preserveNullAndEmptyArrays": true
//         }
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
//             price: "$amount_pay",
//             created_at:"$created_at",
//             status: "$status",
//         }
//     }];
//     query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, async (error, response) => {
//         const setting = await query.selectWithAndOnePromise(dbConstants.dbSchema.settings, {}, { currency: 1 })

//         if (error) {
//             logger('Error: can not get record.');
//             done(errors.internalServer(true), null);
//             return;
//         }
//         _.each(response, function(data) {
//             // data.trip_date = moment(data.trip_date).format("Do MMM YYYY h:mm A")
//             data.trip_date = moment(commonHandler.converTotimeZone(data.trip_date)).format("Do MMM YYYY h:mm A")
//             data.date = data.created_at
//             data.price =  parseFloat(data.price.replace(/^\D+/g, ''))
//         });
//         done(null, response)
//     });
// }

/*
Name : addSupport
Purpose : used to addSupport 
Original Author : Meet Aghera
Created At : 19th Aug 2019
*/
// const addSupport = (requestParam) => {
//     return new Promise((resolve, reject) => {
//         try {
//             let supportobj = {
//                 support_id: `SUB${generateString(4, true, false, false)}`,
//                 name: requestParam.name,
//                 mobile: requestParam.mobile,
//                 mobile_country_code: requestParam.mobile_country_code,
//                 is_default: false
//             }
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { suppoer_contact: 1, _id: 0 }, (error, singleConsumer) => {
//                 if (error) {
//                     logger(error)
//                     reject(errors.internalServer(true))
//                     return
//                 }
//                 if (!singleConsumer) {
//                     reject(errors.customError("user not found", 404, "User not found"))
//                     return
//                 }
//                 console.log((singleConsumer.suppoer_contact.length))
//                 if (singleConsumer.suppoer_contact.length == 0) {
//                     supportobj.is_default = true
//                 }
//                 query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { suppoer_contact: { $elemMatch: { mobile: requestParam.mobile, mobile_country_code: requestParam.mobile_country_code } }, haribhagat_id: requestParam.haribhagat_id }, { suppoer_contact: 1, _id: 0 }, (error, support) => {
//                     if (error) {
//                         logger(error)
//                         reject(errors.internalServer(true))
//                         return
//                     }
//                     if (!support) {
//                         query.updateAndFindSingle(dbConstants.dbSchema.haribhagats, { $addToSet: { suppoer_contact: supportobj } }, { haribhagat_id: requestParam.haribhagat_id }, { suppoer_contact: 1, _id: 0 }, (error, supporList) => {
//                             if (error) {
//                                 console.log(error)
//                                 reject(errors.internalServer(true))
//                                 return
//                             }
//                             if (!supporList) {
//                                 reject(errors.customError("user not fount with consumer id", 404, "user not fount with consumer i", true))
//                                 return
//                             }
//                             resolve(supporList.suppoer_contact)
//                             return

//                         })
//                     } else {
//                         reject(errors.customError("Mobile number alredy added", 404, "Mobile number alredy added"))
//                         return
//                     }
//                 })


//             })


//         } catch (error) {
//             console.log(error)
//             reject(errors.internalServer(true))
//             return
//         }
//     })
// }

/*
Name : editSupport
Purpose : used to addSupport 
Original Author : Meet Aghera
Created At : 19th Aug 2019
*/
// const editSupport = (requestParam) => {
//     return new Promise((resolve, reject) => {
//         try {
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, suppoer_contact: 1 }, (error, response) => {
//                 if (error) {
//                     console.log(error)
//                     reject(errors.internalServer(true))
//                     return
//                 }
//                 if (!response) {
//                     reject(errors.customError("user not found", 404, "User not found"))
//                     return
//                 }
//                 response = JSON.parse(JSON.stringify(response))
//                 let support_info = response.suppoer_contact

//                 let result = _.findWhere(support_info, { mobile: requestParam.mobile, mobile_country_code: requestParam.mobile_country_code })
//                 if (result) {
//                     if (result.support_id != requestParam.support_id) {
//                         reject(errors.customError("Mobile number is alredy exists", 406, "Mobile number is alredy exists", true))
//                         return
//                     }

//                 }
//                 let findIndex = _.findIndex(support_info, { support_id: requestParam.support_id })

//                 if (findIndex > -1) {
//                     support_info[findIndex].name = requestParam.name;
//                     support_info[findIndex].mobile = requestParam.mobile;
//                     support_info[findIndex].mobile_country_code = requestParam.mobile_country_code
//                     console.log(support_info)
//                     query.updateAndFindSingle(dbConstants.dbSchema.haribhagats, { suppoer_contact: support_info }, { haribhagat_id: requestParam.haribhagat_id }, {}, (error, response) => {
//                         if (error) {
//                             console.log(error)
//                             reject(errors.internalServer(true))
//                             return
//                         }
//                         if (!response) {
//                             reject(errors.customError("user not found", 404, "User not found"))
//                             return
//                         }
//                         resolve(response.suppoer_contact)
//                         return
//                     })
//                 } else {
//                     reject(errors.customError("user not found", 404, "User not found"))
//                     return
//                 }

//             })
//         } catch (error) {
//             console.log(error)
//             reject(errors.internalServer(true))
//             return
//         }
//     })
// }

/*
Name : deleteSupport
Purpose : used to deleteSupport 
Original Author : Meet Aghera
Created At : 19th Aug 2019
*/
// const deleteSupport = (requestParam) => {
//     return new Promise((resolve, reject) => {
//         try {
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, suppoer_contact: 1 }, (error, response) => {
//                 if (error) {
//                     console.log(error)
//                     reject(errors.internalServer(true))
//                     return
//                 }
//                 if (!response) {
//                     reject(errors.customError("user not found", 404, "User not found"))
//                     return
//                 }
//                 response = JSON.parse(JSON.stringify(response))
//                 let support_info = response.suppoer_contact
//                 let findIndex = _.findIndex(support_info, { support_id: requestParam.support_id })
//                 if (findIndex > -1) {
//                     if (support_info[findIndex].is_default == true) {
//                         console.log("in----1=>" + findIndex)
//                         support_info.splice(findIndex, 1);
//                         console.log(support_info)
//                         if (!support_info.length == 0) {
//                             let lan = support_info.length - 1
//                             if (lan > -1) {
//                                 console.log(support_info)
//                                 support_info[lan].is_default = true
//                             }

//                         }

//                     } else {
//                         support_info.splice(findIndex, 1);
//                     }
//                     query.updateAndFindSingle(dbConstants.dbSchema.haribhagats, { suppoer_contact: support_info }, { haribhagat_id: requestParam.haribhagat_id }, {}, (error, response) => {
//                         if (error) {
//                             console.log(error)
//                             reject(errors.internalServer(true))
//                             return
//                         }
//                         if (!response) {
//                             reject(errors.customError("user not found", 404, "User not found"))
//                             return
//                         }
//                         console.log("in-2")
//                         resolve(response.suppoer_contact)
//                         return
//                     })
//                 } else {
//                     reject(errors.customError("support contact not found with this support_id", 406, "support contact not found with this support_id", true))
//                     return
//                 }

//             })
//         } catch (error) {
//             console.log(error)
//             reject(errors.internalServer(true))
//             return
//         }
//     })
// }

/*
Name : setDefaultSupport
Purpose : used to setDefaultSupport 
Original Author : Meet Aghera
Created At : 19th Aug 2019
*/
// const setDefaultSupport = (requestParam) => {
//     return new Promise((resolve, reject) => {
//         try {
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, suppoer_contact: 1 }, (error, response) => {
//                 if (error) {
//                     console.log(error)
//                     reject(errors.internalServer(true))
//                     return
//                 }
//                 if (!response) {
//                     reject(errors.customError("user not found", 404, "User not found"))
//                     return
//                 }

//                 response = JSON.parse(JSON.stringify(response))
//                 let support_info = response.suppoer_contact
//                 let findIndex = _.findIndex(support_info, { is_default: true })
//                 console.log("findIndex=>" + findIndex)
//                 if (findIndex > -1) {
//                     support_info[findIndex].is_default = false
//                 }
//                 let i = _.findIndex(support_info, { support_id: requestParam.support_id })
//                 if (i > -1) {
//                     support_info[i].is_default = true
//                 } else {
//                     reject(errors.customError("support contact not found with this support_id", 406, "support contact not found with this support_id", true))
//                     return
//                 }
//                 console.log(support_info)
//                 query.updateAndFindSingle(dbConstants.dbSchema.haribhagats, { suppoer_contact: support_info }, { haribhagat_id: requestParam.haribhagat_id }, {}, (error, response) => {
//                     if (error) {
//                         console.log(error)
//                         reject(errors.internalServer(true))
//                         return
//                     }
//                     if (!response) {
//                         reject(errors.customError("user not found", 404, "User not found"))
//                         return
//                     }
//                     resolve(response.suppoer_contact)
//                     return
//                 })

//             })
//         } catch (error) {
//             console.log(error)
//             reject(errors.internalServer(true))
//             return
//         }
//     })
// }

// const listSupport = (requestParam) => {
//     return new Promise((resolve, reject) => {
//         try {
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { suppoer_contact: 1, _id: 0 }, (error, response) => {
//                 if (error) {
//                     console.log(error)
//                     reject(errors.internalServer(true))
//                     return
//                 }
//                 if (!response) {
//                     reject(errors.customError("user not found", 404, "User not found"))
//                     return
//                 }
//                 resolve(response.suppoer_contact)
//                 return
//             })
//         } catch (error) {
//             console.log(error)
//             reject(errors.internalServer(true))
//             return
//         }
//     })
// }

// const sendMsg = (requestParam, done) => {
//     query.selectWithAndOne(dbConstants.dbSchema.sms_templates, { code: 'EMERGENCY_CONTACT' }, (error, sms) => {
//         if (error) {
//             done(errors.internalServer(true), null)
//             return
//         }
//         if (!sms) {
//             done(errors.cannotSendEmail(true), null)
//             return
//         }
//         query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: requestParam.language_id }, (error, language) => {
//             if (error) {
//                 done(errors.internalServer(true), null)
//                 return
//             }
//             let message = sms.value[language.code];
//             // message = message.replace('#OTP#', otp);
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, suppoer_contact: 1 }, (error, consumer) => {
//                 if (error) {
//                     done(errors.internalServer(true), null)
//                     return
//                 }
//                 if (!consumer) {
//                     done(errors.consumerNotFound(true))
//                     return
//                 }
//                 consumer = JSON.parse(JSON.stringify(consumer))
//                 let suppoer_contact = consumer.suppoer_contact
//                 let mobile = _.findIndex(suppoer_contact, { is_default: true })
//                 if (mobile > -1) {
//                     client.messages.create({
//                             body: message,
//                             to: suppoer_contact[mobile].mobile_country_code + suppoer_contact[mobile].mobile,
//                             from: config.twilio.mobileNo
//                         })
//                         .then((message) => {
//                             console.log(message.accountSid);
//                             done(null, {})
//                             return
//                         }).catch((error) => {
//                             done(null, {})
//                             return
//                         });
//                 } else {
//                     done(null, {})
//                     return
//                 }
//             })

//         })


//     })
// }

// const updateharibhagatsupport = (requestParam, done) => {
//     query.selectWithAndOneNew(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, haribhagat_id: 1, suppoer_contact: 1 }, (error, getConsumer) => {
//         if (error) {
//             done(errors.internalServer(true), null)
//             return
//         }
//         if (!getConsumer) {
//             done(errors.customError("USer not found", 404, "User not found", true))
//             return
//         }
//         let is_default;
//         if (getConsumer.suppoer_contact.length == 0) {
//             is_default = true
//         } else {
//             is_default = false
//         }
//         if (requestParam.support_id && !requestParam.type) {
//             let result = _.findWhere(getConsumer.suppoer_contact, { mobile: requestParam.mobile, mobile_country_code: requestParam.mobile_country_code })
//             if ((result) && (result.support_id != requestParam.support_id)) {
//                 done(errors.customError("Mobile number alredy added", 404, "Mobile number alredy added"))
//                 return
//             } else {
//                 getConsumer.suppoer_contact.map(function(i) {
//                     if (i.support_id == requestParam.support_id) {
//                         i.name = requestParam.name || i.name;
//                         i.mobile_country_code = requestParam.mobile_country_code || i.mobile_country_code;
//                         i.mobile = requestParam.mobile || i.mobile;
//                         i.is_default = requestParam.is_default || i.is_default;
//                     }
//                     return i;
//                 });
//                 console.log(getConsumer.suppoer_contact)
//                 query.updateSingle(dbConstants.dbSchema.haribhagats, { suppoer_contact: getConsumer.suppoer_contact }, {
//                     haribhagat_id: requestParam.haribhagat_id
//                 }, function(error, consumerUpdated) {
//                     console.log(getConsumer.suppoer_contact);
//                     done(null, consumerUpdated);
//                 });
//             }
//         } else if (requestParam.type == 'get') {
//             let result = _.findWhere(getConsumer.suppoer_contact, { support_id: requestParam.support_id })
//             console.log(result)
//             done(null, result);
//         } else {
//             query.selectWithAndOneMod(dbConstants.dbSchema.haribhagats, { suppoer_contact: { $elemMatch: { mobile: requestParam.mobile, mobile_country_code: requestParam.mobile_country_code } }, haribhagat_id: requestParam.haribhagat_id }, { suppoer_contact: 1, _id: 0 }, (error, duplicateSupport) => {
//                 if (error) {
//                     done(errors.internalServer(true), null)
//                     return
//                 }
//                 if (duplicateSupport) {
//                     done(errors.customError("Mobile number alredy added", 404, "Mobile number alredy added"))
//                     return
//                 } else {
//                     const support_id = `SUB${generateString(4, true, false, false)}`;
//                     let support = {
//                         support_id: support_id,
//                         name: requestParam.name,
//                         mobile_country_code: requestParam.mobile_country_code,
//                         mobile: requestParam.mobile,
//                         is_default: is_default
//                     }
//                     console.log(support)
//                     query.updateSingle(dbConstants.dbSchema.haribhagats, { $push: { suppoer_contact: support } }, {
//                         haribhagat_id: requestParam.haribhagat_id
//                     }, function(error, consumerUpdated) {
//                         done(null, consumerUpdated);
//                     });
//                 }
//             })
//         }
//     });

// }

// const deleteharibhagatsupport = (requestParam, done) => {
//     query.selectWithAndOneNew(dbConstants.dbSchema.haribhagats, { haribhagat_id: requestParam.haribhagat_id }, { _id: 0, haribhagat_id: 1, suppoer_contact: 1 }, (error, getConsumer) => {
//         if (error) {
//             done(errors.internalServer(true), null)
//             return
//         }
//         if (!getConsumer) {
//             done(errors.customError("User not found", 404, "User not found", true))
//             return
//         }
//         let suppport = []
//         if (requestParam.type == 'delete') {
//             suppport = _.without(getConsumer.suppoer_contact, _.findWhere(getConsumer.suppoer_contact, { support_id: requestParam.support_id }));
//             console.log(suppport)
//             if (suppport.length > 0) {
//                 let defaultData = _.findWhere(suppport, { is_default: true })
//                 if (!defaultData) {
//                     suppport[0].is_default = true
//                 }
//             }
//             console.log(suppport)
//         } else if (requestParam.type == 'default') {
//             suppport = getConsumer.suppoer_contact.map(function(i) {
//                 if (i.support_id == requestParam.support_id) {
//                     i.is_default = true;
//                 } else {
//                     i.is_default = false;
//                 }
//                 return i;
//             });

//         } else {
//             suppport = getConsumer.suppoer_contact
//         }
//         query.updateSingle(dbConstants.dbSchema.haribhagats, { suppoer_contact: suppport }, {
//             haribhagat_id: requestParam.haribhagat_id
//         }, function(error, consumerUpdated) {
//             done(null, consumerUpdated);
//         });
//     });
// }

function generateFullURL(imgName) {
    if (imgName) { return config.AWS_BASE_URL + "/" + bucketName + "/" + imgName }
}

function getImageNameFromURL(URL) {
    if (URL) {
        var mainImageUploadURL = URL; //uploadPhoto = AWS return object 
        var normalImageUploadURL = mainImageUploadURL.lastIndexOf('/');
        var finalImageURL = mainImageUploadURL.substring(normalImageUploadURL + 1);
        return finalImageURL;
    }
}

// function makeTripWavePayment(requestParam,done){
//     query.selectWithAndOne(dbConstants.dbSchema.trips, { trip_id: requestParam.trip_id }, async (error, trip) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.admins);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!trip) {
//             done(errors.tripNotFound(true), null);
//             return;
//         }
//         trip = JSON.parse(JSON.stringify(trip))
//         let wavePayment = await commonHandler.makeTripPaymentWithWave({admin_id: trip.admin_id, amount_pay: trip.amount_pay.replace(/^\D+/g, ''), for: "trip", haribhagat_id: trip.haribhagat_id,trip_id:requestParam.trip_id})
//         wavePayment = JSON.parse(JSON.stringify(wavePayment))
//         if(wavePayment == null){
//             done(errors.paymentFailure(true), null);
//             return;
//         }
//         done(null,wavePayment)
//     });
// }

// function makeTripAdditionPayment(requestParam,done){
//     query.selectWithAndOne(dbConstants.dbSchema.trips, { trip_id: requestParam.trip_id }, async (error, trip) => {
//         if (error) {
//             logger('Error: can not get ', dbConstants.dbSchema.admins);
//             done(errors.internalServer(true), null);
//             return;
//         }
//         if (!trip) {
//             done(errors.tripNotFound(true), null);
//             return;
//         }
//         trip = JSON.parse(JSON.stringify(trip))
//         const payment = await makeAdditionTripPayment(requestParam)
//         if (!payment.charge && payment.status == 400) {
//             done(errors.customError('Amount must be at least 50 cents.',400,'Amount must be at least 50 cents.',true),null)
//             return;
//         }else if(!payment.charge && payment.status != 400){
//             done(errors.paymentFailure(true), null);
//             return;
//         }
//         console.log("payment", payment)
//         requestParam.stripe_transaction_id = payment.charge.id
//         // let wavePayment = await commonHandler.makeTripPaymentWithWave({admin_id: trip.admin_id, amount_pay: trip.amount_pay.replace(/^\D+/g, ''), for: "trip", haribhagat_id: trip.haribhagat_id,trip_id:requestParam.trip_id})
//         // wavePayment = JSON.parse(JSON.stringify(wavePayment))
//         // if(wavePayment == null){
//         //     done(errors.paymentFailure(true), null);
//         //     return;
//         // }
//         done(null,wavePayment)
//     });
// }
const tableviewHaribhagatPDFForSabha = async (haribhagats, res) => {
    try {
        // if (
        //     !haribhagats.nonAttendeesHaribhagats.length
        // ) {
        //     return res.status(404).send("No records found.");
        // }

        const doc = new PDFDocument({ size: "A4", margin: 30 });
        const fontPath = path.join(__dirname, "../public/fonts/HindVadodara-Light.ttf");
        const fontBold = path.join(__dirname, "../public/fonts/HindVadodara-SemiBold.ttf");
        doc.registerFont("Gujarati", fontPath);
        doc.registerFont("GujaratiBold", fontBold);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=haribhagat_data_table.pdf");

        doc.pipe(res);

        const tableTop = 120;
        const cellPadding = 5;
        const columnWidths = {
            number: 40,
            id: 80,
            name: 300,
            mobile: 100,
        };

        const drawTableHeaders = (y) => {
            doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();

            doc.font("GujaratiBold")
                .fontSize(12)
                .text("ક્ર.", 35, y + cellPadding, { width: columnWidths.number, align: "center" })
                .text("ID", 75, y + cellPadding, { width: columnWidths.id, align: "center" })
                .text("નામ", 155, y + cellPadding, { width: columnWidths.name, align: "center" })
                .text("મોબાઇલ", 455, y + cellPadding, { width: columnWidths.mobile, align: "center" });

            doc.moveTo(30, y + 30).lineTo(doc.page.width - 30, y + 30).stroke();

            doc.moveTo(30, y).lineTo(30, y + 30).stroke(); // Left border
            doc.moveTo(70, y).lineTo(70, y + 30).stroke(); // Column separator
            doc.moveTo(150, y).lineTo(150, y + 30).stroke();
            doc.moveTo(450, y).lineTo(450, y + 30).stroke();
            doc.moveTo(565, y).lineTo(565, y + 30).stroke(); // Right border
        };

        const drawTableHeadersSabha = (headers, columnPositions, y) => {
            doc.moveTo(30, y).lineTo(doc.page.width - 30, y).stroke();
            headers.forEach((header, index) => {
                doc.font("GujaratiBold").fontSize(12).text(header, columnPositions[index], y + cellPadding, {
                    width: columnPositions[index + 1] - columnPositions[index] || doc.page.width - columnPositions[index],
                    align: "center",
                });
            });
            doc.moveTo(30, y + 30).lineTo(doc.page.width - 30, y + 30).stroke();
        };

        const drawTableRow = (y, index, id, fullName, mobile) => {
            const rowHeight = Math.max(
                doc.heightOfString(id, { width: columnWidths.id }),
                doc.heightOfString(fullName, { width: columnWidths.name }),
                doc.heightOfString(mobile, { width: columnWidths.mobile })
            ) + cellPadding * 2;

            doc.font("Gujarati")
                .fontSize(10)
                .text(index, 35, y + cellPadding, { width: columnWidths.number, align: "center" })
                .text(id, 75, y + cellPadding, { width: columnWidths.id ,  align: "center" })
                .text(fullName, 155, y + cellPadding, { width: columnWidths.name })
                .text(mobile, 455, y + cellPadding, { width: columnWidths.mobile });

            doc.moveTo(30, y).lineTo(30, y + rowHeight).stroke();
            doc.moveTo(70, y).lineTo(70, y + rowHeight).stroke();
            doc.moveTo(150, y).lineTo(150, y + rowHeight).stroke();
            doc.moveTo(450, y).lineTo(450, y + rowHeight).stroke();
            doc.moveTo(565, y).lineTo(565, y + rowHeight).stroke();

            doc.moveTo(30, y + rowHeight).lineTo(doc.page.width - 30, y + rowHeight).stroke();

            return y + rowHeight;
        };
        let yPosition = 50;
                doc.font("Gujarati").fontSize(12).text(
                    `જય સ્વામિનારાયણ`,
                    30,
                    yPosition,
                    { width: doc.page.width - 60, align: "center" }
                );
             yPosition += 40;
            // First Page: Sabha Details and Attendance Analysis
            const startDate = new Date(haribhagats.start_date).toLocaleDateString("gu-IN");
            const endDate = new Date(haribhagats.end_date).toLocaleDateString("gu-IN");
            doc.font("GujaratiBold")
                .fontSize(14)
                .text(`પ્રારંભ તારીખ ${startDate} થી અંત તારીખ ${endDate} નું સભા વિશ્લેષણ`, 30, yPosition,  { width: doc.page.width - 60, align: "center" });
            yPosition += 40;
            // // Sabha Table
            const sabhaHeaders = ["ક્રમ", "સભા નામ", "સભા તારીખ", "સમય", "હાજરી"];
            const sabhaColumnPositions = [30, 70, 250, 400, 500, 565];
            drawTableHeadersSabha(sabhaHeaders, sabhaColumnPositions, yPosition);
            yPosition += 30;
    
            haribhagats.sabha.forEach((sabha, index) => {
                const rowHeight = Math.max(
                    doc.heightOfString(sabha.sabha_name, { width: sabhaColumnPositions[2] - sabhaColumnPositions[1] }),
                    doc.heightOfString(new Date(sabha.sabha_date).toLocaleDateString("gu-IN"), {
                        width: sabhaColumnPositions[3] - sabhaColumnPositions[2],
                    })
                ) + cellPadding * 2;
    
                doc.font("Gujarati")
                    .fontSize(10)
                    .text(index + 1, sabhaColumnPositions[0], yPosition + cellPadding, {
                        width: sabhaColumnPositions[1] - sabhaColumnPositions[0],
                        align: "center",
                    })
                    .text(sabha.sabha_name, sabhaColumnPositions[1], yPosition + cellPadding, {
                        width: sabhaColumnPositions[2] - sabhaColumnPositions[1],
                    })
                    .text(new Date(sabha.sabha_date).toLocaleDateString("gu-IN"), sabhaColumnPositions[2], yPosition + cellPadding, {
                        width: sabhaColumnPositions[3] - sabhaColumnPositions[2],
                    })
                    .text(`${sabha.from_time} - ${sabha.to_time}`, sabhaColumnPositions[3], yPosition + cellPadding, {
                        width: sabhaColumnPositions[4] - sabhaColumnPositions[3],
                    })
                    .text(sabha.attendees, sabhaColumnPositions[4], yPosition + cellPadding, {
                        width: sabhaColumnPositions[5] - sabhaColumnPositions[4],
                        align: "center",
                    });
    
                yPosition += rowHeight;
    
                if (yPosition + 50 > doc.page.height - doc.options.margin) {
                    doc.addPage();
                    yPosition = 50;
                    drawTableHeaders(sabhaHeaders, sabhaColumnPositions, yPosition);
                    yPosition += 30;
                }
            });
    
            if (yPosition + 100 > doc.page.height - doc.options.margin) {
                doc.addPage();
                yPosition = 50;
            }
            
            yPosition += 20;
            doc.font("GujaratiBold").fontSize(14).text(`${haribhagats.gender} હરિભગતો નુ હાજરી વિશ્લેષણ:`, 30, yPosition);
            yPosition += 20;
            if(haribhagats.sabhaCount1.length){
            haribhagats.sabhaCount1.forEach((group) => {
                const attendanceText = `${haribhagats.sabha.length} થી ${group._id} સભા માં હાજર હોય તેવા ${group.haribhagatCount} ${haribhagats.gender} હરિભગત`;
                doc.font("Gujarati").fontSize(12).text(attendanceText, 30, yPosition);
                yPosition += 20;
            });
            }
           
            
            doc.font("Gujarati").fontSize(12).text(
                `એક પણ સભા હાજર નો હોય તેવા ${haribhagats.gender} હરિભગત: ${haribhagats.nonAttendeesHaribhagats.length}`,
                30,
                yPosition
            );
            yPosition += 40;

        


            
          
        // Title for Non-Attendees Table
        doc.font("GujaratiBold").fontSize(14).text(`એક પણ સભા હાજર નો હોય તેવા (${haribhagats.nonAttendeesHaribhagats.length}) ${haribhagats.gender} હરિભગત `, 30, yPosition);
        yPosition += 30;

        drawTableHeaders(yPosition);
        yPosition += 30;

        let rowCount = 1;
        
        haribhagats.nonAttendeesHaribhagats.forEach((hb) => {
            const fullName = `${hb.first_name} ${hb.middle_name} ${hb.surname}`;
            const mobile = hb.mobile;

            if (yPosition + 50 > doc.page.height - doc.options.margin) {
                doc.addPage();
                yPosition = 50;
                drawTableHeaders(yPosition);
                yPosition += 30;
            }

            yPosition = drawTableRow(yPosition, rowCount, hb.haribhagat_id, fullName, mobile);
            rowCount++;
        });



        // Add Grouped Details
        haribhagats.sabhaCount1.forEach((group) => {
            if (yPosition + 50 > doc.page.height - doc.options.margin) {
                doc.addPage();
                yPosition = 50;
            }

            const attendanceText = `${haribhagats.sabhaCount1.length} માંથી ${group._id} સભા માં હાજર હોય તેવા (${group.haribhagatCount}) ${haribhagats.gender} હરિભગત`;
            doc.font("GujaratiBold").fontSize(14).text(attendanceText, 30, yPosition+20);
            yPosition += 50;

            drawTableHeaders(yPosition);
            yPosition += 30;

            group.haribhagatDetails.forEach((hb, index) => {
                const fullName = `${hb.first_name} ${hb.middle_name} ${hb.surname}`;
                const mobile = hb.mobile;

                if (yPosition + 50 > doc.page.height - doc.options.margin) {
                    doc.addPage();
                    yPosition = 50;
                    drawTableHeaders(yPosition);
                    yPosition += 30;
                }

                yPosition = drawTableRow(yPosition, index + 1, hb.haribhagat_id, fullName, mobile);
            });
        });

        // Add Analytics Section
        if (yPosition + 100 > doc.page.height - doc.options.margin) {
            doc.addPage();
            yPosition = 50;
        }

        // doc.font("GujaratiBold").fontSize(14).text("વિશ્લેષણ:", 30, yPosition);
        yPosition += 20;

        doc.font("Gujarati").fontSize(12).text(
            `જય સ્વામિનારાયણ`,
            30,
            yPosition,
            { width: doc.page.width - 60, align: "center" }
        );

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating PDF");
    }
};





module.exports = {
    getHaribhagat1: getHaribhagat1,
    updateAppVersionCode: updateAppVersionCode,
    getHaribhagat: getHaribhagat,
    authentication: authentication,
    gridviewHaribhagatPDF: gridViewHaribhagatPDF,
    tableviewHaribhagatPDFForSabha:tableviewHaribhagatPDFForSabha,
    tableviewHaribhagatPDF: tableviewHaribhagatPDF,
    duplicationHaribhagat: duplicationHaribhagat,
    getConsumerProfile: getConsumerProfile,
    updateConsumerProfile: updateConsumerProfile,
    deleteAccount: deleteAccount,
    activeConsumer: activeConsumer,
    inactiveConsumer: inactiveConsumer,
    deleteConsumer: deleteConsumer,
    createConsumer: createConsumer,
    updateConsumer: updateConsumer,
    // sendWhatsAppMessage: sendWhatsAppMessage,
    uploadImage: uploadImage,
    getConsumerPost: getConsumerPost,
    uploadFileObj,
    removeFileObj,
    forgotPassword,
    // sendOTP,
    // sendMail,
    // otpVerification: otpVerification,
    // loginWithSocial: loginWithSocial,
    // resendOtp: resendOtp,
    // removePhoto: removePhoto,
    // notificationStatus,
    // favouritePlace,
    // getCustomerCredit,
    // addCredit,
    // uploadEditedFileObj,
    // uploadEditedVehiclePhoto,
    // recentPlace,
    // getConsumerLastStatus,
    // getConsumerRating,
    // getWallet,
    // addWallet,
    // walletHistory,
    // getTripBackend,
    // setDefaultSupport,
    // deleteSupport,
    // editSupport,
    // addSupport,
    // listSupport,
    // sendMsg,
    // updateharibhagatsupport,
    // deleteharibhagatsupport,
    // archiveConsumer,
    // restoreArchiveConsumer,
    // makeTripPayment,
    // makeTripAdditionPayment,
    // holdTripPayment,
    // finishHoldTripPayment,
    // makeTripWavePayment
};

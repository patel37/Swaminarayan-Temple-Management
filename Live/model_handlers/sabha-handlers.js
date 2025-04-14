'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
const mongoose = require('mongoose');
let _ = require('underscore');
const Sabha = require('./../models/sabha');
const Haribhagat = require('./../models/haribhagat');
const moment = require('moment');

// const getSabha = function (requestParam, done) {
//     console.log("--------requestParam", requestParam)
//     if (requestParam.admin_id) {
//         query.selectWithAndOne(dbConstants.dbSchema.sabha, requestParam, function (error, sabha) {
//             if (error) {
//                 logger('Error: can not get sabha data');
//                 done(error, null);
//                 return;
//             }
//             let columnAndValues = {
//                 'id': sabha.admin_id,
//                 'sabha_id': sabha.sabha_id,
//                 'sabha_name': sabha.sabha_name,
//                 'sabha_date': sabha.sabha_date,
//                 'from_time': sabha.from_time,
//                 'to_time': sabha.to_time,
//                 'haribhagat_id': sabha.haribhagat_id
//             };
//             done(null, columnAndValues);
//         })
//     }
//     else {
//         let compairData = {}
//         if (requestParam.status) {
//             compairData.status = 'Active';
//         }
//         query.selectWithAndFilter(dbConstants.dbSchema.sabha, compairData, {}, { created_at: -1 }, {}, function (error, sabha) {
//             if (error) {
//                 logger('Error: can not get currency data');
//                 done(error, null);
//                 return;
//             }
//             const columnAndValues = sabha.map(singleSab => ({
//                 'id': singleSab.sabha_id,
//                 'sabha_id': singleSab.sabha_id,
//                 'sabha_name': singleSab.sabha_name,
//                 'sabha_date': singleSab.sabha_date,
//                 'from_time': singleSab.from_time,
//                 'to_time': singleSab.to_time,
//                 'haribhagat_id': singleSab.haribhagat_id
//             }));
//                 done(null, columnAndValues);
            
//         });
//     }
// }
// Used to create state

const getSabha = async (data, done) => {
    try {
        const { page = 1, limit = 10, sort_order = 'asc', sort_key = '' } = data;
        const pageLimit = parseInt(limit);
        const pageNumber = parseInt(page);
        const sortOrder = sort_order === 'desc' ? -1 : 1;

        const sort = {};
        if (['sabha_id', 'sabha_name', 'sabha_date'].includes(sort_key)) {
            sort[sort_key] = sortOrder;
        } else {
            sort.sabha_id = sortOrder;
        }

        const sabhas = await Sabha.find()
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit)
            .sort(sort);

        const totalHaribhagats = await Haribhagat.distinct('haribhagat_id');
        const totalRecords = await Sabha.count();
        const sortedSabhas = await Sabha.find().sort({ sabha_id: -1 }).limit(2);

        const sabhaAnalysis = sabhas.map(sabha => {
            const attendanceMap = new Map();
            const allAttendees = new Set();

            // Extract attendees for the last two sabhas
            const lastTwoSabhasAttendees = sortedSabhas.map(sabha => new Set(sabha.attendees));
    
            // Find attendees that are present in both sabhas
            const attendeesInBothSabhas = [...lastTwoSabhasAttendees[0]].filter(id =>
                lastTwoSabhasAttendees[1].has(id)
            );
            // Process attendees for the current sabha
            sabha.attendees.forEach(haribhagatId => {
                allAttendees.add(haribhagatId);
                attendanceMap.set(
                    haribhagatId,
                    (attendanceMap.get(haribhagatId) || 0) + 1
                );
            });

            // Haribhagats who attended two or more sabhas in this sabha
            const multipleSabhasHaribhagats = Array.from(attendanceMap.entries())
                .filter(([_, count]) => count >= 2)
                .map(([id]) => id);

            // Haribhagats who were absent from this sabha
            const absentHaribhagats = totalHaribhagats.filter(
                id => !allAttendees.has(id.toString())
            );

            return {
                sabha_id: sabha.sabha_id,
                sabha_name: sabha.sabha_name,
                sabha_date: sabha.sabha_date,
                totalHaribhagats: totalHaribhagats.length,
                totalPresent: allAttendees.size,
                totalAbsent: absentHaribhagats.length,
                multipleSabhasHaribhagats,
                attendeesInBothSabhas,
                totalMultipleSabhas: multipleSabhasHaribhagats.length,
            };
        });

        const result = sabhas.map(sabha => ({
            sabha_id: sabha.sabha_id,
            sabha_name: sabha.sabha_name,
            sabha_date: sabha.sabha_date,
            from_time: sabha.from_time,
            to_time: sabha.to_time,
            attendees: sabha.attendees.length,
        }));
        console.log("data---------",result)
        return done(null, {
            success: true,
            data: result,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / pageLimit),
                currentPage: pageNumber,
            },
            analysis: sabhaAnalysis,
        });
    } catch (error) {
        return done({
            code: 500,
            message: "Error fetching Sabhas or analyzing attendance",
            error: error.message,
        }, null);
    }
};


const createSabha =  function (requestParam, done) {
    console.log("Request Param:", requestParam);
	query.insertSingle(dbConstants.dbSchema.sabha, requestParam, function (error, sabha) {
        if (error) {
            console.error('Error: can not create sabha',error);
            console.log('Error Details:', error.errmsg)
            done(error, null);
            return;
        }
        
        done(null, sabha);
    });
	
};

const getHaribhagatSabh1 = async (data, done) => {
    try {
        const { page = 1, limit = 10, sabha_id, search = '' } = data;

        // Parse limit and page to integer
        const pageLimit = parseInt(limit);
        const pageNumber = parseInt(page);

        // Build the search query based on the provided fields
        const searchQuery = {
            $or: [
                { surname: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { middle_name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ]
        };

        // Fetch paginated haribhagats
        const haribhagats = await Haribhagat.find(searchQuery)
            .skip((pageNumber - 1) * pageLimit)
            .limit(pageLimit);

        // Fetch sabha details if sabha_id is provided
        let attendeesInSabha = [];
        if (sabha_id) {
            const sabha = await Sabha.findOne({ sabha_id });
            if (!sabha) {
                return done({
                    code: 404,
                    message: 'No sabha found with this ID',
                }, null);
            }
            attendeesInSabha = sabha.attendees; // List of haribhagat_ids in sabha attendees
        }

        // Add the flag to each haribhagat indicating if they are in the sabha attendees
        const result = haribhagats.map(haribhagat => ({
            ...haribhagat.toObject(),
            isAttending: attendeesInSabha.includes(haribhagat.haribhagat_id) // Flag if haribhagat_id is in the attendees list
        }));

        // Get total count for pagination info
        const totalRecords = await Haribhagat.countDocuments(searchQuery);

        // Return response using done format
        return done(null, {
            success: true,
            data: result,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / pageLimit),
                currentPage: pageNumber
            }
        });
    } catch (error) {
        // Return error through the done format
        return done({
            code: 500,
            message: "Error fetching Haribhagats",
            error: error.message
        }, null);
    }
};
// const getHaribhagatSabha = async (data, done) => {
//     try {
//         const { page = 1, limit = 10, sabha_id, search = '' } = data;

//         const pageLimit = parseInt(limit);
//         const pageNumber = parseInt(page);

//         const searchQuery = {
//             $or: [
//                 { surname: { $regex: search, $options: 'i' } },
//                 { first_name: { $regex: search, $options: 'i' } },
//                 { middle_name: { $regex: search, $options: 'i' } },
//                 { mobile: { $regex: search, $options: 'i' } }
//             ]
//         };

//         const haribhagats = await Haribhagat.find(searchQuery)
//             .skip((pageNumber - 1) * pageLimit)
//             .limit(pageLimit);

//         let attendeesInSabha = [];
//         if (sabha_id) {
//             const sabha = await Sabha.findOne({ sabha_id });
//             if (!sabha) {
//                 return done({
//                     code: 404,
//                     message: 'No sabha found with this ID',
//                 }, null);
//             }
//             attendeesInSabha = sabha.attendees;
//         }

//         const result = haribhagats.map(haribhagat => ({
//             ...haribhagat.toObject(),
//             isAttending: attendeesInSabha.includes(haribhagat.haribhagat_id)
//         }));

//         // Alternative count method
//         const totalRecords = await Haribhagat.count(searchQuery);

//         return done(null, {
//             data: result,
//             pagination: {
//                 totalRecords,
//                 totalPages: Math.ceil(totalRecords / pageLimit),
//                 currentPage: pageNumber
//             }
//         });
//     } catch (error) {
//         return done({
//             code: 500,
//             message: "Error fetching Haribhagats",
//             error: error.message
//         }, null);
//     }
// };


//         const { haribhagat_id, sabha_id } = req.body;

//         // Ensure that haribhagat_id is a valid ObjectId
//         if (!mongoose.Types.ObjectId.isValid(haribhagat_id)) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Invalid attendee ID' 
//             });
//         }

//         // Ensure sabha_id is valid if it's supposed to be an ObjectId (check schema)
//         if (!mongoose.Types.ObjectId.isValid(sabha_id)) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: 'Invalid sabha ID' 
//             });
//         }

//         // Convert haribhagat_id to ObjectId for proper comparison
//         const haribhagatObjId = mongoose.Types.ObjectId(haribhagat_id);

//         // Find the sabha by sabha_id
//         const sabha = await Sabha.findById(sabha_id);

//         if (!sabha) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No sabha found with this ID'
//             });
//         }

//         // Check if the haribhagat_id is already in the attendees array
//         const isAttending = sabha.attendees.some(
//             attendee => attendee.equals(haribhagatObjId) // Use .equals for ObjectId comparison
//         );

//         let update;
//         if (isAttending) {
//             // If haribhagat_id is already in attendees, remove it (unmark attendance)
//             update = { $pull: { attendees: haribhagatObjId } };
//         } else {
//             // If haribhagat_id is not in attendees, add it (mark attendance)
//             update = { $addToSet: { attendees: haribhagatObjId } }; // $addToSet ensures no duplicates
//         }

//         // Update the sabha document with the respective operation
//         const result = await Sabha.updateOne(
//             { _id: mongoose.Types.ObjectId(sabha_id) },
//             update
//         );

//         if (result.nModified === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No sabha found with this ID or no changes made'
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: isAttending 
//                 ? "Attendance unmarked successfully" 
//                 : "Attendance marked successfully"
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Error marking attendance",
//             error: error.message
//         });
//     }
// };

const getHaribhagatSabha = async (data, done) => {
    try {
        let  { page = 1, limit = 10, sabha_id, search = '', sort_order = 'asc', sort_key = 'haribhagat_id', only_present = false } = data;
        console.log(sabha_id);
      
        let sabha;
        if(sabha_id == 'null'){
            console.log("No sabha found for today.", sabha_id);
            const today = new Date();
            sabha = await Sabha.findOne({
                sabha_date: {
                    $gte: new Date(today.setHours(0, 0, 0, 0)), // Set the time to midnight
                    $lt: new Date(today.setHours(23, 59, 59, 999)) // Set the time to 23:59:59 for today
                }
            });
          
            if (!sabha) {
                console.log("No sabha found for today.");
                // Handle the case when no sabha is found for today
                return done({
                    code: 200,
                    message: 'No sabha found for today.',
                }, null);
            }
            console.log("Fetched sabha for today:", sabha.sabha_id);
            
            // Set sabha_id to the value from the fetched sabha
            sabha_id = sabha.sabha_id;
        }

        const pageLimit = parseInt(limit);
        const pageNumber = parseInt(page);
        const sortOrder = sort_order === 'desc' ? -1 : 1;

        const searchQuery = {
            $or: [
                { haribhagat_id: { $regex: search, $options: 'i' } },
                { surname: { $regex: search, $options: 'i' } },
                { first_name: { $regex: search, $options: 'i' } },
                { middle_name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ]
        };
        searchQuery.is_memeber_of_sahajanadi_sabha = true;
        searchQuery.is_verified = true;

        // Handle sorting
        const sort = {};
        if (sort_key === 'haribhagat_id') {
            // Ensure haribhagat_id is sorted as a number
            sort.haribhagat_id_numeric = sortOrder; // Use numeric sort for haribhagat_id
        } else if (['surname', 'first_name', 'middle_name', 'mobile'].includes(sort_key)) {
            sort[sort_key] = sortOrder; // Alphanumeric sorting for other fields
        } else {
            sort.haribhagat_id_numeric = sortOrder; // Default sorting by haribhagat_id as a number
        }

        // console.log("Sorting by:", sort);
        const haribhagats = only_present == 'true' ? await Haribhagat.aggregate([
            { $match: searchQuery },
            {
                $addFields: {
                    haribhagat_id_numeric: { $toInt: "$haribhagat_id" } // Convert haribhagat_id to number for sorting
                }
            },
            { $sort: sort }, // Apply the sorting option
            // { $skip: (pageNumber - 1) * pageLimit },
            // { $limit: pageLimit }
        ]) : await Haribhagat.aggregate([
            { $match: searchQuery },
            {
                $addFields: {
                    haribhagat_id_numeric: { $toInt: "$haribhagat_id" } // Convert haribhagat_id to number for sorting
                }
            },
            { $sort: sort }, // Apply the sorting option
            { $skip: (pageNumber - 1) * pageLimit },
            { $limit: pageLimit }
        ]);

        // Check if any records are returned
        if (!haribhagats || haribhagats.length === 0) {
            return done({
                code: 404,
                message: 'No records found.'
            }, null);
        }

        let attendeesInSabha = [];
        if (sabha_id) {
            const sabha = await Sabha.findOne({ sabha_id });
            if (!sabha) {
                return done({
                    code: 404,
                    message: 'No sabha found with this ID',
                }, null);
            }
            attendeesInSabha = sabha.attendees;
        }

        // Map the results to include isAttending
        const result = haribhagats.map(haribhagat => ({
            ...haribhagat, // No need for toObject()
            isAttending: attendeesInSabha.includes(haribhagat.haribhagat_id)
        }));

        // Sort the result array by isAttending
        result.sort((a, b) => {
            if (a.isAttending === b.isAttending) return 0;
            return a.isAttending ? -1 : 1; // true (isAttending) comes before false
        });
        const attendees = result.filter(haribhagat => haribhagat.isAttending === true);

        const totalRecords = await Haribhagat.count(searchQuery); // Use countDocuments instead of count
        // console.log(result.length);
        // console.log("only_present--------",only_present);
        return done(null, {
            data: only_present == 'true' ? attendees : result,
            pagination: {
                totalRecords: only_present == 'true' ? attendees.length : totalRecords,
                totalPages: only_present == 'true' ? 1 : Math.ceil(totalRecords / pageLimit),
                currentPage: only_present == 'true' ? 1 : pageNumber,
                totalPresent: attendeesInSabha.length
            },
            sabha_id:sabha_id
        });

    } catch (error) {
        console.log("error--------", error);
        
        return done({
            code: 500,
            message: "Error fetching Haribhagats",
            error: error.message
        }, null);
    }
};



const addAttendeeToSabha1 = async (data, done) => {
    try {
        const { haribhagat_id, sabha_id } = data;

        // Ensure that haribhagat_id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(haribhagat_id)) {
            return done({
                code: 400,
                message: 'Invalid attendee ID',
            }, null);
        }

        // Ensure sabha_id is valid if it's supposed to be an ObjectId (check schema)
        if (!mongoose.Types.ObjectId.isValid(sabha_id)) {
            return done({
                code: 400,
                message: 'Invalid sabha ID',
            }, null);
        }

        // Convert haribhagat_id to ObjectId for proper comparison
        const haribhagatObjId = mongoose.Types.ObjectId(haribhagat_id);

        // Find the sabha by sabha_id
        const sabha = await Sabha.findById(sabha_id);

        if (!sabha) {
            return done({
                code: 404,
                message: 'No sabha found with this ID',
            }, null);
        }

        // Check if the haribhagat_id is already in the attendees array
        const isAttending = sabha.attendees.some(
            attendee => attendee.equals(haribhagatObjId) // Use .equals for ObjectId comparison
        );

        let update;
        if (isAttending) {
            // If haribhagat_id is already in attendees, remove it (unmark attendance)
            update = { $pull: { attendees: haribhagatObjId } };
        } else {
            // If haribhagat_id is not in attendees, add it (mark attendance)
            update = { $addToSet: { attendees: haribhagatObjId } }; // $addToSet ensures no duplicates
        }

        // Update the sabha document with the respective operation
        const result = await Sabha.updateOne(
            { _id: mongoose.Types.ObjectId(sabha_id) },
            update
        );

        if (result.nModified === 0) {
            return done({
                code: 404,
                message: 'No sabha found with this ID or no changes made',
            }, null);
        }

        // Return success based on whether the haribhagat was added or removed
        return done(null, {
            success: true,
            message: isAttending 
                ? "Attendance unmarked successfully" 
                : "Attendance marked successfully"
        });
    } catch (error) {
        // Return error through the done
        return done({
            code: 500,
            message: "Error marking attendance",
            error: error.message
        }, null);
    }
};

const addAttendeeToSabha = async (data, done) => {
    console.log("data", data);
    try {
        const { haribhagat_id, sabha_id } = data;

        // Ensure that sabha_id is valid (if any validation is needed)
        if (!sabha_id || typeof sabha_id !== 'string') {
            return done({
                code: 400,
                message: 'Invalid sabha ID',
            }, null);
        }

        // Find the sabha by sabha_id
        const sabha = await Sabha.findOne({ sabha_id });

        if (!sabha) {
            return done({
                code: 404,
                message: 'No sabha found with this ID',
            }, null);
        }

        // Clean up the attendees array by removing any haribhagat_id that no longer exists in the database
        const validAttendees = [];
        for (const id of sabha.attendees) {
            const haribhagat = await Haribhagat.findOne({ haribhagat_id: id });
            if (haribhagat) {
                validAttendees.push(id);
            }
        }
        console.log("validattendees",validAttendees)
        // Update the sabha's attendees array with only valid haribhagat_ids
        await Sabha.updateOne(
            { sabha_id },
            { $set: { attendees: validAttendees } }
        );

        // Check if haribhagat exists in the database
        const haribhagat = await Haribhagat.findOne({ haribhagat_id });

        let update;

        if (!haribhagat) {
            // Haribhagat not found in the database, still add to attendees
            console.log(`Warning: Haribhagat with ID ${haribhagat_id} not found in database, but adding to attendees.`);
            update = { $addToSet: { attendees: haribhagat_id } };
        } else {
            // Haribhagat found, check if already attending
            const isAttending = sabha.attendees.includes(haribhagat_id);

            if (isAttending) {
                // If haribhagat_id is already in attendees, remove it (unmark attendance)
                update = { $pull: { attendees: haribhagat_id } };
            } else {
                // If haribhagat_id is not in attendees, add it (mark attendance)
                update = { $addToSet: { attendees: haribhagat_id } }; // $addToSet ensures no duplicates
            }
        }

        // Update the sabha document with the respective operation
        const result = await Sabha.updateOne(
            { sabha_id },
            update
        );
        console.log("result",result)
        if (result.nModified === 0) {
            return done({
                code: 404,
                message: 'No sabha found with this ID or no changes made',
            }, null);
        }

        // After the update, retrieve the updated sabha with sorted attendees
        const updatedSabha = await Sabha.findOne({ sabha_id }).lean();

        // Sort the attendees array (assuming sorting by haribhagat_id in ascending order)
        updatedSabha.attendees.sort((a, b) => a.localeCompare(b));

        // Return success based on whether the haribhagat was added or removed
        return done(null, {
            success: true,
            message: haribhagat ? 
                (sabha.attendees.includes(haribhagat_id) ? "Attendance unmarked successfully" : "Attendance marked successfully") : 
                "Attendance marked successfully (Haribhagat not found in the database)"
        });
    } catch (error) {
        // Return error through the done
        return done({
            code: 500,
            message: "Error marking attendance",
            error: error.message
        }, null);
    }
};
const getSabhaCount1 = async (data) => {
    try {
      const { start_date, end_date } = data;
  
      const dateFilter = {};
      if (start_date && end_date) {
        dateFilter.sabha_date = {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        };
      }
  
      // Aggregate Sabha data by date and count attendees
      const sabhaCount = await Sabha.aggregate([
        { $match: dateFilter }, // Match sabhas within the given date range
        {
          $unwind: "$attendees", // Deconstruct the attendees array to process each attendee
        },
        {
          $group: {
            _id: "$attendees", // Group by attendee ID
            attendedCount: { $sum: 1 }, // Count the number of sabhas attended by each Haribhagat
          },
        },
        {
          $group: {
            _id: "$attendedCount", // Group by the number of sabhas attended
            haribhagatCount: { $sum: 1 }, // Count the number of Haribhagats in each attendance group
          },
        },
        {
          $sort: { _id: -1 }, // Sort by the number of sabhas attended in descending order
        },
      ]);
      const totalHaribhagats = await Haribhagat.count();
      const totalAttendees = sabhaCount.reduce((sum, record) => sum + record.haribhagatCount, 0);
        const nonAttendees = totalHaribhagats - totalAttendees;
      console.log("sabhacount",nonAttendees)
      console.log("sabhacount",totalHaribhagats)
      const combinedResult = { ...sabhaCount , nonAttendees};
        console.log("sabhacount",combinedResult)
      return {
        success: true,
        data: combinedResult
      };
    } catch (error) {
      throw {
        code: 500,
        message: "Error fetching Sabha count",
        error: error.message,
      };
    }
  };
  const getSabhaCount = async (data) => {
    try {
        const { start_date, end_date } = data;

        const dateFilter = {};
        if (start_date && end_date) {
            dateFilter.sabha_date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            };
        }

        // Aggregate Sabha data by date and count attendees
        const sabhaCount = await Sabha.aggregate([
            { $match: dateFilter }, // Match sabhas within the given date range
            { $unwind: "$attendees" }, // Deconstruct the attendees array to process each attendee
            {
                $group: {
                    _id: "$attendees", // Group by attendee ID
                    attendedCount: { $sum: 1 }, // Count the number of sabhas attended by each Haribhagat
                },
            },
            {
                $group: {
                    _id: "$attendedCount", // Group by the number of sabhas attended
                    haribhagatCount: { $sum: 1 }, // Count the number of Haribhagats in each attendance group
                    haribhagatIds: { $push: "$_id" }, // Add the Haribhagat IDs to an array
                },
            },
            { $sort: { _id: -1 } }, // Sort by the number of sabhas attended in descending order
        ]);

        // Get the list of all verified Haribhagats who are members of Sahajanadi Sabha
        const allHaribhagats = await Haribhagat.aggregate([
              {
                "$match": {
                  "is_memeber_of_sahajanadi_sabha": true,
                  "is_verified": true
                }
              },
              {
                "$project": {
                  "haribhagat_id": 1
                }
              }
            
          ]);
        // console.log("sabhacount--0-allHaribhagats", allHaribhagats);
        const allHaribhagatIds = allHaribhagats.map((haribhagat) => haribhagat.haribhagat_id);

        // console.log("sabhacount--1-allHaribhagatIds", allHaribhagatIds);
        // Flatten the list of attendees' IDs
        const attendedHaribhagatIds = sabhaCount.reduce((acc, record) => {
            return acc.concat(record.haribhagatIds);
        }, []);
        // console.log("sabhacount---attendedHaribhagatIds---qqq", attendedHaribhagatIds);
        // Find non-attendees by subtracting attended IDs from the total IDs
        const nonAttendeesIds = allHaribhagatIds.filter(
            (id) => !attendedHaribhagatIds.includes(id)
        );
 
        // Count only Haribhagats who are members of Sahajanadi Sabha
        const totalHaribhagats = allHaribhagats.length;
        const totalAttendees = sabhaCount.reduce((sum, record) => sum + record.haribhagatCount, 0);
        const nonAttendees = totalHaribhagats - totalAttendees;

        // console.log("sabhacount---nonAttendeesIds", nonAttendeesIds);
        // console.log("sabhacount---nonAttendees", nonAttendees);

        // Combine results
        const combinedResult = { sabhaCount, nonAttendees, nonAttendeesIds };
        // console.log("sabhacount", combinedResult);

        return {
            success: true,
            data: combinedResult,
        };
    } catch (error) {
        throw {
            code: 500,
            message: "Error fetching Sabha count",
            error: error.message,
        };
    }
};


const getSabhaCountPDF = async (data) => {
    try {
        const { start_date, end_date, gender} = data;

        const dateFilter = {};
        if (start_date && end_date) {
            dateFilter.sabha_date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            };
        }

        // Aggregate Sabha data by date, gender, and count attendees
        const sabhaCount1 = await Sabha.aggregate([
            { $match: dateFilter }, // Match sabhas within the given date range
            { $unwind: "$attendees" }, // Deconstruct the attendees array to process each attendee
            {
                $lookup: {
                    from: "haribhagats", // Collection name for Haribhagats
                    localField: "attendees", // The attendee ID in the current pipeline
                    foreignField: "haribhagat_id", // Field in Haribhagat collection
                    as: "haribhagatDetails", // Output field for joined data
                },
            },
            {
                $unwind: "$haribhagatDetails", // Flatten Haribhagat details
            },
            {
                $match: {
                    "haribhagatDetails.gender": gender, // Filter for female attendees
                },
            },
            {
                $group: {
                    _id: "$attendees", // Group by attendee ID
                    attendedCount: { $sum: 1 }, // Count the number of sabhas attended by each Haribhagat
                    haribhagatDetails: { $first: "$haribhagatDetails" },
                },
            },
            {
                $group: {
                    _id: "$attendedCount", // Group by the number of sabhas attended
                    haribhagatCount: { $sum: 1 }, // Count the number of Haribhagats in each attendance group
                    haribhagatDetails: {
                        $push: {
                            haribhagat_id: "$haribhagatDetails.haribhagat_id",
                            first_name: "$haribhagatDetails.first_name",
                            middle_name: "$haribhagatDetails.middle_name",
                            surname: "$haribhagatDetails.surname",
                            mobile: "$haribhagatDetails.mobile",
                        },
                    },
                },
            },
            { $sort: { _id: -1 } }, // Sort by the number of sabhas attended in descending order
        ]);

        // Get the list of all verified female Haribhagats who are members of Sahajanadi Sabha
        const allHaribhagats = await Haribhagat.find({
            is_memeber_of_sahajanadi_sabha: true,
            is_verified: true,
            gender: gender, // Filter for female Haribhagats
        }).select("haribhagat_id first_name middle_name surname mobile");

        const allHaribhagatIds = allHaribhagats.map(
            (haribhagat) => haribhagat.haribhagat_id
        );

        const attendedHaribhagatIds = sabhaCount1.reduce((acc, record) => {
            const ids = record.haribhagatDetails.map(
                (detail) => detail.haribhagat_id
            );
            return acc.concat(ids);
        }, []);

        // Find non-attendees by subtracting attended IDs from the total IDs
        const nonAttendeesIds = allHaribhagatIds.filter(
            (id) => !attendedHaribhagatIds.includes(id)
        );

        const nonAttendeesHaribhagats = allHaribhagats.filter((haribhagat) =>
            nonAttendeesIds.includes(haribhagat.haribhagat_id)
        );

        const formatToAMPM = (hour) => {
            const timeString = moment().format('YYYY-MM-DD') + ' ' + hour + ':00';
            const momentDate = moment(timeString, 'YYYY-MM-DD HH:mm');
            if (!momentDate.isValid()) {
                return "Invalid time";
            }
            return momentDate.format('hh:mm A');
        };

        const query = {};
        if (start_date && end_date) {
            query.sabha_date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            };
        } else if (start_date) {
            query.sabha_date = { $gte: new Date(start_date) };
        } else if (end_date) {
            query.sabha_date = { $lte: new Date(end_date) };
        }

        const sabhas = await Sabha.find(query).sort({ sabha_id: 1 });

        const response = sabhas.map(sabha => ({
            sabha_id: sabha.sabha_id,
            sabha_name: sabha.sabha_name,
            sabha_date: sabha.sabha_date,
            from_time: formatToAMPM(sabha.from_time),
            to_time: formatToAMPM(sabha.to_time),
            attendees: sabha.attendees.length,
        }));

        // Combine results
        const combinedResult = { nonAttendeesHaribhagats, sabhaCount1, sabha: response, start_date, end_date ,gender: gender=="Female"?"મહિલા":"પુરૂષ"};

        return {
            success: true,
            data: combinedResult,
        };
    } catch (error) {
        throw {
            code: 500,
            message: "Error fetching Sabha count",
            error: error.message,
        };
    }
};

// 1 pan sabhana aaviya hoy but current sabhama hoy teva
// [
//     {
//       $sort: {
//         sabha_date: -1
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         latestSabha: {
//           $first: "$$ROOT"
//         },
//         otherSabhas: {
//           $push: "$$ROOT"
//         }
//       }
//     },
//     {
//       $project: {
//         latestAttendees: "$latestSabha.attendees",
//         allOtherAttendees: {
//           $reduce: {
//             input: "$otherSabhas",
//             initialValue: [],
//             in: {
//               $concatArrays: [
//                 "$$value",
//                 {
//                   $cond: [
//                     {
//                       $ne: [
//                         "$$this.sabha_date",
//                         "$latestSabha.sabha_date"
//                       ]
//                     },
//                     "$$this.attendees",
//                     []
//                   ]
//                 }
//               ]
//             }
//           }
//         }
//       }
//     },
//     {
//       $project: {
//         uniqueLatestAttendees: {
//           $filter: {
//             input: "$latestAttendees",
//             as: "attendee",
//             cond: {
//               $not: {
//                 $in: [
//                   "$$attendee",
//                   "$allOtherAttendees"
//                 ]
//               }
//             }
//           }
//         }
//       }
//     }
//   ]

const deleteSabha = async function (sabhaDetails, done) {
    console.log("Sabha Details:", sabhaDetails);
    try {
        // Iterate over each sabha_id
        for (const sabhaId of sabhaDetails) {
            // Fetch the sabha details from the database
            const sabha = await query.selectWithAndOnePromise(
                dbConstants.dbSchema.sabha, 
                { sabha_id: sabhaId }, 
                { _id: 0, sabha_attachment: 1 }
            );
            console.log("Sabha:", sabha);

        }

        // Proceed to delete the sabhas from the database
        query.removeMultiple(
            dbConstants.dbSchema.sabha, 
            { 'sabha_id': { $in: sabhaDetails } }, 
            function (error, sabha) {
                if (error) {
                    console.error('Error: Cannot delete sabha');
                    logger('Error: Cannot delete sabha');
                    done(error, null);
                    return;
                }
                console.log("Deleted Sabha:", sabha);
                done(null, sabha);
            }
        );
    } catch (error) {
        console.error('Error deleting sabha:', error);
        logger('Error: Cannot delete sabha');
        done(error, null);
    }
};

const updateSabha = async (requestParam, req, done) => {
    if (!requestParam.sabha_id) {
        done(errors.missingParameter("sabha_id"), null);
        return;
    }
    let columnAndValues = {};
    console.log("req",requestParam)
    // Check if sabha_name is provided in the request
    if (requestParam.sabha_id) {
        columnAndValues['$or'] = [{
            sabha_id: requestParam.sabha_id,
        }];
    }

    // Select and check if the sabha already exists in the database
    query.selectWithAndOne(dbConstants.dbSchema.sabha, {
        $and: [{
            $or: [{
                sabha_id: {
                    $ne: requestParam.sabha_id, // Exclude current sabha_id
                },
            }],
        },
            columnAndValues,
        ],
    }, async (error, isSabhaExist) => {
        console.log("---isSabhaExist", isSabhaExist);
        
        if (error) {
            logger('Error: can not get', dbConstants.dbSchema.sabha);
            done(errors.internalServer(true), null);
            return;
        }
        
        // If sabha already exists
        if (isSabhaExist && !_.isEmpty(columnAndValues)) {
            done(errors.duplicateSabha(true), null);
            return;
        } else {
            // Update sabha data in the database
            query.updateSingle(dbConstants.dbSchema.sabha, requestParam, { sabha_id: requestParam.sabha_id }, function (error, sabha) {
                if (error) {
                    logger('Error: can not update sabha');
                    done(error, null);
                    return;
                }

                done(null, sabha);
            });
        }
    });
};



module.exports = {
    getSabha:getSabha,
    updateSabha:updateSabha,
    deleteSabha:deleteSabha,
    getSabhaCountPDF:getSabhaCountPDF,
    createSabha:createSabha,
    getSabhaCount:getSabhaCount,
    addAttendeeToSabha:addAttendeeToSabha,
    getHaribhagatSabha:getHaribhagatSabha,
};
'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const sabhaHandlers = require('./../model_handlers/sabha-handlers');
const async = require('async');
const haribhagatHandler = require('../model_handlers/haribhagat-handler');


// Create city in the database.

router.post('/create-sabha', function (req, res) {
	console.log("req-----",req.body)
	if (!_.has(req.body, 'sabha_id')) {
		logger('Parameter Missing : can not create sabha');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	// console.log("req.body",req.body);
	sabhaHandlers.createSabha(req.body,function (error, sabha) {
		
		if (error) {
			console.log('error',error);
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), sabha);
	});
});

// router.post('/attendance', async (req, res) => {
// 	if (!_.has(req.body, 'haribhagat_id')) {
// 		logger('Parameter Missing : can not create sabha');
// 		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
// 		return;
// 	}
//     sabhaHandlers.addAttendeeToSabha(req.body,function (error, sabha) {
// 		console.log("-error-",error)
// 		if (error) {
// 			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
// 			return;
// 		}
// 		jsonResponse(res, responseCodes.OK, errors.noError(), sabha);
// 	});
// });

router.get('/get-haribhagat-by-sabhaid', function(req, res) {
    console.log("req-----", req.query);

    // Ensure required parameters are present
    if (!_.has(req.query, 'page') || !_.has(req.query, 'limit')) {
        logger('Parameter Missing: Page and Limit are required');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }

    // Call the handler to get Haribhagat list with pagination
    sabhaHandlers.getHaribhagatSabha(req.query, function (error, result) {
        // console.log("get-haribhagat result", result);

        if (error) {
            console.log('error', error);
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }

        // Respond with success if no error occurs
        jsonResponse(res, responseCodes.OK, errors.noError(), result);
    });
});

router.get('/get-sabha-count', async (req, res) => {
	try {
	 if(req.query.printPdf){
		const result = await sabhaHandlers.getSabhaCountPDF(req.query);
		res.set('Content-Type', 'application/pdf');
		res.set('Content-Disposition', 'attachment; filename="haribhagat_list.pdf"');
		await haribhagatHandler.tableviewHaribhagatPDFForSabha(result.data, res); 
		// res.json(result);
	 }else{
		const result = await sabhaHandlers.getSabhaCount(req.query);
		res.json(result);
	 }	
	 

	} catch (error) {
	  res.status(error.code || 500).json({
		success: false,
		message: error.message,
		error: error.error
	  });
	}
  });  

router.post('/attendance', function (req, res) {
    console.log("req-----", req.body);

    // Check if the required parameter 'haribhagat_id' is present
    if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'sabha_id')) {
        logger('Parameter Missing: haribhagat_id is required');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    // Call the handler to add an attendee to the sabha
    sabhaHandlers.addAttendeeToSabha(req.body, function (error, sabha) {
        console.log("req.body", sabha);

        if (error) {
            console.log('error', error);
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }

        // Respond with success if no error occurs
        jsonResponse(res, responseCodes.OK, errors.noError(), sabha);
    });
});

// update sabha data

router.post('/update-sabha', function (req, res) {
	console.log("req-----",req.body)
	if (!_.has(req.body, 'haribhagat_id')) {
		logger('Parameter Missing : can not create sabha');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	sabhaHandlers.addAttendeeToSabha(req.body,function (error, sabha) {
		console.log("req.body",sabha);
		
		if (error) {
			console.log('error',error);
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), sabha);
	});
});

// Get city in the database.

router.post('/get-sabha', function (req, res) {
	sabhaHandlers.getSabha(req.query,function (error, sabha) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), sabha);
	});
});

router.post('/delete-sabha', function(req, res) {
	sabhaHandlers.deleteSabha(req.body, function(error, consumer) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
	});
});

router.post('/updates-sabha', function(req, res) {
	console.log("req",req)
    sabhaHandlers.updateSabha(req.body, req, function(error, sabha) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), sabha);
    });
});

router.post('/search-sabha', function (req, res) {
	sabhaHandlers.searchSabha(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

module.exports = router;
'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const cityHandler = require('./../model_handlers/city-handler');
const moment = require('moment');
const async = require('async');

/**
 * Create city in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-city', function (req, res) {
	if (!_.has(req.body, 'name')) {
		logger('Parameter Missing : can not create city');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	cityHandler.createCity(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});


/**
 * Get city in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-city', function (req, res) {
	cityHandler.getCity(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * Get state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-state', function (req, res) {
	cityHandler.getState(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});



/**
 * Update city in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-city', function (req, res) {
	cityHandler.updateCity(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * active city in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/active-city', function (req, res) {
	cityHandler.activeCity(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * inactive city in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/inactive-city', function (req, res) {
	cityHandler.inactiveCity(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * delete city in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete-city', function (req, res) {
	cityHandler.deleteCity(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});



module.exports = router;
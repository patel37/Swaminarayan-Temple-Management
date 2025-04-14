'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const countryHandler = require('./../model_handlers/country-handler');
const moment = require('moment');
const async = require('async');

/**
 * Create country in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-country', function (req, res) {
	if (!_.has(req.body, 'name')) {
		logger('Parameter Missing : can not create country');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	countryHandler.createCountry(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});


/**
 * Get country in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-country', function (req, res) {
	countryHandler.getCountry(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});


/**
 * Update country in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-country', function (req, res) {
	countryHandler.updateCountry(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});

/**
 * active country in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/active-country', function (req, res) {
	countryHandler.activeCountry(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});

/**
 * inactive country in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/inactive-country', function (req, res) {
	countryHandler.inactiveCountry(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});

/**
 * delete country in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete-country', function (req, res) {
	countryHandler.deleteCountry(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});
/**
 * Get country flag and code in the database.
 *
 * The request body should include the name
 */
router.post('/get-country-info', function (req, res) {
	countryHandler.getCountryInfo(req.body,function (error, country) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), country);
	});
});


module.exports = router;
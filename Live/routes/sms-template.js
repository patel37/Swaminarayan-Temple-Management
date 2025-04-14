'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const smsHandler = require('./../model_handlers/sms-template-handler');
const moment = require('moment');
const async = require('async');



/**
 * Create cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-sms-template', function (req, res) {
	if (!_.has(req.body, 'code')) {
        logger('Parameter Missing : code not passed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
	smsHandler.createSmsTemplate(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});


/**
 * Get cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-sms-template', function (req, res) {

	smsHandler.getSmsTemplate(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});
 
 
/**
 * Update cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-sms-template', function (req, res) {
	smsHandler.updateSmsTemplate(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});



/**
 * delete cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete-sms-template', function (req, res) {
	smsHandler.deleteSmsTemplate(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});

/**
 * delete cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/status-change', function (req, res) {
	smsHandler.statusChange(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});



module.exports = router;
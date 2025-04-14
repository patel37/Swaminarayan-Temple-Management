'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const emailTemplate = require('./../model_handlers/email-template-handler');
const moment = require('moment');
const async = require('async');



/**
 * Create cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-email-template', function (req, res) {
	if (!_.has(req.body, 'code')) {
        logger('Parameter Missing : code not passed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
	emailTemplate.createEmailTemplate(req.body,function (error, pushnotification) {
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
router.post('/get-email-template', function (req, res) {

	emailTemplate.getEmailTemplate(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		console.log(pushnotification)
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});
 
 
/**
 * Update cms in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-email-template', function (req, res) {
	emailTemplate.updateEmailTemplate(req.body,function (error, pushnotification) {
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
router.post('/delete-email-template', function (req, res) {
	emailTemplate.deleteEmailTemplate(req.body,function (error, pushnotification) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), pushnotification);
	});
});



module.exports = router;
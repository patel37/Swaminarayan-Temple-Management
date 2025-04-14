'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const mailHandler = require('./../model_handlers/mail-handler');
const moment = require('moment');
const async = require('async');

/**
 * Create mail in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-email-template', function (req, res) {
	mailHandler.createEmailTemplate(req.body,function (error, mail) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), mail);
	});
});


/**
 * Get mail in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-email-template', function (req, res) {
	mailHandler.getEmailTemplate(req.body,function (error, mail) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), mail);
	});
});


/**
 * Update mail in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-email-template', function (req, res) {
	mailHandler.updateEmailTemplate(req.body,function (error, mail) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), mail);
	});
});

/**
 * delete mail in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete-email-template', function (req, res) {
	mailHandler.deleteEmailTemplate(req.body,function (error, mail) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), mail);
	});
});



module.exports = router;
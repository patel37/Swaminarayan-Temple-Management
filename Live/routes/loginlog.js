'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const loginlogHandler = require('./../model_handlers/loginlog-handler');
const moment = require('moment');
const async = require('async');


/**
 * get login logs from the database.
 *
 * Using get method
 */
router.post('/get-loginlog', function (req, res) {
	loginlogHandler.getLoginlog(req.body,function (error, loginlogs) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), loginlogs);
	});
});

/**
 * delete login logs from the database.
 *
 * Using post method
 */
router.post('/delete-loginlog', function (req, res) {
	loginlogHandler.deleteLoginlog(req.body,function (error, loginlogs) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), loginlogs);
	});
});


module.exports = router;
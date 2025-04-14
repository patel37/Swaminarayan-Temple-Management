'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const stateHandler = require('./../model_handlers/state-handler');
const moment = require('moment');
const async = require('async');

/**
 * Create state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-state', function (req, res) {
	if (!_.has(req.body, 'name')) {
		logger('Parameter Missing : can not create state');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	stateHandler.createState(req.body,function (error, state) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), state);
	});
});


/**
 * Get state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-state', function (req, res) {
	stateHandler.getState(req.body,function (error, state) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), state);
	});
});


/**
 * Update state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-state', function (req, res) {
	stateHandler.updateState(req.body,function (error, state) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), state);
	});
});

/**
 * active state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/active-state', function (req, res) {
	stateHandler.activeState(req.body,function (error, state) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), state);
	});
});

/**
 * inactive state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/inactive-state', function (req, res) {
	stateHandler.inactiveState(req.body,function (error, state) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), state);
	});
});

/**
 * delete state in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete-state', function (req, res) {
	stateHandler.deleteState(req.body,function (error, state) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), state);
	});
});



module.exports = router;
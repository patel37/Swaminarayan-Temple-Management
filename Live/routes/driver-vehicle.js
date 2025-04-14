'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const driverVehicleHandler = require('./../model_handlers/admin-vehicle-handler');

/**
 * Get Admin Vehicle from database.
 *
 * The request body should include the name , username , password
 */
router.post('/get', function (req, res) {
	if (!_.has(req.body, 'admin_id')) {
		logger('Parameter Missing : can not create city');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	driverVehicleHandler.get(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * Add Admin Vehicle in database.
 *
 * The request body should include the name , username , password
 */
router.post('/add', function (req, res) {
	if (!_.has(req.body, 'admin_id')) {
		logger('Parameter Missing : can not create city');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	driverVehicleHandler.add(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * Update Admin Vehicle from database.
 *
 * The request body should include the name , username , password
 */
router.post('/update', function (req, res) {
	if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'vehicle_id')) {
		logger('Parameter Missing : can not create city');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	driverVehicleHandler.update(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * Delete Admin Vehicle from database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete', function (req, res) {
	if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'vehicle_id')) {
		logger('Parameter Missing : can not create city');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	driverVehicleHandler.deleteVehicle(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

/**
 * Delete Admin Vehicle from database.
 *
 * The request body should include the name , username , password
 */
router.post('/set-default', function (req, res) {
	if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'vehicle_id')) {
		logger('Parameter Missing : can not create city');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	driverVehicleHandler.setDefault(req.body,function (error, city) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), city);
	});
});

module.exports = router;
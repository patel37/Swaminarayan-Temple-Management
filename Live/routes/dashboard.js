'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const dashboardHandler = require('./../model_handlers/dashboard-handler');
const moment = require('moment');
const async = require('async');



/**
 * Get Data of haribhagats,providers,vehicles,jobs from the database.
 *
 * Using get method
 */
router.get('/get-data', function (req, res) {
	dashboardHandler.getData(req.body,function (error, data) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), data);
	});
});

/**
 * Get Data of haribhagats,providers,vehicles,jobs from the database.
 *
 * Using get method
 */
router.get('/get-data-monthly', function (req, res) {
	dashboardHandler.getDataMonthWise(req.body,function (error, data) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), data);
	});
});


/**
 * Get Daily credits of admins from the database.
 *
 * Using get method
 */
router.get('/get-daily-credits', function (req, res) {
	dashboardHandler.getDailyCredit(req.body,function (error, data) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), data);
	});
});

/**
 * get-rating-revenue of admins from the database.
 *
 * Using get method
 */
router.get('/get-rating-revenue', function (req, res) {
	dashboardHandler.getRatingRevenue(req.body,function (error, data) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), data);
	});
});

/**
 * get-rating-revenue of admins from the database.
 *
 * Using get method
 */
router.post('/trip-commission-statistics', function (req, res) {
	dashboardHandler.commision(req.body,function (error, data) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), data);
	});
});

/**
 * get-rating-revenue of admins from the database.
 *
 * Using get method
 */
router.post('/mapbox-admin-dashboard', function (req, res) {
	dashboardHandler.mapboxDriverDashboard(req.body,function (error, data) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), data);
	});
});

module.exports = router;

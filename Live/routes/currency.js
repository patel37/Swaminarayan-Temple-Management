'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const currencyHandler = require('./../model_handlers/currency-handler');
const moment = require('moment');
const async = require('async');

/**
 * Create currency in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-currency', function (req, res) {
	if (!_.has(req.body, 'title') || !_.has(req.body, 'code')) {
		logger('Parameter Missing : can not create currency');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	currencyHandler.createCurrency(req.body,function (error, currency) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), currency);
	});
});


/**
 * get currency in the database.
 *
 * using get method
 */
router.post('/get-currency', function (req, res) {
	currencyHandler.getCurrency(req.body,function (error, currency) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), currency);
	});
});


/**
 * active currency in the database.
 *
 * using post method
 */
router.post('/active-currency', function (req, res) {
	currencyHandler.activeCurrency(req.body,function (error, currency) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), currency);
	});
});


/**
 * inactive currency in the database.
 *
 * using post method
 */
router.post('/inactive-currency', function (req, res) {
	currencyHandler.inactiveCurrency(req.body,function (error, currency) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), currency);
	});
});


/**
 * delete currency in the database.
 *
 * using post method
 */
router.post('/delete-currency', function (req, res) {
	currencyHandler.deleteCurrency(req.body,function (error, currency) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), currency);
	});
});


/**
 * update currency in the database.
 *
 * using post method
 */
router.post('/update-currency', function (req, res) {
	currencyHandler.updateCurrency(req.body,function (error, currency) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), currency);
	});
});


module.exports = router;
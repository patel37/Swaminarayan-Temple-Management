'use strict';

const responseCodes = require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const settingHandler = require('./../model_handlers/setting-handler');
const moment = require('moment');
const async = require('async');


/**
 * Get setting data from the database.
 *
 * Using get method
 */
router.post('/get-setting', function(req, res) {
    settingHandler.getSetting(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});


/**
 * create contact url from the database.
 *
 * Using post method with request param
 */
router.post('/update-setting', function(req, res) {
    settingHandler.updateSetting(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});

/**
 * for reset password
 *
 * Using post method with request param
 */
router.post('/reset-password', function(req, res) {

    settingHandler.resetPassword(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        res.send(url);
        //jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});

/**
 * For send notification to admin schedule ride
 *
 * Using post method with request param
 */
router.get('/send-notification-schedule-trip', function(req, res) {
    settingHandler.notificationScheduleTirp(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});


/**
 * For send notification to admin schedule ride
 *
 * Using post method with request param
 */
router.get('/not-accept-trip', function(req, res) {
    settingHandler.notAcceptTripCron(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});

router.get('/not-accept-shedule-trip', function(req, res) {
    settingHandler.notAcceptSheduleTripCron(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});

/**
 * change payment method
 *
 * Using post method with request param
 */
router.post('/payment-type', function(req, res) {
    settingHandler.paymentType(req.body, function(error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        res.send(url);
    });
});

router.post('/payment-type-list', function (req, res) {
    settingHandler.paymentTypeList(req.body, function (error, url) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), url);
    });
});

module.exports = router;
'use strict';

const responseCodes = require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const commonHandler = require('./../model_handlers/common-handler');
const moment = require('moment');
const async = require('async');

/*
 * Get contact us
 *
 * Request parameters : app_user_id, user_type,question
 *
 * Using post method
 */
router.post('/get-notification-log', (req, res) => {
    commonHandler.getNotificationLog(req.body, req, (error, notification) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), notification);
    });
});

/**
 * delete notification Log in the database.
 *
 * using post method
 */
router.post('/delete-notification-log', function(req, res) {
    commonHandler.deleteNotificationLog(req.body, function(error, country) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), country);
    });
});

/*
 * Get contact us
 *
 * Request parameters : app_user_id, user_type,question
 *
 * Using post method
 */
router.post('/get-feedback', (req, res) => {
    commonHandler.getFeedback(req.body, req, (error, contactUS) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), contactUS);
    });
});

/**
 * delete feedback-us in the database.
 *
 * using post method
 */
router.post('/delete-feedback', function(req, res) {
    commonHandler.deleteFeedback(req.body, function(error, country) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), country);
    });
});

/*
 * Get contact us
 *
 * Request parameters : app_user_id, user_type,question
 *
 * Using post method
 */
router.post('/get-contact-us', (req, res) => {
    commonHandler.getContactUs(req.body, req, (error, contactUS) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), contactUS);
    });
});

/**
 * delete contact-us in the database.
 *
 * using post method
 */
router.post('/delete-contact-us', function(req, res) {
    commonHandler.deleteContactUS(req.body, function(error, country) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), country);
    });
});

/**
 * create contact-us in the database.
 *
 * using post method
 */
router.post('/contact-us', function(req, res) {

    commonHandler.contactUS(req.body, function(error, country) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), country);
    });
});


/**
 * Upload Image on AWS server
 * Common function for all type of image upload on server
 * Gaurav Patel
 */
router.post('/upload-image', function(req, res) {
    commonHandler.uploadImage(req.files.photo, req.body, function(error, image) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), image);
    });
});

/**
 * get rating and review for consumer in the database.
 *
 * using post method
 */
router.post('/get-rating-review-consumer', function(req, res) {
    commonHandler.getRatingReviewConsumer(req.body, function(error, country) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), country);
    });
});

/**
 * Upload Image on AWS server
 * Common function for all type of image upload on server
 * Gaurav Patel
 */
router.post('/notification', function(req, res) {
    if (!_.has(req.body, 'type') || !_.has(req.body, 'user_id')) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.notification(req.body, function(error, image) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), image);
    });
});

/**
 * Get package from DB
 * Get all package for buy
 * Gaurav Patel
 */
router.post('/package', function(req, res) {
    commonHandler.packageList(req.body, function(error, image) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), image);
    });
});



/**
 * Logout User
 * Use to logout user
 * Gaurav Patel
 */
router.post('/logout', function(req, res) {
    if (!_.has(req.body, 'type') || !_.has(req.body, 'user_id')) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.logout(req.body, function(error, image) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), image);
    });
});


/**
 * verify-coupon
 * Use to Verify Coupon
 * Gaurav Patel
 */
router.post('/verify-coupon', function(req, res) {
    if (!_.has(req.body, 'coupon_code')) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.verifyCoupon(req.body, function(error, image) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), image);
    });
});

/**
 * remove-coupon
 * Use to remove applied Coupon code
 * Baluram Kumavat
 */

router.post('/remove-coupon', function (req, res) {
    if (!_.has(req.body, 'coupon_code')) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.removeCoupon(req.body, function (error, image) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), image);
    });
});
/*
 * Get contact us
 *
 * Request parameters : app_user_id, user_type,question
 *
 * Using post method
 */


router.post('/get-additional-charge-type', (req, res) => {
    commonHandler.getAdditionalCharge(req.body, (error, notification) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), notification);
    });
});

/**
 * get-suggestion-amount-list
 * Use to get suggestion amount ;ist
 * Meet Aghera
 * 1 july 2019
 */

router.get('/get-suggestion-amount-list', async(req, res) => {
    try {
        let response = await commonHandler.getSuggestionAmount(req.query)
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        } catch (error) {
            logger('Parameter Missing : can not create trip');
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
            return;
        }
    }
})

router.post('/delete-rating', function(req, res) {
    commonHandler.deleteRatingReview(req.body, (error, response) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

/**
 * list payment types
 *
 * using post method
 */
router.post('/list-payment-types', (req, res) => {
    commonHandler.listPaymentTypes(req.body, (error, response) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

/**
 * list payment types
 *
 * using post method
 */
router.post('/send-transfer-request', (req, res) => {
    commonHandler.sendTransferRequests(req.body, (error, response) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

/**
 * list withdraw in the database.
 *
 */
router.post('/list-withdraw', function(req, res) {
    commonHandler.listWithdraw(req.body, function(error, job) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), job);
    });
});

router.post('/list-withdraw-api', function(req, res) {
    if (!req.body.admin_id || !req.body.date) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.listWithdrawAPI(req.body, function(error, job) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), job);
    });
});


router.post('/strip-list-withdraw-api', function(req, res) {
    if (!req.body.admin_id || !req.body.date) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.striplistWithdrawAPI(req.body, function(error, job) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), job);
    });
});
/**
 * change status of withdraw in the database.
 *
 */
router.post('/change-withdraw-status', function(req, res) {
    commonHandler.changeWithdrawStatus(req.body, function(error, job) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), job);
    });
});

/*
 * send otp
 *
 * Request parameters : mobile, mobile_country_code
 *
 * Using post method
 */
router.post('/send-otp', (req, res) => {
    if (!(req.body.user_type == 'consumer' || req.body.user_type == 'admin') || !_.has(req.body, 'user_id') || !_.has(req.body, 'mobile') || !_.has(req.body, 'mobile_country_code') || !_.has(req.body, 'language_id')) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.sendOtp(req.body, (error, notification) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), notification);
    });
});

/*
 * verify Otp
 *
 * Request parameters : mobile, mobile_country_code
 *
 * Using post method
 */
router.post('/verify-otp', (req, res) => {
    if (!(req.body.user_type == 'consumer' || req.body.user_type == 'admin') || !_.has(req.body, 'user_id') || !_.has(req.body, 'otp') || !_.has(req.body, 'mobile') || !_.has(req.body, 'mobile_country_code')) {
        logger('Parameter Missing : can not create trip');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    commonHandler.verifyOtp(req.body, (error, notification) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), notification);
    });
});

/**
 * Get Archived Data from database
 *
 * The request body should include type = admin/consumer
 */
router.post('/get-archived-data', function(req, res) {
    commonHandler.getArchivedData(req.body, function(error, email) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), email);
    });
});

/**
 * Delete Data Haribhagat Permanently and all relational data
 * 
 */
router.post('/delete-consumer-data-permanently', async(req, res) => {
    try {
        let response = await commonHandler.deleteConsumerDataPermanently(req.body)
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true), null);
        }

    }

});

/**
 * Delete Data Admin Permanently and all relational data
 * 
 */
router.post('/delete-admin-data-permanently', async(req, res) => {
    try {
        let response = await commonHandler.deleteDriverDataPermanently(req.body)
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true), null);
        }

    }

});

router.post("/insert-csv", async (req, res) => {
  try {
    let response = await commonHandler.readCSV(req.body);
    jsonResponse(res, responseCodes.OK, errors.noError(), response);
  } catch (error) {
    try {
      jsonResponse(
        res,
        error.code,
        errors.formatErrorForWire(error),
        null
      );
      return;
    } catch (error) {
      jsonResponse(
        res,
        responseCodes.InternalServer,
        errors.internalServer(true),
        null
      );
      return;
    }
  }
});

router.post("/genarate-google-map-image", async (req, res) => {
    try {
        let response = await commonHandler.generateImageFromMap(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            jsonResponse(
                res,
                error.code,
                errors.formatErrorForWire(error),
                null
            );
            return;
        } catch (error) {
            jsonResponse(
                res,
                responseCodes.InternalServer,
                errors.internalServer(true),
                null
            );
            return;
        }
    }
});

router.post('/webhook', function(req, res) {
    commonHandler.webHook(req.body.data, function(error, email) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), email);
    });
});

router.post('/checkWavePaymentStatus', function(req, res) {
    commonHandler.checkWavePaymentStatus(req.body, function(error, email) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), email);
    });
});
module.exports = router;
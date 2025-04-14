'use strict';

const responseCodes = require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const roleHandler = require('./../model_handlers/role-handler');

/**
 * Create role in the database.
 *
 * The request body should include the title(mandatory)
 */
router.post('/create-role', function(req, res) {
    if (!_.has(req.body, 'title')) {
        logger('Parameter Missing : can not create role');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    roleHandler.createRole(req.body, function(error, roles) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), roles);
    });
});



//get role by id
router.post('/get-roles', function(req, res) {
    roleHandler.getRoles(req.body, req, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});


/**
 * Update role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-role', function(req, res) {
    roleHandler.updateRole(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});

/**
 * active role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/active-role', function(req, res) {
    roleHandler.activeRole(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }

        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});

/**
 * inactive role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/inactive-role', function(req, res) {
    roleHandler.inactiveRole(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});

/**
 * delete role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/delete-role', function(req, res) {
    roleHandler.deleteRole(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});

/**
 * delete role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-access-rights', function(req, res) {
    roleHandler.getAccessRight(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});

/**
 * delete role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-access-rights-show', function(req, res) {
    roleHandler.getAccessRightShow(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});

/**
 * delete role in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/update-access-rights', function(req, res) {
    roleHandler.updateAccessRight(req.body, function(error, role) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), role);
    });
});


module.exports = router;
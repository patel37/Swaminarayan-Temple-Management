'use strict';

const responseCodes = require('./../helpers/response-codes');
const logger = require('../utils/logger');
const jsonResponse = require('../utils/json-response');
const errors = require('../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const config = require('../config');
const tokenHandler = require('../model_handlers/token-handler')


/*
Name : generateToken
Purpose : used to get item with category
Original Author : Meet Aghera
Created At : 13th Jun 2019
*/

router.post('/generate-token', async(req, res) => {
    // console.log(req)
    try {
        if (!req.body.user_id) {
            logger('Parameter Missing');
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
            return;
        }
        let response = await tokenHandler.generateAuthToken(req.body)
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            console.log("2222",error)
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            console.log("1111",error)
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true), null);
        }
    }
});


module.exports = router
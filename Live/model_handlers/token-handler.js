'use strict';
const config = require('./../config');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
// const commonFunction = require('./../utils/common-function');
let async = require('async');
let _ = require('underscore');
const token = require('./../utils/token');
const to = require("await-to-js").default;
const logger = require('./../utils/logger');

const authenticate = async(req, res, done) => {
    let code = await token.verifyToken({ token: token.fetchToken(req) });
    // console.log(code);
    if (code == 200) {
        done(null, code);
    } else {
        //console.log('nope')
        badRequest(code, req, res, done);
    }
};

const badRequest = (code, req, res, done) => {
    if (code == 412) {
        let obj = { "error": { "name": "InvalidToken", "message": "Token is invalid", "code": 412 }, "payload": null, "status": "412" };
        jsonResponse(res, obj.error.code, errors.formatErrorForWire(obj.error), null);
    }

    if (code == 509) {
        let obj = { "error": { "name": "NoAccess", "message": "No access.", "code": 509 }, "payload": null, "status": "509" };
        jsonResponse(res, obj.error.code, errors.formatErrorForWire(obj.error), null);
    }
     if(code == 404){

        let obj = { "error": { "name": "Access token or user id not found", "message": "Access token or user id not found.", "code": 404}, "payload": null, "status": "404"}
    jsonResponse(res, obj.error.code, errors.formatErrorForWire(obj.error), null);
    }
};

const generateAuthToken = (requestParam) => {
    console.log("requestParam",requestParam)
    if(requestParam.is_super == true){
        return new Promise(async(resolve, reject) => {
            console.log("In Super")
            let access_token = token.generateToken({ user_id: requestParam.user_id });
            resolve(access_token)
            // retu
        })
    } else {
        return new Promise(async(resolve, reject) => {
            let error1, error2, error3, adminUser, consumer, admin;
                    
                    [error1, consumer] = await to(checkStatusAndIsExists(dbConstants.dbSchema.haribhagats, {
                        haribhagat_id: requestParam.user_id
                    }, {}));
                    [error2, adminUser] = await to(checkStatusAndIsExists(dbConstants.dbSchema.admins, {
                        id: requestParam.user_id
                    }, {}));
                    [error3, admin] = await to(checkStatusAndIsExists(dbConstants.dbSchema.administrators, {
                        admin_id: requestParam.user_id
                    }, {}));

                    // console.log("2222",consumer)
                    if (error1 && error2 && error3) {
                       reject(errors.customError('User id not found', 404, 'Not exist', true))
                    }
            let access_token = token.generateToken({ user_id: requestParam.user_id });
            resolve(access_token)
            // retu
        })
    }
};

const checkStatusAndIsExists = (collection, matchColumnAndValues, selectColumnAndValues) => {
    return new Promise((resolve, reject) => {
        query.selectWithAndOneMod(collection, matchColumnAndValues, selectColumnAndValues, (error, response) => {
            if (error) {
                logger('Error : Can not get')
                reject(errors.internalServer(true))
                return
            }
            if (!response) {
                logger('Error: resource not found')
                reject(errors.resourceNotFound(true))
                return
            }
            if (response.status == 'inactive') {
                logger('Error: user not found')
                reject(errors.notActivate(true))
                return
            } else {
                resolve(response)
                return;
            }

        })
    })
}

module.exports = {
    badRequest,
    authenticate,
    generateAuthToken,
    checkStatusAndIsExists
};
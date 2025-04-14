'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const adminConstants = require('./../constants/admin-constants');
const mailConstants = require('./../constants/mail-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Administrator = require('./../models/administrator');
const Loginlog = require('./../models/administrator');
const passwordHandler = require('./../utils/password-handler');
const fs = require('file-system');
const config = require('./../config');
const requestIp = require('request-ip');
const moment = require('moment');
var ip = require('ip');
const commonHandler = require('./common-handler');
const replaceOnce = require('replace-once');
const { formatString } = require('./../utils/stringGenerator');
const urlExists = require('url-exists');
//SES
const AWS = require('aws-sdk');
const { each } = require('underscore');
AWS.config.update({
    accessKeyId: config.aws.keyId,
    secretAccessKey: config.aws.key,
    region: config.aws.sesRegion
});
const awsSES = new AWS.SES({ apiVersion: '2010-12-01' });
//ses

/*
 * Used to authenticate consumer
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const authentication = function (requestParam, req, done) {
    requestParam = JSON.parse(JSON.stringify(requestParam))
    const comparisonColumnsAndValues = {
        email: requestParam.email
    };
    getAdminPost(comparisonColumnsAndValues, (err, rows) => {
        logger('result getting admin: error:', err);
        if (err) {
            logger("Error getting admin" + err);
            done(errors.internalServer(true), null);
        }
        if (!rows || rows.length === 0) {
            console.log("in")
            if (requestParam.email == config.SUPER_ADMIN_EMAIL && requestParam.password == config.SUPER_ADMIN_PASSWORD) {
                console.log("in")
                query.selectWithAndOne(dbConstants.dbSchema.roles, { role_id: config.ROLE_ID }, (error, role) => {
                    if (error) {
                        logger("Error while finding Role details")
                        done(null, "Invalid")
                        return

                    }
                    if (!role) {
                        logger("Role not found")
                        done(null, "Invalid")
                        return
                    }
                    let resultObj = {
                        // "role_id": config.ROLE_ID,
                        "first_name": config.ADMIN_FIRST_NAME,
                        "last_name": config.ADMIN_LAST_NAME,
                        "email": config.SUPER_ADMIN_EMAIL,
                        "profile_picture": "",
                        "status": "Active",
                    }
                    done(null, resultObj)
                    return

                })
            } else {
                done(null, "Invalid");
                return
            }

        } else {
            passwordHandler.verify(requestParam.password, rows[0].password, (adminObj) => {
                if (adminObj == false) {

                    done(null, "Invalid");
                    return
                } else {
                    let clientIp = requestIp.getClientIp(req);
                    const inserRecord = {
                        email: rows[0].email,
                        name: rows[0].first_name + ' ' + rows[0].last_name,
                        type: 'Admin',
                        login_id: rows[0].admin_id,
                        ip: ip.address()
                        //ip:clientIp
                    };
                    query.insertSingle(dbConstants.dbSchema.loginlogs, inserRecord, function (error, user) {
                        if (error) {
                            logger('Error: can not create user');
                            done(error, null);
                            return;
                        }
                        rows[0] = JSON.parse(JSON.stringify(rows[0]));
                        rows[0].loginlog_id = user.loginlog_id;
                        done(null, rows[0]);
                    });
                }
            });
        }
    });
};


/*
 * Used to reset password of administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const forgotpassword = function (requestParam, req, done) {
    query.selectWithAndOne(dbConstants.dbSchema.administrators, { email: requestParam.email }, function (error, admin) {
        if (error) {
            logger('Error: can not sent email to admin');
            done(error, null);
            return;
        }
        if (admin) {
            if (admin.status == adminConstants.status.active) {
                const length = 6;
                const code = 'ADM' + Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
                let fullUrl = req.protocol + '://' + req.get('host').split(":")[0];
                const link = fullUrl + '/resetpassword.html?code=' + code;
                let emailTemplate;
                query.selectWithAndOne(dbConstants.dbSchema.email_templates, { code: 'FP' }, (error, template) => {
                    if (error) {
                        logger('Error: can not get email template.');
                        done(errors.internalServer(true), null);
                        return;
                    }
                    emailTemplate = template.description[requestParam.code];
                    emailTemplate = emailTemplate.replace('#NAME#', admin.first_name + " " + admin.last_name);
                    emailTemplate = emailTemplate.replace("#LINK#", link);
                    /*const mailgun = require('mailgun-js')({
                        apiKey: config.mailgunInfo.api_key,
                        domain: config.mailgunInfo.domain
                    });*/
                    const data = {
                        from: template.from_email,
                        to: requestParam.email,
                        subject: template.email_subject,
                        html: emailTemplate
                    };
                    const params = {
                        Destination: {
                            ToAddresses: [data.to]
                        },
                        Message: {
                            Body: {
                                Html: {
                                    Charset: 'UTF-8',
                                    Data: data.html
                                }
                            },
                            Subject: {
                                Charset: 'UTF-8',
                                Data: data.subject
                            }
                        },
                        ReturnPath: data.from,
                        Source: data.from,
                    };

                    commonHandler.sendEmailToUser(data, (err, data) => {
                        if (err) {
                            console.log(err, err.stack);
                            done(errors.cannotSendEmail(true), null);
                            return;
                        } else {
                            let columnAndValuesUpdate = {
                                code: code
                            }
                            query.updateSingle(dbConstants.dbSchema.administrators, columnAndValuesUpdate, {
                                admin_id: admin.admin_id
                            }, (error) => {
                                done(null, 'success');
                            });
                        }
                        //done(null, {});
                        return;
                    })

                    // awsSES.sendEmail(params, (err, data) => {
                    //     if (err) {
                    //         console.log(err, err.stack);
                    //     } else {
                    //         let columnAndValuesUpdate = {
                    //             code: code
                    //         }
                    //         query.updateSingle(dbConstants.dbSchema.administrators, columnAndValuesUpdate, {
                    //             admin_id: admin.admin_id
                    //         }, (error) => {
                    //             done(null, 'success');
                    //         });
                    //     }
                    //     //done(null, {});
                    //     return;
                    // });
                    /*mailgun.messages().send(data, (error, body) => {
                        let columnAndValuesUpdate = {
                            code: code
                        }
                        query.updateSingle(dbConstants.dbSchema.administrators, columnAndValuesUpdate, {
                            admin_id: admin.admin_id
                        }, (error) => {
                            done(null, 'success');
                        });
                    });*/

                });
            } else {
                done(null, '1');
            }
        } else {
            done(null, '0');
        }
    });
};


/*
 * Retrieves the details of get haribhagats
 *
 * @param {Object} comparisonColumnsAndValues
 * @param {Function} Callback with params {error, rows}
 */
const getAdminPost = (comparisonColumnsAndValues, done) => {
    query.selectWithAnd(dbConstants.dbSchema.administrators, comparisonColumnsAndValues, function (error, administrators) {
        if (error) {
            logger('Error: can not get administrators', dbConstants.dbSchema.administrators);
            done(error, null);
            return;
        }
        done(null, administrators);
    });
};


/*
 * Used to get administrators with params
 * @param {Function} done - Callback function with error, data params
 */
const getAdministrator = function (requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.administrators, function (error, administrators) {
        if (error) {
            logger('Error: can not get administrator', dbConstants.dbSchema.administrators);
            done(error, null);
            return;
        }
        _.each(administrators, function (data) {
            data.email = data.email;
        })
        done(null, administrators);
    });
};

/*
 * Used to create administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
//const createAdministrator = function(requestParam, done) {
const createAdministrator = async (req, requestParam, done) => {
    console.log(requestParam);
    passwordHandler.newHash(requestParam.password, (hashedPW) => {
        requestParam.password = hashedPW;
    });
    if (req.files) {
        if (req.files.profile_picture) {
            requestParam.profile_picture = await new Promise((resolve, reject) => {
                commonHandler.newUploadFileObj(req.files.profile_picture, 'administrator', (error, path) => {
                    resolve(path)
                });
            })
        }
    }
    let result = await query.selectWithAndOnePromise(dbConstants.dbSchema.administrators, { email: requestParam.email }, { _id: 0, admin_id: 1, email: 1, role_id: 1 });
    if (result) {
        done(errors.duplicateEmail(true), null);
        return;
    } else {
        let data = await query.selectWithAndOnePromise(dbConstants.dbSchema.administrators, { role_id: requestParam.role_id }, { _id: 0, admin_id: 1, email: 1, role_id: 1 });
        if (data) {
            let getRole = await query.selectWithAndOnePromise(dbConstants.dbSchema.roles, { role_id: data.role_id }, { _id: 0, title: 1, role_id: 1 });
            if (getRole) {
                if (getRole.title === "Administrator") {
                    done(errors.administratorExist(true), null);
                    return;
                } else {
                    query.insertSingle(dbConstants.dbSchema.administrators, requestParam, function (error, administrator) {
                        if (error) {
                            logger('Error: can not create administrator');
                            done(error, null);
                            return;
                        }
                        done(null, administrator);
                    });
                }
            }
        } else {
            query.insertSingle(dbConstants.dbSchema.administrators, requestParam, function (error, administrator) {
                if (error) {
                    logger('Error: can not create administrator');
                    done(error, null);
                    return;
                }
                done(null, administrator);
            });
        }


    }

};


/*
 * Used to edit administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const editAdministrator = function (requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.administrators, requestParam, async function (error, administrators) {
        if (error) {
            logger('Error: can not get administrator', dbConstants.dbSchema.administrators);
            done(error, null);
            return;
        }
        administrators = JSON.parse(JSON.stringify(administrators))
        each(administrators, (singleData) => {
            singleData.profile_picture = singleData.profile_picture ? singleData.profile_picture : ""
            
        })
        done(null, administrators);
    });
};

/*
 * Used to get multiple administrators
 * @param {requestParam} - Object - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createMultipleAdministrator = function (requestParam, done) {
    query.insertMultiple(dbConstants.dbSchema.administrators, requestParam, function (error, administrator) {
        if (error) {
            logger('Error: can not create administrator');
            done(error, null);
            return;
        }
        done(null, administrator);
    });
};

/*
 * Used to update administrator by id 
 * @param {userDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateAdministrator = async function (userDetails, done) {
    let data = await query.selectWithAndOnePromise(dbConstants.dbSchema.administrators, { role_id: userDetails.role_id }, { _id: 0, admin_id: 1, email: 1, role_id: 1 });
    if (data) {
        let getRole = await query.selectWithAndOnePromise(dbConstants.dbSchema.roles, { role_id: data.role_id }, { _id: 0, title: 1, role_id: 1 });
        if (getRole) {
            if (getRole.title === "Administrator" && userDetails.email != data.email) {
                done(errors.administratorExist(true), null);
                return;
            } else {
                query.updateSingle(dbConstants.dbSchema.administrators, userDetails, { admin_id: userDetails.admin_id }, function (error, administrator) {
                    if (error) {
                        logger('Error: can not update administrator');
                        done(error, null);
                        return;
                    }
                    done(null, administrator);
                });
            }
        }
    } else {
        query.updateSingle(dbConstants.dbSchema.administrators, userDetails, { admin_id: userDetails.admin_id }, function (error, administrator) {
            if (error) {
                logger('Error: can not update administrator');
                done(error, null);
                return;
            }
            done(null, administrator);
        });
    }
};

/*
 * Used to active administrator by id 
 * @param {adminDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeAdministrator = function (adminDetails, done) {
    let columnsToUpdate = {
        status: adminConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.administrators, columnsToUpdate, { 'admin_id': { $in: adminDetails } }, function (error, administrator) {
        if (error) {
            logger('Error: can not update administrator');
            done(error, null);
            return;
        }
        done(null, administrator);
    });
};

/*
 * Used to inactive administrator by id 
 * @param {userDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveAdministrator = function (adminDetails, done) {
    let columnsToUpdate = {
        status: adminConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.administrators, columnsToUpdate, { 'admin_id': { $in: adminDetails } }, function (error, administrator) {
        if (error) {
            logger('Error: can not update administrator');
            done(error, null);
            return;
        }
        done(null, administrator);
    });
};

/*
 * Used to delete administrator by id 
 * @param {adminDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteAdministrator = function (adminDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.administrators, { 'admin_id': { $in: adminDetails } }, function (error, administrator) {
        if (error) {
            logger('Error: can not update administrator');
            done(error, null);
            return;
        }
        done(null, administrator);
    });
};

/*
 * Used to update user by id
 * @param {userDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const logoutUser = function (userDetails, done) {
    userDetails['logout_date'] = moment();
    query.updateSingle(dbConstants.dbSchema.loginlogs, userDetails, {
        loginlog_id: userDetails.loginlog_id
    }, function (error, user) {
        if (error) {
            logger('Error: can not update user');
            done(error, null);
            return;
        }
        done(null, user);
    });
};

/*
 * Used to authenticate consumer
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const authenticationNew = function (requestParam, req, done) {
    let fullUrl = req.protocol + '://' + req.get('host').split(":")[0];
    requestParam = JSON.parse(JSON.stringify(requestParam))
    console.log(requestParam)
    const comparisonColumnsAndValues = {
        email: requestParam.email
    };
    getAdminPost(comparisonColumnsAndValues, (err, rows) => {
        logger('result getting admin: error:', err);
        if (err) {
            logger("Error getting admin" + err);
            done(errors.internalServer(true), null);
        }
        if (!rows || rows.length === 0) {
            console.log("in")
            if (requestParam.email == config.SUPER_ADMIN_EMAIL && requestParam.password == config.SUPER_ADMIN_PASSWORD) {
                console.log("in")
                query.selectWithAndOne(dbConstants.dbSchema.roles, { role_id: config.ROLE_ID }, (error, role) => {
                    if (error) {
                        logger("Error while finding Role details")
                        done(null, "Invalid")
                        return

                    }
                    if (!role) {
                        logger("Role not found")
                        done(null, "Invalid")
                        return
                    }
                    // let clientIp = requestIp.getClientIp(req);
                    const inserRecord = {
                        email: config.SUPER_ADMIN_EMAIL,
                        name: config.ADMIN_FIRST_NAME + ' ' + config.ADMIN_LAST_NAME,
                        type: 'Admin',
                        login_id: config.ADMIN_ID,
                        ip: ip.address()
                        //ip:clientIp
                    };
                    // rows[0].profile_picture = exists ? rows[0].profile_picture : `${fullUrl}${adminConstants.placeholder.admin}`,
                        query.insertSingle(dbConstants.dbSchema.loginlogs, inserRecord, function (error, user) {
                            if (error) {
                                logger('Error: can not create user');
                                done(error, null);
                                return;
                            }
                            let resultObj = {
                                // "role_id": config.ROLE_ID,
                                "first_name": config.ADMIN_FIRST_NAME,
                                "last_name": config.ADMIN_LAST_NAME,
                                "email": config.SUPER_ADMIN_EMAIL,
                                "admin_id": config.ADMIN_ID,
                                "profile_picture": `${fullUrl}${adminConstants.placeholder.admin}`,
                                "status": "Active",
                                "is_super": true,
                                "loginlog_id": user.loginlog_id
                            }
                            console.log(resultObj)
                            done(null, resultObj)
                            return
                        });

                })
            } else {
                done(null, "Invalid");
                return
            }

        } else {
            passwordHandler.verify(requestParam.password, rows[0].password, (adminObj) => {
                if (adminObj == false) {
                    done(null, "Invalid");
                    return
                } else {
                    console.log("---admin---login");
                    query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
                        code: 'OTP',
                    }, (error, template) => {
                        if (error) {
                            done(errors.internalServer(true), null);
                            return;
                        }

                        if (!template) {
                            logger("Email Templet not found ")
                            done(errors.internalServer(true), null);
                            return;
                        }
                        const otp = Math.floor(Math.random() * 8999 + 1000);
                        let emailDescription = (template.description['EN']);
                        let findArr = ['#NAME#', '#OTP#'];
                        let replaceArr = [rows[0].first_name + " " + rows[0].last_name, otp];
                        let emailSubject = template.email_subject;
                        const data = {
                            from: template.from_email,
                            to: requestParam.email,
                            subject: emailSubject,
                            html: (findArr.length > 0) ? replaceOnce(emailDescription, findArr, replaceArr, 'gi') : emailDescription,
                        };
                        /*console.log(config.mailgunInfo.domain)
                        const mailgun = require('mailgun-js')({
                            apiKey: config.mailgunInfo.api_key,
                            domain: config.mailgunInfo.domain
                        });
                        mailgun.messages().send(data, (error, body) => {
                            console.log(error);
                            if (error) {
                                done(errors.internalServer(true), null);
                                return;
                            }
                            query.updateSingle(dbConstants.dbSchema.administrators, { otp: otp }, {
                                admin_id: rows[0].admin_id
                            }, (error) => {
                                done(null, rows[0]);
                            });
                        });*/
                        const params = {
                            Destination: {
                                ToAddresses: [data.to]
                            },
                            Message: {
                                Body: {
                                    Html: {
                                        Charset: 'UTF-8',
                                        Data: data.html
                                    }
                                },
                                Subject: {
                                    Charset: 'UTF-8',
                                    Data: data.subject
                                }
                            },
                            ReturnPath: data.from,
                            Source: data.from,
                        };
                        console.log("=============================")

                        commonHandler.sendEmailToUser(data, (err, data) => {
                            if (err) {
                                console.log(err, err.stack);
                            } else {
                                query.updateSingle(dbConstants.dbSchema.administrators, { otp: otp }, {
                                    admin_id: rows[0].admin_id
                                }, (error) => {
                                    const inserRecord = {
                                        email: rows[0].email,
                                        name: rows[0].first_name + ' ' + rows[0].last_name,
                                        type: 'Admin',
                                        login_id: rows[0].admin_id,
                                        ip: ip.address()
                                        //ip:clientIp
                                    };
                                        query.insertSingle(dbConstants.dbSchema.loginlogs, inserRecord, function (error, user) {
                                            if (error) {
                                                logger('Error: can not create user');
                                                done(error, null);
                                                return;
                                            }
                                            rows[0] = JSON.parse(JSON.stringify(rows[0]));
                                            rows[0].loginlog_id = user.loginlog_id;
                                            rows[0].profile_picture = rows[0].profile_picture ? rows[0].profile_picture : `${fullUrl}${adminConstants.placeholder.admin}`;
                                            done(null, rows[0]);
                                            return
                                        })
                                });
                            }
                        })
                    })
                }
            });
        }
    });
};

/*
 * Used to  verify authenticate consumer
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const verifyAuthenticationOTP = function (requestParam, req, done) {
    let fullUrl = req.protocol + '://' + req.get('host').split(":")[0];
    requestParam = JSON.parse(JSON.stringify(requestParam))
    console.log(requestParam)
    const comparisonColumnsAndValues = {
        email: requestParam.email
    };
    getAdminPost(comparisonColumnsAndValues, (err, rows) => {
        logger('result getting admin: error:', err);
        if (err) {
            logger("Error getting admin" + err);
            done(errors.internalServer(true), null);
        }
        if (!rows || rows.length === 0) {
            logger("Error getting admin" + err);
            done(errors.resourceNotFound(true), null);
        } else {
            if (rows[0].otp == requestParam.otp) {
                let clientIp = requestIp.getClientIp(req);
                const inserRecord = {
                    email: rows[0].email,
                    name: rows[0].first_name + ' ' + rows[0].last_name,
                    type: 'Admin',
                    login_id: rows[0].admin_id,
                    ip: ip.address()
                    //ip:clientIp
                };
                urlExists(rows[0].profile_picture, (errImageUrl, exists) => {
                    rows[0].profile_picture = exists ? rows[0].profile_picture : `${fullUrl}${adminConstants.placeholder.admin}`,
                        query.insertSingle(dbConstants.dbSchema.loginlogs, inserRecord, function (error, user) {
                            if (error) {
                                logger('Error: can not create user');
                                done(error, null);
                                return;
                            }
                            rows[0] = JSON.parse(JSON.stringify(rows[0]));
                            rows[0].loginlog_id = user.loginlog_id;
                            // console.log(rows[0])
                            done(null, rows[0]);
                        });
                })
                //done(null, rows[0]);
            } else {
                done(null, "Invalid");
                return
            }
        }
    })
}


module.exports = {
    getAdministrator: getAdministrator,
    createAdministrator: createAdministrator,
    createMultipleAdministrator: createMultipleAdministrator,
    updateAdministrator: updateAdministrator,
    editAdministrator: editAdministrator,
    activeAdministrator: activeAdministrator,
    inactiveAdministrator: inactiveAdministrator,
    deleteAdministrator: deleteAdministrator,
    getAdminPost: getAdminPost,
    authentication: authentication,
    forgotpassword: forgotpassword,
    logoutUser,
    authenticationNew,
    verifyAuthenticationOTP
};
'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const EmailTemplate = require('./../models/email-template');
const Language = require('./../models/language');
const fs = require('file-system');
const config = require('./../config');
const S3Handler = require('./../utils/s3-handler');
const s3Handler = new S3Handler();
let staticPageBucket = config.aws.s3.staticPagesBucket;
 

/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getEmailTemplate = function(requestParam, done) {
    if (requestParam.emailtemplate_id) {
        query.selectWithAndOne(dbConstants.dbSchema.email_templates, requestParam,function(error, EmailTemplate) {
            if (error) {
                logger('Error: can not get EmailTemplate', dbConstants.dbSchema.email_templates);
                done(error, null);
                return;
            }
            EmailTemplate = JSON.parse(JSON.stringify(EmailTemplate));
            query.selectWithAnd(dbConstants.dbSchema.languages,{}, function(error, languages) {
                async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
                    if (_.has(EmailTemplate.description, singleLanguage.code)) {
                        EmailTemplate[singleLanguage.code] = EmailTemplate.description[singleLanguage.code];
                        Callback_s1();
                    } else {
                        Callback_s1();
                    }
                }, function() {
                    done(null, EmailTemplate);
                });
            });
        });
    }
    else{
        query.selectWithAnd(dbConstants.dbSchema.email_templates,{}, function(error, EmailTemplate) {
            if (error) {
                logger('Error: can not get EmailTemplate', dbConstants.dbSchema.email_templates);
                done(error, null);
                return;
            } 
            let columnsAndValues = [];
            async.forEachSeries(EmailTemplate, function(singleRec, Callback_s1) {
                columnsAndValues.push({
                    'id': singleRec.emailtemplate_id,
                    'emailtemplate_id': singleRec.emailtemplate_id,
                    'title': singleRec.title,                    
                    'code': singleRec.code,                    
                    'status': singleRec.status,                    
                });
                Callback_s1();
            }, function() {
                done(null, columnsAndValues);
            });
        });
    }
};   
/*
 * Used to create cms 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */ 
const createEmailTemplate = function(requestParam, done) {
   let description = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, {},function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            if (_.has(requestParam, singleLanguage.code)) {
                description[singleLanguage.code] = requestParam[singleLanguage.code];
                Callback_s1();
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesLabels = {
                title: requestParam.title,
                code: requestParam.code,
                from_name: requestParam.from_name,
                from_email: requestParam.from_email,
                email_subject: requestParam.email_subject,
                description: description,
                status: requestParam.status
            }
            query.insertSingle(dbConstants.dbSchema.email_templates, columnAndValuesLabels, function(error, EmailTemplate) {
                if (error) {
                    logger('Error: can not create push notification templates');
                    done(error, null);
                    return;
                }
                done(null, EmailTemplate);
            });
        });
    });
};
 

/*
 * Used to update helpTopicCategory by id
 * @param {helpTopicCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateEmailTemplate = function(emailTemplate, done) {
    let description = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, {}, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            if (_.has(emailTemplate, singleLanguage.code)) {
                description[singleLanguage.code] = emailTemplate[singleLanguage.code];
                Callback_s1();
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValues = {
                emailtemplate_id: emailTemplate.emailtemplate_id,
                title: emailTemplate.title,
                code: emailTemplate.code,
                from_name: emailTemplate.from_name,
                from_email: emailTemplate.from_email,
                email_subject: emailTemplate.email_subject,
                description: description,
                status: emailTemplate.status
            }
            query.updateSingle(dbConstants.dbSchema.email_templates, columnAndValues, {
                'emailtemplate_id': emailTemplate.emailtemplate_id
            }, function(error, emailTemplateDetail) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                done(null, emailTemplateDetail);
            });
        });
    });
};
/*
 * Used to delete EmailTemplate by id
 * @param {EmailTemplateDetail} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteEmailTemplate = function(EmailTemplateDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.email_templates, {
        'emailtemplate_id': {
            $in: EmailTemplateDetails
        }
    }, function(error, EmailTemplate) {
        if (error) {
            logger('Error: can not delete EmailTemplate');
            done(error, null);
            return;
        }
        done(null, EmailTemplate);
    });
};


module.exports = {
    getEmailTemplate:getEmailTemplate,
    createEmailTemplate:createEmailTemplate,
    updateEmailTemplate:updateEmailTemplate,
    deleteEmailTemplate:deleteEmailTemplate
};
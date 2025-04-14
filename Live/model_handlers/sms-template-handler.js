'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Sms_Template = require('./../models/sms-template');

/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getSmsTemplate = function(requestParam, done) {
    if (requestParam.sms_id) {
        query.selectWithAndOne(dbConstants.dbSchema.sms_templates, requestParam, function(error, sms) {
            if (error) {
                logger('Error: can not get sms', dbConstants.dbSchema.sms_templates);
                done(error, null);
                return;
            }
            sms = JSON.parse(JSON.stringify(sms));
            query.selectWithAnd(dbConstants.dbSchema.languages, {}, function(error, languages) {
                async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
                    if (_.has(sms.value, singleLanguage.code)) {
                        sms["value_" + singleLanguage.code] = sms.value[singleLanguage.code];
                    }
                    Callback_s1();
                }, function() {
                    done(null, sms);
                });
            });
        });
    } else {
        query.selectWithAnd(dbConstants.dbSchema.sms_templates, {}, function(error, sms) {
            if (error) {
                logger('Error: can not get sms', dbConstants.dbSchema.sms_templates);
                done(error, null);
                return;
            }
            done(null, sms);
        });
    }
};
/*
 * Used to create cms 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createSmsTemplate = function(requestParam, done) {
    let value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            if (_.has(requestParam, "value_" + singleLanguage.code)) {
                value[singleLanguage.code] = requestParam["value_" + singleLanguage.code];

            }
            Callback_s1();
        }, function() {
            let columnAndValuesLabels = {
                title: requestParam.title,
                code: requestParam.code,
                value: value,
                status: requestParam.status
            }
            query.insertSingle(dbConstants.dbSchema.sms_templates, columnAndValuesLabels, function(error, sms) {
                if (error) {
                    logger('Error: can not create sms templates');
                    done(error, null);
                    return;
                }
                done(null, sms);
            });
        });
    });
};

/*
 * Used to update helpTopicCategory by id
 * @param {helpTopicCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateSmsTemplate = function(requestParam, done) {
    let value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, {}, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            if (_.has(requestParam, "value_" + singleLanguage.code)) {
                value[singleLanguage.code] = requestParam["value_" + singleLanguage.code];

            }
            Callback_s1();
        }, function() {
            let columnAndValues = {
                title: requestParam.title,
                code: requestParam.code,
                value: value,
                status: requestParam.status
            }
            query.updateSingle(dbConstants.dbSchema.sms_templates, columnAndValues, {
                'sms_id': requestParam.sms_id
            }, function(error, sms) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                done(null, {});
            });
        });
    });
};
/*
 * Used to delete sms by id
 * @param {sms} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteSmsTemplate = function(sms, done) {
    query.removeMultiple(dbConstants.dbSchema.sms_templates, {
        'sms_id': {
            $in: sms
        }
    }, function(error, sms) {
        if (error) {
            logger('Error: can not delete sms_templates');
            done(error, null);
            return;
        }
        done(null, sms);
    });
};

/*
 * Used to action update by id
 * @param {smsDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const statusChange  = (smsDetails, done) => {
    let columnsToUpdate = {
      status: smsDetails['actionType'],
    };
    query.updateMultiple(dbConstants.dbSchema.sms_templates, columnsToUpdate, {
      'sms_id': {
        $in: smsDetails['id'],
      },
    }, function(error, data) {
      if (error) {
        logger('Error: can not update ');
        done(error, null);
        return;
      }
      done(null, data);
    });  
};


module.exports = {
    getSmsTemplate,
    createSmsTemplate,
    updateSmsTemplate,
    deleteSmsTemplate,
    statusChange
};
'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const PushNotificationTemplate = require('./../models/push-notification-template');
 

/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getPushNotificationTemplate = function(requestParam, done) {
    if (requestParam.push_notification_id) {
        query.selectWithAndOne(dbConstants.dbSchema.push_notification_templates, requestParam,function(error, PushNotificationTemplate) {
            if (error) {
                logger('Error: can not get PushNotificationTemplate', dbConstants.dbSchema.push_notification_templates);
                done(error, null);
                return;
            }
            PushNotificationTemplate = JSON.parse(JSON.stringify(PushNotificationTemplate));
            query.selectWithAnd(dbConstants.dbSchema.languages,{}, function(error, languages) {
                async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
                    if (_.has(PushNotificationTemplate.value, singleLanguage.code)) {
                        PushNotificationTemplate["value_"+singleLanguage.code] = PushNotificationTemplate.value[singleLanguage.code];
                    }
                    if (_.has(PushNotificationTemplate.caption_value, singleLanguage.code)) {
                        PushNotificationTemplate["caption_"+singleLanguage.code] = PushNotificationTemplate.caption_value[singleLanguage.code];
                        Callback_s1();
                    } else {
                        Callback_s1();
                    }
                }, function() {
                    done(null, PushNotificationTemplate);
                });
            });
        });
    }
    else{
        query.selectWithAnd(dbConstants.dbSchema.push_notification_templates,{},function(error, PushNotificationTemplate) {
            if (error) {
                logger('Error: can not get PushNotificationTemplate', dbConstants.dbSchema.push_notification_templates);
                done(error, null);
                return;
            } 
            let columnsAndValues = [];
            for(var i=0; i<PushNotificationTemplate.length; i++){
                columnsAndValues.push({
                    'id': PushNotificationTemplate[i].push_notification_id,
                    'push_notification_id': PushNotificationTemplate[i].push_notification_id,
                    'title': PushNotificationTemplate[i].title,                    
                    'code': PushNotificationTemplate[i].code,                    
                    'status': PushNotificationTemplate[i].status,                    
                });
            }
            done(null, columnsAndValues);
        });
    }
};   
/*
 * Used to create cms 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createPushNotificationTemplate = function(requestParam, done) {
    let value = new Object();
   let caption_value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            
            if (_.has(requestParam, "value_"+singleLanguage.code)) { 
                value[singleLanguage.code] = requestParam["value_"+singleLanguage.code];
                
            } 
            if (_.has(requestParam, "caption_"+singleLanguage.code)) { 
                caption_value[singleLanguage.code] = requestParam["caption_"+singleLanguage.code];
 
                Callback_s1();
            } else {
                Callback_s1();
            }

        }, function() {
            let columnAndValuesLabels = {
                title: requestParam.title,
                code: requestParam.code,
                value: value,
                caption_value: caption_value,
                status: requestParam.status
            }
            query.insertSingle(dbConstants.dbSchema.push_notification_templates, columnAndValuesLabels, function(error, PushNotificationTemplate) {
                if (error) {
                    logger('Error: can not create push notification templates');
                    done(error, null);
                    return;
                }
                done(null, PushNotificationTemplate);
            });
        });
    });
};

/*
 * Used to update helpTopicCategory by id
 * @param {helpTopicCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updatePushNotificationTemplate = function(pushNotification, done) {
     let value = new Object();
    let caption_value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, {}, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
             if (_.has(pushNotification, "value_"+singleLanguage.code)) { 
                value[singleLanguage.code] = pushNotification["value_"+singleLanguage.code];
                
            } 
            if (_.has(pushNotification, "caption_"+singleLanguage.code)) { 
                caption_value[singleLanguage.code] = pushNotification["caption_"+singleLanguage.code];
 
                Callback_s1();
            }  else {
                Callback_s1();
            }
        }, function() {
            let columnAndValues = {
                push_notification_id: pushNotification.push_notification_id,
                title: pushNotification.title,
                user_type: pushNotification.user_type,
                value: value,
                caption_value: caption_value,
                status: pushNotification.status
            }
            query.updateSingle(dbConstants.dbSchema.push_notification_templates, columnAndValues, {
                'push_notification_id': pushNotification.push_notification_id
            }, function(error, pushNotificationDetail) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                done(null, pushNotificationDetail);
            });
        });
    });
};
/*
 * Used to delete PushNotificationTemplate by id
 * @param {PushNotificationTemplateDetail} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deletePushNotificationTemplate = function(pushNotificationTemplateDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.push_notification_templates, {
        'push_notification_id': {
            $in: pushNotificationTemplateDetails
        }
    }, function(error, pushNotificationTemplate) {
        if (error) {
            logger('Error: can not delete pushNotificationTemplate');
            done(error, null);
            return;
        }
        done(null, pushNotificationTemplate);
    });
};

/*
 * Used to action update by id
 * @param {pushNotificationTemplateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const statusChange  = (pushNotificationTemplateDetails, done) => {
    let columnsToUpdate = {
      status: pushNotificationTemplateDetails['actionType'],
    };
    query.updateMultiple(dbConstants.dbSchema.push_notification_templates, columnsToUpdate, {
      'push_notification_id': {
        $in: pushNotificationTemplateDetails['id'],
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
    getPushNotificationTemplate,
    createPushNotificationTemplate,
    updatePushNotificationTemplate,
    deletePushNotificationTemplate,
    statusChange
};
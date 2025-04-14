'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const mailConstants = require('./../constants/mail-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Email_Template = require('./../models/email-template');
const fs = require('file-system');

/*
 * Used to get get emailTemplate with params
 * @param {Function} done - Callback function with error, data params
 */
const getEmailTemplate = function(requestParam,done){
	if(requestParam.email_template_id){
		query.selectWithAndOne(dbConstants.dbSchema.email_templates, requestParam,function (error, emailTemplate) {
			if (error) {
				logger('Error: can not get emailTemplate', dbConstants.dbSchema.email_templates);
				done(error, null);
				return;
			}
			let columnsAndValues={
				'id':emailTemplate.email_template_id,
				'email_template_id':emailTemplate.email_template_id,
				'title':emailTemplate.title,
				'code':emailTemplate.code,
				'from_email':emailTemplate.from_email
			};
			query.selectWithAnd(dbConstants.dbSchema.languages, function (error, languages) {
				async.forEachSeries(languages, function(singleLan, Callback_s1) {
					if(_.has(emailTemplate.description, singleLan.code) && _.has(emailTemplate.subject, singleLan.code)){
						columnsAndValues[singleLan.code]=emailTemplate.description[singleLan.code];
						columnsAndValues["sub_"+singleLan.code]=emailTemplate.subject[singleLan.code];
						Callback_s1();
					}
					else{
						Callback_s1();
					}
				},function(){
					done(null,columnsAndValues);
				});
			});	
		});
	}
	else{
		query.selectWithAnd(dbConstants.dbSchema.email_templates, function (error, emailTemplate) {
			if (error) {
				logger('Error: can not get emailTemplate', dbConstants.dbSchema.email_templates);
				done(error, null);
				return;
			}
			let columnsAndValues=[];
			async.forEachSeries(emailTemplate, function(singleRec, Callback_s1) {
				columnsAndValues.push({
					'id':singleRec.email_template_id,
					'email_template_id':singleRec.email_template_id,
					'title':singleRec.title,
					'code':singleRec.code,
					'from_email':singleRec.from_email
				});
				Callback_s1();
			},function(){
				done(null,columnsAndValues);
			});
		});
	}
};


/*
 * Used to create emailTemplate 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createEmailTemplate = function(requestParam,done){
	let description = new Object();
	let subject = new Object();
	query.selectWithAnd(dbConstants.dbSchema.languages, function (error, languages) {
		async.forEachSeries(languages, function(singleLan, Callback_s1) {
			if(_.has(requestParam, singleLan.code) && _.has(requestParam, "sub_"+singleLan.code)){
				description[singleLan.code]=requestParam[singleLan.code];
				subject[singleLan.code]=requestParam["sub_"+singleLan.code];
				Callback_s1();
			}
			else{
				Callback_s1();
			}
		},function(){
			let columnAndValuesemailTemplate={
				title:requestParam.title,
				code:requestParam.code,
				from_email:requestParam.from_email,
				subject:subject,
				description:description
			}
			query.insertSingle(dbConstants.dbSchema.email_templates,columnAndValuesemailTemplate,function (error, emailTemplate) {
				if (error) {
					logger('Error: can not create emailTemplate');
					done(error, null);
					return;
				}
				done(null, emailTemplate);
			});
		});
	});
};

/*
 * Used to update emailTemplate by id 
 * @param {emailTemplateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateEmailTemplate = function(emailTemplateDetails,done){
	let description = new Object();
	let subject = new Object();
	query.selectWithAnd(dbConstants.dbSchema.languages, function (error, languages) {
		async.forEachSeries(languages, function(singleLan, Callback_s1) {
			if(_.has(emailTemplateDetails, singleLan.code) && _.has(emailTemplateDetails, "sub_"+singleLan.code)){
				description[singleLan.code]=emailTemplateDetails[singleLan.code];
				subject[singleLan.code]=emailTemplateDetails["sub_"+singleLan.code];
				Callback_s1();
			}
			else{
				Callback_s1();
			}
		},function(){
			let columnAndValuesemailTemplate={
				email_template_id:emailTemplateDetails.email_template_id,
				title:emailTemplateDetails.title,
				code:emailTemplateDetails.code,
				description:description,
				subject:subject,
				from_email:emailTemplateDetails.from_email
			}
			query.updateSingle(dbConstants.dbSchema.email_templates,columnAndValuesemailTemplate, { 'email_template_id':emailTemplateDetails.email_template_id},function (error, emailTemplate) {
				if (error) {
					logger('Error: can not update emailTemplate');
					done(error, null);
					return;
				}
				done(null, emailTemplate);
			});
		});
	});
};


/*
 * Used to delete emailTemplate by id 
 * @param {emailTemplateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteEmailTemplate = function(emailTemplateDetails,done){
	query.removeMultiple(dbConstants.dbSchema.email_templates, { 'email_template_id':{ $in : emailTemplateDetails } },function (error, emailTemplate) {
		if (error) {
			logger('Error: can not delete emailTemplate');
			done(error, null);
			return;
		}
		done(null, emailTemplate);
	});
};



module.exports = {
	getEmailTemplate: getEmailTemplate,
	createEmailTemplate:createEmailTemplate,
	updateEmailTemplate:updateEmailTemplate,
	deleteEmailTemplate:deleteEmailTemplate
};
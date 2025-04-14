'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Loginlog = require('./../models/loginlog');
const moment = require('moment');

/*
 * Used to get getProvider with params
 * @param {Function} done - Callback function with error, data params
 */
const getLoginlog = function(requestParam,done){
	query.selectWithAnd(dbConstants.dbSchema.loginlogs ,{},function (error, loginlogs) {
		if (error) {
			logger('Error: can not get loginlogs', dbConstants.dbSchema.loginlogs);
			done(error, null);
			return;
		}
        loginlogs = JSON.parse(JSON.stringify(loginlogs));
		_.each(loginlogs,function(data){
			if(data.logout_date == undefined){
				data.logout_date = ''	
			} 
		})
		done(null,loginlogs);
	});
};


/*
 * Used to delete consumer by id 
 * @param {loginlogDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteLoginlog = function(loginlogDetails,done){
	query.removeMultiple(dbConstants.dbSchema.loginlogs, { 'loginlog_id':{ $in : loginlogDetails } },function (error, loginlog) {
		if (error) {
			logger('Error: can not update loginlog');
			done(error, null);
			return;
		}
		done(null, loginlog);
	});
};

module.exports = {
	getLoginlog: getLoginlog,
	deleteLoginlog:deleteLoginlog
};
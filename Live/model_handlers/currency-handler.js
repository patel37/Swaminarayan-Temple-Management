'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const currencyConstants = require('./../constants/currency-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const moment = require('moment');

/*
 * Used to get url 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const getCurrency = function(requestParam,done){
	if(requestParam.currency_id){
		query.selectWithAndOne(dbConstants.dbSchema.currency,requestParam,function (error, currency) {
			if (error) {
				logger('Error: can not get currency data');
				done(error, null);
				return;
			}
			let columnAndValues={
				'id':currency.currency_id,
				'currency_id':currency.currency_id,
				'title':currency.title,
				'symbole':currency.symbole,
				'code':currency.code,
				'status':currency.status,
				'stripe_code':currency.stripe_code
			};
			done(null,columnAndValues);
		});
	}
	else{
        let compairData={}
        if(requestParam.status){
            compairData.status='Active';
        }
		query.selectWithAndFilter(dbConstants.dbSchema.currency, compairData, {}, { created_at : -1}, {},function (error, currency) {
			if (error) {
				logger('Error: can not get currency data');
				done(error, null);
				return;
			}
			let columnAndValues=[];
			async.forEachSeries(currency, function(singleCur, Callback_s1) {
				columnAndValues.push({
					'id':singleCur.currency_id,
					'currency_id':singleCur.currency_id,
					'title':singleCur.title,
					'symbole':singleCur.symbole,
					'code':singleCur.code,
					'status':singleCur.status,
					'stripe_code':singleCur.stripe_code
				});
				Callback_s1();
			},function(){
				done(null,columnAndValues);
			});
		});
	}
};


/*
 * Used to create currency 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createCurrency = async function (requestParam, done) {
	const isAlreadyExist = await query.selectWithAndOnePromise(dbConstants.dbSchema.currency, { $or : [ {title: requestParam.title}, {code: requestParam.code}, {symbole: requestParam.symbole} ]}, {
		title: 1,
		code : 1
	})
	if (isAlreadyExist) {
		logger('Error: record already exist.');
		done(errors.recordExist(true), null);
		return;
	} else {
		query.insertSingle(dbConstants.dbSchema.currency,requestParam,function (error, currency) {
			if (error) {
				logger('Error: can not create currency');
				done(error, null);
				return;
			}
			done(null, currency);
		});
	}
};


/*
 * Used to update currency by id 
 * @param {userDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateCurrency = function(userDetails,done){
	query.updateSingle(dbConstants.dbSchema.currency,userDetails, {currency_id: userDetails.currency_id},function (error, currency) {
		if (error) {
			logger('Error: can not update currency');
			done(error, null);
			return;
		}
		done(null, currency);
	});
};


/*
 * Used to active currency by id 
 * @param {currencyDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeCurrency = function(currencyDetails,done){
	let columnsToUpdate = {
		status:currencyConstants.status.active
	};
	query.updateMultiple(dbConstants.dbSchema.currency,columnsToUpdate, { 'currency_id':{ $in : currencyDetails } },function (error, currency) {
		if (error) {
			logger('Error: can not update currency');
			done(error, null);
			return;
		}
		done(null, currency);
	});
};

/*
 * Used to inactive currency by id 
 * @param {currencyDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveCurrency = function(currencyDetails,done){
	let columnsToUpdate = {
		status:currencyConstants.status.inactive
	};
	query.updateMultiple(dbConstants.dbSchema.currency,columnsToUpdate, { 'currency_id':{ $in : currencyDetails } },function (error, currency) {
		if (error) {
			logger('Error: can not update currency');
			done(error, null);
			return;
		}
		done(null, currency);
	});
};

/*
 * Used to delete currency by id 
 * @param {currencyDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteCurrency = function(currencyDetails,done){
	query.removeMultiple(dbConstants.dbSchema.currency, { 'currency_id':{ $in : currencyDetails } },function (error, currency) {
		if (error) {
			logger('Error: can not update currency');
			done(error, null);
			return;
		}
		done(null, currency);
	});
};



module.exports = {
	getCurrency:getCurrency,
	updateCurrency:updateCurrency,
	createCurrency:createCurrency,
	activeCurrency:activeCurrency,
	inactiveCurrency:inactiveCurrency,
	deleteCurrency:deleteCurrency
};
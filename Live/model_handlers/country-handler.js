'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const countryConstants = require('./../constants/city-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Country = require('./../models/country');
const fs = require('file-system');
const config = require('./../config')

/*
 * Used to get get country with params
 * @param {Function} done - Callback function with error, data params
 */
const getCountry = function(requestParam,done){
	if(requestParam.country_id){
		query.selectWithAndOne(dbConstants.dbSchema.countries, requestParam,function (error, countries) {
			if (error) {
				logger('Error: can not get countries', dbConstants.dbSchema.countries);
				done(error, null);
				return;
			}
			let columnsAndValues={
				'id':countries.country_id,
				'country_id':countries.country_id,
				'name':countries.name,
				'status':countries.status
			};
			done(null, columnsAndValues);
		});
	}
	else {
		const compareValue = {}
		if (requestParam.status) {
			compareValue.status = requestParam.status
		}
		query.selectWithAnd(dbConstants.dbSchema.countries, requestParam, function (error, countries) {
			if (error) {
				logger('Error: can not get countries', dbConstants.dbSchema.countries);
				done(error, null);
				return;
			}
			let columnsAndValues=[];
			async.forEachSeries(countries, function(singleRec, Callback_s1) {
				columnsAndValues.push({
					'id':singleRec.country_id,
					'country_id':singleRec.country_id,
					'name':singleRec.name,
					'status':singleRec.status
				});
				Callback_s1();
			},function(){
				done(null,columnsAndValues);
			});
		});
	}
};


/*
 * Used to create country 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createCountry = async function (requestParam, done) {
	const isAlreadyExist = await query.selectWithAndOnePromise(dbConstants.dbSchema.countries, { name: requestParam.name }, {
		country_id : 1
	})
	if (isAlreadyExist) {
		logger('Error: record already exist.');
		done(errors.recordExist(true), null);
		return;
	 }
	query.insertSingle(dbConstants.dbSchema.countries,requestParam,function (error, countries) {
		if (error) {
			logger('Error: can not create countries');
			done(error, null);
			return;
		}
		done(null, countries);
	});
};

/*
 * Used to update country by id 
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateCountry = async function (countryDetails, done) {
	const isAlreadyExist = await query.selectWithAndOnePromise(dbConstants.dbSchema.countries, { name: countryDetails.name }, {
		country_id: 1
	})
	if (isAlreadyExist) {
		logger('Error: record already exist.');
		done(errors.recordExist(true), null);
		return;
	}
	query.updateSingle(dbConstants.dbSchema.countries,countryDetails, { 'country_id':countryDetails.country_id},function (error, country) {
		if (error) {
			logger('Error: can not update country');
			done(error, null);
			return;
		}
		done(null, country);
	});
};



/*
 * Used to active country by id 
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeCountry = function(countryDetails,done){
	let columnsToUpdate = {
		status:countryConstants.status.active
	};
	query.updateMultiple(dbConstants.dbSchema.countries,columnsToUpdate, { 'country_id':{ $in : countryDetails } },function (error, country) {
		if (error) {
			logger('Error: can not update country');
			done(error, null);
			return;
		}
		done(null, country);
	});
};

/*
 * Used to inactive country by id 
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveCountry = function(countryDetails,done){
	let columnsToUpdate = {
		status:countryConstants.status.inactive
	};
	query.updateMultiple(dbConstants.dbSchema.countries,columnsToUpdate, { 'country_id':{ $in : countryDetails } },function (error, country) {
		if (error) {
			logger('Error: can not update country');
			done(error, null);
			return;
		}
		done(null, country);
	});
};

/*
 * Used to delete country by id 
 * @param {countryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteCountry = function(countryDetails,done){
	query.removeMultiple(dbConstants.dbSchema.countries, { 'country_id':{ $in : countryDetails } },function (error, country) {
		if (error) {
			logger('Error: can not delete country');
			done(error, null);
			return;
		}
		done(null, country);
	});
};

const getCountryInfo = function(countryDetails,done){
		query.selectWithAndOne(dbConstants.dbSchema.countries, countryDetails,function (error, countries) {
			if (error) {
				logger('Error: can not get countries', dbConstants.dbSchema.countries);
				done(error, null);
				return;
			}
			if(countries != null){
				countries =JSON.parse(JSON.stringify(countries))
				let columnsAndValues={
					'iso2_code':countries.iso2_code,
					'iso3_code:':countries.iso3_code,
					'flag':config.AWS_BASE_URL + "/" + config.aws.s3.countryFlagBucket + "/" + countries.flag
				};
				done(null, columnsAndValues);
			}else {
				done(errors.customError('Country does not exist','401','Success',true),null)
			}
			
		});
};



module.exports = {
	getCountry: getCountry,
	createCountry:createCountry,
	updateCountry:updateCountry,
	activeCountry:activeCountry,
	inactiveCountry:inactiveCountry,
	deleteCountry:deleteCountry,
	getCountryInfo
};
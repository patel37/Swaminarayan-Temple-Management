'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const stateConstants = require('./../constants/city-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Country = require('./../models/country');
const State = require('./../models/state');
const fs = require('file-system');

/*
 * Used to get get state with params
 * @param {Function} done - Callback function with error, data params
 */
const getState = function(requestParam,done){
	if(requestParam.state_id){
		query.selectWithAndOne(dbConstants.dbSchema.states, requestParam,function (error, states) {
			if (error) {
				logger('Error: can not get states', dbConstants.dbSchema.states);
				done(error, null);
				return;
			}
			let columnsAndValuesCountry={
				country_id:states.country_id
			}
			query.selectWithAndOne(dbConstants.dbSchema.countries, columnsAndValuesCountry,function (error, country) {
				let columnsAndValues={
					'id':states.state_id,
					'state_id':states.state_id,
					'country_id':states.country_id,
					'country':country.name,
					'name':states.name,
					'status':states.status
				};
				done(null, columnsAndValues);
			});	
		});
	}
	else{
		query.selectWithAnd(dbConstants.dbSchema.states, function (error, states) {
			if (error) {
				logger('Error: can not get states', dbConstants.dbSchema.states);
				done(error, null);
				return;
			}
			let columnsAndValues=[];
			async.forEachSeries(states, function(singleRec, Callback_s1) {
				let columnsAndValuesCountry={
					country_id:singleRec.country_id
				}
				query.selectWithAndOne(dbConstants.dbSchema.countries, columnsAndValuesCountry,function (error, country) {
					if(country==null){
						Callback_s1();
					}
					else{
						columnsAndValues.push({
							'id':singleRec.state_id,
							'state_id':singleRec.state_id,
							'country_id':singleRec.country_id,
							'country':country.name,
							'name':singleRec.name,
							'status':singleRec.status
						});
						Callback_s1();
					}
				});
			},function(){
				done(null,columnsAndValues);
			});
		});
	}
};


/*
 * Used to create state 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createState = async function (requestParam, done) {
	const isAlreadyExist = await query.selectWithAndOnePromise(dbConstants.dbSchema.states, { name: requestParam.name }, {
		country_id: 1,
		name : 1
	})
	if (isAlreadyExist) {
		logger('Error: record already exist.');
		done(errors.recordExist(true), null);
		return;
	} else {
		query.insertSingle(dbConstants.dbSchema.states, requestParam, function (error, states) {
			if (error) {
				logger('Error: can not create states');
				done(error, null);
				return;
			}
			done(null, states);
		});
	}
	
};

/*
 * Used to update state by id 
 * @param {stateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateState = function(stateDetails,done){
	query.updateSingle(dbConstants.dbSchema.states,stateDetails, { 'state_id':stateDetails.state_id},function (error, state) {
		if (error) {
			logger('Error: can not update state');
			done(error, null);
			return;
		}
		done(null, state);
	});
};



/*
 * Used to active state by id 
 * @param {stateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeState = function(stateDetails,done){
	let columnsToUpdate = {
		status:stateConstants.status.active
	};
	query.updateMultiple(dbConstants.dbSchema.states,columnsToUpdate, { 'state_id':{ $in : stateDetails } },function (error, state) {
		if (error) {
			logger('Error: can not update state');
			done(error, null);
			return;
		}
		done(null, state);
	});
};

/*
 * Used to inactive state by id 
 * @param {stateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveState = function(stateDetails,done){
	let columnsToUpdate = {
		status:stateConstants.status.inactive
	};
	query.updateMultiple(dbConstants.dbSchema.states,columnsToUpdate, { 'state_id':{ $in : stateDetails } },function (error, state) {
		if (error) {
			logger('Error: can not update state');
			done(error, null);
			return;
		}
		done(null, state);
	});
};

/*
 * Used to delete state by id 
 * @param {stateDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteState = function(stateDetails,done){
	query.removeMultiple(dbConstants.dbSchema.states, { 'state_id':{ $in : stateDetails } },function (error, state) {
		if (error) {
			logger('Error: can not delete state');
			done(error, null);
			return;
		}
		done(null, state);
	});
};



module.exports = {
	getState: getState,
	createState:createState,
	updateState:updateState,
	activeState:activeState,
	inactiveState:inactiveState,
	deleteState:deleteState
};
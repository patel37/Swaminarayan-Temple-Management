'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const cityConstants = require('./../constants/city-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const City = require('./../models/city');
const Country = require('./../models/country');
const State = require('./../models/state');
const fs = require('file-system');

/*
 *  Used to get city with params
 * @param {Function} done - Callback function with error, data params
 */
const getCity = function(requestParam,done){
	if(requestParam.city_id){
		query.selectWithAndOne(dbConstants.dbSchema.cities,requestParam, function (error, cities) {
			if (error) {
				logger('Error: can not get cities', dbConstants.dbSchema.cities);
				done(error, null);
				return;
			}
			let columnsAndValuesCountry={
				country_id:cities.country_id
			}
			let columnsAndValuesState={
				state_id:cities.state_id
			}
			query.selectWithAndOne(dbConstants.dbSchema.countries, columnsAndValuesCountry,function (error, country) {
				query.selectWithAndOne(dbConstants.dbSchema.states, columnsAndValuesState,function (error, state) {
					let columnsAndValues={
						'id':cities.city_id,
						'city_id':cities.city_id,
						'name':cities.name,
						'country_id':cities.country_id,
						'country':country.name,
						'state_id':cities.state_id,
						'state':state.name,
						'status':cities.status
					};
					done(null,columnsAndValues)
				});
			});	
		});
	}
	else{
		query.selectWithAnd(dbConstants.dbSchema.cities, function (error, cities) {
			if (error) {
				logger('Error: can not get cities', dbConstants.dbSchema.cities);
				done(error, null);
				return;
			}
			let columnsAndValues=[];
			async.forEachSeries(cities, function(singleRec, Callback_s1) {
				let columnsAndValuesCountry={
					country_id:singleRec.country_id
				}
				let columnsAndValuesState={
					state_id:singleRec.state_id
				}
				query.selectWithAndOne(dbConstants.dbSchema.countries, columnsAndValuesCountry,function (error, country) {
					query.selectWithAndOne(dbConstants.dbSchema.states, columnsAndValuesState,function (error, state) {
						if(country==null || state==null){
							Callback_s1();
						}
						else{
							columnsAndValues.push({
								'id':singleRec.city_id,
								'city_id':singleRec.city_id,
								'name':singleRec.name,
								'country_id':singleRec.country_id,
								'country':country.name,
								'state_id':singleRec.state_id,
								'state':state.name,
								'status':singleRec.status
							});
							Callback_s1();
						}
					});	
				});		
			},function(){
				done(null,columnsAndValues);
			});
		});
	}
};


/*
 * Used to get city with params
 * @param {Function} done - Callback function with error, data params
 */
const getState = function(requestParam,done){
	query.selectWithAnd(dbConstants.dbSchema.states,requestParam, function (error, states) {
		if (error) {
			logger('Error: can not get states', dbConstants.dbSchema.states);
			done(error, null);
			return;
		}
		let columnsAndValues=[];
		async.forEachSeries(states, function(singleRec, Callback_s1) {
			columnsAndValues.push({
				'id':singleRec.state_id,
				'state_id':singleRec.state_id,
				'name':singleRec.name,
				'status':singleRec.status
			});
			Callback_s1();	
		},function(){
			done(null,columnsAndValues);
		});
	});
};


/*
 * Used to create city
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createCity = async function (requestParam, done) {
	const isAlreadyExist = await query.selectWithAndOnePromise(dbConstants.dbSchema.cities, { name: requestParam.name }, {
		country_id: 1,
		city_id: 1,
		name : 1
	})
	if (isAlreadyExist) {
		logger('Error: record already exist.');
		done(errors.recordExist(true), null);
		return;
	}
	query.insertSingle(dbConstants.dbSchema.cities,requestParam,function (error, cities) {
		if (error) {
			logger('Error: can not create cities');
			done(error, null);
			return;
		}
		done(null, cities);
	});
};


/*
 * Used to update city by id 
 * @param {cityDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateCity = async function (cityDetails, done) {
	const getData = await query.selectWithAndOnePromise(dbConstants.dbSchema.cities, { city_id: cityDetails.city_id }, {
		country_id: 1,
		city_id: 1,
		state_id : 1,
		name: 1
	})
	if ((getData.name === cityDetails.name) && (getData.country_id === cityDetails.country_id) && (getData.city_id === cityDetails.city_id) && (getData.state_id === cityDetails.state_id)) {
		query.updateSingle(dbConstants.dbSchema.cities, cityDetails, { 'city_id': cityDetails.city_id }, function (error, city) {
			if (error) {
				logger('Error: can not update city');
				done(error, null);
				return;
			}
			done(null, city);
		});
	} else {
		const isAlreadyExist = await query.selectWithAndOnePromise(dbConstants.dbSchema.cities, { name: cityDetails.name }, {
			country_id: 1,
			city_id: 1,
			name: 1
		})
		if (isAlreadyExist) {
			logger('Error: record already exist.');
			done(errors.recordExist(true), null);
			return;
		} else {
			query.updateSingle(dbConstants.dbSchema.cities, cityDetails, { 'city_id': cityDetails.city_id }, function (error, city) {
				if (error) {
					logger('Error: can not update city');
					done(error, null);
					return;
				}
				done(null, city);
			});
		}
	}
	
};



/*
 * Used to active city by id 
 * @param {cityDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeCity = function(cityDetails,done){
	let columnsToUpdate = {
		status:cityConstants.status.active
	};
	query.updateMultiple(dbConstants.dbSchema.cities,columnsToUpdate, { 'city_id':{ $in : cityDetails } },function (error, city) {
		if (error) {
			logger('Error: can not update city');
			done(error, null);
			return;
		}
		done(null, city);
	});
};

/*
 * Used to inactive city by id 
 * @param {cityDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveCity = function(cityDetails,done){
	let columnsToUpdate = {
		status:cityConstants.status.inactive
	};
	query.updateMultiple(dbConstants.dbSchema.cities,columnsToUpdate, { 'city_id':{ $in : cityDetails } },function (error, city) {
		if (error) {
			logger('Error: can not update city');
			done(error, null);
			return;
		}
		done(null, city);
	});
};

/*
 * Used to delete city by id 
 * @param {cityDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteCity = function(cityDetails,done){
	query.removeMultiple(dbConstants.dbSchema.cities, { 'city_id':{ $in : cityDetails } },function (error, city) {
		if (error) {
			logger('Error: can not delete city');
			done(error, null);
			return;
		}
		done(null, city);
	});
};


module.exports = {
	getCity: getCity,
	createCity:createCity,
	activeCity:activeCity,
	inactiveCity:inactiveCity,
	deleteCity:deleteCity,
	updateCity:updateCity,
	getState:getState
};
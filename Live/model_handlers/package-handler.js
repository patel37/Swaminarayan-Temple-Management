'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const languageConstants = require('./../constants/language-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Package = require('./../models/package');


/*
 * Used to get administrators with params
 * @param {Function} done - Callback function with error, data params
 */
const getPackage = function(requestParam,done){
	if(requestParam.package_id){
		query.selectWithAndOne(dbConstants.dbSchema.packages,requestParam, function (error, packages) {
			if (error) {
				logger('Error: can not get packages', dbConstants.dbSchema.packages);
				done(error, null);
				return;
			}
			packages = JSON.parse(JSON.stringify(packages));
			query.selectWithAnd(dbConstants.dbSchema.languages,{status:'Active'}, function (error, languages) {
				async.forEachSeries(languages, function(singleLan, Callback_s1) {
					packages["title_" +singleLan.code]=packages.title[singleLan.code];
					packages["desc_" +singleLan.code]=packages.description[singleLan.code];
					Callback_s1();
				},function(){
					done(null,packages);
				});
			});	
		});
	}
	else{
		query.selectWithAnd(dbConstants.dbSchema.packages, function (error, packages) {
			if (error) {
				logger('Error: can not get packages', dbConstants.dbSchema.packages);
				done(error, null);
				return;
			}
			for(var i=0; i<packages.length; i++){
				packages[i].title = packages[i].title['EN'];
			}
			done(null,packages)
		});
	}
};

/*
 * Used to create administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createPackage = function(requestParam,done){
	let title = new Object();
	let description = new Object();
	query.selectWithAnd(dbConstants.dbSchema.languages,{status:'Active'}, function (error, languages) {
		async.forEachSeries(languages, function(singleLan, Callback_s1) {
			title[singleLan.code]=requestParam["title_"+singleLan.code];
			description[singleLan.code]=requestParam["desc_"+singleLan.code];
			Callback_s1();
		},function(){
			requestParam.title = title;
			requestParam.description = description;
			query.insertSingle(dbConstants.dbSchema.packages,requestParam,function (error, packages) {
				if (error) {
					logger('Error: can not create packages');
					done(error, null);
					return;
				}
				done(null, packages);
			});
		});
	});
};

/*
 * Used to update languagelabel by id 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updatePackage = function(requestParam,done){
	let title = new Object();
	let description = new Object();
	query.selectWithAnd(dbConstants.dbSchema.languages,{status:'Active'}, function (error, languages) {
		async.forEachSeries(languages, function(singleLan, Callback_s1) {
			title[singleLan.code]=requestParam["title_"+singleLan.code];
			description[singleLan.code]=requestParam["desc_"+singleLan.code];
			Callback_s1();
		},function(){
			requestParam.title = title;
			requestParam.description = description;
			query.updateSingle(dbConstants.dbSchema.packages,requestParam, { 'package_id':requestParam.package_id},function (error, packages) {
				if (error) {
					logger('Error: can not update packages');
					done(error, null);
					return;
				}
				done(null, packages);
			});
		});
	});
};


/*
 * Used to delete languagelabel by id 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const actionPackage = function(requestParam,done){
	if (requestParam['actionType']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.packages, {
            'package_id': {
                $in: requestParam['id']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not delete ');
                done(error, null);
                return;
            }
            done(null, data);
        });        
    }
    else
    {
        let columnsToUpdate = {
            status: requestParam['actionType']
        };
       query.updateMultiple(dbConstants.dbSchema.packages, columnsToUpdate, {
            'package_id': {
                $in: requestParam['id']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not update ');
                done(error, null);
                return;
            }
            done(null, data);
        });  
    }
};




module.exports = {
	getPackage,
	createPackage,
	actionPackage,
	updatePackage,
};
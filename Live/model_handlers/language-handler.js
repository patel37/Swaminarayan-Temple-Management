'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const languageConstants = require('./../constants/language-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Language = require('./../models/language');
const LanguageLabel = require('./../models/language_labels');


/*
 * Used to get administrators with params
 * @param {Function} done - Callback function with error, data params
 */
const getLanguage = function(requestParam, done) {
    if (requestParam.language_id) {
        query.selectWithAndOne(dbConstants.dbSchema.languages, requestParam, function(error, language) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.languages);
                done(error, null);
                return;
            }
            let columnAndValues = {
                'id': language.language_id,
                'language_id': language.language_id,
                'title': language.title,
                'code': language.code,
                'status': language.status
            };
            done(null, columnAndValues);
        });
    } else {
        query.selectWithAnd(dbConstants.dbSchema.languages, { status: 'Active' }, function(error, languages) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.languages);
                done(error, null);
                return;
            }
            let columnAndValues = [];
            async.forEachSeries(languages, function(singleLan, Callback_s1) {
                columnAndValues.push({
                    'id': singleLan.language_id,
                    'language_id': singleLan.language_id,
                    'title': singleLan.title,
                    'code': singleLan.code,
                    'translations': singleLan.translations,
                    'status': singleLan.status
                });
                Callback_s1();
            }, function() {
                done(null, columnAndValues);
            });
        });
    }
};

/*
 * Used to get administrators with params
 * @param {Function} done - Callback function with error, data params
 */
const getLanguageBackend = function(requestParam, done) {
    query.selectWithAnd(dbConstants.dbSchema.languages, {}, function(error, languages) {
        if (error) {
            logger('Error: can not get language', dbConstants.dbSchema.languages);
            done(error, null);
            return;
        }
        let columnAndValues = [];
        async.forEachSeries(languages, function(singleLan, Callback_s1) {
            columnAndValues.push({
                'id': singleLan.language_id,
                'language_id': singleLan.language_id,
                'title': singleLan.title,
                'code': singleLan.code,
                'translations': singleLan.translations,
                'status': singleLan.status
            });
            Callback_s1();
        }, function() {
            done(null, columnAndValues);
        });
    });
};

/*
 * Used to create administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createLanguage = function(requestParam, done) {
    query.insertSingle(dbConstants.dbSchema.languages, requestParam, function(error, language) {
        if (error) {
            logger('Error: can not create language');
            done(error, null);
            return;
        }
        done(null, language);
    });
};


/*
 * Used to get administrators with params
 * @param {Function} done - Callback function with error, data params
 */
const getLanguageLabel = function(requestParam, done) {
    if (requestParam.label_id) {
        query.selectWithAndOne(dbConstants.dbSchema.languageLabels, requestParam, function(error, languageLabel) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.languageLabels);
                done(error, null);
                return;
            }
            let columnAndValues;
            columnAndValues = {
                'id': languageLabel.label_id,
                'label_id': languageLabel.label_id,
                'title': languageLabel.title,
                'code': languageLabel.code,
                'type': languageLabel.type,
                'value': languageLabel.value,
                'status': languageLabel.status
            };
            query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
                async.forEachSeries(languages, function(singleLan, Callback_s1) {
                    if (_.has(languageLabel.value, singleLan.code)) {
                        columnAndValues[singleLan.code] = languageLabel.value[singleLan.code];
                        Callback_s1();
                    } else {
                        Callback_s1();
                    }
                }, function() {
                    done(null, columnAndValues);
                });
            });
        });
    } else {
        query.selectWithAndFilter(dbConstants.dbSchema.languageLabels, {}, {}, { created_date: -1 }, {}, function(error, languages) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.languageLabels);
                done(error, null);
                return;
            }
            let columnAndValues = [];
            async.forEachSeries(languages, function(singleLan, Callback_s1) {
                columnAndValues.push({
                    'id': singleLan.label_id,
                    'label_id': singleLan.label_id,
                    'title': singleLan.title,
                    'type': singleLan.type,
                    'code': singleLan.code,
                    'value': singleLan.value,
                    'created_date': singleLan.created_date,
                    'status': singleLan.status
                });
                Callback_s1();
            }, function() {
                done(null, columnAndValues);
            });
        });
        // query.selectWithAnd(dbConstants.dbSchema.languageLabels, function (error, languages) {
        // 	if (error) {
        // 		logger('Error: can not get language', dbConstants.dbSchema.languageLabels);
        // 		done(error, null);
        // 		return;
        // 	}
        // 	let columnAndValues=[];
        // 	async.forEachSeries(languages, function(singleLan, Callback_s1) {
        // 		columnAndValues.push({
        // 			'id':singleLan.label_id,
        // 			'label_id':singleLan.label_id,
        // 			'title':singleLan.title,
        // 			'type':singleLan.type,
        // 			'code':singleLan.code,
        // 			'status':singleLan.status
        // 		});
        // 		Callback_s1();
        // 	},function(){
        // 		done(null,columnAndValues);
        // 	});
        // });
    }
};

/*
 * Used to create administrator 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createLanguageLabel = function(requestParam, done) {
    let value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
        async.forEachSeries(languages, function(singleLan, Callback_s1) {
            if (_.has(requestParam, singleLan.code)) {
                value[singleLan.code] = requestParam[singleLan.code];
                Callback_s1();
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesLabels = {
                title: requestParam.title,
                code: requestParam.code,
                'type': requestParam.type,
                value: value,
                status: requestParam.status
            }
            query.insertSingle(dbConstants.dbSchema.languageLabels, columnAndValuesLabels, function(error, languageLabel) {
                if (error) {
                    logger('Error: can not create languageLabel');
                    done(error, null);
                    return;
                }
                done(null, languageLabel);
            });
        });
    });
};


/*
 * Used to active language by id 
 * @param {vehicleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeLanguage = function(vehicleDetails, done) {
    let columnsToUpdate = {
        status: languageConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.languages, columnsToUpdate, { 'language_id': { $in: vehicleDetails } }, function(error, language) {
        if (error) {
            logger('Error: can not update language');
            done(error, null);
            return;
        }
        done(null, language);
    });
};

/*
 * Used to inactive language by id 
 * @param {vehicleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveLanguage = function(vehicleDetails, done) {
    let columnsToUpdate = {
        status: languageConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.languages, columnsToUpdate, { 'language_id': { $in: vehicleDetails } }, function(error, language) {
        if (error) {
            logger('Error: can not update language');
            done(error, null);
            return;
        }
        done(null, language);
    });
};

/*
 * Used to delete language by id 
 * @param {vehicleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteLanguage = function(vehicleDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.languages, { 'language_id': { $in: vehicleDetails } }, function(error, language) {
        if (error) {
            logger('Error: can not delete language');
            done(error, null);
            return;
        }
        done(null, language);
    });
};


/*
 * Used to update language by id 
 * @param {languageDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateLanguage = function(languageDetails, done) {
    query.updateSingle(dbConstants.dbSchema.languages, languageDetails, { 'language_id': languageDetails.language_id }, function(error, language) {
        if (error) {
            logger('Error: can not update language');
            done(error, null);
            return;
        }
        done(null, language);
    });
};


/*
 * Used to active languagelabel by id 
 * @param {vehicleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeLanguageLabel = function(vehicleDetails, done) {
    let columnsToUpdate = {
        status: languageConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.languageLabels, columnsToUpdate, { 'label_id': { $in: vehicleDetails } }, function(error, languagelabel) {
        if (error) {
            logger('Error: can not update languagelabel');
            done(error, null);
            return;
        }
        done(null, languagelabel);
    });
};

/*
 * Used to inactive languagelabel by id 
 * @param {vehicleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveLanguageLabel = function(vehicleDetails, done) {
    let columnsToUpdate = {
        status: languageConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.languageLabels, columnsToUpdate, { 'label_id': { $in: vehicleDetails } }, function(error, languagelabel) {
        if (error) {
            logger('Error: can not update languagelabel');
            done(error, null);
            return;
        }
        done(null, languagelabel);
    });
};

/*
 * Used to delete languagelabel by id 
 * @param {vehicleDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteLanguageLabel = function(vehicleDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.languageLabels, { 'label_id': { $in: vehicleDetails } }, function(error, languagelabel) {
        if (error) {
            logger('Error: can not delete languagelabel');
            done(error, null);
            return;
        }
        done(null, languagelabel);
    });
};


/*
 * Used to update languagelabel by id 
 * @param {languageDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateLanguageLabel = function(languageDetails, done) {
    let value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
        async.forEachSeries(languages, function(singleLan, Callback_s1) {
            if (_.has(languageDetails, singleLan.code)) {
                value[singleLan.code] = languageDetails[singleLan.code];
                Callback_s1();
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesLabels = {
                label_id: languageDetails.label_id,
                title: languageDetails.title,
                code: languageDetails.code,
                type: languageDetails.type,
                value: value,
                status: languageDetails.status
            }
            query.updateSingle(dbConstants.dbSchema.languageLabels, columnAndValuesLabels, { 'label_id': languageDetails.label_id }, function(error, languagelabel) {
                if (error) {
                    logger('Error: can not update languagelabel');
                    done(error, null);
                    return;
                }
                done(null, languagelabel);
            });
        });
    });
};


/*
 * Used to get administrators with params
 * @param {Function} done - Callback function with error, data params
 */
const getLabel = function(requestParam, done) {
    query.selectWithAndOne(dbConstants.dbSchema.languages, { language_id: requestParam.language_id }, function(error, language) {
        if (error) {
            logger('Error: can not get language', dbConstants.dbSchema.languages);
            done(error, null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.languageLabels, { type: requestParam.type }, function(error, languageLabels) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.languageLabels);
                done(error, null);
                return;
            }
            let columnAndValues = [];
            async.forEachSeries(languageLabels, function(singleLan, Callback_s1) {
                columnAndValues.push({
                    'id': singleLan.label_id,
                    'label_id': singleLan.label_id,
                    'title': singleLan.title,
                    'code': singleLan.code,
                    'value': singleLan.value ? singleLan.value[language.code] ? singleLan.value[language.code] : "" : ""
                });
                Callback_s1();
            }, function() {
                if (requestParam.haribhagat_id) {
                    query.updateSingle(dbConstants.dbSchema.haribhagats, { language_id: requestParam.language_id }, { haribhagat_id: requestParam.haribhagat_id }, function(error, languagelabel) {
                        if (error) {
                            logger('Error: can not update languagelabel');
                            done(error, null);
                            return;
                        }
                        done(null, columnAndValues);
                    });
                } else if (requestParam.admin_id) {
                    query.updateSingle(dbConstants.dbSchema.admins, { language_id: requestParam.language_id }, { admin_id: requestParam.admin_id }, function(error, languagelabel) {
                        if (error) {
                            logger('Error: can not update languagelabel');
                            done(error, null);
                            return;
                        }
                        done(null, columnAndValues);
                    });
                } else {
                    done(null, columnAndValues);
                }
            });
        });
    });
};


module.exports = {
    getLanguage: getLanguage,
    getLanguageLabel: getLanguageLabel,
    createLanguage: createLanguage,
    createLanguageLabel: createLanguageLabel,
    activeLanguage: activeLanguage,
    inactiveLanguage: inactiveLanguage,
    deleteLanguage: deleteLanguage,
    updateLanguage: updateLanguage,
    activeLanguageLabel: activeLanguageLabel,
    inactiveLanguageLabel: inactiveLanguageLabel,
    deleteLanguageLabel: deleteLanguageLabel,
    updateLanguageLabel: updateLanguageLabel,
    getLabel: getLabel,
    getLanguageBackend
};
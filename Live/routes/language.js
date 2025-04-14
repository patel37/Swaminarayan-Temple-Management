'use strict';

const responseCodes =  require('./../helpers/response-codes');
const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const languageHandler = require('./../model_handlers/language-handler');
const moment = require('moment');
const async = require('async');

/**
 * Create language in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-language', function (req, res) {
	if (!_.has(req.body, 'title') || !_.has(req.body, 'code')) {
		logger('Parameter Missing : can not create language');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	languageHandler.createLanguage(req.body,function (error, language) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), language);
	});
});


/**
 * Create language label in the database.
 *
 * The request body should include the name , username , password
 */
router.post('/create-language-label', function (req, res) {
	if (!_.has(req.body, 'title') || !_.has(req.body, 'code')) {
		logger('Parameter Missing : can not create language');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	languageHandler.createLanguageLabel(req.body,function (error, language) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), language);
	});
});


/**
 * get language label in the database.
 *
 * using get method
 */
router.post('/get-language-label', function (req, res) {
	languageHandler.getLanguageLabel(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * get language in the database.
 *
 * using get method
 */
router.post('/get-language', function (req, res) {
	languageHandler.getLanguage(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});

/**
 * get language in the database.
 *
 * using get method
 */
router.post('/get-language-backend', function (req, res) {
	languageHandler.getLanguageBackend(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * active language in the database.
 *
 * using post method
 */
router.post('/active-language', function (req, res) {
	languageHandler.activeLanguage(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * inactive language in the database.
 *
 * using post method
 */
router.post('/inactive-language', function (req, res) {
	languageHandler.inactiveLanguage(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * delete language in the database.
 *
 * using post method
 */
router.post('/delete-language', function (req, res) {
	languageHandler.deleteLanguage(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * update language in the database.
 *
 * using post method
 */
router.post('/update-language', function (req, res) {
	languageHandler.updateLanguage(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});

/**
 * active language-label in the database.
 *
 * using post method
 */
router.post('/active-language-label', function (req, res) {
	languageHandler.activeLanguageLabel(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * inactive language-label in the database.
 *
 * using post method
 */
router.post('/inactive-language-label', function (req, res) {
	languageHandler.inactiveLanguageLabel(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * delete language-label in the database.
 *
 * using post method
 */
router.post('/delete-language-label', function (req, res) {
	languageHandler.deleteLanguageLabel(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * update language-label in the database.
 *
 * using post method
 */
router.post('/update-language-label', function (req, res) {
	languageHandler.updateLanguageLabel(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/**
 * get language-label in the database.
 *
 * using post method
 */
router.post('/get-label', function (req, res) {
	languageHandler.getLabel(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


module.exports = router;
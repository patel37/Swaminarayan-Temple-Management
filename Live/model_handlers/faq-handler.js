'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const faqConstants = require('./../constants/faq-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Faq_Category = require('./../models/faq-category');
const Faq = require('./../models/faq');
const Language = require('./../models/language');
const fs = require('file-system');
const config = require('./../config');
var url = require('url');

const S3Handler = require('./../utils/s3-handler');
const s3Handler = new S3Handler();
let bucketName = config.aws.s3.staticPagesBucket + '/cab-app/faq';
var striptags = require('striptags');

let asset_path = config.assets_info.asset_path;
let asset_url = config.assets_info.asset_url;



/*
 * Used to get get faqCategory with params
 * @param {Function} done - Callback function with error, data params
 */
const getFaqCategory = function(requestParam, done) {
    if (requestParam.faq_category_id) {
        query.selectWithAndOne(dbConstants.dbSchema.faq_categories, requestParam, function(error, faqs) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.languageLabels);
                done(error, null);
                return;
            }
            let columnAndValues;
            columnAndValues = {
                'id': faqs.faq_category_id,
                'faq_category_id': faqs.faq_category_id,
                'title': faqs.title,
                'role': faqs.role,
                'value': faqs.value,
                'categoryWithRole': faqs.role + "-" + faqs.title,
                'status': faqs.status
            };
            query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
                async.forEachSeries(languages, function(singleLan, Callback_s1) {
                    if (_.has(faqs.value, singleLan.code)) {
                        columnAndValues[singleLan.code] = faqs.value[singleLan.code];
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
        query.selectWithAnd(dbConstants.dbSchema.faq_categories, function(error, faqs) {
            if (error) {
                logger('Error: can not get faqs', dbConstants.dbSchema.faqs);
                done(error, null);
                return;
            }
            let columnsAndValues = [];
            for (var i = 0; i < faqs.length; i++) {
                columnsAndValues.push({
                    'id': faqs[i].faq_category_id,
                    'faq_category_id': faqs[i].faq_category_id,
                    'title': faqs[i].title,
                    'role': faqs[i].role,
                    'categoryWithRole': faqs[i].role + " - " + faqs[i].title,
                    'status': faqs[i].status
                });
            }
            done(null, columnsAndValues);
        });
    }
};


/*
 * Used to create faqCategory 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createFaqCategory = function(requestParam, done) {
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
                role: requestParam.role,
                value: value,
                status: requestParam.status
            }
            query.insertSingle(dbConstants.dbSchema.faq_categories, columnAndValuesLabels, function(error, faq) {
                if (error) {
                    logger('Error: can not create faq');
                    done(error, null);
                    return;
                }
                done(null, faq);
            });
        });
    });
};

/*
 * Used to update faqCategory by id 
 * @param {faqCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateFaqCategory = function(faqCategoryDetails, done) {
    let value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
        async.forEachSeries(languages, function(singleLan, Callback_s1) {
            if (_.has(faqCategoryDetails, singleLan.code)) {
                value[singleLan.code] = faqCategoryDetails[singleLan.code];
                Callback_s1();
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesFaqCategory = {
                faq_category_id: faqCategoryDetails.faq_category_id,
                title: faqCategoryDetails.title,
                role: faqCategoryDetails.role,
                value: value,
                status: faqCategoryDetails.status
            }
            query.updateSingle(dbConstants.dbSchema.faq_categories, columnAndValuesFaqCategory, { 'faq_category_id': faqCategoryDetails.faq_category_id }, function(error, faqCategory) {
                if (error) {
                    logger('Error: can not update faqCategory');
                    done(error, null);
                    return;
                }
                done(null, faqCategory);
            });
        });
    });
};



/*
 * Used to active faqCategory by id 
 * @param {faqCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeFaqCategory = function(faqCategoryDetails, done) {
    let columnsToUpdate = {
        status: faqConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.faq_categories, columnsToUpdate, { 'faq_category_id': { $in: faqCategoryDetails } }, function(error, faqCategory) {
        if (error) {
            logger('Error: can not update faqCategory');
            done(error, null);
            return;
        }
        done(null, faqCategory);
    });
};

/*
 * Used to inactive faqCategory by id 
 * @param {faqCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveFaqCategory = function(faqCategoryDetails, done) {
    let columnsToUpdate = {
        status: faqConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.faq_categories, columnsToUpdate, { 'faq_category_id': { $in: faqCategoryDetails } }, function(error, faqCategory) {
        if (error) {
            logger('Error: can not update faqCategory');
            done(error, null);
            return;
        }
        done(null, faqCategory);
    });
};

/*
 * Used to delete faqCategory by id 
 * @param {faqCategoryDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteFaqCategory = function(faqCategoryDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.faq_categories, { 'faq_category_id': { $in: faqCategoryDetails } }, function(error, faqCategory) {
        if (error) {
            logger('Error: can not delete faqCategory');
            done(error, null);
            return;
        }
        done(null, faqCategory);
    });
};


/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getFaq = function(requestParam, done) {
    if (requestParam.faq_id) {
        query.selectWithAndOne(dbConstants.dbSchema.faqs, requestParam, function(error, faqs) {
            if (error) {
                logger('Error: can not get faqs', dbConstants.dbSchema.faqs);
                done(error, null);
                return;
            }
            let columnsAndValues = {
                'id': faqs.faq_id,
                'faq_id': faqs.faq_id,
                'faq_category_id': faqs.faq_category_id,
                'question': faqs.question,
                'ans': faqs.ans,
                'status': faqs.status,
                'link':faqs.link
            };
            query.selectWithAnd(dbConstants.dbSchema.languages, function(error, languages) {
                async.forEachSeries(languages, function(singleLan, Callback_s1) {
                    if (_.has(faqs.question, singleLan.code) && _.has(faqs.ans, singleLan.code)) {
                        columnsAndValues[singleLan.code] = faqs.question[singleLan.code];
                        columnsAndValues["ans_" + singleLan.code] = faqs.ans[singleLan.code];
                        Callback_s1();
                    } else {
                        Callback_s1();
                    }
                }, function() {
                    done(null, columnsAndValues);
                });
            });
        });
    } else {
        let joinArr = [{
            $lookup: {
                from: 'faq_categories',
                localField: 'faq_category_id',
                foreignField: 'faq_category_id',
                as: 'faqDetails'
            }
        }, {
            $project: {
                _id: 0,
                id: "$faq_id",
                faq_id: "$faq_id",
                faq_category_id: "$faq_category_id",
                question: "$question",
                ans: "$ans",
                status: "$status",
                faq_category: "$faqDetails.title"
            }
        }];
        query.joinWithAnd(dbConstants.dbSchema.faqs, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            for (var i = 0; i < response.length; i++) {
                response[i].question = response[i].question['EN'];
                response[i].ans = response[i].ans['EN'];
            }
            done(null, response)
        });
      
    }
};


/*
 * Used to create faq 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createFaq = function(requestParam, done) {
    let question = new Object();
    let ans = new Object();
    let link = new Object();
    let columnAndValuesFaqs = {
               status: 'Active'
    }
    query.selectWithAnd(dbConstants.dbSchema.languages,columnAndValuesFaqs, function(error, languages) {
        async.forEachSeries(languages, function(singleLan, Callback_s1) {
            let fileName = Math.floor(Math.random() * 8999999 + 10000) + ".html";
            if (_.has(requestParam, singleLan.code) && _.has(requestParam, "ans_" + singleLan.code)) {
                question[singleLan.code] = requestParam[singleLan.code];
                ans[singleLan.code] = requestParam["ans_" + singleLan.code];
                let ansTemplate;
                ansTemplate = fs.readFileSync('./public/faq_ans_pages/faq_ans.html', "utf8");
                ansTemplate = ansTemplate.replace('#CONTENT#', requestParam["ans_" + singleLan.code]);
                ansTemplate = ansTemplate.replace(/&lt;/g, '<');
                ansTemplate = ansTemplate.replace(/&gt;/g, '>');
                ansTemplate = ansTemplate.replace(/&quot;/g, '"');
                ansTemplate = ansTemplate.replace(/&ldquo;/g, '"');
                ansTemplate = ansTemplate.replace(/&rdquo;/g, '"');
                fs.writeFile(fileName, ansTemplate, function(err) {
                fs.copyFileSync(fileName, asset_path+'/assets/'+fileName, {
                       process: function(ansTemplate) {
                link[singleLan.code] = asset_url+fileName;
                          return ansTemplate;
                       }
                    })
                Callback_s1();
                })
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesFaqs = {
                faq_category_id: requestParam.faq_category_id,
                status: requestParam.status,
                question: question,
                ans: ans,
                link: link
            }
            query.insertSingle(dbConstants.dbSchema.faqs, columnAndValuesFaqs, function(error, faq) {
                if (error) {
                    logger('Error: can not create faq');
                    done(error, null);
                    return;
                }
                done(null, faq);
            });
        });
    });
};

/*
 * Used to update faq by id 
 * @param {faqDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateFaq = function(faqDetails, done) {
    let question = new Object();
    let ans = new Object();
    let link = new Object();
      let columnAndValuesFaqs = {
               status: 'Active'
    }
    let links = faqDetails.link;
    for (var k in links){
        if (links.hasOwnProperty(k)) {
            var q = url.parse(links[k], true);
            if (fs.existsSync(asset_path+q.pathname)) {

                fs.unlink(asset_path+q.pathname, function(error) {
                    if (error) {
                        throw error;
                    }
                    console.log('Deleted!!');
                });
             }
        // console.log("Key is " + k + ", value is " + links[k]);
        }
    }
    query.selectWithAnd(dbConstants.dbSchema.languages,columnAndValuesFaqs, function(error, languages) {
        async.forEachSeries(languages, function(singleLan, Callback_s1) {
            let fileName = Math.floor(Math.random() * 8999999 + 10000) + ".html";
            if (_.has(faqDetails, singleLan.code) && _.has(faqDetails, "ans_" + singleLan.code)) {
                question[singleLan.code] = faqDetails[singleLan.code];
                ans[singleLan.code] = faqDetails["ans_" + singleLan.code];

                let ansTemplate;
                ansTemplate = fs.readFileSync('./public/faq_ans_pages/faq_ans.html', "utf8");
                ansTemplate = ansTemplate.replace('#CONTENT#', faqDetails["ans_" + singleLan.code]);
                ansTemplate = ansTemplate.replace(/&lt;/g, '<');
                ansTemplate = ansTemplate.replace(/&gt;/g, '>');
                ansTemplate = ansTemplate.replace(/&quot;/g, '"');
                ansTemplate = ansTemplate.replace(/&ldquo;/g, '"');
                ansTemplate = ansTemplate.replace(/&rdquo;/g, '"');
                fs.writeFile(fileName, ansTemplate, function(err) {
                fs.copyFileSync(fileName, asset_path+'/assets/'+fileName, {
                           process: function(ansTemplate) {
                  link[singleLan.code] = asset_url+fileName;
                              return ansTemplate;
                           }
                        })
                Callback_s1();
                })
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesFaqs = {
                faq_id: faqDetails.faq_id,
                faq_category_id: faqDetails.faq_category_id,
                question: question,
                ans: ans,
                link: link,
                status: faqDetails.status
            }
            query.updateSingle(dbConstants.dbSchema.faqs, columnAndValuesFaqs, { 'faq_id': faqDetails.faq_id }, function(error, faq) {
                if (error) {
                    logger('Error: can not update faq');
                    done(error, null);
                    return;
                }
                done(null, faq);
            });
        });
    });
};



/*
 * Used to active faq by id 
 * @param {faqDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const activeFaq = function(faqDetails, done) {
    let columnsToUpdate = {
        status: faqConstants.status.active
    };
    query.updateMultiple(dbConstants.dbSchema.faqs, columnsToUpdate, { 'faq_id': { $in: faqDetails } }, function(error, faq) {
        if (error) {
            logger('Error: can not update faq');
            done(error, null);
            return;
        }
        done(null, faq);
    });
};

/*
 * Used to inactive faq by id 
 * @param {faqDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const inactiveFaq = function(faqDetails, done) {
    let columnsToUpdate = {
        status: faqConstants.status.inactive
    };
    query.updateMultiple(dbConstants.dbSchema.faqs, columnsToUpdate, { 'faq_id': { $in: faqDetails } }, function(error, faq) {
        if (error) {
            logger('Error: can not update faq');
            done(error, null);
            return;
        }
        done(null, faq);
    });
};

/*
 * Used to delete faq by id 
 * @param {faqDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteFaq = function(faqDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.faqs, { 'faq_id': { $in: faqDetails } }, function(error, faq) {
        if (error) {
            logger('Error: can not delete faq');
            done(error, null);
            return;
        }
        done(null, faq);
    });
};


/*
 * Used to get get faqCategory with params
 * @param {Function} done - Callback function with error, data params
 */
const getFaqCategories = function(requestParam, done) {
    let columnAndValuesLan = {
        language_id: requestParam.language_id
    }
    let columnAndValuesFaqs = {
        role: requestParam.role.charAt(0).toUpperCase() + requestParam.role.slice(1),
        status: 'Active'
    }
    query.selectWithAndOne(dbConstants.dbSchema.languages, columnAndValuesLan, function(error, language) {
        if (error) {
            logger('Error: can not get language', dbConstants.dbSchema.languages);
            done(error, null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.faq_categories, columnAndValuesFaqs, function(error, faqs) {
            if (error) {
                logger('Error: can not get language', dbConstants.dbSchema.faqs);
                done(error, null);
                return;
            }
            let columnAndValues = [];
            async.forEachSeries(faqs, function(singleRec, Callback_s1) {
                columnAndValues.push({
                    'id': singleRec.faq_category_id,
                    'faq_category_id': singleRec.faq_category_id,
                    'title': singleRec.title,
                    'role': singleRec.role,
                    'value': singleRec.value[language.code]
                });
                Callback_s1();
            }, function() {
                done(null, columnAndValues);
            });
        });
    });
};


/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getFaqs = function(requestParam, req, done) {
    let columnAndValuesLan = {
        language_id: requestParam.language_id
    }
    let columnAndValuesFaq = {
        faq_category_id: requestParam.faq_category_id,
        status: 'Active'
    }
    query.selectWithAndOne(dbConstants.dbSchema.languages, columnAndValuesLan, function(error, language) {
        if (error) {
            logger('Error: can not get language', dbConstants.dbSchema.languages);
            done(error, null);
            return;
        }
        query.selectWithAndOne(dbConstants.dbSchema.faq_categories, columnAndValuesFaq, function(error, faq_categories) {
            query.selectWithAnd(dbConstants.dbSchema.faqs, columnAndValuesFaq, function(error, faqs) {
                if (error) {
                    logger('Error: can not get language', dbConstants.dbSchema.faqs);
                    done(error, null);
                    return;
                }
                let columnAndValues = [];
                async.forEachSeries(faqs, function(singleRec, Callback_s1) {
                    let answer;
                    columnAndValues.push({
                        'id': singleRec.faq_category_id,
                        'faq_category_id': singleRec.faq_category_id,
                        'question': singleRec.question[language.code],
                        'answer': singleRec.link[language.code],
                        'text': striptags(singleRec.ans[language.code]),
                        'title': faq_categories.value[language.code]
                    });
                    Callback_s1();
                }, function() {
                    done(null, columnAndValues);
                });
            });
        });
    });
};

function generateFullURL(imgName) {
    if (imgName) { return config.AWS_BASE_URL + "/" + bucketName + "/" + imgName }
}

function getImageNameFromURL(URL) {
    if (URL) {
        var mainImageUploadURL = URL; //uploadPhoto = AWS return object 
        var normalImageUploadURL = mainImageUploadURL.lastIndexOf('/');
        var finalImageURL = mainImageUploadURL.substring(normalImageUploadURL + 1);
        return finalImageURL;
    }
}


module.exports = {
    getFaqCategory: getFaqCategory,
    createFaqCategory: createFaqCategory,
    updateFaqCategory: updateFaqCategory,
    activeFaqCategory: activeFaqCategory,
    inactiveFaqCategory: inactiveFaqCategory,
    deleteFaqCategory: deleteFaqCategory,
    getFaq: getFaq,
    createFaq: createFaq,
    updateFaq: updateFaq,
    activeFaq: activeFaq,
    inactiveFaq: inactiveFaq,
    deleteFaq: deleteFaq,
    getFaqCategories: getFaqCategories,
    getFaqs: getFaqs
};
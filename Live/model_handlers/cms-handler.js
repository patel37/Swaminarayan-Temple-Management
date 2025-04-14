'use strict';

const logger = require('./../utils/logger');
const jsonResponse = require('./../utils/json-response');
const errors = require('./../utils/dz-errors');
const dbConstants = require('./../constants/db-constants');
const cmsConstants = require('./../constants/city-constants');
const query = require('./../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const CMS = require('./../models/cms');
const fs = require('file-system');
const path = require('path');
const config = require('./../config');

const S3Handler = require('./../utils/s3-handler');
const s3Handler = new S3Handler();

var url = require('url');
let bucketName = config.aws.s3.staticPagesBucket;
let asset_path = config.assets_info.asset_path;
let asset_url = config.assets_info.asset_url;


/*
 * Used to get get faq with params
 * @param {Function} done - Callback function with error, data params
 */
const getCms = function(requestParam, done) {
    if (requestParam.cms_id) {
        query.selectWithAndOne(dbConstants.dbSchema.cms, requestParam, function(error, CMS) {
            if (error) {
                logger('Error: can not get CMS', dbConstants.dbSchema.cms);
                done(error, null);
                return;
            }
            let columnsAndValues = {
                'id': CMS.cms_id,
                'cms_id': CMS.cms_id,
                'description': CMS.description,
                'title': CMS.title,
                'code': CMS.code,
                'role': CMS.role,
                'status': CMS.status,
                 'link':CMS.link
            };
            query.selectWithAnd(dbConstants.dbSchema.languages, {}, function(error, languages) {
                async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
                    if (_.has(CMS.description, singleLanguage.code)) {
                        columnsAndValues["ans_" + singleLanguage.code] = CMS.description[singleLanguage.code];
                        columnsAndValues[singleLanguage.code] = CMS.title[singleLanguage.code];
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
        query.selectWithAnd(dbConstants.dbSchema.cms, {}, function(error, CMS) {
            if (error) {
                logger('Error: can not get CMS', dbConstants.dbSchema.cms);
                done(error, null);
                return;
            }
            let columnsAndValues = [];
            for (var i = 0; i < CMS.length; i++) {
                columnsAndValues.push({
                    'id': CMS[i].cms_id,
                    'cms_id': CMS[i].cms_id,
                    'title': CMS[i].title['EN'],
                    'role': CMS[i].role,
                    'code': CMS[i].code
                });
            }

            done(null, columnsAndValues);
        });
    }
};


/*
 * Used to create cms 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const createCms = function(requestParam, req, done) {
    let description = new Object();
    let title = new Object();
    let link = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, { status: 'Active' }, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            let fileName = requestParam.role + '_' + requestParam.code + '_' + singleLanguage.code + ".html";
            if (_.has(requestParam, "ans_" + singleLanguage.code)) {
                description[singleLanguage.code] = requestParam["ans_" + singleLanguage.code];
                title[singleLanguage.code] = requestParam[singleLanguage.code];
                let ansTemplate;
                ansTemplate = fs.readFileSync('./public/cms_pages/cms.html', "utf8");
                ansTemplate = ansTemplate.replace('#TITLE#', requestParam[singleLanguage.code]);
                ansTemplate = ansTemplate.replace('#CONTENT#', requestParam["ans_" + singleLanguage.code]);
                ansTemplate = ansTemplate.replace(/&lt;/g, '<');
                ansTemplate = ansTemplate.replace(/&gt;/g, '>');
                ansTemplate = ansTemplate.replace(/&quot;/g, '"');
                ansTemplate = ansTemplate.replace(/&ldquo;/g, '"');
                ansTemplate = ansTemplate.replace(/&rdquo;/g, '"');
                console.log("asset_path + '/assets/' + fileName----", asset_path + 'assets/' + fileName);
                 fs.writeFile(fileName, ansTemplate, function(err) {
                fs.copyFileSync(fileName, asset_path+'assets/'+fileName, {
                       process: function(ansTemplate) {
                link[singleLanguage.code] = asset_url+fileName;
                          return ansTemplate;
                       }
                    })
                Callback_s1();
                })
               
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesCMS = {
                role: requestParam.role,
                code: requestParam.code,
                status: requestParam.status,
                title: title,
                description: description,
                link: link
            }
            console.log(link)
            query.insertSingle(dbConstants.dbSchema.cms, columnAndValuesCMS, function(error, cms) {
                if (error) {
                    logger('Error: can not create cms');
                    done(error, null);
                    return;
                }
                done(null, cms);
            });
        });
    });
};


/*
 * Used to update cms by id 
 * @param {faqDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const updateCms = function(cmsDetails, req, done) {
    let description = new Object();
    let title = new Object();
    let link = new Object();
     let links = cmsDetails.link;
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
    query.selectWithAnd(dbConstants.dbSchema.languages, { status: 'Active' }, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            let fileName = cmsDetails.role + '_' + cmsDetails.code + '_' + singleLanguage.code + ".html";
            if (_.has(cmsDetails, "ans_" + singleLanguage.code)) {
                description[singleLanguage.code] = cmsDetails["ans_" + singleLanguage.code];
                title[singleLanguage.code] = cmsDetails[singleLanguage.code];

                let ansTemplate;
                ansTemplate = fs.readFileSync('./public/cms_pages/cms.html', "utf8");
                ansTemplate = ansTemplate.replace('#TITLE#', cmsDetails[singleLanguage.code]);
                ansTemplate = ansTemplate.replace('#CONTENT#', cmsDetails["ans_" + singleLanguage.code]);
                ansTemplate = ansTemplate.replace(/&lt;/g, '<');
                ansTemplate = ansTemplate.replace(/&gt;/g, '>');
                ansTemplate = ansTemplate.replace(/&quot;/g, '"');
                ansTemplate = ansTemplate.replace(/&ldquo;/g, '"');
                ansTemplate = ansTemplate.replace(/&rdquo;/g, '"');
                console.log("asset path")
                console.log(asset_path + 'assets/' + fileName)
                  fs.writeFile(fileName, ansTemplate, function(err) {
                fs.copyFileSync(fileName, asset_path+'assets/'+fileName, {
                           process: function(ansTemplate) {
                  link[singleLanguage.code] = asset_url+fileName;
                              return ansTemplate;
                           }
                        })
                Callback_s1();
                })
               
            } else {
                Callback_s1();
            }
        }, function() {
            let columnAndValuesCMS = {
                role: cmsDetails.role,
                code: cmsDetails.code,
                status: cmsDetails.status,
                title: title,
                description: description,
                link: link
            }
            console.log(link)
            query.updateSingle(dbConstants.dbSchema.cms, columnAndValuesCMS, {
                'cms_id': cmsDetails.cms_id
            }, function(error, cms) {
                if (error) {
                    logger('Error: can not update cms');
                    done(error, null);
                    return;
                }
                done(null, cms);
            });
        });
    });
};

/*
 * Used to delete cms by id 
 * @param {cmsDetails} - Object
 * @param {Function} done - Callback function with error, data params
 */
const deleteCms = function(cmsDetails, done) {
    query.removeMultiple(dbConstants.dbSchema.cms, {
        'cms_id': {
            $in: cmsDetails
        }
    }, function(error, cms) {
        if (error) {
            logger('Error: can not delete cms');
            done(error, null);
            return;
        }
        done(null, cms);
    });
};


/*
 * Used to get getCmsLink with params
 * @param {Function} done - Callback function with error, data params
 */
const getCmsLink = function(requestParam, req, done) {
    query.selectWithAndOne(dbConstants.dbSchema.languages, requestParam, function(error, language) {
        if (error) {
            logger('Error: can not get language', dbConstants.dbSchema.languages);
            done(error, null);
            return;
        }
        query.selectWithAnd(dbConstants.dbSchema.cms, function(error, cms) {
            if (error) {
                logger('Error: can not get cms', dbConstants.dbSchema.cms);
                done(error, null);
                return;
            }
            let columnsAndValuesCMSs = new Object();
            let columnsAndValuesConsumer = [];
            let columnsAndValuesDriver = [];

            async.forEachSeries(cms, function(singleCMS, Callback_s1) {
                if (singleCMS.role == 'consumer') {
                    columnsAndValuesConsumer.push({
                        'cms_id': singleCMS.cms_id,
                        'code': singleCMS.code,
                        'link': singleCMS.link[language.code]?singleCMS.link[language.code]:"",
                    });
                    Callback_s1();
                } else {
                    columnsAndValuesDriver.push({
                        'cms_id': singleCMS.cms_id,
                        'code': singleCMS.code,
                        'link': singleCMS.link[language.code]?singleCMS.link[language.code]:"",
                    });
                    Callback_s1();
                }
            }, function() {
                columnsAndValuesCMSs.consumer = columnsAndValuesConsumer;
                columnsAndValuesCMSs.driver = columnsAndValuesDriver;
                done(null, columnsAndValuesCMSs);
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
    getCms: getCms,
    createCms: createCms,
    updateCms: updateCms,
    deleteCms: deleteCms,
    getCmsLink: getCmsLink
};
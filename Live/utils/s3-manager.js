const config = require('../config');
const logger = require('./logger');
const errors = require('./dz-errors');
const S3Handler = require('./s3-handler');
const dbConstants = require('../constants/db-constants');
const moment = require('moment');
const s3Handler = new S3Handler();

/*
 * Common function for upload file Object in aws s3 bucket
 * @param {requestParam} - request parameters from body will be fileObject +
 *                         bucketName +  and id(for fileName)
 * @param {Function} done - Callback function with error, data params
 */
const uploadFileObj = function(fileObject, bucketName, done) {
    let location;
    const fileExtLower = fileObject.name.split('.').pop().toLowerCase();
    let fileName = Math.random().toString(36).substring(5) + moment().unix();
    fileName = `${fileName}.${fileExtLower}`;
    fileObject.file_name = fileName;
    s3Handler.upload(fileObject, bucketName, fileExtLower, (errS3FileUpload, mediaObjRes) => {
        if (errS3FileUpload) {
            logger('Error: failed to Upload ', +fileName + ' Failed with error:', errS3FileUpload);
            done(errS3FileUpload, null);
            return;
        }
        location = mediaObjRes.Location;
        done(null, location);
    });
};

/*
 * Common function for remove image from aws s3 bucket
 * @param {requestParam} - request parameters from body will be filename + bucket name
 * @param {Function} done - Callback function with error, data params
 */
const removeFileObj = (photo, bucketName, done) => {
    const fileName = /[^/]*$/.exec(photo)[0];
    s3Handler.deleteFile(fileName, bucketName, (errS3FileDelete, mediaRemoveRes) => {
        if (errS3FileDelete) {
            done(errors.internalServer(true), null);
            return;
        } else {
            done(null, mediaRemoveRes);
        }
    });
};

/*
 * Common function for remove image from aws s3 bucket
 * @param {requestParam} - request parameters from body will be filename + bucket name
 * @param {Function} done - Callback function with error, data params
 * deleting multiple images from bucket
 */

const removeMultiImages = (photos, bucketName) => {
    return new Promise(async(resolve, reject) => {
        try {
            const asyncForEach = async(array, callback) => {
                for (let index = 0; index < array.length; index++) {
                    await callback(array[index], index, array)
                }
            }
            const start = async() => {
                await asyncForEach(photos, async(imagename) => {
                    s3Handler.deleteFile(imagename, bucketName, (errS3FileDelete, mediaRemoveRes) => {
                        if (errS3FileDelete) {
                            reject(errors.internalServer(true))
                            return;
                        } else {
                            resolve(mediaRemoveRes);
                        }
                    });
                })
            }
            start()
        } catch (error) {
            reject(errors.internalServer(true))
            return
        }
    })

};


module.exports = {
    uploadFileObj: uploadFileObj,
    removeFileObj: removeFileObj,
    removeMultiImages: removeMultiImages,
};
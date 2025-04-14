'use strict';

const responseCodes = require('../helpers/response-codes');
const logger = require('../utils/logger');
const jsonResponse = require('../utils/json-response');
const errors = require('../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const consumerConstants = require('../constants/consumer-constants');
const haribhagatHandler = require('../model_handlers/haribhagat-handler');
const moment = require('moment');
const async = require('async');
const path = require('path')
const fs = require('file-system')


/**
 * Get Haribhagat from the database.
 *
 * Using get method
 */
router.post('/get-haribhagat', function(req, res) {
    haribhagatHandler.getHaribhagat(req.body, req, function(error, haribhagats) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), haribhagats);
    });
});

router.get('/get-haribhagat-by-haribhagatid', function(req, res) {
    console.log("req-----", req.query);
    if (!_.has(req.query, 'page')) {
        logger('Parameter Missing: Page and Limit are required');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
        return;
    }
    
    haribhagatHandler.getHaribhagat1(req.query, res, async function (error, result) {
        if (error) {
            console.log('error', error);
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
        }
        if(req.query.printPdf){
            console.log("--------------esult.pdfViewPreference", result.pdfViewPreference);
            res.set('Content-Type', 'application/pdf');
            res.set('Content-Disposition', 'attachment; filename="haribhagat_list.pdf"');
            
            // Check user preference for PDF view and call the appropriate function
            if (result.pdfViewPreference === 'grid') {
                await haribhagatHandler.gridviewHaribhagatPDF(result.data, res); // Generate grid view PDF
            } else {
                await haribhagatHandler.tableviewHaribhagatPDF(result.data, res); // Generate table view PDF
            }
            
            return;
            
        } else {
            jsonResponse(res, responseCodes.OK, errors.noError(), result);
        }     
    });
});



// router.post('/archive-Delete-consumer', function(req, res) {
//     haribhagatHandler.archiveConsumer([req.body.user_id], function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });

router.post('/send-message', async (req, res) => {
   

    haribhagatHandler.sendWhatsAppMessage(req.body, req,res, (error, response) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json({ message: 'Message sent successfully', response });
    });
});


router.post('/update-app-version-code', function(req, res) {
    if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'version_code')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.updateAppVersionCode(req.body, req, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});

router.post('/duplication-recored', function(req, res) {
    console.log("req.body",req.body)
    if (!_.has(req.body, 'haribhagat_id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.duplicationHaribhagat(req.body, res, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});

/**
 * Get Trip from the database.
 *
 * Using get method
 */
// router.post('/get-trip', function(req, res) {
//     haribhagatHandler.getTrip(req.body, function(error, haribhagats) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), haribhagats);
//     });
// });

/**
 * create Haribhagat from the database.
 *
 * Using get method
 */
router.post('/create-haribhagat', function(req, res) {
    let requestParam = req.body;
    if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'mobile') || !_.has(req.body, 'mobile_country_code')) {       
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    if(req.body.admin_id == "" || req.body.admin_id == null){
        jsonResponse(res, responseCodes.BadRequest, "admin_id is not null and valid login user_id", {});
        return;
    }
    haribhagatHandler.createConsumer(req, requestParam, function(error, haribhagats) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), haribhagats);
    });
});



/**
 * Authentication  consumer 
 *
 * The request body should include the username , password
 */
router.post('/consumer-authentication', function(req, res) {
    if (!_.has(req.body, 'mobile')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.authentication(req.body, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});


/**
 * Authentication  consumer with social
 *
 * The request body should include the email , mobile
 */
// router.post('/consumer-authentication-social', function(req, res) {
//     if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'device_type') || !_.has(req.body, 'device_token') || !_.has(req.body, 'socialmedia_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.loginWithSocial(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 * Verification of OTP 
 *
 * The request body should include the otp
 */
// router.post('/otp-verification', function(req, res) {
//     console.log("call")
//     if (!_.has(req.body, 'mobile') || !_.has(req.body, 'verification_code')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.otpVerification(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 * resend of OTP 
 *
 * The request body should include the otp
 */
// router.post('/resend-otp', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.resendOtp(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 * Get consumer profile
 *
 * The request body should include the haribhagat_id
 */
router.post('/get-consumer-profile', function(req, res) {
    if (!_.has(req.body, 'haribhagat_id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.getConsumerProfile(req.body, req, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});



/**
 * Update consumer profile
 *
 * The request body should include the haribhagat_id
 */
router.post('/update-consumer-profile', function(req, res) {
    if (!_.has(req.body, 'haribhagat_id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.updateConsumerProfile(req.body, req, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});


/**
 * Update consumer backend
 *
 * The request body should include the haribhagat_id
 */
router.post('/update-haribhagat', function(req, res) {
    haribhagatHandler.updateConsumer(req.body, req, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});

/**
 * Delete consumer account
 *
 * The request body should include the haribhagat_id
 */
router.post('/delete-account', function(req, res) {
    if (!_.has(req.body, 'haribhagat_id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.deleteAccount(req.body, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});


/**
 *Add Addresses of consumer
 *
 * The request body should include the haribhagat_id
 */
// router.post('/add-address', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'type') || !_.has(req.body, 'address') || !_.has(req.body, 'latitude') || !_.has(req.body, 'longitude')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.addAddress(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 *Delete Addresses of consumer
 *
 * The request body should include the haribhagat_id
 */
// router.post('/delete-address', function(req, res) {
//     if (!_.has(req.body, 'address_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.deleteAddress(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 *Get Addresses of consumer
 *
 * The request body should include the haribhagat_id
 */
// router.post('/get-address', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.getAddress(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 * Active consumer in the database.
 *
 * The request body should include the name , email,admin_id
 */
router.post('/active-consumer', function(req, res) {
    haribhagatHandler.activeConsumer(req.body, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});
/**
 * Archive consumer in the database.
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/archive-consumer', function(req, res) {
//     haribhagatHandler.archiveConsumer(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });

// router.post('/restore-consumer', function(req, res) {
//     haribhagatHandler.restoreArchiveConsumer(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });

/**
 * Inactive consumer in the database.
 *
 * The request body should include the name , email,admin_id
 */
router.post('/inactive-consumer', function(req, res) {
    haribhagatHandler.inactiveConsumer(req.body, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});

/**
 * delete consumer in the database.
 *
 * The request body should include the name , email,admin_id
 */
router.post('/delete-haribhagat', function(req, res) {
    haribhagatHandler.deleteConsumer(req.body, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});


/**
 * delete consumer photo from AWS
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/consumer-remove-photo', function(req, res) {
//     haribhagatHandler.removePhoto(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/**
 * Upload file of consumer.
 *
 * Using post method
 */
router.post('/upload-file', function(req, res) {
    if (!_.has(req.files, 'url')) {
        logger('Parameter Missing : can not update common profile picture.');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.uploadFileObj(req.files, req.body.type, (error, filePath) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), filePath);
    });
});

/**
 * Remove file of consumer.
 *
 * Using post method
 */
router.post('/remove-file', function(req, res) {
    if (!_.has(req.body, 'url')) {
        logger('Parameter Missing : can not update common image.');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.removeFileObj(req.body, req, (error, filePath) => {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), filePath);
    });
});

/**
 * Sign up of consumer.
 *
 * Using post method
 */
// router.post('/sign-up', function(req, res) {
//     if (_.difference(['first_name', 'last_name', 'email', 'haribhagat_id'], Object.keys(req.body)).length > 0) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.signUp(req.body, req, (error, filePath) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), filePath);
//     });
// });


/**
 * Verify password of consumer.
 *
 * Using post method
 */
// router.post('/verify-password', function(req, res) {
//     if (_.difference(['password', 'haribhagat_id'], Object.keys(req.body)).length > 0) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.VerifyPassword(req.body, (error, filePath) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), filePath);
//     });
// });

/**
 * Change password of consumer.
 *
 * Using post method
 */
router.post('/change-password', function(req, res) {
    if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'old_password') || !_.has(req.body, 'new_password')) {
        logger('Parameter Missing : can not create consumer');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.changePassword(req.body, function(error, haribhagats) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), haribhagats);
    });
});

/**
 * Update notification status of consumer.
 *
 * Using post method
 */
// router.post('/update-notification-status', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'status') || !_.has(req.body, 'type')) {
//         logger('Parameter Missing : can not create consumer');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.notificationStatus(req.body, function(error, haribhagats) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), haribhagats);
//     });
// });

/**
 * Update notification status of consumer.
 *
 * Using post method
 */
router.post('/forgot-password', function(req, res) {
    if (!_.has(req.body, 'email')) {
        logger('Parameter Missing : can not create consumer');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    haribhagatHandler.forgotPassword(req.body, req, function(error, haribhagats) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), haribhagats);
    });
});

/**
 * Favourite Places
 *
 * using post method
 */
// router.post('/favourite-place', (req, res) => {
//     if (!req.body.haribhagat_id || !req.body.type) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }

//     haribhagatHandler.favouritePlace(req.body, res, (error, response) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), response);
//     });
// });


/**
 * Verify Email and Phone
 *
 * using post method
 */
// router.post('/verify-email-mobile', (req, res) => {
//     if (!req.body.type) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }

//     haribhagatHandler.verifyEmailMobile(req.body, res, (error, response) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), response);
//     });
// });

/**
 * List consumer's in backend.
 *
 * Using post method
 */
// router.post('/get-customer-credit', (req, res) => {
//     haribhagatHandler.getCustomerCredit(req.body, req, (error, data) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), data);
//     });
// });

/**
 * add credit of consumer in the database.
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/add-consumer-credit', function(req, res) {
//     haribhagatHandler.addCredit(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * Upload file of consumer.
 *
 * Using post method
 */
// router.post('/upload-edited-file', function(req, res) {
//     if (!_.has(req.files, 'url')) {
//         logger('Parameter Missing : can not update common profile picture.');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     let removeFileId = JSON.parse(req.body.removeFileId);
//     haribhagatHandler.uploadEditedFileObj(req.files, req.body.type, removeFileId, (error, filePath) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), filePath);
//     });
// });

/**
 * Upload file of vehicle.
 *
 * Using post method
 */
// router.post('/upload-edited-vehicle-photo', function(req, res) {
//     if (!_.has(req.files, 'url')) {
//         logger('Parameter Missing : can not update common profile picture.');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     let removeFileId = JSON.parse(req.body.removeFileId);
//     haribhagatHandler.uploadEditedVehiclePhoto(req.files, req.body.type, removeFileId, (error, filePath) => {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), filePath);
//     });
// });

/**
 * Upload file of vehicle.
 *
 * Using post method
 */
// router.post('/recent-place', function(req, res) {
//     if (!req.body.haribhagat_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.recentPlace(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });


/*
 * Name : get-consumer-last-status
 * Purpose : getConsumerLastStatus
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 8th June 2019
 */
// router.post('/get-consumer-last-status', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.getConsumerLastStatus(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });


/*
 * Name : add-wallet
 * Purpose : addWallet
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 13th June 2019
 */
// router.post('/add-wallet', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'amount')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.addWallet(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });


/*
 * Name : get-wallet
 * Purpose : getWallet
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 13th June 2019
 */
// router.post('/get-wallet', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.getWallet(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : wallet-history
 * Purpose : walletHistory
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 12th June 2019
 */
// router.post('/wallet-history', function(req, res) {
//     if (!_.has(req.body, 'haribhagat_id') || !_.has(req.body, 'date')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     haribhagatHandler.walletHistory(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : get-trip-backend
 * Purpose : Get Trip List for Backend
 * Using get method
 * Original Author : Jaikit Chaudhary
 * Created At : 25th June 2019
 */
// router.get('/get-trip-backend', function(req, res) {
//     if (!req.query.haribhagat_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.getTripBackend(req.query, function(error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

// router.post('/support', async(req, res) => {
//     try {
//         if (!(req.body.type == 'add' || req.body.type == 'edit' || req.body.type == 'delete' || req.body.type == 'default' || req.body.type == 'list') || !req.body.haribhagat_id) {
//             logger('Parameter Missing');
//             jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//             return;
//         }
//         if (req.body.type == 'add' && req.body.mobile && req.body.mobile_country_code) {
//             let response = await haribhagatHandler.addSupport(req.body)
//             jsonResponse(res, responseCodes.OK, errors.noError(), response);
//         } else if (req.body.type == 'edit' && req.body.support_id && req.body.mobile && req.body.mobile_country_code) {
//             let response = await haribhagatHandler.editSupport(req.body)
//             jsonResponse(res, responseCodes.OK, errors.noError(), response);
//         } else if (req.body.type == 'delete' && req.body.support_id) {
//             let response = await haribhagatHandler.deleteSupport(req.body)
//             jsonResponse(res, responseCodes.OK, errors.noError(), response);
//         } else if (req.body.type == 'default' && req.body.support_id) {
//             let response = await haribhagatHandler.setDefaultSupport(req.body)
//             jsonResponse(res, responseCodes.OK, errors.noError(), response);
//         } else if (req.body.type == 'list') {
//             let response = await haribhagatHandler.listSupport(req.body)
//             jsonResponse(res, responseCodes.OK, errors.noError(), response);
//         } else {
//             ogger('Parameter Missing');
//             jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//             return;
//         }
//     } catch (error) {
//         try {
//             console.log(error)
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         } catch (error) {
//             console.log(error)
//             jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true), null);
//             return;
//         }
//     }
// });

// router.post('/send-msg', function(req, res) {
//     if (!req.body.haribhagat_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.sendMsg(req.body, function(error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

// router.post('/update-consumer-support', function(req, res) {
//     if (!req.body.haribhagat_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.updateharibhagatsupport(req.body, function(error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

// router.post('/delete-consumer-support', function(req, res) {
//     if (!req.body.haribhagat_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.deleteharibhagatsupport(req.body, function(error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });
// router.post('/change-to-archive', function(req, res) {
//     if (!req.body.haribhagat_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.chnageToArchive(req.body, function(error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

// router.post('/make-payment', function (req, res) {
//     if (!req.body.haribhagat_id || !req.body.amount) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.makeTripPayment(req.body, function (error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

// router.post('/make-wave-payment', function (req, res) {
//     if (!req.body.trip_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.makeTripWavePayment(req.body, function (error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });


// router.post('/pay-additional-charge', function (req, res) {
//     if (!req.body.trip_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     haribhagatHandler.makeTripAdditionPayment(req.body, function (error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

module.exports = router
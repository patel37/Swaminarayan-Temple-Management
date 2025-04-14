'use strict';

const responseCodes = require('../helpers/response-codes');
const logger = require('../utils/logger');
const jsonResponse = require('../utils/json-response');
const errors = require('../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const adminHandler = require('../model_handlers/admin-handler');
const moment = require('moment');
const async = require('async');

router.post('/update-app-version-code', function(req, res) {
    if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'version_code')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.updateAppVersionCode(req.body, req, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});

/**
 * Get admin from database.
 *
 * The request body should include the name , username , password
 */
router.post('/get-admin', function(req, res) {
    adminHandler.getDriver(req.body,req, function(error, email) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), email);
    });
});

// router.post('/get-strip-connected-account-link', function(req, res) {
//     adminHandler.getStripConnected(req.body,req, function(error, email) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), email);
//     });
// });

// router.post('/get-strip-connected-login-link', function(req, res) {
//     adminHandler.getStripConnectedLoginLink(req.body,req, function(error, email) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), email);
//     });
// });
/**
 * Get admin from database.
 *
 * The request body should include the name , username , password
 */
// router.post('/get-trip', function(req, res) {
//     adminHandler.getTrip(req.body, function(error, email) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), email);
//     });
// });

/**
 * Register admin
 *
 * The request body should include the username , password
 */
router.post('/create-admin', function(req, res) {
    let requestParam = req.body;
    adminHandler.createAdmin(req, requestParam, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

// router.post('/login', function(req, res) {
//     let requestParam = req.body;
//     adminHandler.loginAdmin(req, requestParam, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

router.post('/loginweb', function(req, res) {
    let requestParam = req.body;
    adminHandler.loginAdminWeb(req, requestParam, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

// authenticationWeb
/**
 * Check email exist or not  in the database.
 *
 * The request body should include the name , username , password
 */
// router.post('/check-email-exist', function(req, res) {
//     if (!_.has(req.body, 'email')) {
//         logger('Parameter Missing : email');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     adminHandler.checkEmailExist(req.body, function(error, email) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), email);
//     });
// });

/**
 * Register admin
 *
 * The request body should include the username , password
 */
router.post('/admin-register', function(req, res) {
    if (!_.has(req.body, 'first_name') || !_.has(req.body, 'last_name') || !_.has(req.body, 'language_id')) {
        logger('Parameter Missing : registration failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.driverRegister(req.body, req, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * Authentication  admin 
 *
 * The request body should include the username , password
 */
router.post('/admin-authentication', function(req, res) {
    if (!_.has(req.body, 'mobile') || !_.has(req.body, 'mobile_country_code')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.authentication(req.body, req, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * Get admin profile
 *
 * The request body should include the haribhagat_id
 */
router.post('/get-admin-profile', function(req, res) {
    if (!_.has(req.body, 'admin_id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.getDriverProfile({'id':req.body.admin_id}, req, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        // jsonResponse(res, responseCodes.OK, errors.noError(), admin);
        const ecode=error;
        res.status(responseCodes.OK).send(JSON.stringify({
            error: error,
            ...admin,
            status: responseCodes.OK
        }));
    });
});

/**
 * Update admin profile
 *
 * The request body should include the admin_id
 */
router.post('/update-admin-profile', function(req, res) {
    if (!_.has(req.body, 'id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.updateDriverProfile(req.body, req, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * Update admin profile
 *
 * The request body should include the admin_id
 */
router.post('/update-admin/:user_id', function(req, res) {
    console.log(req.body);
    adminHandler.updateDriver(req.body, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

router.post('/update-PDFview', function(req, res) {
    console.log(req.body);
    adminHandler.updateUserSettings(req.body,res, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * Change password of admin.
 *
 * Using post method
 */
router.post('/admin-change-password', function(req, res) {
    // console.log("req.body",req.body)
    if (!_.has(req.body, 'id') || !_.has(req.body, 'current_password') || !_.has(req.body, 'new_password')) {
        logger('Parameter Missing : can not create admin');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.changePassword(req.body, function(error, admins) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admins);
    });
});

/**
 * Forgotpassword admin  
 *
 * The request body should include the email
 */
router.post('/admin-forgotpassword', function(req, res) {
    if (!_.has(req.body, 'email')) {
        logger('Parameter Missing : can not do reset password');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.forgotpassword(req.body, req, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });

});

/**
 * Delete admin account
 *
 * The request body should include the admin_id
 */
router.post('/delete-account/:admin_id', function(req, res) {
    if (!_.has(req.body, 'admin_id')) {
        logger('Parameter Missing : authentication failed');
        jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
        return;
    }
    adminHandler.deleteAccount(req.body, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * Notification status for admin
 *
 * The request body should include the admin_id
 */
// router.post('/notification-status', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.notificationStatus(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * Update location for admin
 *
 * The request body should include the admin_id
 */
// router.post('/update-admin-location', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.updateDriverLocation(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * Update location for admin
 *
 * The request body should include the admin_id
 */
// router.post('/admin-is-coming', function(req, res) {
//     if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'start_latitude') || !_.has(req.body, 'start_longitude') || !_.has(req.body, 'trip_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.driverIsComing(req.body, req, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * Active admin in the database.
 *
 * The request body should include the name , email,admin_id
 */
router.post('/active-admin', function(req, res) {
    adminHandler.activeDriver(req.body, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * Inactive admin in the database.
 *
 * The request body should include the name , email,admin_id
 */
router.post('/inactive-admin', function(req, res) {
    adminHandler.inactiveDriver(req.body, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * delete admin in the database.
 *
 * The request body should include the name , email,admin_id
 */
router.post('/delete-admin', function(req, res) {
    adminHandler.deleteDriver(req.body, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * add credit of admin in the database.
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/add-admin-credit', function(req, res) {
//     adminHandler.addCredit(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * get credit of admin in the database.
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/get-admin-credit', function(req, res) {
//     adminHandler.getCredit(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * update credit of admin in the database.
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/update-admin-credit', function(req, res) {
//     adminHandler.updateCredit(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * delete admin photo from AWS
 *
 * The request body should include the name , email,admin_id
 */
router.post('/admin-remove-photo', function(req, res) {
    adminHandler.removePhoto(req.body, function(error, admin) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), admin);
    });
});

/**
 * delete admin photo from AWS
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/admin-track-backend', function(req, res) {
//     adminHandler.trackBackend(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * delete admin photo from AWS
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/get-mapbox-admins', function(req, res) {
//     adminHandler.getMapboxDrivers(req, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * delete admin photo from AWS
 *
 * The request body should include the name , email,admin_id
 */
// router.post('/get-assign-admins', function(req, res) {
//     adminHandler.getAssignDriverList(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/**
 * change status provider in the database.
 *
 * The request body should include the name , username , password
 */
// router.post('/action-update-provider', function(req, res) {
//     adminHandler.actionUpdateProvider(req.body, function(error, provider) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), provider);
//     });
// });

/**
 * Verification of OTP 
 *
 * The request body should include the otp
 */
// router.post('/otp-verification', function(req, res) {
//     if (!_.has(req.body, 'mobile') || !_.has(req.body, 'otp')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.otpVerification(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });

/*
 * Name : check-email-mobile
 * Purpose : Admin Can check Email and Mobile duplication from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 28th May 2019
 */
// router.post('/check-email-mobile', function(req, res) {
//     adminHandler.checkEmailMobile(req.body, function(error, emailCheck) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), emailCheck);
//     });
// });

/*
 * Name : add-vehicle-backend
 * Purpose : Admin Can add Admin Vehicle from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 29th May 2019
 */
// router.post('/add-vehicle-backend', function(req, res) {
//     adminHandler.addVehicleBackend(req.body, function(error, vehicle) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), vehicle);
//     });
// });

/*
 * Name : get-vehicle-backend
 * Purpose : Admin Can get Admin Vehicle from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 29th May 2019
 */
// router.post('/get-vehicle-backend', function(req, res) {
//     adminHandler.getVehicleBackend(req.body, function(error, vehicle) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), vehicle);
//     });
// });

/*
 * Name : delete-vehicle-backend
 * Purpose : Admin Can delete Admin Vehicle from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 * Created At : 29th May 2019
 */
// router.post('/delete-vehicle-backend', function(req, res) {
//     adminHandler.deleteVehicleBackend(req.body, function(error, vehicle) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), vehicle);
//     });
// });

/*
 * Name : profile-upload
 * Purpose : Profile Pic upload
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 4th June 2019
 */
// router.post('/profile-upload', function(req, res) {
//     adminHandler.uploadImageProfile(req, function(error, vehicle) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), vehicle);
//     });
// });

/*
 * Name : resend otp
 * Purpose : resend otp
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 6th June 2019
 */
// router.post('/resend-otp', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.resendOtp(req.body, function(error, consumer) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
//     });
// });

/*
 * Name : get-admin-last-status
 * Purpose : getDriverLastStatus
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 7th June 2019
 */
// router.post('/get-admin-last-status', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.getDriverLastStatus(req.body, function(error, consumer) {
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
 * Created At : 11th June 2019
 */
// router.post('/add-wallet', function(req, res) {
//     if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'amount')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.addWallet(req.body, function(error, admin) {
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
 * Created At : 11th June 2019
 */
// router.post('/get-wallet', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.getWallet(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : buy-package
 * Purpose : buyPackage
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 11th June 2019
 */
// router.post('/buy-package', function(req, res) {
//     if (!_.has(req.body, 'admin_id') || !_.has(req.body, 'package_id') || !_.has(req.body, 'transaction_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.buyPackage(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : package-history
 * Purpose : packageHistory
 * Using post method
 * Original Author : Gaurav Patel
 * Created At : 12th June 2019
 */
// router.post('/package-history', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.packageHistory(req.body, function(error, admin) {
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
 * Created At : 13th June 2019
 */
// router.post('/wallet-history', function(req, res) {
//     if (!_.has(req.body, 'admin_id')) {
//         logger('Parameter Missing : authentication failed');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), {});
//         return;
//     }
//     adminHandler.walletHistory(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : get-trip-backend
 * Purpose : Get Trip List of admin for Backend
 * Using get method
 * Original Author : Jaikit Chaudhary
 * Created At : 25th June 2019
 */
// router.get('/get-trip-backend', function(req, res) {
//     if (!req.query.admin_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     adminHandler.getTripBackend(req.query, function(error, trip) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), trip);
//     });

// });

/*
 * Name : get-admin-credit-backend
 * Purpose : Get Credit List of admin for Backend
 * Using get method
 * Original Author : Jaikit Chaudhary
 * Created At : 25th June 2019
 */
// router.get('/get-admin-credit-backend', function(req, res) {
//     if (!req.query.admin_id) {
//         logger('Parameter Missing');
//         jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
//         return;
//     }
//     adminHandler.getCreditBackend(req.query, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : withdraw-paid-req
 * Purpose : withdraw paid request of admin from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 */
// router.post('/withdraw-paid-req', function(req, res) {
//     adminHandler.withDrawPaidReq(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });

/*
 * Name : withdraw-unpaid-req
 * Purpose : withdraw paid request of admin from Backend
 * Using post method
 * Original Author : Jaikit Chaudhary
 */
// router.post('/withdraw-unpaid-req', function(req, res) {
//     adminHandler.withDrawUnpaidReq(req.body, function(error, admin) {
//         if (error) {
//             jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
//             return;
//         }
//         jsonResponse(res, responseCodes.OK, errors.noError(), admin);
//     });
// });
router.post('/restore-admin', function(req, res) {
    adminHandler.restoreArchiveDriver(req.body, function(error, consumer) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), {});
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), consumer);
    });
});
module.exports = router;
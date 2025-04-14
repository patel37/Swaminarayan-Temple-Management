'use strict';

const dotenv = require('dotenv')
dotenv.config()
const _ = require('underscore');
const cron = require('node-cron');

const requiredParams = [
    "APP_NAME",
    "HTTP_PORT",
    "APP_BASE_URL",
    "DATABASE_URL",
    "AWS_BASE_URL",
    "AWS_KEY_ID",
    "AWS_SECRET_KEY",
    "AWS_REGION",
    "AWS_SES_REGION",
    "AWS_BUCKET_NAME",
    "AWS_STATIC_PAGE_BUCKET",
    "AWS_ASSETS_BUCKET",
    "AWS_CUSTOMER_BUCKET",
    "AWS_DRIVER_BUCKET",
    "AWS_VEHICLE_BUCKET",
    "AWS_ADMIN_BUCKET",
    "AWS_TRIP_BUCKET",
    "ASSET_PATH",
    "ASSET_URL",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "ROLE_ID",
    "ADMIN_ID",
    "ADMIN_FIRST_NAME",
    "ADMIN_LAST_NAME",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_MOBILE_NO",
];

for (let i = 0; i < requiredParams.length; i++) {
    if (!_.has(process.env, requiredParams[i])) {
        console.log(
            'Error: environment variables have not been properly setup for the Cab Platform. The variable:',
            requiredParams[i],
            'was not found.'
        );

        throw new Error('Cab Platform Environment Variables Not Properly Set');
    }
}






//end of Geofire
module.exports = {
    baseURL: process.env.APP_BASE_URL,
    appName: process.env.APP_NAME,
    AWS_BASE_URL: process.env.AWS_BASE_URL,
    port: process.env.HTTP_PORT,
    aws: {
        keyId: process.env.AWS_KEY_ID,
        key: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
        sesRegion:process.env.AWS_SES_REGION,
        s3: {
            assetUpload: {
                bucket: process.env.AWS_BUCKET_NAME
            },
            staticPagesBucket: process.env.AWS_STATIC_PAGE_BUCKET,
            consumerBucket: process.env.AWS_CUSTOMER_BUCKET,
            driverBucket: process.env.AWS_DRIVER_BUCKET,
            vehicleBucket: process.env.AWS_VEHICLE_BUCKET,
            adminBucket: process.env.AWS_ADMIN_BUCKET,
            tripBucket: process.env.AWS_TRIP_BUCKET,
            assetsBucket: process.env.AWS_ASSETS_BUCKET,
            countryFlagBucket:process.env.AWS_COUNTRY_FLAG_BUCKET,
            dbdumpBucket:process.env.AWS_DB_BUCKET
        }
    },
    assets_info :{
        asset_path : process.env.ASSET_PATH,
        asset_url : process.env.ASSET_URL
    },
  
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken:process.env.TWILIO_AUTH_TOKEN,
    // TWILIO_MOBILE_NO,
 
  
    SSL_KEY: process.env.SSL_KEY,
    SSL_CERT: process.env.SSL_CERT,
    HTTPS_PORT: process.env.HTTPS_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
    ROLE_ID: process.env.ROLE_ID,
    ADMIN_ID: process.env.ADMIN_ID,
    ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME,
};
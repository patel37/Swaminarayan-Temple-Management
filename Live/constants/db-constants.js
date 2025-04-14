'use strict';

const config = require('./../config');

/*
 * Related collection name with a database & schema
 */
module.exports = {
	dbSchema: {
		roles: 'Role',
		administrators:'Administrator',
		haribhagats:'Haribhagat',
		loginlogs:'LoginLog',
		languages:'Language',
		languageLabels:'LanguageLabel',
		consumeraddresses:'ConsumerAddress',
		admins:'Admin',
		cities:'City',
		countries:'Country',
		states:'State',
		settings:'Setting',
		cms:'CMS',
		sabha:'Sabha',
		currency:'Currency',
		email_templates:'Email_template',
		driver_credit_histories:'Driver_credit_history',
		transactions:'Transaction',
		notificationlogs:'Notification_log',
		send_notifications:'Send_notification',
		contact_us: 'Contact_us',
        feedbacks: 'Feedback',
        coupons: 'Coupon',
        access_rights:'Access_Rights',
        push_notification_templates:'Push_notification_template',
        sms_templates:'Sms_Template',
       	customer_credit_histories:'Customer_credit_history',
       	rating_reviews: 'Rating_review',
	}
};

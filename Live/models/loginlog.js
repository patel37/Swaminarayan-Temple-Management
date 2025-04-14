// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const loginlogConstants = require('./../constants/loginlog-constants');

// create a schema
var loginlogSchema = new Schema({
	loginlog_id: String,
	type : String,
	login_id : String,
	email: String,
	name: String,
	ip: String,
	login_date: { type: Date, default: Date.now },
	logout_date:{ type: Date}
});


// // Execute before each user.save() call
loginlogSchema.pre('save', function(callback) {
	const loginlog_id = loginlogConstants.loginlog_initials.loginlog+Math.floor(Math.random()*8999+10000);
	this.loginlog_id=loginlog_id;
	callback();
});

var LoginLog = mongoose.model('LoginLog', loginlogSchema);
module.exports = LoginLog;
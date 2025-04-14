var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');
const adminConstants = require('./../constants/admin-constants');

var administratorSchema = new Schema({
	admin_id : String,
	first_name: String,
	role_id: {
        type: String,
        default: ''
    },
	last_name: String,
	email: String,
	password: String,
	profile_picture: String,
	code: String,
	otp: Number,
	status: {type: String, enum: ['Active', 'Inactive']},
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});

// // Execute before each user.save() call
administratorSchema.pre('save', function(callback) {
	const admin_id = adminConstants.admin_initials.admin+Math.floor(Math.random()*8999+10000);
	this.admin_id=admin_id;
	callback();
});

var Administrator = mongoose.model('Administrator', administratorSchema);
module.exports = Administrator;
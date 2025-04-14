var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const constants = require('../constants/admin-constants');
const password = require('password-hash-and-salt');


var superUserSchema = new Schema({
    id: { type: String, default: '', immutable: true },
    language_id: { type: String, default: '' },
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    mobile_country_code: { type: String, default: '' },
    profile_picture: { type: String, default: '' },
    is_login: { type: Boolean, default: false },
    role: { type: String, default: 'admin' },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'pending' },
    pdfViewPreference: { type: String, enum: ['table', 'grid'], default: 'table' },
    otp: { type: Number, default: 0 },
    password: { type: String},
    is_archive: {
        type: String,
        enum: ['true', 'false'],
        default: 'false'
    },
    version_code: {
        type: String,
        default: ''
    },
    last_login_location: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});



// // Execute before each user.save() call
superUserSchema.pre('save', function(callback) {
    const id = constants.admin_initials.admin + Math.floor(Math.random() * 8999 + 10000);
    this.id = id;
    callback();
});

var Admin = mongoose.model('Admin', superUserSchema);
module.exports = Admin;
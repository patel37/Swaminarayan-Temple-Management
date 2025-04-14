const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mailConstants = require('./../constants/mail-constants');

// State Schema
const emailTemplate = new Schema({    
    emailtemplate_id: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: ''
    },
    from_name: {
        type: String,
        default: ''
    },
    from_email: {
        type: String,
        default: ''
    },
    email_subject: {
        type: String,
        default: ''
    },

    description:{
        type: Object,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
});

// Execute before each Help_Topic.save() call
emailTemplate.pre('save', function(callback) {
    const emailtemplate_id = mailConstants.mail_initials.mail+Math.floor(Math.random()*8999+10000);
	this.emailtemplate_id=emailtemplate_id;
	callback();
});

const Email_template = mongoose.model('Email_template', emailTemplate);
module.exports = Email_template;
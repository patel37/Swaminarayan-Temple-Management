const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// State Schema
const smsTemplate = new Schema({    
    sms_id: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    value:{
        type: Object,
        default: {}
    },
    code:{
        type: String,
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
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
});

// Execute before each Help_Topic.save() call
smsTemplate.pre('save', function(callback) {
    const sms_id = 'SMS'+Math.floor(Math.random()*8999+10000);
    this.sms_id=sms_id;
    callback();
});

const Sms_Template = mongoose.model('Sms_Template', smsTemplate);
module.exports = Sms_Template;
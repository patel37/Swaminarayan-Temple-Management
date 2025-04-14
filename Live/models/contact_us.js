const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// city Schema
const contact_usSchema = new Schema({
    contact_us_id: {
        type: String,
        default: ''
    },
    user_id: {
        type: String,
        default: ''
    },
    user_type: {
        type: String,
        enum: [ 'admin', 'consumer'],
        default: 'consumer'
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: ''
    },
    question: {
        type: String,
        default: ''
    },
    answer: {
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
});

// Execute before each city.save() call
contact_usSchema.pre('save', function(callback) {
    const contact_us_id = 'COT'+Math.floor(Math.random()*8999+10000);
    this.contact_us_id=contact_us_id;
    callback();
});

const Contact_us = mongoose.model('Contact_us', contact_usSchema);
module.exports = Contact_us;
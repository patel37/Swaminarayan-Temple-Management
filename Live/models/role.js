const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// State Schema
const roleSchema = new Schema({
    role_id: {
        type: String,
        default: ''
    },
    title: {
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
        enum: ['active', 'inactive'],
        default: 'active'
    },
});

// Execute before each role.save() call
roleSchema.pre('save', function(callback) {
    const role_id = 'ROL'+Math.floor(Math.random()*8999+10000);
    this.role_id=role_id;
    callback();
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Rating and review schema
const Access_Rights_Schema = new Schema({
  access_right_id: {
    type: String,
    default: ''
  },
  role_id: {
    type: String,
    default: ''
  },
  module_title: {
    type: String,
    default: ''
  },
  module_code: {
    type: String,
    default: ''
  },
  is_view: {
    type: Boolean,
    default: false
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

// Execute before each save() call
Access_Rights_Schema.pre('save', function(callback) {
  const access_right_id = 'ACR'+Math.floor(Math.random()*8999+10000);
  this.access_right_id=access_right_id;
  callback();
});

const Access_Rights = mongoose.model('Access_Rights', Access_Rights_Schema);
module.exports = Access_Rights;
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const cityConstants = require('./../constants/city-constants');

// create a schema
var stateSchema = new Schema({
	country_id:String,
	state_id:String,
	name: String,
	status : {type: String, enum: ['Active', 'Inactive']}
});

// // Execute before each user.save() call
stateSchema.pre('save', function(callback) {
	const state_id = cityConstants.state_initials.state+Math.floor(Math.random()*8999+10000);
	this.state_id=state_id;
	callback();
});

var State = mongoose.model('State', stateSchema);
module.exports = State;
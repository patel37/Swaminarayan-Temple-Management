// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const cityConstants = require('./../constants/city-constants');

// create a schema
var citySchema = new Schema({
	country_id:String,
	state_id:String,
	city_id:String,
	name: String,
	status : {type: String, enum: ['Active', 'Inactive']}
});

// // Execute before each user.save() call
citySchema.pre('save', function(callback) {
	const city_id = cityConstants.city_initials.city+Math.floor(Math.random()*8999+10000);
	this.city_id=city_id;
	callback();
});

var City = mongoose.model('City', citySchema);
module.exports = City;
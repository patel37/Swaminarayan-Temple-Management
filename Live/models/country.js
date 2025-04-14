// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const cityConstants = require('./../constants/city-constants');

// create a schema
var countrySchema = new Schema({
	country_id:String,
	name: String,
	status : {type: String, enum: ['Active', 'Inactive']}
});

// // Execute before each user.save() call
countrySchema.pre('save', function(callback) {
	const country_id = cityConstants.country_initials.country+Math.floor(Math.random()*8999+10000);
	this.country_id=country_id;
	callback();
});

var Country = mongoose.model('Country', countrySchema);
module.exports = Country;
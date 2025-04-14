// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const addressConstants = require('./../constants/address-constants');

// create a schema
var consumerAddressSchema = new Schema({
	address_id: String,
	type : String,
	haribhagat_id : String,
	name: String,
	address: String,
	latitude: String,
	longitude: String,
	created_date: { type: Date, default: Date.now },
	updated_date:{ type: Date, default: Date.now }
});


// // Execute before each user.save() call
consumerAddressSchema.pre('save', function(callback) {
	const address_id = addressConstants.address_initials.address+Math.floor(Math.random()*8999+10000);
	this.address_id=address_id;
	callback();
});

var ConsumerAddress = mongoose.model('ConsumerAddress', consumerAddressSchema);
module.exports = ConsumerAddress;
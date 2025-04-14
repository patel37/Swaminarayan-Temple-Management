// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const languageConstants = require('./../constants/language-constants');

// create a schema
var languageSchema = new Schema({
	language_id: String,
	title : String,
	code : String,
	translations: {type:Array},
	status : {type: String, enum: ['Active', 'Inactive']},
	created_date: { type: Date, default: Date.now },
	updated_date:{ type: Date, default: Date.now }
});


// // Execute before each user.save() call
languageSchema.pre('save', function(callback) {
	const language_id = languageConstants.language_initials.language+Math.floor(Math.random()*8999+10000);
	this.language_id=language_id;
	callback();
});

var Language = mongoose.model('Language', languageSchema);
module.exports = Language;
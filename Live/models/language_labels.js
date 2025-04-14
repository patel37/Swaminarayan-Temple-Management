// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const languageConstants = require('./../constants/language-constants');

// create a schema
var languageLabelSchema = new Schema({
	label_id: String,
	title : String,
	code : String,
	value : Object,
	type: {
       type: String,
       enum: ['consumer', 'admin'],
       default: 'consumer'
   	},
	status : {type: String, enum: ['Active', 'Inactive'],default: 'Active'},
	created_date: { type: Date, default: Date.now },
	updated_date:{ type: Date, default: Date.now }
});


// // Execute before each user.save() call
languageLabelSchema.pre('save', function(callback) {
	const label_id = languageConstants.language_label_initials.language_label+Math.floor(Math.random()*8999+10000);
	this.label_id=label_id;
	callback();
});

var LanguageLabel = mongoose.model('LanguageLabel', languageLabelSchema);
module.exports = LanguageLabel;
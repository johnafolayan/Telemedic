const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const issueSchema = mongoose.Schema({
	title: String,
	url: String,
	date: { type: Date, default: Date.now },
	participants: Array,
	tags: [],
	messages: [{
		by: String,
		date: { type: Date, default: Date.now },
		content: String
	}]
});

issueSchema.methods.generateHash = function(password) {
	let min0 = 'A'.charCodeAt(0);
	let r0 = 'Z'.charCodeAt(0) - min0;
	let min1 = 'a'.charCodeAt(0);
	let r1 = 'z'.charCodeAt(0) - min1;
	let hash = '';
	while (hash.length < 6) 
		hash += String.fromCharCode(
			Math.random() < .5 ? 
			(min0 + Math.random() * r0) : 
			(min1 + Math.random() * r1));
	return hash;
};

module.exports = mongoose.model('Issue', issueSchema);
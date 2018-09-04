const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const userSchema = mongoose.Schema({
	joinDate: { type: Date, default: Date.now },
	accountType: String,
	firstName: String,
	lastName: String,
	email: String,
	dob: String,
	sex: String,
	phone: String,
	password: String,
	username: String,
	online: false,
	activated: { type: Boolean, default: true },
	pendingActivate: false,
	account: { type: String, default: "" },
	documents: [{
		originalname: String,
		filename: String,
		mimetype: String, 
		buffer: Buffer
	}]
});

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
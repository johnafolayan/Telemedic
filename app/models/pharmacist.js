const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const pharmacistSchema = mongoose.Schema({
	company: String,
	email: String,
	phone: String,
	address: String,
	activated: { type: Boolean, default: true },
	pendingActivate: false,
	documents: [{
		originalname: String,
		filename: String,
		mimetype: String, 
		buffer: Buffer
	}]
});

pharmacistSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

pharmacistSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Pharmacist', pharmacistSchema);
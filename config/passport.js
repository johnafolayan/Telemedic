const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');

module.exports = function(passport) {

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		User.findById(id, (err, user) => {
			done(err, user);
		});
	});

	passport.use('signup', new LocalStrategy({
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, (req, username, password, done) => {
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
	        // find a user whose email is the same as the forms email
	        // we are checking to see if the user trying to login already exists
	        User.findOne({ 'username':  req.body.username }, function(err, user) {
	            // if there are any errors, return the error
	            if (err)
	                return done(err);

	            // check to see if theres already a user with that username
	            if (user) {
	                return done(null, false, req.flash('usernameError', 'That username is already taken.'));
	            } else {
	            	req.flash('loginMessage', 'Account created. Login to access.');

	                // if there is no user with that email
	                // create the user
	                let newUser = new User();

	                // set the user's credentials
	                newUser.email       = req.body.email;
	                newUser.password    = newUser.generateHash(req.body.password);
	                newUser.accountType = req.body.accountType;
	                newUser.firstName   = req.body.firstName;
	                newUser.lastName    = req.body.lastName;
	                newUser.dob 		= req.body.dob;
	                newUser.phone		= req.body.phone;
	                newUser.username    = req.body.username;
					newUser.activated   = (newUser.accountType === 'Patient');

	                // save the user
	                newUser.save(function(err) {
	                    if (err)
	                        throw err;
	                    return done(null, newUser);
	                });
	            }
	        });    
        });
    }));

    passport.use('login', new LocalStrategy({
        passReqToCallback : true // allows us to pass back the entire request to the callback
	}, (req, username, password, done) => { // callback with email and password from our form
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'username':  req.body.username }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginError', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('passwordError', 'Oops! Wrong password.')); // 

            // all is well, return successful user
            return done(null, user);
        });
	}));

};
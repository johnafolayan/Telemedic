const multer = require('multer');
const Issue = require('./models/issue');
const User = require('./models/user');
const Pharmacist = require('./models/pharmacist');

const upload = multer();

module.exports = function(app, passport) {

	app.get('/', (req, res) => {
		res.render('index',  { loggedIn: !!req.user, username: req.user ? req.user.username : null });
	});

	// ==============================
	// LOGIN ========================
	// ==============================
	app.get('/login', (req, res) => {
		res.render('login', { 
			loggedIn: !!req.user,
			username: req.user ? req.user.username : null,
			loginError: req.flash('loginError'), 
			passwordError: req.flash('passwordError'),
			loginMessage: req.flash('loginMessage')
		});
	});

	app.post('/login', 
		passport.authenticate('login', {
	        failureRedirect: '/login', // redirect back to the signup page if there is an error
	        failureFlash: true
		}), (req, res) => {
			User.updateOne({ username: req.user.username },
			{
				$set: { online: true }
			}, (err) => {
				getUser(req, (err, user) => {
					if (user.accountType === 'Admin')
						res.redirect('/u/admin');	
					else
						res.redirect('/u/issues');
				});
			});
		});

	// ==============================
	// SIGNUP =======================
	// ==============================
	app.get('/signup', (req, res) => {
		res.render('signup', { 
			loggedIn: !!req.user,
			username: req.user ? req.user.username : null,
			emailError: req.flash('emailError'),
			usernameError: req.flash('usernameError'),
			passportError: req.flash('error')
		});
	});

	app.post('/signup', passport.authenticate('signup', {
		successRedirect: '/login', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true
	}));

	app.post('/u/', isLoggedIn, (req, res) => {
		getUser(req, (err, user) => {
			res.json({ 
				username: user.username, 
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				phone: user.phone
			});
		});
	});

	// ==============================
	// ISSUES ========================
	// ==============================
	app.get('/u/issues', isLoggedIn, isActivated, isNotAdmin, (req, res) => {
		getUser(req, (err, user) => {
			if (err) return handleError(req, res);

			if (req.query && req.query.cw) {
				getUser({ 
					user: {
						username: req.query.cw 
					}
				}, (err, pharm) => {
					let issue = new Issue();
					issue.title = 'Pharmacy Visit';
					issue.url = issue.title.toLowerCase().replace(/ /g, '-') + '-' + issue.generateHash();
					issue.date = new Date();
					issue.tags = ['pharmacy'];

					issue.participants = [getFullName(user), getFullName(pharm)];
					issue.messages = [{
						by: getFullName(user),
						date: issue.date,
						content: 'This patient requires drugs from your store. Please attend.' 
					}];
					issue.save(err => {
						if (err)
		                	throw err;
		                Issue.find({ 
							participants: { $in: [getFullName(user)] } 
						}, (err, issues) => {
							if (err) throw err;
							issues = formatIssues(issues);
							res.render('issues', { user, issues });
						});
					});
				});
			} else {
				Issue.find({ 
					participants: { $in: [getFullName(user)] } 
				}, (err, issues) => {
					if (err) throw err;
					issues = formatIssues(issues);
					res.render('issues', { user, issues });
				});
			}
		});
	});

	app.post('/u/issues/filter/:filter', isLoggedIn, (req, res) => {
		getUser(req, (err, user) => {
			if (err) return handleError(req, res);

			let filter = req.params.filter;

			if (filter === 'All')
				Issue.find({ /* select all */ }, (err, issues) => {
					if (err) throw err;
					res.json({ issues: formatIssues(issues) });
				});
			else if (filter === 'Answered')
				Issue.find({ 
					participants: { $in: [getFullName(user)] } 
				}, (err, issues) => {
					if (err) throw err;
					issues = issues.filter(issue => issue.participants.length > 1);
					res.json({ issues: formatIssues(issues) });
				});
			else
				Issue.find({ 
					participants: { $in: [getFullName(user)] } 
				}, (err, issues) => {
					if (err) throw err;
					res.json({ issues: formatIssues(issues) });
				});
		});
	});

	app.post('/u/new-issue', isLoggedIn, (req, res) => {
		let date = new Date();
		let issue = new Issue();
		issue.title = req.body.title.trim();
		issue.url = issue.title.toLowerCase().replace(/ /g, '-') + '-' + issue.generateHash();
		issue.date = date;
		issue.tags = req.body.tags.split(',');

		getUser(req, (err, user) => {
			issue.participants = [getFullName(user)];
			issue.messages = [{
				by: getFullName(user),
				date: date,
				content: req.body.message 
			}];
			issue.save(err => {
				if (err)
	                throw err;
	            res.json({ issue: issue });
			});
		});
	});

	// ==============================
	// VIEW CHAT ====================
	// ==============================
	app.post('/u/issues/:url', isLoggedIn, (req, res) => {
		Issue.findOne({
			url: req.params.url
		}, (err, issue) => {
			if (err) return handleError(req, res);

			if (issue) {
				getUser(req, (err, user) => {
					issue = formatIssues([issue]).pop();

					let out = {
						username: user.username,
						issue: issue
					};

					res.json(out);
				});
			} else {
				res.render('error');
			}
		});
	});

	app.delete('/u/delete-issues', isLoggedIn, (req, res) => {
		Issue.remove(
		{ 
			url: { $in: req.body.issues } 
		}, (err) => {
			if (err) throw err;
			res.json({ success: true });
		});
	});

	app.get('/u/activate', isLoggedIn, isNotActivated, isNotAdmin, (req, res) => {
		getUser(req, (err, user) => {
			user.loggedIn = true;
			res.render('activate', { user });
		});
	});

	app.post('/u/activate', isLoggedIn, isNotActivated, upload.single('CV'), (req, res) => {
		User.updateOne({ username: req.user.username }, 
		{
			$set: {
				documents: [ req.file ],
				account: req.body.account,
				pendingActivate: true
			}
		}, (err) => {
			if (err) throw err;
			res.redirect('/u/activate');
		});
	});

	app.get('/u/admin', isLoggedIn, isActivated, isAdmin, (req, res) => {
		getUser(req, async (err, user) => {
			let metrics = await getAppMetrics();
			let out = {
				user,
				metrics
			};
			res.render('admin', out);
		});
	});

	app.get('/u/applications', isLoggedIn, isActivated, isAdmin, (req, res) => {
		getUser(req, async (err, user) => {
			let users = await User.find({ pendingActivate: true, activated: false }).exec();
			let apps = users.map(app => {
				return {
					username: app.username,
					fullName: `${app.firstName} ${app.lastName}`,
					accountType: app.accountType,
					sex: app.sex,
					dob: app.dob,
					phone: app.phone,
					email: app.email,
					joinDate: new Date(app.joinDate).toLocaleDateString()
				}
			});

			let out = {
				user,
				apps
			};

			res.render('applications', out);
		});
	});

	app.get('/u/users', isLoggedIn, isActivated, isAdmin, (req, res) => {
		getUser(req, async (err, user) => {
			let users = await User.find({ activated: true }).exec();
			users = users.map(app => {
				return {
					username: app.username,
					fullName: `${app.firstName} ${app.lastName}`,
					accountType: app.accountType,
					sex: app.sex,
					dob: app.dob,
					phone: app.phone,
					email: app.email,
					joinDate: new Date(app.joinDate).toLocaleDateString()
				}
			});
			let out = {
				user,
				users
			};
			res.render('users', out);
		});
	});

	app.get('/users/:user', isLoggedIn, isActivated, async (req, res) => {
		let member = await User.findOne({ username: req.params.user }).exec();
		if (!member) {
			res.redirect('/');
		} else {
			getUser(req, (err, user) => {
				let out = {
					user,
					member
				};
				res.render('user', out);
			});
		}
	});

	app.post('/users/:user/activate', isLoggedIn, isAdmin, (req, res) => {
		User.updateOne({ username: req.params.user },
		{
			$set: { activated: true, pendingActivate: false }
		}, (err) => {
			res.json({});
		});
	});

	app.post('/users/:user/deactivate', isLoggedIn, isAdmin, (req, res) => {
		User.updateOne({ username: req.params.user },
		{
			$set: { activated: false, pendingActivate: true }
		}, (err) => {
			res.json({});
		});
	});


	app.get('/u/getdrugs', isLoggedIn, isActivated, isNotAdmin, (req, res) => {
		getUser(req, async (err, user) => {
			let list = await Pharmacist.find({}).exec();
			res.render('getdrugs', { user, list });
		});
	});	



	// ==============================
	// LOGOUT =======================
	// ==============================
	app.get('/logout', isLoggedIn, (req, res) => {
		User.updateOne({ username: req.user.username },
		{
			$set: { online: false }
		}, (err) => {
			req.logout();
			res.redirect('/');
		});
	});

};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/');
}

function isNotAdmin(req, res, next) {
	getUser(req, (err, user) => {
		if (user.accountType !== 'Admin')
			next();
		else 
			res.redirect('/');
	});
}

function isAdmin(req, res, next) {
	getUser(req, (err, user) => {
		if (user.accountType === 'Admin')
			next();
		else 
			res.redirect('/');
	});
}

function isActivated(req, res, next) {
	getUser(req, (err, user) => {
		if (user.activated)
			next();
		else
			res.redirect('/u/activate');
	});
}

function isNotActivated(req, res, next) {
	getUser(req, (err, user) => {
		if (!user.activated)
			next();
		else
			res.redirect('/u/issues');
	});
}

function handleError(req, res, next) {
	res.render('/error');
	next();
}

function formatIssues(issues) {
	let output = [];
	for (let issue of issues) {
		let outIssue = mixin({}, issue);
		outIssue.messages = issue.messages
			.slice()
			.sort(function(a, b) {
				let msA = new Date(a.date).getTime();
				let msB = new Date(b.date).getTime();
				return msA - msB;
			});

		outIssue.lastMsg = outIssue.messages[outIssue.messages.length - 1];
		output.push(outIssue);
	}

	output.sort(function(a, b) {
		let msA = new Date(a.lastMsg.date).getTime();
		let msB = new Date(b.lastMsg.date).getTime();
		return msB - msA;
	});

	return output;
}

function getUser(req, cb) {
	User.findOne({ username: req.user.username }, cb);
}

async function getAppMetrics(cb) {
	let metrics = {};

	metrics['issueCount'] = await Issue.countDocuments();
	
	let users = await User.find({ }).exec();
	metrics['userCount'] = users.length;
	metrics['onlineCount'] = users.filter(user => user.online).length;

	metrics['earnings'] = formatMoney(metrics['issueCount'] * 5000);

	return metrics;
}

function formatMoney(n) {
	n = n + '';
	let out = '';
	for (let c = 0, i = n.length - 1; i >= 0; i--) {
		if (c++ === 3) {
			out += ',';
			c = 0;
		}
		out += n.charAt(i);
	}
	return out.split('').reverse().join('');
}

function getFullName(user) {
	return `${user.firstName} ${user.lastName}`;
}

function mixin() {
	let out = {};
	for (let i = 0; i < arguments.length; i++) {
		let obj = arguments[i];
		for (let key in obj) {
			// if (obj.hasOwnProperty(key)) {
				out[key] = obj[key];
			// }
		}
	}
	return out;
}
// ========== setup ==========
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');

const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io').listen(server);

const chatSystem = require('./app/chat')(io);

// ========== end ==========

// ========== config ==========
const dbConfig = require('./config/db');
mongoose.connect(dbConfig.url, { useNewUrlParser: true });
require('./config/passport')(passport);
// ========== end ==========

app.set('view engine', 'ejs');
// app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== required for passport ==========
app.use(session({ 
	secret: 'telemedicineisthenewmedine',
	saveUninitialized: true,
	resave: true,
	cookie: { maxAge: 5 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ========== routes ==========
app.use(express.static('./public'));
require('./app/routes')(app, passport);

app.use((req, res, err) => {
	res.render('error');
});

server.listen(port, () => console.log('Server running on ' + port));
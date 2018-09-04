var app = window.app = require('../app');
var controllers = require('./controllers');

$(document).ready(function() {
	
	// initialize 'em all
	for (var i = 0; i < controllers.length; i++) {
		controllers[i](app);
	}
	// controllers end
	
});
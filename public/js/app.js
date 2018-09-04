var AppCache = require('./AppCache');

module.exports = {
	init: function() {
		this.cache = new AppCache('telemedic');
	},

	getUserHash: function() {
		return this.cache.get('userhash');
	},

	getCurrentPage: function() {
		return window.location.pathname;
	}
};

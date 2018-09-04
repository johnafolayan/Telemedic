;(function() {

	function isValidPassword(str) {
		for (let i = 1, reg; i < arguments.length; i++) {
			reg = arguments[i];
			if (reg.test(str) === false) {
				return false;
			}
		}
		return str.length >= 8;
	}

	function header(location) {
		window.location.href = location;
	}

	jQuery.extend(jQuery, {
		isValidPassword: isValidPassword,
		header: header
	});
	
})();
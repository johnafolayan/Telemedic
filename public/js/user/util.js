var util = (function() {

	function getPages(url) {
		var pages = url.substr(url.indexOf("dashboard"));
		return pages.replace("#", "");
	}

	function capitalize(string) {
		return string.charAt(0).toUpperCase() + string.substr(1);
	}

	function random(a, b) {
		if (!b) {
			b = a || 1;
			a = 0;
		}
		return a + Math.random() * (b - a);
	}

	function randrange(a, b) {
		return random(a, b) >> 0;
	}

	function randomPick(arr) {
		return arr[randrange(0, arr.length)];
	}

	var hexChars = "abcdef1234567890".split("");

	function randomColor() {
		var color = "#";
		while (color.length != 7) {
			color += randomPick(hexChars);
		}
		return color;
	}

	return {
		getPages: getPages,
		capitalize: capitalize,
		random: random,
		randrange: randrange,
		randomPick: randomPick,
		randomColor: randomColor
	}

})( jQuery );
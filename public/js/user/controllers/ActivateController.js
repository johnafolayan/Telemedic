
module.exports = function( app ) {
	$('#activate-form #account').on('input', function(evt) {
		var raw = $(this).val().replace(/ /g, '');
		var fours = '';

		for (var i = 0, c = 0; i < raw.length; i++) {
			fours += raw.charAt(i);
			if (++c === 4) {
				fours += ' ';
				c = 0;
			}
		}
		
		$(this).val(fours.trim());
	});

	$('#activate-form').submit(function(evt) {
		$(this).find('button[type="submit"]').addClass('disabled');

		// evt.preventDefault();

		// var account = $('input[name="account"]').val();
		// var CV = $('input[name="CV"]').get(0).files[0];
		// var othersArray = $('input[name="Others"]').get(0).files;
		// var documents = [];

		// function sendActivate() {
		// 	jQuery.ajax({
		// 		url: '/u/activate',
		// 		type: 'POST',
		// 		dataType: 'json',
		// 		data: { documents: documents, account: account }
		// 	})
		// 	.then(function(data) {
		// 		location.reload();
		// 	});
		// }

		// getFile(CV, function(result) {
		// 	var i;
		// 	documents.push({ title: CV.name, data: result });

		// 	if (othersArray && othersArray.length) {
		// 		i = 0;
		// 		getFile(othersArray[i], function(result2) {
		// 			documents.push({ title: othersArray[i].title, data: result2 });
		// 			if (++i < othersArray.length)
		// 				getFile(othersArray[i], arguments.callee);
		// 			else {
		// 				sendActivate();
		// 				console.log(documents)
		// 			}
		// 		});
		// 	} else {
		// 		sendActivate();
		// 	}
		// });
	});

	$("#toggle-activate").click(function() {
		if ($(this).text().trim() === 'Activate') {
			$.post('/users/' + $(this).attr('data-username') + '/activate')
			.then(function() {
				location.reload();
			});
		} else {
			$.post('/users/' + $(this).attr('data-username') + '/deactivate')
			.then(function() {
				location.reload();
			});
		}
	});
};

function getFile(file, cb) {
	var fr = new FileReader();
	fr.onloadend = function() {
		cb(fr.result)
	};
	fr.readAsDataURL(file);
}
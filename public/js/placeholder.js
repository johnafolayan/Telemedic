
module.exports = function() {
	
	var map = {
		accountType: 'Patient',
		firstName: 'Tadashi',
		lastName: 'Hamada',
		email: 'tadashi@gmail.com',
		username: 'tadashi',
		password: 'tadashi',
		confirmPassword: 'tadashi',

		securityQ1: 'What is your favorite color',
		securityA1: 'red',

		securityQ2: 'What is the name of your pet',
		securityA2: 'Barbara'
	};

	for (var key in map)
	{
		if (map.hasOwnProperty(key))
		{
			$('#' + key).val(map[key]);
		}
	}
    
    $('select').formSelect();

};
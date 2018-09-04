
jQuery(document).ready(function(){
	
	$("input[name=username]").val("hiro");
	$("input[name=password]").val("hiro");

	var string = "firstname=John&lastname=Afolayan&othernames=&dob=0001-01-01&sex=male&account=pharmacist&username=hiro&password=hiro&confirmPassword=hiro";
	console.log(string.split("&"))
	jQuery.each(string.split("&"), function(i, field) {
		var split = field.split("=");
		console.log(split)
		$("input[name='" + split[0] + "']").val(split[1]);
		$("select[name='" + split[0] + "']").val(split[1]);
	});

});
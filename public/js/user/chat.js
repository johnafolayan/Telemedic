var socket, user,
	frame, selfVideo, friendVideo;

exports.connect = function(username, issueUrl, config) {
	socket = io();

	socket.on('connect', function() {
		socket.emit('adduser', username, issueUrl);
	});

	socket.on('useradded', function(userCount) {
		if (userCount > 1) 
			$('#videoChat').removeClass('disabled');
		else
			$('#videoChat').addClass('disabled');
	});

	socket.on('userremoved', function(userCount) {
		if (userCount > 1) 
			$('#videoChat').removeClass('disabled');
		else
			$('#videoChat').addClass('disabled');
	});

	socket.on('chat', function(msg) { 
		config.onChat(msg);
	});

	socket.on('peerrequest', function(data) {
		config.onPeerRequest(data);
	});

	socket.on('peeraccepted', function(data) {
		config.onPeerAccepted(data);
	});

	socket.on('videoend', function(data) {
		config.onVideoEnd(data);
	});

	config.onConnect();
};

exports.disconnect = function() {
	socket && socket.disconnect();
};

exports.send = function(event, arg) {
	socket.emit(event, arg);
};
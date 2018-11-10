const User = require('./models/user');
const Issue = require('./models/issue');

module.exports = (io) => {
	io.sockets.on('connection', (socket) => handleConnection(socket, io));
};

const groups = {};

function handleConnection(socket, io) {

	socket.on('disconnect', function() {
		if (groups[socket.group]) {
			groups[socket.group].count--;
			io.sockets.in(socket.group).emit('userremoved', groups[socket.group].count);
		}
	});
	
	socket.on('adduser', (user, issueUrl) => {
		Issue.findOne({ url: issueUrl }, (err, issue) => {
			if (err) throw err;
			if (issue) {
				if (!issue.participants.includes(user)) {
					issue.participants.push(user);
					Issue.updateOne({ url: issueUrl },
					{
						$set: { participants: issue.participants }
					}, (err, res) => {
						if (err) throw err;
					});
				}

				// ensure user is a member of the group
				if (issue.participants.includes(user)) {
					groups[issueUrl] = groups[issueUrl] || {
						issue: issue,
						count: 0
					};
					groups[issueUrl].count++;
					socket.username = user;
					socket.group = issueUrl;
					socket.join(issueUrl);
					
					io.sockets.in(issueUrl).emit('useradded', groups[issueUrl].count);
				}
			}
		});
	});

	socket.on('chat', msg => {
		let grp = groups[socket.group];
		if (!grp) return;

		grp.issue.messages.push({
			by: socket.username,
			date: msg.date,
			content: msg.content
		});

		Issue.updateOne({ url: socket.group }, 
		{
			$set: {
				messages: grp.issue.messages
			}
		}, (err, res) => {
			if (err) throw err;
			msg.formattedDate = new Date(msg.date).toDateString();
			io.sockets.in(socket.group).emit('chat', msg);
		});
	});

	socket.on('peerrequest', data => {
		socket.broadcast.to(socket.group).emit('peerrequest', data);
	});

	socket.on('peer2signal', data => {
		socket.broadcast.to(socket.group).emit('peer2signal', data);
	});

	socket.on('peer1signal', data => {
		socket.broadcast.to(socket.group).emit('peer1signal', data);
	});

	socket.on('peeraccepted', data => {
		let grp = groups[socket.group];
		socket.broadcast.to(socket.group).emit('peeraccepted', data);
	});

	socket.on('videochat', msg => {
		let grp = groups[socket.group];
		io.sockets.in(socket.group).emit('videochat', msg);
	});

	socket.on('videoend', function(data) {
		let grp = groups[socket.group];
		if (!grp) return;

		Issue.updateOne({ url: socket.group }, 
		{
			$set: {
				messages: grp.issue.messages
			}
		}, (err, res) => {
			if (err) throw err;
			socket.broadcast.to(socket.group).emit('videoend', data);
		});
	});
}

function handleError() {

}
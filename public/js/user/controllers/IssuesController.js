var chatHandler = require('../chat');
var user = null;
var frame;
var selfVideo;
var friendVideo;
var stream;
var videoStarted = false;

module.exports = function( app ) {
	frame = $('#video-frame');

	selfVideo = $('#self-video');
	friendVideo = $('#friend-video');

	addCollectionEvents();
	fetchUser(function() {});

	$('#new-issue').click(function(evt) {
		evt.preventDefault();
		hideSingleIssue();
		showSingleIssue(function() {
			var issueFrame = $('#new-issue-frame');
			issueFrame.show();
			issueFrame.find('#title').val('');
			issueFrame.find('#message').val('');
			issueFrame.find('#customTags').val('');
		});
	});

	var filterInTransit = false;
	$('#filter').on('change', function(evt) {
		if (filterInTransit) return;
		filterInTransit = true;

		var filter = $(this).val();
		fetchIssues(filter, function() {
			filterInTransit = false;
		});
	});

	$('#reply-area #sendMsg').click(function(evt) {
		handleSend.call(this, evt);
	});

	$('#videoChat').click(function(evt) {
		initVideo(true);
	});

	$('#end-call').click(function(evt) {
		frame.hide();
		videoStarted = false;
		user.peerData.peer.removeStream(stream);
		user.peerData = null;
		chatHandler.send('videoend');
	});

	$('#customTags').keypress(function(evt) {
		// if (evt.key.toLowerCase() === 'enter') {
		// 	evt.preventDefault();
		// 	$('#tags').prepend(
		// 		'<div class="chip">' + $(this).val() + '<i class="close material-icons">close</i></div>'
		// 	);
		// 	$(this).val('');
		// }
	});

	$('#new-issue-frame form').submit(function(evt) {
		evt.preventDefault();

		var tags = $('#customTags').val()
			.split(',')
			.map(function(tag) { return tag.trim(); })
			.filter(function(tag) { return /^[a-z( )?]*$/gi.test(tag); })
			.join(',');

		var data = $(this).serialize() + '&tags=' + tags;  
		fetchUser(function(user) {
			var price = 5000;
			payWithPaystack(price, user.email, user.phone, function() {
				$.post('/u/new-issue', data)
				.then(function(result) {
					addIssue(result.issue);
					showIssue(result);
				})
				.fail(function(err) {

				});
			});
		});
	});
};

function hideSingleIssue() {
	$('#empty-issue').hide();
	$('#new-issue-frame').hide();
	$('#single-issue-main').hide();
}


function showIssue(obj) {
	var issue = obj.issue;

	hideSingleIssue();

	$('#single-issue-main').show();

	$('#single-issue #reply-area').show();
	$('#single-issue .title').text(issue.title);

	$('#single-issue #messages').html('');

	issue.messages.forEach(function(msg) {
		addMsg(msg);
	});
}

function addCollectionEvents() {
	var deleting = false;
	$('#delete-issue').click(function(evt) {
		evt.preventDefault();

		if (deleting) return;

		var $this = $(this);
		$this.attr('disabled', 'true');

		var boxes = $('#issues-list input[type="checkbox"]')
			.toArray()
			.filter(function(el) { return el.checked });

		var parents = boxes.map(function(el) {
			return $(el).parents('.collection-item');
		});
			
		var issues = parents.map(function($el) {
			$el.remove();
			return $el.attr('data-url');
		});

		if (!issues.length) return;

		deleting = true;

		$.ajax({
			url: '/u/delete-issues',
			type: 'delete',
			data: { issues: issues },
			success: function(data) {
				deleting = false;
				$this.attr('disabled', 'false');
			}
		});
	});

	$('#issues-list .collection-item .clickable').click(function(evt) {
		var $this = $(this).parent();

		$('#issues-list .collection-item.active').removeClass('active');
		$this.addClass('active');

		var url = $this.attr('data-url');
		
		fetchUser(function(user) {
			$.ajax({
				url: '/u/issues/' + url,
				type: 'POST',
				beforeSend: function() {
					chatHandler.disconnect();
					showSingleIssue(function() {
						$('#single-issue .title').text('Loading...');
						$('#single-issue #messages').html('<p class="f-s-22 center-align">Loading...</p>');
					});
				},
				success: function(data) {
					chatHandler.connect(user.firstName + ' ' + user.lastName, url, {
						onConnect: function() {
							showIssue(data);						
						},
						onChat: function(msg) {
							addMsg(msg);
						},
						onVideoChat: function(msg) {
				            friendVideo.get(0).src = msg.content;
						},
						onPeerRequest: function(data) {
							if (!videoStarted && confirm('User is requesting a video chat with you. Would you like to accept?')) {
								initVideo(false, function(selfData) {
									user.peerData.peer.signal(data);
									user.peerData.otherId = data;
									// chatHandler.send('peeraccepted', selfData);
								});
							}
						},
						onPeerAccepted: function(data) {
							user.peerData.peer.signal(data);
							user.peerData.otherId = data;
						},
						onVideoEnd: function() {
							frame.hide();
							videoStarted = false;
							user.peerData.peer.removeStream(stream);
							user.peerData = null;
						}
					});
				},
				error: function(err) {
					throw err;
				}
			});
		});
	});
}

function showSingleIssue(cb) {
	if (window.innerWidth <= 991) {
		$('#issues-list-wrapper').hide();
		$('#single-issue').show();
	}

	$('#empty-issue').hide();
	$('#reply-area').hide();
	cb();
}


function fetchUser(cb) {
	if (!user)
		$.ajax({
			url: '/u/',
			type: 'POST',
			success: function(data) {
				user = data;
				cb(user);
			}
		});
	else 
		cb(user);
}

function handleSend(evt) {
	var el = $('#reply-area textarea');
	var msg = el.val();

	if (msg.length === 0) 
		return;
	
	fetchUser(function(user) {
		chatHandler.send('chat', {
			by: user.firstName + ' ' + user.lastName,
			date: new Date(),
			content: msg
		});
	});

	el.val('');
	M.textareaAutoResize(el);
}

function addIssue(issue) {
	$('#issues-list').prepend([
		'<li class="collection-item row" data-url="'+issue.url+'">',
			'<div class="input-field col s2 m2">',
				'<label style="margin-top: -18px;">',
					'<input type="checkbox" name="delete">',
					'<span></span>',
				'</label>',
			'</div>',
			'<div class="col s10 m10 clickable">',
				'<div class="row m-b-0">',
					'<div class="col s7 m7">',
						'<h6 class="truncate issue-title">',
							issue.title,
						'</h6>',
					'</div>',
					'<div class="col s5 m5 right-align">',
						'<p class="truncate issue-date">',
							new Date(issue.messages[0].date).toLocaleDateString() ,
						'</p>',
					'</div>',
				'</div>',
			'</div>',
		'</li>'
	].join(''));
}

var prevDate = null;
function addMsg(msg) {
	if (!prevDate || (renderDate(prevDate) !== renderDate(msg.date))) {
		$('#messages').append('<div class="row center"><div class="p-t-10 p-b-10 col s4 offset-s4 m2 offset-m5 grey lighten-2 black-text">'+renderDate(msg.date)+'</div></div>');
		prevDate = msg.date;
	}

	var el = ['<div class="row">'];
	
	if (msg.by !== (user.firstName + ' ' + user.lastName))
		el.push('<div class="white msg col s10 m7">');
	else
		el.push('<div class="indigo lighten-3 msg col s10 offset-s2 m7 offset-m5">');

	el = el.concat([
		'<div class="row">',
			'<h6 class="col s6 by">',
			 	msg.by,
			'</h6>',
			'<h6 class="col s6 date">',
				renderTime(msg.date),
			'</h6>',
			'<p class="col s12 content">',
				msg.content,
			'</p>',
		'</div>',
		'</div>',
		'</div>'
	]);

	$('#messages').append(el.join('\n'));
	$('#messages').children().last()[0].scrollIntoView();
}

function addNotice(msg) {
	$('#messages').append('<div class="row center"><div class="p-t-10 p-b-10 col s8 offset-s2 m8 offset-m2 grey lighten-2 black-text">'+renderDate(msg.date)+'</div></div>');
}

function renderDate(date) {
	date = new Date(date);
	var today = new Date();
	var yesterday = new Date(); 
	yesterday.setDate(today.getDate() - 1);
  	
  	if (date.toLocaleDateString() == today.toLocaleDateString())
    	return 'Today';
  	else if (date.toLocaleDateString() == yesterday.toLocaleDateString())
    	return 'Yesterday';

	return date.toLocaleDateString('en-US', {
    	day : 'numeric',
    	month : 'long'
  	});
}

function renderTime(date) {
	date = new Date(date);
	var hrs = date.getHours(),
		mins = date.getMinutes();
	if (hrs > 11) 
		return padLeft(hrs) + ':' + padRight(mins, 2) + 'pm';
	else 
		return padLeft(hrs) + ':' + padRight(mins, 2) + 'am';
}

function padRight(n, length) {
	n = '' + n;
	while (n.length < length) 
		n = '0' + n;
	return n;
}

function padLeft(n, length) {
	n = '' + n;
	while (n.length < length) 
		n = '0' + n;
	return n;
}

function initVideo(initiator, cb) {
	if (user.peerData) return;

	if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true
        })
        .then(function(localMediaStream) {
        	if (videoStarted) return;
        	videoStarted = true;
        	stream = localMediaStream;

        	var peer = new SimplePeer({
        		initiator: initiator,
        		trickle: false,
        		stream: stream
        	});

        	user.peerData = {
        		peer: peer,
        		id: null,
        		otherId: null
        	};

        	peer.on('signal', function(data) {
        		user.peerData.id = data;
        		alert('signal received');
        		// cb && cb(data);
        		if (initiator) {
        			cb && cb(data);
        			chatHandler.send('peerrequest', data);
        		} else {
        			cb && cb(data);
        			chatHandler.send('peeraccepted', data);
        		}
        	});

        	peer.on('stream', function(data) {
        		frame.show();
        		friendVideo.get(0).src = window.URL.createObjectURL(data);
        		friendVideo.get(0).play();
        	});
        })
        .catch(function(err) {
            alert('An error occured while fetching media');
        });
    } else {
    	alert('You have no video access!');
    }
}

function stopVideo() {
	frame.hide();
	if (stream) {
		stream.getTracks().map(function (val) {
		    val.stop();
		});
		stream = null;
	}
}

function goFullScreen() {
	requestFullScreen(frame.get(0));

	function onFullScreenChange(evt) {
		if (!(document.fullscreenElement || 
			document.webkitFullscreenElement ||
			document.mozFullScreenElement || 
			document.msFullscreenElement)
		) {
			stopVideo(selfVideo);
		}
	}

	$(document).on('fullscreenchange', onFullScreenChange);
	$(document).on('webkitfullscreenchange', onFullScreenChange);
	$(document).on('mozfullscreenchange', onFullScreenChange);
	$(document).on('msFullscreenChange', onFullScreenChange);
}

function requestFullScreen(ele) {
	if (ele.requestFullscreen)
		ele.requestFullscreen();
	else if (ele.webkitRequestFullscreen)
		ele.webkitRequestFullscreen();
	else if (ele.mozRequestFullScreen)
		ele.mozRequestFullScreen();
	else if (ele.msRequestFullscreen) 
		ele.msRequestFullscreen();
}

function fetchIssues(filter, cb) {
	$.post('/u/issues/filter/' + filter)
	.then(function(result) {
		var listFrame = $('#issues-list-frame');
		listFrame.html('');

		hideSingleIssue();

		// listFrame.find('#no-issues').hide();
		listFrame.append('<ul class="collection" id="issues-list"></ul>');

		result.issues.forEach(addIssue);
		addCollectionEvents();

		cb();
	});
}





// Payment
function payWithPaystack(amount, email, phone, cb) {
    var handler = PaystackPop.setup({
        key: 'pk_test_3175eb74811cb8637e49410024ba30eab6a6c409',
        email: email,
        amount: amount * 100,
        ref: ''+Math.floor((Math.random() * 1000000000) + 1), // generates a pseudo-unique reference. Please replace with a reference you generated. Or remove the line entirely so our API will generate one for you
        metadata: {
            custom_fields: [
            	{
	                display_name: "Mobile Number",
	                variable_name: "mobile_number",
	                value: phone
	            }
         	]
      	},
      	callback: function(response){
          	cb();
      	},
      	onClose: function(){
          	alert('window closed');
      	}
    });

    handler.openIframe();
}
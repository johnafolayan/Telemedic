(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function AppCache(namespace) {
    this.namespace = namespace;

    var json;

    if (AppCache.hasLocalStorage()) {
        json = localStorage.getItem(namespace);

        if (!!json) {
            this.data = JSON.parse(json);
            return;
        }
    }

    json = {
        "plan": null,
    };

    this.data = json;
    this.save();

    return this;
}

AppCache.prototype = {
    clear: function() {
        if (AppCache.hasLocalStorage()) {
            localStorage.removeItem(this.namespace);
        } else {
            let d = new Date();
            d.setMonth( d.getMonth() - 1 );
            this.save( d.toUTCString() );
        }
    },

    save: function(expiry) {
        if (AppCache.hasLocalStorage()) {
            localStorage.setItem(this.namespace, JSON.stringify(this.data));
        } else {
            if (!expiry) {
                let d = new Date();
                d.setHours( d.getHours() + 12 );
                expiry = d.toUTCString();
            }

            document.cookie = `${this.namespace} = ${JSON.stringify(this.data)}; expires = ${expiry};`;
        }
    },

    set: function(key, value) {
        this.data[key] = value;
        this.save();
        return this;
    },

    get: function(key) {
        return this.data[key];
    }
};

AppCache.prototype.constructor = AppCache;

AppCache.hasLocalStorage = function() {
    return typeof localStorage !== "undefined";
};


module.exports = AppCache;
},{}],2:[function(require,module,exports){
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

},{"./AppCache":1}],3:[function(require,module,exports){
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

	socket.on('peer2signal', function(data) {
		config.onPeer2Signal(data);
	});

	socket.on('peer1signal', function(data) {
		config.onPeer1Signal(data);
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
},{}],4:[function(require,module,exports){

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
},{}],5:[function(require,module,exports){
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
		chatHandler.send('peerrequest');
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

						onPeerRequest: function() {
							if (!videoStarted && confirm('User is requesting a video chat with you. Would you like to accept?')) {
								initVideo(true);
								// signal peer 2
							}
						},

						onPeer2Signal: function(otherData) {
							initVideo(false, function() {
								user.peerData.peer.signal(otherData);
							});
						},

						onPeer1Signal: function(data) {
							user.peerData.peer.signal(data);
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

	if (msg.by === 'videobot') {
		$('#messages').append('<div class="row center"><div class="p-t-10 p-b-10 col s10 offset-s1 m8 offset-m2 grey lighten-2 black-text">'+msg.content+' '+renderDate(msg.date)+'</div></div>');
	} else {
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

        	friendVideo.width(window.innerWidth);
        	friendVideo.height(window.innerHeight);

        	selfVideo.get(0).src = window.URL.createObjectURL(stream);
        	selfVideo.get(0).play();
        	
        	frame.show();

        	var peer = new SimplePeer({
        		initiator: initiator,
        		trickle: false,
        		stream: stream
        	});

        	user.peerData = {
        		peer: peer,
        		id: null,
        		otherId: null,
        		hasSignalled: false
        	};

        	peer.on('signal', function(data) {
        		if (user.peerData.hasSignalled) return;
        		user.peerData.hasSignalled = true;
        		user.peerData.id = data;
        		// alert('signal received');
        		if (initiator) {
        			cb && cb(data);
        			chatHandler.send('peer2signal', data);
        		} else {
        			cb && cb(data);
        			chatHandler.send('peer1signal', data);
        		}
        	});

        	peer.on('stream', function(data) {
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

		result.issues.reverse().forEach(addIssue);
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
},{"../chat":3}],6:[function(require,module,exports){

module.exports = function( app ) {
	$('.sidenav').sidenav();
    $('select').formSelect();
	
    // $('.fixed-action-btn').floatingActionButton();
};
},{}],7:[function(require,module,exports){
module.exports = [
	require('./ActivateController'),
	require('./IssuesController'),
	require('./NavigationController')
];
},{"./ActivateController":4,"./IssuesController":5,"./NavigationController":6}],8:[function(require,module,exports){
var app = window.app = require('../app');
var controllers = require('./controllers');

$(document).ready(function() {
	
	// initialize 'em all
	for (var i = 0; i < controllers.length; i++) {
		controllers[i](app);
	}
	// controllers end
	
});
},{"../app":2,"./controllers":7}]},{},[8]);

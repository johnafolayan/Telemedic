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

var DEBUG = true;
// var placeholder = require('./placeholder');
var app = require('./app');

$(document).ready(function() {
    app.init();
    // placeholder();

    $('.sidenav').sidenav();
    $('.parallax').parallax();
    $('.datepicker').datepicker({
        yearRange: [1950, new Date().getFullYear()]
    });
    $('select').formSelect();

    $('a[href*=#]').click(function(evt) {
        var href = $(this).attr('href').replace('/', '');

        if (href.length > 2) {
            var target = $(href);

            if (target.length) {
                evt.preventDefault();
                var top = target.offset().top;

                $('html, body').stop().animate({
                    scrollTop: top
                }, 350);
            }
        }
    });

    var forceHide = false;

    function toggleSignupButtonState() {
        var empty = els.filter(function(i, el) {
            return !$(el).val();
        });

        if (!empty.length && !forceHide) 
            $('#signup-form .btn').removeClass('disabled');
        else
            $('#signup-form .btn').addClass('disabled');
    }

    switch (app.getCurrentPage()) {
        case '/signup':
            var els = $('#signup-form .validate');
            setTimeout(toggleSignupButtonState, 1000);

            els.on('input', function(evt) {
                toggleSignupButtonState();
            });

            var pwd = $('#password');
            $('#confirmPassword').on('input', function(evt) {
                if ($(this).val() === pwd.val()) {
                    forceHide = false;
                    $(this).siblings('.helper-text').hide();
                    toggleSignupButtonState();
                } else {
                    forceHide = true;
                    $(this).siblings('.helper-text').show();
                    toggleSignupButtonState();
                }
            });

            $('#signup-form').submit(function(evt) {
                if ($('#signup-form .btn').hasClass('disabled')) {
                    evt.preventDefault();
                    return false;
                }
                return true;
            });
            break;
        case '/login':
            setTimeout(function() {
                $('#loginMsg').fadeOut(); 
            }, 5000);
            break;
        default:
            break;
    }

});
},{"./app":2}]},{},[3]);

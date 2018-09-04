
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
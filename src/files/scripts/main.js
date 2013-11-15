/*global require */

require.config({
    paths: {
        'jquery': '../vendor/jquery/jquery',
        'webfont': '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont'
    },
    shim: {
        'jquery': {
            exports: 'jQuery'
        },
        'webfont': {
            exports: 'WebFont'
        }
    }
});

/* Begin rAF polyfill */

// Adapted from https://gist.github.com/paulirish/1579671 which derived from
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller.
// Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon

// MIT license

if (!Date.now)
    Date.now = function() { return new Date().getTime(); };

(function() {
    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                   || window[vp+'CancelRequestAnimationFrame']);
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
        || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
        var lastTime = 0;
        window.requestAnimationFrame = function(callback) {
            var now = Date.now();
            var nextTime = Math.max(lastTime + 16, now);
            return setTimeout(function() { callback(lastTime = nextTime); },
                              nextTime - now);
        };
        window.cancelAnimationFrame = clearTimeout;
    }
}());

/* End rAF polyfill */

require([
    './webfont',
    './Application',
    './Renderer',
    './testTileSet'
], function (WebFont, Application, Renderer, articleSet) {
    'use strict';

    WebFont.load({
        custom: {
            families: [ 'Plantin', 'PlantinBold', /*'PlantinBoldItalic',*/ 'TradeGothic', 'TradeGothicBold' ],
            urls: [ '/styles/index.css' ]
        },
        active: function () {
            var app = new Application(articleSet),
                renderer;

            window.setTimeout(function () {
                window.requestAnimationFrame(function () {
                    renderer = new Renderer(app);
                    document.body.classList.add('loaded');
                });
            }, 1000); //todo: not this?
        }
    });
});

/**
 * The entry point of our application.
 */

'use strict';

/**
 * Dependencies
 */
var $ = require('../vendor/jquery/jquery.js');
var Renderer = require('./Renderer');
var Application = require('./Application');
var articleSet = require('./testTileSet');
var Polyfill = require('script!./Polyfill.js');

/**
 * Load the webfonts.
 */
$.getScript('http://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js', function() {
    WebFont.load({
        custom: {
            families: [ 'Plantin', 'PlantinBold', /*'PlantinBoldItalic',*/ 'TradeGothic', 'TradeGothicBold' ],
            urls: [ '/styles/fonts.css' ]
        },
        active: function () {
            //todo: not this?
            window.setTimeoutWithRAF(function () {
                new Renderer(new Application(articleSet));
                window.setTimeoutWithRAF(function () {
                    $(document.body).addClass('loaded');
                }, 900);
            }, 300);
        }
    });
});

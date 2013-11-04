/*global require */

require.config({
    paths: {
        'jquery': '//code.jquery.com/jquery-2.0.0.min'
    },
    shim: {
        'jquery': {
            exports: 'jQuery'
        }
    }
});

require([
    './Application',
    './Renderer',
    './testTileSet'
], function (Application, Renderer, articleSet) {
    'use strict';

    var app = new Application(articleSet),
        renderer = new Renderer(app);

});

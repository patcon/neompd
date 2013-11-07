/*global require */

require.config({
    paths: {
        'jquery': '../vendor/jquery/jquery'
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

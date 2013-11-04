/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    var CONTENT_URL_PREFIX = '/posts/';

    function Article(slug) {
        var content = $.Deferred(),
            contentUrl = CONTENT_URL_PREFIX + slug;

        content.promise(this);

        this.testTimeoutId = window.setTimeout(function () {
            content.resolve('<h1>Article from: ' + slug + '</h1><p>Lorem ipsum Magna eiusmod reprehenderit id tempor ad id elit esse fugiat id tempor nostrud id dolore ullamco est Excepteur proident non tempor sunt adipisicing fugiat nisi officia ullamco eu nostrud occaecat cillum mollit Excepteur cillum occaecat do Excepteur ut ad ut ut ad esse ut quis proident quis pariatur eu est mollit dolor et Ut Excepteur ullamco dolore minim in incididunt culpa incididunt occaecat esse commodo est nulla aute amet proident eiusmod magna do amet ut reprehenderit adipisicing sit aliquip veniam aliquip cupidatat Ut tempor consectetur et dolor officia eiusmod aute id ex ad dolor do consequat est nulla in adipisicing eu mollit Excepteur quis Ut adipisicing in mollit exercitation sunt deserunt irure labore deserunt pariatur irure aute eiusmod nisi irure qui dolore in occaecat in ea nostrud ut nostrud in aliqua in irure culpa ex reprehenderit fugiat dolor ullamco Ut in consequat reprehenderit dolore deserunt sint adipisicing quis ex eiusmod magna sunt cillum enim proident id sunt elit amet anim labore quis labore elit ad et officia.</p>');
        }.bind(this), 500);
    }

    Article.prototype.destroy = function () {
        window.clearTimeout(this.testTimeoutId);

        $(this).trigger('destroyed');
    };

    return Article;
});

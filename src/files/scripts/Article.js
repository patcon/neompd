/*global define */

var $ = require('../vendor/jquery/jquery.js');

    'use strict';

    var CONTENT_URL_PREFIX = '/posts/',
        CONTENT_URL_SUFFIX = '.html';

    function Article(slug) {
        this.content = $.ajax({
            url: CONTENT_URL_PREFIX + slug + CONTENT_URL_SUFFIX,
            dataType: 'html' // todo: may not be needed
        });
    }

    Article.prototype.destroy = function () {
        // cancel in-flight transfer
        this.content.abort();

        $(this).trigger('destroyed');
    };

module.exports = Article;


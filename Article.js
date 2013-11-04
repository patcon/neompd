/*global define */

define([
	'jquery'
], function ($) {
    'use strict';

    function Article() {
		var content = $.Deferred();

		content.promise(this);

		this.testTimeoutId = window.setTimeout(function () {
			content.resolve('<p>FUCK YEAH RON SWANSON</p>');
		}.bind(this), 500);
    }

    Article.prototype.destroy = function () {
    	window.clearTimeout(this.testTimeoutId);

    	$(this).trigger('destroyed');
    };

    return Article;
});
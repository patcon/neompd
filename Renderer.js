/*global define */

define([
	'jquery'
], function ($) {
    'use strict';

    function Renderer(application) {
        var n, $li;

    	this.application = application;

        this.$grid = $('<div class="tile-grid"></div>').appendTo('#content');

        for (n in this.application.articles) {
            $li = $('<li></li>').appendTo(this.$grid);
            $('<a href=""></a>').attr('href', n).appendTo($li).html(this.application.articles[n]);
        }

        // initial render
    	this.onPageChange();

    	$(this.application).on('navigated', this.onPageChange.bind(this));
    }

    Renderer.prototype.onPageChange = function () {
    	if (this.application.currentArticle) {
			console.log('article view');			

    		$(this.application.currentArticle).on('destroyed', function () {
    			console.log('article destroyed');
    		})
    	} else {
			console.log('tile view');
    	}
    };

    return Renderer;
});
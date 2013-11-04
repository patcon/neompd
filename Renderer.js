/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    function Renderer(application) {
        var n, $li;

        this.application = application;

        this.$grid = $('<div class="tile-grid"></div>').appendTo('#content');
        this.$content = $('<div class="article"></div>').appendTo('#content');

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

            this.$grid.hide();

            this.application.currentArticle.done(function (html) {
                this.$content.html(html);
            }.bind(this));

            $(this.application.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        } else {
            console.log('tile view');
            this.$grid.show();
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
        this.$content.empty();
    };

    return Renderer;
});

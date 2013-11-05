/*global define */

define([
    'jquery',
    './TileField',
    './Article'
], function ($, TileField, Article) {
    'use strict';

    function Application(articles) {
        var hash = window.location.hash,
            slug = getSlug(hash); // @todo determine slug from hash

        this.currentTag = null; // null is homepage, otherwise tag ID
        this.currentArticle = slug ? new Article(slug) : null; // current article view state

        if (this.currentArticle) {
            $(this.currentArticle).on('scrolledAbove scrolledBelow', function () {
                if (Math.abs(this.currentArticle.scrollBackAmount) === 1) {
                    window.location = '#';
                }
            }.bind(this));
        }

        this.articles = articles;

        this.tileField = new TileField(articles);

        // @todo this needs proper implementation
        window.addEventListener("hashchange", this.onHashChange.bind(this), false);

        this.onHashChange();
    }

    function getSlug(hash) {
        var tokens = /^#articles\/(.+)/.exec(hash);
        return tokens && tokens[1];
    }

    Application.prototype.onHashChange = function () {
        var hash = window.location.hash,
            slug = getSlug(hash);

        if (this.currentArticle) {
            this.currentArticle.destroy();
        }

        this.currentArticle = slug ? new Article(slug) : null; // @todo this of course

        if (this.currentArticle) {
            $(this.currentArticle).on('scrolledAbove scrolledBelow', function () {
                if (Math.abs(this.currentArticle.scrollBackAmount) === 1) {
                    window.location = '#';
                }
            }.bind(this));
        }

        $(this).trigger('navigated');
    };

    return Application;
});

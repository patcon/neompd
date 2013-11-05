/*global define */

define([
    'jquery',
    './TileField',
    './Article'
], function ($, TileField, Article) {
    'use strict';

    function Application(articles) {
        this.currentTag = null; // null is homepage, otherwise tag ID
        this.currentArticle = null; // current article view state

        this.articles = articles;

        this.tileField = new TileField(articles);

        // @todo this needs proper implementation
        window.addEventListener("hashchange", this.onHashChange.bind(this), false);

        this.onHashChange();
    }

    Application.prototype.onHashChange = function () {
        var hash = window.location.hash,
            slug = hash; // @todo determine slug from hash

        if (this.currentArticle) {
            this.currentArticle.destroy();
        }

        this.currentArticle = slug ? new Article(slug) : null; // @todo this of course

        $(this).trigger('navigated');
    };

    return Application;
});

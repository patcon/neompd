/*global define */

define([
    'jquery',
    './TileField',
    './Article'
], function ($, TileField, Article) {
    'use strict';

    function Application(articles) {
        var slug = getSlug(window.location.hash);

        this.currentTag = null; // null is homepage, otherwise tag ID
        this.currentArticle = slug ? new Article(slug) : null; // current article view state

        this.tileField = new TileField(articles);

        // @todo this needs proper implementation
        window.addEventListener('hashchange', this.onHashChange.bind(this), false);

        this.onHashChange();
    }

    function getSlug(hash) {
        var tokens = /^#articles\/(.+)/.exec(hash);
        return tokens && tokens[1];
    }

    Application.prototype.onHashChange = function () {
        var slug = getSlug(window.location.hash);

        if (this.currentArticle) {
            this.currentArticle.destroy();
        }

        this.currentArticle = slug ? new Article(slug) : null; // @todo this of course

        $(this).trigger('navigated');
    };

    return Application;
});

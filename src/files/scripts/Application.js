/*global define */

var $ = require('../vendor/jquery/jquery.js');
var TileField = require('./TileField');
var Article = require('./Article');

    'use strict';

    function getArticleSlug(hash) {
        var tokens = /^#articles\/(.+)/.exec(hash);
        return tokens && tokens[1];
    }

    function getTagSlug(hash) {
        var tokens = /^#tags\/(.+)/.exec(hash);
        return tokens && tokens[1];
    }

    function Application(articles) {
        var slug = getArticleSlug(window.location.hash),
            tagSlug = getTagSlug(window.location.hash);

        this.$ = $(this);
        this.lastLinkClickTime = 0;

        this.currentTag = null; // null is homepage, otherwise tag ID
        this.currentArticle = slug ? new Article(slug) : null; // current article view state

        this.tileField = new TileField(articles);

        if (tagSlug) {
            this.tileField.setFilterTag(tagSlug);
        }

        // @todo this needs proper implementation
        $(window).on('hashchange', this.onHashChange.bind(this));
        $('body').on('click', 'a[href]', this.onAnyLinkClick.bind(this));

        this.onHashChange();
    }

    Application.prototype.onAnyLinkClick = function (e) {
        this.lastLinkClickTime = new Date().getTime();
    };

    Application.prototype.onHashChange = function () {
        var slug = getArticleSlug(window.location.hash),
            tagSlug = getTagSlug(window.location.hash),

            isViaLinkClick = (this.lastLinkClickTime >= new Date().getTime() - 50);

        if (this.currentArticle) {
            this.currentArticle.destroy();
        }

        this.currentArticle = slug ? new Article(slug) : null; // @todo this of course

        // update tag filter only if showing tiles
        if (!this.currentArticle) {
            this.tileField.setFilterTag(tagSlug || null);
        }

        this.$.trigger('navigated', [ isViaLinkClick ]);
    };

module.exports = Application;

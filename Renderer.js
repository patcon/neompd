/*global define */

define([
    'jquery',
    'TileRenderer'
], function ($, TileRenderer) {
    'use strict';

    function Renderer(app) {
        var tileId;

        this.app = app;

        $('#content').css({
            overflow: 'hidden'
        });

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo('#content').css({
            position: 'relative'
        });

        this.$content = $('<div class="article"></div>').appendTo('#content');

        this.app.tileField.doLayout(this.$content.outerWidth());

        this.updateGridViewport();
        this.updateMode();

        this.$content.css({ height: this.app.tileField.height });

        for (tileId in this.app.tileField.tileMap) {
            new TileRenderer(this.app.tileField.tileMap[tileId], this.app, this);
        }

        // todo: debounce
        $(window).on('resize', this.onResize.bind(this));
        $(window).on('scroll', this.onScroll.bind(this));

        $(this.app.tileField).on('changed', function () {
            if (!this.app.currentArticle) {
                this.$content.css({ height: this.app.tileField.height });
            }
        }.bind(this));

        $(this.app).on('navigated', function () {
            this.updateMode();
        }.bind(this));
    }

    Renderer.prototype.updateGridViewport = function () {
        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            gridOffset = this.$grid.offset();

        if (!this.app.currentArticle) {
            this.gridViewportLeft = -gridOffset.left; // @todo support horizontal scroll?
            this.gridViewportTop = scrollTop - gridOffset.top;
            this.gridViewportBottom = scrollTop + scrollHeight - gridOffset.top;

            $(this).trigger('viewport');
        }
    };

    Renderer.prototype.updateMode = function () {
        if (this.app.currentArticle) {
            console.log('article view');

            // @todo reset scrolltop to zero, but only if loading a new article
            // clear minimum content height from grid size
            this.$content.css({ height: '' });

            this.app.currentArticle.content.done(function (html) {
                this.$content.html(html);
            }.bind(this));

            $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        } else {
            console.log('tile view');

            // set minimum content height to extend to grid size
            this.$content.css({ height: this.app.tileField.height });
            this.$content.empty();
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
    };

    Renderer.prototype.onScroll = function () {
        this.updateGridViewport();
    };

    Renderer.prototype.onResize = function () {
        this.app.tileField.doLayout(this.$content.outerWidth());
    };

    return Renderer;
});

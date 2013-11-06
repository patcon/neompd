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

        this.gridOffsetInArticle = null;

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

        if (this.gridOffsetInArticle !== null) {
            this.$grid.css({
                top: this.gridOffsetInArticle + scrollTop
            });

            return;
        }

        this.gridViewportTop = scrollTop - gridOffset.top;
        this.gridViewportBottom = scrollTop + scrollHeight - gridOffset.top;
    };

    Renderer.prototype.updateMode = function () {
        var articleOffset = this.$content.offset();

        if (this.app.currentArticle) {
            console.log('article view');

            if (this.gridOffsetInArticle === null) {
                this.gridOffsetInArticle = -this.gridViewportTop - articleOffset.top;

                // @todo reset scrolltop to zero, but only if loading a new article
                this.$grid.css({
                    top: this.gridOffsetInArticle
                });

                // clear minimum content height from grid size
                this.$content.css({ height: '' });

                $(this).trigger('tilesDismissed');
            }

            this.app.currentArticle.content.done(function (html) {
                this.$content.html(html);
            }.bind(this));

            $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        } else {
            console.log('tile view');

            if (this.gridOffsetInArticle !== null) {
                this.gridOffsetInArticle = null;

                this.$grid.css({
                    top: 0
                });

                // set minimum content height to extend to grid size
                this.$content.css({ height: this.app.tileField.height });
                this.$content.empty();

                $(this).trigger('tilesRestored');
            }
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
    };

    Renderer.prototype.onScroll = function () {
        this.updateGridViewport();

        $(this).trigger('viewport');
    };

    Renderer.prototype.onResize = function () {
        this.app.tileField.doLayout(this.$content.outerWidth());
    };

    return Renderer;
});

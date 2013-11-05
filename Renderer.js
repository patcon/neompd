/*global define */

define([
    'jquery'
], function ($) {
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

        this.updateGridViewport();

        var refreshLayout = (function () {
            this.app.tileField.doLayout(this.$content.width());

            if (!this.app.currentArticle) {
                this.$content.css({ height: this.app.tileField.height });
            }
        }).bind(this);

        refreshLayout();

        for (tileId in this.app.tileField.tileMap) {
            this.createTile(tileId, this.app.tileField.tileMap[tileId]);
        }

        // todo: debounce
        $(window).on('resize', refreshLayout);
        $(window).on('scroll', this.onScroll.bind(this));
        $(this.app).on('navigated', this.onPageChange.bind(this));
    }

    Renderer.prototype.createTile = function (tileId, tile) {
        var $li = $('<li></li>').appendTo(this.$grid),
            isRevealed = false,
            isDismissing = false,
            isBelowMiddle = false,

            renderedX = null,
            renderedY = null,
            renderedOpacity = null,

            renderTile,
            checkReveal;

        $li.html(tile.html);

        $li.css({
            position: 'absolute',
            transition: 'top 1s, left 1s, opacity 1.5s',
            opacity: 0
        });

        renderTile = function () {
            var tileOpacity = isRevealed ? 1 : 0,
                tileX = tile.x,
                tileY = tile.y + (isDismissing ? (isBelowMiddle ? 200 : -200) : 0);

            if (renderedX !== tileX || renderedY !== tileY) {
                $li.css({
                    left: renderedX = tileX,
                    top: renderedY = tileY
                });
            }

            if (renderedOpacity !== tileOpacity) {
                $li.css({
                    opacity: renderedOpacity = tileOpacity
                });
            }
        };

        $(tile).on('moved', function () {
            renderTile();
            checkReveal();
        }.bind(this));

        $(this).on('tilesDismissed', function () {
            var gridViewportMidpoint;

            if (!isRevealed) {
                return;
            }

            isRevealed = false;

            gridViewportMidpoint = (this.gridViewportTop + this.gridViewportBottom) * 0.5;

            if (tile.y + tile.height > this.gridViewportTop && tile.y < this.gridViewportBottom) {
                isDismissing = true;
                isBelowMiddle = tile.y + tile.height * 0.5 > gridViewportMidpoint;
            } else {
                isDismissing = false;
            }

            renderTile();
        }.bind(this));

        $(this).on('tilesRestored', function () {
            isDismissing = false;

            renderTile();
            checkReveal();
        }.bind(this));

        checkReveal = function () {
            if (isRevealed || this.app.currentArticle) {
                return;
            }

            if (tile.y + tile.height > this.gridViewportTop && tile.y < this.gridViewportBottom) {
                isRevealed = true;
            }

            renderTile();
        }.bind(this);

        checkReveal();

        $(this).on('viewport', checkReveal);
    };

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

    Renderer.prototype.onPageChange = function () {
        if (this.app.currentArticle) {
            console.log('article view');

            if (this.gridOffsetInArticle === null) {
                this.gridOffsetInArticle = -this.gridViewportTop;

                // @todo reset scrolltop to zero, but only if loading a new article
                this.$grid.css({
                    top: this.gridOffsetInArticle
                });

                // clear minimum content height from grid size
                this.$content.css({ height: '' });

                $(this).trigger('tilesDismissed');
            }

            this.app.currentArticle.done(function (html) {
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

                $(this).trigger('tilesRestored');
            }
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
        this.$content.empty();
    };

    Renderer.prototype.onScroll = function () {
        this.updateGridViewport();

        $(this).trigger('viewport');
    };

    return Renderer;
});

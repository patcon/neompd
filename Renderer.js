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

        this.app.tileField.doLayout(this.$content.outerWidth());

        this.updateGridViewport();
        this.updateMode();

        this.$content.css({ height: this.app.tileField.height });

        for (tileId in this.app.tileField.tileMap) {
            this.createTile(tileId, this.app.tileField.tileMap[tileId]);
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

    Renderer.prototype.createTile = function (tileId, tile) {
        var $li = $('<li></li>').appendTo(this.$grid),
            isRevealed = false,
            isDismissing = false,
            isDoneDismissing = false,
            isBelowMiddle = false,

            renderedX = null,
            renderedY = null,
            renderedOpacity = null,
            renderedTransition = false,

            renderTile,
            checkReveal;

        $li.html(tile.html);

        $li.css({
            position: 'absolute',
            opacity: 0
        });

        renderTile = function () {
            var scrollBackAmount = this.app.currentArticle ? this.app.currentArticle.scrollBackAmount : 0,
                animationAmount = Math.abs(scrollBackAmount),
                verticalOffset = isDismissing ?
                    (isBelowMiddle ? 1 : -1) * (isDoneDismissing ? (1 - animationAmount) * 300 : 200) :
                    0,

                tileOpacity = isRevealed ? 1 : (isDismissing && isDoneDismissing ? animationAmount : 0),
                tileX = tile.x,
                tileY = tile.y + verticalOffset,
                tileTransition = isDismissing && isDoneDismissing ? false : true;

            // update transitioning first
            if (renderedTransition !== tileTransition) {
                $li.css({
                    transition: (renderedTransition = tileTransition) ? 'top 1s, left 1s, opacity 1.5s' : 'none'
                });
            }

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
        }.bind(this);

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
                isDoneDismissing = false;
                isBelowMiddle = tile.y + tile.height * 0.5 > gridViewportMidpoint;

                $(this.app.currentArticle).on('scrolledAbove scrolledBelow returnedAbove returnedBelow', function () {
                    isDoneDismissing = true;

                    renderTile();
                }.bind(this));
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

        renderTile();
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

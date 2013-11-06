/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    function TileRenderer(tile, app, renderer) {
        this.app = app;
        this.tile = tile;
        this.renderer = renderer;

        var $li = $('<li></li>').appendTo(this.renderer.$grid),
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

        $li.html(this.tile.html);

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
                tileX = this.tile.x,
                tileY = this.tile.y + verticalOffset,
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

        $(this.tile).on('moved', function () {
            renderTile();
            checkReveal();
        }.bind(this));

        $(this.renderer).on('tilesDismissed', function () {
            var gridViewportMidpoint;

            if (!isRevealed) {
                return;
            }

            isRevealed = false;

            gridViewportMidpoint = (this.renderer.gridViewportTop + this.renderer.gridViewportBottom) * 0.5;

            if (this.tile.y + this.tile.height > this.renderer.gridViewportTop && this.tile.y < this.renderer.gridViewportBottom) {
                isDismissing = true;
                isDoneDismissing = false;
                isBelowMiddle = this.tile.y + this.tile.height * 0.5 > gridViewportMidpoint;

                $(this.app.currentArticle).on('scrolledAbove scrolledBelow returnedAbove returnedBelow', function () {
                    isDoneDismissing = true;

                    renderTile();
                }.bind(this));
            } else {
                isDismissing = false;
            }

            renderTile();
        }.bind(this));

        $(this.renderer).on('tilesRestored', function () {
            isDismissing = false;

            renderTile();
            checkReveal();
        }.bind(this));

        checkReveal = function () {
            if (isRevealed || this.app.currentArticle) {
                return;
            }

            if (this.tile.y + this.tile.height > this.renderer.gridViewportTop && this.tile.y < this.renderer.gridViewportBottom) {
                isRevealed = true;
            }

            renderTile();
        }.bind(this);

        renderTile();
        checkReveal();

        $(this.renderer).on('viewport', checkReveal);
    }

    return TileRenderer;
});

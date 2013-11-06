/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    function TileRenderer(tile, app, renderer) {
        this.app = app;
        this.tile = tile;
        this.renderer = renderer;

        this.$li = $('<li></li>').appendTo(this.renderer.$grid);
        this.isRevealed = false;
        this.isDismissing = false;
        this.isDoneDismissing = false;
        this.isBelowMiddle = false;

        this.renderedX = null;
        this.renderedY = null;
        this.renderedOpacity = null;
        this.renderedTransition = false;

        this.$li.html(this.tile.html);

        this.$li.css({
            position: 'absolute',
            opacity: 0
        });

        this.renderTile();
        this.checkReveal();

        $(this.tile).on('moved', this.onMoved.bind(this));
        $(this.renderer).on('tilesDismissed', this.onTilesDismissed.bind(this));
        $(this.renderer).on('tilesRestored', this.onTilesRestored.bind(this));
        $(this.renderer).on('viewport', this.onViewport.bind(this));
    }

    TileRenderer.prototype.renderTile = function () {
        var scrollBackAmount = this.app.currentArticle ? this.app.currentArticle.scrollBackAmount : 0,
            animationAmount = Math.abs(scrollBackAmount),
            verticalOffset = this.isDismissing ?
                (this.isBelowMiddle ? 1 : -1) * (this.isDoneDismissing ? (1 - animationAmount) * 300 : 200) :
                0,

            tileOpacity = this.isRevealed ? 1 : (this.isDismissing && this.isDoneDismissing ? animationAmount : 0),
            tileX = this.tile.x,
            tileY = this.tile.y + verticalOffset,
            tileTransition = this.isDismissing && this.isDoneDismissing ? false : true;

        // update transitioning first
        if (this.renderedTransition !== tileTransition) {
            this.$li.css({
                transition: (this.renderedTransition = tileTransition) ? 'top 1s, left 1s, opacity 1.5s' : 'none'
            });
        }

        if (this.renderedX !== tileX || this.renderedY !== tileY) {
            this.$li.css({
                left: this.renderedX = tileX,
                top: this.renderedY = tileY
            });
        }

        if (this.renderedOpacity !== tileOpacity) {
            this.$li.css({
                opacity: this.renderedOpacity = tileOpacity
            });
        }
    };

    TileRenderer.prototype.checkReveal = function () {
        if (this.isRevealed || this.app.currentArticle) {
            return;
        }

        if (this.tile.y + this.tile.height > this.renderer.gridViewportTop && this.tile.y < this.renderer.gridViewportBottom) {
            this.isRevealed = true;
        }

        this.renderTile();
    };

    TileRenderer.prototype.onMoved = function () {
        this.renderTile();
        this.checkReveal();
    };

    TileRenderer.prototype.onTilesDismissed = function () {
        var gridViewportMidpoint;

        if (!this.isRevealed) {
            return;
        }

        this.isRevealed = false;

        gridViewportMidpoint = (this.renderer.gridViewportTop + this.renderer.gridViewportBottom) * 0.5;

        if (this.tile.y + this.tile.height > this.renderer.gridViewportTop && this.tile.y < this.renderer.gridViewportBottom) {
            this.isDismissing = true;
            this.isDoneDismissing = false;
            this.isBelowMiddle = this.tile.y + this.tile.height * 0.5 > gridViewportMidpoint;

            $(this.app.currentArticle).on('scrolledAbove scrolledBelow returnedAbove returnedBelow', function () {
                this.isDoneDismissing = true;

                this.renderTile();
            }.bind(this));
        } else {
            this.isDismissing = false;
        }

        this.renderTile();
    };

    TileRenderer.prototype.onTilesRestored = function () {
        this.isDismissing = false;

        this.renderTile();
        this.checkReveal();
    };

    TileRenderer.prototype.onViewport = function () {
        this.checkReveal();
    };

    return TileRenderer;
});

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

        this.isArticleMode = (this.app.currentArticle ? true : false);

        this.isRevealed = false;

        this.isDismissing = false;
        this.isDoneDismissing = false;
        this.isBelowMiddle = false;

        this.renderedFixed = null;
        this.renderedTransform = null;
        this.renderedOpacity = null;
        this.renderedTransition = false;
        this.renderedNoEvents = false;

        this.$li.html(this.tile.html);

        this.$li.css({
            position: 'absolute',
            opacity: 0,
            top: 0,
            left: 0
        });

        if (this.isArticleMode) {
            this.initializeArticleModeState();
        } else {
            this.isRevealed = this.getVisibility();
        }

        this.renderTile();

        $(this.tile).on('moved', this.onMoved.bind(this));
        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.renderer).on('viewport', this.onViewport.bind(this));
    }

    TileRenderer.prototype.renderTile = function () {
        var scrollBackAmount = this.app.currentArticle ? this.app.currentArticle.scrollBackAmount : 0,
            animationAmount = Math.abs(scrollBackAmount),
            verticalOffset = (this.isArticleMode && this.isDismissing) ?
                (this.isBelowMiddle ? 1 : -1) * (this.isDoneDismissing ? (1 - animationAmount) * 300 : 200) :
                0,

            tileNoEvents = !(!this.isArticleMode && this.isRevealed),
            tileFixed = (this.isArticleMode && this.isDismissing),
            tileOpacity = (!this.isArticleMode && this.isRevealed) ? 1 : (this.isArticleMode && this.isDismissing && this.isDoneDismissing ? animationAmount : 0),
            tileTransform = 'translate3d(' + this.tile.x + 'px,' + (this.tile.y + verticalOffset) + 'px,0)',
            tileTransition = this.isArticleMode ? (this.isDismissing && !this.isDoneDismissing) : this.isRevealed;

        // update transitioning first
        if (this.renderedTransition !== tileTransition) {
            this.$li.css({
                transition: (this.renderedTransition = tileTransition) ? '-webkit-transform 1s, opacity 1.5s' : 'none'
            });
        }

        if (this.renderedFixed !== tileFixed) {
            this.$li.css({
                position: (this.renderedFixed = tileFixed) ? 'fixed' : 'absolute',
                top: tileFixed ? -this.renderer.gridViewportTop : 0,
                left: tileFixed ? -this.renderer.gridViewportLeft : 0
            });
        }

        if (this.renderedNoEvents !== tileNoEvents) {
            this.$li.css({
                'pointer-events': (this.renderedNoEvents = tileNoEvents) ? 'none' : 'auto'
            });
        }

        if (this.renderedTransform !== tileTransform) {
            this.$li.css({
                transform: this.renderedTransform = tileTransform
            });
        }

        if (this.renderedOpacity !== tileOpacity) {
            this.$li.css({
                opacity: this.renderedOpacity = tileOpacity
            });
        }
    };

    TileRenderer.prototype.getVisibility = function () {
        return (this.tile.y + this.tile.height > this.renderer.gridViewportTop && this.tile.y < this.renderer.gridViewportBottom);
    };

    TileRenderer.prototype.initializeArticleModeState = function () {
        var gridViewportMidpoint = (this.renderer.gridViewportTop + this.renderer.gridViewportBottom) * 0.5;

        if (this.getVisibility()) {
            this.isDismissing = true;
            this.isDoneDismissing = false;
            this.isBelowMiddle = this.tile.y + this.tile.height * 0.5 > gridViewportMidpoint;

            $(this.app.currentArticle).on('scrollBackChanged', function () {
                this.isDoneDismissing = true;

                this.renderTile();
            }.bind(this));
        } else {
            this.isDismissing = false;
        }
    };

    TileRenderer.prototype.onMoved = function () {
        this.renderTile();

        if (!this.isArticleMode) {
            this.isRevealed = this.getVisibility();
            this.renderTile();
        }
    };

    TileRenderer.prototype.onNavigated = function () {
        if (this.isArticleMode && !this.app.currentArticle) {
            this.isArticleMode = false;
            this.isRevealed = this.getVisibility();
        } else if (!this.isArticleMode && this.app.currentArticle) {
            this.isArticleMode = true;
            this.initializeArticleModeState();
        }

        this.renderTile();
    };

    TileRenderer.prototype.onViewport = function () {
        if (this.isArticleMode) {
            throw 'cannot change viewport in article mode';
        }

        this.isRevealed = this.getVisibility();
        this.renderTile();
    };

    return TileRenderer;
});

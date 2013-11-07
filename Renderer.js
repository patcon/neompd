/*global define */

define([
    'jquery',
    'TileRenderer'
], function ($, TileRenderer) {
    'use strict';

    var MOUSEWHEEL_INERTIA_DELAY = 100;

    function Renderer(app) {
        var tileId;

        this.app = app;

        $('#content').css({
            overflow: 'hidden'
        });

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo('#content').css({
            position: 'relative'
        });

        this.$content = $('<div class="article"></div>').appendTo('#content').css({
            transform: 'translateZ(0)',
            opacity: 0
        });

        this.app.tileField.doLayout(this.$grid.outerWidth());

        this.gridViewport = this.computeGridViewport();

        this.articleScrollBackStartTime = 0;
        this.articleScrollBackAmount = 0; // [-1..1], negative is on top, positive on bottom

        this.updateMode();

        this.$content.css({ height: this.app.tileField.height });

        // todo: debounce
        $(window).on('resize', this.onResize.bind(this));
        $(window).on('scroll', this.onScroll.bind(this));
        $(window).on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app.tileField).on('changed', function () {
            if (!this.app.currentArticle) {
                this.$content.css({ height: this.app.tileField.height });
            }
        }.bind(this));

        $(this.app).on('navigated', function () {
            this.updateMode();
        }.bind(this));

        $(this).on('scrollBackChanged', this.onScrollBackChanged.bind(this));

        // create tiles afterwards, so that we get the navigation event before them
        // @todo fix the reliance on event callback ordering!
        for (tileId in this.app.tileField.tileMap) {
            new TileRenderer(this.app.tileField.tileMap[tileId], this.app, this);
        }
    }

    Renderer.prototype.computeGridViewport = function () {
        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            gridOffset = this.$grid.offset();

        return {
            left: -gridOffset.left, // @todo support horizontal scroll?
            top: scrollTop - gridOffset.top,
            bottom: scrollTop + scrollHeight - gridOffset.top
        };
    };

    Renderer.prototype.updateMode = function () {
        if (this.app.currentArticle) {
            console.log('article view');

            this.articleScrollBackStartTime = 0;
            this.articleScrollBackAmount = 0;

            // @todo reset scrolltop to zero, but only if loading a new article
            // clear minimum content height from grid size
            this.$content.css({
                height: '',
                transition: 'opacity 0.5s',
                opacity: 1
            });

            this.app.currentArticle.content.done(function (html) {
                this.$content.html(html);
            }.bind(this));

            // reset view top
            $(window).scrollTop(0);

            $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        } else {
            console.log('tile view');

            // set minimum content height to extend to grid size
            this.$content.css({
                height: this.app.tileField.height,
                transition: 'opacity 0.5s',
                opacity: 0
            });

            // restore view to where it should be
            $(window).scrollTop(this.gridViewport.top + this.$grid.offset().top);
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
    };

    Renderer.prototype.onScroll = function () {
        if (!this.app.currentArticle) {
            this.gridViewport = this.computeGridViewport();

            $(this).trigger('viewport');
        }
    };

    Renderer.prototype.onResize = function () {
        this.app.tileField.doLayout(this.$grid.outerWidth());
    };

    Renderer.prototype.onScrollBackChanged = function (e) {
        this.$content.css({
            transition: 'none',
            opacity: 1 - Math.abs(this.articleScrollBackAmount)
        });
    }

    Renderer.prototype.onMouseWheel = function (e) {
        var scrollBackDelta = -e.originalEvent.wheelDeltaY * 0.003, // hardware delta is more than pixel speed
            currentTime = new Date().getTime(),

            scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            bodyHeight = $(document).height();

        if (!this.app.currentArticle) {
            return;
        }

        if (this.articleScrollBackAmount < 0) {
            this.articleScrollBackAmount = Math.max(-1, this.articleScrollBackAmount + scrollBackDelta);

            if (this.articleScrollBackAmount >= 0) {
                this.articleScrollBackAmount = 0;
                this.articleScrollBackStartTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;
            }
        } else if (this.articleScrollBackAmount > 0) {
            this.articleScrollBackAmount = Math.min(1, this.articleScrollBackAmount + scrollBackDelta);

            if (this.articleScrollBackAmount <= 0) {
                this.articleScrollBackAmount = 0;
                this.articleScrollBackStartTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;
            }
        } else {
            // extra wait until existing mouse wheel inertia dies down
            if (this.articleScrollBackStartTime > currentTime) {
                this.articleScrollBackStartTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;
                return;
            }

            // check for gesture start
            if (scrollTop <= 0 && scrollBackDelta < 0) {
                this.articleScrollBackAmount += Math.max(-1, scrollBackDelta);
            } else if (scrollTop + scrollHeight >= bodyHeight && scrollBackDelta > 0) {
                this.articleScrollBackAmount += Math.min(1, scrollBackDelta);
            } else {
                // otherwise, prevent acting until mouse wheel inertia dies down
                this.articleScrollBackStartTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;
                return;
            }
        }

        // checking scrollback amount before our event is fired
        if (Math.abs(this.articleScrollBackAmount) === 1) {
            $(this).trigger('scrollBackChanged');

            window.location = '#'; // @todo this more elegantly
        } else {
            // prevent default only if not reached the end
            e.preventDefault();

            $(this).trigger('scrollBackChanged');
        }
    };

    return Renderer;
});

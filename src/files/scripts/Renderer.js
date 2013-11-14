/*global define */

define([
    'jquery',
    'TileRenderer'
], function ($, TileRenderer) {
    'use strict';

    var MOUSEWHEEL_INERTIA_DELAY = 100;

    function RenderDelayQueue() {
        var paintWaitId, paintFrameId;

        this.actionList = [];

        this.start = function () {
            if (paintWaitId || paintFrameId) {
                return;
            }

            paintFrameId = window.requestAnimationFrame(function () {
                var actionCallback;

                // signal we are no longer waiting for frame
                paintFrameId = null;

                if (this.actionList.length < 1) {
                    return;
                }

                paintWaitId = window.setTimeout(function () {
                    paintWaitId = null; // signal we are no longer waiting for another frame
                    this.start();
                }.bind(this), 50);

                // perform last in case an exception happens
                actionCallback = this.actionList.shift();
                actionCallback();
            }.bind(this));
        }.bind(this);
    }

    RenderDelayQueue.prototype.add = function (callback) {
        this.actionList.push(callback);
        this.start();
    };

    RenderDelayQueue.prototype.remove = function (callback) {
        var i, length = this.actionList.length;

        for (i = 0; i < length; i++) {
            if (this.actionList[i] === callback) {
                this.actionList.splice(i, 1);
                return;
            }
        }

        // fail fast to help catch bad code
        throw 'render callback not found';
    };

    function Renderer(app) {
        var tileId;

        this.app = app;

        this.queue = new RenderDelayQueue();

        $('#content').css({
            overflow: 'hidden'
        });

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo('#content').css({
            position: 'relative',
            transform: 'translateZ(0)'
        });

        this.$content = $('<div class="article"></div>').appendTo('#content').css({
            transform: 'translateZ(0)',
            opacity: 0
        });

        this.$loadingOverlay = $('<div class="loading-overlay"></div>').appendTo('#content');

        this.app.tileField.setContainerWidth(this.$grid.outerWidth());

        // cache offset for speed and to avoid browser-specific transform quirks (http://bugs.jquery.com/ticket/8362)
        this.gridOffset = this.$grid.offset();
        this.gridViewport = this.computeGridViewport();

        this.articleScrollTop = 0; // keep track of scroll top for possible transition
        this.articleScrollBackStartTime = 0;
        this.articleScrollBackAmount = 0; // [-1..1], negative is on top, positive on bottom

        if (this.app.currentArticle) {
            this.initializeArticleMode();
        } else {
            this.initializeTileMode();
        }

        // clear initial sizing on container after filling it out
        // (it exists to preserve initial browser position restoration)
        $('#content').css({
            'min-height': 0
        });

        // todo: debounce
        $(window).on('resize', this.onResize.bind(this));
        $(window).on('scroll', this.onScroll.bind(this));
        $(window).on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.app.tileField).on('changed', this.onTileFieldChanged.bind(this));

        $(this).on('scrollBackChanged', this.onScrollBackChanged.bind(this));

        // show/hide side bar tag in article view
        $('#menu-button').on('click', function () { $('#menu > ul').toggleClass('shown'); });

        // create tiles afterwards, so that we get the navigation event before them
        // @todo fix the reliance on event callback ordering!
        for (tileId in this.app.tileField.tileMap) {
            new TileRenderer(this.app.tileField.tileMap[tileId], this.app, this);
        }
    }

    Renderer.prototype.computeGridViewport = function () {
        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height();

        return {
            left: -this.gridOffset.left, // @todo support horizontal scroll?
            top: scrollTop - this.gridOffset.top,
            bottom: scrollTop + scrollHeight - this.gridOffset.top
        };
    };

    Renderer.prototype.initializeTileMode = function (isViaLinkClick) {
        var newScrollTop = isViaLinkClick ? 0 : this.gridViewport.top + this.gridOffset.top;

        // reset any previous fixed-mode transform
        this.$grid.css({
            transform: 'translateZ(0)'
        });

        // set minimum content height to extend to grid size
        this.$content.css({
            transform: 'translate3d(0,' + (newScrollTop - this.articleScrollTop) + 'px,0)',
            height: this.app.tileField.height,
            'min-height': $(window).height() + 'px',
            transition: 'opacity 0.5s',
            opacity: 0
        });

        // restore view to where it should be
        $(window).scrollTop(newScrollTop);
    };

    Renderer.prototype.initializeArticleMode = function () {
        this.articleScrollTop = 0;
        this.articleScrollBackStartTime = 0;
        this.articleScrollBackAmount = 0;

        // set up fixed-mode parent transform for tiles
        this.$grid.css({
            transform: 'translate3d(0px,' + (this.articleScrollTop - this.gridOffset.top - this.gridViewport.top) + 'px,0)'
        });

        // clear minimum content height from grid size
        this.$content.css({
            transform: 'translateZ(0)',
            height: '',
            'min-height': $(window).height() + 'px',
            transition: 'opacity 0.5s',
            opacity: 1
        });

        this.$loadingOverlay.attr('data-active', '');

        // set data mode attribute to article to show menu-button
        $('#menu').attr('data-mode', 'article');
        $('#menu > ul').removeClass('shown');
        $('#menu-button').removeAttr( 'style' );

        this.app.currentArticle.content.done(function (html) {
            this.$content.html(html);
        }.bind(this));

        this.app.currentArticle.content.always(function () {
            this.$loadingOverlay.removeAttr('data-active');
        }.bind(this));

        // reset view top
        $(window).scrollTop(0);

        $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
    };

    Renderer.prototype.onArticleDestroyed = function () {
        $('#menu').removeAttr('data-mode');
        $('#menu-button').removeAttr( 'style' );
    };

    Renderer.prototype.onScroll = function () {
        if (!this.app.currentArticle) {
            this.gridViewport = this.computeGridViewport();

            $(this).trigger('viewport');
        } else {
            this.articleScrollTop = $(window).scrollTop();

            // maintain fixed-mode parent transform for tiles
            this.$grid.css({
                transform: 'translate3d(0px,' + (this.articleScrollTop - this.gridOffset.top - this.gridViewport.top) + 'px,0)'
            });
        }
    };

    Renderer.prototype.onResize = function () {
        this.app.tileField.setContainerWidth(this.$grid.outerWidth());
    };

    Renderer.prototype.onScrollBackChanged = function () {
        this.$content.css({
            transition: 'none',
            opacity: 1 - Math.abs(this.articleScrollBackAmount)
        });
        $('#menu-button').css({
            transition: 'none',
            opacity: 1 - Math.abs(this.articleScrollBackAmount)
        });
    };

    Renderer.prototype.onTileFieldChanged = function () {
        if (!this.app.currentArticle) {
            this.$content.css({ height: this.app.tileField.height });
        }
    };

    Renderer.prototype.onNavigated = function (e, isViaLinkClick) {
        if (this.app.currentArticle) {
            this.initializeArticleMode();
        } else {
            this.initializeTileMode(isViaLinkClick);
        }
    };

    Renderer.prototype.onMouseWheel = function (e) {
        var scrollBackDelta = -e.originalEvent.wheelDeltaY * 0.0006, // hardware delta is more than pixel speed
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
            // cancel default even if switching location (otherwise inertia is reset)
            e.preventDefault();

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

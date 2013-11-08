/*global define */

define([
    'jquery',
    'TileRenderer'
], function ($, TileRenderer) {
    'use strict';

    var MOUSEWHEEL_INERTIA_DELAY = 100;

    /* Begin rAF polyfill */

    // Adapted from https://gist.github.com/paulirish/1579671 which derived from
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller.
    // Fixes from Paul Irish, Tino Zijdel, Andrew Mao, Klemen Slavič, Darius Bacon

    // MIT license

    if (!Date.now)
        Date.now = function() { return new Date().getTime(); };

    (function() {
        var vendors = ['webkit', 'moz'];
        for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
            var vp = vendors[i];
            window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
            window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                       || window[vp+'CancelRequestAnimationFrame']);
        }
        if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
            || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
            var lastTime = 0;
            window.requestAnimationFrame = function(callback) {
                var now = Date.now();
                var nextTime = Math.max(lastTime + 16, now);
                return setTimeout(function() { callback(lastTime = nextTime); },
                                  nextTime - now);
            };
            window.cancelAnimationFrame = clearTimeout;
        }
    }());

    /* End rAF polyfill */

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
            position: 'relative'
        });

        this.$content = $('<div class="article"></div>').appendTo('#content').css({
            transform: 'translateZ(0)',
            opacity: 0
        });

        this.$loadingOverlay = $('<div class="loading-overlay"></div>').appendTo('#content');

        this.app.tileField.setContainerWidth(this.$grid.outerWidth());

        this.gridViewport = this.computeGridViewport();

        this.articleScrollBackStartTime = 0;
        this.articleScrollBackAmount = 0; // [-1..1], negative is on top, positive on bottom

        if (this.app.currentArticle) {
            this.initializeArticleMode();
        } else {
            this.initializeTileMode();
        }

        this.$content.css({ height: this.app.tileField.height });

        // todo: debounce
        $(window).on('resize', this.onResize.bind(this));
        $(window).on('scroll', this.onScroll.bind(this));
        $(window).on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.app.tileField).on('changed', this.onTileFieldChanged.bind(this));

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

    Renderer.prototype.initializeTileMode = function () {
        // set minimum content height to extend to grid size
        this.$content.css({
            height: this.app.tileField.height,
            transition: 'opacity 0.5s',
            opacity: 0
        });

        // restore view to where it should be
        $(window).scrollTop(this.gridViewport.top + this.$grid.offset().top);
    };

    Renderer.prototype.initializeArticleMode = function () {
        this.articleScrollBackStartTime = 0;
        this.articleScrollBackAmount = 0;

        // @todo reset scrolltop to zero, but only if loading a new article
        // clear minimum content height from grid size
        this.$content.css({
            height: '',
            transition: 'opacity 0.5s',
            opacity: 1
        });

        this.$loadingOverlay.attr('data-active', '');

        this.app.currentArticle.content.done(function (html) {
            this.$content.html(html);
        }.bind(this));

        this.app.currentArticle.content.always(function (html) {
            this.$loadingOverlay.removeAttr('data-active');
        }.bind(this));

        // reset view top
        $(window).scrollTop(0);

        $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
    };

    Renderer.prototype.onArticleDestroyed = function () {
    };

    Renderer.prototype.onScroll = function () {
        if (!this.app.currentArticle) {
            this.gridViewport = this.computeGridViewport();

            $(this).trigger('viewport');
        }
    };

    Renderer.prototype.onResize = function () {
        this.app.tileField.setContainerWidth(this.$grid.outerWidth());
    };

    Renderer.prototype.onScrollBackChanged = function (e) {
        this.$content.css({
            transition: 'none',
            opacity: 1 - Math.abs(this.articleScrollBackAmount)
        });
    }

    Renderer.prototype.onTileFieldChanged = function () {
        if (!this.app.currentArticle) {
            this.$content.css({ height: this.app.tileField.height });
        }
    };

    Renderer.prototype.onNavigated = function () {
        if (this.app.currentArticle) {
            this.initializeArticleMode();
        } else {
            this.initializeTileMode();
        }
    };

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

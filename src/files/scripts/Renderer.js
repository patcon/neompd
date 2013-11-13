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
        this.actionList = [];
        this.isProcessing = false;

        this.PROCESS_PER_FRAME = 2;
        this.PROCESS_PER_CALL = 4;
    }

    RenderDelayQueue.prototype.processFrame = function () {
        var actionCallback,
            numToProcess = this.PROCESS_PER_FRAME;

        while(numToProcess-- && this.numToProcess--) {
            actionCallback = this.actionList.shift();
            if(! actionCallback) {
                return this.isProcessing = false;
            }
            actionCallback();
        }

        if (!this.count || !this.actionList.length) {
            return this.isProcessing = false;
        }
        window.setTimeout(this.process.bind(this), 25);
    };

    RenderDelayQueue.prototype.process = function () {
        if(!this.isProcessing) {
            if(!this.actionList.length) {
                return;
            }
            this.numToProcess = this.PROCESS_PER_CALL;
            this.isProcessing = true;
        }

        window.requestAnimationFrame(this.processFrame.bind(this));
    };

    RenderDelayQueue.prototype.isBusy = function() {
        return this.isProcessing;
    };

    RenderDelayQueue.prototype.add = function (callback, atBack) {
        this.actionList.push(callback);
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
        this.$ = $(this);

        this.queue = new RenderDelayQueue();

        this.$window = $(window);
        this.$body = $(document.body);

        this.$content = $('#content').css({
            overflow: 'hidden'
        });

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo('#content').css({
            position: 'relative',
            transform: 'translateZ(0)'
        });

        this.$loadingOverlay = $('<div class="loading-overlay"></div>').appendTo(this.$content);

        this.$content = $('<div class="article"></div>').appendTo('#content').css({
            transform: 'translateZ(0)',
            opacity: 0
        });

        this.$menu = $('#menu');
        this.$menuList = $('#menu > ul');
        this.$menuButton = $('#menu-button');

        this.app.tileField.setContainerWidth(this.$grid.outerWidth());

        this.winHeight = this.$window.height();
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
        this.$window.on('resize', this.onResize.bind(this));
        this.$window.on('scroll', this.onScroll.bind(this));
        this.$window.on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.app.tileField).on('changed', this.onTileFieldChanged.bind(this));

        this.$.on('scrollBackChanged', this.onScrollBackChanged.bind(this));

        // show/hide side bar tag in article view
        this.$menuButton.on('click', function () {
            this.$menuList.toggleClass('shown');
        }.bind(this));

        // create tiles afterwards, so that we get the navigation event before them
        // @todo fix the reliance on event callback ordering!
        for (tileId in this.app.tileField.tileMap) {
            new TileRenderer(this.app.tileField.tileMap[tileId], this.app, this);
        }
    }

    Renderer.prototype.computeGridViewport = function (tOffset, lOffset) {
        var scrollTop = window.pageYOffset,
            scrollHeight = this.winHeight,
            gridOffset = this.gridOffset;
        tOffset = tOffset || 0;
        lOffset = lOffset || 0;
        return {
            left: -gridOffset.left, // @todo support horizontal scroll?
            top: scrollTop - gridOffset.top - tOffset,
            bottom: scrollTop + scrollHeight - gridOffset.top + lOffset
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
            'min-height': this.winHeight + 'px',
            transition: 'opacity 0.3s',
            opacity: 0
        });

        // restore view to where it should be
        this.$window.scrollTop(newScrollTop);
    };

    Renderer.prototype.initializeArticleMode = function () {
        this.articleScrollTop = 0;
        this.articleScrollBackStartTime = 0;
        this.articleScrollBackAmount = 0;

        // set up fixed-mode parent transform for tiles
        this.$grid.css({
            transform: 'translate3d(0px,' + (this.articleScrollTop - this.gridOffset.top - this.gridViewport.top - 1000) + 'px,0)'
        });

        // clear minimum content height from grid size
        this.$loadingOverlay.attr('data-active', '');

        // set data mode attribute to article to show menu-button
        this.$menu.attr('data-mode', 'article');
        this.$menuList.removeClass('shown');
        this.$menuButton.removeAttr( 'style' );

        window.setTimeout(function () {
            if(this.app.currentArticle) {
                this.app.currentArticle.content.always(function (html) {
                    window.requestAnimationFrame(function() {
                        if(this.app.currentArticle) {
                            this.$content.css({
                                height: '',
                                'min-height': this.winHeight + 'px',
                                opacity: 1,
                                transition: 'opacity 1.1s 0.1s',
                                transform: 'translate3d(0,0,0)'
                            }).html(html);
                            setTimeout(function() {
                                window.requestAnimationFrame(function() {
                                    this.$loadingOverlay.removeAttr('data-active');
                                }.bind(this));
                            }.bind(this), 300); //todo: do this with a transition end event listener
                        } else {
                            window.requestAnimationFrame(function() {
                                this.$loadingOverlay.removeAttr('data-active');
                            }.bind(this));
                        }
                    }.bind(this));
                }.bind(this));
            } else {
                window.requestAnimationFrame(function() {
                    this.$loadingOverlay.removeAttr('data-active');
                }.bind(this));
            }
        }.bind(this), 1100);

        // reset view top
        this.articleScrollTop = 0;
        this.$window.scrollTop(0);

        $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
    };

    Renderer.prototype.onArticleDestroyed = function () {
        this.$menu.removeAttr('data-mode');
        this.$menuButton.removeAttr( 'style' );
    };

    Renderer.prototype.addScrollClass = function () {
        if(this.scrollClassTimeout) {
            clearTimeout(this.scrollClassTimeout);
        } else {
            requestAnimationFrame(function() {
                this.$grid.addClass('scrolling');
                this.hasScrollClass = true;
            }.bind(this));
        }

        this.scrollClassTimeout = setTimeout(function() {
            requestAnimationFrame(function() {
                this.$grid.removeClass('scrolling');
                this.scrollClassTimeout = null;
                this.hasScrollClass = false;
            }.bind(this));
        }.bind(this), 400);
    };

    Renderer.prototype.debounceReveal = function () {
        var offset;
        if(!this.hasScrollClass || this.revealTimeout || this.queue.isBusy()) {
            return;
        }

        offset = Math.floor(this.winHeight / 4);
        this.revealTimeout = window.setTimeout(function () {
            this.gridViewport = this.computeGridViewport(-offset, -offset);
            this.$.trigger('viewport');
            this.revealTimeout = null;
            window.setTimeout(this.queue.process.bind(this.queue), 30);
        }.bind(this), 90);
    };

    Renderer.prototype.onScroll = function () {
        this.addScrollClass();
        if (!this.app.currentArticle) {
            this.debounceReveal();
        } else {
            this.articleScrollTop = window.pageYOffset;

            // maintain fixed-mode parent transform for tiles
            this.$grid.css({
                transform: 'translate3d(0px,' + (this.articleScrollTop - this.gridOffset.top - this.gridViewport.top) + 'px,0)'
            });
        }
    };

    Renderer.prototype.onResize = function () {
        this.winHeight = this.$window.height();
        this.app.tileField.setContainerWidth(this.$grid.outerWidth());
        this.gridOffset = this.$grid.offset();
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
        if (!this.app.currentArticle) {
            return;
        }

        var scrollBackDelta = -e.originalEvent.wheelDeltaY * 0.0006, // hardware delta is more than pixel speed
            currentTime = new Date().getTime(),

            scrollTop =  window.pageYOffset,
            scrollHeight = this.winHeight,
            bodyHeight = this.$body.height();

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
            this.$.trigger('scrollBackChanged');

            window.location = '#'; // @todo this more elegantly
        } else {
            // prevent default only if not reached the end
            e.preventDefault();
            this.$.trigger('scrollBackChanged');
        }
    };

    return Renderer;
});

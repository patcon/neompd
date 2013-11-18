/*global define */

define([
    'jquery',
    'TileRenderer'
], function ($, TileRenderer) {
    'use strict';

    var MOUSEWHEEL_INERTIA_DELAY = 100;

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
        window.setTimeout(this.process.bind(this), 20);
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

    RenderDelayQueue.prototype.add = function (callback, start) {
        this.actionList.push(callback);
        if(start) {
            this.process(true);
        }
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

        this.$contentWrap = $('#content').css({
            overflow: 'hidden',
            'min-height': 0
        });

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo(this.$contentWrap).css({
            position: 'relative',
            transform: 'translateZ(0)'
        });

        this.$content = $('<div class="article"></div>').appendTo(this.$contentWrap).css({
            transform: 'translateZ(0)',
            opacity: 0
        });

        this.$loadingOverlay = $('<div class="loading-overlay"></div>').appendTo(this.$contentWrap);

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

        // todo: debounce
        this.$window.on('resize', this.onResize.bind(this));
        this.$window.on('scroll', this.onScroll.bind(this));
        this.$window.on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.app.tileField).on('changed', this.onTileFieldChanged.bind(this));

        this.$.on('scrollBackChanged', this.onScrollBackChanged.bind(this));

        // show/hide side bar tag in article view
        this.$menuButton.on('click', function () {
            this.$menu.toggleClass('shown');
            this.$menuButton.toggleClass('menu-open');
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

        return {
            left: -gridOffset.left, // @todo support horizontal scroll?
            top: scrollTop - gridOffset.top,
            bottom: scrollTop + scrollHeight - gridOffset.top,
            revealedTop: scrollTop - gridOffset.top - (tOffset || 0),
            revealedBottom: scrollTop + scrollHeight - gridOffset.top + (lOffset || 0)
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
            height: this.app.tileField.height + 20, //todo: get this padding from somewhere
            'min-height': this.winHeight + 'px',
            transition: 'opacity 0.3s',
            opacity: 0
        });

        this.$menu.attr('data-tag', this.app.tileField.filterTag || '');

        window.setTimeout(function () {
            window.requestAnimationFrame(function () {
                this.$content.empty();
            }.bind(this));
        }.bind(this), 200);
        // restore view to where it should be
        this.$window.scrollTop(newScrollTop);
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
        this.$loadingOverlay.attr('data-active', '');

        // set data mode attribute to article to show menu-button
        this.$body.attr('data-mode', 'article');

        window.setTimeout(function () {
            if(this.app.currentArticle) {
                this.app.currentArticle.content.always(function (html) {
                    window.setTimeout(function() {
                        var banner,
                            content;
                        if(this.app.currentArticle) {
                            window.requestAnimationFrame(function () {
                                this.$content.css({
                                    height: '',
                                    'min-height': this.winHeight + 'px',
                                    opacity: 1,
                                    transform:'translateZ(0)'
                                }).html(html);
                                banner = this.$content.find('.banner').css({
                                    transform:'translateZ(0)'
                                });
                                content = this.$content.find('.banner h1, .content').css({
                                    transform:'translateZ(0)'
                                });
                            }.bind(this));
                            window.setTimeout(function () {
                                window.requestAnimationFrame(function () {
                                    this.$loadingOverlay.css('opacity', 0);
                                    banner.css({
                                        opacity: 1,
                                        transition: 'opacity 0.65 ease-in-out 0.1s'
                                    });
                                    content.css({
                                        opacity:1,
                                        transition: 'opacity 0.5s ease-in-out 0.15s'
                                    });
                                }.bind(this));
                            }.bind(this), 1000);
                            window.setTimeout(function() {
                                window.requestAnimationFrame(function() {
                                    this.$loadingOverlay.removeAttr('data-active').css('opacity', '');
                                    banner = this.$content.find('.banner').css({
                                        transform:''
                                    });
                                    content = this.$content.find('.banner h1, .content').css({
                                        transform:''
                                    });
                                }.bind(this));
                            }.bind(this), 2000);
                        } else {
                            window.requestAnimationFrame(function() {
                                this.$loadingOverlay.removeAttr('data-active');
                            }.bind(this));
                        }
                    }.bind(this), 100);
                }.bind(this));
            } else {
                window.requestAnimationFrame(function() {
                    this.$loadingOverlay.removeAttr('data-active');
                }.bind(this));
            }
        }.bind(this), 100);

        // reset view top
        this.articleScrollTop = 0;
        this.$window.scrollTop(0);

        $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
    };

    Renderer.prototype.onArticleDestroyed = function () {
        this.$body.removeAttr('data-mode');
        this.$menu.removeClass('shown');
        this.$menuButton.removeClass('menu-open');
    };

    Renderer.prototype.addScrollClass = function () {
        if(this.scrollClassTimeout) {
            window.clearTimeout(this.scrollClassTimeout);
        } else {
            window.requestAnimationFrame(function() {
                this.$grid.addClass('scrolling');
                this.hasScrollClass = true;
            }.bind(this));
        }

        this.scrollClassTimeout = setTimeout(function() {
            window.requestAnimationFrame(function() {
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
        if(this.resizeTimeout) {
            window.clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = window.setTimeout(function () {
            window.requestAnimationFrame(function () {
                this.winHeight = this.$window.height();
                this.app.tileField.setContainerWidth(this.$grid.outerWidth());
                this.gridOffset = this.$grid.offset();
                this.resizeTimeout = null;
            }.bind(this));
        }.bind(this), 150);
    };

    Renderer.prototype.onScrollBackChanged = function () {
        this.$content.css({
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

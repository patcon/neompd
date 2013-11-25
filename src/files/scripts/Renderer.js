/*global define */

define([
    'jquery',
    'RenderDelayQueue',
    'TileRenderer'
], function ($, RenderDelayQueue, TileRenderer) {
    'use strict';

    var MOUSEWHEEL_INERTIA_DELAY = 100;

    function RenderDelayQueue() {
        this.actionList = [];
        this.isProcessing = false;

        this.PROCESS_PER_FRAME = 3;
        this.PROCESS_PER_CALL = 6;
    }

    RenderDelayQueue.prototype.processFrame = function () {
        var actionCallback,
            numToProcess = this.PROCESS_PER_FRAME;

        while(numToProcess-- && this.numToProcess--) {
            actionCallback = this.actionList.shift();
            if(! actionCallback) {
                this.isProcessing = false;
                return;
            }
            actionCallback();
        }

        if (!this.count || !this.actionList.length) {
            this.isProcessing = false;
            return;
        }
        window.setTimeout(this.process.bind(this), 30);
    };

    RenderDelayQueue.prototype.process = function () {
        if(!this.isProcessing) {
            if(!this.actionList.length) {
                return;
            }
            this.numToProcess = this.PROCESS_PER_CALL;
            this.isProcessing = true;
        }
        window.setTimeoutWithRAF(this.processFrame.bind(this), 30);
    };

    RenderDelayQueue.prototype.isBusy = function() {
        return this.isProcessing;
    };

    RenderDelayQueue.prototype.add = function (callback) {
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
        this.winHeight = this.$window.height();

        this.$contentWrap = $('#content');

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo(this.$contentWrap).css({
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
        this.menuOpen = false;

        this.$leftBar = $('#nav');
        //the left bar doesn't actually have height (nothing is a true bounding box), so we find the bottom of the list instead
        this.leftBarHeight = this.$menuList.outerHeight(true) + this.$menuList.offset().top - window.pageYOffset + 40; //todo: get this 40 from somewhere, it is the offset added to the menu when the page is in article mode
        this.leftBarY = 0;
        this.$menu.css('height', this.leftBarHeight);

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
        this.lastScrolTop = window.pageYOffset;

        this.$window.on('resize', this.onResize.bind(this));
        this.$window.on('scroll', this.onScroll.bind(this));
        this.$window.on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.app.tileField).on('changed', this.onTileFieldChanged.bind(this));

        this.$.on('scrollBackChanged', this.onScrollBackChanged.bind(this));

        this.$menuButton.on('click', this.onMenuClick.bind(this));

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

    Renderer.prototype.getPageHeight = function (containerHeight) {
        return Math.max(Math.max(this.leftBarHeight, this.winHeight), containerHeight);
    };

    Renderer.prototype.initializeTileMode = function (isViaLinkClick) {
        var newScrollTop = isViaLinkClick ? 0 : this.gridViewport.top + this.gridOffset.top;
        // set minimum content height to extend to grid size
        this.$contentWrap.css({
            height: this.pageHeight = this.getPageHeight(this.app.tileField.height + 20), //todo: get this padding from somewhere
            overflow: this.destroyArticle && !isViaLinkClick ? 'visible' : ''
        });
        // reset any previous fixed-mode transform
        this.$grid.css({
            transform: 'translateZ(0)'
        });

        if (this.destroyArticle) {
            this.destroyArticle();
        }
        this.$menu.attr('data-tag', this.app.tileField.filterTag || '');

        this.justSwitchedModes = true;
        this.$window.scrollTop(newScrollTop);

        this.gridViewport = this.computeGridViewport();

        window.setTimeoutWithRAF(function () {
            if(! this.app.currentArticle) {
                this.$contentWrap.css({
                    overflow:''
                });
            }
        }.bind(this), 1000);
    };

    Renderer.prototype.initializeArticleMode = function (isViaLinkClick) {
        window.requestAnimationFrame(function () {
            if (!this.app.currentArticle) {
                return;
            }
            // set up fixed-mode parent transform for tiles
            this.$grid.css({
                transform: 'translate3d(0px,' + (-this.gridOffset.top - this.gridViewport.top) + 'px,0)'
            });

            // clear minimum content height from grid sizey
            this.$loadingOverlay.attr('data-active', '').css({
                height: this.winHeight
            });
            // set data mode attribute to article to show menu-button
            this.$body.attr('data-mode', 'article');
            // reset view top
            this.justSwitchedModes = true;
            this.isScrollBackNavigating = false;

            this.$window.scrollTop(0);
            this.resetLeftBar();

            this.articleScrollTop = 0;
            this.articleScrollBackStartTime = 0;
            this.articleScrollBackAmount = 0;

            $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        }.bind(this));

        this.app.currentArticle.content.always(function (html) {
            window.setTimeoutWithRAF(function() {
                var banner,
                    content;
                if (this.app.currentArticle) {
                    this.$content.css({
                        opacity: 1,
                        transform:'translateZ(0)'
                    }).html(html);
                    banner = this.$content.find('.banner').css({
                        transform:'translateZ(0)'
                    });
                    content = this.$content.find('.banner h1, .content').css({
                        transform:'translateZ(0)'
                    });
                    this.$contentWrap.css({
                        height: this.pageHeight = this.getPageHeight(this.$content.height() - 30) //todo: get this padding from somewhere
                    });
                    window.setTimeoutWithRAF(function () {
                        if (this.app.currentArticle) {
                            this.$loadingOverlay.css('opacity', 0);
                            banner.css({
                                opacity: 1,
                                transition: 'opacity 0.61s ease-in-out 0.05s'
                            });
                            content.css({
                                opacity: this.articleOpacity = 1,
                                transition: 'opacity 0.5s ease-in-out 0.11s'
                            });
                            this.$menu.addClass('loaded');
                            window.setTimeoutWithRAF(function() {
                                this.$loadingOverlay.removeAttr('data-active').css('opacity', '');
                                content.css({
                                    transition: 'inherit'
                                });

                            }.bind(this), 2000);
                        } else {
                            this.$loadingOverlay.removeAttr('data-active');
                        }
                    }.bind(this), 300);
                } else {
                    this.$loadingOverlay.removeAttr('data-active');
                }
            }.bind(this), 800);
        }.bind(this));
    };

    Renderer.prototype.onArticleDestroyed = function () {
        this.destroyArticle = function () {
            if(this.articleOpacity > 0) {
                this.$content.css({
                    opacity: 0
                });
            }

            window.setTimeoutWithRAF(function () {
                this.destroyArticle = null;
                this.menuOpen = false;
                if (this.app.currentArticle) {
                    return;
                }

                //hide the menu
                this.$body.removeAttr('data-mode');
                this.$menu.removeClass('shown loaded');
                this.$content.removeClass('menu-open');

                window.setTimeoutWithRAF(function () {
                    if (this.app.currentArticle) {
                        return;
                    }
                    //reset the menu button
                    this.$menuButton.removeClass('menu-open');

                    window.setTimeoutWithRAF(function () {
                        if (! this.app.currentArticle) {
                            this.$content.empty();
                        }
                    }.bind(this), 500);
                }.bind(this), 1000);
            }.bind(this), 100);
        }.bind(this);
    };

    Renderer.prototype.resetLeftBar = function (delay) {
        if (!this.menuOpen && this.leftBarY !== 0) {
            this.$leftBar.css({
                transform:'translateZ(' + (this.leftBarY = 0) + ')',
                transition: '-webkit-transform 0.275s ease ' + (delay || '0.4s')
            });
        }
    };

    Renderer.prototype.scrollLeftBar = function (scrollTop) {
        var max,
            scrollDelta,
            min;
        if (this.justSwitchedModes) {
            this.justSwitchedModes = false;
            return;
        }

        max = 0;
        min = this.winHeight - this.leftBarHeight;
        scrollDelta =  this.lastScrolTop - scrollTop;

        if (scrollTop < 0 || this.leftBarHeight <= this.winHeight || (scrollTop + this.winHeight > this.pageHeight) || (this.app.currentArticle && !this.menuOpen) || (scrollDelta < 0 && this.leftBarY === min) || (scrollDelta > 0 && this.leftBarY === max)) {
            return;
        }

        this.leftBarY = Math.max(Math.min(this.leftBarY + scrollDelta, max), min);
        if (!this.scrollRAF) {
            this.scrollRAF = window.requestAnimationFrame(function () {
                this.$leftBar.css({
                    transform: 'translate3d(0,' + this.leftBarY + 'px, 0)',
                    transition: ''
                });
                this.scrollRAF = null;
            }.bind(this));
        }
    };

    Renderer.prototype.addScrollClass = function () {
        if (this.scrollClassTimeout) {
            window.clearTimeout(this.scrollClassTimeout);
        } else {
            window.requestAnimationFrame(function() {
                this.$grid.addClass('scrolling');
                this.hasScrollClass = true;
            }.bind(this));
        }

        this.scrollClassTimeout = window.setTimeoutWithRAF(function() {
            this.$grid.removeClass('scrolling');
            this.scrollClassTimeout = null;
            this.hasScrollClass = false;
        }.bind(this), 300);
    };

    Renderer.prototype.debounceReveal = function (isScrollingDown) {
        var offset;
        if (this.destroyArticle || !this.hasScrollClass || this.revealTimeout || this.queue.isBusy()) {
            return;
        }

        offset = Math.floor(this.winHeight / 5);
        this.revealTimeout = window.setTimeout(function () {
            this.gridViewport = this.computeGridViewport(isScrollingDown ? -offset : offset, isScrollingDown ? offset : -offset);
            this.$.trigger('viewport');
            this.revealTimeout = null;
            window.setTimeout(this.queue.process.bind(this.queue), 30);
        }.bind(this), 90);
    };

    Renderer.prototype.onScroll = function () {
        var thisScrollTop = window.pageYOffset;

        this.addScrollClass(thisScrollTop);
        if (!this.app.currentArticle) {
            this.debounceReveal(thisScrollTop >= this.lastScrolTop);
        } else {
            this.articleScrollTop = thisScrollTop;
            // maintain fixed-mode parent transform for tiles
            this.$grid.css({
                transform: 'translate3d(0,' + (this.articleScrollTop - this.gridOffset.top - this.gridViewport.top) + 'px, 0)'
            });
        }
        this.scrollLeftBar(thisScrollTop);
        this.lastScrolTop = thisScrollTop;
    };

    Renderer.prototype.onResize = function () {
        if (this.resizeTimeout) {
            window.clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = window.setTimeoutWithRAF(function () {
            this.$contentWrap.css({
                'min-height': this.winHeight = this.$window.height()
            });
            this.app.tileField.setContainerWidth(this.$grid.outerWidth());
            this.resizeTimeout = null;
        }.bind(this), 200);
    };

    Renderer.prototype.onMenuClick = function () {
        window.requestAnimationFrame(function () {
            this.$menu.toggleClass('shown');
            this.$content.toggleClass('menu-open');
            this.menuOpen = !this.menuOpen;
            window.setTimeoutWithRAF(function () {
                this.$menuButton.toggleClass('menu-open');
                this.resetLeftBar('0.3s');
            }.bind(this), 20);
        }.bind(this));
    };

    Renderer.prototype.onScrollBackChanged = function () {
        this.$content.css({
            opacity: this.articleOpacity = (1 - Math.abs(this.articleScrollBackAmount)).toFixed(3)
        });
    };

    Renderer.prototype.onTileFieldChanged = function () {
        var height;
        if (!this.app.currentArticle) {
            this.resetLeftBar('0s');
            if((height = this.getPageHeight(this.app.tileField.height)) !== this.pageHeight) {
                window.setTimeoutWithRAF(function () {
                    if (!this.app.currentArticle) {
                        this.$contentWrap.css('height', this.pageHeight = height);
                    }
                }.bind(this), 500);
            }
        }
    };

    Renderer.prototype.onNavigated = function (e, isViaLinkClick) {
        if (this.app.currentArticle) {
            this.initializeArticleMode(isViaLinkClick);
        } else {
            this.initializeTileMode(isViaLinkClick);
        }
    };

    Renderer.prototype.onMouseWheel = function (e) {
        if (this.isScrollBackNavigating || !this.app.currentArticle) {
            return;
        }

        var scrollBackDelta = -e.originalEvent.wheelDeltaY * 0.0006, // hardware delta is more than pixel speed
            currentTime = new Date().getTime(),

            scrollTop =  window.pageYOffset,
            scrollHeight = this.winHeight,
            bodyHeight = this.pageHeight;

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

            this.isScrollBackNavigating = true;
            window.location = '#'; // @todo this more elegantly
        } else {
            // prevent default only if not reached the end
            e.preventDefault();
            this.$.trigger('scrollBackChanged');
        }
    };

    return Renderer;
});

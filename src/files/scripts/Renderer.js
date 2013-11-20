/*global define */

define([
    'jquery',
    'RenderDelayQueue',
    'TileRenderer'
], function ($, RenderDelayQueue, TileRenderer) {
    'use strict';

    var MOUSEWHEEL_INERTIA_DELAY = 100;

    function Renderer(app) {
        var tileId;

        this.app = app;
        this.$ = $(this);

        this.queue = new RenderDelayQueue();

        this.$window = $(window);
        this.$body = $(document.body);
        this.winHeight = this.$window.height();

        this.$contentWrap = $('#content').css({
            overflow: 'hidden'
        });

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

        // todo: debounce
        this.$window.on('resize', this.onResize.bind(this));
        this.$window.on('scroll', this.onScroll.bind(this));
        this.$window.on('mousewheel', this.onMouseWheel.bind(this));

        $(this.app).on('navigated', this.onNavigated.bind(this));
        $(this.app.tileField).on('changed', this.onTileFieldChanged.bind(this));

        this.$.on('scrollBackChanged', this.onScrollBackChanged.bind(this));

        // show/hide side bar tag in article view
        this.$menuButton.on('click', function () {
            window.requestAnimationFrame(function () {
                this.$menu.toggleClass('shown');
                this.$content.toggleClass('menu-open');
                window.setTimeoutWithRAF(function () {
                    this.$menuButton.toggleClass('menu-open');
                }.bind(this), 30);
            }.bind(this));
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
        // set minimum content height to extend to grid size
        this.$contentWrap.css({
            height: Math.max(this.winHeight, this.app.tileField.height + 20), //todo: get this padding from somewhere
            overflow:'visible'
        });
        // reset any previous fixed-mode transform
        this.$grid.css({
            transform: 'translateZ(0)'
        });
        this.$window.scrollTop(newScrollTop);

        this.$menu.attr('data-tag', this.app.tileField.filterTag || '');

        window.setTimeoutWithRAF(function () {
            if(this.app.currentArticle) {
                return;
            }
            this.$contentWrap.css({
                overflow:'hidden'
            });
        }.bind(this), 1000);
    };

    Renderer.prototype.initializeArticleMode = function (isViaLinkClick) {
        window.requestAnimationFrame(function () {
            if(!this.app.currentArticle) {
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
            this.$window.scrollTop(0);

            this.articleScrollTop = 0;
            this.articleScrollBackStartTime = 0;
            this.articleScrollBackAmount = 0;

            $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        }.bind(this));

        this.app.currentArticle.content.always(function (html) {
            window.setTimeoutWithRAF(function() {
                var banner,
                    content;
                if(this.app.currentArticle) {
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
                        height: this.articleHeight = Math.max(this.winHeight, this.$content.height() - 30), //todo: get this padding from somewhere
                        overflow:'hidden'
                    });
                    window.setTimeoutWithRAF( function () {
                        if(this.app.currentArticle) {
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
                    }.bind(this), 800);
                } else {
                    this.$loadingOverlay.removeAttr('data-active');
                }
            }.bind(this), 300);
        }.bind(this));
    };

    Renderer.prototype.onArticleDestroyed = function () {
        this.isDestroyingArticle = true;

        if(this.articleOpacity > 0) {
            this.$content.css({
                opacity: 0
            });
        }

        window.setTimeoutWithRAF(function () {
            this.isDestroyingArticle = false;
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
            }.bind(this), 500);
        }.bind(this), 75);
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

        this.scrollClassTimeout = window.setTimeoutWithRAF(function() {
            this.$grid.removeClass('scrolling');
            this.scrollClassTimeout = null;
            this.hasScrollClass = false;
        }.bind(this), 300);
    };

    Renderer.prototype.debounceReveal = function (isScrollingDown) {
        var offset;
        if(this.isDestroyingArticle || !this.hasScrollClass || this.revealTimeout || this.queue.isBusy()) {
            return;
        }

        offset = Math.floor(this.winHeight / 5);
        this.revealTimeout = window.setTimeout(function () {
            this.gridViewport = this.computeGridViewport(isScrollingDown ? -offset : offset, isScrollingDown ? offset : -offset);
            this.$.trigger('viewport');
            this.revealTimeout = null;
            window.setTimeout(this.queue.process.bind(this.queue), 30);
        }.bind(this), 100);
    };

    Renderer.prototype.onScroll = function () {
        var thisScrollTop = window.pageYOffset;

        this.addScrollClass();
        if (!this.app.currentArticle) {
            this.debounceReveal(thisScrollTop >= this.lastScrolTop);
        } else {
            this.articleScrollTop = thisScrollTop;
            // maintain fixed-mode parent transform for tiles
            this.$grid.css({
                transform: 'translate3d(0px,' + (this.articleScrollTop - this.gridOffset.top - this.gridViewport.top) + 'px,0)'
            });
        }
        this.lastScrolTop = thisScrollTop;
    };

    Renderer.prototype.onResize = function () {
        if(this.resizeTimeout) {
            window.clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = window.setTimeoutWithRAF(function () {
            this.$contentWrap.css({
                'min-height': this.winHeight = this.$window.height()
            });
            this.app.tileField.setContainerWidth(this.$grid.outerWidth());
            this.gridOffset = this.$grid.offset();
            this.resizeTimeout = null;
        }.bind(this), 150);
    };

    Renderer.prototype.onScrollBackChanged = function () {
        this.$content.css({
            opacity: this.articleOpacity = (1 - Math.abs(this.articleScrollBackAmount))
        });
    };

    Renderer.prototype.onTileFieldChanged = function () {
        if (!this.app.currentArticle) {
            window.requestAnimationFrame(function () {
                this.$contentWrap.css({ height: Math.max(this.winHeight, this.app.tileField.height) });
            }.bind(this));
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
        if (!this.app.currentArticle) {
            return;
        }

        var scrollBackDelta = -e.originalEvent.wheelDeltaY * 0.0006, // hardware delta is more than pixel speed
            currentTime = new Date().getTime(),

            scrollTop =  window.pageYOffset,
            scrollHeight = this.winHeight,
            bodyHeight = this.articleHeight;

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

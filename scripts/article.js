window.ArticleView = Backbone.View.extend({
    initialize: function () {
        var self = this,
            gridHasLayout,
            afterLayout;

        this.itemTop = null;
        this.articleOffset = null;
        this.articleHeight = null;

        this.gridMode = null;

        this.SCROLLBACK_MARGIN = 20;
        this.SCROLLBACK_DISTANCE = 400;
        this.BOTTOM_TILE_MARGIN = 400;

        this.scrollAboveAmount = 0;
        this.scrollBelowAmount = 0;

        this.incompleteRenderId = null;

        this.$article = $('#article');
        this.$wrapper = $('#article').parent();
        this.$articleClose = $('#close');
        this.$container = $('#grid');

        // for testing purposes, article "id" is the index of the corresponding list item
        this.$li = this.$container.children().eq(parseInt(this.model.id, 10));

        this.$articleClose.attr('href', '#tags/' + this.model.tag);

        // initialize layout if necessary (otherwise simulate async callback for consistency)
        gridHasLayout = !!this.$container.children(':first').data('isotope-item-position');
        afterLayout = gridHasLayout ? function (callback) { setTimeout(callback, 0); } : function (callback) {
            // disable transitions to perform instant layout
            self.$container.children('li').css({ '-webkit-transition': 'none' });

            self.$container.isotope({
                itemSelector: 'li',
                itemPositionDataEnabled: true
            }, function () {
                // re-enable transitions
                self.$container.children('li').css({ '-webkit-transition': '' });

                callback();
            });
        }

        afterLayout(function () {
            var position = self.$li.data('isotope-item-position'),
                containerOffset = self.$container.offset(),
                itemTop = position.y + containerOffset.top,

                scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),

                loadRequest;

            self.itemTop = itemTop;

            // if the link top would be within top half of the screen, show article where screen is, otherwise anchor article to link and move scroll top
            self.articleOffset = ((itemTop > scrollTop + scrollHeight) ? 0 : Math.min(scrollTop - itemTop, 0));

            // set up for slide transition
            self.$container.children().removeClass('dismissedUp dismissedDown');

            self.$li.prevAll().each(function () {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                    if (position.y + $item.outerHeight(true) > scrollTop) {
                        $item.addClass('dismissedUp');
                    } else {
                        return false;
                    }
            });
            self.$li.addClass('dismissedDown');
            self.$li.nextAll().each(function () {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                    if (position.y < scrollTop + scrollHeight - self.articleOffset) {
                        $item.addClass('dismissedDown');
                    } else {
                        return false;
                    }
            });

            // first-stage: re-flow and reposition grid into article mode
            // @todo cancel on destroy
            requestAnimationFrame(function () {
                self.$articleClose.removeClass('hidden');

                // article loading state
                self.$article.empty().css({ 'min-height': scrollHeight }).addClass('loading').removeClass('hidden');
            });

            self.changeLayout('dismissing');
            self.render();

            loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                // second-stage: article layout
                // @todo cancel on destroy
                requestAnimationFrame(function () {
                    self.$article.removeClass('loading');
                    self.$article.html(data);

                    // calculate dimensions after article is visible @todo is this fired if all images are loaded?
                    self.articleHeight = self.$article.outerHeight();

                    self.$article.imagesLoaded(function () {
                        self.articleHeight = self.$article.outerHeight();

                        self.setupScrollback();
                    });
                });

                self.render();
            });

            self.once('destroy', function () {
                loadRequest.abort();
            })
        });
    },

    changeLayout: function (newMode) {
        var articleFixed, articleShift, containerShift, updatedScrollTop;

        if (newMode === 'aboveArticle') {
            articleFixed = true;
            articleShift = 0;
            containerShift = 0;
            updatedScrollTop = this.itemTop + this.SCROLLBACK_DISTANCE;
        } else if (newMode === 'belowArticle') {
            articleFixed = true;
            articleShift = (-$(window).scrollTop());
            containerShift = 0;
            updatedScrollTop = this.itemTop - $(window).height();
        } else {
            articleFixed = false;
            articleShift = 0;

            if (newMode === 'dismissing') {
                // initial transition
                containerShift = (-this.itemTop - this.articleOffset);
                updatedScrollTop = 0;
            } else if (newMode === 'articleFromTop') {
                // coming from above
                containerShift = -this.itemTop - this.SCROLLBACK_DISTANCE;
                updatedScrollTop = 0;
            } else {
                // coming from below
                containerShift = (-this.itemTop + $(window).height());
                updatedScrollTop = this.articleHeight - $(window).height();
            }
        }

        // immediately update layout-relevant stuff
        this.$container.css({
            position: articleFixed ? 'relative' : 'fixed',
            '-webkit-transform': 'translate3d(0,' + containerShift + 'px,0)',
            top: 0,
            left: 0,
            right: 0 // @todo proper calculation
        });

        this.$article.css({
            position: articleFixed ? 'fixed' : 'relative',
            '-webkit-transform': 'translate3d(0,' + articleShift + 'px,0)',
            top: 0,
            left: 0,
            right: 0 // @todo proper calculation
        });

        // set new mode and then trigger onscroll
        this.gridMode = newMode;

        $(window).scrollTop(updatedScrollTop);
    },

    render: function () {
        // no need to request another render
        if (this.incompleteRenderId) {
            return;
        }

        this.incompleteRenderId = requestAnimationFrame(_.bind(function () {
            var scrollHeight = $(window).height();

            this.incompleteRenderId = null;

            // scrollback state
            if (this.gridMode === 'aboveArticle') {
                this.$article.css('-webkit-transition', 'none').css('opacity', Math.max(0.01, 1 - this.scrollAboveAmount));
                this.$li.prevAll('.dismissedUp').children().css({
                    '-webkit-transition': '',
                    '-webkit-transform': ''
                });
                this.$li.nextAll('.dismissedDown').andSelf().children().css({
                    '-webkit-transition': 'none',
                    '-webkit-transform': 'translate3d(0,' + (1 - this.scrollAboveAmount) * (this.SCROLLBACK_DISTANCE + scrollHeight) + 'px,0)'
                });
            } else if (this.gridMode === 'belowArticle') {
                this.$article.css('-webkit-transition', 'none').css('opacity', Math.max(0.01, 1 - this.scrollBelowAmount));
                this.$li.prevAll('.dismissedUp').children().css({
                    '-webkit-transition': 'none',
                    '-webkit-transform': 'translate3d(0,' + (this.scrollBelowAmount - 1) * scrollHeight * 2 + 'px,0)'
                });
                this.$li.nextAll('.dismissedDown').andSelf().children().css({
                    '-webkit-transition': '',
                    '-webkit-transform': ''
                });
            } else {
                this.$article.css('opacity', '').css('-webkit-transition', '');
                this.$li.prevAll('.dismissedUp').children().css({
                    '-webkit-transition': '',
                    '-webkit-transform': ''
                });
                this.$li.nextAll('.dismissedDown').andSelf().children().css({
                    '-webkit-transition': '',
                    '-webkit-transform': ''
                });
            }

            // trigger slide transition
            this.$container.attr('mode', this.gridMode);
        }, this));
    },

    setupScrollback: function () {
        var allowScrollbackStartTime = 0;

        onWheel = _.bind(function (e) {
            var deltaY = e.originalEvent.wheelDeltaY * 0.1, // hardware delta is more than pixel speed
                currentTime = new Date().getTime(),

                scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                bodyHeight = $(document).height();

            // ignore if not in article scroll mode
            if (this.gridMode === 'aboveArticle' || this.gridMode === 'belowArticle') {
                return;
            }

            // extra wait until existing mouse wheel inertia dies down
            if (allowScrollbackStartTime > currentTime) {
                allowScrollbackStartTime = currentTime + 50;
                return;
            }

            if (scrollTop <= 0 && deltaY > 0) {
                this.changeLayout('aboveArticle');
                this.render();
            } else if (scrollTop + scrollHeight >= bodyHeight && deltaY < 0) {
                this.changeLayout('belowArticle');
                this.render();
            } else {
                // otherwise, prevent acting until mouse wheel inertia dies down
                allowScrollbackStartTime = currentTime + 50;
            }
        }, this);

        onScroll = _.bind(function () {
            // @todo there is an ugly snap to top if scrolling past bottom and *without releasing touch* scrolling up into unfix and then back down to bottom
            var scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                bodyHeight = $(document).height();

            if (this.gridMode === 'aboveArticle') {
                if (scrollTop > this.itemTop + this.SCROLLBACK_DISTANCE) {
                    this.scrollAboveAmount = 0;
                    this.changeLayout('articleFromTop');
                    this.render();
                } else {
                    this.scrollAboveAmount = Math.min(1, (this.itemTop + this.SCROLLBACK_DISTANCE - scrollTop) / this.SCROLLBACK_DISTANCE);

                    if (this.scrollAboveAmount === 1) {
                        window.location = this.$articleClose.get(0).href;
                    }
                }

                this.render();
            } else if (this.gridMode === 'belowArticle') {
                if (scrollTop + scrollHeight < this.itemTop) {
                    this.scrollBelowAmount = 0;
                    this.changeLayout('articleFromBottom');
                    this.render();
                } else {
                    // use screen height or whatever leftover space there is in the grid to scroll
                    this.scrollBelowAmount = Math.min(1, (scrollTop + scrollHeight - this.itemTop) / Math.min(scrollHeight, bodyHeight - this.itemTop));

                    if (this.scrollBelowAmount === 1) {
                        window.location = this.$articleClose.get(0).href;
                    }
                }

                this.render();
            }
        }, this);

        $(document).on('mousewheel', onWheel);
        $(document).on('scroll', onScroll);

        this.once('destroy', function () {
            $(document).off('mousewheel', onWheel);
            $(document).off('scroll', onScroll);
        });
    },

    destroy: function () {
        if (this.isDestroyed) {
            return;
        } else {
            this.isDestroyed = true;
        }

        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            scrollBottom = scrollTop + scrollHeight,

            restoredScrollTop;

        this.trigger('destroy');

        // queue up one final render to set opacity and transforms at maximums
        this.render();

        // queue up style cleanup after final render
        requestAnimationFrame(_.bind(function () {
            this.$articleClose.addClass('hidden');
            this.$article.addClass('hidden');

            if (this.gridMode === 'aboveArticle') {
                // request computed state to make sure transitions are starting from zero point
                this.$article.css('opacity');

                // clear animation state
                this.$article.css('-webkit-transition', '');
                this.$article.css('opacity', '');
                this.$li.nextAll('.dismissedDown').andSelf().children().css({
                    '-webkit-transform': '',
                    '-webkit-transition': ''
                });
            } else if (this.gridMode === 'belowArticle') {
                // request computed state to make sure transitions are starting from zero point
                this.$article.css('opacity');

                // clear animation state
                this.$article.css('-webkit-transition', '');
                this.$article.css('opacity', '');
                this.$li.prevAll('.dismissedUp').children().css({
                    '-webkit-transform': '',
                    '-webkit-transition': ''
                });
            } else {
                // add grid flow first to maintain document size
                // @todo this should be immediate instead of RAF
                this.$container.css({
                    'position': 'relative',
                    '-webkit-transform': 'translate3d(0,0,0)'
                });

                this.$article.css({
                    position: 'fixed',
                    '-webkit-transform': 'translate3d(0,' + (-scrollTop) + 'px,0)'
                });
            }
        }, this));
    }
});

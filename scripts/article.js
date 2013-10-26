window.ArticleView = Backbone.View.extend({
    initialize: function () {
        var self = this,
            gridHasLayout,
            afterLayout;

        this.itemTop = null;
        this.articleOffset = null;
        this.articleHeight = null;

        this.articleIsAtTop = false;
        this.articleIsAtBottom = false;
        this.viewingArticleBottom = false;

        this.gridMode = 'dismissing';

        this.SCROLLBACK_MARGIN = 20;
        this.SCROLLBACK_DISTANCE = 400;
        this.BOTTOM_TILE_MARGIN = 400;

        this.scrollAboveDistance = 0;
        this.scrollBelowDistance = 0;

        this.incompleteRenderId = null;

        this.$article = $('#article');
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
            self.$li.prevAll().removeClass('dismissedUp dismissedDown');
            self.$li.nextAll().andSelf().removeClass('dismissedUp dismissedDown');

            self.$li.prevAll(':lt(8)').addClass('dismissedUp');
            self.$li.nextAll(':lt(8)').andSelf().addClass('dismissedDown');

            // first-stage: re-flow and reposition grid into article mode
            // @todo cancel on destroy
            requestAnimationFrame(function () {
                self.$articleClose.removeClass('hidden');

                // article loading state
                self.$article.empty().css({ 'min-height': scrollHeight }).addClass('loading').removeClass('hidden');

                $(window).scrollTop(0);
            });

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

    render: function () {
        // no need to request another render
        if (this.incompleteRenderId) {
            return;
        }

        this.incompleteRenderId = requestAnimationFrame(_.bind(function () {
            this.incompleteRenderId = null;

            // scrollback state
            if (this.scrollAboveDistance > 0) {
                this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.itemTop - this.articleOffset + this.scrollAboveDistance - this.SCROLLBACK_DISTANCE) + 'px,0)');
                this.$article.css('opacity', 1 - this.scrollAboveDistance / this.SCROLLBACK_DISTANCE).css('-webkit-transition', 'none');
            } else if (this.scrollBelowDistance > 0) {
                this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.itemTop + this.articleHeight - this.scrollBelowDistance) + 'px,0)');
                this.$article.css('opacity', 1 - this.scrollBelowDistance / this.SCROLLBACK_DISTANCE).css('-webkit-transition', 'none');
            } else {
                // ensure there is still some transformation on the container
                this.$container.css('-webkit-transform', 'translate3d(0,' + (
                    this.gridMode === 'dismissing' ? (-this.itemTop - this.articleOffset) : (
                        this.viewingArticleBottom ?
                            -this.itemTop + this.articleHeight :
                            -this.itemTop - this.articleOffset - this.SCROLLBACK_DISTANCE
                    )
                ) + 'px,0)');
                this.$article.css('opacity', '').css('-webkit-transition', '');
            }

            // trigger slide transition
            this.$container.attr('mode', this.gridMode);
            console.log('mode', this.gridMode)

            this.$article.css({
                position: '',
                '-webkit-transform': 'translate3d(0,0,0)',
                top: '',
                left: '',
                right: ''
            });
            this.$container.css({
                'margin-bottom': -this.$container.outerHeight() + 'px'
            });
        }, this));
    },

    setupScrollback: function () {
        var allowScrollbackStartTime = 0;

        onWheel = _.bind(function (e) {
            var deltaY = e.originalEvent.wheelDeltaY * 0.1, // hardware delta is more than pixel speed
                currentTime = new Date().getTime();

            if ((!this.articleIsAtTop && !this.articleIsAtBottom) || allowScrollbackStartTime > currentTime) {
                // extra wait until existing mouse wheel inertia dies down
                allowScrollbackStartTime = currentTime + 50;
                return;
            }

            if (this.articleIsAtTop && (this.scrollAboveDistance > 0 || deltaY > 0)) {
                e.preventDefault();

                this.scrollAboveDistance = Math.max(0, this.scrollAboveDistance + deltaY);

                if (this.scrollAboveDistance > this.SCROLLBACK_DISTANCE) {
                    this.destroy(); // initialize teardown animation without waiting for hash-change
                    window.location = this.$articleClose.get(0).href;
                } else {
                    this.gridMode = 'aboveArticle';
                    this.render();
                }
            } else if (this.articleIsAtBottom && (this.scrollBelowDistance > 0 || deltaY < 0)) {
                e.preventDefault();

                this.scrollBelowDistance = Math.max(0, this.scrollBelowDistance - deltaY);

                if (this.scrollBelowDistance > this.SCROLLBACK_DISTANCE) {
                    this.destroy(); // initialize teardown animation without waiting for hash-change
                    window.location = this.$articleClose.get(0).href;
                } else {
                    this.gridMode = 'belowArticle';
                    this.render();
                }
            }
        }, this);

        onScroll = _.bind(function () {
            // @todo there is an ugly snap to top if scrolling past bottom and *without releasing touch* scrolling up into unfix and then back down to bottom
            var scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                bodyHeight = $(document).height(),
                newBottomValue;

            newBottomValue = (scrollTop + scrollHeight >= bodyHeight - this.BOTTOM_TILE_MARGIN);
            if (newBottomValue !== this.viewingArticleBottom) {
                this.viewingArticleBottom = newBottomValue;
                this.render();
            }

            if (scrollTop <= 0) {
                if (!this.articleIsAtTop) {
                    this.articleIsAtTop = true;
                }
            } else if (scrollTop + scrollHeight >= bodyHeight) {
                if (!this.articleIsAtBottom) {
                    this.articleIsAtBottom = true;
                }
            } else {
                if (this.articleIsAtTop || this.articleIsAtBottom) {
                    this.articleIsAtTop = this.articleIsAtBottom = false;
                    this.gridMode = 'article';
                    this.render();
                }
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

        if (this.scrollAboveDistance > 0) {
            restoredScrollTop = this.itemTop + this.articleOffset - this.scrollAboveDistance + this.SCROLLBACK_DISTANCE;
        } else if (this.scrollBelowDistance > 0) {
            restoredScrollTop = this.itemTop + this.scrollBelowDistance - scrollHeight;
        } else {
            restoredScrollTop = this.itemTop + this.articleOffset;
        }

        if (this.incompleteRenderId) {
            cancelAnimationFrame(this.incompleteRenderId);
        }

        requestAnimationFrame(_.bind(function () {
            this.$article.css({
                position: 'fixed',
                '-webkit-transform': 'translate3d(0,0,0)',
                top: -scrollTop + 'px',
                left: 0,
                right: 0 // @todo proper calculation
            });
            this.$container.css({
                'margin-bottom': ''
            });

            // restore transitions if overridden by scrollback
            this.$article.css('-webkit-transition', '').css('opacity', '');

            this.$article.addClass('hidden');
            this.$articleClose.addClass('hidden');

            this.$container.css('-webkit-transform', ''); // reset our repositioning

            // set scroll top only after layout recalculation
            $(window).scrollTop(restoredScrollTop);
        }, this));
    }
});

window.ArticleView = Backbone.View.extend({
    initialize: function () {
        var self = this,
            gridHasLayout,
            afterLayout;

        this.itemTop = 0;
        this.articleTop = 0;
        this.articleHeight = Number.POSITIVE_INFINITY;
        this.articleIsAtTop = false;
        this.articleIsAtBottom = false;

        this.SCROLLBACK_MARGIN = 20;
        this.SCROLLBACK_DISTANCE = 400;

        this.scrollAboveDistance = 0;
        this.scrollBelowDistance = 0;

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
            self.articleTop = ((itemTop > scrollTop + scrollHeight) ? itemTop : Math.min(scrollTop, itemTop));

            // first-stage: re-flow and reposition grid into article mode
            // @todo cancel on destroy
            requestAnimationFrame(function () {
                self.$articleClose.removeClass('hidden');

                // trigger slide transition
                self.$li.prevAll().addClass('dismissedUp');
                self.$li.nextAll().andSelf().addClass('dismissedDown');

                // remove the existing reveal on any tiles not in direct vicinity
                self.$li.prevAll(':gt(7)').removeClass('read');
                self.$li.nextAll(':gt(7)').removeClass('read');
                self.$li.prevAll(':lt(8)').addClass('read');
                self.$li.nextAll(':lt(8)').addClass('read');
                self.$li.addClass('read');

                self.$container.css('-webkit-transform', 'translate3d(0,' + (-self.articleTop) + 'px,0)');
                self.$container.css('margin-bottom', -self.$container.outerHeight() + 'px');

                // article loading state
                self.$article.empty().css({
                    position: '',
                    '-webkit-transform': 'translate3d(0,0,0)',
                    top: '',
                    left: '',
                    right: '',
                    'min-height': scrollHeight
                }).addClass('loading').removeClass('hidden');

                $(window).scrollTop(0);
            });

            loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                // second-stage: article layout
                // @todo cancel on destroy
                requestAnimationFrame(function () {
                    self.$article.removeClass('loading');
                    self.$article.html(data);

                    // calculate dimensions after article is visible @todo is this fired if all images are loaded?
                    self.$article.imagesLoaded(function () {
                        self.articleHeight = self.$article.outerHeight();

                        self.setupScrollback();
                    });
                });
            });

            self.once('destroy', function () {
                loadRequest.abort();
            })
        });
    },

    render: function () {
        // scrollback state
        this.$container.toggleClass('scrollbackAbove', this.scrollAboveDistance > 0);
        this.$container.toggleClass('scrollbackBelow', this.scrollBelowDistance > 0);

        if (this.scrollAboveDistance > 0) {
            this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.articleTop + this.scrollAboveDistance - this.SCROLLBACK_DISTANCE) + 'px,0)');
            this.$article.css('opacity', 1 - this.scrollAboveDistance / this.SCROLLBACK_DISTANCE).css('-webkit-transition', 'none');
        } else if (this.scrollBelowDistance > 0) {
            this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.itemTop + this.articleHeight - this.scrollBelowDistance) + 'px,0)');
            this.$article.css('opacity', 1 - this.scrollBelowDistance / this.SCROLLBACK_DISTANCE).css('-webkit-transition', 'none');
        } else {
            // ensure there is still some transformation on the container
            this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.articleTop) + 'px,0)');
            this.$article.css('opacity', '').css('-webkit-transition', '');
        }

        // article fixed state
        if (this.articleIsAtTop) {
            this.$article.css({
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0 // @todo proper calculation
            });
            this.$container.css({
                'margin-bottom': (-this.$container.outerHeight() + this.articleHeight) + 'px'
            });
        } else if (this.articleIsAtBottom) {
            this.$article.css({
                position: 'fixed',
                top: -($(document).height() - $(window).height()) + 'px',
                left: 0,
                right: 0 // @todo proper calculation
            });
            this.$container.css({
                'margin-bottom': (-this.$container.outerHeight() + this.articleHeight) + 'px'
            });
        } else {
            this.$article.css({
                position: '',
                top: '',
                left: '',
                right: ''
            });
            this.$container.css({
                'margin-bottom': -this.$container.outerHeight() + 'px'
            });
        }
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
                    // @todo cancel previous RAF request (if multiple scrolls between frames)
                    requestAnimationFrame(_.bind(function () {
                        this.render();
                    }, this));
                }
            } else if (this.articleIsAtBottom && (this.scrollBelowDistance > 0 || deltaY < 0)) {
                e.preventDefault();

                this.scrollBelowDistance = Math.max(0, this.scrollBelowDistance - deltaY);

                if (this.scrollBelowDistance > this.SCROLLBACK_DISTANCE) {
                    this.destroy(); // initialize teardown animation without waiting for hash-change
                    window.location = this.$articleClose.get(0).href;
                } else {
                    // @todo cancel previous RAF request (if multiple scrolls between frames)
                    requestAnimationFrame(_.bind(function () {
                        this.render();
                    }, this));
                }
            }
        }, this);

        onScroll = _.bind(function () {
            // @todo there is an ugly snap to top if scrolling past bottom and *without releasing touch* scrolling up into unfix and then back down to bottom
            var scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                bodyHeight = $(document).height();

            if (scrollTop <= 0) {
                if (!this.articleIsAtTop) {
                    this.articleIsAtTop = true;

                    requestAnimationFrame(_.bind(function () {
                        this.render();
                    }, this));
                }
            } else if (scrollTop + scrollHeight >= bodyHeight) {
                if (!this.articleIsAtBottom) {
                    this.articleIsAtBottom = true;

                    requestAnimationFrame(_.bind(function () {
                        this.render();
                    }, this));
                }
            } else {
                if (this.articleIsAtTop || this.articleIsAtBottom) {
                    this.articleIsAtTop = this.articleIsAtBottom = false;

                    requestAnimationFrame(_.bind(function () {
                        this.render();
                    }, this));
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
            restoredScrollTop = this.articleTop - this.scrollAboveDistance + this.SCROLLBACK_DISTANCE;
        } else if (this.scrollBelowDistance > 0) {
            restoredScrollTop = this.itemTop + this.scrollBelowDistance - scrollHeight;
        } else {
            restoredScrollTop = this.articleTop;
        }

        requestAnimationFrame(_.bind(function () {
            this.$article.css({
                position: 'fixed',
                top: -scrollTop + 'px',
                left: 0,
                right: 0 // @todo proper calculation
            });
            this.$container.css({
                'margin-bottom': ''
            });

            // restore transitions if overridden by scrollback
            this.$article.css('-webkit-transform', '').css('opacity', '');

            this.$article.addClass('hidden');
            this.$articleClose.addClass('hidden');

            this.$container.css('-webkit-transform', ''); // reset our repositioning
            this.$container.removeClass('scrollbackAbove scrollbackBelow');

            this.$li.prevAll().removeClass('dismissedUp');
            this.$li.nextAll().andSelf().removeClass('dismissedDown');

            // set scroll top only after layout recalculation
            $(window).scrollTop(restoredScrollTop);
        }, this));
    }
});

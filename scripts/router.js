
function binarySearch(value, first, last, getter) {
    var count = 0;

    while(first < last) {
        var midLine = first + Math.ceil((last - first) / 2);
        var midValue = getter(midLine);

        if(midValue <= value)
            first = midLine;
        else
            last = midLine - 1;

        // TODO: remove
        count++;
        if(count > 100)
            throw "stuck in a loop for " + first + ' vs ' + last;
    }

    return last;
}

window.TagView = Backbone.View.extend({
    initialize: function () {
        var $container = $('#grid'),
            hiddenItems = [],
            queuedReadItems = [],
            paintPending = false,
            mouseEnableTimeoutId = null;

        function processQueuedReadItems() {
            if (paintPending) {
                return;
            }

            if (queuedReadItems.length) {
                paintPending = true;

                requestAnimationFrame(function () {
                    // pop one from queue to be painted
                    queuedReadItems.shift().$item.addClass('read');

                    // delay next paint to let this one complete
                    setTimeout(function () {
                        paintPending = false;
                        processQueuedReadItems();
                    }, 50);
                });
            }
        }

        function markItemsAsRead() {
            var scrollTop = $(window).scrollTop(),
                scrollBottom = scrollTop + $(window).height(),

                hiddenTopGetter = function (i) { return hiddenItems[i].y; },
                startIndex = binarySearch(scrollTop, 0, hiddenItems.length - 1, hiddenTopGetter),
                endIndex = binarySearch(scrollBottom, startIndex, hiddenItems.length - 1, hiddenTopGetter),

                readItems = hiddenItems.splice(startIndex, endIndex - startIndex);

            queuedReadItems = queuedReadItems.concat(readItems);
            processQueuedReadItems();
        }

        function disableMouseDuringScroll() {
            if (mouseEnableTimeoutId !== null) {
                clearTimeout(mouseEnableTimeoutId);
            } else {
                $container.css('pointer-events', 'none').addClass('scrolling');
            }

            mouseEnableTimeoutId = setTimeout(function () {
                mouseEnableTimeoutId = null;

                $container.css('pointer-events', '').removeClass('scrolling');
            }, 100);
        }

        function findHiddenItems() {
            $container.children('li:not(.read)').each(function (i) {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                hiddenItems.push({ y: position.y, $item: $item });
            });

            hiddenItems.sort(function (a, b) { return a.y - b.y });

            markItemsAsRead();
        }

        if ($container.children(':first').data('isotope-item-position')) {
            setTimeout(findHiddenItems, 0); // async for consistency with initial invocation
        } else {
            // initial layout
            $container.isotope({
                itemSelector: 'li',
                itemPositionDataEnabled: true
            }, findHiddenItems);
        }

        // immediately register scroll callback to be able to clear it before Isotope finishes
        $(document).on('scroll', markItemsAsRead);
        $(document).on('scroll', disableMouseDuringScroll);

        console.log('tag view')

        this.destroy = function () {
            $(document).off('scroll', markItemsAsRead);
            $(document).off('scroll', disableMouseDuringScroll);
        }
    }
});

window.ArticleView = Backbone.View.extend({
    initialize: function () {
        console.log('article view', this.model);

        var self = this,
            gridHasLayout,
            afterLayout;

        this.itemTop = 0;
        this.articleTop = 0;
        this.articleHeight = Number.POSITIVE_INFINITY;

        this.SCROLLBACK_MARGIN = 20;
        this.SCROLLBACK_DISTANCE = 400;

        this.scrollAboveDistance = 0;
        this.scrollBelowDistance = 0;

        this.$article = $('#article');
        this.$articleClose = $('#close');
        this.$container = $('#grid');

        // for testing purposes, article "id" is the index of the corresponding list item
        this.$li = this.$container.children().eq(parseInt(this.model.id, 10));

        // turn off mouse events
        this.$container.css('pointer-events', 'none');

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
                maxLeeway = $(window).height(),

                loadRequest;

            self.itemTop = itemTop;

            // if the link top would be within top half of the screen, show article where screen is, otherwise anchor article to link and move scroll top
            self.articleTop = ((itemTop > scrollTop + maxLeeway) ? itemTop : Math.min(scrollTop, itemTop));

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
                self.$li.prevAll(':lt(7)').addClass('read');
                self.$li.nextAll(':lt(7)').addClass('read');
                self.$li.addClass('read');

                self.$container.css({
                    '-webkit-transform': 'translate3d(0,' + (-self.articleTop) + 'px,0)',
                    'margin-bottom': -self.$container.outerHeight() + 'px'
                });

                $(window).scrollTop(0);
            });

            loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                // second-stage: article layout
                // @todo cancel on destroy
                requestAnimationFrame(function () {
                    self.$article.removeClass('hidden');
                    self.$article.css({ position: '', top: '', left: '', right: '' });
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

    performFixArticle: function (top) {
        this.$article.css({
            position: 'fixed',
            top: top + 'px',
            left: 0,
            right: 0 // @todo proper calculation
        });
        this.$container.css({
            'margin-bottom': (-this.$container.outerHeight() + this.articleHeight) + 'px'
        });
    },

    performUnfixArticle: function () {
        this.$article.css({
            position: '',
            top: '',
            left: '',
            right: ''
        });
        this.$container.css({
            'margin-bottom': -this.$container.outerHeight() + 'px'
        });
    },

    setupScrollback: function () {
        var allowScrollbackStartTime = 0,
            articleIsFixed = false;

        onWheel = _.bind(function (e) {
            var deltaY = e.originalEvent.wheelDeltaY * 0.1, // hardware delta is more than pixel speed
                scrollTop = $(window).scrollTop(),
                currentTime = new Date().getTime();

            if (!articleIsFixed || allowScrollbackStartTime > currentTime) {
                // extra wait until existing mouse wheel inertia dies down
                allowScrollbackStartTime = currentTime + 50;
                return;
            }

            if (scrollTop <= 0 && (this.scrollAboveDistance > 0 || deltaY > 0)) {
                e.preventDefault();

                if (this.scrollAboveDistance === 0 && deltaY > 0) {
                    requestAnimationFrame(_.bind(function () {
                        this.$container.addClass('scrollbackAbove').removeClass('scrollbackBelow');
                    }, this));
                }

                this.scrollAboveDistance = Math.max(0, this.scrollAboveDistance + deltaY);

                if (this.scrollAboveDistance === 0) {
                    requestAnimationFrame(_.bind(function () {
                        this.$container.removeClass('scrollbackAbove');
                    }, this));
                }

                if (this.scrollAboveDistance > this.SCROLLBACK_DISTANCE) {
                    this.destroy(); // initialize teardown animation without waiting for hash-change
                    window.location = this.$articleClose.get(0).href;
                } else {
                    // @todo cancel previous RAF request (if multiple scrolls between frames)
                    requestAnimationFrame(_.bind(function () {
                        this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.articleTop + this.scrollAboveDistance - this.SCROLLBACK_DISTANCE) + 'px,0)');
                    }, this));
                }
            } else if (scrollTop > 0 && (this.scrollBelowDistance > 0 || deltaY < 0)) {
                e.preventDefault();

                if (this.scrollBelowDistance === 0 && deltaY < 0) {
                    requestAnimationFrame(_.bind(function () {
                        this.$container.addClass('scrollbackBelow').removeClass('scrollbackAbove');
                    }, this));
                }

                this.scrollBelowDistance = Math.max(0, this.scrollBelowDistance - deltaY);

                if (this.scrollBelowDistance === 0) {
                    requestAnimationFrame(_.bind(function () {
                        this.$container.removeClass('scrollbackBelow');
                    }, this));
                }

                if (this.scrollBelowDistance > this.SCROLLBACK_DISTANCE) {
                    this.destroy(); // initialize teardown animation without waiting for hash-change
                    window.location = this.$articleClose.get(0).href;
                } else {
                    // @todo cancel previous RAF request (if multiple scrolls between frames)
                    requestAnimationFrame(_.bind(function () {
                        this.$container.css('-webkit-transform', 'translate3d(0,' + (-this.itemTop + this.articleHeight - this.scrollBelowDistance) + 'px,0)');
                    }, this));
                }
            }
        }, this);

        onScroll = _.bind(function () {
            var scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                bodyHeight = $(document.body).height();

            if (scrollTop <= 0) {
                if (!articleIsFixed) {
                    articleIsFixed = true;

                    requestAnimationFrame(_.bind(function () {
                        this.performFixArticle(0);
                    }, this));
                }
            } else if (scrollTop + scrollHeight >= bodyHeight) {
                if (!articleIsFixed) {
                    articleIsFixed = true;

                    requestAnimationFrame(_.bind(function () {
                        this.performFixArticle(-(bodyHeight - scrollHeight));
                    }, this));
                }
            } else {
                if (articleIsFixed) {
                    articleIsFixed = false;

                    requestAnimationFrame(_.bind(function () {
                        this.performUnfixArticle();
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

        // re-enable mouse events
        this.$container.css('pointer-events', 'auto');

        // repaint heavy layout changes
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

            this.$article.addClass('hidden');
            this.$articleClose.addClass('hidden');

            this.$container.css('-webkit-transform', ''); // trigger acceleration
            this.$container.removeClass('scrollbackAbove').removeClass('scrollbackBelow');

            this.$li.prevAll().removeClass('dismissedUp');
            this.$li.nextAll().andSelf().removeClass('dismissedDown');

            // set scroll top only after layout recalculation
            $(window).scrollTop(restoredScrollTop);
        }, this));
    }
});

window.Router = Backbone.Router.extend({
    routes: {
        '': 'index',
        'tags/:tag': 'tag',
        'tags/:tag/:article': 'article'
    },

    index: function() {
        var self = this,
            view = new TagView();

        setTimeout(function() {
            self.once('route', function() {
                view.destroy();
            });
        }, 0);
    },

    tag: function(tag) {
        var self = this,
            view = new TagView();

        setTimeout(function() {
            self.once('route', function() {
                view.destroy();
            });
        }, 0);
    },

    article: function(tag, article) {
        var self = this,
            view = new ArticleView({ model: { id: article, tag: tag } });

        setTimeout(function() {
            self.once('route', function() {
                view.destroy();
            });
        }, 0);
    }
});
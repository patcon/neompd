
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
                    queuedReadItems.splice(0, 4).forEach(function (tuple) {
                        tuple.$item.addClass('read');
                    });

                    setTimeout(function () {
                        paintPending = false;
                        processQueuedReadItems();
                    }, 200);
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

        $container.isotope({
            itemSelector: 'li',
            itemPositionDataEnabled: true
        }, function () {
            $container.children('li:not(.read)').each(function (i) {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                hiddenItems.push({ y: position.y, $item: $item });
            });

            hiddenItems.sort(function (a, b) { return a.y - b.y });

            markItemsAsRead();
        });

        // immediately register scroll callback to be able to clear it before Isotope finishes
        $(document).on('scroll', markItemsAsRead);
        $(document).on('scroll', disableMouseDuringScroll);

        this.destroy = function () {
            $(document).off('scroll', markItemsAsRead);
            $(document).off('scroll', disableMouseDuringScroll);
        }
    }
});

window.ArticleView = Backbone.View.extend({
    initialize: function () {
        console.log('article view', this.model);

        var self = this;

        this.articleTop = 0;
        this.articleBottom = Number.POSITIVE_INFINITY;

        this.keepScrollInArticleUntil = Number.POSITIVE_INFINITY;

        this.SCROLLBACK_DISTANCE = 200;
        this.SCROLLBACK_DELAY = 1000;

        this.$article = $('#article');
        this.$articleClose = $('#close');
        this.$container = $('#grid');

        // for testing purposes, article "id" is the index of the corresponding list item
        this.$li = this.$container.children().eq(parseInt(this.model.id, 10));

        // turn off mouse events
        this.$container.css('pointer-events', 'none').addClass('backgroundMode');

        // trigger slide transition
        this.$li.prevAll().addClass('dismissedUp');
        this.$li.nextAll().andSelf().addClass('dismissedDown');

        this.$articleClose = $('#close').attr('href', '#tags/' + this.model.tag).removeClass('hidden');

        this.$container.isotope({
            itemSelector: 'li',
            itemPositionDataEnabled: true
        }, function () {
            var position = self.$li.data('isotope-item-position'),
                scrollTop = $(window).scrollTop(),
                maxLeeway = $(window).height() * 0.5,
                loadRequest;

            // if the link top would be within top half of the screen, show article where screen is, otherwise anchor article to link and move scroll top
            self.articleTop = (position.y > scrollTop + maxLeeway) ? position.y : Math.min(scrollTop, position.y);

            self.$article.css({ position: 'absolute', top: self.articleTop });
            $(window).scrollTop(self.articleTop);

            loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                self.$article.removeClass('hidden');
                self.$article.html(data);

                self.articleBottom = self.articleTop + self.$article.height();
            });

            self.once('destroy', function () {
                loadRequest.abort();
            })
        });

        this.setupScroll();
    },

    setupScroll: function () {
        var lastScrollTime = 0,
            lastScrollWasAutomatic = false,
            scrollAnimationIntervalId,
            onScroll;

        scrollAnimationIntervalId = setInterval(_.bind(function () {
            var currentTime = new Date().getTime(),
                scrollTop;

            if (lastScrollTime + this.SCROLLBACK_DELAY > currentTime) {
                return;
            }

            scrollTop = $(window).scrollTop();

            if (scrollTop < this.articleTop) {
                // simple asymptotic animation
                lastScrollWasAutomatic = true;
                $(window).scrollTop(scrollTop + Math.ceil(0.2 * (this.articleTop - scrollTop)));
            }
        }, this), 20);

        this.once('destroy', function () {
            clearInterval(scrollAnimationIntervalId);
        });

        onScroll = _.bind(function () {
            if (lastScrollWasAutomatic) {
                lastScrollWasAutomatic = false;
            } else {
                lastScrollTime = new Date().getTime();
            }

            this.trackBounds($(window).scrollTop(), $(window).height());
        }, this);

        $(document).on('scroll', onScroll);

        this.once('destroy', function () {
            $(document).off('scroll', onScroll);
        });
    },

    trackBounds: function (scrollTop, scrollHeight) {
        var minScrollTop = this.articleTop - this.SCROLLBACK_DISTANCE,
            maxScrollBottom = this.articleBottom + this.SCROLLBACK_DISTANCE,
            currentTime = new Date().getTime(),
            originalScrollTop = scrollTop;

        if (scrollTop > this.articleTop && scrollTop + scrollHeight < this.articleBottom) {
            // only reset the flag if back *inside* the article and not on the exact top
            this.keepScrollInArticleUntil = Number.POSITIVE_INFINITY;
        } else if (this.keepScrollInArticleUntil > currentTime) {
            if (scrollTop < this.articleTop) {
                this.keepScrollInArticleUntil = currentTime + 200;
                scrollTop = this.articleTop;
            } else if (scrollTop + scrollHeight > this.articleBottom) {
                this.keepScrollInArticleUntil = currentTime + 200;
                scrollTop = this.articleBottom - scrollHeight;
            }
        }

        if (scrollTop !== originalScrollTop) {
            $(window).scrollTop(scrollTop);
        }

        this.$article.toggleClass('aboveBound', (scrollTop <= this.articleTop));

        if (scrollTop < minScrollTop || scrollTop + scrollHeight > maxScrollBottom) {
            window.location = this.$articleClose.get(0).href;
        }
    },

    destroy: function () {
        this.trigger('destroy');

        this.$article.addClass('hidden');
        this.$articleClose.addClass('hidden');

        this.$container.css('pointer-events', 'auto');
        this.$li.prevAll().removeClass('dismissedUp');
        this.$li.nextAll().andSelf().removeClass('dismissedDown');
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
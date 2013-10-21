
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
            paintPending = false;

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

        this.destroy = function () {
            $(document).off('scroll', markItemsAsRead);
        }
    }
});

window.ArticleView = Backbone.View.extend({
    initialize: function () {
        console.log('article view', this.model);

        var self = this;

        this.articleTop = 0;
        this.lastScrollTime = 0;

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
                maxLeeway = $(window).height() * 0.5;

            // if the link top would be within top half of the screen, show article where screen is, otherwise anchor article to link and move scroll top
            self.articleTop = (position.y > scrollTop + maxLeeway) ? position.y : Math.min(scrollTop, position.y);

            self.$article.css({ position: 'absolute', top: self.articleTop });
            $(window).scrollTop(self.articleTop);

            self.loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                self.$article.removeClass('hidden');
                self.$article.html(data);
            });
        });

        this.scrollAnimationIntervalId = setInterval(_.bind(this.animateScrollback, this), 20);

        this.lastScrollWasAutomatic = false;

        function onScroll() {
            if (self.lastScrollWasAutomatic) {
                self.lastScrollWasAutomatic = false;
            } else {
                self.lastScrollTime = new Date().getTime();
            }

            self.trackBounds($(window).scrollTop());
        }

        $(document).on('scroll', onScroll);

        this.unbindScroll = function () {
            $(document).off('scroll', onScroll);
        }
    },

    animateScrollback: function () {
        var currentTime = new Date().getTime(),
            self = this,
            scrollTop;

        if (this.lastScrollTime + this.SCROLLBACK_DELAY > currentTime) {
            return;
        }

        scrollTop = $(window).scrollTop();

        if (scrollTop < this.articleTop) {
            // simple asymptotic animation
            self.lastScrollWasAutomatic = true;
            $(window).scrollTop(scrollTop + Math.ceil(0.2 * (this.articleTop - scrollTop)));
        }
    },

    trackBounds: function (scrollTop) {
        this.$article.toggleClass('aboveBound', (scrollTop <= this.articleTop));

        if (scrollTop + this.SCROLLBACK_DISTANCE < this.articleTop) {
            window.location = this.$articleClose.get(0).href;
        }
    },

    destroy: function () {
        clearInterval(this.scrollAnimationIntervalId);
        this.unbindScroll();

        this.loadRequest.abort();

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
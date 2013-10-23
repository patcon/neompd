
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

        var self = this;

        this.articleTop = 0;
        this.articleBottom = Number.POSITIVE_INFINITY;

        this.$article = $('#article');
        this.$articleClose = $('#close');
        this.$container = $('#grid');

        this.$topPad = $('<div></div>').insertBefore(this.$container);
        this.$bottomPad = $('<div></div>').insertAfter(this.$container);

        // for testing purposes, article "id" is the index of the corresponding list item
        this.$li = this.$container.children().eq(parseInt(this.model.id, 10));

        // turn off mouse events
        this.$container.css('pointer-events', 'none');

        // trigger slide transition
        this.$li.prevAll().addClass('dismissedUp');
        this.$li.nextAll().andSelf().addClass('dismissedDown');

        this.$articleClose = $('#close').attr('href', '#tags/' + this.model.tag).removeClass('hidden');

        // disable transitions to perform instant layout
        this.$container.children('li').css({
            '-webkit-transition': 'none'
        });

        function augmentTransform($item, yOffset) {
            var xform = $item.css('-webkit-transform');
            $item.css('-webkit-transform', xform + ' translate3d(0px, ' + yOffset + 'px, 0px)');
        }

        this.$container.isotope({
            itemSelector: 'li',
            itemPositionDataEnabled: true
        }, function () {
            var position = self.$li.data('isotope-item-position'),
                containerOffset = self.$container.offset(),
                itemTop = position.y + containerOffset.top,

                scrollTop = $(window).scrollTop(),
                maxLeeway = $(window).height() * 0.5,

                loadRequest;

            // if the link top would be within top half of the screen, show article where screen is, otherwise anchor article to link and move scroll top
            self.articleTop = ((itemTop > scrollTop + maxLeeway) ? itemTop : Math.min(scrollTop, itemTop));

            self.$topPad.css({ 'margin-top': -self.articleTop + 'px' });
            self.$bottomPad.css({ 'margin-bottom': -self.$container.outerHeight() + self.articleTop + 'px' });
            $(window).scrollTop(0);

            loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                self.$article.removeClass('hidden');
                self.$article.html(data);

                // calculate dimensions after article is visible
                self.articleBottom = self.articleTop + self.$article.height();
            });

            self.once('destroy', function () {
                loadRequest.abort();
            })
        });
    },

    destroy: function () {
        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            scrollBottom = scrollTop + scrollHeight,

            articleHeight = this.articleBottom - this.articleTop,
            restoredScrollTop = this.articleTop;
        console.log('article destroy')

        this.trigger('destroy');

        $(window).scrollTop(restoredScrollTop);

        this.$topPad.remove();
        this.$bottomPad.remove();
        this.$article.addClass('hidden');
        this.$articleClose.addClass('hidden');

        // re-enable mouse events and transitions
        this.$container.css('pointer-events', 'auto');
        this.$container.children('li').css({
            '-webkit-transition': ''
        });

        this.$li.prevAll().removeClass('dismissedUp');
        this.$li.nextAll().andSelf().removeClass('dismissedDown shifted');
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
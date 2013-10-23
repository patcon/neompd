
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

        this.itemTop = 0;
        this.articleTop = 0;
        this.articleHeight = Number.POSITIVE_INFINITY;

        this.SCROLLBACK_DISTANCE = 200;

        this.scrollAboveDistance = 0;
        this.scrollBelowDistance = 0;

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

        this.$container.css('-webkit-transform', 'translate3d(0,0,0)'); // trigger acceleration

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

            self.itemTop = itemTop;

            // if the link top would be within top half of the screen, show article where screen is, otherwise anchor article to link and move scroll top
            self.articleTop = ((itemTop > scrollTop + maxLeeway) ? itemTop : Math.min(scrollTop, itemTop));

            self.$topPad.css({ 'margin-top': -self.articleTop + 'px' });
            self.$bottomPad.css({ 'margin-bottom': -self.$container.outerHeight() + self.articleTop + 'px' });
            $(window).scrollTop(0);

            self.setupScrollback();

            loadRequest = $.get('/articles/photo-ia-the-sctructure-behind.html', function (data) {
                self.$article.removeClass('hidden');
                self.$article.html(data);

                // calculate dimensions after article is visible
                self.$article.imagesLoaded(function () { self.articleHeight = self.$article.outerHeight() });
            });

            self.once('destroy', function () {
                loadRequest.abort();
            })
        });
    },

    setupScrollback: function () {
        onWheel = _.bind(function (e) {
            var deltaY = e.originalEvent.wheelDeltaY * 0.05, // hardware delta is more than pixel speed
                scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                bodyHeight = $(document.body).height();

            if (this.scrollAboveDistance > 0 || scrollTop <= 0 && deltaY > 0) {
                e.preventDefault();

                this.scrollAboveDistance = Math.max(0, this.scrollAboveDistance + deltaY);
                this.$container.removeClass('scrollbackBelow').addClass('scrollbackAbove');
                this.$container.css('-webkit-transform', 'translate3d(0,' + (this.scrollAboveDistance - this.SCROLLBACK_DISTANCE) + 'px,0)');

                if (this.scrollAboveDistance > this.SCROLLBACK_DISTANCE) {
                    window.location = this.$articleClose.get(0).href;
                }
            } else if (this.scrollBelowDistance > 0 || scrollTop + scrollHeight >= bodyHeight && deltaY < 0) {
                e.preventDefault();

                this.scrollBelowDistance = Math.max(0, this.scrollBelowDistance - deltaY);
                this.$container.removeClass('scrollbackAbove').addClass('scrollbackBelow');
                this.$container.css('-webkit-transform', 'translate3d(0,' + (this.articleTop - this.itemTop + this.articleHeight - this.scrollBelowDistance) + 'px,0)');

                if (this.scrollBelowDistance > this.SCROLLBACK_DISTANCE) {
                    window.location = this.$articleClose.get(0).href;
                }
            }
        }, this);

        $(document).on('mousewheel', onWheel);

        this.once('destroy', function () {
            $(document).off('mousewheel', onWheel);
        });
    },

    destroy: function () {
        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            scrollBottom = scrollTop + scrollHeight,

            restoredScrollTop;
        console.log('article destroy')

        this.trigger('destroy');

        if (this.scrollAboveDistance > 0) {
            restoredScrollTop = this.articleTop - this.scrollAboveDistance + this.SCROLLBACK_DISTANCE;
        } else if (this.scrollBelowDistance > 0) {
            restoredScrollTop = this.itemTop + this.scrollBelowDistance - scrollHeight;
        } else {
            restoredScrollTop = this.articleTop;
        }

        this.$topPad.remove();
        this.$bottomPad.remove();
        this.$article.addClass('hidden');
        this.$articleClose.addClass('hidden');

        // re-enable mouse events and transitions
        this.$container.css('pointer-events', 'auto');
        this.$container.css('-webkit-transform', ''); // trigger acceleration
        this.$container.removeClass('scrollbackAbove').removeClass('scrollbackBelow');
        this.$container.children('li').css({
            '-webkit-transition': ''
        });

        this.$li.prevAll().removeClass('dismissedUp');
        this.$li.nextAll().andSelf().removeClass('dismissedDown');

        // set scroll top only after layout recalculation
        $(window).scrollTop(restoredScrollTop);
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
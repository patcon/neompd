
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

$(function () {
    $container = $('#grid');

    function initializeScrollReader() {
        var hiddenItems = [],
            queuedReadItems = [],
            paintPending = false;

        $container.find('li').each(function (i) {
            var $item = $(this),
                position = $item.data('isotope-item-position');

            hiddenItems[i] = { y: position.y, $item: $item };
        });

        hiddenItems.sort(function (a, b) { return a.y - b.y });

        function processQueuedReadItems() {
            if (paintPending) {
                return;
            }

            if (queuedReadItems.length) {
                paintPending = true;

                requestAnimationFrame(function () {
                    queuedReadItems.splice(0, 4).forEach(function (tuple) {
                        console.log('yup')
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

        $(document).on('scroll', function () {
            markItemsAsRead();
        });

        markItemsAsRead();
    }

    $container.isotope({
        itemSelector: 'li',
        itemPositionDataEnabled: true
    }, function () {
        initializeScrollReader();
    });
});

window.TagView = Backbone.View.extend({
    initialize: function () {
        console.log('tag view');
    }
});

window.ArticleView = Backbone.View.extend({
    initialize: function () {
        console.log('article view', this.model);

        // for testing purposes, article "id" is the index of the corresponding list item
        var $li = $container.children().eq(parseInt(this.model.id, 10));

        $articleClose.attr('href', '#tags/' + this.model.tag);
    },

    destroy: function () {
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
            });
        }, 0);
    },

    tag: function(tag) {
        var self = this,
            view = new TagView();

        setTimeout(function() {
            self.once('route', function() {
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
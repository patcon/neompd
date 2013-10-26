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

        function markItemsAsRead(isImmediate) {
            var scrollTop = $(window).scrollTop(),
                scrollHeight = $(window).height(),
                scrollBottom = scrollTop + scrollHeight,

                hiddenTopGetter = function (i) { return hiddenItems[i].y; },
                startIndex = binarySearch(scrollTop - scrollHeight, 0, hiddenItems.length - 1, hiddenTopGetter),
                endIndex = binarySearch(scrollBottom, startIndex, hiddenItems.length - 1, hiddenTopGetter),

                readItems = hiddenItems.splice(startIndex, endIndex - startIndex);

            if (isImmediate) {
                console.log(readItems)
                $.each(readItems, function () { this.$item.addClass('read') });
            } else {
                queuedReadItems = queuedReadItems.concat(readItems);
                processQueuedReadItems();
            }
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
            // remove the existing reveal after rendering (does not affect display yet)
            // @todo avoid this if already mode=tiles
            $container.children('li').removeClass('read');

            $container.children('li:not(.read)').each(function (i) {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                hiddenItems.push({ y: position.y, $item: $item });
            });

            hiddenItems.sort(function (a, b) { return a.y - b.y });

            markItemsAsRead(true);

            $container.attr('mode', 'tiles');
            console.log('mode tiles')
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

        function onScroll() {
            markItemsAsRead(false);
            disableMouseDuringScroll();
        }

        // immediately register scroll callback to be able to clear it before Isotope finishes
        $(document).on('scroll', onScroll);

        this.destroy = function () {
            $(document).off('scroll', onScroll);
        }
    }
});
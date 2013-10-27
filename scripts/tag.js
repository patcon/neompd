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

                i,

                readItems = [];

            // simple brute-force loop
            for (i = 0; i < hiddenItems.length; i += 1) {
                if (hiddenItems[i].y < scrollBottom && hiddenItems[i].bottom >= scrollTop) {
                    readItems.push(hiddenItems.splice(i, 1)[0]);
                    i -= 1;
                }
            }

            if (isImmediate) {
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

        function initialSetup() {
            // remove the existing reveal after rendering (does not affect display yet)
            // @todo avoid this if already mode=tiles
            $container.children('li').removeClass('read');

            $container.children('li:not(.read)').each(function (i) {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                hiddenItems.push({ y: position.y, $item: $item, bottom: position.y + $item.outerHeight(true) });
            });

            markItemsAsRead(true);

            requestAnimationFrame(function () {
                console.log('mode tiles')
                $container.attr('mode', 'tiles');
            });
        }

        if ($container.children(':first').data('isotope-item-position')) {
            setTimeout(initialSetup, 0); // async for consistency with initial invocation
        } else {
            // initial layout
            $container.isotope({
                itemSelector: 'li',
                itemPositionDataEnabled: true
            }, initialSetup);
        }

        function onScroll() {
            markItemsAsRead(false);
            //disableMouseDuringScroll();
        }

        // immediately register scroll callback to be able to clear it before Isotope finishes
        $(document).on('scroll', onScroll);

        this.destroy = function () {
            $(document).off('scroll', onScroll);
        }
    }
});

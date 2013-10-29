window.TagView = Backbone.View.extend({
    initialize: function () {
        var $container = $('#grid'),
            hiddenItems = [],

            allowRevealingTiles = false,
            queuedReadItems = [],
            paintPending = false,
            paintStartTimeoutId = null,
            revealTimeoutId = null,
            mouseEnableTimeoutId = null;

        function processQueuedReadItems() {
            if (paintPending) {
                return;
            }

            if (queuedReadItems.length) {
                paintPending = true;

                // delay next paint to let previous one complete
                // @todo cancel on destroy
                revealTimeoutId = setTimeout(function () {
                    // skip revealing tiles until tile paint is enabled, to avoid paint bunching
                    if (!allowRevealingTiles) {
                        paintPending = false;
                        processQueuedReadItems();
                        return;
                    }

                    requestAnimationFrame(function () {
                        paintPending = false;

                        // pop one from queue to be painted
                        queuedReadItems.shift().$item.addClass('read');

                        processQueuedReadItems();
                    });
                }, 50);
            }
        }

        function markItemsAsRead() {
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

            queuedReadItems = queuedReadItems.concat(readItems);
            processQueuedReadItems();
        }

        function disableMouseDuringScroll() {
            if (mouseEnableTimeoutId !== null) {
                clearTimeout(mouseEnableTimeoutId);
            } else {
                $container.addClass('scrolling');
            }

            mouseEnableTimeoutId = setTimeout(function () {
                mouseEnableTimeoutId = null;

                $container.removeClass('scrolling');
            }, 200);
        }

        function initialSetup() {
            var scrollTop = $(window).scrollTop();

            // remove the existing reveal after rendering (does not affect display yet)
            // @todo avoid this if already mode=tiles
            $container.children('li:not(.dismissedUp):not(.dismissedDown)').removeClass('read');

            // convert tiles visible during article-view into revealed ones
            $container.children('.dismissedUp, .dismissedDown').addClass('read');

            $container.children('li:not(.read)').each(function (i) {
                var $item = $(this),
                    position = $item.data('isotope-item-position');

                // set up direction of animation
                if (position.y < scrollTop) {
                    $item.addClass('startAbove').removeClass('startBelow');
                } else {
                    $item.addClass('startBelow').removeClass('startAbove');
                }

                hiddenItems.push({ y: position.y, $item: $item, bottom: position.y + $item.outerHeight(true) });
            });

            // delay initial render until possible transitions have completed painting
            // @todo cancel on destroy
            paintStartTimeoutId = setTimeout(function () {
                requestAnimationFrame(function () {
                    allowRevealingTiles = true;

                    markItemsAsRead();
                    $container.attr('mode', 'tiles');
                });
            }, 200);
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
            markItemsAsRead();
            disableMouseDuringScroll();
        }

        // immediately register scroll callback to be able to clear it before Isotope finishes
        $(document).on('scroll', onScroll);

        this.destroy = function () {
            clearTimeout(paintStartTimeoutId);
            clearTimeout(revealTimeoutId);

            $(document).off('scroll', onScroll);
        }
    }
});

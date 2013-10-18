(function ($) {

    $.fn.elevator = function () {
        var $elevator = this,
            $document = $(this.get(0).ownerDocument),
            $window = $(window),
            elevatorTop = 0,
            elevatorBottom = $elevator.height(),
            lastScrollTop = $document.scrollTop(),
            lastScrollBottom = lastScrollTop + $window.height(), // track separately because viewport height may change too during rubberband scroll
            elevatorIsFixed = false;

        function animateMenuElevator(viewportTop, viewportHeight) {
            var scrollTop = Math.max(0, viewportTop), // clamp for rubberband scroll
                scrollBottom = Math.min($document.height(), viewportTop + viewportHeight); // clamp for rubberband scroll

            if (scrollTop > lastScrollTop) {
                // going down, check if need to detach from top or fix on bottom
                if (scrollBottom >= elevatorBottom) {
                    if (elevatorIsFixed) {
                        // compute triggers for top and bottom
                        elevatorTop = lastScrollTop;
                        elevatorBottom = elevatorTop + $elevator.height();

                        // if recalculated bottom is still not visible, absolute-position
                        if (scrollBottom < elevatorBottom) {
                            elevatorIsFixed = false;

                            $elevator.css({
                                position: 'absolute',
                                top: elevatorTop,
                                bottom: 'auto'
                            });
                        }
                    } else {
                        elevatorIsFixed = true;

                        $elevator.css({
                            position: 'fixed',
                            'min-height': '100%',
                            top: 'auto',
                            bottom: 0
                        });

                        // reset the triggers to stop fixing
                        elevatorTop = Number.POSITIVE_INFINITY;
                        elevatorBottom = Number.POSITIVE_INFINITY;
                    }
                }
            } else if (scrollTop < lastScrollTop) {
                // going up, check if need to detach from bottom or fix on top
                if (scrollTop <= elevatorTop) {
                    if (elevatorIsFixed) {
                        // compute triggers for top and bottom
                        elevatorBottom = lastScrollBottom;
                        elevatorTop = elevatorBottom - $elevator.height();

                        // if recalculated bottom is still not visible, absolute-position
                        if (scrollTop > elevatorTop) {
                            elevatorIsFixed = false;

                            $elevator.css({
                                position: 'absolute',
                                top: elevatorTop,
                                bottom: 'auto'
                            });
                        }
                    } else {
                        elevatorIsFixed = true;

                        $elevator.css({
                            position: 'fixed',
                            'min-height': '100%',
                            top: 0,
                            bottom: 'auto'
                        });

                        // reset the triggers to stop fixing
                        elevatorTop = Number.NEGATIVE_INFINITY;
                        elevatorBottom = Number.NEGATIVE_INFINITY;
                    }
                }
            }

            lastScrollTop = scrollTop;
            lastScrollBottom = scrollBottom;
        }

        $document.on('scroll', function () {
            animateMenuElevator($document.scrollTop(), $window.height());
        });

        return this;
    }

}(jQuery))
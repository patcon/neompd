(function ($) {

    $.fn.elevator = function () {
        var $menuElevator = this,
            $document = $(this.get(0).ownerDocument),
            $window = $(window),
            menuElevatorTop = 0,
            menuElevatorBottom = $menuElevator.height(),
            menuElevatorLastScrollTop = $document.scrollTop(),
            menuElevatorLastScrollBottom = menuElevatorLastScrollTop + $window.height(), // track separately because viewport height may change too during rubberband scroll
            menuElevatorIsFixed = false;

        function animateMenuElevator(scrollTop, viewportHeight) {
            var scrollBottom = Math.min($document.height(), scrollTop + viewportHeight); // rubberband scroll does not adjust for height

            if (scrollTop > menuElevatorLastScrollTop) {
                // going down, check if need to detach from top or fix on bottom
                if (scrollBottom >= menuElevatorBottom) {
                    if (menuElevatorIsFixed) {
                        // compute triggers for top and bottom
                        menuElevatorTop = menuElevatorLastScrollTop;
                        menuElevatorBottom = menuElevatorTop + $menuElevator.height();

                        // if recalculated bottom is still not visible, absolute-position
                        if (scrollBottom < menuElevatorBottom) {
                            menuElevatorIsFixed = false;

                            // detach and position
                            $menuElevator.css({
                                position: 'absolute',
                                top: menuElevatorTop,
                                bottom: 'auto'
                            });
                        }
                    } else {
                        // reset the triggers to stop fixing
                        menuElevatorTop = Number.POSITIVE_INFINITY;
                        menuElevatorBottom = Number.POSITIVE_INFINITY;
                        menuElevatorIsFixed = true;
                        $menuElevator.css({
                            position: 'fixed',
                            'min-height': '100%',
                            top: 'auto',
                            bottom: 0
                        });
                    }
                }
            } else if (scrollTop < menuElevatorLastScrollTop) {
                // going up, check if need to detach from bottom or fix on top
                if (scrollTop <= menuElevatorTop) {
                    if (menuElevatorIsFixed) {
                        // compute triggers for top and bottom
                        menuElevatorBottom = menuElevatorLastScrollBottom;
                        menuElevatorTop = menuElevatorBottom - $menuElevator.height();

                        // if recalculated bottom is still not visible, absolute-position
                        if (scrollTop > menuElevatorTop) {
                            menuElevatorIsFixed = false;

                            // detach and position
                            $menuElevator.css({
                                position: 'absolute',
                                top: menuElevatorTop,
                                bottom: 'auto'
                            });
                        }
                    } else {
                        // reset the triggers to stop fixing
                        menuElevatorTop = 0;
                        menuElevatorBottom = 0;
                        menuElevatorIsFixed = true;
                        $menuElevator.css({
                            position: 'fixed',
                            'min-height': '100%',
                            top: 0,
                            bottom: 'auto'
                        });
                    }
                }
            }

            menuElevatorLastScrollTop = scrollTop;
            menuElevatorLastScrollBottom = scrollBottom;
        }

        $document.on('scroll', function () {
            animateMenuElevator($document.scrollTop(), $window.height());
        });

        return this;
    }

}(jQuery))
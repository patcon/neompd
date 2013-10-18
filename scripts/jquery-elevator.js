(function ($) {

    $.fn.elevator = function () {
        var $menuElevator = this,
            $document = $(this.get(0).ownerDocument),
            $window = $(window),
            menuElevatorTop = 0,
            menuElevatorBottom = $menuElevator.height(),
            menuElevatorLastScrollTop = $window.scrollTop(),
            menuElevatorIsFixed = false;

        function animateMenuElevator(scrollTop, viewportHeight) {
            var scrollBottom = scrollTop + viewportHeight;

            if (scrollTop > menuElevatorLastScrollTop) {
                // going down, check if need to detach from top or fix on bottom
                if (menuElevatorIsFixed && scrollBottom > menuElevatorBottom) {
                    // compute triggers for top and bottom
                    menuElevatorTop = menuElevatorLastScrollTop;
                    menuElevatorBottom = menuElevatorTop + $menuElevator.height();
                    menuElevatorIsFixed = false;

                    // detach and position
                    $menuElevator.css({
                        position: 'absolute',
                        top: menuElevatorTop,
                        bottom: 'auto'
                    });
                } else if (scrollBottom > menuElevatorBottom) {
                    // reset the triggers to stop fixing
                    menuElevatorTop = Number.POSITIVE_INFINITY;
                    menuElevatorBottom = Number.POSITIVE_INFINITY;
                    menuElevatorIsFixed = true;
                    $menuElevator.css({
                        position: 'fixed',
                        top: 'auto',
                        bottom: 0
                    });
                }
            } else if (scrollTop < menuElevatorLastScrollTop) {
                // going up, check if need to detach from bottom or fix on top
                if (menuElevatorIsFixed && scrollBottom < menuElevatorBottom) {
                    // compute triggers for top and bottom
                    menuElevatorBottom = menuElevatorLastScrollTop + viewportHeight;
                    menuElevatorTop = menuElevatorBottom - $menuElevator.height();
                    menuElevatorIsFixed = false;

                    // detach and position
                    $menuElevator.css({
                        position: 'absolute',
                        top: menuElevatorTop,
                        bottom: 'auto'
                    });
                } else if (scrollTop < menuElevatorTop) {
                    // reset the triggers to stop fixing
                    menuElevatorTop = 0;
                    menuElevatorBottom = 0;
                    menuElevatorIsFixed = true;
                    $menuElevator.css({
                        position: 'fixed',
                        top: 0,
                        bottom: 'auto'
                    });
                }
            }

            menuElevatorLastScrollTop = scrollTop;
        }

        $document.on('scroll', function () {
            animateMenuElevator($document.scrollTop(), $window.height());
        });

        return this;
    }

}(jQuery))
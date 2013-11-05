/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    var CONTENT_URL_PREFIX = '/out/posts/',
        CONTENT_URL_SUFFIX = '.html',
        MOUSEWHEEL_INERTIA_DELAY = 100;

    function Article(slug) {
        this.gestureBlockedUntilTime = 0;
        this.scrollBackAmount = 0; // [-1..1], negative is on top, positive on bottom

        this.onMouseWheel = this.onMouseWheel.bind(this);

        this.content = $.ajax({
            url: CONTENT_URL_PREFIX + slug + CONTENT_URL_SUFFIX,
            dataType: 'html' // todo: may not be needed
        });

        $(document).on('mousewheel', this.onMouseWheel);
    }

    Article.prototype.destroy = function () {
        window.clearTimeout(this.testTimeoutId);

        $(document).off('mousewheel', this.onMouseWheel);

        $(this).trigger('destroyed');
    };

    Article.prototype.onMouseWheel = function (e) {
        var scrollBackDelta = -e.originalEvent.wheelDeltaY * 0.003, // hardware delta is more than pixel speed
            currentTime = new Date().getTime(),

            scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            bodyHeight = $(document).height();

        if (this.scrollBackAmount < 0) {
            e.preventDefault();

            this.scrollBackAmount = Math.max(-1, this.scrollBackAmount + scrollBackDelta);

            if (this.scrollBackAmount >= 0) {
                this.scrollBackAmount = 0;
                this.gestureBlockedUntilTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;

                $(this).trigger('returnedAbove');
            } else {
                $(this).trigger('scrolledAbove');
            }
        } else if (this.scrollBackAmount > 0) {
            e.preventDefault();

            this.scrollBackAmount = Math.min(1, this.scrollBackAmount + scrollBackDelta);

            if (this.scrollBackAmount <= 0) {
                this.scrollBackAmount = 0;
                this.gestureBlockedUntilTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;

                $(this).trigger('returnedBelow');
            } else {
                $(this).trigger('scrolledBelow');
            }
        } else {
            // extra wait until existing mouse wheel inertia dies down
            if (this.gestureBlockedUntilTime > currentTime) {
                this.gestureBlockedUntilTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;
                return;
            }

            // check for gesture start
            if (scrollTop <= 0 && scrollBackDelta < 0) {
                e.preventDefault();

                this.scrollBackAmount += Math.max(-1, scrollBackDelta);

                $(this).trigger('scrolledAbove');
            } else if (scrollTop + scrollHeight >= bodyHeight && scrollBackDelta > 0) {
                e.preventDefault();

                this.scrollBackAmount += Math.min(1, scrollBackDelta);

                $(this).trigger('scrolledBelow');
            } else {
                // otherwise, prevent acting until mouse wheel inertia dies down
                this.gestureBlockedUntilTime = currentTime + MOUSEWHEEL_INERTIA_DELAY;
            }
        }
    };

    return Article;
});

/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    var CONTENT_URL_PREFIX = '/posts/',
        MOUSEWHEEL_INERTIA_DELAY = 100;

    function Article(slug) {
        var content = $.Deferred(),
            contentUrl = CONTENT_URL_PREFIX + slug;

        this.gestureBlockedUntilTime = 0;
        this.scrollBackAmount = 0; // [-1..1], negative is on top, positive on bottom

        content.promise(this);

        this.testTimeoutId = window.setTimeout(function () {
            content.resolve('<h1>Article from: ' + slug + '</h1><p>Lorem ipsum Magna eiusmod reprehenderit id tempor ad id elit esse fugiat id tempor nostrud id dolore ullamco est Excepteur proident non tempor sunt adipisicing fugiat nisi officia ullamco eu nostrud occaecat cillum mollit Excepteur cillum occaecat do Excepteur ut ad ut ut ad esse ut quis proident quis pariatur eu est mollit dolor et Ut Excepteur ullamco dolore minim in incididunt culpa incididunt occaecat esse commodo est nulla aute amet proident eiusmod magna do amet ut reprehenderit adipisicing sit aliquip veniam aliquip cupidatat Ut tempor consectetur et dolor officia eiusmod aute id ex ad dolor do consequat est nulla in adipisicing eu mollit Excepteur quis Ut adipisicing in mollit exercitation sunt deserunt irure labore deserunt pariatur irure aute eiusmod nisi irure qui dolore in occaecat in ea nostrud ut nostrud in aliqua in irure culpa ex reprehenderit fugiat dolor ullamco Ut in consequat reprehenderit dolore deserunt sint adipisicing quis ex eiusmod magna sunt cillum enim proident id sunt elit amet anim labore quis labore elit ad et officia.</p>');
        }.bind(this), 500);

        $(document).on('mousewheel', this.onMouseWheel.bind(this));
    }

    Article.prototype.destroy = function () {
        window.clearTimeout(this.testTimeoutId);

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

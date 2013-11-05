/*global define */

define([
    'jquery'
], function ($) {
    'use strict';

    function Renderer(app) {
        var tileId;

        this.app = app;

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo('#content').css({
            position: 'relative'
        });

        this.$content = $('<div class="article"></div>').appendTo('#content');

        this.updateGridViewport();

        var refreshLayout = (function () {
            this.app.tileField.doLayout(this.$content.width());
        }).bind(this);

        refreshLayout();

        for (tileId in this.app.tileField.tileMap) {
            this.createTile(tileId, this.app.tileField.tileMap[tileId]);
        }

        // todo: debounce
        $(window).on('resize', refreshLayout);
        $(window).on('scroll', this.onScroll.bind(this));
        $(this.app).on('navigated', this.onPageChange.bind(this));
    }

    Renderer.prototype.createTile = function (tileId, tile) {
        var $li = $('<li></li>').appendTo(this.$grid),
            isRevealed = false,
            checkReveal;

        $('<a href=""></a>').attr('href', tileId).appendTo($li).html(tile.html);

        $li.css({
            position: 'absolute',
            transition: 'top 1s, left 1s, opacity 1.5s',
            opacity: 0,
            left: tile.x,
            top: tile.y
        });

        $(tile).on('moved', function () {
            $li.css({
                left: tile.x,
                top: tile.y
            });

            checkReveal();
        }.bind(this));

        checkReveal = function () {
            if (isRevealed) {
                return;
            }

            if (tile.y + tile.height > this.gridViewportTop && tile.y < this.gridViewportBottom) {
                isRevealed = true;

                $li.css({
                    opacity: 1
                });
            }
        }.bind(this);

        checkReveal();

        $(this).on('viewport', checkReveal);
    };

    Renderer.prototype.updateGridViewport = function () {
        var scrollTop = $(window).scrollTop(),
            scrollHeight = $(window).height(),
            gridOffset = this.$grid.offset();

        this.gridViewportTop = scrollTop - gridOffset.top;
        this.gridViewportBottom = scrollTop + scrollHeight - gridOffset.top;
    };

    Renderer.prototype.onPageChange = function () {
        if (this.app.currentArticle) {
            console.log('article view');

            this.$grid.hide();

            this.app.currentArticle.done(function (html) {
                this.$content.html(html);
            }.bind(this));

            $(this.app.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        } else {
            console.log('tile view');
            this.$grid.show();
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
        this.$content.empty();
    };

    Renderer.prototype.onScroll = function () {
        this.updateGridViewport();

        $(this).trigger('viewport');
    };

    return Renderer;
});

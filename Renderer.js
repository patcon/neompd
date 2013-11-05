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

        var refreshLayout = (function () {
            this.app.tileField.doLayout(this.$content.width());
        }).bind(this);

        for (tileId in this.app.tileField.tileMap) {
            this.createTile(tileId, this.app.tileField.tileMap[tileId]);
        }

        refreshLayout(); // @todo run before creating tiles

        // todo: debounce
        $(window).on('resize', refreshLayout);
        $(this.app).on('navigated', this.onPageChange.bind(this));
    }

    Renderer.prototype.createTile = function (tileId, tile) {
        var $li = $('<li></li>').appendTo(this.$grid);

        $('<a href=""></a>').attr('href', tileId).appendTo($li).html(tile.html);

        $li.css({
            position: 'absolute',
            transition: 'top 1s, left 1s',
            left: tile.x,
            top: tile.y
        });

        $(tile).on('moved', function () {
            $li.css({
                left: tile.x,
                top: tile.y
            });
        }.bind(this));
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

    return Renderer;
});

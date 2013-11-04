/*global define */

define([
    'jquery',
    "./TileLayout"
], function ($, TileLayout) {
    'use strict';

    function Renderer(application) {
        var tileId, $li, tileDims = {};

        this.application = application;

        this.$grid = $('<ul class="tile-grid"></ul>').appendTo('#content').css({
            position: 'relative'
        });

        this.$content = $('<div class="article"></div>').appendTo('#content');

        this.$tiles = {};

        for (tileId in this.application.articles) {
            $li = $('<li></li>').appendTo(this.$grid);
            $('<a href=""></a>').attr('href', tileId).appendTo($li).html(this.application.articles[tileId]);

            tileDims[tileId] = {
                width: $li.outerWidth(true),
                height: $li.outerHeight(true)
            };

            this.$tiles[tileId] = $li;
        }

        this.layout = new TileLayout(tileDims);

        var refreshLayout = (function () {
            this.layout.doLayout(this.$content.width(), this.setTilePosition.bind(this));
        }).bind(this);

        refreshLayout(this);

        // todo: debounce
        $(window).on("resize", refreshLayout);

        // initial render
        this.onPageChange();

        $(this.application).on('navigated', this.onPageChange.bind(this));
    }

    Renderer.prototype.onPageChange = function () {
        if (this.application.currentArticle) {
            console.log('article view');

            this.$grid.hide();

            this.application.currentArticle.done(function (html) {
                this.$content.html(html);
            }.bind(this));

            $(this.application.currentArticle).one('destroyed', this.onArticleDestroyed.bind(this));
        } else {
            console.log('tile view');
            this.$grid.show();
        }
    };

    Renderer.prototype.onArticleDestroyed = function () {
        console.log('article destroyed');
        this.$content.empty();
    };

    Renderer.prototype.setTilePosition = function (tileId, x, y) {
        this.$tiles[tileId].css({
            position: 'absolute',
            left: x,
            top: y
        });
    };

    return Renderer;
});

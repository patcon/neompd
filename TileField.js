define([ 'jquery' ], function ($) {
    'use strict';

    function TileField(articleMap) {
        var href,
            $li,
            $stage = $('<ul class="tile-grid"></ul>').appendTo('#content').css({ position: 'absolute', left: -9999 });

        this.tileMap = {};

        for (href in articleMap) {
            $li = $('<li><a href=""></a></li>').appendTo($stage);
            $li.find('a').html(articleMap[href]);

            this.tileMap[href] = {
                x: 0,
                y: 0,
                width: $li.outerWidth(true),
                height: $li.outerHeight(true),
                html: articleMap[href]
            };
        }

        $stage.remove();
    }

    TileField.prototype.doLayout = function (containerWidth) {
        var tileId,
            gridWidth = Number.MAX_VALUE,
            gridMax,
            columns = [],
            x,
            shortestColumn;

        for (tileId in this.tileMap) {
            gridWidth = Math.min(gridWidth, this.tileMap[tileId].width);
        }

        // todo: what to do when containerWidth < gridWidth -- or don't allow it
        for (x = 0, gridMax = containerWidth - gridWidth; x < gridMax; x += gridWidth) {
            columns.push({
                x: x,
                height: 0
            })
        }

        // todo: bail out if # columns hasn't changed? -- but needs knowledge of why doLayout is triggered

        for (tileId in this.tileMap) {
            shortestColumn = null;

            columns.forEach(function (column) {
                if (!shortestColumn || column.height < shortestColumn.height) {
                    shortestColumn = column;
                }
            });

            this.setTilePosition(tileId, shortestColumn.x, shortestColumn.height);

            shortestColumn.height += this.tileMap[tileId].height;
        }
    };

    TileField.prototype.setTilePosition = function (tileId, x, y) {
        var tile = this.tileMap[tileId];

        if (tile.x !== x || tile.y !== y) {
            tile.x = x;
            tile.y = y;

            $(tile).trigger('moved');
        }
    }

    return TileField;
});
define([ 'jquery' ], function ($) {
    'use strict';

    function TileField(tileMap) {
        var tileId,
            $li,
            $stage = $('<ul class="tile-grid"></ul>').appendTo('#content').css({ position: 'absolute', left: -9999 });

        this.tileMap = {};
        this.height = 0;
        this.columnWidth = Number.MAX_VALUE;

        for (tileId in tileMap) {
            $li = $('<li></li>').appendTo($stage);
            $li.html(tileMap[tileId]);

            this.tileMap[tileId] = {
                x: 0,
                y: 0,
                width: $li.outerWidth(true),
                height: $li.outerHeight(true),
                html: tileMap[tileId]
            };
        }

        $stage.remove();

        for (tileId in this.tileMap) {
            this.columnWidth = Math.min(this.columnWidth, this.tileMap[tileId].width);
        }
    }

    TileField.prototype.doLayout = function (containerWidth) {
        var tileId,
            originalHeight = this.height,
            gridMax,
            columns = [],
            x, i, length, column,
            targetColumn;

        // todo: what to do when containerWidth < columnWidth -- or don't allow it
        for (x = 0, gridMax = containerWidth - this.columnWidth; x < gridMax; x += this.columnWidth) {
            columns.push({
                x: x,
                height: 0
            });
        }

        // todo: bail out if # columns hasn't changed? -- but needs knowledge of why doLayout is triggered

        for (tileId in this.tileMap) {
            targetColumn = null;

            for (i = 0, length = columns.length; i < length; i++) {
                column = columns[i];

                if ((!targetColumn || column.height < targetColumn.height) && 1) {
                    targetColumn = column;
                }
            }

            this.setTilePosition(tileId, targetColumn.x, targetColumn.height);

            targetColumn.height += this.tileMap[tileId].height;
        }

        // sort columns by height and use tallest as total field height
        columns.sort(function (a, b) {
            return b.height - a.height; // descending order
        });

        this.height = columns[0].height;

        if (this.height !== originalHeight) {
            $(this).trigger('changed');
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

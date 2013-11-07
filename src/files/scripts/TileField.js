define([ 'jquery' ], function ($) {
    'use strict';

    function TileField(tileDataMap) {
        var tileId,
            tileData,
            $li,
            $stage = $('<ul class="tile-grid"></ul>').appendTo('#content').css({ position: 'absolute', left: -9999 });

        this.tileMap = {};
        this.height = 0;
        this.columnCount = null;
        this.columnWidth = Number.MAX_VALUE;

        for (tileId in tileDataMap) {
            tileData = tileDataMap[tileId];

            $li = $('<li></li>').appendTo($stage);
            $li.html(tileData.html);

            this.tileMap[tileId] = {
                x: 0,
                y: 0,
                width: $li.outerWidth(true),
                height: $li.outerHeight(true),
                html: tileData.html
            };

            $li.remove(); // remove immediately to avoid stretching width
        }

        $stage.remove();

        for (tileId in this.tileMap) {
            this.columnWidth = Math.min(this.columnWidth, this.tileMap[tileId].width);
        }
    }

    TileField.prototype.setContainerWidth = function (containerWidth) {
        var columnCount = Math.min(1, Math.floor(containerWidth / this.columnWidth));

        // avoid relayout if same number of columns
        if (this.columnCount !== columnCount) {
            this.columnCount = columnCount;
            this.performLayout();
        }
    };

    TileField.prototype.performLayout = function (containerWidth) {
        var tileId, tile,
            originalHeight = this.height,
            columns = [],
            colIndex, colWidth, i, top,
            minColIndex, minTop;

        for (i = 0; i < this.currentColumnCount; i += 1) {
            columns.push(0);
        }

        for (tileId in this.tileMap) {
            tile = this.tileMap[tileId];
            colWidth = Math.ceil(tile.width / this.columnWidth);

            minColIndex = 0;
            minTop = Number.POSITIVE_INFINITY;

            for (colIndex = 0; colIndex <= columns.length - colWidth; colIndex += 1) {
                top = 0;

                for (i = 0; i < colWidth; i += 1) {
                    top = Math.max(top, columns[colIndex + i]);
                }

                if (top < minTop) {
                    minColIndex = colIndex;
                    minTop = top;
                }
            }

            for (i = 0; i < colWidth; i += 1) {
                columns[minColIndex + i] = minTop + tile.height;
            }

            this.setTilePosition(tileId, minColIndex * this.columnWidth, minTop);
        }

        // sort columns by height and use tallest as total field height
        columns.sort();

        this.columnCount = columns.length;
        this.height = columns[columns.length - 1];

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
    };

    return TileField;
});

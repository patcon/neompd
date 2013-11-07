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

            $li.remove(); // remove immediately to avoid stretching width
        }

        $stage.remove();

        for (tileId in this.tileMap) {
            this.columnWidth = Math.min(this.columnWidth, this.tileMap[tileId].width);
        }
    }

    TileField.prototype.doLayout = function (containerWidth) {
        var tileId, tile,
            originalHeight = this.height,
            columns = [],
            colIndex, colWidth, i, top,
            minColIndex, minTop;

        containerWidth = Math.max(this.columnWidth, containerWidth); // minimum one column
        while (containerWidth >= this.columnWidth) {
            containerWidth -= this.columnWidth;
            columns.push(0);
        }

        // todo: bail out if # columns hasn't changed? -- but needs knowledge of why doLayout is triggered

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

            console.log(columns, colWidth, tile.width)
        }

        // sort columns by height and use tallest as total field height
        columns.sort();

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
    }

    return TileField;
});

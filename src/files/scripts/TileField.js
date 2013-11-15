define([ 'jquery' ], function ($) {
    'use strict';

    function TileField(tileDataMap) {
        var tileId,
            tileData,
            tileTagSet,
            maxTileWidth,
            i,
            $li,
            $stage = $('<ul class="tile-grid"></ul>').appendTo('#content').css({ position: 'absolute', left: -9999 });

        this.filterTag = null;
        this.columnCount = null;

        this.tileMap = {};
        this.height = 0;
        this.columnWidth = Number.MAX_VALUE;
        this.minColumnCount = 1;

        for (tileId in tileDataMap) {
            tileData = tileDataMap[tileId];

            $li = $('<li></li>').appendTo($stage);
            $li.html(tileData.html);

            tileTagSet = {};
            for (i = 0; i < tileData.tags.length; i++) {
                tileTagSet[tileData.tags[i]] = true;
            }

            this.tileMap[tileId] = {
                x: 0,
                y: 0,
                width: $li.outerWidth(true),
                height: $li.outerHeight(true),
                tagSet: tileTagSet,
                html: tileData.html
            };

            $li.remove(); // remove immediately to avoid stretching width
        }

        $stage.remove();

        maxTileWidth = 0;
        for (tileId in this.tileMap) {
            this.columnWidth = Math.min(this.columnWidth, this.tileMap[tileId].width);
            maxTileWidth = Math.max(maxTileWidth, this.tileMap[tileId].width);
        }

        // ensure a number of columns that will fit all our tiles
        this.minColumnCount = Math.ceil(maxTileWidth / this.columnWidth);
    }

    TileField.prototype.setFilterTag = function (tag) {
        // avoid relayout if same filter
        if (this.filterTag !== tag) {
            this.filterTag = tag;
            this.performLayout();
        }
    };

    TileField.prototype.setContainerWidth = function (containerWidth) {
        var columnCount = Math.max(this.minColumnCount, Math.floor(containerWidth / this.columnWidth));

        // avoid relayout if same number of columns
        if (this.columnCount !== columnCount) {
            this.columnCount = columnCount;
            this.performLayout();
        }
    };

    TileField.prototype.performLayout = function () {
        var tileId, tile,
            originalHeight = this.height,
            columns = [],
            colIndex, colWidth, i, top,
            minColIndex, minTop;

        // ignore layout if width is unknown
        if (this.columnCount === null) {
            return;
        }

        for (i = 0; i < this.columnCount; i += 1) {
            columns.push(0);
        }

        for (tileId in this.tileMap) {
            tile = this.tileMap[tileId];

            if (this.filterTag !== null && !tile.tagSet[this.filterTag]) {
                this.setTilePosition(tileId, null, null);

                continue;
            }

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

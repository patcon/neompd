define([], function () {
    'use strict';

    function TileLayout(tiles) {
        this.tiles = tiles;
    }

    TileLayout.prototype.doLayout = function (containerWidth, setPosition) {
        var tileId,
            gridWidth = Number.MAX_VALUE,
            gridMax,
            columns = [],
            x,
            shortestColumn;

        for (tileId in this.tiles) {
            gridWidth = Math.min(gridWidth, this.tiles[tileId].width);
        }

        // todo: what to do when containerWidth < gridWidth -- or don't allow it
        for (x = 0, gridMax = containerWidth - gridWidth; x < gridMax; x += gridWidth) {
            columns.push({
                x: x,
                height: 0
            })
        }

        // todo: bail out if # columns hasn't changed? -- but needs knowledge of why doLayout is triggered

        for (tileId in this.tiles) {
            shortestColumn = null;

            columns.forEach(function (column) {
                if (!shortestColumn || column.height < shortestColumn.height) {
                    shortestColumn = column;
                }
            });

            setPosition(tileId, shortestColumn.x, shortestColumn.height);

            shortestColumn.height += this.tiles[tileId].height;
        }
    };

    return TileLayout;
});

define([], function () {
    'use strict';

    function TileLayout(tiles) {
    	this.tiles = tiles;
    }

    TileLayout.prototype.doLayout = function (containerWidth, setPosition) {
    	var x = 0;

    	for (var n in this.tiles) {
    		setPosition(n, x, 0);
    		x += this.tiles[n].width;
    	}
    };

    return TileLayout;
});
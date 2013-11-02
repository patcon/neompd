/*global define, $ */

define([], function () {
    'use strict';

    function TileFieldView(tileSet) {
        var n, $li;

        this.$grid = $('<div class="tile-grid"></div>').appendTo('#content');

        for (n in tileSet) {
            $li = $('<li></li>').appendTo(this.$grid);
            $('<a href=""></a>').attr('href', n).appendTo($li).html(tileSet[n]);
        }
    }

    return TileFieldView;
});
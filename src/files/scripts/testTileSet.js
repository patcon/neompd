/*global define */

define(['jquery'], function ($) {
    'use strict';

    var articleMap = {},
        id = 0;

    $("#data li").each(function () {
        var $li = $(this);

        articleMap[id++] = {
            tag: $li.children('a').attr('data-tag'),
            html: $li.html()
        };
    });

    return articleMap;
});

/*global define */

define(['jquery'], function ($) {
    'use strict';

    var articleMap = {},
        id = 0;

    $("#data li").each(function () {
        var $li = $(this),
            tags;

        try {
            tags = JSON.parse($li.children('a').attr('data-tags'));
        } catch (e) {
            tags = [];
        }

        articleMap[id++] = {
            tags: tags,
            html: $li.html()
        };
    });

    return articleMap;
});

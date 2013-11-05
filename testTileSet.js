/*global define */

define(['jquery'], function ($) {
    'use strict';

    var articleMap = {},
        id = 0;

    $("#data li").each(function () {
        var $li = $(this);

        articleMap[id++] = $li.html().replace(/\/images\//g, '/out/images/');
    });

    return articleMap;
});

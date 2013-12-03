/*global define */

var $ = require('../vendor/jquery/jquery.js');

    'use strict';

    var articleMap = {},
        id = 0;

    $("#data li").each(function () {
        var $li = $(this),
            tags;

        try {
            tags = JSON.parse($li.attr('data-tags'));
        } catch (e) {
            tags = [];
        }

        articleMap[id++] = {
            tags: tags,
            html: $li.html()
        };
    });

    $("#data").remove();

module.exports = articleMap;

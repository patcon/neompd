/*jslint nomen: true */
/*globals require, app, console, __dirname */
(function () {
    'use strict';
   
    var express = require('express'),
        app = express(),
        ROOT = '../';

    app.configure(function () {
        app.set("view options", {layout: false});
        app.engine('html', require('ejs').renderFile);
        app.use('/styles', express.static(__dirname + '/styles'));
        app.use('/scripts', express.static(__dirname + '/scripts'));
        app.use('/images', express.static(__dirname + '/images'));
        // app.use('/articles', express.static(__dirname + '/articles'));
        app.use('/fonts', express.static(__dirname + '/fonts'));
        // app.use(express.basicAuth('mpd', 'savvis123'));

        app.get('/', function (req, res) {
            res.render(__dirname + '/index.html');
        });

    });

    app.get('/articles/:filename', function(req, res) {
        setTimeout(function() {
            res.render(__dirname + '/articles/' + req.params.filename);
        }, 1000);
    })

    app.listen(3333);
    console.log("Server listening on port 3333");
}());

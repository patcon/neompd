'use strict';

var webdriver = require('wd'),
    http = require('http'),
    StaticServer = require('node-static').Server;

function createBrowser(callback) {
    var browser = webdriver.remote(process.env.WEBDRIVER_URL);

    browser.on('status', function(info) {
        console.log('\x1b[36m%s\x1b[0m', info);
    });

    browser.on('command', function(meth, path) {
        console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
    });

    browser.init({
        browserName: 'chrome',
        platform: 'Mac 10.6'
    }, function (err) {
        if (err) {
            throw 'WD init error: ' + err;
        }

        callback(browser);
    });
}

module.exports = function () {
    this.Around(function (runScenario) {
        var server = new StaticServer('./out'),
            httpServer = http.createServer(function (request, response) {
                server.serve(request, response, function (err, res) {
                    if (err) { // An error as occured
                        console.error("> Error serving " + request.url + " - " + err.message);
                        response.writeHead(err.status, err.headers);
                        response.end();
                    }
                });
            });

        httpServer.listen(8098, function () {
            this.rootUrlPrefix = 'http://localhost:8098';

            runScenario(function (callback) {
                httpServer.close();

                callback();
            });
        }.bind(this));
    });

    this.Around(function (runScenario) {
        createBrowser(function (wdBrowser) {
            this.browser = wdBrowser;

            runScenario(function (callback) {
                wdBrowser.quit(function () {
                    callback();
                });
            });
        }.bind(this));
    });
};

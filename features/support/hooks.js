'use strict';

var webdriver = require('wd');

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
        this.rootUrlPrefix = 'http://neo.mpdagile.com'; // @todo initialize HTTP server, etc

        runScenario(function (callback) {
            // @todo teardown server
            callback();
        });
    });

    this.Around(function (runScenario) {
        createBrowser(function (wdBrowser) {
            this.browser = wdBrowser;

            runScenario(function (callback) {
                wdBrowser.quit();

                callback();
            });
        }.bind(this));
    });
};

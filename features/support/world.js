'use strict';

module.exports.World = function (callback) {
    this.visit = function (url, callback) {
        this.browser.get(this.rootUrlPrefix + url, function (err) {
            if (err) {
                throw 'error visiting: ' + err;
            }

            callback();
        });
    };

    callback();
};

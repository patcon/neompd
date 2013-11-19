var phantom = require("phantom");

module.exports = function () {
    this.Before = function (callback) {
    	console.log("NBEFORE NFOER");
        var world = this;

        phantom.create(function (ph) {
            world.ph = ph;

            ph.createPage(function (page) {
                world.page = page;
                callback();
            });
        });
    };

    this.After = function (callback) {
    	this.ph.exit();
    	callback();
    };
};

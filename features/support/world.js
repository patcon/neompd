module.exports.World = function (callback) {
    this.visit = function (url, callback) {
        this.page.open(url, function (status) {
            // todo: check status
            callback();
        });
    };

    callback();
};

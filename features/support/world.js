exports.World = function (callback) {
    this.visit = function (url, callback) {
        callback.pending();
    };

    callback();
};

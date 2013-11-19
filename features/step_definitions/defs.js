module.exports = function () {
    this.World = require("../support/world.js").World;

    this.Given("I'm on the home page", function (callback) {
        this.visit("/", callback);
    });

    this.When("I click on an article title", function (callback) {
        callback.pending();
    });

    this.Then("I should see the article", function (callback) {
        callback.pending();
    });
};

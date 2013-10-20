window.Router = Backbone.Router.extend({
    routes: {
        '': 'index',
        'tags/:tag': 'tag',
        'tags/:tag/:article': 'article'
    },

    index: function() {
        var self = this;

        setTimeout(function() {
            self.once('route', function() {
            });
        }, 0);
    },

    tag: function(tag) {
        var self = this;

        setTimeout(function() {
            self.once('route', function() {
            });
        }, 0);
    },

    article: function(tag, article) {
        var self = this;

        setTimeout(function() {
            self.once('route', function() {
            });
        }, 0);
    }
});
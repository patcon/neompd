
window.Router = Backbone.Router.extend({
    routes: {
        '': 'index',
        'tags/:tag': 'tag',
        'article/:article': 'article'
    },

    index: function() {
        var view = new TagView({ model: { id: null } });

        setTimeout(_.bind(function() {
            this.once('route', function() {
                view.destroy();
            });
        }, this), 0);
    },

    tag: function(tag) {
        var view = new TagView({ model: { id: tag } });

        setTimeout(_.bind(function() {
            this.once('route', function() {
                view.destroy();
            });
        }, this), 0);
    },

    article: function(article) {
        var view = new ArticleView({ model: { id: article } });

        setTimeout(_.bind(function() {
            this.once('route', function() {
                view.destroy();
            });
        }, this), 0);
    }
});

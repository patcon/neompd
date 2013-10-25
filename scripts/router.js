window.Router = Backbone.Router.extend({
    routes: {
        '': 'index',
        'tags/:tag': 'tag',
        'tags/:tag/:article': 'article'
    },

    index: function() {
        if (this.view) {
            this.view.destroy();
        }

        this.view = new TagView();
    },

    tag: function(tag) {
        if (this.view) {
            this.view.destroy();
        }

        this.view = new TagView();
    },

    article: function(tag, article) {
        if (this.view) {
            this.view.destroy();
        }

        this.view = new ArticleView({ model: { id: article, tag: tag } });
    }
});

window.TagView = Backbone.View.extend({
    initialize: function () {
    	console.log('tag init', this.model.id);
    },

    destroy: function () {
    	console.log('tag destroy');
    }
});

define([ 'jquery'], function ($) {
	return {
		load: function (fonts) {
			var $fonts = $('<div/>')
				.css({
					position: 'absolute',
					left: -9999,
					fontSize: 100
				})
				.appendTo($('body'));

			var loading = fonts.map(function (font) {
				var loading = $.Deferred(),
					$el = $('<span>probe</span>').appendTo($fonts),
					width = $el.width();
				
				function probe() {
					if (width === $el.width()) {
						window.setTimeout(probe, 100); // todo: add timeout
					} else {
						loading.resolve();
					}
				}

				$el.css({
					fontFamily: font
				});

				probe();

				return loading.promise();
			});

			return $.when.apply($, loading);
		}
	};
});
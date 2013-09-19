(function($) {
	'use strict';
	if (typeof document !== 'undefined' && ('classList' in document.createElement('a'))) {
		jQuery.fn.hasClass = function(selector) {
			var elem, i, l;
			for (i = 0, l = this.length ; i < l; ++i) {
				elem = this[i];
				if (elem.nodeType === 1 && elem.classList.contains(selector)) {
					return true;
				}
			}
			return false;
		};
		jQuery.fn.addClass = function(value) {
			var elem, i, l, values, len;
			for (i = 0, l = this.length; i < l; ++i) {
				elem = this[i];
				if (elem.nodeType === 1) {
					values = value.split(' ');
					len = values.length;
					while(len--) {
						elem.classList.add(values[len]);
					}
				}
			}
			return this;
		};
		jQuery.fn.removeClass = function(value) {
			var elem, i, l, values, len;
			for (i = 0, l = this.length; i < l; ++i) {
				elem = this[i];
				if (elem.nodeType === 1) {
					values = value.split(' ');
					len = values.length;
					while(len--) {
						elem.classList.remove(values[len]);
					}
				}
			}
			return this;
		};
	}
})(jQuery);
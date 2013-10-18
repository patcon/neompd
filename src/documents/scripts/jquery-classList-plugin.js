(function($) {
	'use strict';

	if (document.body.hasOwnProperty('classList')) {
		var plugin = jQuery.fn,
			css = plugin.css,
			add = DOMTokenList.prototype.add,
			remove = DOMTokenList.prototype.remove,
			prefix = document.body.style.hasOwnProperty('webkitTransform') ? 'webkit' : 'moz',
			elem,
			i,
			length,
			multi;

		plugin.hasClass = function(selector) {
			length = this.length;
			for (i = 0; i < length; i++) {
				if ((elem = this[i]).nodeType === 1 && elem.classList.contains(selector)) {
					return true;
				}
			}
			return false;
		};

		plugin.addClass = function(value) {
			if(length = this.length) {
				if(multi = value.indexOf(' ') > -1) {
					value = value.trim().split(' ');
				}

				for (i = 0; i < length; i++) {
					if ((elem = this[i]).nodeType === 1) {
						if(multi) {
							add.apply(elem.classList, value);
						} else {
							elem.classList.add(value);
						}
					}
				}
			}
			return this;
		};

		plugin.removeClass = function(value) {
			if(length = this.length) {
				if(multi = value.indexOf(' ') > -1) {
					value = value.trim().split(' ');
				}

				for (i = 0; i < length; i++) {
					if ((elem = this[i]).nodeType === 1) {
						if(multi) {
							remove.apply(elem.classList, value);
						} else {
							elem.classList.remove(value);
						}
					}
				}
			}
			return this;
		};

		plugin.css = function(attr, val) {
			var t;
			if(attr === 'transform' && ((t = typeof val) === 'undefined' || t === 'function')) {
				if(length = this.length) {
					for (i = 0; i < length; i++) {
						elem = this[i];
						if(val) {
							elem.style[prefix + 'Transform'] = val.call(elem, i, elem.style[prefix + 'Transform']);
						} else {
							return elem.style[prefix + 'Transform'];
						}
					}
				}
				return this;
			} else {
				return css.apply(this, arguments);
			}
		};

	}
}(jQuery));
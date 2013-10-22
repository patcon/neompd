(function($) {
	'use strict';

	if (document.body.hasOwnProperty('classList')) {
		var plugin = jQuery.fn,
			css = plugin.css,
			add = DOMTokenList.prototype.add,
			remove = DOMTokenList.prototype.remove,
			transformProp = document.body.style.hasOwnProperty('webkitTransform') ? 'webkitTransform' : 'mozTransform',
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
			var t,
				useFn;
			if(!(length = this.length)) {
				return this;
			}
			if(attr === 'transform' && ((t = typeof val) === 'undefined' || (useFn = t === 'function'))) {
				for (i = 0; i < length; i++) {
					elem = this[i];
					if(useFn === true) {
						elem.style[transformProp] = val.call(elem, i, elem.style[transformProp]);
					} else {
						return elem.style[transformProp];
					}
				}
				return this;
			} else {
				return css.apply(this, arguments);
			}
		};

	}
}(jQuery));
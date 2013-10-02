(function($) {
	'use strict';

	if (document.body.hasOwnProperty('classList')) {
		var plugin = jQuery.fn,
			add = DOMTokenList.prototype.add,
			remove = DOMTokenList.prototype.remove,
			elem,
			i
			length;

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
			length = this.length;
			for (i = 0; i < length; i++) {
				if ((elem = this[i]).nodeType === 1) {
					if(value.indexOf(' ') > -1) {
						add.apply(elem.classList, value.split(' '));
					} else {
						elem.classList.add(value);
					}
				}
			}
			return this;
		};

		plugin.removeClass = function(value) {
			length = this.length;
			for (i = 0; i < length; i++) {
				if ((elem = this[i]).nodeType === 1) {
					if(value.indexOf(' ') > -1) {
						remove.apply(elem.classList, value.split(' '));
					} else {
						elem.classList.remove(value);
					}
				}
			}
			return this;
		};

	}
}(jQuery));
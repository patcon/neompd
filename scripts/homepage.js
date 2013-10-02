var Homepage = (function homepage(defaultVals) {
	'use strict';

	var $window = $(window),
		$doc = $(document),
		$body = $(document.body),
		$container = $body.find('#grid'),
		$menu = $body.find('#menu'),
		$articleMenu = $body.find('#articleMenu'),
		$menuLines = $body.find('#lines'),
		$searchBox = $body.find('#searchBox'),
		winHeight = $window.height(),
		MATRIX_REGEX = /(-?\d+)/g,
		MATRIX_X = 4,
		MATRIX_Y = 5,
		SOON = 50,
		SOONER = 5,
		ASAP = 0,
		PADDING = 10,
		SCROLL_TIMEOUT_LEN = 300,
		LOADING_Y_OFFSET = defaultVals.LOADING_Y_OFFSET,
		ANIMATION_THRESHOLD = 15,
		ANIMATION_EL_THRESHOLD = 3,
		firstScrollEvent = true,
		scrollTimeout,
		closeArticleTimeout,
		loadAnimTimeout,
		$lower,
		$upper,
		$all = $container.find('li'),
		$hidden = $container.find('li'),
		$animateOnScroll,
		updateScrollAnimation,
		noScrollEvents = true,
		isDoingTransition = false,
		loaded = false,
		resized = true,
		scrollOffset,
		articleHeight = null,
		articleTop,
		upperOffset = 0,
		lowerOffset = 0,
		upperWinOffset = 0,
		lowerWinOffset = 0;

	function getCurTop ($el) {
		return parseInt($el.css('transform').match(MATRIX_REGEX)[MATRIX_Y], 10);
	}

	function isOnScreen ($el, scrollTop, padding) {
		var thisTop = getCurTop($el) + (padding || 0),
			height = $el.height();
		return (thisTop < (scrollTop + winHeight)) && (((thisTop + height) > scrollTop));
	}

	function modifyTransform (offset, hwAccel) {
		return function(i, val) {
			val = val.match(MATRIX_REGEX);

			//return 'translateX(' + val[MATRIX_X] + 'px) translateY(' + (parseInt(val[MATRIX_Y], 10) + offset) + 'px)' + (hwAccel ? 'translateZ(0)' : '');
			return 'translate3d(' + val[MATRIX_X] + 'px, ' + (parseInt(val[MATRIX_Y], 10) + offset) + 'px, 0)';
		};
	}

	function modifyOrigTransform (offset, padding, hwAccel) {
		return function() {
			var val = this.matrix.match(MATRIX_REGEX);

			//return 'translateX(' + val[MATRIX_X] + 'px) translateY(' + ((padding || 0) + parseInt(val[MATRIX_Y], 10) + offset) + 'px)' + (hwAccel ? 'translateZ(0)' : '');
			return 'translate3d(' + val[MATRIX_X] + 'px, ' + ((padding || 0) + parseInt(val[MATRIX_Y], 10) + offset) + 'px, 0)';
		};
	}

	function setTransform (thisVal, hwAccel) {
		return function(i, val) {
			//return 'translateX(' + val.match(MATRIX_REGEX)[MATRIX_X] + 'px) translateY(' + thisVal + 'px)' + (hwAccel ? 'translateZ(0)' : '');
			return 'translate3d(' + val.match(MATRIX_REGEX)[MATRIX_X] + 'px, ' + thisVal + 'px, 0)';
		};
	}

	function closeArticle (scroll, noAnimation, updateScrollbar, scrollTop) {
		var $offScreen,
			styleChangesSetup;

		if((!closeArticleTimeout && !articleHeight) || isDoingTransition) {
			return;
		}
		$offScreen = [];
		scrollTop = scrollTop || window.pageYOffset;

		styleChangesSetup = function() {
			if(!noAnimation) {
				$all.removeClass('offScreen').addClass('closing');
				$menu.removeClass('offScreen hide').addClass('closing');
				noScrollEvents = true;
			} else {
				$menu.add('offScreen');
			}
		};

		if(scroll) {
			scrollOffset = scrollTop - articleTop < 0 ? scrollTop - articleTop : 0;
			$upper.each(function() {
				var $me = $(this);
				if(! isOnScreen($me, scrollTop, articleHeight + scrollOffset)) {
					$offScreen.push(this);
				}
			});

			$lower.each(function() {
				var $me = $(this);
				if(!isOnScreen($me, scrollTop) && !isOnScreen($me, scrollTop, -articleHeight - scrollOffset) && !isOnScreen($me, scrollTop, -lowerOffset - scrollOffset)) {
					$offScreen.push(this);
				}
			});

			styleChangesSetup();
			$($offScreen).addClass('offScreen');
			$upper.css('transform', modifyOrigTransform(articleHeight + scrollOffset, 0, true));
			$lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset, 0, true));

		} else {
			styleChangesSetup();
			$lower.addClass('offScreen').css('transform', modifyOrigTransform(-(lowerOffset * 2) - upperOffset, 0, true));
		}

		$container.find('.shown').removeClass('shown').addClass('visible');//.css('height', '-=' + articleHeight);
		$all.removeClass('offScreen');
		if (scroll) {
			$menu.css('opacity', 1);
		}

		if (updateScrollbar) {
			$window.scrollTop(scrollTop - (lowerOffset * 2) - upperOffset);
		}

		articleHeight = null;
		if (!scroll) {
			setTimeout(function() {
				$menu.css('opacity', 1);
			}, SOON * 2);
		}
	}

	function endTransition(scrollTop, scrollTo) {
		$all.removeClass('onScreen delay').addClass('offScreen');
		$menu.addClass('offScreen hide');
		$lower.css('transform', modifyTransform(articleHeight));
		$upper.css('transform', modifyTransform(scrollTop < upperOffset ? (upperOffset * 2) - scrollTop : upperOffset));
		$container.removeClass('transition');//.css('height', '+=' + articleHeight);

		noScrollEvents = true;
		$window.scrollTop(scrollTo);

		$all.each(function() {
			this.matrix = $(this).css('transform');
		});

		isDoingTransition = false;
		updateScrollAnimation = false;

		setTimeout(function() {
			noScrollEvents = false;
			// Update the height of the grid to remove space occupied by the article
			$("#grid").height($("#grid").height() - articleHeightTemp - Math.min(lowerOffset, lowerWinOffset));
		}, SOON);
	}

	function applyScrollClass() {
		if(isDoingTransition) {
			return setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
		}
		$container.removeClass('scrolling');
		scrollTimeout = null;
	}

	function debouneScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			$container.addClass('scrolling');
		}

		scrollTimeout = setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
	}

	function doLoadAnim(noThreshold) {
		var foundIndex,
			scrollTop =  window.pageYOffset,
			count = 0,
			$toAnim,
			lastFoundIndex;

		$hidden.each(function (i) {
			if((!noThreshold || count < ANIMATION_EL_THRESHOLD) && isOnScreen($(this), scrollTop, -LOADING_Y_OFFSET - ANIMATION_THRESHOLD)) {
				if(count === 0) {
					foundIndex = i;
				}
				count++;
				lastFoundIndex = i;
			} else {
				return count === 0;
			}
		});

		if(foundIndex !== null) {
			$toAnim = ($($hidden.splice(foundIndex, 1 + lastFoundIndex - foundIndex)));
			//setTimeout(function () {
				$toAnim.addClass('shown').removeClass('offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET, true));
				loadAnimTimeout = false;
			//}, SOON * 2 * Math.random());
		} else {
			loadAnimTimeout = false;
		}
	}

	function debounceLoadAnim() {
		if(loadAnimTimeout || !loaded || $hidden.length === 0) {
			return;
		}
		if  (firstScrollEvent) {
			firstScrollEvent = false;
			return doLoadAnim(true);
		}
		loadAnimTimeout = setTimeout(doLoadAnim, SOON * 3 * Math.random());
	}

	function onScroll() {
		var scrollTop;

		if(noScrollEvents) {
			return debouneScrollClassToggling();
		} else if(isDoingTransition) {
			scrollTop = window.pageYOffset;
			return endTransition(scrollTop, scrollTop + lowerOffset);
		}

		scrollTop = window.pageYOffset;
		if (articleHeight !== null) {
			if (scrollTop < articleTop && (scrollTop > articleTop - overhead)) {

				// TODO: get rid of all the $() on the fly to increase performance
				if ($(".short-article").css("position") !== 'fixed') {
					// Put the lower blocks right below the window to start moving up
					if (lowerOffset > winHeight)
						$animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset + lowerWinOffset));

					// Set lorem ipsum as fixed
					$(".short-article").css("position", "fixed").css("top", 0);

				} else {
					// Start fading away the article
					$(".short-article").css("opacity", (1 - Math.abs(articleTop - scrollTop) / overhead).toFixed(4));

					// Start moving up the blocks below the window
					if (lowerOffset > winHeight)
						$animateOnScroll.css('transform', modifyOrigTransform(-(articleTop - scrollTop)/overhead * (lowerWinOffset + overhead), -lowerOffset + lowerWinOffset));
					else
						$animateOnScroll.css('transform', modifyOrigTransform(-(articleTop - scrollTop)/overhead * (lowerOffset + overhead), 0));

					if(menuOpacityTimeout) {
						clearTimeout(menuOpacityTimeout);
					}
					
					$menu.css('opacity', (Math.abs(articleTop - scrollTop) / articleHeight).toFixed(2)).removeClass('hide');
					$articleMenu.addClass('hide');
					updateScrollAnimation = true;

				}

			} else if (scrollTop < articleTop) {
				setTimeout(function() {
					// $animateOnScroll.css('-webkit-transform', modifyOrigTransform(-lowerOffset - overhead));
					closeArticle(false, true, false, window.pageYOffset);
					updateScrollAnimation = false;
				}, ASAP);

			} else if(scrollTop >= articleTop) {
				// Reset article and lower blocks position
				if ($(".short-article").css("position") === 'fixed') {
					$(".short-article").css("position", "absolute").css("top", articleTop);
					$animateOnScroll.css('-webkit-transform', modifyTransform(lowerOffset - lowerWinOffset + overhead));
				}

				if(updateScrollAnimation) {
					$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
					updateScrollAnimation = false;
				} else if(scrollTop < articleTop + articleHeight) {
					$menu.css('opacity', (Math.abs(articleTop - scrollTop) / articleHeight).toFixed(2)).removeClass('hide');
					$articleMenu.addClass('hide');
				} else if((scrollTop > articleTop + (articleHeight * 1.5))) {
					closeArticle(false, true, true, scrollTop);
				}
			}
			else if(updateScrollAnimation) {
				//if(! closeArticleTimeout) {
				//	articleHeight = null;
				//	closeArticleTimeout = setTimeout(function() {
						closeArticle(false, true, false, scrollTop);
						updateScrollAnimation = false;
						//closeArticleTimeout = null;
				//	}, Math.abs(scrollTop - lastScrollTop) > 50 ? SCROLL_TIMEOUT_LEN : 0);
				//}
			}
			//lastScrollTop = scrollTop;
		} else {
			debounceLoadAnim();
			debouneScrollClassToggling();
		}
	}


	function onTransitionEnd(e) {
		var	offset,
			scrollTop,
			$transitioned = $(e.target);

		if(isDoingTransition && $transitioned.hasClass('delay')) {
			return endTransition(window.pageYOffset, articleTop);
		} else if(noScrollEvents && $transitioned.hasClass('closing')) {
			scrollTop = window.pageYOffset;
			offset = -upperOffset -lowerOffset - scrollOffset;
			$all.addClass('offScreen').removeClass('closing').css('transform', modifyTransform(offset)).removeClass('offScreen');
			$articleMenu.addClass('hide');
			$window.scrollTop(scrollTop + offset);
			noScrollEvents = false;
		} else if(!loaded && $container.hasClass('initial')) {
			$hidden.addClass('offScreen');
			noScrollEvents = false;
			$body.css('opacity', 1);
			$container.removeClass('initial');
			doLoadAnim();
			//setTimeout(doLoadAnim, SOON);
			loaded = true;
		} else if(!resized && $transitioned.hasClass('resized')) {
			setTimeout(function() {
				$all.removeClass('onScreen resized').addClass('offScreen').each(function() {
					console.log('a: ' + this.matrix);
					this.matrix = $(this).css('transform');
					console.log('b: ' + this.matrix);
				});
			}, SOON);
			resized = true;
		}
	}

	function onClick(e) {
		var $onScreenUpper,
			$onScreenLower,
			$offScreenUpper,
			$offScreenLower,
			$li,
			li,
			$clicked,
			$oldLi,
			scrollTop,
			offset,
			winOffset;

		if(($clicked = $(e.target)).closest('ul').is($container) && ! $clicked.is($container)) {
			e.preventDefault();
			e.stopPropagation();

			if(articleHeight !== null) {
				return closeArticle(true);
			}

			articleHeight = $(".article").height();

			$li = $oldLi = $clicked.closest('li');
			$onScreenUpper = [];
			$offScreenUpper = [];
			$upper = [];

			isDoingTransition = true;
			scrollTop = window.pageYOffset;
			upperOffset = 0,
			lowerOffset = 0;

			while(($li = $li.prev()).length) {
				li = $li[0];
				if(isOnScreen($li, scrollTop)) {
					offset = getCurTop($li) + $li.outerHeight() - scrollTop + PADDING;
					if(offset > upperOffset) upperOffset = offset;
					$onScreenUpper.push(li);
				}
				else {
					$offScreenUpper.push(li);
				}
				$upper.push(li);
			}

			$li = $oldLi;
			lowerOffset = scrollTop + articleHeight - getCurTop($li) + PADDING;
			lowerWinOffset = scrollTop + winHeight - getCurTop($li) + PADDING;
			$onScreenLower = [];
			$offScreenLower = [];
			$lower = [$li[0]];

			while(($li = $li.next()).length) {
				li = $li[0];
				if(isOnScreen($li, scrollTop)) {
					offset =  scrollTop + winHeight - getCurTop($li) + PADDING;
					winOffset = scrollTop + winHeight - getCurTop($li) + PADDING;
					if (offset > lowerOffset) lowerOffset = offset;
					if (winOffset > lowerWinOffset) lowerWinOffset = winOffset;

					$onScreenLower.push(li);
				} else {
					$offScreenLower.push(li);
				}
				$lower.push(li);
			}

			$onScreenUpper = $($onScreenUpper);
			$offScreenUpper = $($offScreenUpper);
			$onScreenLower = $($onScreenLower);
			$offScreenLower = $($offScreenLower);
			$upper = $($upper);
			$lower = $($lower);

			$animateOnScroll = $onScreenLower.add($oldLi).add($offScreenLower.slice(0, parseInt($onScreenUpper.length, 10)));

			articleTop = upperOffset + lowerOffset + scrollTop;
			articleHeight = upperOffset + lowerOffset;
			offset = scrollTop < upperOffset ? upperOffset - scrollTop : 0;

			$onScreenUpper.removeClass('offScreen').addClass('onScreen')
				.css('transform', modifyTransform(-upperOffset - offset, true));
			$offScreenUpper.addClass('offScreen')
				.css('transform', modifyTransform(-upperOffset - offset));

			$onScreenLower.removeClass('offScreen').addClass('onScreen')
				.css('transform', modifyTransform(Math.min(lowerWinOffset, lowerOffset), true));
			$offScreenLower.addClass('offScreen')
				.css('transform', modifyTransform(Math.min(lowerWinOffset, lowerOffset)));

			$oldLi.removeClass('offScreen').addClass('delay onScreen lower')
				.css('transform', modifyTransform(Math.min(lowerWinOffset, lowerOffset), true));

			$menu.removeClass('offScreen closing show').css('opacity', 0);
			$articleMenu.removeClass('hide');
			$container.addClass('transition');

			// Extend the height of the grid to make room for the article
			$("#grid").height($("#grid").height() + articleHeight + Math.min(lowerOffset, lowerWinOffset));
		}
	}

	function onKeyDown(e) {
		if (e.keyCode === 27) {
			var scrollTop = window.pageYOffset;
			if($searchBox.is(':focus')) {
				return $searchBox.blur();
			}
			closeArticle(true);
			onMenuClick();
		}
	}

	function onLoad(e) {
		//Modernizr.csstransforms3d = false;
		$container.isotope({
			itemSelector : 'li'
		});
	}

	function onUnload(e) {
		$window.scrollTop(0);
	}

	function onResize(e) {
		winHeight = $window.height();
		//noScrollEvents = true;
		resized = false;
	}

	function onMenuClick() {
		$menu.removeClass('onScreen offScreen hide');
		setTimeout(function() {
			$menu.addClass('show');
		}, SOON);
	}

	$menuLines.on('click', onMenuClick);
	$container.on('click', onClick);
	$container.on('webkitTransitionEnd', onTransitionEnd);
	$container.imagesLoaded(onLoad);
	$doc.on('scroll', onScroll);
	$doc.on('keydown', onKeyDown);
	$window.on('unload', onUnload);
	$window.on('resize', onResize);

	return {
		upperOffset: function() {
			return upperOffset;
		},
		lowerOffset: function() {
			return lowerOffset;
		},
		articleHeight: function() {
			return articleHeight;
		},
		articleTop: function() {
			return articleTop;
		},
		setState: function(state) {
			$upper = state.$upper;
			$lower = state.$lower;
			$animateOnScroll = state.$lower.slice(0, $animateOnScroll.length);
		},
		LOADING_Y_OFFSET: LOADING_Y_OFFSET
	};

}(Homepage));

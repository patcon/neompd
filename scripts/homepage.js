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
		SOON = 60,
		ASAP = 0,
		PADDING = parseInt(winHeight / 3, 10),
		SCROLL_TIMEOUT_LEN = 300,
		LOADING_Y_OFFSET = defaultVals.LOADING_Y_OFFSET,
		ANIMATION_THRESHOLD ,
		ANIMATION_EL_THRESHOLD = 5,
		firstScrollEvent = true,
		scrollTimeout,
		closeArticleTimeout,
		loadAnimTimeout,
		filterTimeout,
		$lower,
		$upper,
		$all = $container.find('li'),
		$hidden = $container.find('li'),
		$animateOnScroll, $animateOnScrollUpper,
		$article = $('#article'),
		updateScrollAnimation,
		noScrollEvents = true,
		isDoingTransition = false,
		loaded = false,
		resized = true,
		setFilter = false,
		menuShown,
		isFixed, isFixedBottom,
		scrollOffset,
		articleHeight = null,
		articleTop,
		articleOpacity = 0,
		overhead, underhead,
		upperOffset = 0,
		lowerOffset = 0,
		upperWinOffset = 0,
		lowerWinOffset = 0,
		endArticleTransition = winHeight * 2;

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
			var val = this.matrix;
			//return 'translateX(' + val[MATRIX_X] + 'px) translateY(' + ((padding || 0) + parseInt(val[MATRIX_Y], 10) + offset) + 'px)' + (hwAccel ? 'translateZ(0)' : '');
			return 'translate3d(' + val[MATRIX_X] + 'px, ' + ((padding || 0) + parseInt(val[MATRIX_Y], 10) + parseInt(offset, 10)) + 'px, 0)';
		};
	}

	function setTransform (thisVal, hwAccel) {
		return function(i, val) {
			//return 'translateX(' + val.match(MATRIX_REGEX)[MATRIX_X] + 'px) translateY(' + thisVal + 'px)' + (hwAccel ? 'translateZ(0)' : '');
			return 'translate3d(' + val.match(MATRIX_REGEX)[MATRIX_X] + 'px, ' + thisVal + 'px, 0)';
		};
	}

	function endCloseArticle() {
		$container.find('.shown').removeClass('shown').addClass('visible');
		$all.removeClass('offScreen');
	}

	function closeArticle (scroll, noAnimation, updateScrollbar, scrollTop) {
		var $offScreen;

		if((!closeArticleTimeout && !articleHeight) || isDoingTransition) {
			return;
		}
		$offScreen = [];
		scrollTop = scrollTop || window.pageYOffset;

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

			if(!noAnimation) {
				$all.removeClass('offScreen').addClass('closing');
				// $article.addClass('fadeOut');
				$menu.removeClass('offScreen hide').addClass('closing');
				noScrollEvents = true;
			}
			$article.addClass('fadeOut').css('opacity', 0);
			// $($offScreen).addClass('offScreen');
			// $upper.css('transform', modifyOrigTransform(articleHeight + scrollOffset, 0, true));
			// $lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset, 0, true));
			$upper.css('transform', modifyOrigTransform(overhead + scrollOffset, 0, true));
			$lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset, 0, true));

		} else {
			$lower.addClass('offScreen').css('transform', modifyOrigTransform(-lowerOffset - overhead, 0, true));
			if(!noAnimation) {
				$all.removeClass('offScreen').addClass('closing');
				$menu.removeClass('offScreen hide').addClass('closing');
				noScrollEvents = true;
			} else {
				$menu.css('transform', 'translate3d(0, 0, 0)');
			}
			$article.addClass('hidden');
			articleOpacity = 0;
		}

		if (scroll) {
			$container.find('.shown').removeClass('shown').addClass('visible');//.height($container.height() - articleHeight - Math.min(lowerOffset, lowerWinOffset));
			$all.removeClass('offScreen');
			//$menu.css('opacity', 1);
		}
		//$container.height($container.height() - articleHeight - Math.min(lowerOffset, lowerWinOffset));

		if (updateScrollbar) {
			//if(!scroll) {
			//	endCloseArticle();
			//}
			$window.scrollTop(scrollTop - overhead - articleHeight);
			// $window.scrollTop(scrollTop - (lowerOffset * 2) - upperOffset);
		} //else {
			if (!scroll) {
				setTimeout(endCloseArticle, SOON);
			}
		//}

		// Update the height of the grid to remove space occupied by the article
		articleHeight = null;

	}

	function finishTransition() {
		noScrollEvents = false;
		//$container.height($container.height() + articleHeight + Math.min(lowerOffset, lowerWinOffset));
		// // Update the height of the grid to remove space occupied by the article
		// $("#grid").height($("#grid").height() - articleHeight - Math.min(lowerOffset, lowerWinOffset));
	}

	function endTransition(scrollTop, scrollTo) {
		$all.removeClass('onScreen delay').addClass('offScreen');
		//$menu.addClass('offScreen hide');
		$lower.css('transform', modifyTransform(overhead));
		$upper.css('transform', modifyTransform(scrollTop < upperOffset ? (upperOffset * 2) - scrollTop : upperOffset));
		$container.removeClass('transition').css('height', '+=' + articleHeight);
		$article.removeClass('fadeIn');
		$menu.addClass('offScreen');
		noScrollEvents = true;
		$window.scrollTop(scrollTo);

		// Adjust the lower blocks and move them where they actually need to be
		if (lowerOffset > lowerWinOffset) {
			$lower.css('transform', modifyTransform(lowerOffset - lowerWinOffset));
		}

		$all.each(function() {
			this.matrix = $(this).css('transform').match(MATRIX_REGEX);
		});

		isDoingTransition = false;
		updateScrollAnimation = false;

		setTimeout(finishTransition, SOON);
	}

	function applyScrollClass() {
		if(isDoingTransition) {
			return setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
		}
		$container.removeClass('scrolling');
		scrollTimeout = null;
	}

	function debounceScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			$container.addClass('scrolling');
		}

		scrollTimeout = setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
	}

	function doLoadAnim() {
		var foundIndex = null,
			scrollTop =  window.pageYOffset,
			count = 0,
			$toAnim,
			lastFoundIndex;

		function anim() {
			$toAnim.addClass('shown').removeClass('offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET, true));
			loadAnimTimeout = false;
		}

		$hidden.each(function (i) {
			if((firstScrollEvent || (count <= ANIMATION_EL_THRESHOLD)) && isOnScreen($(this), scrollTop, -LOADING_Y_OFFSET - ANIMATION_THRESHOLD)) {
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
			requestAnimationFrame(anim);
		} else {
			loadAnimTimeout = false;
		}
	}

	function debounceLoadAnim() {
		if(loadAnimTimeout || !loaded || $hidden.length === 0) {
			return;
		}
		if  (firstScrollEvent) {
			doLoadAnim();
			return firstScrollEvent = false;
		}

		loadAnimTimeout = setTimeout(doLoadAnim,  SOON * 2);
	}

	function fixArticleTop() {
		$article.addClass('fixed').css('top', 0);
	}

	function fixArticleBottom() {
		$article.removeAttr('style');
		$article.addClass('fixedBottom')
	}

	function unfixArticleTop() {
		$article.removeClass('fixed').css('top', articleTop).css('opacity', 1);
		$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
		updateScrollAnimation = false;
	}

	function unfixArticleBottom() {
		$article.removeClass('fixedBottom').css('top', articleTop).css('opacity', 1);
		$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
		updateScrollAnimation = false;
	}

	function fadeArticle(opacity) {
		$article.css('opacity', articleOpacity);
	}

	function onScroll() {
		var scrollTop,
			val;

		if(noScrollEvents) {
			return debounceScrollClassToggling();
		} else if(isDoingTransition) {
			scrollTop = window.pageYOffset;
			return endTransition(scrollTop, scrollTop + lowerOffset);
		}

		if (articleHeight !== null) {
			if ((scrollTop = window.pageYOffset) < articleTop && (scrollTop > articleTop - overhead)) {
				if (!isFixed) {
					// Set article as fixed
					//$article.addClass('fixed').css('top', 0);
					//requestAnimationFrame(fixArticleTop);
					fixArticleTop();
					isFixed = true;
				}

				//} else {
					// Start moving up the blocks below the window
					if (lowerOffset > winHeight) {
						$animateOnScroll.css('transform', modifyOrigTransform(-(articleTop - scrollTop)/overhead * (lowerWinOffset + overhead), -lowerOffset + lowerWinOffset));
					} else {
						$animateOnScroll.css('transform', modifyOrigTransform(-(articleTop - scrollTop)/overhead * (lowerOffset + overhead), 0));
					}

					val = Math.abs(articleTop - scrollTop) / overhead;
					if(!menuShown) {
						$menu.css('transform', 'translate3d(' + (-200 + (200 * val))  + 'px, 0, 0)');
					}
					// Start fading away the article
					articleOpacity = 0.6 - (0.625 * val).toFixed(2);
					fadeArticle();
					//requestAnimationFrame(fadeArticle);

					//$articleMenu.addClass('hide');
					updateScrollAnimation = true;
				//}

			} else if (scrollTop < articleTop) {
				//setTimeout(function() {
					// $animateOnScroll.css('-webkit-transform', modifyOrigTransform(-lowerOffset - overhead));
					closeArticle(false, true, false, scrollTop);
					updateScrollAnimation = false;
				//}, ASAP);

			} else if(scrollTop >= articleTop && (scrollTop <= articleTop + articleHeight - winHeight)) {
				// Reset article and lower blocks position
				if (isFixed) {
					// $animateOnScroll.css('transform', modifyTransform(lowerOffset - lowerWinOffset + overhead));
					unfixArticleTop();
					//unfixArticle();
					isFixed = false;
					//regularScrolling - false;

				} else if (isFixedBottom) {
					unfixArticleBottom();
					isFixedBottom = false;
				} else if(updateScrollAnimation) {
					//$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
				}

			} else if ((scrollTop > articleTop + articleHeight - winHeight) && (scrollTop <= articleTop + articleHeight)) {
				/*if (!isFixedBottom) {
					fixArticleBottom();
					isFixedBottom = true;
				}*/

				if (lowerOffset > winHeight) {
					$animateOnScrollUpper.css('transform', modifyOrigTransform((scrollTop - (articleTop + articleHeight - winHeight + lowerWinOffset)), articleHeight + overhead - winHeight - upperOffset));//overhead + articleHeight - winHeight));
				} else {
					//$animateOnScrollUpper.css('transform', modifyOrigTransform((articleTop + articleHeight - scrollTop)/underhead * (upperOffset + underhead), 0));
				}

				val = Math.abs((scrollTop - (articleTop + articleHeight - winHeight)) / winHeight);
				if(!menuShown) {
					$menu.css('transform', 'translate3d(' + (-200 + (200 * val))  + 'px, 0, 0)');
				}
				//Start fading away the article
				articleOpacity = 0.6 - (0.625 * val).toFixed(2);
				fadeArticle();
				$articleMenu.addClass('hide');
				updateScrollAnimation = true;

			} else if (scrollTop > articleTop + articleHeight ) {
					//scroll to end of article
				if (isFixedBottom) {
					unfixArticleBottom();
					isFixedBottom = false;
				}
				closeArticle(false, true, true, scrollTop);
				updateScrollAnimation = false;
			}
		} else {
			debounceLoadAnim();
			debounceScrollClassToggling();
		}
	}

	function endResizeTranstion() {
		$all.removeClass('onScreen resized').addClass('offScreen').each(function() {
			this.matrix = $(this).css('transform').match(MATRIX_REGEX);
		});
	}

	function addFilter() {
		$container.removeClass('transition');
	}

	function onTransitionEnd(e) {
		var	scrollOffset,
			scrollTop,
			$transitioned = $(e.target);

		if(isDoingTransition && $transitioned.hasClass('delay')) {
			return endTransition(window.pageYOffset, articleTop);

		} else if(noScrollEvents && $transitioned.hasClass('closing')) {
			scrollTop = window.pageYOffset;
			scrollOffset = scrollTop - articleTop < 0 ? scrollTop - articleTop : 0;
			$all.addClass('offScreen').removeClass('closing').css('transform', modifyTransform(-overhead - scrollOffset)).removeClass('offScreen');
			$articleMenu.addClass('hide');
			$article.removeClass('fadeOut').removeClass('fixed');
			$window.scrollTop(scrollTop - overhead - scrollOffset);
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
			setTimeout(endResizeTranstion, SOON * 2);
			resized = true;

		} else if(setFilter) {
			filterTimeout = setTimeout(addFilter, SCROLL_TIMEOUT_LEN);
			setFilter = false;
		}
	}

	function endOnClick() {
		$article.css('opacity', 1);
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

			$li = $oldLi = $clicked.closest('li');
			$onScreenUpper = [];
			$offScreenUpper = [];
			$upper = [];

			isDoingTransition = true;
			scrollTop = window.pageYOffset;
			upperOffset = 0,
			lowerOffset = 0;
			articleHeight = $article.height();

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
					offset =  scrollTop + articleHeight - getCurTop($li) + PADDING;
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
			$animateOnScrollUpper = $onScreenUpper;

			overhead = Math.max(winHeight, upperOffset);
			underhead = winHeight;

			articleTop = scrollTop + overhead;
			offset = scrollTop < upperOffset ? upperOffset - scrollTop : 0;
			menuShown = false;

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

			// Show the article, there should probably be more fancy transitions tho
			$article.addClass('fixed fadeIn').removeClass('hidden').css('top', 0).css('opacity', 0);
			isFixed = true;

			$menu.removeClass('offScreen closing show').addClass('hide').css('transform', '');
			$articleMenu.removeClass('hide');

			requestAnimationFrame(endOnClick);
			//$container.addClass('transition');
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
		endArticleTransition = winHeight * 2;
		//noScrollEvents = true;
		resized = false;
	}

	function doMenuClick() {

	}

	function onMenuClick() {
		$menu.removeClass('onScreen offScreen hide').addClass('show');
		menuShown = true;

	}

	function doFilterClick() {
		$hidden = $([]);
		$all.removeClass('offScreen').addClass('visible');
		$container.addClass('transition').isotope({ filter: $clicked.attr('data-filter') });
		noScrollEvents = false;
	}

	function onFilterClick(e) {
		var $clicked = $(e.target).closest('li');
		if($clicked.length) {
			noScrollEvents = true;
			$body.scrollTop(0);
			setFilter = true;
			clearTimeout(filterTimeout);
			setTimeout(doFilterClick, ASAP);
		}
	}

	$menuLines.on('click', onMenuClick);
	$container.on('click', onClick);
	$menu.on('click', onFilterClick);
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

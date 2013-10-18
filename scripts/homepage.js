var Homepage = (function homepage(defaultVals) {
	'use strict';

	var $window = $(window),
		$doc = $(document),
		$body = $(document.body),
		$container = $body.find('#grid'),
		$menu = $body.find('#menu'),
		$articleMenu = $body.find('#articleMenu'),
		$articleClose = $body.find('#close'),
		$menuLines = $body.find('#lines'),
		$searchBox = $body.find('#searchBox'),
		winHeight = $window.height(),
		MATRIX_REGEX = /(-?\d+)/g,
		MATRIX_X = 4,
		MATRIX_Y = 5,
		SOON = 60,
		ASAP = 0,
		PADDING = 10,
		SCROLL_TIMEOUT_LEN = 500,
		FRAME = 16,
		OPACITY_FRAME = 50,
		ANIMATION_THRESHOLD = 0,
		MAX_PER_LOAD_DEBOUNCE = 4,
		ANIMATION_EL_THRESHOLD = 1,
		LOADING_Y_OFFSET = defaultVals.LOADING_Y_OFFSET,
		firstScrollEvent = true,
		scrollTimeout,
		opacityTimeout,
		loadAnimTimeout,
		loadAnimFrameTimeout,
		filterTimeout,
		$lower,
		$upper,
		$all = $container.find('li'),
		$hidden = $container.find('li'),
		$toAnim,
		$animateOnScroll,
		$animateOnScrollUpper,
		$article = $('#article'),
		$menuElevator = $('#menuElevator'),
		updateScrollAnimation,
		noScrollEvents = true,
		isDoingTransition = false,
		loaded = false,
		resized = true,
		setFilter = false,
		jumpBottom = false,
		menuShown,
		isFixed,
		justShowedArticle = false,
		articleHeight = null,
		articleTop,
		articleOpacity = 0,
		overhead,
		underhead,
		upperOffset = 0,
		lowerOffset = 0,
		upperWinOffset = 0,
		lowerWinOffset = 0,
		menuElevatorTop = 0,
		menuElevatorBottom = $menuElevator.height(),
		menuElevatorLastScrollTop = $(window).scrollTop(),
		menuElevatorIsFixed = false,
		endArticleTransition = winHeight * 2,
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		round = Math.round,
		abs = Math.abs,
		max = Math.max,
		min = Math.min;

	function getCurTop ($el) {
		return parseInt($el.css('transform').match(MATRIX_REGEX)[MATRIX_Y], 10);
	}

	function isOnScreen ($el, scrollTop, padding) {
		var thisTop = getCurTop($el) + (padding || 0),
			height = $el.height();
		return (thisTop < (scrollTop + winHeight)) && (((thisTop + height) > scrollTop));
	}

	function isInArticle($el, scrollTop) {
		var thisTop = getCurTop($el);
		return thisTop >= (articleHeight + articleTop) && thisTop <= (articleHeight + articleTop + articleHeight);
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
		$all.removeClass('offScreen');
		noScrollEvents = false;
		firstScrollEvent = true;
		articleHeight = null;
		debounceLoadAnim();
	}

	function closeArticle (scroll, noAnimation, updateScrollbar, scrollTop) {
		var $offScreen,
			scrollOffset,
			onScreenScrollOffset;

		if(articleHeight === null || isDoingTransition) {
			return;
		}
		if(opacityTimeout) {
			clearTimeout(opacityTimeout);
			opacityTimeout = false;
		}
		$offScreen = [];
		scrollTop = scrollTop || window.pageYOffset;

		if(scroll) {
			onScreenScrollOffset = scrollTop - articleTop;
			scrollOffset = onScreenScrollOffset < 0 ? onScreenScrollOffset : 0;

			$upper.each(function() {
				var $me = $(this);
				//if(! isOnScreen($me, scrollTop, articleHeight + scrollOffset)) {
				if(!isOnScreen($me, scrollTop, winHeight + scrollOffset)) {
					$offScreen.push(this);
				}
			});
			var count = 0;
			$lower.each(function() {
				var $me = $(this);
				//if(!isOnScreen($me, scrollTop) && !isOnScreen($me, scrollTop, -articleHeight - scrollOffset) && !isOnScreen($me, scrollTop, -lowerOffset - scrollOffset)) {
				if(isFixed && !justShowedArticle) {
					if(!isOnScreen($me, scrollTop + winHeight + scrollOffset)) {
						$offScreen.push(this);
					}
				} else if(!isInArticle($me, scrollTop)) {
					$offScreen.push(this);
				}
			});

			$article.addClass('fadeOut').css('opacity', 0);
			if(!noAnimation) {
				$all.removeClass('offScreen').addClass(isFixed && !justShowedArticle ? 'closing' : 'closingSlow');
				// $article.addClass('fadeOut');
				$menu.removeClass('offScreen hide').addClass('closing');
				noScrollEvents = true;
			}
			$($offScreen).addClass('offScreen');
			// $upper.css('transform', modifyOrigTransform(articleHeight + scrollOffset, 0, true));
			// $lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset, 0, true));
			$upper.css('transform', modifyOrigTransform(overhead + scrollOffset, 0, true));
			$lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset, 0, true));

		} else {
			if(!noAnimation) {
				$lower.css('transform', 'translate3d(0, 0, 0)');
				$all.removeClass('offScreen').addClass('closing');
				$menu.removeClass('offScreen hide').addClass('closing');
				noScrollEvents = true;
			} else {
				$lower.css('transform', modifyOrigTransform(-lowerOffset - overhead, 0, true));
				$menu.css('transform', 'translate3d(0, 0, 0)');
			}
		}
		$articleClose.addClass('hidden').removeClass('shown');
		$container.css('height', '-=' + (articleHeight + lowerOffset));

		if (scroll) {
			$container.find('.shown').removeClass('shown').addClass('visible');
			//$container.css('height', '-=' + (articleHeight + lowerOffset));//.height($container.height() - articleHeight - Math.min(lowerOffset, lowerWinOffset));
			$all.removeClass('offScreen');
			articleHeight = null;
		} else {
			$article.addClass('hidden');
			noScrollEvents = true;
			setTimeout(endCloseArticle, SOON * 2);
		}

		if (updateScrollbar) {
			$window.scrollTop(scrollTop - overhead - lowerOffset);
		}

		// Update the height of the grid to remove space occupied by the article


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
		$container.removeClass('transition').css('height', '+=' + (articleHeight + lowerOffset));
		$article.removeClass('fadeIn');
		$articleClose.addClass('shown').css('zIndex', 3);
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
		//requestAnimationFrame(function() {
			$container.removeClass('scrolling');
			scrollTimeout = null;
	//	});
	}

	function debounceScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			//requestAnimationFrame(function() {
				$container.addClass('scrolling');
			//});
		}

		scrollTimeout = setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
	}

	function animateMenuElevator(scrollTop, viewportHeight) {
		var scrollBottom = scrollTop + viewportHeight;

		if (scrollTop > menuElevatorLastScrollTop) {
			// going down, check if need to detach from top or fix on bottom
			if (menuElevatorIsFixed && scrollBottom > menuElevatorBottom) {
				// compute triggers for top and bottom
				menuElevatorTop = menuElevatorLastScrollTop;
				menuElevatorBottom = menuElevatorTop + $menuElevator.height();
				menuElevatorIsFixed = false;

				// detach and position
				$menuElevator.css({
					position: 'absolute',
					top: menuElevatorTop,
					bottom: 'auto'
				});
			} else if (scrollBottom > menuElevatorBottom) {
				// reset the triggers to stop fixing
				menuElevatorTop = Number.POSITIVE_INFINITY;
				menuElevatorBottom = Number.POSITIVE_INFINITY;
				menuElevatorIsFixed = true;
				$menuElevator.css({
					position: 'fixed',
					top: 'auto',
					bottom: 0
				});
			}
		} else if (scrollTop < menuElevatorLastScrollTop) {
			// going up, check if need to detach from bottom or fix on top
			if (menuElevatorIsFixed && scrollBottom < menuElevatorBottom) {
				// compute triggers for top and bottom
				menuElevatorBottom = menuElevatorLastScrollTop + viewportHeight;
				menuElevatorTop = menuElevatorBottom - $menuElevator.height();
				menuElevatorIsFixed = false;

				// detach and position
				$menuElevator.css({
					position: 'absolute',
					top: menuElevatorTop,
					bottom: 'auto'
				});
			} else if (scrollTop < menuElevatorTop) {
				// reset the triggers to stop fixing
				menuElevatorTop = 0;
				menuElevatorBottom = 0;
				menuElevatorIsFixed = true;
				$menuElevator.css({
					position: 'fixed',
					top: 0,
					bottom: 'auto'
				});
			}
		}

		menuElevatorLastScrollTop = scrollTop;
	}

	function loadAnim() {
		var moreThanOneFrame = $toAnim.length > max,
			max = ANIMATION_EL_THRESHOLD,
			$thisAnim;
		if(moreThanOneFrame) {
			$thisAnim = $($toAnim.splice(0, max));
		} else {
			$thisAnim = $toAnim;
		}
		$thisAnim.addClass('shown').removeClass('offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET, true));

		if(moreThanOneFrame) {
			return setTimeout(loadAnim, FRAME);
		} else {
			loadAnimTimeout = false;
		}
	}


	function doLoadAnim() {
		var foundIndex = null,
			count = 0,
			lastFoundIndex,
			loadAnimScrollTop = window.pageYOffset;
		$hidden.each(function (i) {
			if(isOnScreen($(this), loadAnimScrollTop, -LOADING_Y_OFFSET - ANIMATION_THRESHOLD)) {
				if(count === 0) {
					foundIndex = i;
				}
				count++;
				lastFoundIndex = i;
				if(!firstScrollEvent && count >= MAX_PER_LOAD_DEBOUNCE) {
					return false;
				}
			} else {
				return count === 0;
			}
		});
		if(foundIndex !== null) {
			$toAnim = ($($hidden.splice(foundIndex, 1 + lastFoundIndex - foundIndex)));
			setTimeout(loadAnim, FRAME);
		} else {
			loadAnimTimeout = false;
		}
	}

	function debounceLoadAnim(scrollTop) {
		if(loadAnimTimeout || !loaded || $hidden.length === 0) {
			return;
		}
		if  (firstScrollEvent) {
			doLoadAnim();
			return firstScrollEvent = false;
		}
		loadAnimTimeout = setTimeout(doLoadAnim,  SOON * 2);
	}
/*

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
*/
	function fixArticle() {
		$article.addClass('fixed').css('top', 0);
		noScrollEvents = false;
	}

	function fadeArticle() {
		$article.css('opacity', articleOpacity);
		$articleClose.css('opacity', articleOpacity).css('zIndex', articleOpacity === 1 ? 3 : 2);
		opacityTimeout = false;
	}

	function unfixArticle() {
		articleOpacity = 1;
		fadeArticle();
		$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
		$article.removeClass('fixed').css('top', articleTop).css('opacity', 1);
		//$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
		updateScrollAnimation = false;
		noScrollEvents = false;
	}

	function onScroll() {
		var scrollTop,
			val;

		if(noScrollEvents) {
			return debounceScrollClassToggling();
		} else if(isDoingTransition) {
			scrollTop = window.pageYOffset;
			return endTransition(scrollTop, articleTop);
		}

		if (articleHeight !== null) {
			justShowedArticle = false;
			if ((scrollTop = window.pageYOffset) < articleTop && (scrollTop > articleTop - overhead)) {

				if (!isFixed) {
					// Set article as fixed
					//$article.addClass('fixed').css('top', 0);
					noScrollEvents = true;
					isFixed = true;
					//return requestAnimationFrame(fixArticle);
					return fixArticle();

				}

					// Put the lower blocks right below the window to start moving up
					//if (lowerOffset > winHeight) {
						//$animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset + lowerWinOffset));
					//}

				//} else {
					// Start moving up the blocks below the window
					val = abs(articleTop - scrollTop) / overhead;
					if(!menuShown) {
						$menu.css('transform', 'translate3d(' + round(-200 + (200 * val))  + 'px, 0, 0)');
					}
					articleOpacity = (0.6 - (0.625 * val)).toFixed(2);
					if(! opacityTimeout) {
						opacityTimeout = setTimeout(fadeArticle, OPACITY_FRAME);
					}

					if (lowerOffset > winHeight) {
						val = round(-((articleTop - scrollTop)/overhead * (lowerWinOffset + overhead)) -lowerOffset + lowerWinOffset);
					} else {
						val = round(-(articleTop - scrollTop)/overhead * (lowerOffset + overhead));
					}
					$animateOnScroll.css('transform', modifyOrigTransform(val));
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
					noScrollEvents = true;
					//requestAnimationFrame(unfixArticle);
					unfixArticle();
					isFixed = false;
					//regularScrolling - false;
				} else if(updateScrollAnimation) {
					$animateOnScrollUpper.css('transform', modifyOrigTransform(0, 0, true));
				}

				if (jumpBottom) { //unjump the blocks under article so tiles go bk to proper position
					$animateOnScroll.css('transform', modifyTransform(-(underhead - lowerWinOffset),true));
					jumpBottom = false;
				}
			} else if ((scrollTop > articleTop + articleHeight - winHeight) && (scrollTop < articleTop + articleHeight + (underhead - winHeight))) {
				if (!jumpBottom) {  //jump blocks futher under the article so the tiles move the right amount to close properly
					$animateOnScroll.css('transform', modifyTransform(underhead - lowerWinOffset,true));
					jumpBottom = true;
				}

				if (lowerOffset > winHeight) {
					val = round(((scrollTop - (articleTop + articleHeight - winHeight)) / underhead * (underhead + upperOffset)) + articleHeight + overhead - winHeight - upperOffset);
				} else {
					val = round((scrollTop - (articleTop + articleHeight - winHeight)) / underhead * (underhead + upperOffset));
				}
				$animateOnScrollUpper.css('transform', modifyOrigTransform(val));

				val = 1 - Math.abs((scrollTop - (articleTop + articleHeight - winHeight + underhead)) / underhead);
				if(!menuShown) {
					$menu.css('transform', 'translate3d(' + (-200 + (200 * val))  + 'px, 0, 0)');
				}
				//Start fading away the article
				articleOpacity = 1 - (1 * val).toFixed(2);
				fadeArticle();
				//$articleMenu.addClass('hide');
				updateScrollAnimation = true;
			}  else if (scrollTop >= articleTop + articleHeight + (underhead - winHeight)) {
				closeArticle(false, true, true, scrollTop);
				$animateOnScrollUpper.css('transform', modifyOrigTransform(0,0));
				updateScrollAnimation = false;
				jumpBottom = false;
			}
		} else {
			debounceLoadAnim();

			animateMenuElevator($(document).scrollTop(), $(window).height());
		}
		debounceScrollClassToggling();
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
		} else if(noScrollEvents && ($transitioned.hasClass('closing') || $transitioned.hasClass('closingSlow'))) {
			scrollTop = window.pageYOffset;
			scrollOffset = scrollTop - articleTop < 0 ? scrollTop - articleTop : 0;
			$all.addClass('offScreen').removeClass('closing closingSlow').css('transform', modifyTransform(-overhead - scrollOffset)).removeClass('offScreen');
			$article.removeClass('fadeOut').removeClass('fixed');
			$window.scrollTop(scrollTop - overhead - scrollOffset);
			noScrollEvents = false;
		} else if(!loaded && $container.hasClass('initial')) {
			$hidden.addClass('offScreen');
			noScrollEvents = false;
			$body.css('opacity', 1);
			$container.removeClass('initial');
			//doLoadAnim();
			setTimeout(doLoadAnim, SOON * 2);
			loaded = true;
		} else if(!resized && $transitioned.hasClass('resized')) {
			setTimeout(endResizeTranstion, SOON * 2);
			resized = true;
		} else if(setFilter) {
			filterTimeout = setTimeout(addFilter, SCROLL_TIMEOUT_LEN);
			setFilter = false;
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

			overhead = max(winHeight, upperOffset);
			underhead = max(winHeight, lowerWinOffset);

			articleTop = scrollTop + overhead;
			offset = scrollTop < upperOffset ? upperOffset - scrollTop : 0;
			menuShown = false;
			isFixed = true;
			justShowedArticle = true;

			$all.find('.shown').removeClass('shown').addClass('visible');
			$onScreenUpper.removeClass('offScreen').addClass('onScreen')
				.css('transform', modifyTransform(-upperOffset - offset, true));
			$offScreenUpper.addClass('offScreen')
				.css('transform', modifyTransform(-upperOffset - offset));

			$onScreenLower.removeClass('offScreen').addClass('onScreen')
				.css('transform', modifyTransform(min(lowerWinOffset, lowerOffset), true));
			$offScreenLower.addClass('offScreen')
				.css('transform', modifyTransform(min(lowerWinOffset, lowerOffset)));

			$oldLi.removeClass('offScreen').addClass('delay onScreen lower')
				.css('transform', modifyTransform(min(lowerWinOffset, lowerOffset), true));

			articleOpacity = 1;
			$article.addClass('fixed fadeIn').removeClass('hidden').css('top', 0);
			fadeArticle();

			$menu.removeClass('offScreen closing show').addClass('hide').css('transform', '');
			$articleMenu.removeClass('hidden');
			$articleClose.removeClass('hidden').css('zIndex', 2);
			$article.css('opacity', 1);
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


	function onMenuClick() {
		$menu.removeClass('onScreen offScreen hide').addClass('show');
		menuShown = true;
	}

	function onCloseClick() {
		closeArticle(true);
	}

	function onFilterClick(e) {
		var $clicked = $(e.target).closest('li');
		if($clicked.length) {
			noScrollEvents = true;
			$body.scrollTop(0);
			setFilter = true;
			clearTimeout(filterTimeout);
			setTimeout(function() {
				$hidden = $([]);
				$all.removeClass('offScreen').addClass('visible');
				$container.addClass('transition').isotope({ filter: $clicked.attr('data-filter') });
				noScrollEvents = false;
			}, ASAP);
		}
	}


	$window.on('click', onClick);
	$window.on('unload', onUnload);
	$window.on('resize', onResize);

	$menuLines.on('click', onMenuClick);
	$menu.on('click', onFilterClick);
	$articleClose.on('click', onCloseClick)

	$container.on('transitionend', onTransitionEnd);
	$container.imagesLoaded(onLoad);

	$doc.on('scroll', onScroll);
	$doc.on('keydown', onKeyDown);

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

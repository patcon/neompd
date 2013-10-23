var Homepage = (function homepage(defaultVals) {
	'use strict';

	var $window = $(window),
		$doc = $(document),
		$body = $(document.body),
		$container = $body.find('#grid'),
		$wrap = $body.find('#grid-wrap'),
		$menu = $body.find('#menu'),
		$articleMenu = $body.find('#articleMenu'),
		$articleClose = $body.find('#close'),
		$menuLines = $body.find('#lines'),
		$searchBox = $body.find('#searchBox'),
		$article = $('#article'),
        $loading = $('#loading'),
		winHeight = $window.height(),
		MATRIX_REGEX = /(-?\d+)/g,
		MATRIX_X = 1,
		MATRIX_Y = 2,
		SOON = 60,
		ASAP = 0,
		PADDING = 10,
		MIN_OPACITY = 0.005,
		SCROLL_TIMEOUT_LEN = 400,
		END_CLOSE_ARTICLE_TIMEOUT_LEN = 280,
		RESIZE_TIMEOUT_LEN = 825,
		ANIMATION_THRESHOLD = 0,
		MAX_PER_LOAD_DEBOUNCE = 5,
		ANIMATION_EL_THRESHOLD = 1,
		LOADING_Y_OFFSET = defaultVals.LOADING_Y_OFFSET,
		firstScrollEvent = true,
		scrollTimeout,
		opacityTimeout,
		loadAnimTimeout,
		filterTimeout,
		$lower,
		$offScreenLower,
		$upper,
		$all = $container.find('li'),
		$hidden = $container.find('li'),
		$toAnim,
		$animateOnScroll,
		$animateOnScrollUpper,
		updateScrollAnimation,
		noScrollEvents = true,
		isDoingTransition = false,
		loaded = false,
		resized = true,
		setFilter = false,
		jumpBottom = false,
		menuShown,
		isFixed,
		isClosing,
		articleHeight = null,
		updateScrollbarOnClose,
		articleTop,
		articleOpacity = 0,
		overhead,
		underhead,
		upperOffset = 0,
		lowerOffset = 0,
		upperWinOffset = 0,
		lowerWinOffset = 0,
		containerHeight,
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		parseInt = window.parseInt,
		requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame,
		cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame,
		round = Math.round,
		abs = Math.abs,
		max = Math.max,
		min = Math.min;

	function setTimeoutWithRAF(fn, t) {
		return setTimeout(requestAnimationFrame.bind(this, fn), t);
	}

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
		return thisTop >= (articleHeight + articleTop) && thisTop <= (articleHeight + scrollTop + articleHeight - articleTop);
	}

	function modifyTransform (offset, hwAccel) {
		return function(i, val) {
			val = val.match(MATRIX_REGEX);
			//console.log((parseInt(val[MATRIX_Y], 10) + offset) + ' ' + (parseInt(val[MATRIX_Y], 10) + offset));
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

	function finalize() {
		noScrollEvents = false;
		articleHeight = null;
		firstScrollEvent = true;
		isClosing = false;

		$all.removeClass('offScreen');
		if(updateScrollAnimation) {
			debounceLoadAnim();
		}
	}

	function finalizeEndCloseArticle() {
		requestAnimationFrame(finalize);

		if(!updateScrollbarOnClose) {
			$wrap.css('overflow', '');
			setTimeoutWithRAF(finalize, END_CLOSE_ARTICLE_TIMEOUT_LEN);
		}
	}

	function finishEndCloseArticle() {
		if(! updateScrollbarOnClose) {
			$wrap.css('overflow', 'visible');
		}
		$wrap.css('height', containerHeight);

		setTimeoutWithRAF(finalizeEndCloseArticle, END_CLOSE_ARTICLE_TIMEOUT_LEN);
	}


	function endCloseArticle() {
		$offScreenLower.css('transform', modifyOrigTransform(-lowerOffset - overhead, 0, true));
		$menu.css('transform', 'translate3d(0, 0, 0)');
		$article.css('top', '-9999px').removeClass('fixed');
		$articleClose.addClass('hidden').removeClass('shown');

		setTimeoutWithRAF(finishEndCloseArticle, END_CLOSE_ARTICLE_TIMEOUT_LEN);
	}

	function closeArticle (scroll, noAnimation, updateScrollbar, scrollTop) {
		var scrollOffset;

		if(articleHeight === null || isDoingTransition) {
			return;
		}

		noScrollEvents = true;
		isClosing = true;

		if(scroll) {
			scrollTop = scrollTop || window.pageYOffset;
			updateScrollbarOnClose = false;
			scrollOffset = scrollTop - articleTop;

			$articleClose.addClass('hidden').removeClass('shown');
			if(!isFixed) {
				$upper.css('transform', modifyTransform(scrollTop - articleTop));
				$lower.css('transform', modifyTransform(scrollTop - articleTop - articleHeight + winHeight));
			}

			$animateOnScroll.removeClass('offScreen').addClass('closing');
			$animateOnScrollUpper.removeClass('offScreen').addClass('closing');

			$upper.css('transform', modifyOrigTransform(overhead + scrollOffset, 0, true));
			$lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset, 0, true));

			$article.addClass('fadeOut').css('opacity', MIN_OPACITY);
			if(!noAnimation) {
				$menu.removeClass('offScreen hide').addClass('closing');
			}

		} else {
			$animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset - overhead, 0, true));

			if(updateScrollbarOnClose = updateScrollbar) {
				$animateOnScrollUpper.css('transform', modifyOrigTransform(0,0));
			}
			if(updateScrollbarOnClose) {
				$window.scrollTop(articleTop - overhead);
			}

			setTimeoutWithRAF(endCloseArticle, SOON);
		}

		if(opacityTimeout) {
			cancelAnimationFrame(opacityTimeout);
			opacityTimeout = false;
		}
	}

	function removeScrollClass() {
		$container.removeClass('scrolling');
		scrollTimeout = null;
	}

	function addScrollClass() {
		$container.addClass('scrolling');
	}

	function applyScrollClass() {
		if(isDoingTransition) {
			return setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
		}
		requestAnimationFrame(removeScrollClass);
	}

	function debounceScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			requestAnimationFrame(addScrollClass);
		}

		scrollTimeout = setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
	}

	function loadAnim() {
		var moreThanOneFrame;
		if(isDoingTransition) {
			$toAnim.addClass('visible offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET, true));
			return loadAnimTimeout = false;
		}

		moreThanOneFrame = $toAnim.length > ANIMATION_EL_THRESHOLD;
		$($toAnim.splice(0, ANIMATION_EL_THRESHOLD))
			.addClass('shown').removeClass('offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET, true));

		if(moreThanOneFrame) {
			return requestAnimationFrame(loadAnim);
		} else {
			$toAnim = [];
			loadAnimTimeout = false;
		}
	}


	function doLoadAnim() {
		if(isDoingTransition) {
			return loadAnimTimeout = false;
		}

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
			requestAnimationFrame(loadAnim);
		} else {
			loadAnimTimeout = false;
		}
	}

	function debounceLoadAnim(scrollTop) {
		//$all.removeClass('offScreen');
		if(loadAnimTimeout || !loaded || $hidden.length === 0) {
			return;
		}
		if  (firstScrollEvent) {
			doLoadAnim();
			return firstScrollEvent = false;
		}
		loadAnimTimeout = setTimeout(doLoadAnim,  SOON * 2);
	}

	function fixArticle() {
		$article.addClass('fixed').css('top', 0);
		noScrollEvents = false;
	}

	function fadeArticle() {
		//never set opacity to 0 so webkit can recomposite layers
		if(articleOpacity < MIN_OPACITY) {
			articleOpacity = MIN_OPACITY;
		}
		$article.css('opacity', articleOpacity);
		$articleClose.css('opacity', articleOpacity).css('zIndex', articleOpacity === 1 ? 3 : 2);
		opacityTimeout = false;
	}

	function finishUnFixArticle() {
		$animateOnScroll.css('transform', modifyOrigTransform(0, 0, true));
		noScrollEvents = false;
	}

	function unfixArticle() {
		articleOpacity = 1;
		if(! opacityTimeout) {
			opacityTimeout = requestAnimationFrame(fadeArticle);
		}

		$article.removeClass('fixed').css('top', articleTop);
		requestAnimationFrame(finishUnFixArticle);
	}

	function endOnClickTransition(scrollTop, scrollTo) {
		$wrap.css('height', '');
		$container.removeClass('transition').css('height', containerHeight + articleHeight + overhead + underhead);
		$articleClose.css('zIndex', 3);
		$lower.addClass('offScreen').removeClass('onScreen delay').css('transform', modifyTransform(overhead + (lowerOffset > lowerWinOffset ? lowerOffset - lowerWinOffset : 0)));
		$upper.addClass('offScreen').removeClass('onScreen').css('transform', modifyTransform(scrollTop < upperOffset ? (upperOffset * 2) - scrollTop : upperOffset));
		$all.each(function() {
			this.matrix = $(this).css('transform').match(MATRIX_REGEX);
		});

		$article.removeClass('fadeIn');
		$menu.addClass('offScreen');
		$window.scrollTop(scrollTo);

		isDoingTransition = false;
		updateScrollAnimation = false;
	}

	function onScroll() {
		var scrollTop,
			val;

		if(noScrollEvents) {
			return debounceScrollClassToggling();
		} else if(isDoingTransition) {
			return endOnClickTransition(window.pageYOffset, articleTop);
		}

		if (articleHeight !== null) {
			if ((scrollTop = window.pageYOffset) < articleTop && (scrollTop > articleTop - overhead)) {
				if (!isFixed) {
					isFixed = true;
					fixArticle();
				} else {
					if (lowerOffset > winHeight) {
						val = round(-((articleTop - scrollTop)/overhead * (lowerWinOffset + overhead)) -lowerOffset + lowerWinOffset);
					} else {
						val = round(-(articleTop - scrollTop)/overhead * (lowerOffset + overhead));
					}
					$animateOnScroll.css('transform', modifyOrigTransform(val));

					val = abs(articleTop - scrollTop) / overhead;
					if(! menuShown) {
						$menu.css('transform', 'translate3d(' + round(-200 + (200 * val))  + 'px, 0, 0)');
					}
					articleOpacity = (0.6 - (0.625 * val)).toFixed(2);
					if(! opacityTimeout) {
						opacityTimeout = requestAnimationFrame(fadeArticle);
					}
				}
				updateScrollAnimation = true;

			} else if (scrollTop < articleTop) {
				closeArticle(false, true, false, scrollTop);
				updateScrollAnimation = false;
			} else if(scrollTop >= articleTop && (scrollTop <= articleTop + articleHeight - winHeight)) {
				// Reset article and lower blocks position
				if (isFixed) {
					noScrollEvents = true;
					isFixed = false;
					return unfixArticle();
				} else if(updateScrollAnimation) {
					$animateOnScrollUpper.css('transform', modifyOrigTransform(0, 0, true));
				}
				if (jumpBottom) { //unjump the blocks under article so tiles go bk to proper position
					$animateOnScroll.css('transform', modifyTransform(-(underhead - lowerWinOffset),true));
					jumpBottom = false;
				}
			} else if ((scrollTop > articleTop + articleHeight - winHeight) && (scrollTop < articleTop + articleHeight + (underhead - winHeight))) {
				if (!jumpBottom) {  //jump blocks futher under the article so the tiles move the right amount to close properly
					jumpBottom = true;
					return  $animateOnScroll.css('transform', modifyTransform(underhead - lowerWinOffset,true));
				}

				if (lowerOffset > winHeight) {
					//wow
					val = round(((scrollTop - (articleTop + articleHeight - winHeight)) / underhead * (underhead + upperOffset)) + articleHeight + overhead - winHeight - upperOffset);
				} else {
					val = round((scrollTop - (articleTop + articleHeight - winHeight)) / underhead * (underhead + upperOffset));
				}
				$animateOnScrollUpper.css('transform', modifyOrigTransform(val));

				val = 1 - abs((scrollTop - (articleTop + articleHeight - winHeight + underhead)) / underhead);
				if(!menuShown) {
					$menu.css('transform', 'translate3d(' + (-200 + (200 * val))  + 'px, 0, 0)');
				}

				articleOpacity = (1 - (1 * val)).toFixed(2);
				if(! opacityTimeout) {
					opacityTimeout = requestAnimationFrame(fadeArticle);
				}

				updateScrollAnimation = true;
			}  else if (scrollTop >= articleTop + articleHeight + (underhead - winHeight)) {
				closeArticle(false, true, true, scrollTop);
				updateScrollAnimation = false;
				jumpBottom = false;
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
			return endOnClickTransition(window.pageYOffset, articleTop);
		} else if(noScrollEvents && $transitioned.hasClass('closing')) {
			scrollTop = window.pageYOffset;
			scrollOffset = scrollTop - articleTop;
			$all.addClass('offScreen').removeClass('closing').css('transform', modifyTransform(-overhead - scrollOffset)).removeClass('offScreen');
			$article.removeClass('fadeOut').removeClass('fixed').css('top', '-9999px');
			$window.scrollTop(scrollTop - overhead - scrollOffset);
			requestAnimationFrame(finishEndCloseArticle);
		} else if(!loaded && $container.hasClass('initial')) {
			$hidden.addClass('offScreen');
			noScrollEvents = false;
			$body.css('opacity', 1);
			$container.removeClass('initial');
			$wrap.css('height', $container.css('height'));
			setTimeoutWithRAF(doLoadAnim, SCROLL_TIMEOUT_LEN);
			loaded = true;
		} else if(!resized && $transitioned.hasClass('resized')) {
			setTimeout(endResizeTranstion, SOON);
			winHeight = $window.height();
			resized = true;
		} else if(!resized) {
			$container.removeClass('transition');
			winHeight = $window.height();
			resized = true;
		} else if(setFilter) {
			filterTimeout = setTimeoutWithRAF(addFilter, SCROLL_TIMEOUT_LEN);
			setFilter = false;
		}
	}

	function onClick(e) {
		var $onScreenUpper,
			$onScreenLower,
			$offScreenUpper,
			$li,
			li,
			$clicked,
			$oldLi,
			scrollTop,
			offset,
			lOffset,
			winOffset;

		if(($clicked = $(e.target)).closest('ul').is($container) && ! $clicked.is($container)) {
			e.preventDefault();
			e.stopPropagation();

			if(isClosing) {
				return;
			} else if(articleHeight !== null) {
				return closeArticle(true);
			}

			$li = $oldLi = $clicked.closest('li');
			$onScreenUpper = [];
			$offScreenUpper = [];
			$upper = [];
			if($toAnim.length) {
				alert($toAnim.length);
			}
			isDoingTransition = true;
			scrollTop = window.pageYOffset;
			upperOffset = 0,
			lowerOffset = 0;
			articleHeight = $article.height();

			containerHeight = parseInt(($wrap.css('height').replace('px', '') || containerHeight), 10);

			while(($li = $li.prev()).length) {
				li = $li[0];
				if(isOnScreen($li, scrollTop)) {
					offset = getCurTop($li) + $li.outerHeight() - scrollTop + PADDING;
					if(offset > upperOffset) {
						upperOffset = offset;
					}
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
					if (offset > lowerOffset) {
						lowerOffset = offset;
					}
					if (winOffset > lowerWinOffset) {
						lowerWinOffset = winOffset;
					}

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
			lOffset =  min(lowerWinOffset, lowerOffset);
			menuShown = false;
			isFixed = true;
			articleOpacity = 1;

			requestAnimationFrame(function() {
				$all.find('.shown').removeClass('shown').addClass('visible');
				$offScreenUpper.addClass('offScreen')
					.css('transform', modifyTransform(-upperOffset - offset));
				$offScreenLower.addClass('offScreen')
					.css('transform', modifyTransform(lOffset));

				$articleMenu.removeClass('hidden');
				$article.addClass('fixed fadeIn').css('top', 0).css('opacity', 1);

				$menu.removeClass('offScreen closing show').addClass('hide').css('transform', '');
				$onScreenUpper.removeClass('offScreen').addClass('onScreen')
					.css('transform', modifyTransform(-upperOffset - offset, true));
				$onScreenLower.removeClass('offScreen').addClass('onScreen')
					.css('transform', modifyTransform(lOffset, true));
				$oldLi.removeClass('offScreen').addClass('delay onScreen')
					.css('transform', modifyTransform(lOffset, true));

				$articleClose.removeClass('hidden').addClass('shown').css('opacity', 1).css('zIndex', 2);
			});
			//setTimeoutWithRAF(function() {
			var href = $clicked.parent().attr('data-href');
			//console.log($clicked.parent().attr('data-href'));
			//}, SOON);
			$article.load(href);
            $loading.addClass("hidden");
		}
	}

	function onKeyDown(e) {
		if (e.keyCode === 27) {
			if($searchBox.is(':focus')) {
				return $searchBox.blur();
			}
			closeArticle(true);
			onMenuClick();
		}
	}

	function onLoad(e) {
		//Modernizr.csstransforms3d = false;
		$article.css('opacity', MIN_OPACITY);
		$all.find('a').attr('data-href', function() {
			return this.getAttribute('href');
		}).removeAttr('href');
		$container.isotope({
			itemSelector : 'li'
		});
	}

	function onUnload(e) {
		$window.scrollTop(0);
	}

	function onResize(e) {
		//winHeight = $window.height();
		//noScrollEvents = true;
		resized = false;
		if(articleHeight === null) {
			$container.addClass('transition');
		}
		if(articleHeight === null) {
			clearTimeout(loadAnimTimeout);
			loadAnimTimeout = false;
			firstScrollEvent = true;
			setTimeout(debounceLoadAnim, RESIZE_TIMEOUT_LEN);
		}
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
			filterTimeout = setTimeoutWithRAF(function() {
				$all.removeClass('offScreen').addClass('visible');
				$container.addClass('transition').isotope({ filter: $clicked.attr('data-filter') });
				$hidden = $([]);
				noScrollEvents = false;
			}, SOON);
		}
	}


	$window.on('click', onClick);
	$window.on('unload', onUnload);
	$window.on('resize', onResize);

	$menuLines.on('click', onMenuClick);
	$menu.on('click', onFilterClick);
	$articleClose.on('click', onCloseClick);

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
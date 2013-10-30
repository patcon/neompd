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
		winHeight = $window.height(),
		MATRIX_REGEX = /(-?\d+)/g,
		MATRIX_X = 1,
		MATRIX_Y = 2,
		DATA_ITEM_ATTR = 'isotopeItemPosition',
		FRAME = 20,
		SOON = FRAME * 3,
		OPACITY_TIMEOUT = FRAME,
		ASAP = 0,
		PADDING = 10,
		MIN_OPACITY = 0.005,
		SCROLL_TIMEOUT_LEN = 300,
		END_CLOSE_ARTICLE_TIMEOUT_LEN = 280,
		LOAD_DELAY_TIMEOUT_LEN = 400,
		RESIZE_TIMEOUT_LEN = 850,
		ANIMATION_THRESHOLD = -100,
		MAX_PER_LOAD_DEBOUNCE = 6,
		ANIMATION_EL_THRESHOLD = 3,
		WHEEL_TIMEOUT = 90,
		WHEEL_FRICTION = 35,
		WHEEL_TURN_FACTOR = 120,
		LOWER_WHEEL_FRICTION = 12,
		LOADING_Y_OFFSET = defaultVals.LOADING_Y_OFFSET,
		LEFT_BAR_OFFSET = 200,
		LOADING_GIF_HEIGHT = 122,
		firstScrollEvent = true,
		scrollTimeout,
		opacityTimeout,
		loadAnimTimeout,
		resizeTimeout,
		filterTimeout,
		unfixTimeout,
		$lower,
		$offScreenLower,
		$upper,
		$all = $container.find('li'),
		$hidden = $container.find('li'),
		$animateOnScroll = [],
		$animateOnScrollUpper = [],
		$toLoadAnim,
		articleHeight = null,
		articleTop,
		articleOpacity = 0,
		overhead,
		underhead,
		upperOffset = 0,
		lowerOffset = 0,
		lowerWinOffset = 0,
		containerHeight,
		updateScrollAnimation,
		noScrollEvents = true,
		isDoingTransition = false,
		loaded = false,
		resized = true,
		setFilter = false,
		jumpBottom = false,
		addFrictionToMouseWheel = false,
		addFrictionToMouseWheelLower = false,
		popStateScroll = null,
		popStateScrollPadding = 0,
		userTriggered = true,
		menuShown,
		isFixed,
		justOpenedArticle,
		finishCloseEventWhenScrollEnds,
		isLowerClosingState,
		isClosing,
		clickedUrl,
		curXHR,
		updateScrollbarOnClose,
		loadAnimFoundIndex,
		loadAnimCount,
		loadAnimLastFoundIndex,
		loadAnimScrollTop,
		loadAnimOffset,
		doneClosing,
		doneLoading,
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		parseInt = window.parseInt,
		history = window.history,
		requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame,
		cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame,
		abs = Math.abs,
		max = Math.max,
		min = Math.min,
		floor = function(num) {
			return ~~ num;
		};

	function setTimeoutWithRAF(fn, t) {
		return setTimeout(requestAnimationFrame.bind(this, fn), t);
	}

	function getCurTop ($el) {
		return parseInt($el.css('transform').match(MATRIX_REGEX)[MATRIX_Y], 10);
	}

	function isOnScreen ($el, scrollTop, padding, elTop) {
		var thisTop = (elTop || getCurTop($el)) + (padding || 0),
			height = $el.data(DATA_ITEM_ATTR).height;
		return (thisTop < (scrollTop + winHeight)) && (((thisTop + height) > scrollTop));
	}

	function modifyTransform (offset) {
		return function(i, val) {
			val = val.match(MATRIX_REGEX);
			return 'translate3d(' + val[MATRIX_X] + 'px, ' + (parseInt(val[MATRIX_Y], 10) + offset) + 'px, 0)';
		};
	}

	function modifyOrigTransform (offset, padding) {
		return function() {
			var val = this.matrix;
			return 'translate3d(' + val[MATRIX_X] + 'px, ' + ((padding || 0) + parseInt(val[MATRIX_Y], 10) + offset) + 'px, 0)';
		};
	}

	function finalizeEndCloseArticle() {
		if(!updateScrollbarOnClose) {
			$wrap.css('overflow', '');
		}
		if(curXHR && curXHR.abort) {
			curXHR.abort();
			curXHR = null;
			doneLoading = true;
		}

		noScrollEvents = false;
		articleHeight = null;
		firstScrollEvent = true;
		finishCloseEventWhenScrollEnds = true;

		debounceScrollClassToggling();
	}

	function finishEndCloseArticle() {
		if(! updateScrollbarOnClose) {
			$wrap.css('overflow', 'visible');
		}
		$wrap.css('height', containerHeight).removeClass('behind');
		$article.removeClass('loading loaded');
		setTimeoutWithRAF(finalizeEndCloseArticle, END_CLOSE_ARTICLE_TIMEOUT_LEN);
	}

	function endCloseArticle() {
		$offScreenLower.css('transform', modifyOrigTransform(-lowerOffset - overhead));

		$article.css('top', '-9999px').removeClass('fixed');
		$articleClose.addClass('hidden').removeClass('shown');

		setTimeoutWithRAF(finishEndCloseArticle, END_CLOSE_ARTICLE_TIMEOUT_LEN);
	}

	function endFinishScrollClose() {
		$article.addClass('fadeOut').css('opacity', MIN_OPACITY);
		$articleClose.addClass('fadeOut').removeClass('shown');
	}

	function finishScrollClose(ts, scrollTop) {
		var scrollOffset = (scrollTop || window.pageYOffset) - articleTop;

		$animateOnScroll.removeClass('offScreen').addClass('closing');
		$animateOnScrollUpper.removeClass('offScreen').addClass('closing');
		$lower.css('transform', modifyOrigTransform(-lowerOffset + scrollOffset));
		$upper.css('transform', modifyOrigTransform(overhead + scrollOffset));
		$menu.removeClass('offScreen hide').addClass('closing' + ((isFixed || isLowerClosingState) ? 'Fast' : '')).css('transform', '');

		setTimeoutWithRAF(endFinishScrollClose, FRAME);
	}

	function closeArticle (pressedButtonToClose, updateScrollbarPos, scrollTop) {
		if(articleHeight === null || isDoingTransition) {
			return;
		}
		if(opacityTimeout) {
			clearTimeout(opacityTimeout);
			opacityTimeout = false;
		}

		noScrollEvents = true;
		isClosing = true;
		userTriggered = false;

		if(pressedButtonToClose) {
			scrollTop = scrollTop || window.pageYOffset;
			updateScrollbarOnClose = true;

			if(justOpenedArticle || (!isFixed && !isLowerClosingState)) {
				$lower.css('transform', modifyTransform(scrollTop - articleTop - articleHeight + winHeight));
				$upper.css('transform', modifyTransform(scrollTop - articleTop - (justOpenedArticle && !clickedUrl ? overhead + scrollTop - articleTop : 0)));

				return requestAnimationFrame(finishScrollClose);
			}
			finishScrollClose(null, scrollTop);
		} else {
			$animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset - overhead));

			if(updateScrollbarOnClose = updateScrollbarPos) {
				$animateOnScrollUpper.css('transform', modifyOrigTransform(0));
			}
			$menu.css('transform', 'translate3d(0, 0, 0)');

			if(updateScrollbarOnClose) {
				$window.scrollTop(articleTop - overhead);
			}

			setTimeoutWithRAF(endCloseArticle, FRAME);
		}
	}

	function endGoBackAndRemoveScrollClass() {
		$all.removeClass('offScreen');
		$body.removeClass('scrolling');
		scrollTimeout = null;
		noScrollEvents = false;
		isClosing = false;
		debounceLoadAnim();
	}

	function goBackAndRemoveScrollClass() {
		if(! userTriggered) {
			history.back();
		}
		setTimeoutWithRAF(endGoBackAndRemoveScrollClass, SOON);
	}

	function removeScrollClass() {
		if(finishCloseEventWhenScrollEnds) {
			finishCloseEventWhenScrollEnds = false;
			noScrollEvents = true;
			return requestAnimationFrame(goBackAndRemoveScrollClass);
		}
		$body.removeClass('scrolling');
		scrollTimeout = null;
	}

	function addScrollClass() {
		$body.addClass('scrolling');
	}

	function applyScrollClass() {
		if(articleHeight === null) {
			requestAnimationFrame(removeScrollClass);
		}
	}

	function debounceScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			addScrollClass();
		}

		scrollTimeout = setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
	}

	function loadAnim() {
		if(isDoingTransition) {
			return setTimeoutWithRAF(loadAnim, SOON * 4);
		}

		$($toLoadAnim.splice(0, ANIMATION_EL_THRESHOLD))
			.addClass('shown').removeClass('offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET));

		if($toLoadAnim.length) {
			return setTimeoutWithRAF(loadAnim, FRAME);
		}
		loadAnimTimeout = false;
	}

	function loadAnimEach(i) {
		if(isOnScreen($(this), loadAnimScrollTop, loadAnimOffset)) {
			if(loadAnimCount === 0) {
				loadAnimFoundIndex = i;
			}
			loadAnimCount++;
			loadAnimLastFoundIndex = i;
			if(!firstScrollEvent && loadAnimCount >= MAX_PER_LOAD_DEBOUNCE) {
				return false;
			}
		} else {
			return loadAnimCount === 0;
		}
	}

	function doLoadAnim() {
		if(isDoingTransition || $hidden.length === 0) {
			return;
		}

		loadAnimFoundIndex = null;
		loadAnimCount = 0;
		loadAnimScrollTop = window.pageYOffset;
		loadAnimOffset = -LOADING_Y_OFFSET - (firstScrollEvent ? 0 : ANIMATION_THRESHOLD);

		$hidden.each(loadAnimEach);

		if(loadAnimFoundIndex !== null) {
			$toLoadAnim = ($($hidden.splice(loadAnimFoundIndex, 1 + loadAnimLastFoundIndex - loadAnimFoundIndex)));
			requestAnimationFrame(loadAnim);
		} else {
			loadAnimTimeout = false;
		}
	}

	function debounceLoadAnim() {
		//$all.removeClass('offScreen');
		if(loadAnimTimeout || !loaded) {
			return;
		}
		if  (firstScrollEvent) {
			doLoadAnim();
			return firstScrollEvent = false;
		}
		loadAnimTimeout = setTimeout(doLoadAnim,  SOON * 2);
	}

	function fadeArticle() {
		//never set opacity to 0 so webkit can recomposite layers
		if(articleOpacity < MIN_OPACITY) {
			articleOpacity = MIN_OPACITY;
		}
		$article.css('opacity', articleOpacity);
		$articleClose.css('opacity', articleOpacity);
		opacityTimeout = false;
	}

	function fixArticle() {
		$article.addClass('fixed').css('top', 0);
		if(unfixTimeout) {
			clearTimeout(unfixTimeout);
		}
		$wrap.removeClass('behind');
	}

	function finishUnFixArticle() {
		$wrap.addClass('behind');
		unfixTimeout = false;
	}

	function unfixArticle() {
		articleOpacity = 1;
		if(! opacityTimeout) {
			opacityTimeout = requestAnimationFrame(fadeArticle);
		}
		$animateOnScroll.css('transform', modifyOrigTransform(0));
		$article.removeClass('fixed').css('top', articleTop);

		unfixTimeout = setTimeoutWithRAF(finishUnFixArticle, SOON);
	}

	function handleNavigation(e) {
		var scrollTop,
			count = 0,
			centerElCount,
			navEach,
			$me,
			$clicked;
		if(!loaded) {
			return;
		}

		if(articleHeight !== null) { //back button
			closeArticle(true);
			userTriggered = true;
			popStateScrollPadding = 0;
		} else if(!isClosing) {      //forward button
			noScrollEvents = true;
			scrollTop = window.pageYOffset;
			centerElCount = $animateOnScroll.length ? $animateOnScroll.length / 2 : 5;
			$all.each(function() {
				if(isOnScreen($me = $(this), scrollTop)) {
					$clicked = $me;
					count++;
				}
				return count < centerElCount;
			}).addClass('offScreen');

			openArticle(null, $clicked);
			popStateScrollPadding = overhead;
			userTriggered = false;
		}

		if(!userTriggered || !justOpenedArticle) {
			popStateScroll = scrollTop || window.pageYOffset;
		}
	}

	function onScroll() {
		var scrollTop,
			factor,
			isAtTop,
			val;
		if(popStateScroll) {
			$window.scrollTop(popStateScroll + (articleHeight !== null ? popStateScrollPadding : 0));
			popStateScrollPadding = 0;
			return popStateScroll = null;
		}
		if(popStateScrollPadding) {
			popStateScrollPadding = 0;
		}
		if(noScrollEvents) {
			return;
		}
		if(isDoingTransition) {
			noScrollEvents = true;
			return requestAnimationFrame(endOpenArticleTransition);
		}

		if (articleHeight) {
			if ((isAtTop = (scrollTop = window.pageYOffset) <= articleTop)) {
				if(scrollTop > articleTop - overhead) {
					if (!isFixed) {
						fixArticle();
					} else {
						justOpenedArticle = false;
					}

					if (lowerOffset > winHeight) {
						val = floor(-((articleTop - scrollTop)/overhead * (lowerWinOffset + overhead)) -lowerOffset + lowerWinOffset);
					} else {
						val = floor(-(articleTop - scrollTop)/overhead * (lowerOffset + overhead));
					}
					$animateOnScroll.css('transform', modifyOrigTransform(val));

					val = abs(articleTop - scrollTop) / overhead;
					articleOpacity = (0.8 - (0.825 * val)).toFixed(2);

					if(!isFixed) {
						fadeArticle();
						addFrictionToMouseWheel = curXHR ? false : true;
						return isFixed = true;
					} else if(!opacityTimeout) {
						opacityTimeout = setTimeoutWithRAF(fadeArticle, OPACITY_TIMEOUT);
					}

					if(!updateScrollAnimation) {
						$articleClose.css('zIndex', 2);
						updateScrollAnimation = true;
					}

					if(! menuShown) {
						$menu.css('transform', 'translate3d(' + (-LEFT_BAR_OFFSET + floor(LEFT_BAR_OFFSET * val))  + 'px, 0, 0)');
					}
				} else {
					closeArticle(false, false, scrollTop)
				}
			} else if(scrollTop <= (val = articleTop + articleHeight - winHeight)) {
				// Reset article and lower blocks position
				if (isFixed) {
					isFixed = false;
					justOpenedArticle = false;
					updateScrollAnimation = true;
					unfixArticle();
				} else if (updateScrollAnimation) {
					$animateOnScrollUpper.css('transform', modifyOrigTransform(0));
					if(! menuShown) {
						$menu.css('transform', 'translate3d(' + (-LEFT_BAR_OFFSET) + 'px, 0, 0)');
					}
					updateScrollAnimation = false;
				} else if(isLowerClosingState) {
					$articleClose.css('zIndex', 3);
					articleOpacity = 1;
					if(! opacityTimeout) {
						opacityTimeout = setTimeoutWithRAF(fadeArticle, OPACITY_TIMEOUT);
					}
					isLowerClosingState = false;
				}
				if (jumpBottom) { //unjump the blocks under article so tiles go bk to proper position
					$animateOnScroll.css('transform', modifyTransform(-(underhead - lowerWinOffset)));
					jumpBottom = false;
				}
			} else if ((scrollTop > val) && (scrollTop < val + underhead)) {
				if (!jumpBottom) {  //jump blocks futher under the article so the tiles move the right amount to close properly
					$animateOnScroll.css('transform', modifyTransform(underhead - lowerWinOffset));
					addFrictionToMouseWheelLower = true;
					jumpBottom = true;
				} else if(!isLowerClosingState) {
					$wrap.removeClass('behind');
					isLowerClosingState = true;
				} else if(jumpBottom) {
					$articleClose.css('zIndex', 2);
				}

				if (lowerOffset > winHeight) {
					//wow
					val = floor(((scrollTop - val) / underhead * (underhead + upperOffset)) + articleHeight + overhead - winHeight - upperOffset);
				} else {
					val = floor((scrollTop - val) / underhead * (underhead + upperOffset));
				}
				$animateOnScrollUpper.css('transform', modifyOrigTransform(val));

				val = 1 - abs((scrollTop - (articleTop + articleHeight - winHeight + underhead)) / underhead);
				if(!menuShown) {
					$menu.css('transform', 'translate3d(' + floor(-LEFT_BAR_OFFSET + (LEFT_BAR_OFFSET * val))  + 'px, 0, 0)');
				}

				articleOpacity = (1 - (1.1 * val)).toFixed(2);
				if(! opacityTimeout) {
					opacityTimeout = setTimeoutWithRAF(fadeArticle, OPACITY_TIMEOUT);
				}
				updateScrollAnimation = true;
			}  else if (scrollTop >= val + underhead) {
				closeArticle(false, true, scrollTop);
			}
		} else {
			debounceLoadAnim();
			debounceScrollClassToggling();
		}
	}

	function updateMatrixPos() {
		this.matrix = $(this).css('transform').match(MATRIX_REGEX);
	}

	function addFilter() {
		$container.removeClass('transition');
	}

	function updateAndShowArticle() {
		$article.addClass('fadeOut').html();
	}

	function onUrlLoad(data, e) {
		if(isClosing || articleHeight === null) {
			return;
		}
		if(true || e.status === 200) {
			requestAnimationFrame(updateAndShowArticle);
		} else {
			curXHR = null;
			doneLoading = true;
			closeArticle(true);
		}
	}

	function loadUrl() {
		doneLoading = false;
		curXHR = $.ajax(clickedUrl).always(onUrlLoad);
	}

	function updateUrl() {
		if(clickedUrl) {
			history.pushState(null, null, clickedUrl);
			setTimeout(loadUrl, LOAD_DELAY_TIMEOUT_LEN);
		}
		noScrollEvents = false;
	}

	function endResizeTranstion() {
		$all.removeClass('onScreen resized').addClass('offScreen').each(updateMatrixPos);
	}

	function onArticleTransitionEnd() {
		if(doneLoading === false) {
			$article.removeClass('loading fadeOut').addClass('loaded');
			doneLoading = -1;
		} else if(doneLoading === -1) {
			$article.removeClass('loaded');
			articleHeight = $article.height();
			$container.removeClass('transition').css('height', containerHeight + articleHeight + overhead + underhead);
			lowerOffset += articleHeight - winHeight;
			$lower.css('transform', modifyTransform(articleHeight - winHeight)).each(updateMatrixPos);

			$window.scrollTop(articleTop);

			doneLoading = true;
		}
	}

	function endOpenArticleTransition() {
		var scrollTop = window.pageYOffset;
		$container.removeClass('transition').css('height', containerHeight + articleHeight + overhead + underhead);
		$lower.addClass('offScreen').removeClass('onScreen delay fwdBtn').css('transform', modifyTransform(overhead + (lowerOffset > lowerWinOffset ? lowerOffset - lowerWinOffset : 0)));
		$upper.addClass('offScreen').removeClass('onScreen').css('transform', modifyTransform(scrollTop < upperOffset ? (upperOffset * 2) - scrollTop : upperOffset));
		$articleClose.removeClass('shown').css('zIndex', 3);

		$article.removeClass('fadeIn');
		$menu.addClass('offScreen');
		noScrollEvents = true;
		$window.scrollTop(articleTop);

		$all.each(updateMatrixPos);

		isDoingTransition = false;
		updateScrollAnimation = false;
		isLowerClosingState = false;
		doneClosing = false;

		setTimeout(updateUrl, SOON * 2);
	}

	function openArticle(e, $li) {
		var $onScreenUpper,
			$onScreenLower,
			$offScreenUpper,
			li,
			$clicked,
			$oldLi,
			scrollTop,
			liTop,
			offset,
			lOffset,
			winOffset;

		if(e === null || (($clicked = $(e.target)).closest('ul').is($container) && ! $clicked.is($container))) {
			if(e) {
				e.preventDefault();
				e.stopPropagation();
			}

			if(isClosing || isDoingTransition) {
				return;
			}
			if(articleHeight !== null) {
				return closeArticle(true);
			}

			$li = $oldLi = e ? $clicked.closest('li') : $li;
			$onScreenUpper = [];
			$offScreenUpper = [];
			$upper = [];
			isDoingTransition = true;
			scrollTop = window.pageYOffset;
			upperOffset = 0;
			lowerOffset = 0;

			articleHeight = e ? winHeight : $article.height();
			containerHeight = parseInt(($wrap[0].style.height.replace('px', '') || containerHeight), 10);

			while(($li = $li.prev()).length) {
				li = $li[0];
				liTop = getCurTop($li);
				offset = liTop + $li.data(DATA_ITEM_ATTR).height - scrollTop + PADDING;
				if(offset > upperOffset) {
					upperOffset = offset;
				}
				if(isOnScreen($li, scrollTop, 0, liTop)) {
					$onScreenUpper.push(li);
				}
				else {
					$offScreenUpper.push(li);
				}
				$upper.push(li);
			}

			$li = $oldLi;
			liTop = getCurTop($li);
			lowerOffset = scrollTop + articleHeight - liTop + PADDING;
			lowerWinOffset = scrollTop + winHeight - liTop + PADDING;
			$onScreenLower = [];
			$offScreenLower = [];
			$lower = [$li[0]];

			while(($li = $li.next()).length) {
				li = $li[0];
				liTop = getCurTop($li);
				offset =  scrollTop + articleHeight - liTop + PADDING;
				winOffset = scrollTop + winHeight - liTop + PADDING;
				if (offset > lowerOffset) {
					lowerOffset = offset;
				}
				if (winOffset > lowerWinOffset) {
					lowerWinOffset = winOffset;
				}
				if(isOnScreen($li, scrollTop, 0, liTop)) {
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

			$animateOnScroll = $onScreenLower.add($oldLi);
			$animateOnScrollUpper = $onScreenUpper;

			overhead = max(winHeight, upperOffset);
			underhead = max(winHeight, lowerWinOffset);

			articleTop = scrollTop + overhead;
			offset = scrollTop < upperOffset ? upperOffset - scrollTop : 0;
			lOffset =  min(lowerWinOffset, lowerOffset);
			menuShown = false;
			isFixed = true;
			justOpenedArticle = true;
			curXHR = !!e;
			articleOpacity = 1;
			clickedUrl = e ? $oldLi.find('a').attr('data-href') : '';

			$body.removeClass('scrolling');
			$wrap.css('height', '');//.addClass('behind');
			$container.addClass('transition');
			$all.find('.shown').removeClass('shown').addClass('visible');
			$offScreenLower.addClass('offScreen');
			$offScreenUpper.addClass('offScreen');

			//requestAnimationFrame(function() {
				$onScreenUpper.removeClass('offScreen').addClass('onScreen');
				$onScreenLower.removeClass('offScreen').addClass('onScreen');
				$oldLi.removeClass('offScreen').addClass('delay ' + (e === null ? 'fwdBtn ' : '') + 'onScreen');

				$upper.css('transform', modifyTransform(-upperOffset - offset));
				$lower.css('transform', modifyTransform(lOffset));

				$article.addClass('fixed fadeIn' + (e ? ' loading' : '')).css('top', 0).css('opacity', 1).css('backgroundPosition', e ? ('50% ' + (floor(winHeight / 2) - LOADING_GIF_HEIGHT) + 'px') : '');
				$menu.removeClass('offScreen closing closingFast show').addClass('hide').css('transform', '');
				$articleClose.addClass('shown').removeClass('hidden').css('zIndex', 2).css('opacity', 1);

				$articleMenu.removeClass('hidden');
			//});
		}
	}

	function onTransitionEnd(e) {
		var	scrollOffset,
			scrollTop,
			$transitioned = $(e.target);

		if(isDoingTransition && $transitioned.hasClass('delay')) {
			return endOpenArticleTransition();
		} else if(isClosing && $transitioned.hasClass('closing') && ! doneClosing) {
			scrollTop = window.pageYOffset;
			scrollOffset = scrollTop - articleTop;
			$all.addClass('offScreen').removeClass('closing').css('transform', modifyTransform(-overhead - scrollOffset));
			$article.removeClass('fadeOut').removeClass('fixed').css('top', '-9999px');
			$articleClose.removeClass('fadeOut').addClass('hidden');
			noScrollEvents = true;
			doneClosing = true;
			$window.scrollTop(scrollTop - overhead - scrollOffset);
			requestAnimationFrame(finishEndCloseArticle);
		} else if(!loaded && $container.hasClass('initial')) {
			$hidden.addClass('offScreen');
			noScrollEvents = false;
			$body.css('opacity', 1);
			$container.removeClass('initial');
			$wrap.css('height', $container[0].style.height);
			setTimeoutWithRAF(doLoadAnim, SCROLL_TIMEOUT_LEN);
			loaded = true;
		} else if(!resized && $transitioned.hasClass('resized')) {
			setTimeout(endResizeTranstion, SOON);
			resized = true;
		} else if(!resized) {
			$container.removeClass('transition');
			resized = true;
		} else if(setFilter) {
			filterTimeout = setTimeoutWithRAF(addFilter, SCROLL_TIMEOUT_LEN);
			setFilter = false;
		}
	}

	function handleMouseWheelFriction(e) {
		var now,
			deltaY = e.wheelDeltaY;
		if (deltaY > 0) {
			if ((addFrictionToMouseWheel === true && (deltaY % WHEEL_TURN_FACTOR !== 0)) || (now = e.timeStamp) - addFrictionToMouseWheel <= WHEEL_TIMEOUT) {
				e.preventDefault();
				if(deltaY >= WHEEL_FRICTION) {
					$window.scrollTop(window.pageYOffset - floor(deltaY / WHEEL_FRICTION));
				}
				addFrictionToMouseWheel = now || e.timeStamp;
			} else {
				addFrictionToMouseWheel = false;
			}
		} else {
			addFrictionToMouseWheel = false;
		}
	}

	function handleLowerMouseWheelFriction(e) {
		var now,
			deltaY = e.wheelDeltaY;
		if (deltaY < 0 ) {
			if ((addFrictionToMouseWheelLower === true && (deltaY % WHEEL_TURN_FACTOR !== 0)) || (now = e.timeStamp) - addFrictionToMouseWheelLower <= WHEEL_TIMEOUT) {
				e.preventDefault();
				if(deltaY <= LOWER_WHEEL_FRICTION) {
					$window.scrollTop(window.pageYOffset - floor(deltaY / LOWER_WHEEL_FRICTION));
				}
				addFrictionToMouseWheelLower = now || e.timeStamp;
			} else {
				addFrictionToMouseWheelLower = false;
			}
		} else {
			addFrictionToMouseWheelLower = false;
		}
	}

	function onMouseWheel(e) {
		if(addFrictionToMouseWheel) {
			handleMouseWheelFriction(e.originalEvent);
		} else if(addFrictionToMouseWheelLower) {
			handleLowerMouseWheelFriction(e.originalEvent);
		}
	}

	function onKeyDown(e) {
		if (e.keyCode === 27) {
			if($searchBox.is(':focus')) {
				return $searchBox.blur();
			}
			closeArticle(true);
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
		noScrollEvents = true;
		$window.scrollTop(0);
	}

	function endResize() {
		if(articleHeight === null) {
			firstScrollEvent = true;
			debounceLoadAnim();
			containerHeight = parseInt($container[0].style.height.replace('px', ''), 10);
			$wrap.css('height', containerHeight);
		}
		$container.removeClass('transition');
		winHeight = $window.height();
		noScrollEvents = false;
	}

	function onResize(e) {
		noScrollEvents = true;
		if(articleHeight === null) {
			if(resized) {
				$container.addClass('transition');
			}
			if(loadAnimTimeout) {
				clearTimeout(loadAnimTimeout);
				loadAnimTimeout = null;
			}
		}
		if(resizeTimeout) {
			clearTimeout(resizeTimeout);
		}
		resizeTimeout = setTimeoutWithRAF(endResize, RESIZE_TIMEOUT_LEN);
		resized = false;
	}

	function onMenuClick() {
		$menu.removeClass('onScreen offScreen hide').addClass('show');
		menuShown = true;
	}

	function onCloseClick() {
		closeArticle(true);
	}

	function endFilterClick() {
		$all.removeClass('offScreen').addClass('visible');
		$container.addClass('transition').isotope({ filter: setFilter });
		$hidden = $([]);
		noScrollEvents = false;
	}

	function onFilterClick(e) {
		var $clicked = $(e.target).closest('li');
		if($clicked.length) {
			noScrollEvents = true;
			setFilter = $clicked.attr('data-filter');
			clearTimeout(filterTimeout);
			filterTimeout = setTimeoutWithRAF(endFilterClick, SOON * 3);
			$body.scrollTop(0);
		}
	}

	$window.on('unload', onUnload);
	$window.on('resize', onResize);
	$window.on('popstate', handleNavigation);

	if(document.location.href.toLowerCase().indexOf('?nofriction') === -1) {
		$window.on('mousewheel', onMouseWheel);
	}

	$container.on('click', openArticle);
	$menuLines.on('click', onMenuClick);
	$menu.on('click', onFilterClick);
	$articleClose.on('click', onCloseClick);

	$doc.on('scroll', onScroll);
	$doc.on('keydown', onKeyDown);

	$container.on('webkitTransitionEnd transitionend', onTransitionEnd);
	$article.on('webkitTransitionEnd transitionend', onArticleTransitionEnd);
	$container.imagesLoaded(onLoad);

	return {
		offset: function() {
			return overhead + lowerOffset;
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
			$animateOnScroll = $lower.slice(0, $animateOnScroll.length);
			$animateOnScrollUpper = $upper.slice(-$animateOnScrollUpper.length);
		},
		LOADING_Y_OFFSET: LOADING_Y_OFFSET
	};

}(Homepage));
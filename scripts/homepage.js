(function homepageGrid () {
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
		ASAP = 0,
		PADDING = 10,
		SCROLL_TIMEOUT_LEN = 350,
		LOADING_Y_OFFSET = 170,
		ANIMATION_THRESHOLD = 40,
		firstScrollEvent = true,
		scrollTimeout,
		menuOpacityTimeout,
		closeArticleTimeout,
		loadAnimTimeout,
		$lower,
		$upper,
		$all,
		$hidden = $container.find('li'),
		$clicked,
		$transitioned,
		$animateOnScroll,
		updateScrollAnimation,
		noScrollEvents = true,
		isDoingTransition = false,
		loaded = false,
		articleHeight = null,
		articleTop,
		lastScrollTop = 0,
		overhead,
		upperOffset = 0,
		lowerOffset = 0,
		upperWinOffset = 0,
		lowerWinOffset = 0,
		endArticleTransition = 400; //threshold for transitioning menu/article menu on/off at the end of article

	function getCurTop ($el) {
		return parseInt($el.css('transform').match(MATRIX_REGEX)[MATRIX_Y], 10);
	}
	function isOnScreen ($el, scrollTop, padding) {
	 	var thisTop = getCurTop($el) + (padding || 0),
	  		height = $el.height();
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
			var val = this.matrix.match(MATRIX_REGEX);
			return 'translate3d(' + val[MATRIX_X] + 'px, ' + ((padding || 0) + parseInt(val[MATRIX_Y], 10) + offset) + 'px, 0)';
		};
	}

	function setTransform (thisVal) {
		return function(i, val) {
			return 'translate3d(' + val.match(MATRIX_REGEX)[MATRIX_X] + 'px, ' + thisVal + 'px, 0)';
		};
	}

	function closeArticle (scroll, noAnimation, updateScrollbar, scrollTop) {
		var scrollTop,
			padding;
		if(!articleHeight || isDoingTransition) {
			return;
		}
		scrollTop = scrollTop || window.pageYOffset;

		if(!noAnimation) {
			$all.removeClass('offScreen').addClass('closing');
			$menu.removeClass('offScreen hide').addClass('closing');
			noScrollEvents = true;
		} else {
			$all.addClass('offScreen');
			$menu.add('offScreen');
		}

		if(scroll) {
			padding = scrollTop - articleTop < 0 ? scrollTop - articleTop : 0;
			$upper.each(function() {
				var $me = $(this);
				if(! isOnScreen($me, scrollTop, articleHeight + padding)) {
					$me.addClass('offScreen');
				}
			}).css('transform', modifyOrigTransform(articleHeight + padding));

			$lower.each(function() {
				var $me = $(this);
				if(!isOnScreen($me, scrollTop) && !isOnScreen($me, scrollTop, -articleHeight - padding) && !isOnScreen($me, scrollTop, -lowerOffset - padding)) {
					$me.addClass('offScreen');
				}
			}).css('transform', modifyOrigTransform(-lowerOffset + padding));

		} else {
			$lower.css('transform', modifyOrigTransform(-lowerOffset - overhead));
			articleHeight = articleTop = null;
		}

		$menu.css('opacity', 1);
		setTimeout(function() {
			$container.find('.shown').removeClass('shown').addClass('visible');
			$all.removeClass('lower upper offScreen shown');
			if(updateScrollbar) {
				$window.scrollTop(scrollTop - (lowerOffset * 2) - upperOffset);
			}
		}, ASAP);

		$(".article").css("opacity", 0).css("position", "absolute").css("display", "none");
	}

	function debouneScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			$container.addClass('scrolling');
		}

		scrollTimeout = setTimeout(function() {
			$container.removeClass('scrolling');
			scrollTimeout = null;
		}, SCROLL_TIMEOUT_LEN);
	}

	function doLoadAnim() {
		var foundIndex = null,
			scrollTop =  window.pageYOffset,
			$toAnim,
			lastFoundIndex;
		$hidden.each(function (i) {
			if(isOnScreen($(this), scrollTop, -LOADING_Y_OFFSET - ANIMATION_THRESHOLD)) {
				if(foundIndex === null) {
					foundIndex = i;
				}
				lastFoundIndex = i;
			} else {
				return foundIndex === null;
			}
		});
		if(foundIndex !== null) {
			$toAnim = ($($hidden.splice(foundIndex, 1 + lastFoundIndex - foundIndex)));
			setTimeout(function () {
				$toAnim.addClass('shown').removeClass('offScreen').css('transform', modifyTransform(-LOADING_Y_OFFSET));
				loadAnimTimeout = false;
			}, SOON * Math.random());
		} else {
			loadAnimTimeout = false;
		}
	}

	function debounceLoadAnim() {
		if(loadAnimTimeout || !loaded || $hidden.length === 0) {
			return;
		}

		if(firstScrollEvent) {
			doLoadAnim();
			return firstScrollEvent = false;
		}
		loadAnimTimeout = setTimeout(doLoadAnim, SOON * 2);
	}

	function onScroll(e) {
		var scrollTop, scrollAmount;

		if(noScrollEvents) {
			debouneScrollClassToggling();
			return;// debounceLoadAnim(window.pageYOffset);
		}
		if(isDoingTransition) {
			scrollTop = window.pageYOffset;
			return endTransition(scrollTop, scrollTop + lowerOffset);
		}

		scrollTop = window.pageYOffset;
		scrollAmount = scrollTop - lastScrollTop;
		lastScrollTop = scrollTop;
		if(articleHeight !== null) {
			if (scrollTop < articleTop && (scrollTop > articleTop - overhead)) {

				// TODO: get rid of all the $() on the fly to increase performance
				if ($(".short-article").css("position") !== 'fixed') {
					// Put the lower blocks right below the window to start moving up
					$animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset + lowerWinOffset));

					// Set lorem ipsum as fixed
					$(".short-article").css("position", "fixed").css("top", 0);
					$(".short-article").css("opacity", (1 - Math.abs(articleTop - scrollTop) / articleHeight).toFixed(4));

				} else {
					// Start moving up the blocks below the window
					$animateOnScroll.css('transform', modifyOrigTransform(-(articleTop - scrollTop)/overhead * (lowerWinOffset + overhead), -lowerOffset + lowerWinOffset));
					$(".short-article").css("opacity", (1 - Math.abs(articleTop - scrollTop) / winHeight).toFixed(4));

					if(menuOpacityTimeout) {
						clearTimeout(menuOpacityTimeout);
					}

					menuOpacityTimeout = setTimeout(function() {
						$menu.css('opacity', (Math.abs(articleTop - scrollTop) / winHeight).toFixed(4)).removeClass('hide');
						$articleMenu.addClass('hide');
						updateScrollAnimation = true;
						menuOpacityTimeout = null;
					}, ASAP);

				}

			} else if(scrollTop >= articleTop) {
				// Reset article and lower blocks position
				if ($(".short-article").css("position") === 'fixed') {
					$(".short-article").css("position", "absolute").css("top", articleTop);
					$animateOnScroll.css('transform', modifyTransform(lowerOffset - lowerWinOffset + overhead));
				}

				if(updateScrollAnimation) {
					$animateOnScroll.css('transform', modifyOrigTransform(0));
					updateScrollAnimation = false;
				} else if (scrollTop > articleTop + articleHeight-endArticleTransition) {
					if(menuOpacityTimeout) {
						clearTimeout(menuOpacityTimeout);
					}
					menuOpacityTimeout = setTimeout(function() {
						$menu.css('opacity', (Math.abs((articleTop + articleHeight-endArticleTransition) - scrollTop) / endArticleTransition).toFixed(4)).removeClass('hide');
						$articleMenu.addClass('hide');
						menuOpacityTimeout = null;
					}, ASAP);
				} else if (scrollTop <= articleTop + articleHeight-endArticleTransition) {
					$articleMenu.removeClass('hide');
					$menu.addClass('hide');
				} else if((scrollTop > articleTop + (articleHeight * 1.5))) {
					//if(closeArticleTimeout) {
					//	clearTimeout(closeArticleTimeout);
					//}
				//	closeArticleTimeout = setTimeout(function() {
						closeArticle(false, true, true, scrollTop);
				//		closeArticleTimeout = null;
				//	}, ASAP);
				}

			} else if(updateScrollAnimation) {
				setTimeout(function() {
					// $animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset - overhead));
					closeArticle(false, true, false, window.pageYOffset);
					updateScrollAnimation = false;
				}, ASAP);
			}
		} else {
			debounceLoadAnim();
			debouneScrollClassToggling();
		}
	}

	function endTransition(scrollTop, scrollTo) {
		$all.removeClass('onScreen delay').addClass('offScreen');
		$menu.addClass('offScreen hide');
		$lower.css('transform', modifyTransform(overhead));
		$upper.css('transform', modifyTransform(scrollTop < upperOffset ? (upperOffset * 2) - scrollTop : upperOffset));

		$all.each(function() {
			this.matrix = $(this).css('transform');
		});

		noScrollEvents = true;
		$window.scrollTop(scrollTo);
		setTimeout(function() {
			isDoingTransition = false;
			updateScrollAnimation = false;
			noScrollEvents = false;
		}, ASAP);
	}

	function handleTransitionEnd() {
		var	padding,
			scrollTop;
		if(isDoingTransition && $transitioned.hasClass('delay')) {
			return endTransition(window.pageYOffset, articleTop);

		} else if($transitioned.hasClass('closing') && noScrollEvents) {
			scrollTop = window.pageYOffset;
			padding = scrollTop < articleTop ? scrollTop - articleTop : 0;
			$window.scrollTop(scrollTop - upperOffset - lowerOffset - padding);
			$all.addClass('offScreen').removeClass('closing').css('transform', modifyTransform(-upperOffset-lowerOffset - padding)).removeClass('offScreen');
			$articleMenu.addClass('hide');
			articleHeight = articleTop = null;
			noScrollEvents = false;

		} else if(!loaded && $container.hasClass('initial')) {
			$hidden.addClass('offScreen').css('transform', modifyTransform(LOADING_Y_OFFSET));
			noScrollEvents = false;
			$body.css('opacity', 1);
			setTimeout(function() {
				doLoadAnim();
			}, SOON);
			loaded = true;
		}
	}

	function onTransitionEnd(e) {
		$transitioned = $(e.target);
		handleTransitionEnd();
		setTimeout(handleTransitionEnd, SOON);
	}

	function onClick(e) {
		var $onScreenUpper,
			$onScreenLower,
			$offScreenUpper,
			$offScreenLower,
			$li,
			$oldLi,
			scrollTop,
			targetOffset,
			offset,
			winOffset;

		if(($clicked = $(e.target)).closest('ul').is($container) && ! $clicked.is($container)) {
			e.preventDefault();
			e.stopPropagation();
			if(articleHeight !== null) {
				return closeArticle(true, false);
			}

			// Open article
			$(".short-article").css("display", "block");
			articleHeight = $(".short-article").height();

			$li = $oldLi = $clicked.closest('li');
			$onScreenUpper = [];
			$offScreenUpper = [];

			isDoingTransition = true;
			scrollTop = window.pageYOffset;
			targetOffset = scrollTop + articleHeight - getCurTop($li) + PADDING;
			upperOffset = 0,
			lowerOffset = 0;

			while(($li = $li.prev()).length) {
				if(isOnScreen($li, scrollTop)) {
					offset = getCurTop($li) + $li.outerHeight() - scrollTop + PADDING;
					if(offset > upperOffset) {
						upperOffset = offset;
					}
					$onScreenUpper.push($li[0]);
				}
				else {
					$offScreenUpper.push($li[0]);
				}
			}

			$li = $oldLi;
			lowerOffset = targetOffset;
			$onScreenLower = [];
			$offScreenLower = [];

			while(($li = $li.next()).length) {
				if(isOnScreen($li, scrollTop)) {
					offset =  scrollTop + articleHeight - getCurTop($li) + PADDING;
					winOffset = scrollTop + winHeight - getCurTop($li) + PADDING;
					if (offset > lowerOffset) lowerOffset = offset;
					if (winOffset > lowerWinOffset) lowerWinOffset = winOffset;

					$onScreenLower.push($li[0]);
				} else {
					$offScreenLower.push($li[0]);
				}
			}
			offset = scrollTop < upperOffset ? upperOffset - scrollTop : 0;
			$oldLi.addClass('delay onScreen lower').css('transform', modifyTransform(lowerOffset));
			$menu.removeClass('offScreen closing show').css('opacity', 0);
			$articleMenu.removeClass('hide');

			if($onScreenUpper.length) {
				$onScreenUpper = $($onScreenUpper);
				$onScreenUpper.addClass('onScreen upper').css('transform', modifyTransform(- upperOffset - offset));
			}
			if($offScreenUpper.length) {
				$offScreenUpper = $($offScreenUpper);
				$offScreenUpper.addClass('offScreen upper').css('transform', modifyTransform(- upperOffset - offset));
			}

			if($onScreenLower.length) {
				$onScreenLower = $($onScreenLower);
				$onScreenLower.addClass('onScreen lower').css('transform', modifyTransform(lowerOffset));
			}
			if($offScreenLower.length) {
				$offScreenLower = $($offScreenLower);
				$offScreenLower.addClass('offScreen lower').css('transform', modifyTransform(lowerOffset));
			}

			setTimeout(function () {
				// articleTop = upperOffset + lowerOffset + scrollTop;
				overhead = Math.max(winHeight, upperOffset);
				articleTop = scrollTop + overhead;
				// articleHeight = upperOffset + lowerOffset;
				$upper = $container.find('li.upper');
				$lower = $container.find('li.lower');
				$all = $container.find('li');
				if(!$onScreenLower.length) {
					$onScreenLower = $($onScreenLower);
				}
				if(!$offScreenLower.length) {
					$offScreenLower = $($offScreenLower);
				}
				$animateOnScroll = $onScreenLower.add($oldLi).add($offScreenLower.slice(0, parseInt($oldLi.length * 1.3, 10)));
				$(".short-article").css("top", articleTop).css("opacity", "1.0");
				// $(".short-article").css("position", "fixed").css("top", 0).css("opacity", "1.0");

			}, ASAP);
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
		$container.isotope({
			itemSelector : 'li'
		});
	}


	function onUnload(e) {
		$window.scrollTop(0);
		console.log("handler on unload called")
	}

	function onResize(e) {
		//$container.find('shown').removeClass('shown').addClass('visible');
		/*$hidden.css('transform', modifyTransform(-LOADING_Y_OFFSET));
		$container.addClass('initial');*/
		//winHeight = $window.height();
	}

	function onMenuClick() {
		$menu.removeClass('onScreen offScreen hide');
		setTimeout(function() {
			$menu.addClass('show');
		}, SOON);
	}

	$menuLines.on('click', onMenuClick);
	$container.on('click', onClick);
	$container.on('transitionend webkitTransitionEnd', onTransitionEnd);
	$container.imagesLoaded(onLoad);
	$doc.on('scroll', onScroll);
	$doc.on('keydown', onKeyDown);
	//$window.ready(function(){ $window.scrollTop(0); console.log("refresh top"); });
	$window.on('unload', onUnload);
	$window.on('resize', onResize);

	$(document).ready(function(){
	    setTimeout(function(){
	        window.scrollTo(0, 0);
	    }, 500);
	});
}());

var Homepage = (function homepage(defaultVals, window, $, undefined) {
	'use strict';

	/* Cached Jquery DOM Items */
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

	/* Dynamic heights that need to be updated */
		winHeight = $window.height(), //height of the viewport
		containerHeight, //height of the masonry container
		articleHeight = null, //height of the article, if === null, there is no visible article

	/* Constants to help parse the translate3d values from style.transform and from Isotope data  */
		MATRIX_REGEX = /(-?\d+)/g,
		MATRIX_X = 1,
		MATRIX_Y = 2,
		DATA_ITEM_ATTR = 'isotopeItemPosition',

	/* Rendering timeout constants */
		FRAME = 20,
		SOON = FRAME * 2,
		OPACITY_TIMEOUT = FRAME,
		OPACITY_TIMEOUT_LOWER = FRAME * 2,
		ASAP = 0,

	/*Page Rendering Constants */
		PADDING = 10,  // padding between masonry items   todo: remove this
		LEFT_BAR_OFFSET = 200,
		LOADING_GIF_HEIGHT = 66,
		MIN_OPACITY = 0.005, // the minimum amount of opacity to give the article so (0 could cause it to be removed from GPU memory, so we don't "totally" hide it)
		LOADING_Y_OFFSET = defaultVals.LOADING_Y_OFFSET, //how far to animate the itms during the "infinite scroll" transition
		ANIMATION_THRESHOLD = -100,  // how much to offset when determining if a masonry item is onscreen (or not) for the "infinite scroll" transition, a negative value will leave that much whitespace at the bottom - a positive value could be a perf hit but looks nicer for the user

	/* Debouncing event timeouts */
		SCROLL_TIMEOUT_LEN = 300,  // how long to wait before re-applying the non-scrolling styles
		END_CLOSE_ARTICLE_TIMEOUT_LEN = 280, // how long to wait before adding heavy style calcuations (like changing page height) during the closeArticle transition
		LOAD_DELAY_TIMEOUT_LEN = 400, // min time to show the loading icon for  todo: refactor or remove this
		RESIZE_TIMEOUT_LEN = 850, // how long to wait before filtering masonry items after a page resize

	/* Page Event Constants */
		MAX_PER_LOAD_DEBOUNCE = 6, // number of items to do the "infinite scroll" transition on before debouncing
		ANIMATION_EL_THRESHOLD = 3, // number of items to render per frame during the "infinite scroll" transition (note must be less than or equal to MAX_PER_LOAD_DEBOUNCE)
		WHEEL_TIMEOUT = 100, // the maximum amount a single swipe (mousewheel) event should take - we use this to find the first swipe and apply friction
		WHEEL_FRICTION = 24, // how much friction to apply to a single swipe NOTE this is currently webkit specific and can be approximated by 3. IE 6 is 2* friction, 3 is "no friction", 24 is 8 times friction etc
		LOWER_WHEEL_FRICTION = 24, // how much friction to apply at the bottom of an article
		WHEEL_TURN_FACTOR = 120, // in webkit, if a "swipe" is a multiple of 120, it is a mousewheel event and not a swipe

	/* Page State Globals */
		firstScrollEvent = true, // boolean value to determine if the next scroll event is the first one in the masonry view
		$all = $container.find('li'), // all masonry items
		$lower, // in article view, items that are below the clicked item
		$offScreenLower, // in article view, items that are below the clicked item AND offscreen
		$animateOnScroll = [], // in article view, items that are below the clicked item AND onscreen
		$upper, // in article view, items that are above the clicked item
		$animateOnScrollUpper = [], //in article view, items that are above the clicked item AND onscreen
		articleTop, //the scrollTop of the article
		articleOpacity = 0, //How much opacity the article has (to be applied after opacityTimeout fires)
		upperOffset = 0, //In article view, this is how many Y pixels we needed to subtract from $upper
		lowerOffset = 0, //In article view, this is how many Y pixels we needed to add to $lower
		overhead, //In article view, this is how many Y pixels we needed to subtract from $upper if an article is less than 100% height   todo: remove this
		underhead, //In article view, this is how many Y pixels we needed to add to $lower if an article is less than 100% height         todo: remove this
		lowerWinOffset = 0, //In article view, this is how many Y pixels we need to add to $lower to make them transition off the screen, but no further
		resetBlocks,  //When scrolling, this let's us know if we need to move the blower blocks up to allow for a scroll to close at the the top
		jumpBottom = false,  //When scrolling, this let's us know if we need to move the lower blocks down to allow for a scroll to close at the bottom
		noScrollEvents = true, //Cancel our scroll event handler
		isDoingTransition = false, //We're currently opening an article with a transition
		loaded = false, //the Page is loaded
		resized = true, //the page's resize handler has fired
		setFilter = false, //a left side bar filter is about to be set
		addFrictionToMouseWheel = false, //Add friction to the mousewheel for the next "swipe" when scrolling up
		addFrictionToMouseWheelLower = false, //Add friction to the mousewheel for the next "swipe" when scrolling down
		popStateScroll = null, //Add friction to the mousewheel for the next "swipe" when scrolling up
		pressedBackBtn = true, //The back button was just pressed
		lastWasPressedBackBtn, //The back button was pressed to return from the previous article
		menuShown, //The menu was shown by the user in article view
		isFixed, //In article view, the article has a css position of fixed, this is at the "top" of an article
		isLowerClosingState, //This indicates that the users is near the bottom of an article and about to close
		justOpenedArticle, //In article view, the article was just opened, this is used to avoid fixing and refixing just after an article is opened
		finishCloseEventWhenScrollEnds, //This indicates that on the next debounced scroll event, we must clean up the navigation for a user (ie they scrolled to close an article)
		isClosing, //This keeps track of whether we're currently running a close transition
		closingScrollOffset, //the amount we're adjusting the blocks before closing with the closing transition
		doneClosing, //Flag indicating whether we've done the transitionEnd for the 'closing' transition
		doneLoading, //Flag inidcating whether we've done the transitionEnd for the article loading transition
		clickedUrl, //This is the URL that the user just clicked on
		curXHR = null, // The XHR used to AJAX in articles, this is set to null when it's not executing
		updateScrollbarOnClose, //Used by close article in function unwinding to pass around state - basically this is true when the user scrolled to close
		modifyTranformStaticOffset, //Used by modifyTransform and modifyOrigTransform's static Implementations to avoid creating anonFns

	/* Infinite Scroll state vars */
		$hidden = $container.find('li'), //all hidden masory items, this will be modifed by the "infinite scroll" transition
		$toLoadAnim, //items that were onscreen and need to be shown on the next "infinite scroll" animation frame
		loadAnimFoundIndex,
		loadAnimCount,
		loadAnimLastFoundIndex,
		loadAnimScrollTop,
		loadAnimOffset,

	/* Timeouts, used for clearing and setting timeouts */
		scrollTimeout, //debounce scroll class timeout
		loadAnimTimeout, //debounce infinite scroll timeout
		resizeTimeout, //delay resize page event timeout
		opacityTimeout, //delay opacity transition timeout (during article view scroll)
		filterTimeout, //apply opacity filter timeout
		unfixTimeout, //delay unfixing of article timeout


	/* Cached quick lookup and vendor prefixes, could probably remove these */
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



/********************************************************************************
	HELPERS
********************************************************************************/
/* Delay execution of a requesAnimationFrame, used to spread rendering across frames */
	function setTimeoutWithRAF(fn, t) {
		return setTimeout(requestAnimationFrame.bind(this, fn), t);
	}

/* Get the current Y position of a given masonry item */
	function getCurTop ($el) {
		return parseInt($el.css('transform').match(MATRIX_REGEX)[MATRIX_Y], 10);
	}

/* Determine if masonry items are on the screen */
	function isOnScreen ($el, scrollTop, padding, elTop) {
		var thisTop = (elTop || getCurTop($el)) + (padding || 0),
			height = $el.data(DATA_ITEM_ATTR).height;
		return (thisTop < (scrollTop + winHeight)) && (((thisTop + height) > scrollTop));
	}

/* Move a masonry item from its current Y position by a given offset - Static impl to avoid creating Anon Fns */
	function modifyTransformStatic(i, val) {
		val = val.match(MATRIX_REGEX);
		return 'translate3d(' + val[MATRIX_X] + 'px, ' + (parseInt(val[MATRIX_Y], 10) + modifyTranformStaticOffset) + 'px, 0)';
	}
	function modifyTransform (offset) {
		modifyTranformStaticOffset = offset;
		return modifyTransformStatic;
	}

/* Move a masonry item from its post openArticle position by a given offset - Static impl to avoid creating Anon Fns */
	function modifyOrigTranformStatic(i, val) {
		val = this.matrix;
		return 'translate3d(' + val[MATRIX_X] + 'px, ' + (parseInt(val[MATRIX_Y], 10) + modifyTranformStaticOffset) + 'px, 0)';
	}
	function modifyOrigTransform (offset) {
		modifyTranformStaticOffset = offset;
		return modifyOrigTranformStatic;
	}

/* This is called on popState, we handle the forward and back buttons here */
	function handleNavigation(e) {
		var scrollTop,
			count = 0,
			len,
			centerElCount,
			$clicked;

		//webkit calls popState when the page first loads, ignore that
		if(!loaded) {
			return;
		}

		if(articleHeight !== null) { //back button
			closeArticle(true);
			pressedBackBtn = true;
		} else if(!isClosing) {      //forward button
			noScrollEvents = true;
			scrollTop = window.pageYOffset;
			centerElCount = (len = $animateOnScroll.length) ? len / 2 : 4;
			$all.each(function() {
				var $me = $(this);
				if(isOnScreen($me, scrollTop)) {
					$clicked = $me;
					count++;
				}
				return count < centerElCount;
			}).addClass('offScreen');

			pressedBackBtn = false;
			openArticle(null, $clicked);
		}
		//if the user didn't scroll when the article was open
		if(!justOpenedArticle || ((isClosing || lastWasPressedBackBtn) && !pressedBackBtn)) {
			popStateScroll = scrollTop || window.pageYOffset;
		}
		lastWasPressedBackBtn = pressedBackBtn;
	}


/********************************************************************************
	CLOSE ARTICLE
********************************************************************************/

/* The last of the closeArticle pipline functions to run, this function cleans up the height of the page, resets state and gets ready for when the user is finished scrolling */
	function finalizeEndCloseArticle() {
		if(!updateScrollbarOnClose) {
			$wrap.css('overflow', '');
		}
		//cancel the current article loading as the user is trying to close that article
		if(curXHR && curXHR.abort) {
			curXHR.abort();
			doneLoading = true;
		}
		curXHR = null;

		noScrollEvents = false;
		articleHeight = null;
		firstScrollEvent = true;

		 //we will have some cleaning up to do when the user is done scrolling, this is why we debouceScrollClassToggling here
		finishCloseEventWhenScrollEnds = true;
		debounceScrollClassToggling();
	}

/*  Move the article offscreen, and also begin the cleaning up of the height of the page. Note that when closing without scrolling, this fn will be called after the 'close' transition is over */
	function finishEndCloseArticle() {
		if(! updateScrollbarOnClose) { //if the user is scrolling down to close, we need to apply the overlow visible immediately, otherwise we can wait until finalizeEndCloseArticle
			$wrap.css('overflow', 'visible');
		}
		//set the page wrapper back to the old page height
		$wrap.css('height', containerHeight).removeClass('behind');

		$article.removeClass('loading loaded');
		setTimeoutWithRAF(finalizeEndCloseArticle, END_CLOSE_ARTICLE_TIMEOUT_LEN);
	}

/*  Move the article offscreen, and also begin the cleaning up of the height of the page */
	function endCloseArticle() {
		$offScreenLower.css('transform', modifyOrigTransform(-lowerOffset - overhead));

		$article.css('top', '-9999px').removeClass('fixed');
		$articleClose.addClass('hidden').removeClass('shown');

		setTimeoutWithRAF(finishEndCloseArticle, END_CLOSE_ARTICLE_TIMEOUT_LEN);
	}

/*  After a user closes an article without scrolling, we hide the article on subsuquent animationFrames */
	function endfinishNonScrollClose() {
		$article.addClass('fadeOut').css('opacity', MIN_OPACITY);
		$articleClose.addClass('fadeOut').removeClass('shown');
	}

/*  After a user closes an article without scrolling, we move the masonry items back to their old position and reshow the menu */
	function finishNonScrollClose(ts, scrollTop) {
		closingScrollOffset = (scrollTop || window.pageYOffset) - articleTop;

		$animateOnScroll.removeClass('offScreen').addClass('closing');
		$animateOnScrollUpper.removeClass('offScreen').addClass('closing');
		$lower.css('transform', modifyOrigTransform(-lowerOffset + closingScrollOffset));
		$upper.css('transform', modifyOrigTransform(overhead + closingScrollOffset));
		$menu.removeClass('offScreen hide').addClass('closing' + ((isFixed || isLowerClosingState) ? 'Fast' : '')).css('transform', '');

		setTimeoutWithRAF(endfinishNonScrollClose, FRAME);
	}

/*  Close a currently open article, this is the only entry point to closing an article (scrolling or not) */
	function closeArticle (pressedButtonToClose, updateScrollbarPos, scrollTop) {
		if(articleHeight === null || isDoingTransition) {
			return;
		}
		if(opacityTimeout) {
			clearTimeout(opacityTimeout);
			opacityTimeout = false;
		}

		//dont allow any scrollevents through and also prevent articles from being closed twice
		noScrollEvents = true;
		isClosing = true;
		pressedBackBtn = false;

		if(pressedButtonToClose) {
			scrollTop = scrollTop || window.pageYOffset;
			updateScrollbarOnClose = true;

			//move the masonry items to the right spot if they are "far" apart so the transition looks smooth
			if(justOpenedArticle || (!isFixed && !isLowerClosingState)) {
				$lower.css('transform', modifyTransform(scrollTop - articleTop - articleHeight + winHeight));
				$upper.css('transform', modifyTransform(scrollTop - articleTop - (justOpenedArticle && !clickedUrl ? overhead + scrollTop - articleTop : 0)));

				return requestAnimationFrame(finishNonScrollClose);
			}
			//otherwise run the transition immediately
			finishNonScrollClose(null, scrollTop);
		} else { //this is when a user scrolled to close
			//move the onscreen masonry items and the menu back to their original position and kick of the closeArticle function pipline
			$animateOnScroll.css('transform', modifyOrigTransform(-lowerOffset - overhead));

			if(updateScrollbarOnClose = updateScrollbarPos) {
				$animateOnScrollUpper.css('transform', modifyOrigTransform(0));
			}
			$menu.css('transform', 'translate3d(0, 0, 0)');

			//get rid of the overhead we created so that the user could scroll to close
			if(updateScrollbarOnClose) {
				$window.scrollTop(articleTop - overhead);
			}

			//kick off the close Article pipeline
			setTimeoutWithRAF(endCloseArticle, FRAME);
		}
	}




/********************************************************************************
	SCROLL DEBOUNCING
********************************************************************************/

/* After closing an article, we wait until the user is DONE scrolling, we then remove the scrolling class and clean up the article */
	function endGoBackAndRemoveScrollClass() {
		$all.removeClass('offScreen');
		$body.removeClass('scrolling');
		scrollTimeout = null;
		noScrollEvents = false;
		isClosing = false;
		debounceLoadAnim();
	}

/* After closing an article, we wait until the user is DONE scrolling, and then kick off a clean up */
	function goBackAndRemoveScrollClass() {
		if(! pressedBackBtn) {
			history.back();
		}
		setTimeoutWithRAF(endGoBackAndRemoveScrollClass, SOON);
	}

/* Remove the scrolling class after the user is done scrolling in masonry view */
	function removeScrollClass() {
		if(finishCloseEventWhenScrollEnds) {
			finishCloseEventWhenScrollEnds = false;
			noScrollEvents = true;
			return requestAnimationFrame(goBackAndRemoveScrollClass);
		}
		$body.removeClass('scrolling');
		scrollTimeout = null;
	}

/* Add the scrolling class when the user starts scrolling in masonry view */
	function addScrollClass() {
		$body.addClass('scrolling');
	}

/* Add the scrolling class when the user starts scrolling in masonry view on the next animation frame */
	function applyScrollClass() {
		if(articleHeight === null) {
			requestAnimationFrame(removeScrollClass);
		}
	}

/* Handle debouncing of adding/removing scrolling class */
	function debounceScrollClassToggling () {
		if(scrollTimeout) {
			clearTimeout(scrollTimeout);
		} else {
			addScrollClass();
		}

		scrollTimeout = setTimeout(applyScrollClass, SCROLL_TIMEOUT_LEN);
	}




/********************************************************************************
	INFINITE SCROLL
********************************************************************************/

/* RAF Loop the actually applies the infinite scroll transition over multiple frames based on ANIMATION_EL_THRESHOLD */
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

/* Determine if a masonry item is onscreen, this Fn is to be called by $.each */
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

/* Determine if hidden masonry items were scrolled onscreen and if there were, they need the infinite scroll transition applied */
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
			//splice out the actual DOM items to be animated and kick off the animation
			$toLoadAnim = ($($hidden.splice(loadAnimFoundIndex, 1 + loadAnimLastFoundIndex - loadAnimFoundIndex)));
			requestAnimationFrame(loadAnim);
		} else {
			//nothing to animate
			loadAnimTimeout = false;
		}
	}

/* Debounce the infinite scroll transition*/
	function debounceLoadAnim() {
		//$all.removeClass('offScreen');
		if(loadAnimTimeout || !loaded) {
			return;
		}
		//on the first scroll event in the masonry view, no need to debounce
		if  (firstScrollEvent) {
			doLoadAnim();
			return firstScrollEvent = false;
		}
		loadAnimTimeout = setTimeout(doLoadAnim,  SOON * 2);
	}





/********************************************************************************
	ON SCROLL IN ARTICLE VIEW
********************************************************************************/

/*Fade the article, called by RAF */
	function fadeArticle() {
		//never set opacity to 0 so webkit can recomposite layers
		if(articleOpacity < MIN_OPACITY) {
			articleOpacity = MIN_OPACITY;
		}
		$article.css('opacity', articleOpacity);
		$articleClose.css('opacity', articleOpacity);
		opacityTimeout = false;
	}

/*Fix the article, this is called when the user is scrolling up to close */
	function fixArticle() {
		$article.addClass('fixed').css('top', 0);
		if(unfixTimeout) {
			clearTimeout(unfixTimeout);
		}
		$wrap.removeClass('behind');
	}

/* Second step of unfixing the article, called by RAF */
	function finishUnFixArticle() {
		$wrap.addClass('behind');
		unfixTimeout = false;
	}

/*UnFix the article, this is called when the user is scrolling down out of the fixed article view */
	function unfixArticle() {
		articleOpacity = 1;
		if(! opacityTimeout) {
		//	opacityTimeout = requestAnimationFrame(fadeArticle);
		}
		$animateOnScroll.css('transform', modifyOrigTransform(0));
		$article.removeClass('fixed').css('top', articleTop);
		unfixTimeout = setTimeoutWithRAF(finishUnFixArticle, SOON * 2);
	}

/* When the article is fixed and the user scrolls, we adjust the onscreen lower masonry items with the scroll event */
	function moveFixedItems(scrollTop) {
		var val;
		if (lowerOffset > winHeight) {
			val = floor(-((articleTop - scrollTop)/overhead * (lowerWinOffset + overhead)) -lowerOffset + lowerWinOffset);
		} else {
			val = floor(-(articleTop - scrollTop)/overhead * (lowerOffset + overhead));
		}
		$animateOnScroll.css('transform', modifyOrigTransform(val));
	}

	function doJumpBottom() {
		$animateOnScroll.css('transform', modifyOrigTransform(underhead - lowerWinOffset));
	}

	function doResetBlocks() {
		$animateOnScrollUpper.css('transform', modifyOrigTransform(0));
		if(! menuShown) {
			$menu.css('transform', 'translate3d(' + (-LEFT_BAR_OFFSET) + 'px, 0, 0)');
		}
		$articleClose.css('zIndex', 3);
		$wrap.addClass('behind');
		if (jumpBottom) { //unjump the blocks under article so tiles go bk to proper position
			requestAnimationFrame(doJumpBottom);
			jumpBottom = false;
		}
	}

/* This is the main onscroll handler, all the magin happens here, check inline comments */
	function onScroll() {
		var scrollTop,
			factor,
			isAtTop,
			isAtBottom,
			val;
		//reset the scrollbar after the URL bar changes
		if(popStateScroll !== null) {
			$window.scrollTop(popStateScroll);
			return popStateScroll = null;
		}
		//don't allow any scroll events to occur, this is mostly used to prevent this listener from firing after WE update the scrolltop (not the user)
		if(noScrollEvents === true) {
			return;
		}
		//if we're doing the open article transition (the user is restless!), we need to clean up from that before allowing any other scroll events
		if(isDoingTransition === true) {
			noScrollEvents = true;
			return requestAnimationFrame(endOpenArticleTransition);
		}

		//run this code when the article is open
		if (articleHeight !== null) {
			if ((isAtTop = (scrollTop = window.pageYOffset) <= articleTop)) {
				if(scrollTop > articleTop - overhead) {
					if (!isFixed) {
						fixArticle();
						addFrictionToMouseWheel = !curXHR;
						return isFixed = true;
					} else {
						justOpenedArticle = false;
					}

					moveFixedItems(scrollTop);

					val = abs(articleTop - scrollTop) / overhead;
					articleOpacity = (0.8 - (0.825 * val)).toFixed(2);

					if(! opacityTimeout) {
						fadeArticle();//opacityTimeout = setTimeoutWithRAF(fadeArticle, OPACITY_TIMEOUT);
					}

					if(!resetBlocks) {
						$articleClose.css('zIndex', 2);
						resetBlocks = true;
					}

					if(! menuShown) {
						$menu.css('transform', 'translate3d(' + (-LEFT_BAR_OFFSET + floor(LEFT_BAR_OFFSET * val))  + 'px, 0, 0)');
					}
				} else {
					closeArticle(false, false, scrollTop);
				}
			} else if(scrollTop <= (val = articleTop + articleHeight - winHeight)) {
				// Reset article and lower blocks position
				if (isFixed) {
					isFixed = false;
					justOpenedArticle = false;
					resetBlocks = true;
					jumpBottom = true;
					unfixArticle();
				} else if (resetBlocks) {
					requestAnimationFrame(doResetBlocks);
					resetBlocks = false;
				} else if(isLowerClosingState) {
					articleOpacity = 1;
					if(! opacityTimeout) {
						fadeArticle();
						//opacityTimeout = setTimeoutWithRAF(fadeArticle, OPACITY_TIMEOUT_LOWER);
					}
					isLowerClosingState = false;
				}
			} else if ((scrollTop > val) && (scrollTop < val + underhead)) {
				if(!isLowerClosingState) {
					addFrictionToMouseWheelLower = !curXHR;
					$wrap.removeClass('behind');
					isLowerClosingState = true;
				} else if(!jumpBottom) {
					$articleClose.css('zIndex', 2);
					jumpBottom = true;
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
					fadeArticle();
					//opacityTimeout = setTimeoutWithRAF(fadeArticle, OPACITY_TIMEOUT_LOWER);
				}
				resetBlocks = true;
			}  else if (scrollTop >= val + underhead) {
				closeArticle(false, true, scrollTop);
			}
		} else { //run this code when the article is NOT open
			debounceLoadAnim();
			debounceScrollClassToggling();
		}
	}



/********************************************************************************
	OPEN ARTICLE
********************************************************************************/

	function updateMatrixPos() {
		this.matrix = $(this).css('transform').match(MATRIX_REGEX);
	}

	function updateAndShowArticle() {
		$article.addClass('fadeOut');
	}

	function onUrlLoad(e) {
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
		var scrollTop;

		if(doneLoading === false) {
			if(isClosing || articleHeight === null) {
				curXHR = null;
				return doneLoading = true;
			}
			articleHeight = $article[0].scrollHeight;
			lowerOffset += articleHeight - winHeight;
			$article.removeClass('loading fadeOut').addClass('loaded');
			doneLoading = -1;
			//isDoingTransition = true;
		} else if(doneLoading === -1) {
			//noScrollEvents = true;
			$article.removeClass('loaded');
			$container.removeClass('transition').css('height', containerHeight + articleHeight + overhead + underhead);
			$lower.css('transform', modifyOrigTransform(articleHeight - winHeight)).each(updateMatrixPos);
			if((scrollTop = window.pageYOffset) < articleTop) {
				moveFixedItems(scrollTop);
			}
			isDoingTransition = false;
			curXHR = null;
			doneLoading = true;
		}
	}

	function endOpenArticleTransition() {
		var scrollTop;
		if(isClosing || articleHeight === null) {
			return;
		}

		scrollTop = window.pageYOffset;
		$container.removeClass('transition').css('height', containerHeight + articleHeight + overhead + underhead);
		$articleClose.removeClass('shown').css('zIndex', 3);
		$lower.addClass('offScreen').removeClass('onScreen delay fwdBtn').css('transform', modifyTransform(overhead + lowerOffset - lowerWinOffset));
		$upper.addClass('offScreen').removeClass('onScreen').css('transform', modifyTransform(scrollTop < upperOffset ? (upperOffset * 2) - scrollTop : upperOffset));

		$article.removeClass('fadeIn');
		$menu.addClass('offScreen');
		noScrollEvents = true;
		$window.scrollTop(articleTop);

		$all.each(updateMatrixPos);

		isDoingTransition = false;
		resetBlocks = false;
		isLowerClosingState = false;

		setTimeout(updateUrl, SOON * 3);
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

			articleHeight = e ? winHeight : $article[0].scrollHeight;
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
			//lOffset =  min(lowerWinOffset, lowerOffset);
			menuShown = false;
			isFixed = true;
			justOpenedArticle = true;
			doneClosing = false;
			curXHR = !!e;
			articleOpacity = 1;
			clickedUrl = e ? 'article.html' : '';

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
				$lower.css('transform', modifyTransform(lowerWinOffset));

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

		if(e) {
			e.preventDefault();
			e.stopPropagation();
		}

		if(isDoingTransition && $transitioned.hasClass('delay')) {
			endOpenArticleTransition();
		} else if(isClosing && $transitioned.hasClass('closing') && ! doneClosing) {
			scrollTop = window.pageYOffset;
			$all.addClass('offScreen').removeClass('closing').css('transform', modifyTransform(-overhead - closingScrollOffset));
			$article.removeClass('fadeOut').removeClass('fixed').css('top', '-9999px');
			$articleClose.removeClass('fadeOut').addClass('hidden');
			noScrollEvents = true;
			doneClosing = true;
			$window.scrollTop(scrollTop - overhead - closingScrollOffset);
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


/********************************************************************************
	MOUSE WHEEL FRICTION
********************************************************************************/

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
			handleMouseWheelFriction(e);
		} else if(addFrictionToMouseWheelLower) {
			handleLowerMouseWheelFriction(e);
		}
	}




/********************************************************************************
	SIMPLE EVENT HANDLERS
********************************************************************************/

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

		$all.attr('data-href', function() {
			var $link = $(this).find('a'),
				href = $link.attr('href');
			$link.removeAttr('href');
			return href;
		});

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

	function addFilter() {
		$container.removeClass('transition');
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




/********************************************************************************
	EVENT HANDLER INVOCATION
********************************************************************************/

	$window.on('unload', onUnload);
	$window.on('resize', onResize);
	$window.on('popstate', handleNavigation);

	$container.on('click', openArticle);
	$menuLines.on('click', onMenuClick);
	$menu.on('click', onFilterClick);
	$articleClose.on('click', onCloseClick);
	$doc.on('keydown', onKeyDown);

	//native handlers for extra perf
	window.addEventListener('scroll', onScroll, true);
	$container[0].addEventListener('webkitTransitionEnd', onTransitionEnd);
	$article[0].addEventListener('webkitTransitionEnd', onArticleTransitionEnd);
	if(document.location.href.toLowerCase().indexOf('?nofriction') === -1) {
		window.addEventListener('mousewheel', onMouseWheel, true);
	}

	//$container.imagesLoaded(onLoad);
	$window.on('load', onLoad);




/********************************************************************************
	HOMEPAGE OBJECT
********************************************************************************/
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

}(Homepage, window, jQuery));
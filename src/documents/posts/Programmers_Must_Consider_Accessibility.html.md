---
title: "Programmers Must Consider\nAccessibility"
isPost: true
tag: "technology design"
color: "black"
header: "Programmers Must\nConsider Accessibility"
summary: Accessibility should be considered throughout development.
layout: blog
coverimg: "/images/articles/Programmers_Must_Consider_Accessibility/cover.jpg"
tileimg: "/images/articles/Programmers_Must_Consider_Accessibility/tile.jpg"
authorimg: "/images/avatar/Jeremy_Lichtman.png"
author: "Jeremy Lichtman"
date: "2013-08-10"
tilestyle: "image"
---

Below this paragraph is a completely black image, 300 pixels by 300 pixels in size.


Somewhere in this image, in a randomly selected position, is a single pixel that has a JavaScript attached to it. Click on that pixel, and a message will appear. Happy hunting!

![](/images/articles/Programmers_Must_Consider_Accessibility/body_1.jpg)

Obviously this is a silly and contrived example. How about this one though?

img[javascript_menu.jpg]

The image above is a snapshot from Gmail. The menu is largely created via JavaScript. I left Firebug open so that you can get a feel for what a text-to-voice reader would see.

Imagine that you were visually disabled. It would be virtually impossible to use, right?

Alternatively, imagine that you were a developer, and you needed to use some kind of automation software to test this. Yes, you could script it to click on an exact spot, but what if the menu changed location based on context?

Here's one more example, courtesy of a co-worker:

The following is a [YouTube video](https://www.youtube.com/watch?v=KxNpmq-5lnQ) showing somebody signing in ASL. Now try searching for this video based on its content.

You probably know where I'm going with this, don't you?

Every programmer, myself definitely included, has built software that produces output that is really horribly inconvenient for a whole bunch of people with disabilities. In fact, virtually every line of code that I've ever written likely falls under that category.

That isn't a pleasant thought, and I want to try in some small way to make up for all those hundreds of thousands of inaccessible lines of code. Perhaps in writing this short piece I can influence other programmers to start thinking hard about this important topic.

I'm not going to give you solutions to the conundrums above. There are many exceptionally well written books on the topic of accessible software. Why not pick one up and see if it is possible to do better?

* My apologies to Google for the above examples. I don't want to pick on them specifically - I just want to use examples that are familiar to many people.
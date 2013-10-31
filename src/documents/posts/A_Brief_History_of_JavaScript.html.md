---
title: "A Brief Historyof JavaScript"
isPost: true
tag: "technology"
color: "orange"
header: "A Brief History of\nJavaScript"
summary: "It’s been five years since the first copies of Douglas Crockford’s “JavaScript: the Good Parts” hit bookshelves. A lot has changed since."
layout: blog
coverimg: "/images/articles/A_Brief_History_of_JavaScript/cover.jpg"
tileimg: "/images/articles/A_Brief_History_of_JavaScript/tile.jpg"
authorimg: "/images/avatar/Neil_Taylor.png"
author: "Neil Taylor"
date: "2013-04-08"
tilestyle: "image"
---

Now regarded as the language’s “Genesis”, [The Good Parts](http://www.amazon.ca/JavaScript-Good-Parts-Douglas-Crockford/dp/0596517742) revolutionized the way developers used “[the world’s most misunderstood](http://www.crockford.com/javascript/javascript.html)” language by de-mistyfing its core principles and laying out its best practices. 

Around the same time, a 22-year-old senior at the Rochester Institute of Technology named John Resig presented a project at BarCamp NYC. Frustrated by a lack of standardization from browser vendors, Resig’s “jQuery” aimed to simplify JavaScript’s interaction with those non-standard APIs via simple wrappers and adapters. A short while later, Resig [discussed](http://ejohn.org/blog/selectors-in-javascript/) and eventually implemented the ability to query the DOM with JavaScript via CSS selectors.

These concepts, coupled with best practices presented by Crockford and others, empowered an army of informed developers to create engaging JavaScript experiences that weren’t just “best viewed in Internet Explorer 5”. The browser was beginning to be viewed as a real application framework for which JavaScript (and jQuery) was the glue. Fuel was added to the fire in late 2008 when [Yahoo! presented](http://www.slideshare.net/natekoechley/professional-frontend-engineering) the concept of “front-end engineering” for the web at the @media conference in London. Prior to this, much of the professional software world saw the front-end of browsers as a place for ‘non-developers’ to mess with simple scripting and presentation.

> “Why not just drop a few ‘&amp;nbsp;’s in there?"

Google, Twitter, Microsoft and others followed suit and, before long, JavaScript and front-end engineering was being practiced by some of the world’s top software companies and talent. As these developers demanded that browser vendors conform to the W3C’s standardized view of the web, APIs slowly improved and new browsers and tools were born. Fast-forward five years and the plugin-less, standardized web is a reality. And in this new reality, one thing is clear: JavaScript dominates the web’s programming landscape. If you’re not on the JS train, you’re missing out - and fast.

Here’s why:

## HTML5 APIs are mature

To create desktop-style experiences on the web, developers needed desktop-style JavaScript APIs. “Real” applications need things like file system access, cross-domain communication, offline-access and drag-and-drop. After years of fragmentation with vendor quirks, Flash-based shims and named-anchor hacks, browser vendors have finally implemented and exposed these APIs in a standard way. [HTML5](http://html5rocks.com/) has enabled web-developers to create apps with the performance and functionally of native/desktop apps with one standard code base. These APIs are implemented across millions of devices, including all major smartphones. “Build it once” is finally true - and we don’t even need Java applets!

## JavaScript MVC Frameworks allow for rapid development

MVC is far from a new paradigm in front-end development.  Languages like Smalltalk and Ruby have been pushing [Model-View-Controller](http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) as a design pattern for GUI programming since the 70s. To put it simply, MVC makes a clear division between domain data and presentation data: Models fetch data and return it, Views deal with displaying that data, and Controllers link the models and views together. hen JavaScript  projects get large, the complexity can become overwhelming. MVC frameworks help by simplifying and facilitating the separation of data and presentation in the browser.

Furthermore, modern frameworks like Angular, Ember and Backbone help modern JS developers in much the same way that jQuery helped developers five years ago: by simplifying and facilitating best practices via standard APIs. Some examples of these include [two-way data binding](http://docs.angularjs.org/guide/dev_guide.templates.databinding), templating, dependency injection, and unit testing built right in.

## Node.js

[Node.js](https://www.google.ca/url?sa=t&amp;rct=j&amp;q=&amp;esrc=s&amp;source=web&amp;cd=1&amp;ved=0CC8QFjAA&amp;url=http%3A%2F%2Fnodejs.org%2F&amp;ei=v2FaUdiWJ_Wn4AOs9IGQBQ&amp;usg=AFQjCNE4Ts3F1ZWcYkLwsfNqE6RHZgUpyg&amp;sig2=Ax0MOu8amuEKOHKytu5_rw&amp;bvm=bv.44442042,d.dmg) is a JavaScript programming system designed for writing web server applications. It has native server bindings (read: there’s no need for Apache) and its libUV abstraction layer is a fully featured API built on solid C/UNIX foundations. Because of JavaScript’s event-driven nature, Node is able to maximize server scalability and I/O throughput. It’s also powered by Google’s v8 JS engine, which gives developers access to Ecmascript5 features - and it's pretty darn fast. Working in Node is a joy for a seasoned JS developer, but it’s also surprisingly powerful and expressive for those coming from more statically bound systems. [Give it a shot](https://github.com/joyent/node/wiki/Installation), you’ll love it! Node comes with a [fantastic package manager](https://npmjs.org/), so it’s easy to get your hands on projects like [Socket.io](https://www.google.ca/url?sa=t&amp;rct=j&amp;q=&amp;esrc=s&amp;source=web&amp;cd=1&amp;cad=rja&amp;ved=0CDIQFjAA&amp;url=http%3A%2F%2Fsocket.io%2F&amp;ei=bWBaUc1s08TgA4TagOgB&amp;usg=AFQjCNG8kzehIcRMCwXVQUB46eWDrmNbdA&amp;sig2=ksPbjpL0S3TzQCVBHnUdBA&amp;bvm=bv.44442042,d.dmg), which brings yet another desktop concept to JavaScript developers: sockets programming.

Another cool project is Yahoo!’s [Mojito](http://developer.yahoo.com/cocktails/mojito/docs/intro/mojito_overview.html#why-mojito), which allows developers to write one JavaScript code-base and abstract away its execution to either the browser or the server, depending on the situation. That’s real “build it once”, and it’s here today.

## JavaScript as a glue for the web

JavaScript speaks the web’s languages natively: JSON, CSS, DOM, HTTP- they all talk to JavaScript, whether in the browser or on the server. With just a few simple Node scripts, a developer can power an entire website: build scripts (including linting), testing suites (including DOM queries and access), and even publishing can easily be accomplished with JavaScript. In fact, with all of the native support built-in, there’s no simpler way to do it.

## JS REPLs are everywhere

Ask a good JS developer to execute their code and they’ll probably ask you “Where?”. They’ve got so many choices, it’s almost overwhelming! JavaScript engines are embedded in a lot of software these days and that’s a good thing because a [Read-Evaluate-Print-Loop](http://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop), or REPL, is the best way to learn a programming language. In a REPL, a user enters an expression and it is evaluated immediately, with the results being printed to the screen. Think of typing ‘1 + 1’ in to the firebug console and having it spit back ‘2’. With so many REPLs hanging around, JavaScript can be learned by practically anyone, which is a great thing for an aspiring JS developer in 2013!

JavaScript has come a long way in 5 years, and 2013 is a really exciting time to be a part of the community. If you haven’t jumped in to JS yet, [what are you waiting for?](https://developer.mozilla.org/en-US/docs/JavaScript/Guide)
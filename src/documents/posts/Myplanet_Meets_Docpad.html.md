---
title: "Myplanet Meets DocPad"
isPost: true
tag: "technology"
color: "green"
header: "Myplanet Meets\nDocPad: A Next Gen\nWeb Framework"
summary: How we learned to embrace the simplicity of static site generation and the power of new web browser technology.
layout: blog
coverimg: "/images/articles/Myplanet_Meets_Docpad/cover.jpg"
tileimg: "/images/articles/Myplanet_Meets_Docpad/tile.jpg"
authorimg: "/images/avatar/Yashar_Rassoulli.png"
author: "Yashar Rassoulli"
date: "2013-07-18"
tilestyle: ""
---

## CMS-Free websites

Almost a year ago today Patrick (our DevOps Imagineer) shared an enlightening article around how Development Seed (a once very prominent Drupal based company) was now building what they called "CMS-Free Websites". In essence, they were using external APIs to supplement basic web development paradigms allowing for their teams to build on scalable and fault-tolerant infrastructure.

Fast-forward to December 2012 when Erin and our Strategy and Support Group were looking for something to take their pre-existing markdown documentation and get it presentable for clients without a lot of maintenance overhead. After a recommendation to use Jekyll (a static site generator), Erin and team rapidly prototyped and built what's now called our "MP Loves" collection of sites; a resource for our clients to support their engagements with Myplanet.

<div class="full-width">
	<div class="image-block">
		<img src="/images/img1.jpg"/>
		<img src="/images/img2.jpg"/>
		<img src="/images/img3.jpg"/>
		<img src="/images/img4.jpg"/>
	</div>
</div>

[]

Around the same time that the “MP Loves” site was being built we became increasingly interested in alternative ways to experiment and prototype without having to use Drupal, which was often for light back-end sites, setup heavy.  Coincidentally, Savvis Enterprise had an interesting interactivity challenge to solve with their network topologies and our prototyping team embraced Backbone.js to build the highly interactive site by jumping almost immediately into the code.

It felt good to build an application that leveraged new browser capabilities to work offline, save state, behaved almost exactly as you intended to and that only until recently the big boys at Google could build. Further, with the release of many SaaS based web development tools, like Easel.io for front-end development, Cloud9 as a web-based IDE and Kinvey as a BaaS there was little reason that our now client-heavy JS code ever had to hit our local development environments. From this and our painful battle with getting Drupal to play well with CI best practices it felt like there was a better way to deliver more value faster for our clients in instances where the back-end rigour of Drupal wasn’t a necessity.

<img src="/images/img5.jpg"/>

From that the idea for SaaSy CMS was born. A CMS that embraced the simplicity of static site generation that our Strategy and Support Group leveraged but also allowed for dynamic interactions that made Savvis Symphony so powerful.

After researching a good starting point for SaaSy, the team found that DocPad, a next generation web framework built on Node.js, shared some best practices our team believed in. A couple of months of hard work later, our SaaSy team built a proof of concept that was demoed at our last State Of The Universe and was well received by the broader company.

We were now ready to show the world the power yet simplicity of SaaSy and contribute back what we hope to be a part of many web developer’s tool kits in the future. We reached out to Benjamin Lupton, the Founder of DocPad, to join us for the month of July to open source and contribute SaaSy back to the DocPad community.

> It felt good to build an application that leveraged new browser capabilities to work offline, save state, behaved almost exactly as you intended to and that only until recently the big boys at Google could build.

Our plan by month end is to have an alpha community release of SaaSy available. Benjamin also has other highly valuable DocPad contributions he'll be getting out this month that will support SaaSy and push DocPad's capabilities greatly forward.
We look forward to sharing our experiences with DocPad and SaaSy back with you. If you’re in the Toronto area join us next Tuesday at the upcoming Node.js meetup. Details will be announced shortly! 

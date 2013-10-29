---
title: "Migrating to Drupal 7: Book Review"
isPost: true
tag: "technology"
color: "black"
header: Migrating to Drupal 7: Book Review
summary: Migrating content from an existing site to a shiny new Drupal site can seem like a daunting task. Fortunately, the ever-helpful Drupal community has some time-saving solutions: there are a number of modules designed specifically to make content migration automatic, easy and fast.
layout: blog
coverimg: ""
tileimg: ""
authorimg: "/images/avatar/Yashar_Rassoulli.png"
author: "Yashar Rassoulli"
date: "2013-04-15"
tilestyle: ""
---

Whether you're importing data from an external data set, converting a site from another CMS to Drupal, or migrating a site between Drupal versions, there's a module for that!

## Migrating to Drupal 7

A few months ago, I was asked to review **[_Migrating to Drupal 7_, by Trevor James](http://www.packtpub.com/migrating-to-drupal-7/book)**. I was naturally quite interested, because I had recently upgraded the website for my second job from Drupal 6 to 7.

_Migrating to Drupal 7_ covers four possible migration strategies:

*   Migrating from a flat-file dataset (such as a CSV, XML or JSON file) using [Feeds](http://drupal.org/project/feeds)
*   Migrating from a relational database using [Migrate](http://drupal.org/project/migrate)
*   Converting a Wordpress site into a Drupal site using Migrate
*   Upgrading from Drupal 6 to 7

![](/sites/default/files/images/20131504112147.png)

## Importing flat datasets

The [Feeds module](http://drupal.org/project/feeds) makes it easy to import simple datasets that can be contained in a single file, such as a CSV, XML or JSON file, into nodes of a certain type.

You start by setting up a content type, adding fields and the like. Then, you install Feeds and create a "feeds importer": basically a mapping between fields in your data file and fields in the content type. Once that's set up, you can start the import and it'll add a new node for each entry in your file.

You can combine this method with the [Feeds Tamper ](http://drupal.org/project/feeds_tamper)module to ensure that data is imported in the appropriate format.

Feeds is also cool because you can run the importer more than once. If there's a way to uniquely identify a piece of content, Feeds can update (or even delete) that piece of content if the next file you import includes changes.

And, all this can be done by just clicking your way around the interface — no custom code required!

Myplanet has successfully used this method to import Drupal Commerce product data in<span style="line-height: 1.538em;"> two of our largest e-commerce projects.</span>

## Converting an existing database

The [Migrate module ](http://drupal.org/project/migrate)is perhaps more robust than the Feeds module- ideal for importing from custom applications or other content management systems.

Using its API, you can describe exactly how to import from an existing, relational dataset to the corresponding Drupal dataset. Unlike Feeds, however, you can convert more than one type of object in the original database to more than one type of object in the Drupal database. To do this, however, you need to be able to write PHP code.

_Migrating to Drupal 7_ doesn't walk you through how to write the code, but it does explain the necessary steps to set up an importer and to execute it. 

## Migrating from another CMS

If you're coming to Drupal from another CMS, you may find that someone has already written and published a module to ensure a seamless transition (e.g.: [Wordpress](http://drupal.org/project/wordpress_migrate), [phpBB](http://drupal.org/project/phpbb2drupal) and[TYPO3](http://drupal.org/project/TYPO3_migrate)).

## Upgrading from D6 to D7

The final approach to content migration is built in to core — migrating from earlier versions of Drupal.

In the interest of continuously evolving Drupal, different versions usually have slightly-different APIs. Therefore, an "upgrade" between Drupal versions is really more like a migration from an old paradigm to a new one.

As I discovered while migrating the [Brady's ](http://bradysmeats.com/)website, core does a great job, but you need a few contributed modules too. Fortunately, _Migrating to Drupal 7_  provides suggestions for helpful modules to use when upgrading your Drupal site. 

## Conclusion and Review

_Migrating to Drupal 7_ is a great resource aimed at people with a beginner-to-intermediate knowledge of Drupal. It's filled with clear explanations and step-by-step instructions for configuring your Drupal site to migrate content, which includes a number of real-world use cases.

I'd recommend this book to tech-savvy clients as well as developers — I wish I had a copy when I was migrating my own sites because it would've made things a lot smoother. I'll definitely refer to it in the future!

You can grab a copy of this book from [Packt Press](http://www.packtpub.com/migrating-to-drupal-7/book) or [Amazon](http://www.amazon.ca/dp/B00ATM05OU).
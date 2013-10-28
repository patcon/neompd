---
title: "Introducing Drupal's Clean Markup Module"
isPost: true
tag: "technology"
color: "black"
header: Introducing Drupal's Clean Markup Module
summary: We're excited to announce the official release of the Clean Markup module.
layout: blog
coverimg: "/images/articles/Introducing_Drupals_Clean_Markup_Module/cover.jpg"
tileimg: "/images/articles/Introducing_Drupals_Clean_Markup_Module/tile.jpg"
authorimg: "/images/avatar/Rene_Hache.png"
author: "Rene Hache"
date: "2013-08-16"
tilestyle: "image"
---

Conceptualized and coded by [myself](https://drupal.org/user/64478) and [Matt Parker](https://drupal.org/user/536298), the [Clean Markup module](https://drupal.org/project/clean_markup) aims to clean up, enhance and facilitate the customization of markup for Drupal core and several popular contrib modules such as [Panels](https://drupal.org/project/panels "Panels project page").

## Features

As of version 2.x:

### **Blocks**

### From each individual block's configuration page (click "configure" on the block management screen), you can:

*   Disable or set the HTML5 element to use as the block wrapper,
*   Enable or disable an inner div,
*   Add classes to the outer block element,
*   Add custom attributes (i.e. role="navigation")
*   Set the HTML5 element to wrap the title,
*   Toggle whether the block title is displayed visually,
*   Disable or set the HTML5 element to wrap the content.

### **Panel panes**

### By changing the pane style to "Clean markup" (click the gear in the top-right of a pane and click "Change" under "Style"), you can:

*   Disable or set the HTML5 element to use as the pane wrapper,
*   Enable or disable an inner div,
*   Add classes to the outer pane wrapper,
*   Add custom attributes (i.e. role="navigation")
*   Set the HTML5 element to wrap the title,
*   Toggle whether the block title is displayed visually,
*   Disable or set the HTML5 element to wrap the content.

### **Panel regions**

### By changing the region style to "Clean markup" (click the gear in the top-left of a region and click "Change" under "Style"; or click "Display settings" on the panel itself), you can:

*   Disable or set the HTML5 element to use as the region wrapper,
*   Enable or disable an inner div,
*   Add classes to the outer region element,
*   Add custom attributes (i.e. role="navigation")
*   Enable or disable separator divs between panes in the region.

### **Panel Layouts**

### Layouts have been provided to take advantage of Clean Markup's ability to output the minimal amount of markup.

1.  **One Column Clean**: one region and single wrapper.
2.  **One Column Reset**: one region with no wrapper.
3.  **Six pack**: six regions.
4.  **Myriad**: five rows with four regions each that will output the absolute minimum markup. For example, a row with only one region will not output the row wrapper.

Future enhancements will include full markup control for [Views](https://drupal.org/project/views).
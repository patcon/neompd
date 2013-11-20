---
title: "Launching With Zero Update Hooks"
tagList: ["technology"]
header: "Launching With Zero\nUpdate Hooks"
summary: ...and 5 other reasons to use Drupal's custom_config module.
layout: blog
coverImageUrl: ""
tileImageUrl: ""
authorImageUrl: "/images/avatar/Sebastian_Lesch.png"
author: "Sebastian Lesch"
date: "2013-10-10"
---

The [SmartCentres](http://www.smartcentres.com/) project was built using an "[installation profile](http://drupal.org/developing/distributions)" development strategy.

For those who are not familiar with it, the brief summary mentions a cleaner, leaner codebase resulting in a more stable development process that is reproducible from team member to team member. Many [Drupal](http://drupal.org/) teams are using this process and this is fantastic step forward.

The [Custom Config module](https://github.com/sebsebseb123/custom_config) can be found on [github](https://github.com/sebsebseb123/custom_config) and aims to build on top of the "installation profile" development strategy.

1) **A faster way to update.**
<span style="font-family:courier new,courier,monospace;">hook_update_N</span> is a great place for database alters, data migration, or other larger tasks. In our workflow, however, we've been using </span><span style="font-family:courier new,courier,monospace;"><span style="line-height: 1.538em;">hook_update_N</span></span><span style="line-height: 1.538em;"> to execute single lines such as </span><span style="line-height: 1.538em;"><span style="font-family:courier new,courier,monospace;">module_enable('some_module')</span> or <span style="font-family:courier new,courier,monospace;">variable_set('some_var', 123)</span></span><span style="line-height: 1.538em;">. This leads to install files being way larger and uglier than they should be. </span><span style="line-height: 1.538em;">"Run Install Hooks"</span><span style="line-height: 1.538em;">, and </span><span style="line-height: 1.538em;">"Run Post Install"</span><span style="line-height: 1.538em;"> are introduced to replace the need for </span><span style="font-family:courier new,courier,monospace;"><span style="line-height: 1.538em;">hook_update_N</span></span><span style="line-height: 1.538em;">. Hitting the </span><span style="line-height: 1.538em;">"Run Install Hooks"</span><span style="line-height: 1.538em;"> or </span><span style="line-height: 1.538em;">"Run Post Install"</span><span style="line-height: 1.538em;"> callback pages will use the module's own </span><span style="font-family:courier new,courier,monospace;"><span style="line-height: 1.538em;">custom_config_module_implements</span></span><span style="line-height: 1.538em;"> function to find hooks and install files only from our custom or features modules. In order for this to happen, custom and features modules must use the folder structure convention of modules/custom or modules/features. But, all other contrib install hooks are ignored, so we're free to safely hit the </span><span style="line-height: 1.538em;">"Run Post Install" </span><span style="line-height: 1.538em;">page without worry of contrib modules.

2) **Helper functions.**
If you're creating or updating blocks, running queries, or adding terms, Custom Config is there to help. We've got a small handful of hooks you can implement to do most of these setup tasks. Checkout custom_config.api.php to find out how to implement these.

3) **The ever exciting post-install phase.**
Block modifications, queries, and terms are all executed after the entire site is built. Using <span style="font-family:courier new,courier,monospace;">hook_init</span> and a custom variable, the module is able to tell if this is the first time a page is being hit after installing. This is important if you need to ensure that features modules are installed and have properly setup their respective blocks, vocabularies, or some other requirement is met. Also, using <span style="font-family:courier new,courier,monospace;">hook_postinstall</span> you can run any commands after ensuring that the entire site is installed and configured.

4) **A place for custom configuration.**
From time to time, a project requires a custom configuration form. The question eventually pops up, where does this page live? There's never a single good answer to this, <span style="font-family:courier new,courier,monospace;">custom_config</span> tries to help by creating a menu item where custom configuration forms should live. Also, that page has two tabs by default "Run Install Hooks", and "Run Post Install" which simply serve as callbacks

5) **Drush integration.**
If you're into drush, and I don't know why you wouldn't be, then you'll be happy to hear that both callbacks to run the install and post-install hooks are available as drush commands: <span style="font-family:courier new,courier,monospace;">drush cc-ri</span> and <span style="font-family:courier new,courier,monospace;">drush cc-rpi</span>

So, the next time you're starting a project as an installation profile, give custom_config a look over, and think about how it might help you!

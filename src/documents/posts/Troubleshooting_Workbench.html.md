---
title: "Troubleshooting Workbench \n"
isPost: true
tag: "technology"
color: "black"
header: "Troubleshooting Workbench"
summary: A handy guide to some of the common problems encountered when trying to set up Workbench in Drupal.
layout: blog
coverimg: "/images/articles/Troubleshooting_Workbench/cover.jpg"
tileimg: "/images/articles/Troubleshooting_Workbench/tile.jpg"
authorimg: "/images/avatar/Anna_Sunko.png"
author: "Anna Sunko"
date: "2013-04-12"
tilestyle: ""
---

## Intro to Workbench

If you already know what this module is and does, [skip to the pot of gold](#wisdom).

Before explaining the problems we've encountered while implementing Workbench, I'd like to describe the use-case for Workbench and list its major features.

Content administrators need a friendly interface to quickly find, sort, and modify content. But the Drupal content management interface, while functional, lacks some of the convenience that Workbench offers. It's also often desirable to distinguish between users and/or roles which have different permissions through the publishing workflow. For example, users in one role may need to moderate revisions of only their own content while users of another role may need to manage all revisions and have authority to publish. Drupal's core modules don't enable this publishing workflow exactly, though Drupal supports content revisions. Based on this concept of revisions, a package of modules were created to flesh out this functionality and provide content administrators a robust content management and publishing interface -- that package includes Workbench, Workbench Access, and Workbench Moderation.

After enabling Workbench module, any user with "Access My Workbench" permission gets access to a new admin-menu item called "My Workbench", and content owned or modified by the current user is available in sub-menu item called "My Content".

Drupal provides permissions for adding, editing, and deleting content -– that is to add/edit/delete one's own content as well as another's content. Workbench Access module extends these permissions to provide editorial access controls based on what Workbench calls "sections". Sections of content correspond to the hierarchal placement of that content via taxonomy or menu and users can be assigned to specific sections so they can add or moderate content within them. While creating and editing content, a user can associate their content to a specific section and Workbench Access module then helps control who can collaborate on that piece of content -- who can see, edit, approve, publish, etc.

The Workbench Access module settings page provides the ability to indicate which Drupal hierarchical data structures will be used as sections and for which content types Workbench Access restrictions will be imposed. As well, this module provides a UI so you can assign users or roles to specific sections.

In Drupal, every content revision is in one of two states: published or unpublished. The Workbench Moderation module provides more states for unpublished content so it can be reviewed and approved before being published. For a content type to support moderation states you need to "Enable moderation of revisions" on the content type settings page, and disable immediate publication of content on its creation. On the settings page of this module you can specify additional moderation states and transitions but the standards are "draft", "needs review", and "published". Workbench Moderation module generates separate permissions based on all transitions to control which roles/users can transition the content from one state to another. For the "node/%nid" page, the modules provide an additional tab called "Moderate" where node revision history is available and you can change moderation state for the active revision.

## Are You Using Workbench and Field Collection Modules?

First, regardless of Workbench integration, we had to solve a problem with Field Collection module whereby fields of the field collection type couldn't be deleted thoroughly -- i.e: if you create a field of the field collection type and then delete it, tables containing _values_ of this field were removed (data table and revision table), but meta-information _about_ the deleted field still exists in `field_config_instance`, `field_config` and `field_collection_item` tables.

This problem led to errors while running cron –- the system would encounter information about the deleted field collection field in `field_config_instance`, then would try to form an instance of that field, then of course encounter errors. To solve this problem we wrote a `hook_update` to delete all artifacts of the offending field collection fields.

## `hook_update` code

    $instances = field_read_instances(array('deleted' => 1),
                 array('include_deleted' => 1));
    // Array of fields that should be deleted
    $deleted = array('field_some_field_collection_field');
    foreach ((array) $instances as $key => $instance) {
        if (in_array($instance['field_name'], $deleted)) {
            // Removing record related with field
            // from field_config_instance table
            field_purge_instance($instance);
            $field = field_info_field_by_id($instance['field_id']);
            // Removing record related with field
            // from field_config table
            field_purge_field($field);
            // Removing record related with field
            // from field_collection_item table
            db_delete('field_collection_item')->condition(
              'field_name', $instance['field_name'])->execute();
        }
    }

Expected behavior of nodes moderated via Workbench workflow:

*   after saving draft of node, none of changes should appear on the "View published" page
*   after saving draft of node, all changes should be saved as a part of draft and could be changed within the draft
*   the draft could be published and all its changes would be shown on the "View published" page

But the field collection module, including version "field_collection 7.x-1.0-beta4", doesn't support field revisions. This means that when a user clicks to save a draft of their node, all field collection fields associated with that node are published immediately (without respecting Workbench's moderation status). The full implementation of a revision system for field collection has existed since version "7.x-1.0-beta5", and at the time of this writing it is the current stable version of this module.

However, while using "7.x-1.0-beta5" version of the module, a serious problem was discovered wherein a node would simultaneously exist in a published and unpublished state -- go figure!?! After deleting one of the multiple field collection fields and moving node to published state using Workbench's "Moderate" tab, the node status in the node table became "unpublished", while the Workbench Moderation module would add a record that the node had been published to its own table. We were able to fix it with this [patch](http://drupal.org/files/field_collection_with_workbench_moderation-1807460-1.patch).

## Workbench Moderation with Views 3.5 and Content Access modules

The specificity of using these modules together is that their combination leads to a problem of excluding unpublished nodes from results of Workbench views "My Content", "My Drafts", "Needs Review" for the user who has permissions for creating and editing unpublished content, except for cases when the user has the 'Bypass content access control' permission set. It means that the user creates a node draft and can't find it on "My Drafts" page.

The description of this problem can be found [here](http://drupal.org/node/1925096). We were able to solve this problem by installing an additional module '[view_unpublished](http://drupal.org/project/view_unpublished)'.

## Symptom

A user who has created drafts of nodes cannot find said drafts on Workbench's "My Drafts" page.

## Explanation of Cause

When using these versions of the modules together (Workbench Moderation, Views 3.5, and Content Access), unpublished nodes would be excluded from the result set while viewing "My Content", "My Drafts", "Needs Review" by any user who has permissions for creating and editing unpublished content -- except for cases when a user may have 'Bypass content access control' permission.

Tip: _Read that again!_

### Solution

A complete description of this problem can be found at [drupal.org/node/1925096](http://drupal.org/node/1925096). We were able to solve this problem by installing and configuring the [view_unpublished](http://drupal.org/project/view_unpublished) module.

## Workbench Moderation and Scheduler modules

The Scheduler module doesn't play nice with the Workbench Moderation module. When Scheduler publishes or unpublishes a node on a specified date it changes the node status in the "node" table. _Period._

For example, if a node was in an unpublished state and the Scheduler module publishes it, the node page will display a discrepancy. The Node module will show that node is published but the Workbench Moderation module will display its previous state as "draft" or "needs review".

If you are using Workbench Moderation and Scheduler together, it's essential that Workbench be informed of this change. When a node status is changed from "draft" to "published" or vice versa, a new record must be added to the "workbench_moderation_node_history". For Workbench Moderation module to interact with Scheduler module you should install [Scheduler Workbench Integration](http://drupal.org/project/scheduler_workbench) module.

## Workbench Moderation and Views modules

The expected behavior of Views while displaying information about a node on the node view page is:

* On the "View Draft" page (`node/%nid/draft`), Views should display data from current unpublished revision
* On the `node/%nid` page, Views should display data from the current published revision (if there is one, otherwise it should display data from current unpublished revision -- same as the "View Draft" page)
* On the `node/%nid/revisions/%revision_id/view` page, Views should display data from revision passed as `%revision_id` in the url.

For Views to fulfill the above requirements:

* Change the base table of the view from "node" to "node_revision" (when creating a view on `admin/structure/views/add` page there is a field called "Show" where we can choose the instance to be shown in the view. For our purposes, set this field to "Content revisions")
* The view should derive content from fields revision tables (marked as "Content historical data")
* Set an argument for the view to get argument from current "vid", not from "nid" (in the "Contextual filters" area add "Content revision: Vid" argument). The type of this argument should be "PHP Code". In the "PHP contextual filter code" set custom a function that determines the correct node revision vid:

        function get_node_revision_by_nid($nid = NULL) {
            if (arg(0) == 'node' && $nid == NULL) {
                $nid = arg(1);
            }
            if (is_numeric($nid)) {
                $node = node_load($nid);
                if (!empty($node)) {
                    // getting vid on the
                    // node/%nid page
                    $vid = $node->vid;
                    if (arg(2) == 'draft' &&
                            isset($node->workbench_moderation['current']->vid) &&
                            ($node->vid != $node->workbench_moderation['current']->vid)) {
                        // getting vid on the node/%nid/draft page
                        $vid = $node->workbench_moderation['current']->vid;
                    }
                    if (arg(2) == 'revisions' && is_numeric(arg(3))) {
                        // getting vid on the
                        // node/%nid/revisions/%revision_id/view page
                        $vid = arg(3);
                    }
                }
                return $vid;
            }
        }

I'm Anna and I approve this message ;)
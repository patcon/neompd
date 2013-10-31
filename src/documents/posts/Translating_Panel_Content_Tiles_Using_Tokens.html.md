---
title: "Translating Panel Content Titles Using Tokens"
isPost: true
tag: "technology"
color: "black"
header: "Translating Panel Content\nTitles Using Tokens" 
summary: We recently encountered a specific situation with a Drupal site that had to be retro-fitted for translation.
layout: blog
coverimg: "/images/articles/Translating_Panel_Content_Tiles_Using_Tokens/cover.jpg"
tileimg: "/images/articles/Translating_Panel_Content_Tiles_Using_Tokens/tile.jpg"
authorimg: "../images/avatar/Jeremy_Lichtman.png"
author: "Jeremy Lichtman"
date: "2013-07-10"
tilestyle: ""
---

The titles of content items within a panel page are not translatable.

There is an issue in the queue for panels, but it has been open for two years now, and it is unlikely to be resolved any time soon. There are also many somewhat hackish work-arounds - i.e. using blocks with the title inserted as content instead - but we found a cleaner way to do this using tokens, which panels do provide support for.

If you've ever coded a custom block, the methodology for creating tokens will look familiar. In a custom module, you first implement hook_token_info(), which lets Drupal know about the list of tokens that your module will provide, and then implement hook_tokens(), which actually outputs the content of the code.

</span><span class="kwd">function</span><span class="pln"> test_token_info</span><span class="pun">()</span><span class="pln"> </span><span class="pun">{</span><span class="pln">
	$type </span><span class="pun">=</span><span class="pln"> array</span><span class="pun">(</span><span class="pln">
		</span><span class="str">'name'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> t</span><span class="pun">(</span><span class="str">'Test Tokens'</span><span class="pun">),</span><span class="pln">
		</span><span class="str">'description'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> t</span><span class="pun">(</span><span class="str">'Tokens for i18n experiment.'</span><span class="pun">)</span><span class="pln">
	</span><span class="pun">);</span><span class="pln">

$test</span><span class="pun">[</span><span class="str">'test_panel_translation_title'</span><span class="pun">]</span><span class="pln"> </span><span class="pun">=</span><span class="pln"> array</span><span class="pun">(</span><span class="pln">
	</span><span class="str">'name'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> t</span><span class="pun">(</span><span class="str">"Test title translation"</span><span class="pun">),</span><span class="pln">
	</span><span class="str">'description'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> t</span><span class="pun">(</span><span class="str">'Translatable version of panel content title'</span><span class="pun">),</span><span class="pln">
</span><span class="pun">);</span><span class="pln">

</span><span class="kwd">return</span><span class="pln"> array</span><span class="pun">(</span><span class="pln">
		</span><span class="str">'types'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> array</span><span class="pun">(</span><span class="str">'test'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> $type</span><span class="pun">),</span><span class="pln">
		</span><span class="str">'tokens'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> array</span><span class="pun">(</span><span class="str">'test'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> $test</span><span class="pun">),</span><span class="pln">
	</span><span class="pun">);</span><span class="pln">
</span><span class="pun">}</span></code></pre>

The code, above, lets Drupal know what this module produces in the way of tokens. The $type array contains information that will be displayed about the module itself, and the $test array contains information about the token itself. You can add many tokens into the $test array, of course (and name the array appropriately for your module as well).

    <span class="pln">
    </span><span class="com">/**
      * Implements hook_tokens().
      */</span><span class="pln">

    </span><span class="kwd">function</span><span class="pln"> test_tokens</span><span class="pun">(</span><span class="pln">$type</span><span class="pun">,</span><span class="pln"> $tokens</span><span class="pun">,</span><span class="pln"> array $data </span><span class="pun">=</span><span class="pln"> array</span><span class="pun">(),</span><span class="pln"> array $options </span><span class="pun">=</span><span class="pln"> array</span><span class="pun">()){</span><span class="pln">
    	</span><span class="kwd">return</span><span class="pln"> array</span><span class="pun">(</span><span class="pln">
    		</span><span class="str">'test_panel_translation_title'</span><span class="pln"> </span><span class="pun">=&gt;</span><span class="pln"> t</span><span class="pun">(</span><span class="str">'My title is now translatable'</span><span class="pun">),</span><span class="pln">
    	</span><span class="pun">);</span><span class="pln">
    </span><span class="pun">}</span>

The code, above, actually produces the contents of the token. Note that we have wrapped our text in t(), so it is translatable.

You'll obviously need to enable your module (in addition to the [token module](https://drupal.org/project/token)) and clear your cache.

Now let's see how we can use the new token inside of panels.

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_1.jpg)

As you can see, we need to first add something into your panel that lets it know that you are going to be using tokens. After you add in tokens, you'll see your new tokens listed.

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_2.jpg)

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_3.jpg)

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_4.jpg)

Now we can actually change our content title to a token.

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_5.jpg)

The token appears in the list of available substitutions, so you don't need to remember it.

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_6.jpg)

ou'll need to select the "Use context keywords" option so that panels knows that it needs to make substitutions on tokens in this content item.

Aside: We can also use tokens inside of content itself.

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_7.jpg)

If you are exporting your panel to code (i.e. with features), the token will appear in the actual code as well.

![](/images/articles/Translating_Panel_Content_Titles_Using_Tokens/body_8.jpg)

As you can see, using tokens is a simple method, producing clean, easy to document code, for translating items in Drupal that are otherwise hard to make translatable.







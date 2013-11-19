---
title: "So, you wanna OOP with JavaScript?"
tag: "technology"
header: "So, you wanna OOP\nwith JavaScript?"
summary: JavaScript is not your typical, run-of-the-mill Object Oriented language. It is an object-oriented language but not in a typical way.
layout: blog
coverimg: "/images/articles/So_you_wanna_OOP_with_JavaScript/cover.jpg"
tileimg: "/images/articles/So_you_wanna_OOP_with_JavaScript/tile.jpg"
authorimg: "../images/avatar/Anand_Sharma.png"
author: "Anand Sharma"
date: "2013-06-25"
tilestyle: ""
---

## Disclaimer: JavaScript is not your typical, run-of-the-mill Object Oriented language. It is an object-oriented language but not in a typical way.

The most commonly used object-oriented languages describe their way of handling OOP-Encapsulation like so: "A Class is a blueprint for Objects; describe the Apple before making one!"

In JavaScript, everything is an object including Arrays, Strings and even Functions. Herein lies the OOP for starting to ken your JS foo!

JavaScript is not intended to be written in that "write-a-Class-to-describe-the-orange" sort of way. Regardless of that though, when you come from a PHP or C++ background, it's always nice to know what kind of "equivalents" sort of exist.

That is what this article is about. So if you're a JavaScript aficionado, please note that we agree that the best way to program in JavaScript is to use the paradigms that are native to the language as opposed to forcing it to conform to the paradigms used by other languages.

This article hopes to help programmers from a more "blueprint-y-language" understand the mechanisms for implementing OOP-Encapsulation (or "Variable Scope") that are native to JavaScript. It aspires to provide a clear and visual comparison of how these concepts are implemented in each of the languages I've chosen to work with. Finally, it will list some of the dissimilarities I've noted along the way... what's not available in JavaScript that exists in the other languages and vice-versa.

While writing this article, I also tried to keep the language simple and to make sure that I highlighted key phrases and terms as much as possible. This is because I also hoped for this article to be at least somewhat understandable to programmers new to Object-Oriented Programming and that people from all levels of experience can find something of interest and use here.

### FOot-NOtes

Whenever possible and deemed useful, I've added a link for further reading. I reference those foot-notes using the following syntax:

Some yadda-yadda bloopety-bloop knowledge pouring into your head. (Misc){3}

Finally, in the sections where I start to include code examples, it should be noted that I use the following acronyms for each of the languages just before each code block: 

PHP is shown as PHP (go figure), Ruby as RB and JavaScript as JS.

<img src="">

### Sample Files

I've wrapped up the source files of the Class that I wrote up while putting this article together and made them available for your learning pleasure! Please find them at the bottom of the article just before the "References" section (to the source Batman!).

The files show the use of the Class we'll talk about by printing a variable that the Class generates into a basic HTML page. Viewing the examples is pretty straight forward for both PHP and JS but the "index.erb" version for RB is a bit more involved. Though I won't go into it, viewing that file with just your regular LAMP/WAMP/MAMP (what have you) web-server setup is possible through the use of CGI-Scripts (and is possibly a followup blog post).

### Syntax for Special Terms, Ideas and Concepts

There are a lot of programming terms used throughout this post. I try to be consistent with the format used on the different types of terminology using the following patterns. This post was written over several days and has seen several iterations though, so please forgive any inconsistencies you may find. :smile:

Bold and italicised formatted text are general ideas or concepts or items of note that should be paid attention to and are thus emphasised.

Whenever I use a term that is used directly within a programming language inline with regular text, it appears like so: $this->getResult();.

Whenever I mention a programming idea or concept for the first time, it'll generally be both bolded and italicised like this: <b> A Class is a blueprint for an Object.</b>

### Assumptions

I'm gonna assume a couple of things as I write this article. I hope that, by writing my assumptions down, you (the reader) will gain an understanding of whether reading the article will actually be beneficial to you.

### Bulleted List

- You should have a fair deal of experience with at least one of the two compared programming languages: PHP and/or Ruby.

- You know what Object-Oriented Programming (also known as OOP) is and your experience in either of the two languages above includes at least some OOP programming in it.

The following types of code snippets make sense to you:
PHP: 
    private $colour = 'Rainbow'; 
    public static $defaults = null;
Ruby: 
    require 'date' 
    @colour = 'Rainbow'
-You know all about why Object-Oriented Programming is good and love OOPing to your heart's delight. This includes fully understanding OOP and its underlying principles like DRY (Misc){4}, KISS (Misc){5} and APIE (Misc){6}.

- You don't know much about JavaScript or haven't heard/read about defining Classes in it before... or just stumbled across this article and find my writing style so captivating that you just can't tear yourself away!

- You aren't allergic to fruit. (Misc){8}

- You don't mind double-meanings and occasional innuendos :dry-cough: :grin:.

- You love (or at least don't mind) emoticons, emojis and other such harmless textual chitter-chatter. :wink: (Misc){2}

### Some More Preamble

As alluded to earlier, JavaScript doesn't have direct mechanisms that allow you to define Classes(JS){1}. "What's up with that!?", you ask.Well, JavaScript is known as a "Prototypal" or Prototype-based language (JS){2}. This relates to what was said earlier in the Disclaimer section. JavaScript does have mechanisms allowing for each of the four founding principles of OOP (see APIE, (Misc){6}) but they are often misunderstood or under-used by newbies to the language.

Another way to describe the programming style of JavaScript is as a functional language (JS){3}. This means that, within it, functions are "first-class" objects (JS){4} and as such, they are in and of themselves the means provided by JavaScript for adhering to all of the OOP principles (Misc){6}.

So... if you need a particular type of object to inherit some properties and methods (Misc){7} then all you need to do is instantiate the parent object (or, in more classical terms, the parent class) from within the constructor (JS){5} of the object you're developing and BAM! you've got what you need.

That said, this can still be confusing to the uninitiated (hell, I'm still getting used to it) and, though it's damn interesting to know about, it's outta scope for the purpose of this particular article. The reason I bring it up is cause Inheritance the "I" in APIE mentioned above. Explaining that is worth its own article... and probably a sequel to this one. :raises-eyebrows-and-shrugs:

### The Incentive

Okay, we need an example, a case that can prove our point.
It's helpful to think up a reason for us to write a Class in the first place and... 

(Run for your Claritin™ folks!)... 

Wouldn't it be super-Awesome™ to write a little program for the kids to chuckle at?
Okay then, let's make a Class for that! Let's make a talking fruit (Misc){8} which (:evil laugh:) is gonna expire randomly and all of the sudden... and then, for our extra-sadistic pleasure, make our randomly-exploding talking-fruit Class available our three favourite programming languages! Muaa-ha-ha-ha!

Right, we know what the Class we will write should do, now, what sort of characteristics do we want our time-bomb Fruit to have in order for it to explode the way we want? In the least, it should have a best-before date and a boolean variable that we'll use to store its "is fresh/is rotten" state... and maybe some other stuff like that.

That said, the sample-files provided are of just such a Fruit() Class as described above. It's not complete but will serve its purpose well enough. All the functionality (methods and variables) in it are almost-exactly mirrored in each of the three programming languages we're talking about here.

Huzzah!

Hmm... :taps-chin:

Well what're we waitin' for folks, let's get to it!

### The Shtuff

And thus their journey began...

"Class" Definition Blocks

We start with the fact that good ol' PHP and Ruby both make use of the keyword class when you want to write the definition of one:
PHP

  class Fruit {
    ...
  }
RB

  class Fruit
    ...
  end
JS

In JavaScript, the definition of a function is the definition of a class. When a Named Function is defined in using the function keyword, it is accepted as the definition of a Class within JavaScript. Such Classes are also known as Class Objects in JavaScript circles. So, instead of using the run-of-the-mill class keyword, we'll use the uber-cool, sunglasses-sporting, multi-taskingly awesome function keyword.
  function Fruit () {
    ...
  }
Constructors
It's very important to note at this point that both Ruby and PHP along with many programming languages don't allow you to set the value of a Class' Property (also known as a Class Member) to a dynamic value within the definition of the Class itself.
Setting the default value of an Class member to a dynamic value must be done from within the Constructor Method of the Class in both Ruby and PHP. Both languages do allow for the default values of Class Properties to be primitive data-types though. In Ruby dynamic values also include Arrays and Dictionaries. PHP is a bit looser in this regard, allowing you to specify an array of primitives as the default for Class Properties as well.
PHP

  # WON'T WORK
  # See how I'm trying to set the default value of a Class
  # member by calling a function that will provide
  # the dynamic value I want.
  class Fruit {
    public $test_object_works = new stdClass();
    private $best_before_date =
      date_from_now(self::$defaults->days_to_expire);
  }

  # THIS DOES WORK
  class Fruit {
    public $test_array_works = array('some', 'nifty', 'stuff');
    public $test_object_works = NULL;
    private $best_before_date = NULL;

    # Constructor Mechanism
    function __construct () {
      $this>test_object_works = new stdClass();
      $this->best_before_date =
        self::date_from_now(self::$defaults->days_to_expire);
    }
  }
RB

  # WON'T WORK
  class Fruit
    @test_array_works = ['some', 'nifty', 'stuff']
    @test_object_works = {
      :some => 'some',
      :nifty => 'nifty',
      :stuff => 'stuff'
    }
    @best_before_date =
      self.class.date_from_now(@@defaults[:days_to_expire])
  end

  # THIS DOES
  class Fruit
    @best_before_date = nil
    attr_accessor :test_array_works
    attr_accessor :test_object_works

    # Constructor Mechanism
    def initialize
      @test_array_works = ['some', 'nifty', 'stuff']
      @test_object_works = {
        :some => 'some',
        :nifty => 'nifty',
        :stuff => 'stuff'
      }

      @best_before_date =
        self.class.date_from_now(@@defaults[:days_to_expire])
    end
  end
JS

In JS on the other hand, since the definition of the Class is its own constructor, doing the following makes perfect sense:
  // I set the default value of a Class' property to be
  // a dynamic value without breaking a sweat!
  function Fruit () {
    var
      test_array_works = ['some', 'nifty', 'stuff'],
      test_object_works = {
        some : 'some',
        nifty : 'nifty',
        stuff : 'stuff'
      },
      best_before_date =
        Fruit.date_from_now(Fruit.defaults.days_to_expire);
  }
Private Properties
It is often the case that we need to prevent an external part of our program from modifying values that belong to the instances of a Class (also known as Instantiated Objects or just Objects). We call properties needing protection like these private and in many OOP languages, private is in fact the keyword that will limit access to those values.
PHP

In PHP (version >= 5) Class properties cannot be defined without their visibility being set (PHP){2}.
  class Fruit {
    private $is_rotten = FALSE;
    private $best_before_date = NULL;
  }

RB

In Ruby, all variables default to a private state and are never public (more on that later) so use of the private keyword is optional. Class variables are known as Instance Variables in Ruby.
It should be noted that there a couple of nifty ways to set those private parts in Ruby. The language exposes a Construct called accessors that look like attr_*OPTION* (RB){3}. Thus, in Ruby, you have a half-and-half private variable scope as well where the property can be read and yet not written to, essentially making it semi-private.
The code block below shows each of the ways you can specify a private member in Ruby. I've included an example of how to declare a semi-public Class Member as well for clarity's sake.
  class Fruit
    # 1) Simply declare it.
    @is_rotten = false

    # 2) Use the *accessor* modifier and specify
    #    that it is read-only and thus, is
    #    semi-private.
    attr_reader :best_before_date
  end
JS

In JavaScript... and this one caught me for a spin cause I always misinterpreted it... It's the var keyword that limits scope.
That's right folks! "VAR" isn't like the dollar-sign in PHP! It's the layer keeping your guts from spilling on your Mom's favourite Persian rug! 

Use it with tender loving care!
  function Fruit () {
    // We use the "var" keyword here to limit access
    // to these variables to within the Class.
    // Without it, these variables would be accessible
    // in "global" space in JavaScript.
    var
      is_rotten = false,
      best_before_date =
        Fruit.date_from_now(Fruit.defaults.days_to_expire);
  }
Public Properties
Without further ado, let's compare the declaration of publicly accessible properties.
PHP

PHP is pretty much as-you-like-it, straight-forward and simple. Public properties can be read and written to without any arm-twisting. Call it "à la carte" simplicity, nice in it's own way. Making a Class property public is as simple as using the public keyword. Remember though, such variables can be written to from anywhere else in your program!
  class Fruit {
    public $colour = 'Rainbow';
    public $name = 'Magic Fruit';
  }
RB

Ruby is a bit more of a demanding mistress (or master) :whip-sound-fffchshhhh:. As mentioned above, all class members are private by default and nothing is public (RB){2}. Talk about chastity eh?
Well, all's not lost because, where there's a will, there's a way. In Ruby, to make an instance member public, you have create getter/setter methods in the class for it. There is a verbose way to do so which can be used to make further adjustments to the variable before either showing or storing the value and then there's the accessor modifier that I've mentioned earlier.
Please note that Ruby does have a "public" keyword but it doesn't apply to Class properties (RB){4}. If you tried to use it on a variable, you'd get something like the following error: undefined method '...' for #_line-number_. This because Ruby doesn't expect you to access variables except through Class methods.
  class Fruit
    # First method to make a Class member public:
    #   Declare the var and create getter/setter
    #   methods for it.
    @colour = 'Rainbow'

    #   The "getter"
    def colour
      @colour
    end
    #   The "setter"
    #   I want to bring your attention to the beauty of
    #   Ruby as a language here. Note how function
    #   names can have special chars in them.
    def colour=(value)
      @colour = value
    end

    # Second method to make a Class member public:
    #   Use the `attr_*OPTION` modifier to make
    #   the variable writable. The `attr_accessor` modifier
    #   says that the Class member should be *both*
    #   readable and writable.
    attr_accessor :name
  end
JS

In JavaScript, there are two ways for a variable to become accessible to the world.
Traveller beware... :spooky-music:... one of them will expose you more than you may be prepared to be!
When you want a Class property to become publicly accessible the correct (and only real way in JavaScript) is to use the this keyword.
The "incorrect" way is to simply declare the variable without the use of this or var... 

BUT 

As mentioned, this will 

Expose you... 

ahem... 

Expose it... 

It will expose that variable by declaring it as being in global scope and making it available as a property of the window object itself. Though this is sometimes desireable, it is oftentimes the result of developer oversight.
  function Fruit () {
    // Is good - these will be accessible through
    // the instantiated object.
    this.colour = 'Rainbow';
    this.name = 'Magic Fruit';

    // Very bad (in most circumstances) - this
    // will kill kittens 8 times out of 10.
    freaky_horror_madness = "A value I cannot trust!";
  }

  // Look Mom! No hands!
  freaky_horror_madness = 'Whatever I want!!! Muaa-ha-ha-ha-haaaaaa!';

  // So sad...
  freaky_horror_madness = {
    Kittens_Squashed  : 50000000,
    remorse           : 'More than you can *imagine*!'
  };
Private Methods
Beginners should beware here as well, in PHP and Ruby, methods are exposed in the public scope by default (PHP){2} (RB){4}. JavaScript is the opposite in this matter as you will see a little further down.
Defining method scope in both PHP and Ruby is done through the use of the private and public and protected keywords.
PHP

  class Fruit {
    # Private Methods
    private function seed_sprout () {
    $this->is_rotten = TRUE;
      return "Time's up! This fruit's seeds have
        sprouted from its overripe core...";
    }
  }
RB

As mentioned above, Ruby uses the same three keywords to set a Class method's availability scope with PHP. These keywords server a couple of purposes in Ruby though. They can:
Be used to group sections of Class members in a visual way. As well as:
Be used at the end of the class definition to "list" the methods within the correct scope.
Please remember that these keywords only work for the scope of methods and not for variables (RB){4} as mentioned above.
In the code block below we use the keywords to denote "groups" of methods as belonging to a particular scope. It's also possible to keep switching between scopes and though it's possible, it's considered a Very Bad Idea™.
  class Fruit
    # Public Methods
    public
      def colour
        @colour
      end
      def colour=(value)
        @colour = value
      end

    def show_fruit_secret
      "This fruit will last until #{@best_before_date}"
    end

    # Private Methods
    private
      def seed_sprout
        @is_rotten = true
        "Time's up! This fruit's seeds have sprouted
          from its overripe core..."
      end

    # Public Methods - Again? This can get messy!
    public
      def name
        @name
      end
      def name=(value)
        @name = value
      end
  end
In the next code block, we place our scope declarations at the end of the file where it's most clean and they're less likely to be missed. We then list the methods belonging to each scope inline with the keyword. Please note, in this scenario, you will be referring to the methods as symbols belonging to the class (RB){5}.
  class Fruit
    def colour
      @colour
    end
    def colour=(value)
      @colour = value
    end

    def show_fruit_secret
      "This fruit will last until #{@best_before_date}"
    end

    def seed_sprout
      @is_rotten = true
      "Time's up! This fruit's seeds have sprouted
        from its overripe core..."
    end

    # Putting this here for clarity even though it is unnecessary.
    public :colour, :show_fruit_secret

    # This is what you need to take note of.
    private :seed_sprout
  end
JS

Private methods are pretty straight forward in JavaScript... There are two ways to do this:
1) You declare them inline within the "Class constructor" itself.
  function Fruit () {
    function seed_sprout () {
      is_rotten = true;
      return "Time's up! This fruit's seeds have sprouted
        from its overripe core...";
    }
  }
2) Declare them as the value of a private variable.
  function Fruit () {
    var seed_sprout = function () {
      is_rotten = true;
      return "Time's up! This fruit's seeds have sprouted
        from its overripe core...";
    }
  }
Public Methods
This topic is a quicky for both PHP and Ruby. As mentioned earlier, one of the gotchas for beginners to look out for is that Class methods in these two languages are publicly accessible by default. So, specifying public methods is a simple as declaring them within the Class...
Apart from that and as you can surmise from the examples given for private methods earlier, both PHP and Ruby have keywords that can be used to explicitly indicate that a method is public.
PHP

  class Fruit {
    # A sample public method that is public because
    # the scope has not be "overridden" by using a keyword.
    function hello_world () {
      return "Hello World!";
    }

    # A private variable we want accessible through a "getter" method.
    private $best_before_date = NULL;

    # The getter method that can be used to display the value.
    public function get_best_beforedate () {
      return $this->best_before_date;
    }
  }
RB

1) A method with no scope defined is public by way of default:
  class Fruit
    def hello_world
      "Hello World!"
    end
  end
2) Using keyword to indicate a "group" of public methods:
  class Fruit
    public
      def colour
        @colour
      end
  end
3) Specifying the method then listing method scope at the end of the Class definition:
  class Fruit
    def colour
      @colour
    end

    public :colour
  end
JS

Here things get interesting again. In JavaScript, there are two types of public methods (JS){6}. The first type is Privileged Methods and the second is... 

(Wait for it)... 

Non-Privileged 

And the crowd goes wild with applause!...
What's this privilege thing?!!! I wanna drive NOW Daddy!... :harumph!:...
Euphemisms for spoilt brats aside, the term "privileged" implies just that here.

Methods that are "privileged" in JavaScript can access private parts... 

Ahem, private members... 

Ahem, well this just doesn't seem to be coming out right (Misc){9}... :blush: 

(Some more :throat-clearing:... and a :pause-for-good-measure:) 

Privileged methods can access the private variables of the Class Object and they have both read and write access to them.
You'll recall how private variables are specified in JS; they are declared inline within the Class constructor using the var keyword. It's those variables that are accessible to "privileged" methods.
Privileged-Public methods are declared as the value of a variable belonging to the this keyword and are defined within the constructor of the Class (quite the mouthful, n'est pas?).
  function Fruit () {
    // Private Variables
    var
    is_rotten = false,
    best_before_date =
      Fruit.date_from_now(Fruit.defaults.days_to_expire);

    // This is a privileged method. It can be used
    // to *read* the "best_before_date"
    // value of the Fruit.
    this.get_best_before_date () {
      return best_before_date;
    }

    // This is also a privileged method. It can be used to
    // *set* the "is_rotten" state of the Fruit.
    this.set_is_rotten () {
      return is_rotten;
    }
  }
Non-Privileged-Public methods are declared by the Power of Grayskull! 

Sorry, lets try that again... 

By the Power of Prototype! 

Doesn't quite have the same powerful ring to it but, it's still pretty damned powerful indeed...
(And with great power comes enormous responsibility said the cat... :meow:).
You have probably heard about the concept of prototype in JavaScript and I've alluded to it in the introduction. This is one of the ways it kicks in though it's probably not the most significant impact that being a Prototypal language has on how you as a developer work with JavaScript.
The second type of public methods in JavaScript are prototype methods. These are declared outside of the Class constructor. Now isn't that weird?!
I wanna mention that I did try using the this keyword to declare a "prototype" public method but got an Uncaught TypeError: Cannot set property... error for my trouble. I've included the "does't work" example below as well.
Don't quote me on this, but I believe this is the case because, at runtime and when the interpreter is parsing through the Class' constructor, the Class Object hasn't been instantiated and thus it's "prototype" property is not available yet.
  // Constructor definition appears *before*
  // a `prototype` method is defined.
  function Fruit () {
    // THIS DOESN'T WORK
    // You'd think this might work but it doesn't.
    // JS will *kick* you!
    this.prototype.show_fruit_secret = function () {
      return 'This fruit will last until ' +
        this.get_best_before_date() ;
    };
  }

  // THIS WORKS
  // Non-privileged method: Cannot access private properties/methods
  // but it *can* access privileged methods which in turn can
  // access private members. And note... this is defined *after*
  // the constructor of the Class was written!
  Fruit.prototype.show_fruit_secret = function () {
    return 'This fruit will last until ' +
      this.get_best_before_date() ;
  };
I won't go into it too deeply... 

BUT 

Part of the true power of prototype is in its using it to update Classes at runtime with new methods and properties. This in turn makes it a key player in JavaScript's implementation of OOP-Inheritance (Misc){6}.
Static (Class) Properties and Methods
You say potato, I say tomato... It's all the same (they are both vegetables)...
PHP

PHP talks about members that are attached to a Class as static members.
Both static methods and properties are declared with the keyword itself. One thing that sort of caught me off guard was that you must set the value of a static member from outside the Class' definition in PHP much like we do for prototype methods and properties in JavaScript. You could do this from within the __construct() method but then you would need to have at least one instance of that Class before the value would be set. If you want such value savailable without creating an instance of the Class, it's gotta be done like I said - outside and after the definition of the Class.
In this case, it's PHP that's the most strict of the three languages (where Ruby was the most strict with regards to public properties). Ruby allows you to set the value of Class properties from within the Class' definition itself while JavaScript is like PHP in this way but with minor syntactical differences (which we'll get to later).
  class Fruit {
    # Private Variable
    private $best_before_date = NULL;

    # Constructor Mechanism
    function __construct () {
      $this->best_before_date =
        self::date_from_now(
          self::$defaults->days_to_expire
        );
    }

    # Static Variable
    public static $defaults = NULL;

    # Static Method
    public static function date_from_now ($days) {
      $the_date = new DateTime();
      $the_date->add(new DateInterval("P{$days}D"));
      return $the_date;
    }
  }

  # Set the Default Value of Static Variable
  if(!Fruit::$defaults) {
    Fruit::$defaults = new stdClass();
    Fruit::$defaults->days_to_expire = 14;
  }
RB

Please note that Ruby talks about members that are attached to the Class itself as Class Members and members that belong to individual instances as Instance Members. They're one and the same as static variables in PHP but the you don't use the static keyword to declare them.
It should also be noted that the use of Class variables is not recommended in Ruby (RB){6}. The gist of the linked StackOverflow thread is that, static variables can introduce unforeseen complexity. This is because in Ruby, variables are inherited all the way down the class/sub-class chain.
For our Fruit() Class example though, I wanted a place to store default values for all Fruit in a semantic and easy-to-understand way. All said and done, I'm showing the difference between class properties versus instance properties below so that the distinction isn't lost on you.
  class Fruit
    # Instance Variable:
    # Declared with a single "@" sign. The value
    # changes *per* instantiated Object.
    @is_rotten = false

    # Static Variable: The value is the same
    # throughout the program.
    @@defaults = { :days_to_expire => 14 }
  end
JS

This will be the last piece to the puzzle I've been putting together for ya in this article. How do we declare a static variables in JS? 

Simple! In the same way that you declare non-privileged methods in JS, static variables are declared after the constructor of the Class and directly as properties of the Class Object itself!
  // Constructor of Class
  function Fruit () {
    ...
  }

  // Setting my Static Variable here!
  Fruit.defaults = {
    days_to_expire : 14
  };
Stuff We Didn't Discuss & Conclusion (le finalé)

Protect that Shtuff!
Variable and method scope within programming languages often have a third-degree of access called protected. Both PHP and Ruby implement this scope - albeit in pretty different ways - but it is not available within JavaScript. I've also not talked much about the protected scope because it would require an understanding of OOP-Inheritance.
Mix'n 'n Matchin'
PHP has a nice 'n clean way of declaring variables and methods that are both private and static.
Ruby doesn't have private static variables because there is always a way to access static variables (RB){7}.
And finally... JavaScript also doesn't allow for private static (JS){7}. You can have one or the other but not both.
Inheritance
And here's where we'll wind up this thinga-ma-jig.
I did not speak about Inheritance in these languages. JavaScript does have a workaround for setting up Classical OOP-Inheritance similar to the way that both PHP and Ruby implement it... but that's it's OWN bag of Trix™!
Conclusion
I hope that you've found this article both fun and informative. If not fun, then I'll settle for the informative part at least. :grin:
Thanks for visiting and taking a gander at this extremely verbose post. 

May playing with the private (and secret) parts of JS be as much fun for you as it is for me (Misc){9}! :wink:
May the JS be with you!
References

Source Files
Download with loving care and attention!
Miscellaneous (Misc):
Oh no, you just missed the Polkaroo! http://www.youtube.com/watch?v=ghWpAgFfgV0
Emoticons and Emojis and such Chitter-Chatter, Oh My! http://www.emoji-cheat-sheet.com/
Google now lets you renovate your house on Maps, Street View! http://google-au.blogspot.com.au/2013/04/renovate-your-house-on-street-view-with_1.html
DRY = Don't Repeat Yourself: http://en.wikipedia.org/wiki/Don't_repeat_yourself
KISS = Keep It Simple Silly/Stupid (depending upon how acerbic your sense of humour is): http://en.wikipedia.org/wiki/KISS_principle
APIE = Abstraction, Polymorphism, Inheritance and Encapsulation: http://www.inf.ufsc.br/poo/smalltalk/ibm/tutorial/oop.html#paradigm
Abstraction: http://en.wikipedia.org/wiki/Abstraction_(computer_science)
Polymorphism: http://en.wikipedia.org/wiki/Polymorphism_in_object-oriented_programming
Inheritance: http://en.wikipedia.org/wiki/Inheritance_(object-oriented_programming)
Encapsulation: http://en.wikipedia.org/wiki/Encapsulation_(object-oriented_programming)
What are properties and methods?:
Property: http://en.wikipedia.org/wiki/Property_(programming)
Method: http://en.wikipedia.org/wiki/Method_(computer_science)
Ananas, an old namesake: http://www.youtube.com/watch?v=l3DnoxzorYg
Oooh!?!: http://www.youtube.com/watch?v=DhrZxSoLmgA
JavaScript (JS):
JavaScript historically had a Draft for it in 1999 (http://www-archive.mozilla.org/js/language/js20-1999-02-18/classes.html) that proposed a classical approach to Class definitions. It never got finalised and was dropped. http://stackoverflow.com/a/1729006
What's a prototypal/prototype-based language? http://en.wikipedia.org/wiki/Prototype-based_programming
Is JavaScript a functional language? http://stackoverflow.com/a/3962690
What does it mean when a "programming-language treats functions as first-class objects"?:
http://stackoverflow.com/a/705184
http://en.wikipedia.org/wiki/First-class_function
http://helephant.com/2008/08/19/functions-are-first-class-objects-in-javascript/
Where's the "constructor" function in Javascript?: http://tobyho.com/2010/11/22/javascript-constructors-and/
Types of public methods and properites in JS and a whole lot more!: http://phrogz.net/JS/classes/OOPinJS.html
Doesn't support Private-Static methods: http://stackoverflow.com/a/3218950
PHP: Hypertext Preprocessor (PHP):
Doesn't support dynamic default value for Class properties: http://www.php.net/manual/en/language.oop5.properties.php
Visibility isn't optional: http://php.net/manual/en/language.oop5.visibility.php
Ruby (RB):
Doesn't support "private" variables in the same way that PHP does as all variables are accessible in one way or other: http://stackoverflow.com/questions/2131921/how-to-make-instance-variables-private-in-ruby/2132392#2132392
Instance variables are private by default and cannot be accessed from outside the instance without the use of an accessor method.: http://stackoverflow.com/a/12122761
Ruby's super-cool attr_*OPTION* keywords: http://www.rubyist.net/~slagell/ruby/accessors.html#label-2
Class methods are public by default in Ruby: http://en.wikibooks.org/wiki/Ruby_Programming/Syntax/Classes#Declaring_Visibility.
What are symbols in Ruby?: http://www.robertsosinski.com/2009/01/11/the-difference-between-ruby-symbols-and-strings/
Use static or "class" variables sparingly: http://stackoverflow.com/a/2442640
No equivalent way to declare private static variables in Ruby: http://stackoverflow.com/a/2442640

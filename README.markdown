Supergrover
===========

This node.js application allows you to hook up an RSS feed into a [grove.io](https://grove.io/) channel. It is deployed on [Heroku](http://www.heroku.com/), but can certainly easily be ported to other platforms.

Use it!
-------

There is a version running for anyone's use at [http://supergrover.herokuapp.com/](http://supergrover.herokuapp.com/). This one should run without too many limitations, as by design this is very lightweight. However, it may still have a decreasing performance if too many people use it, so we usually recommend running your own if you'd like something that you can control.

Deploying your own
------------------

This assumes you have a Heroku account.

### Fork the repo

<code>
    $ git clone git://github.com/superfeedr/supergrover.git
    $ cd supergrover
</code>

### Create the app

<code>
    $ heroku create --stack cedar
</code>

The output of this command should indicate the url of your application. Replace the `baseUrl` value in `app.js` [line 19] with your application's url.

<code>
    $ git commit -m "changed the application url" -a
</code>

### Grab the Superfeedr Addon

<code>
    $ heroku addons:add superfeedr
</code>

### Deploy

<code>
    $ git push heroku master
</code>

Done! Just to to your application's url and follow the instructions to follow more feeds!

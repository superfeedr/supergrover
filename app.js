
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , https = require('https')
  , querystring = require('querystring')
  , url = require('url');
  

var app = module.exports = express.createServer();

// Configuration

var baseUrl = 'http://severe-ice-3735.herokuapp.com';

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

var superfeedrOptions = {
  host: 'superfeedr.com',
  port: 80,
  path: '/hubbub',
  method: 'POST',
  auth: 'demo:demo',
  headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
  }
};

var groveioOptions = {
    port: 80,
    method: 'POST',
    headers: {
    }
};

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

// show method
app.get('/', function(req, res){
    var groveio = new Buffer(req.param('groveio', ''), 'base64').toString('utf8')
        , feed = new Buffer(req.param('feed', ''), 'base64').toString('utf8');

  res.render('index', { title: 'Supergroover', groveio: groveio, feed: feed})
});

// Update method
app.post('/', function(req, res) {
    var groveio = req.param('groveio')
        , feed = req.param('feed')
        , mode = req.param('mode');
    
    // The params for the request
    var postData = querystring.stringify({
        'hub.mode' : mode,
        'hub.topic': feed,
        'hub.callback': baseUrl + '/superfeedr/' + (new Buffer(groveio).toString('base64')) + '/' + (new Buffer(feed).toString('base64')) ,
    });
    
    superfeedrOptions.headers['Content-Length'] = postData.length
    
    // Let's make a request to Superfeedr.
    var req = http.request(superfeedrOptions, function(response) {
      response.setEncoding('utf8');
      
      response.on('data', function(chunk) {
          console.log("Superfeedr says: " + chunk);
      });
      
      if(response.statusCode === 204) {
          
          var postData = {
              'service' : 'Supergrover',
              'url': baseUrl + '/?groveio=' + (new Buffer(groveio).toString('base64')) + '&feed=' + (new Buffer(feed).toString('base64')),
              'icon_url': "https://grove.io/static/img/avatar.png"
          }
          
          if(mode === "subscribe") {
              postData.message = "This channel is now following " + feed + ". Be ready!";
          }
          else if(mode === "unsubscribe") {
              postData.message = "This channel is not following " + feed + " anymore.";
          }
          postData = querystring.stringify(postData);
          
          var uri = url.parse(groveio);
          groveioOptions.host =  uri.hostname;
          groveioOptions.port =  uri.port;
          groveioOptions.path =  uri.pathname;
          groveioOptions.headers['Content-Length'] = postData.length

          var req = https.request(groveioOptions, function(response) {
              response.on('data', function(chunk) {
                  console.log("Grove.io says: " + chunk);
              });
          });

          req.on('error', function(e) {
              console.log('problem with request: ' + e.message);
          });

          // write data to request body
          req.write(postData);
          req.end();
          res.render('success', { title: 'Supergroover', groveio: groveio, feed: feed});
      }
      else {
          res.render('failure', { title: 'Supergroover', groveio: '', feed: ''});
      }
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
      
      res.render('failure', { title: 'Supergroover', groveio: groveio, feed: feed });
    });
    
    // write data to request body
    req.write(postData);
    req.end();
});

// PubSubHubbub verification of intent
app.get('/superfeedr/:groveio64/:feed64', function(req, res) {
    res.send(req.param('hub.challenge')); 
});


// PubSubHubbub Notification
app.post('/superfeedr/:groveio64/:feed64', function(req, res) {
    var groveio = new Buffer(req.params.groveio64, 'base64').toString('utf8')
        , feed = new Buffer(req.params.feed64, 'base64').toString('utf8');
    
    // For each of the items in the notification:
    for (i in req.body.items) {
        var item = req.body.items[i];
        // The params for the request
        var postData = querystring.stringify({
            'service' : 'Supergrover',
            'message': item.title + " " + item.permalinkUrl,
            'url': baseUrl + '/?groveio=' + (new Buffer(groveio).toString('base64')) + '&feed=' + (new Buffer(feed).toString('base64')),
            'icon_url': "https://grove.io/static/img/avatar.png"
        });
        groveioOptions.headers['Content-Length'] = postData.length

        var uri = url.parse(groveio);
        groveioOptions.host =  uri.hostname;
        groveioOptions.port =  uri.port;
        groveioOptions.path =  uri.pathname;

        var req = https.request(groveioOptions, function(response) {
            response.on('data', function(chunk) {
                console.log("Grove.io says: " + chunk);
            });
        });

        req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(postData);
        req.end();
    }
    res.send("Thanks!"); 
});


var port = process.env.PORT || 3000;

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

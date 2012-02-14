
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , querystring = require('querystring');
  

var app = module.exports = express.createServer();

// Configuration

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

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

// show method
app.get('/', function(req, res){
  res.render('index', { title: 'Supergroover', groveio: '', feed: '' })
});


// Update method
app.post('/', function(req, res) {
    
    var groveio = req.param('groveio')
        , feed = req.param('feed');
    
    // The params for the request
    var postData = querystring.stringify({
        'hub.mode' : 'subscribe',
        'hub.topic': feed,
        'hub.callback': '',
    });
    
    superfeedrOptions.headers['Content-Length'] = postData.length
    
    // Let's make a request to Superfeedr.
    var req = http.request(superfeedrOptions, function(res) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
      res.render('index', { title: 'Supergroover', groveio: groveio, feed: feed });
      
    });
    
    // write data to request body
    req.write(postData);
    req.end();
    
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

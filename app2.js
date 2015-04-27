var express = require('express');
var multer = require('multer');
var http = require('http');
var engine = require('ejs-locals');
var path = require('path');
var app = express();

app.use(multer({dest:'./uploads/'}));
app.set('port', process.env.PORT || 8088);
app.engine('ejs', engine);
app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'ejs');

app.get( '/', function(req,res) {
	res.render('index', { title: '' });
});
app.get( '/index', function(req,res) {
	res.render('index', { title: '' });
});

app.post('/submitPhoto', function(req, res) {
  console.log(req.files);
});

http.createServer( app ).listen( app.get( 'port' ), function(){
			  console.log( 'Open browser to http://localhost:' + app.get( 'port' ));
			} );
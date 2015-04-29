var express = require('express');
var routes = require ('./routes');
var http = require('http');
var path = require('path');
var app = express();
var engine = require('ejs-locals');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var async = require('async');
var multer  = require('multer');
var fs = require('fs');
var secretobj = JSON.parse(fs.readFileSync('secret.json', 'utf8'));

app.use(multer({dest: './uploads/', includeEmptyFields: true}));
app.set('port', process.env.PORT || 8080);
app.engine('ejs', engine);
app.set('views', path.join( __dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use( express.static( path.join( __dirname, 'public' )));
app.use(express.static(__dirname + '/views/stylesheets'));
app.use(express.static(__dirname + '/views/images'));
app.use(express.static(__dirname + '/views/js'));

app.use(cookieParser());
app.use(session({
	secret: secretobj.secret,
	login: false
}));

/////////////////

var aws = require("./keyvaluestore.js");

var admins = new aws('admins');
var hours = new aws('hours');
var photos = new aws('photos');
var count = new aws('count');
var rejected = new aws('rejected');

admins.init(function() {
hours.init(function() {
photos.init(function() {
count.init(function() {
rejected.init(function() {

	routes.init(admins, hours, photos, count, rejected,
		function() {
		
		app.get( '/', routes.index );
		app.get( '/index.html', routes.index );
		app.post( '/submitPhoto', routes.submitPhoto );

		app.get( '/view', routes.view );
		app.get( '/getGrid', routes.getGrid );
		app.get( '/getCount', routes.getCount );

		app.get( '/admin', routes.admin );
		app.post( '/login', routes.login );

		app.get( '/home', routes.home );
		app.get( '/getQueue', routes.getQueue );
		app.post( '/logout', routes.logout );
		app.post( '/verifyPhoto', routes.verifyPhoto );

		app.get( '/loggedIn', routes.loggedIn );

		/////////////////////
		
		http.createServer( app ).listen( app.get( 'port' ), function(){
			  console.log( 'Open browser to http://localhost:' + app.get( 'port' ));
			} );
		process.on('uncaughtException', function (err) {
		  console.log('Caught exception: ' + err);
		});

		setTimeout(function () {
		  console.log('This will still run.');
		}, 500);
	});
});
});
});
});
});

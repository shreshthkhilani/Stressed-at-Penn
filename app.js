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

app.use(multer({dest: './uploads/', includeEmptyFields: true}));
app.set('port', process.env.PORT || 8088);
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
	secret: "thisISaSeCrEt"
	}));

/////////////////

var aws = require("./keyvaluestore.js");

var admins = new aws('admins');
var hours = new aws('hours');
var photos = new aws('photos');

admins.init(function() {
hours.init(function() {
photos.init(function() {

	routes.init(admins, hours, photos,
		function() {
		
		// Routes for Login/Signup page
		app.get( '/', routes.index );
		app.get( '/index.html', routes.index );

		app.get( '/view', routes.view );

		app.post( '/submitPhoto', routes.submitPhoto );

		/*// Wrong login info page
		app.get( '/login', routes.login );

		// Logout route
		app.get( '/logout', routes.logout );

		// Profile page
		app.get( '/profile', routes.profile );
		app.get( '/getProfile', routes.getProfile );
		app.get( '/getTopFriends', routes.getTopFriends );
		app.get( '/getPosts', routes.getPosts );
		app.post( '/newStatus', routes.newStatus );
		app.get( '/photos', routes.photos );
		app.get( '/getAllPhotos', routes.getAllPhotos );
		app.get( '/friends', routes.friends );
		app.get( '/about', routes.about );
		app.post( '/postLike', routes.postLike );
		app.post( '/postProfileUpdate', routes.postProfileUpdate );
		app.post( '/cover', routes.postCover );
		app.post( '/propic', routes.postPP );*/


		/////////////////////
		
		http.createServer( app ).listen( app.get( 'port' ), function(){
			  console.log( 'Open browser to http://localhost:' + app.get( 'port' ));
			} );
	});
});
});
});
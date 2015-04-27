/**
 * Main Web route handling
 */

// Note the use of the exports object.  Each function that we
// assign to exports.XXX is callable by outside modules,
// and we can "hook" to it via routes.XXX.


// These are our key-value stores
var admins;
var photos;
var hours;

var shortId = require('shortid');

// We export the init() function to initialize
// our KVS values
exports.init = function(ad,hr,ph,callback) {
	admins = ad;
	photos = ph;
	hours = hr;

	callback();
};

/**
 * Default index page fetches some content and returns it
 */

async = require("async");


exports.index = function(req, res) {
	var t = '';
	
	if (req.session.login) {
		res.redirect("/home");
		return;
	}
	
	res.render('index', { title: t });
};

exports.submitPhoto = function(req, res) {
	if (req.files.displayImage == undefined) {
		res.redirect("/");
		return;
	}
	//console.log(req);
	//console.log(req.files);
	var fs = require('fs');
	var obj = JSON.parse(fs.readFileSync('config.json', 'utf8'));

	var uuid = require('node-uuid');
	var file_suffix = uuid.v1()
	/*var Upload = require('s3-uploader');
	var client = new Upload('stressed-at-penn', {
  		awsBucketUrl: 'https://s3.amazonaws.com/stressed-at-penn/',
  		awsBucketPath: 'images/',
  		awsBucketAcl: 'public-read',
  		versions: [{
		    suffix: file_suffix,
		    quality: 80,
		    maxHeight: 1040,
		    maxWidth: 1040,
  		}]
	});*/
	var s3 = require('s3');
	var client = s3.createClient({
	  maxAsyncS3: 20,     // this is the default 
	  s3RetryCount: 3,    // this is the default 
	  s3RetryDelay: 1000, // this is the default 
	  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
	  multipartUploadSize: 15728640, // this is the default (15 MB) 
	  s3Options: {
	    accessKeyId: obj.accessKeyId,
	    secretAccessKey: obj.secretAccessKey,
	    // any other options are passed to new AWS.S3() 
	    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
	  },
	});

	var params = {
	  localFile: req.files.displayImage.path,
	 
	  s3Params: {
	    Bucket: "stressed-at-penn",
	    Key: "images/" + file_suffix,
	    // other options supported by putObject, except Body and ContentLength. 
	    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
	  },
	};
	var uploader = client.uploadFile(params);
	uploader.on('error', function(err) {
	  console.error("unable to upload:", err.stack);
	});
	uploader.on('progress', function() {
	  console.log("progress", uploader.progressMd5Amount,
	            uploader.progressAmount, uploader.progressTotal);
	});
	uploader.on('end', function() {
	  console.log("done uploading");
	/*});

	client.upload(req.files.displayImage.path, {}, function(err, images, meta) {
	  if (err) {
	    console.error(err);
	  } else {*/
	    //console.log(images);
	    //console.log(meta);
		//fs.unlinkSync(req.files.displayImage.path);

		var image_url = 'https://s3.amazonaws.com/stressed-at-penn/images/' + file_suffix;// + images[0].path;
		var date = new Date();
		var month = date.getMonth() + 1;
		var hour = month.toString() + "-" + date.getDate().toString() + "-" + date.getHours().toString();
		var json_data = {
			"approved" : 0,
			"url" : image_url,
			"approvedBy" : "",
			"timestamp": date 
		};
		var pId = photos.inx.toString();
		console.log(json_data);
		console.log(pId);
		photos.put(pId, JSON.stringify(json_data), function(err,data) {
			if (err) {
				console.log("Error photo upload 1");
			}
			else {
				hours.put(hour, pId, function(err2, data2) {
					if (err2) {
						console.log("Error photo upload 2")
					}
					else {
						res.redirect("/view");
					}
				});
			}
		});
	  //}
	});
};

exports.view = function(req, res) {
	var t = '';
	
	res.render('view', { title: t });
};

exports.getGrid = function(req, res) {
	var n = 16;
	var inx = photos.inx;
	var real = inx < n ? inx : n;
	console.log(real);

	var returnData = [];
	var count = real;
	console.log(count);
	for (var i = photos.inx - 1; i >= photos.inx - real; i--) {
		//if (i < 0) continue;
		console.log("==============================");
		console.log(i);
		console.log("==============================");
		photos.get(i.toString(), function(err, data) {
			if (err) {
				console.log("getGrid error 1");
			}
			else {
				console.log(data);
				var json_data = JSON.parse(data);
				returnData.push(json_data.url);
				count--;
				if(count == 0) {
					console.log(returnData);
				    res.send(returnData);
				    return;
				}
			}
		});
	}
};

exports.getCount = function(req, res) {
	res.send({"count": photos.inx});
};

exports.admin = function(req, res) {
	var t = '';
	
	res.render('admin', { title: t });
};

exports.home = function(req, res) {
	var t = '';

	if (!req.session.login) {
		res.redirect("/admin");
		return;
	}
	
	res.render('home', { title: t });
};

exports.login = function(req, res) {
	console.log(req.body);
	var user = req.body.user;
	var pw = req.body.pw;
	admins.exists(user, function(err, data) {
		if (err) {
			console.log("login");
		}
		else {
			if (data == false) {
				res.send({"success": false, "msg": "Wrong username!"});
			}
			else {
				admins.get(user, function(err2, data2) {
					if (err2) {
						console.log("login 2");
					}
					else {
						var json_data = JSON.parse(data2);
						if (pw = json_data.pw) {
							req.session.login = true;
							req.session.user = user;
							res.send({"success": true});
						}
						else {
							res.send({"success": false, "msg": "Wrong password!"});
						}
					}
				});
			}
		}
	});
}

exports.logout = function(req, res) {
	req.session.login = false;
	req.session.user = null;
	res.send({});
}

exports.verifyPhoto = function(req, res) {
	res.send({"success": false});
}

exports.getQueue = function(req, res) {
	res.send({"success": false});
	// Count pending
	// Loop over all, add the pending urls and ids until pending becomes 0
}
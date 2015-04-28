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
var count;

var shortId = require('shortid');

// We export the init() function to initialize
// our KVS values
exports.init = function(ad,hr,ph,ct,callback) {
	admins = ad;
	photos = ph;
	hours = hr;
	count = ct;
	callback();
};

/**
 * Default index page fetches some content and returns it
 */

async = require("async");


exports.index = function(req, res) {
	var t = 'Submit';
	
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
		var pId = photos.inx.toString();
		var json_data = {
			"approved" : 0,
			"url" : image_url,
			"approvedBy" : "",
			"timestamp": date,
			"pId": pId
		};
		console.log(json_data);
		console.log(pId);
		photos.put(pId, JSON.stringify(json_data), function(err,data) {
			if (err) {
				console.log("Error photo upload 1");
			}
			else {
				hours.addToSet(hour, pId, function(err2, data2) {
					if (err2) {
						console.log("Error photo upload 2");
					}
					else {
						count.get("pending",function(err3, data3) {
							if (err3) {
								console.log("Error photo upload 3");
							}
							else {
								var new_data = JSON.parse(data3);
								new_data.num = new_data.num + 1;
								count.put("pending",JSON.stringify(new_data),function(err4,data4) {
									if (err4) {
										console.log("Error photo upload 4");
									}
									else {
										res.redirect("/view");
									}
								});
							}
						});
					}
				});
			}
		});
	  //}
	});
};

exports.view = function(req, res) {
	var t = 'View';
	
	res.render('view', { title: t });
};

exports.getGrid = function(req, res) {
	var n = 12;
	count.get("approved", function(err2, data2) {
		if (err2) {
			console.log("getGrid error 2");
		}
		else {
			var new_data = JSON.parse(data2);
			//console.log(new_data);
			var inx = new_data.num; //this should be number of '1's
			var real = n;
			if (real == 0) {
				res.send([]);
			}
			var returnData = [];
			var count = real;
			console.log(photos.inx);
			for (var i = photos.inx - 1; i >= 0; i--) {
				//if (i < 0) continue;
				//console.log("==============================");
				//console.log(i);
				//console.log("==============================");
				photos.get(i.toString(), function(err, data) {
					if (err) {
						console.log("getGrid error 1");
					}
					else {
						//console.log(data);
						if (data != null) {
							var json_data = JSON.parse(data);
							//if (json_data.approved == 1) {
								returnData.push(json_data.url);
								count--;
								if(count == 0) {
									//console.log(returnData);
								    res.send(returnData);
								    return;
								}
							//}
						}
					}
				});
			}
		}
	});
};

exports.getCount = function(req, res) {
	res.send({"count": photos.inx});
};

exports.admin = function(req, res) {
	var t = 'Administrator';
	
	res.render('admin', { title: t });
};

exports.home = function(req, res) {
	var t = 'Home';

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
};

exports.logout = function(req, res) {
	req.session.login = false;
	req.session.user = null;
	res.send({});
};

exports.verifyPhoto = function(req, res) {
	var pId = req.body.pId;
	var approved = req.body.approved;
	var user = req.session.user;
	console.log(req.body);
	photos.get(pId, function(err,data) {
		if (err) {
			console.log("verifyPhoto");
		}
		else {
			var json_data = JSON.parse(data);
			console.log(json_data);
			json_data.approved = parseInt(approved);
			json_data.approvedBy = user;
			photos.put(pId, JSON.stringify(json_data), function(err2,data2) {
				if (err2) {
					console.log("verifyPhoto 2");
				}
				else {
					count.get("pending",function(err4,data4) {
						var some_data = JSON.parse(data4);
						some_data.num = some_data.num - 1;
						count.put("pending",JSON.stringify(some_data),function(err5,data5) {
							if (err5) {
								console.log("err5");
							}
							else {
								// here
								if (approved == -1) {
									// Rejected
									count.get("rejected",function(err3,data3) {
										if (err3) {
											console.log("err3");
										}
										else {
											var new_data = JSON.parse(data3);
											new_data.num = new_data.num + 1;
											count.put("rejected",JSON.stringify(new_data),function(err6,data6) {
												res.send({"success": true});
											});
										}
									});
								}
								else if (approved == 1) {
									// Accepted
									count.get("approved",function(err3,data3) {
										if (err3) {
											console.log("err3");
										}
										else {
											var new_data = JSON.parse(data3);
											new_data.num = new_data.num + 1;
											count.put("approved",JSON.stringify(new_data),function(err6,data6) {
												res.send({"success": true});
											});
										}
									});
								}
							}
						});
					});
					
				}
			});
		}
	});
};

exports.getQueue = function(req, res) {
	count.get("pending", function(err2, data2) {
		if (err2) {
			console.log("getQueue error 2");
		}
		else {
			var new_data = JSON.parse(data2);
			console.log(new_data);
			var inx = new_data.num; //this should be number of '0's
			var real = inx;
			if (real == 0) {
				res.send([]);
			}
			var returnData = [];
			var count = real;
			console.log(count);
			for (var i = photos.inx - 1; i >= 0; i--) {
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
						if (data != null) {
							var json_data = JSON.parse(data);
							if (json_data.approved == 0) {
								returnData.push({"url": json_data.url, "pID": json_data.pId.toString()});
								count--;
								if(count == 0) {
									console.log(returnData);
								    res.send(returnData);
								    return;
								}
							}
						}
					}
				});
			}
		}
	});
};

exports.loggedIn = function(req, res) {
	res.send({"loggedIn": req.session.login, "user": req.session.user});
};

var express = require("express");
var app = express();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const upload = multer({ dest: 'uploads/' });

var formidable = require("express-formidable");
app.use(formidable({
    multiples: true, // request.files to be arrays of files
}));


const storage = new Storage({
	projectId: "capstone-392917", // Replace with your actual Google Cloud project ID
	keyFilename: "capstone-392917-02f50643e575.json", // Replace with the path to your JSON keyfile
  });
  const bucketName = "al-dia-ecuador";
var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var http = require("http").createServer(app);
var bcrypt = require("bcryptjs")
var fileSystem = require("fs");

var nodemailer = require("nodemailer");
var requestModule = require('request');

var functions = require("./modules/functions");
var chat = require("./modules/chat");
var page = require("./modules/page");
var group = require("./modules/group");
var addPost = require("./modules/add-post");
var editPost = require("./modules/edit-post");

var jwt = require("jsonwebtoken");
var accessTokenSecret = "myAccessTokenSecret1234567890";

const Cryptr = require("cryptr");
global.cryptr = new Cryptr("mySecretKey");

const Filter = require("bad-words-es");
const filter = new Filter();
 
//filtro palabras adicionales
filter.addWords('idiota','estupido','estupida','perra','huevada','chucha','chuta','tonto','tonta');

const cron = require("node-cron");
const moment = require('moment-timezone')

var admin = require("./modules/admin");
admin.init(app, express);

app.use("/voice-notes", express.static(__dirname + "/voice-notes"))
app.use("/public", express.static(__dirname + "/public"))
app.use("/uploads", express.static(__dirname + "/uploads"))
app.use("/audios", express.static(__dirname + "/audios"))
app.use("/documents", express.static(__dirname + "/documents"))
app.set("view engine", "ejs")

var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

global.mainURL = "https://aldiaecuador.com";
global.photoURL = "https://storage.googleapis.com/al-dia-ecuador";

var nodemailerFrom = "danielitabelen2009@hotmail.com";
var nodemailerObject = {
	host: 'santillana.com',
    port: 465,
    secure: true,
	auth: {
		user: "danielitabelen2009@santillana.com",
		pass: "mitom2014"
	}
};

socketIO.on("connection", function (socket) {
	// console.log("User connected", socket.id)
	socketID = socket.id
})

function getUTCToTZInFormat(eventDateTimeUTC) {
	const userTZEventDate = eventDateTimeUTC.split("T").join(" ").slice(0, -1)
	let date = moment.utc(userTZEventDate).tz(moment.tz.guess()).format()
	date = date.split("+")[0]
	return date
}

const Stripe = require('stripe')
const stripe = Stripe('sk_test_51H5TzhCWZOEqAHRfIEZ2OcwVsq7zMm2kWWuQmII2Se5PKBdiTS8Ww2ZbbYMsa1h0l6ypMdJQhE0osbvLibql1u5B00gpQfiFAX')
const stripePublicKey = "pk_test_51H5TzhCWZOEqAHRfJufW6MCuM4SiV11LQSBJ25yyfWhOi0o8WMEDTGcZmjnkSNgS6qlw0HKoPHRpLuGB9sKMDCPT00xV8FLW8Q"

http.listen(3000, function () {
	console.log("Server started at " + mainURL);

	mongoClient.connect("mongodb+srv://prueba:OMQwl0A1VopVj7ZA@mern.68vlpne.mongodb.net/mern?retryWrites=true&w=majority", {

		useUnifiedTopology: true
	}, async function (error, client) {
		global.database = client.db("my_social_network");
		console.log("Database connected.");

		functions.database = database;
		functions.fileSystem = fileSystem;

		chat.database = database;
		chat.socketIO = socketIO;
		chat.users = users;
		chat.ObjectId = ObjectId;
		chat.fileSystem = fileSystem;
		chat.cryptr = cryptr;
		chat.filter = filter;


		group.database = database;
		group.ObjectId = ObjectId;
		group.fileSystem = fileSystem;

		addPost.database = database;
		addPost.functions = functions;
		addPost.fileSystem = fileSystem;
		addPost.requestModule = requestModule;
		addPost.filter = filter;
		addPost.ObjectId = ObjectId;
		addPost.mainURL = mainURL;

		editPost.database = database;
		editPost.functions = functions;
		editPost.fileSystem = fileSystem;
		editPost.requestModule = requestModule;
		editPost.filter = filter;
		editPost.ObjectId = ObjectId;

		
		admin.database = database;
		admin.bcrypt = bcrypt;
		admin.jwt = jwt;
		admin.ObjectId = ObjectId;
		admin.fileSystem = fileSystem;
		admin.mainURL = mainURL;

		app.post("/sendVoiceNoteInGroupChat", async function (request, result) {
			const base64 = request.fields.base64
	        const accessToken = request.fields.accessToken
	        const _id = request.fields._id

	        const user = await database.collection("users").findOne({
	            "accessToken": accessToken
	        });

	        if (user == null) {
	            result.json({
	                "status": "error",
	                "message": "User has been logged out. Please login again."
	            });

	            return false;
	        }

	        if (user.isBanned) {
				result.json({
					status: "error",
					message: "Ha sido bloqueado"
				})

				return
			}

	        const group = await database.collection("groupChats").findOne({
				_id: ObjectId(_id)
		    })

		    if (group == null) {
				result.json({
					status: "error",
					message: "Group not found."
				})

				return
			}

			let isMember = false
		    for (let a = 0; a < group.members.length; a++) {
		    	if (group.members[a].user._id.toString() == user._id.toString()
		    		&& group.members[a].status == "Accepted") {
		    		isMember = true
		    		break
		    	}
		    }

		    if (!isMember) {
				result.json({
					status: "error",
					message: "You are not a member of this group."
				})

				return
			}

	        const buffer = Buffer.from(base64, "base64")
	        const voiceNote = "voice-notes/" + new Date().getTime() + ".webm"
	        await fileSystem.writeFileSync(voiceNote, buffer)

	        const messageObj = {
				message: null,
				savedPaths: [],
				voiceNote: voiceNote,
				type: "group",
				group: {
					_id: group._id,
					name: group.name
				},
				user: {
					_id: user._id,
					name: user.name
				},
				isDeleted: false,
            	createdAt: new Date().getTime()
			}

			const response = await database.collection("messages").insertOne(messageObj)
			messageObj._id = response.insertedId

	        result.json({
	            "status": "success",
	            "message": "Message has been sent.",
	            "data": messageObj
	        })
		})


		app.post("/inviteMemberForGroupChat", async function (request, result) {
			// get logged-in users
		    const accessToken = request.fields.accessToken
		    const _id = request.fields._id ?? ""
		    const email = request.fields.email ?? ""

		    const user = await database.collection("users").findOne({
				accessToken: accessToken
			})
			
			if (user == null) {
				result.json({
					status: "error",
					message: "User has been logged out. Please login again."
				})
				return
			}
			
			if (user.isBanned) {
				result.json({
					status: "error",
					message: "Ha sido bloqueado"
				})
				return
			}

			const group = await database.collection("groupChats").findOne({
				_id: ObjectId(_id)
		    })

		    if (group == null) {
				result.json({
					status: "error",
					message: "Group not found."
				})

				return
			}

			/*let isMember = false
		    for (let a = 0; a < group.members.length; a++) {
		    	if (group.members[a].user._id.toString() == user._id.toString()
		    		&& group.members[a].status == "Accepted") {
		    		isMember = true
		    		break
		    	}
		    }

		    if (!isMember) {
				result.json({
					status: "error",
					message: "You are not a member of this group."
				})

				return
			}*/

			if (group.createdBy._id.toString() != user._id.toString()) {
				result.json({
					status: "error",
					message: "Unauthorized."
				})

				return
			}

			const otherUser = await database.collection("users").findOne({
				email: email
			})
			
			if (otherUser == null) {
				result.json({
					status: "error",
					message: "User does not exists."
				})

				return
			}

			for (let a = 0; a < group.members.length; a++) {
				if (group.members[a].user._id.toString() == otherUser._id.toString()) {
					result.json({
						status: "error",
						message: "User is already a member of this group."
					})

					return
				}
			}

			const obj = {
				_id: ObjectId(),
				status: "Pending",
    			user: {
    				_id: otherUser._id,
    				name: otherUser.name
    			},
    			invitedBy: {
    				_id: user._id,
    				name: user.name
    			},
    			createdAt: new Date().getTime()
			}

			await database.collection("groupChats").findOneAndUpdate({
				_id: group._id
			}, {
				$push: {
					members: obj
				}
			})

			result.json({
				status: "success",
				message: "Invitation has been sent."
			})
		})

		app.post("/getGroupChat", async function (request, result) {
			// get logged-in users
		    const accessToken = request.fields.accessToken
		    const _id = request.fields._id ?? ""

		    const user = await database.collection("users").findOne({
				accessToken: accessToken
			})
			
			if (user == null) {
				result.json({
					status: "error",
					message: "User has been logged out. Please login again."
				})
				return
			}
			
			if (user.isBanned) {
				result.json({
					status: "error",
					message: "Ha sido bloqueado"
				})
				return
			}

			const group = await database.collection("groupChats").findOne({
				_id: ObjectId(_id)
		    })

		    if (group == null) {
				result.json({
					status: "error",
					message: "Group not found."
				})

				return
			}

			const data = []
			const messages = await database.collection("messages").find({
				$and: [{
					"group._id": group._id
				}, {
					isDeleted: false
				}]
			})
				.sort({
					createdAt: -1
				})
				.toArray()

			for (let a = 0; a < messages.length; a++) {
		        data.push({
		            _id: messages[a]._id.toString(),
		            message: messages[a].message ? cryptr.decrypt(messages[a].message) : "",
		            voiceNote: messages[a].voiceNote,
		            savedPaths: messages[a].savedPaths,
					user: messages[a].user,
	            	createdAt: messages[a].createdAt
		        })
		    }

			result.json({
				status: "success",
				message: "Data has been fetched.",
				data: data
			})
		})

		app.post("/sendGroupMessage", async function (request, result) {
			// get logged-in users
		    const accessToken = request.fields.accessToken
		    const message = request.fields.message ?? ""
		    const _id = request.fields._id ?? ""

		    const user = await database.collection("users").findOne({
				accessToken: accessToken
			})
			
			if (user == null) {
				result.json({
					status: "error",
					message: "User has been logged out. Please login again."
				})
				return
			}
			
			if (user.isBanned) {
				result.json({
					status: "error",
					message: "Ha sido bloqueado"
				})
				return
			}

			const group = await database.collection("groupChats").findOne({
				_id: ObjectId(_id)
		    })

		    if (group == null) {
				result.json({
					status: "error",
					message: "Group not found."
				})

				return
			}

			let isMember = false
		    for (let a = 0; a < group.members.length; a++) {
		    	if (group.members[a].user._id.toString() == user._id.toString()
		    		&& group.members[a].status == "Accepted") {
		    		isMember = true
		    		break
		    	}
		    }

		    if (!isMember) {
				result.json({
					status: "error",
					message: "You are not a member of this group."
				})

				return
			}

			const files = []
	        if (Array.isArray(request.files.files)) {
	            for (let a = 0; a < request.files.files.length; a++) {
	                files.push(request.files.files[a])
	            }
	        } else {
	            files.push(request.files.files)
	        }

	        functions.callbackFileUpload(files, 0, [], async function (savedPaths) {
	        	const messageObj = {
					message: cryptr.encrypt(message),
					savedPaths: savedPaths,
					type: "group",
					group: {
						_id: group._id,
						name: group.name
					},
					user: {
						_id: user._id,
						name: user.name
					},
					isDeleted: false,
	            	createdAt: new Date().getTime()
				}

				const response = await database.collection("messages").insertOne(messageObj)

				messageObj.message = cryptr.decrypt(messageObj.message)
				messageObj._id = response.insertedId

				result.json({
		            status: "success",
		            message: "Message has been sent.",
		            data: messageObj
		        })
	        })
		})

		// POST API to fetch groups
		app.post("/fetchGroupsForChat", async function (request, result) {
		    // get logged-in users
		    const accessToken = request.fields.accessToken

		    const user = await database.collection("users").findOne({
				accessToken: accessToken
			})
			
			if (user == null) {
				result.json({
					status: "error",
					message: "User has been logged out. Please login again."
				})
				return
			}
			
			if (user.isBanned) {
				result.json({
					status: "error",
					message: "Ha sido bloqueado"
				})
				return
			}
		 
		    // get groups of which I am an admin or a member
		    const groups = await database.collection("groupChats").find({
		        "members.user._id": user._id
		    })
		        .sort({
		            createdAt: -1
		        })
		        .toArray();
		 
		    // return the groups and logged-in user object
		    result.json({
		        status: "success",
		        message: "Groups has been fetched.",
		        groups: groups
		    })
		})


//Personas Cerca

//** */
app.post("/fetchNearbyCom", async function (request, result) {
	const accessToken = request.fields.accessToken

	const user = await database.collection("users").findOne({
		accessToken: accessToken
	})

	
	if (user == null) {
		result.json({
			status: "error",
			message: "User has been logged out. Please login again."
		})
		return
	}
	
	if (user.isBanned) {
		result.json({
			status: "error",
			message: "Ha sido bloqueado"
		})
		return
	}

	const data = []
	var _id = request.params._id;
	if (typeof user.country !== "undefined") {
		let users = await database.collection("users").find({
			$and: [{
				_id: {
					$ne: user._id
				}
			}, {
				"country": user.country
				
			}]
		}).toArray()
		
	//
		users = users.sort(function (a, b) {
			return 0.5 - Math.random()
		})
		for (let a = 0; a < users.length; a++) {
			data.push({
				_id: users[a]._id,
				name: users[a].name,
				profileImage: users[a].profileImage,
				country: users[a].country
				
			})
		}
	}



	result.json({
		status: "success",
		message: "Data has been fetched.",
		data: data
	})
})
//Personas Cerca
		app.get("/people-nearby", async function (request, result) {
			result.render("people-nearby")
		})

//*** */



		app.post("/getSingleStory", async function (request, result) {
			const accessToken = request.fields.accessToken;
			const userId = request.fields.userId;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			const isFriend = functions.isUserFriend(user, userId);

			if (userId != user._id.toString() && !isFriend) {
				result.json({
					"status": "error",
					"message": "Unauthorized."
				});
				return false;
			}

			const stories = await database.collection("stories").find({
				$and: [{
					"user._id": ObjectId(userId)
				}, {
					"status": "active"
				}]
			}).toArray();

			if (isFriend) {
				for (let a = 0; a < stories.length; a++) {
					delete stories[a].viewers;
				}
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"stories": stories,
				"isMyStory": (userId == user._id.toString())
			});
		});

		app.get("/viewStory/:userId", async function (request, result) {
			const userId = request.params.userId;

			result.render("viewStory", {
				"userId": userId
			});
		});

		app.post("/getStories", async function (request, result) {
			const accessToken = request.fields.accessToken;
		
			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			const myStories = await database.collection("stories").find({
				$and: [{
					"user._id": user._id
				}, {
					"status": "active"
				}]
			}).toArray();

			let data = [];
			for (let a = 0; a < myStories.length; a++) {
				data.push(myStories[a]);
			}

			let myFriendsIds = [];
			for (let a = 0; a < user.friends.length; a++) {
				myFriendsIds.push(user.friends[a]._id);
			}

			const myFriendStories = await database.collection("stories").find({
				$and: [{
					"user._id": {
						$in: myFriendsIds
					}
				}, {
					"status": "active"
				}]
			}).toArray();

			for (let a = 0; a < myFriendStories.length; a++) {
				data.push(myFriendStories[a]);
			}

			let newArr = [];
			for (let a = 0; a < data.length; a++) {
				let flag = false;
				for (let b = 0; b < newArr.length; b++) {
					if (data[a].user._id.toString() == newArr[b].user._id.toString()) {
						flag = true;
						break;
					}
				}
				if (!flag) {
					newArr.push(data[a]);
				}
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": newArr
			});
		});

		app.route("/addStory")
			.get(function (request, result) {
				result.render("addStory");
			})
			.post(async function (request, result) {
				const accessToken = request.fields.accessToken;
				const length = request.fields.length;
			
				var user = await database.collection("users").findOne({
					"accessToken": accessToken
				});

				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
					return false;
				}

				functions.addStory(request, user, length, 0, function () {
					result.json({
						"status": "success",
						"message": "Story has been added."
					});
				}, function (error) {
					result.json({
						"status": "error",
						"message": error
					});
				});
			});

		app.get("/signup", function (request, result) {
			result.render("signup");
		});

		app.get("/forgot-password", function (request, result) {
			result.render("forgot-password");
		});

		app.post("/sendRecoveryLink", function (request, result) {

			var email = request.fields.email;
			
			database.collection("users").findOne({
				"email": email
			}, function (error, user) {
				if (user == null) {
					result.json({
						'status': "error",
						'message': "Correo no existes."
					});
				} else {
					var reset_token = new Date().getTime();
					
					database.collection("users").findOneAndUpdate({
						"email": email
					}, {
						$set: {
							"reset_token": reset_token
						}
					}, function (error, data) {
						
						var transporter = nodemailer.createTransport(nodemailerObject);

						var text = "Please click the following link to reset your password: " + mainURL + "/ResetPassword/" + email + "/" + reset_token;
						var html = "Please click the following link to reset your password: <br><br> <a href='" + mainURL + "/ResetPassword/" + email + "/" + reset_token + "'>Reset Password</a> <br><br> Thank you.";

						transporter.sendMail({
							from: nodemailerFrom,
							to: email,
							subject: "Reset Password",
							text: text,
							html: html
						}, function (error, info) {
							if (error) {
								console.error(error);
							} else {
								console.log("Email sent: " + info.response);
							}
							
							result.json({
								'status': "success",
								'message': 'Email has been sent with the link to recover the password.'
							});
						});
						
					});
				}
			});
		});

		app.get("/ResetPassword/:email/:reset_token", function (request, result) {

			var email = request.params.email;
			var reset_token = request.params.reset_token;

			result.render("reset-password", {
				"email": email,
				"reset_token": reset_token
			});
		});

		app.get("/verifyEmail/:email/:verification_token", function (request, result) {

			var email = request.params.email;
			var verification_token = request.params.verification_token;

			database.collection("users").findOne({
				$and: [{
					"email": email,
				}, {
					"verification_token": parseInt(verification_token)
				}]
			}, function (error, user) {
				if (user == null) {
					result.json({
						'status': "error",
						'message': 'Correo no existes. Or verification link is expired.'
					});
				} else {

					database.collection("users").findOneAndUpdate({
						$and: [{
							"email": email,
						}, {
							"verification_token": parseInt(verification_token)
						}]
					}, {
						$set: {
							"verification_token": "",
							"isVerified": true
						}
					}, function (error, data) {
						result.json({
							'status': "success",
							'message': 'Account has been verified. Please try login.'
						});
					});
				}
			});
		});

		app.post("/ResetPassword", function (request, result) {
		    var email = request.fields.email;
		    var reset_token = request.fields.reset_token;
		    var new_password = request.fields.new_password;
		    var confirm_password = request.fields.confirm_password;

		    if (new_password != confirm_password) {
		    	result.json({
					'status': "error",
					'message': 'Password does not match.'
				});
		        return;
		    }

		    database.collection("users").findOne({
				$and: [{
					"email": email,
				}, {
					"reset_token": parseInt(reset_token)
				}]
			}, function (error, user) {
				if (user == null) {
					result.json({
						'status': "error",
						'message': 'Correo no existes. Or recovery link is expired.'
					});
				} else {

					bcrypt.genSalt(10, function(err, salt) {
						bcrypt.hash(new_password, salt, async function(err, hash) {
							database.collection("users").findOneAndUpdate({
								$and: [{
									"email": email,
								}, {
									"reset_token": parseInt(reset_token)
								}]
							}, {
								$set: {
									"reset_token": "",
									"password": hash
								}
							}, function (error, data) {
								result.json({
									'status': "success",
									'message': 'Password has been changed. Please try login again.'
								})
							})
						})
					})
				}
			})
		})

		app.get("/change-password", function (request, result) {
			result.render("change-password");
		});

		app.post("/changePassword", function (request, result) {
			
			var accessToken = request.fields.accessToken;
			var current_password = request.fields.current_password;
			var new_password = request.fields.new_password;
			var confirm_password = request.fields.confirm_password;

			if (new_password != confirm_password) {
		    	result.json({
					'status': "error",
					'message': 'Password does not match.'
				});
		        return;
		    }

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					bcrypt.compare(password, user.password, async function(err, res) {
						if (res === true) {
							bcrypt.genSalt(10, function(err, salt) {
								bcrypt.hash(new_password, salt, async function(err, hash) {
									database.collection("users").findOneAndUpdate({
										"accessToken": accessToken
									}, {
										$set: {
											"password": hash
										}
									}, function (error, data) {
										result.json({
											"status": "success",
											"message": "Password has been changed"
										})
									})
								})
							})
						} else {
							result.json({
								"status": "error",
								"message": "Current Contraseña no es correcta"
							})
						}
					})
				}
			})
		})

		app.post("/signup", function (request, result) {
			var name = request.fields.name;
			var username = request.fields.username;
			var email = request.fields.email;
			var password = request.fields.password;
			var gender = request.fields.gender;
			var reset_token = "";
			var isVerified = true;
			var isBanned = false;
			var verification_token = new Date().getTime();
			// verification_token = ""
			
			database.collection("users").findOne({
				$or: [{
					"email": email
				}, {
					"username": username
				}]
			}, function (error, user) {
				if (user == null) {
				const dominio = email.split("@");
				console.log(dominio)
				if(dominio[1]=="santillana.com"||dominio[1]=="clb.santillana.com"){
					bcrypt.genSalt(10, function(err, salt) {
					    bcrypt.hash(password, salt, async function(err, hash) {
					    	database.collection("users").insertOne({
								"name": name,
								"username": username,
								"email": email,
								"password": hash,
								"gender": gender,
								"reset_token": reset_token,
								"profileImage": "",
								"coverPhoto": "",
								"dob": "",
								"city": "",
								"country": "",
								"aboutMe": "",
								"friends": [],
								"notifications": [],
								"groups": [],
								"isVerified": isVerified,
								"verification_token": verification_token,
								"isBanned": isBanned
							}, function (error, data) {
								if (password.length >= 8 && password.length<=12) {
									result.json({
										"status": "success",
										"message": "Se ha registrado correctamente. Podrás iniciar sesión y empezar a usar Al día Ecuador."
									});
								} else {
									result.json({
										"status": "error",
										"message": "La contraseña debe contener al menos 8 dígitos y no más de 12"
									});
								}
					
							})
					    })
					})
				}else{
					result.json({
						"status": "error",
						"message": "El dominio del correo electrónico no es el correcto"
					});
				}
				} else {
					result.json({
						"status": "error",
						"message": "Correo ya existe."
					});
				}
			});
		});

		app.get("/login", function (request, result) {
			result.render("login");
		})

		app.post("/getKeys", async function (request, result) {
			const accessToken = request.fields.accessToken
			const _id = request.fields.user
			
			const me = await database.collection("users").findOne({
				accessToken: accessToken
			})

			if (me == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (me.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return
			}

			const user = await database.collection("users").findOne({
				_id: ObjectId(_id)
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User does not exists."
				})

				return
			}

			result.json({
				status: "success",
				message: "Data has been fetched.",
				privateKey: me.privateKey,
				publicKey: user.publicKey
			})
		})

		app.post("/updateKeys", async function (request, result) {
			const email = request.fields.email
			const publicKey = request.fields.publicKey
			const privateKey = request.fields.privateKey

			if (!email || !publicKey || !privateKey) {
				result.json({
					"status": "error",
					"message": "Please fill all fields."
				})
				return
			}

			const user = await database.collection("users").findOne({
				email: email
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return
			}

			await database.collection("users").findOneAndUpdate({
				_id: user._id
			}, {
				$set: {
					publicKey: publicKey,
					privateKey: privateKey
				}
			})

			result.json({
				"status": "success",
				"message": "Keys has been updated.",
				"profileImage": user.profileImage
			})
		})

		app.post("/login", function (request, result) {
			var email = request.fields.email;
			var password = request.fields.password;
			database.collection("users").findOne({
				"email": email
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "Correo no existe"
					});
					
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					bcrypt.compare(password, user.password, function (error, res) {
						if (res === true) {
							const dominio = user.email.split("@");
							console.log(dominio)
							if(dominio[1]=="santillana.com"||dominio[1]=="clb.santillana.com"){
							
							if (user.isVerified) {
								var accessToken = jwt.sign({ email: email }, accessTokenSecret);
								database.collection("users").findOneAndUpdate({
									"email": email
								}, {
									$set: {
										"accessToken": accessToken
									}
								}, function (error, data) {
									result.json({
										"status": "success",
										"message": "Login successfully",
										"accessToken": accessToken,
										"profileImage": user.profileImage,
										"hasKey": user.publicKey
									});
									return
								});
							}  else {
								result.json({
									"status": "error",
									"message": "Kindly verify your email."
								});
								return
							}
							}else{
								result.json({
									"status": "error",
									"message": "Escriba el dominio correcto."
								});
								return
							}	
						} else {
							result.json({
								"status": "error",
								"message": "Contraseña no es correcta"
							});
							return
						}
					});
				}
			});
		});

		app.get("/user/:username", async function (request, result) {
			let user = null

			user = await database.collection("users").findOne({
				username: request.params.username
			})

			if (user == null) {

				user = await database.collection("users").findOne({
					_id: ObjectId(request.params.username)
				})

				if (user == null) {
					result.render("errors/404", {
						"message": "This account does not exists anymore."
					})

					return
				}
			}

			result.render("userProfile", {
				"user": user
			})
		})

		app.get("/updateProfile", function (request, result) {
			result.render("updateProfile")
		})

		app.post("/getUser", async function (request, result) {
			const accessToken = request.fields.accessToken
			
			const user = await database.collection("users").findOne({
				accessToken: accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return
			}

			user.profileViewers = await database.collection("profile_viewers").find({
				"profile._id": user._id
			}).toArray()

			user.pages = await database.collection("pages").find({
				"user._id": user._id
			}).toArray()

			let hasLocationExpired = true
			if (typeof user.location !== "undefined") {
				const currentTimestamp = new Date().setDate(new Date().getDate() + 1)
				if (currentTimestamp > user.location.createdAt) {
					hasLocationExpired = false
				}
			}

			if (hasLocationExpired) {
				requestModule.post("http://www.geoplugin.net/json.gp", {
	                formData: null
	            }, async function(err, res, data) {
	                if (!err && res.statusCode === 200) {
	                    // console.log(data)

	                    data = JSON.parse(data)

	                    const city = data.geoplugin_city
						const continent = data.geoplugin_continentName
						const country = data.geoplugin_countryName
						const currencyConverter = data.geoplugin_currencyConverter
						const latitude = parseFloat(data.geoplugin_latitude)
						const longitude = parseFloat(data.geoplugin_longitude)
						const region = data.geoplugin_region
						const ipAddress = data.geoplugin_request
						const timezone = data.geoplugin_timezone

						const locationObj = {
							city: city,
							continent: continent,
							country: country,
							currencyConverter: currencyConverter,
							latitude: latitude,
							longitude: longitude,
							region: region,
							ipAddress: ipAddress,
							timezone: timezone,
							createdAt: new Date().getTime()
						}

						await database.collection("users").findOneAndUpdate({
							_id: user._id
						}, {
							$set: {
								location: locationObj
							}
						})
	                }
	            })
			}
//user
			result.json({
				"status": "success",
				"message": "Record has been fetched.",
				"data": {
					_id: user._id,
					name: user.name,
					username: user.username,
					email: user.email,
					password: user.password,
					gender: user.gender,
					profileImage: user.profileImage,
					coverPhoto: user.coverPhoto,
					dob: user.dob,
					city: user.city,
					country: user.country,
					aboutMe: user.aboutMe,
					friends: user.friends,
					pages: user.pages,
					notifications: user.notifications,
					groups: user.groups,
					accessToken: user.accessToken,
					profileViewers: user.profileViewers
				}
			})
		})

		app.get("/logout", function (request, result) {
			result.redirect("/login");
		});
//
app.post("/uploadCoverPhoto", function (request, result) {
	var accessToken = request.fields.accessToken;
  
	database.collection("users").findOne({
	  "accessToken": accessToken
	}, function (error, user) {
	  if (user == null) {
		result.json({
		  "status": "error",
		  "message": "User has been logged out. Please login again."
		});
	  } else {
		if (user.isBanned) {
		  result.json({
			"status": "error",
			"message": "Ha sido bloqueado"
		  });
		  return false;
		}
  
		if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {
  
		  if (user.coverPhoto != "") {
			// Delete the previous cover photo from Google Cloud Storage
			const fileName = user.coverPhoto.split('/').pop();
			const bucket = storage.bucket(bucketName);
			bucket.file(`covers/${fileName}`).delete().catch((err) => {
			  console.error('Error deleting previous cover photo from GCS:', err);
			});
		  }
  
		  // Upload the new cover photo to Google Cloud Storage
		  const coverPhoto = `${request.files.coverPhoto.name}`;
		  console.log(coverPhoto);
		  const bucket = storage.bucket(bucketName);
		  const blob = bucket.file(coverPhoto);
  
		  // Stream the file to Google Cloud Storage
		  fileSystem.createReadStream(request.files.coverPhoto.path)
			.pipe(blob.createWriteStream())
			.on('error', (err) => {
			  console.error('Error uploading cover photo to GCS:', err);
			  result.json({
				"status": "error",
				"message": "An error occurred while uploading the cover photo."
			  });
			})
			.on('finish', () => {
			  // Update the user's coverPhoto field in the database
			  
			  database.collection("users").updateOne({
				"accessToken": accessToken
			}, {
				$set: {
					"coverPhoto": coverPhoto
				}
			}, async function (error, data) {

				await functions.updateUser(user, coverPhoto, user.name);

				result.json({
					"status": "status",
					"message": "Profile image has been updated.",
					data: photoURL + "/" + coverPhoto
				});
			});
			});
  
		  // Delete the local file after uploading
		  fileSystem.unlink(request.files.coverPhoto.path, (err) => {
			if (err) {
			  console.error('Error deleting local cover photo:', err);
			} else {
			  console.log('Local cover photo deleted!');
			}
		  });
		} else {
		  result.json({
			"status": "error",
			"message": "Please select a valid image."
		  });
		}
	  }
	});
  });

// Profile 
app.post("/uploadProfileImage", function (request, result) {
	var accessToken = request.fields.accessToken;
	var profileImage = "";
  
	database.collection("users").findOne({
	  "accessToken": accessToken
	}, function (error, user) {
	  if (user == null) {
		result.json({
		  "status": "error",
		  "message": "User has been logged out. Please login again."
		});
	  } else {
		if (user.isBanned) {
		  result.json({
			"status": "error",
			"message": "Ha sido bloqueado"
		  });
		  return false;
		}
  
		if (request.files.profileImage.size > 0 && request.files.profileImage.type.includes("image")) {
		  if (user.profileImage != "") {
			// Delete the previous profile image from Google Cloud Storage
			const fileName = user.profileImage.split('/').pop();
			const bucket = storage.bucket(bucketName);
			bucket.file(`profiles/${fileName}`).delete().catch((err) => {
			  console.error('Error deleting previous profile image from GCS:', err);
			});
		  }
  
		  // Upload the new profile image to Google Cloud Storage
		  profileImage = `${request.files.profileImage.name}`;
		  const bucket = storage.bucket(bucketName);
		  const blob = bucket.file(profileImage);
  
		  // Stream the file to Google Cloud Storage
		  fileSystem.createReadStream(request.files.profileImage.path)
			.pipe(blob.createWriteStream())
			.on('error', (err) => {
			  console.error('Error uploading profile image to GCS:', err);
			  result.json({
				"status": "error",
				"message": "An error occurred while uploading the profile image."
			  });
			})
			.on('finish', async () => {
			  // Update the user's profileImage field in the database
			  database.collection("users").updateOne(
				{ "accessToken": accessToken },
				{ $set: { "profileImage": profileImage } },
				async function (error, data) {
				  await functions.updateUser(user, profileImage, user.name);
				  result.json({
					"status": "success",
					"message": "Profile image has been updated.",
					data: `https://storage.googleapis.com/${bucketName}/${profileImage}`
				  });
				}
			  );
			});
  
		  // Delete the local file after uploading
		  fileSystem.unlink(request.files.profileImage.path, (err) => {
			if (err) {
			  console.error('Error deleting local profile image:', err);
			} else {
			  console.log('Local profile image deleted!');
			}
		  });
		} else {
		  result.json({
			"status": "error",
			"message": "Please select a valid image."
		  });
		}
	  }
	});
  });
  
//
		app.post("/updateProfile", function (request, result) {
			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var dob = request.fields.dob;
			var city = request.fields.city;
			var country = request.fields.country;
			var aboutMe = request.fields.aboutMe;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("users").updateOne({
						"accessToken": accessToken
					}, {
						$set: {
							"name": name,
							"dob": dob,
							"city": city,
							"country": country,
							"aboutMe": aboutMe
						}
					}, async function (error, data) {

						await functions.updateUser(user, user.profileImage, name);

						result.json({
							"status": "status",
							"message": "Perfil ha sido actualizado."
						});
					});
				}
			});
		});

		app.get("/post/:id", function (request, result) {
			database.collection("posts").findOne({
				"_id": ObjectId(request.params.id)
			}, function (error, post) {
				if (post == null) {
					result.render("errors/404", {
						"message": "This post does not exist anymore."
					});
				} else {
					result.render("postDetail", {
						"post": post
					});
				}
			});
		});

		app.get("/", function (request, result) {
			result.render("index")
		})

		app.post("/addPost", function (request, result) {
			addPost.execute(request, result);
		});

        app.post("/getUserFeed", async function (request, result) {
            var username = request.fields.username;
            var authUsername = request.fields.auth_user;

            var profile = await database.collection("users").findOne({
                "username": username
            });
            if (profile == null) {
                result.json({
                    "status": "error",
                    "message": "User does not exist."
                });
                return;
            }

            var authUser = await database.collection("users").findOne({
                "username": authUsername
            });
            if (authUser == null) {
                result.json({
                    "status": "error",
                    "message": "Sorry, you have been logged out."
                });
                return;
            }

            /* add or update the profile views counter */
            if (authUsername != username) {
                var hasViewed = await database.collection("profile_viewers").findOne({
                    $and: [{
                        "profile._id": profile._id
                    }, {
                        "user._id": authUser._id
                    }]
                });
                if (hasViewed == null) {
                    /* insert the view. */
                    /* username is saved so the other person can visit his profile. */
                    await database.collection("profile_viewers").insertOne({
                        "profile": {
                            "_id": profile._id,
                            "name": profile.name,
                            "username": profile.username,
                            "profileImage": profile.profileImage
                        },
                        "user": {
                            "_id": authUser._id,
                            "name": authUser.name,
                            "username": authUser.username,
                            "profileImage": authUser.profileImage
                        },
                        "views": 1,
                        "viewed_at": new Date().getTime()
                    });
                } else {
                    /* increment the counter and time */
                    await database.collection("profile_viewers").updateOne({
                        "_id": hasViewed._id
                    }, {
                        $inc: {
                            "views": 1
                        },
                        $set: {
                            "viewed_at": new Date().getTime()
                        }
                    });
                }
            }

            database.collection("posts")
	            .find({
	                "user._id": profile._id
	            })
	            .sort({
	                "createdAt": -1
	            })
	            .limit(5)
	            .toArray(function (error, data) {
	                result.json({
	                    "status": "success",
	                    "message": "Record has been fetched",
	                    "data": data
	                });
	            });
        });

        app.get("/profileViews", function (request, result) {
        	result.render("profileViews");
        });

		app.post("/getNewsfeed", async function (request, result) {
			var accessToken = request.fields.accessToken

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})
				return false
			}

			var ids = []
			ids.push(user._id)

			for (var a = 0; a < user.groups.length; a++) {
				if (user.groups[a].status == "Accepted") {
					ids.push(user.groups[a]._id);
				}
			}

			for (var a = 0; a < user.friends.length; a++) {
                if (user.friends[a].status == "Accepted") {
					ids.push(user.friends[a]._id);
                }
			}

			const advertisements = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "newsfeed"
				}, {
					status: "active"
				}]
			}).toArray()

			const postIds = []
			for (let a = 0; a < advertisements.length; a++) {
				postIds.push(advertisements[a].post._id)
			}

			let data = await database.collection("posts")
				.find({
					$or: [{
						"user._id": {
							$in: ids
						}
					}, {
						$and: [{
							_id: {
								$in: postIds
							}
						}, {
							isBoost: true
						}]
					}]
				})
				.sort({
					"createdAt": -1
				})
				.limit(5)
				.toArray()

			// data = data.sort(function (a, b) {
			// 	return 0.5 - Math.random()
			// })

			result.json({
				"status": "success",
				"message": "Record has been fetched",
				"data": data
			})
		})

		app.post("/toggleDislikeStory", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			const post = await database.collection("stories").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Story does not exist."
				})

				return
			}

			var isDisliked = false;
			const dislikers = post.dislikers || []
			for (var a = 0; a < dislikers.length; a++) {
				var disliker = dislikers[a];

				if (disliker._id.toString() == user._id.toString()) {
					isDisliked = true;
					break
				}
			}

			if (isDisliked) {
				await database.collection("stories").updateOne({
					"_id": ObjectId(_id)
				}, {
					$pull: {
						"dislikers": {
							"_id": user._id,
						}
					}
				})

				result.json({
					"status": "undisliked",
					"message": "Story has been un-disliked."
				})

				return
			}

			await database.collection("stories").updateOne({
				"_id": ObjectId(_id)
			}, {
				$push: {
					"dislikers": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			})

			result.json({
				"status": "success",
				"message": "Story has been disliked."
			})
		})

		app.post("/toggleDislikePost", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			const post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return
			}

			var isDisliked = false;
			const dislikers = post.dislikers || []
			for (var a = 0; a < dislikers.length; a++) {
				var disliker = dislikers[a];

				if (disliker._id.toString() == user._id.toString()) {
					isDisliked = true;
					break
				}
			}

			if (isDisliked) {
				await database.collection("posts").updateOne({
					"_id": ObjectId(_id)
				}, {
					$pull: {
						"dislikers": {
							"_id": user._id,
						}
					}
				})

				result.json({
					"status": "undisliked",
					"message": "Post has been un-disliked."
				})

				return
			}

			await database.collection("posts").updateOne({
				"_id": ObjectId(_id)
			}, {
				$push: {
					"dislikers": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			})

			if (user._id.toString() != post.user._id.toString()) {
				if (post.type == "page_post") {
					const page = await database.collection("pages").findOne({
		                _id: post.user._id
		            })

		            if (page != null) {
		            	await database.collection("users").updateOne({
							_id: page.user._id
						}, {
							$push: {
								notifications: {
									_id: ObjectId(),
									type: "post_disliked",
									content: user.name + " has dis-liked your post.",
									profileImage: user.profileImage,
									isRead: false,
									post: {
										_id: post._id
									},
									createdAt: new Date().getTime()
								}
							}
						})
		            }
				} else if (post.type == "group_post") {
					await database.collection("users").updateOne({
						"_id": post.uploader._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "post_disliked",
								"content": user.name + " has dis-liked your post.",
								"profileImage": user.profileImage,
								"isRead": false,
								"post": {
									"_id": post._id
								},
								"createdAt": new Date().getTime()
							}
						}
					})
				} else if (post.type == "post") {
					await database.collection("users").updateOne({
						"_id": post.user._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "post_disliked",
								"content": user.name + " has dis-liked your post.",
								"profileImage": user.profileImage,
								"isRead": false,
								"post": {
									"_id": post._id
								},
								"createdAt": new Date().getTime()
							}
						}
					})
				}
			}

			result.json({
				"status": "success",
				"message": "Post has been disliked."
			})
		})

		app.post("/toggleLikeStory", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			const post = await database.collection("stories").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Story does not exist."
				})

				return
			}

			var isLiked = false;
			const likers = post.likers || []
			for (var a = 0; a < likers.length; a++) {
				var liker = likers[a];

				if (liker._id.toString() == user._id.toString()) {
					isLiked = true;
					break;
				}
			}

			if (isLiked) {
				await database.collection("stories").updateOne({
					"_id": ObjectId(_id)
				}, {
					$pull: {
						"likers": {
							"_id": user._id,
						}
					}
				})

				result.json({
					"status": "unliked",
					"message": "Story has been unliked."
				})

				return
			}

			await database.collection("users").updateOne({
				"_id": post.user._id
			}, {
				$push: {
					"notifications": {
						"_id": ObjectId(),
						"type": "story_liked",
						"content": user.name + " has liked your story.",
						"profileImage": user.profileImage,
						"isRead": false,
						"story": {
							"_id": post._id
						},
						"createdAt": new Date().getTime()
					}
				}
			})

			await database.collection("stories").updateOne({
				"_id": ObjectId(_id)
			}, {
				$push: {
					"likers": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			})

			result.json({
				"status": "success",
				"message": "Story has been liked."
			})
		})

		app.post("/toggleLikePost", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			const post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return
			}

			var isLiked = false;
			const likers = post.likers || []
			for (var a = 0; a < likers.length; a++) {
				var liker = likers[a];

				if (liker._id.toString() == user._id.toString()) {
					isLiked = true;
					break;
				}
			}

			if (isLiked) {
				await database.collection("posts").updateOne({
					"_id": ObjectId(_id)
				}, {
					$pull: {
						"likers": {
							"_id": user._id,
						}
					}
				})

				result.json({
					"status": "unliked",
					"message": "Post has been unliked."
				})

				return
			}

			if (user._id.toString() != post.user._id.toString()) {
				if (post.type == "page_post") {
					const page = await database.collection("pages").findOne({
		                _id: post.user._id
		            })

		            if (page != null) {
		            	await database.collection("users").updateOne({
							_id: page.user._id
						}, {
							$push: {
								notifications: {
									_id: ObjectId(),
									type: "post_liked",
									content: user.name + " le ha gustado tu publicación.",
									profileImage: user.profileImage,
									isRead: false,
									post: {
										_id: post._id
									},
									createdAt: new Date().getTime()
								}
							}
						})
		            }
				} else if (post.type == "group_post") {
					await database.collection("users").updateOne({
						"_id": post.uploader._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "post_liked",
								"content": user.name + " le ha gustado tu publicación.",
								"profileImage": user.profileImage,
								"isRead": false,
								"post": {
									"_id": post._id
								},
								"createdAt": new Date().getTime()
							}
						}
					})
				} else if (post.type == "post") {
					await database.collection("users").updateOne({
						"_id": post.user._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "post_liked",
								"content": user.name + " le ha gustado tu publicación.",
								"profileImage": user.profileImage,
								"isRead": false,
								"post": {
									"_id": post._id
								},
								"createdAt": new Date().getTime()
							}
						}
					})
				}
			}

			await database.collection("posts").updateOne({
				"_id": ObjectId(_id)
			}, {
				$push: {
					"likers": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			})

			result.json({
				"status": "success",
				"message": "Post has been liked."
			})
		})



		app.post("/fetchCommentsByPost", async function (request, result) {
			const accessToken = request.fields.accessToken
			const _id = request.fields._id

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return
			}

			const post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return
			}

			let comments = post.comments
			comments = comments.reverse()

			result.json({
				status: "success",
				message: "Data has been fetched.",
				comments: comments
			})
		})


		app.post("/postComment", async function (request, result) {
			var accessToken = request.fields.accessToken
			var _id = request.fields._id
			var comment = request.fields.comment
			if(comment = filter.isProfane(comment)){
				result.json({
					"status": "error",
					"message": "Contiene lenguaje ofensivo o abusivo."
				})
			}else{
				var comment = request.fields.comment
			
			var createdAt = new Date().getTime()

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return
			}

			const post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return
			}

			var commentId = ObjectId()
			const commentObj = {
				"_id": commentId,
				"user": {
					"_id": user._id,
					"name": user.name,
					"profileImage": user.profileImage,
				},
				"comment": comment,
				"createdAt": createdAt,
				"replies": []
			}

			await database.collection("posts").updateOne({
				"_id": ObjectId(_id)
			}, {
				$push: {
					"comments": commentObj
				}
			})

			if (user._id.toString() != post.user._id.toString()) {
				if (post.type == "page_post") {
					const page = await database.collection("pages").findOne({
		                _id: post.user._id
		            })

		            if (page != null) {
		            	await database.collection("users").updateOne({
							_id: page.user._id
						}, {
							$push: {
								notifications: {
									_id: ObjectId(),
									type: "new_comment",
									content: user.name + " comento en tu publicacion.",
									profileImage: user.profileImage,
									isRead: false,
									post: {
										_id: post._id
									},
									createdAt: new Date().getTime()
								}
							}
						})
		            }
				} else if (post.type == "group_post") {
					await database.collection("users").updateOne({
						"_id": post.uploader._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "new_comment",
								"content": user.name + " comento en tu publicacion.",
								"profileImage": user.profileImage,
								"post": {
									"_id": post._id
								},
								"isRead": false,
								"createdAt": new Date().getTime()
							}
						}
					})
				} else if (post.type == "post") {
					await database.collection("users").updateOne({
						"_id": post.user._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "new_comment",
								"content": user.name + " commented on your post.",
								"profileImage": user.profileImage,
								"post": {
									"_id": post._id
								},
								"isRead": false,
								"createdAt": new Date().getTime()
							}
						}
					})
				}
			}

			const updatePost = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (updatePost == null) {
				result.json({
					"status": "success",
					"message": "Post does not exists."
				})

				return
			}

			socketIO.emit("commentPosted", {
				post: updatePost,
				comment: commentObj
			})

			result.json({
				"status": "success",
				"message": "Comentario hecho",
				"updatePost": updatePost
			})
		}
		})
	
		app.get("/search/:query", function (request, result) {
			var query = request.params.query
			result.render("search", {
				"query": query
			})
		})

		app.post("/search", async function (request, result) {
			const query = request.fields.query

			const users = await database.collection("users").find({
				$or: [{
					"name": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}, {
					"username": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}, {
					"email": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}]
			}).toArray()


			const groups = await database.collection("groups").find({
				"name": {
					$regex: ".*" + query + ".*",
					$options: "i"
				}
			}).toArray()



			result.json({
				status: "success",
				message: "Record has been fetched",
				users: users,
				groups: groups,

			})
		})

		app.post("/sendFriendRequest", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					var me = user;
					database.collection("users").findOne({
						"_id": ObjectId(_id)
					}, function (error, user) {
						if (user == null) {
							result.json({
								"status": "error",
								"message": "User does not exist."
							});
						} else {

                            if (_id.toString() == me._id.toString()) {
                                result.json({
                                    "status": "error",
                                    "message": "You cannot send a friend request to yourself."
                                });
                                return;
                            }

                            database.collection("users").findOne({
                                $and: [{
                                    "_id": ObjectId(_id)
                                }, {
                                    "friends._id": me._id
                                }]
                            }, function (error, isExists) {
                                if (isExists) {
                                    result.json({
                                        "status": "error",
                                        "message": "Friend request already sent."
                                    });
                                } else {
                                    database.collection("users").updateOne({
                                        "_id": ObjectId(_id)
                                    }, {
                                        $push: {
                                            "friends": {
                                                "_id": me._id,
                                                "name": me.name,
                                                "username": me.username,
                                                "profileImage": me.profileImage,
                                                "status": "Pending",
                                                "sentByMe": false,
                                                "inbox": []
                                            }
                                        }
                                    }, function (error, data) {

                                        database.collection("users").updateOne({
                                            "_id": me._id
                                        }, {
                                            $push: {
                                                "friends": {
                                                    "_id": user._id,
                                                    "name": user.name,
                                                    "username": user.username,
                                                    "profileImage": user.profileImage,
                                                    "status": "Pending",
                                                    "sentByMe": true,
                                                    "inbox": []
                                                }
                                            }
                                        }, function (error, data) {

                                            result.json({
                                                "status": "success",
                                                "message": "Se ha enviado la solicitud de amistad"
                                            });

                                        });

                                    });
                                }
                            });
						}
					});
				}
			});
		});

		app.get("/friends", function (request, result) {
			result.render("friends");
		});

		app.post("/acceptFriendRequest", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					var me = user;
					database.collection("users").findOne({
						"_id": ObjectId(_id)
					}, function (error, user) {
						if (user == null) {
							result.json({
								"status": "error",
								"message": "User does not exist."
							});
						} else {

                            for (var a = 0; a < me.friends.length; a++) {
                                if (me.friends[a]._id.toString() == _id.toString()
                                    && me.friends[a].status == "Accepted") {
                                    result.json({
                                        "status": "error",
                                        "message": "Friend request already accepted."
                                    });
                                    return;
                                }
                            }

							database.collection("users").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"notifications": {
										"_id": ObjectId(),
										"type": "friend_request_accepted",
										"content": me.name + " acepto tu solicitud de contacto.",
										"profileImage": me.profileImage,
										"isRead": false,
										"createdAt": new Date().getTime()
									}
								}
							});

							database.collection("users").updateOne({
								$and: [{
									"_id": ObjectId(_id)
								}, {
									"friends._id": me._id
								}]
							}, {
								$set: {
									"friends.$.status": "Accepted"
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									$and: [{
										"_id": me._id
									}, {
										"friends._id": user._id
									}]
								}, {
									$set: {
										"friends.$.status": "Accepted"
									}
								}, function (error, data) {

									result.json({
										"status": "success",
										"message": "Solicitud ha sido aceptada"
									});

								});

							});

						}
					});
				}
			});
		});

		app.post("/unfriend", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					var me = user;
					database.collection("users").findOne({
						"_id": ObjectId(_id)
					}, function (error, user) {
						if (user == null) {
							result.json({
								"status": "error",
								"message": "User does not exist."
							});
						} else {

							database.collection("users").updateOne({
								"_id": ObjectId(_id)
							}, {
								$pull: {
									"friends": {
										"_id": me._id
									}
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									"_id": me._id
								}, {
									$pull: {
										"friends": {
											"_id": user._id
										}
									}
								}, function (error, data) {

									result.json({
										"status": "Ok",
										"message": "Contacto ha sido eliminado"
									});

								});

							});

						}
					});
				}
			});
		});

		app.get("/inbox", function (request, result) {
			// result.render("inbox")
			result.render("inbox-new")
		})

		app.post("/sendVoiceNote", function (request, result) {
			chat.sendVoiceNote(request, result)
		})

		app.post("/sendMessage", async function (request, result) {
			// chat.sendMessage(request, result)

			const accessToken = request.fields.accessToken
			const _id = request.fields._id
			const message = request.fields.message
			const messageEncrypted = request.fields.messageEncrypted || ""
			const iv = request.fields.iv || ""

			const me = await database.collection("users").findOne({
	            accessToken: request.fields.accessToken
	        })

	        if (me == null) {
	            result.json({
	                status: "error",
	                message: "User has been logged out. Please login again."
	            })

	            return
	        }

	        const user = await database.collection("users").findOne({
	            _id: ObjectId(_id)
	        })

	        if (user == null) {
	            result.json({
	                status: "error",
	                message: "User does not exist."
	            })

	            return
	        }

	        if (filter.isProfane(message)) {
	            result.json({
	                status: "error",
	                message: "Su mensaje contiene lenguaje abusivo u ofensivo."
	            })

	            return
	        }

	        var messageObj = {
	            _id: ObjectId(),
	            // message: cryptr.encrypt(message),
	            message: messageEncrypted,
	            iv: iv,
	            from: me._id,
	            is_read: false,
	            images: [],
	            videos: [],
	            is_deleted: false,
	            createdAt: new Date().getTime()
	        }

	        const files = []
	        if (Array.isArray(request.files.files)) {
	            for (let a = 0; a < request.files.files.length; a++) {
	                files.push(request.files.files[a])
	            }
	        } else {
	            files.push(request.files.files)
	        }

	        functions.callbackFileUpload(files, 0, [], async function (savedPaths) {
	        	messageObj.savedPaths = savedPaths
	        	
	        	// Other user's data
		        await database.collection("users").updateOne({
		            $and: [{
		                "_id": user._id
		            }, {
		                "friends._id": me._id
		            }]
		        }, {
		            $push: {
		                "friends.$.inbox": messageObj
		            },
		            $inc: {
		                "friends.$.unread": 1
		            }
		        });

		        messageObj.is_read = true;

		        // logged in user's data
		        await database.collection("users").updateOne({
		            $and: [{
		                "_id": me._id
		            }, {
		                "friends._id": user._id
		            }]
		        }, {
		            $push: {
		                "friends.$.inbox": messageObj
		            }
		        });

		        // messageObj.message = cryptr.decrypt(messageObj.message);
		        //socketIO.to(users[user._id]).emit("messageReceived", messageObj)
				socketIO.emit("messageReceived",messageObj)

		        result.json({
		            status: "success",
		            message: "Message has been sent.",
		            data: messageObj
		        })
	        })
		})

		app.post("/deleteMessage", function (request, result) {
			chat.deleteMessage(request, result);
		});

		app.post("/getFriendsChat", function (request, result) {
			chat.getFriendsChat(request, result);
		});

		app.post("/connectSocket", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					users[user._id] = socketID;
					result.json({
						"status": "status",
						"message": "Socket has been connected."
					});
				}
			});
		});

		app.get("/createPage", function (request, result) {
			result.render("createPage");
		});

		app.post("/createPage", function (request, result) {

			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var domainName = request.fields.domainName;
			var additionalInfo = request.fields.additionalInfo;
			var coverPhoto = "";
            var type = request.fields.type;
            var imageData = request.fields.imageData;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

                    if (type == "ios") {

                        coverPhoto = `${request.files.coverPhoto.name}`;;

                        var base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
                        base64Data += base64Data.replace('+', ' ');
                        var binaryData = new Buffer(base64Data, 'base64').toString('binary');
                        fileSystem.writeFile(coverPhoto, binaryData, "binary", function (err) {
                            // console.log(err);
                        });

                        database.collection("pages").insertOne({
                            "name": name,
                            "domainName": domainName,
                            "additionalInfo": additionalInfo,
                            "coverPhoto": coverPhoto,
                            "likers": [],
                            "user": {
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage
                            }
                        }, function (error, data) {

                            result.json({
                                "status": "success",
                                "message": "Page has been created."
                            });

                        });
                    } else {
                        if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {

                            coverPhoto = "public/images/" + new Date().getTime() + "-" + request.files.coverPhoto.name;
                            
                            // Read the file
		                    fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
		                        if (err) throw err;
		                        console.log('File read!');

		                        // Write the file
		                        fileSystem.writeFile(coverPhoto, data, function (err) {
		                            if (err) throw err;
		                            console.log('File written!');

		                            database.collection("pages").insertOne({
		                                "name": name,
		                                "domainName": domainName,
		                                "additionalInfo": additionalInfo,
		                                "coverPhoto": coverPhoto,
		                                "likers": [],
		                                "user": {
		                                    "_id": user._id,
		                                    "name": user.name,
		                                    "profileImage": user.profileImage
		                                }
		                            }, function (error, data) {

		                                result.json({
		                                    "status": "success",
		                                    "message": "Page has been created."
		                                });

		                            });
		                        });

		                        // Delete the file
		                        fileSystem.unlink(request.files.coverPhoto.path, function (err) {
		                            if (err) throw err;
		                            console.log('File deleted!');
		                        });
		                    });
                        } else {
                            result.json({
                                "status": "error",
                                "message": "Please select a cover photo."
                            });
                        }
                    }
				}
			});
		});

	/*	app.get("/pages", function (request, result) {
			result.render("pages");
		});*/

		app.post("/getPages", async function (request, result) {
			var accessToken = request.fields.accessToken

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})
				return false
			}

			const advertisements = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "groups"
				}, {
					status: "active"
				}]
			}).toArray()

			const postIds = []
			for (let a = 0; a < advertisements.length; a++) {
				postIds.push(advertisements[a].post._id)
			}

			const ads = await database.collection("posts")
				.find({
					$and: [{
						_id: {
							$in: postIds
						}
					}, {
						isBoost: true
					}]
				})
				.sort({
					"createdAt": -1
				})
				.limit(5)
				.toArray()

			const data = await database.collection("pages").find({
				$or: [{
					"user._id": user._id
				}, {
					"likers._id": user._id
				}]
			}).toArray()

			result.json({
				"status": "success",
				"message": "Record has been fetched.",
				"data": data,
				ads: ads
			})
		});

		app.get("/page/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("pages").findOne({
				"_id": ObjectId(_id)
			}, function (error, page) {
				if (page == null) {
					result.json({
						"status": "error",
						"message": "Page does not exist."
					});
				} else {
					result.render("singlePage", {
						"_id": _id
					});
				}
			});
		});

		app.get("/edit-page/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("pages").findOne({
				"_id": ObjectId(_id)
			}, function (error, page) {
				if (page == null) {
					result.json({
						"status": "error",
						"message": "Page does not exist."
					});
				} else {
					result.render("editPage", {
						"page": page
					});
				}
			});
		});

		app.post("/editPage", function (request, result) {
			page.update(request, result);
		});

		app.post("/deletePage", function (request, result) {
			page.destroy(request, result);
		});

		app.post("/getPageDetail", async function (request, result) {
			var _id = request.fields._id

			const page = await database.collection("pages").findOne({
				"_id": ObjectId(_id)
			})

			if (page == null) {
				result.json({
					"status": "error",
					"message": "Page does not exist."
				})

				return
			}

			let posts = await database.collection("posts").find({
				$and: [{
					"user._id": page._id
				}, {
					"type": "page_post"
				}]
			}).toArray()

			const totalAds = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "pages"
				}, {
					status: "active"
				}]
			}).count()

			const randomAd = Math.floor(Math.random() * totalAds)

			const advertisements = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "pages"
				}, {
					status: "active"
				}]
			})
				.skip(randomAd)
				.toArray()

			const postIds = []
			for (let a = 0; a < advertisements.length; a++) {
				postIds.push(advertisements[a].post._id)
				if (posts.length == 0) {
					break
				}
			}

			const boostedPosts = await database.collection("posts").find({
				$and: [{
					_id: {
						$in: postIds
					}
				}, {
					isBoost: true
				}]
			}).toArray()

			for (let a = 0; a < boostedPosts.length; a++) {
				posts.push(boostedPosts[a])
			}

			posts = posts.sort(function (a, b) {
				return 0.5 - Math.random()
			})

			result.json({
				status: "success",
				message: "Record has been fetched.",
				data: page,
				posts: posts
			})
		})

		app.post("/toggleLikePage", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("pages").findOne({
						"_id": ObjectId(_id)
					}, function (error, page) {
						if (page == null) {
							result.json({
								"status": "error",
								"message": "Page does not exist."
							});
						} else {

							var isLiked = false;
							for (var a = 0; a < page.likers.length; a++) {
								var liker = page.likers[a];

								if (liker._id.toString() == user._id.toString()) {
									isLiked = true;
									break;
								}
							}

							if (isLiked) {
								database.collection("pages").updateOne({
									"_id": ObjectId(_id)
								}, {
									$pull: {
										"likers": {
											"_id": user._id,
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"accessToken": accessToken
									}, {
										$pull: {
											"pages": {
												"_id": ObjectId(_id)
											}
										}
									}, function (error, data) {
										result.json({
											"status": "unliked",
											"message": "Page has been unliked."
										});
									});
								});
							} else {
								database.collection("pages").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"likers": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"accessToken": accessToken
									}, {
										$push: {
											"pages": {
												"_id": page._id,
												"name": page.name,
												"coverPhoto": page.coverPhoto
											}
										}
									}, function (error, data) {
										result.json({
											"status": "success",
											"message": "Page has been liked."
										});
									});
								});
							}
						}
					});
				}
			});
		});

		app.post("/getMyGroups", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("users").findOne({
				"accessToken": accessToken

			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("groups").find({
						"user._id": user._id
					}).toArray(function (error, data) {
						result.json({
							"status": "success",
							"message": "Record has been fetched.",
							"data": data
						});
					});

				}
			});
		});

		
//Get My Communitys
		app.get("/createGroup", function (request, result) {
			result.render("createGroup");
		});
//
		app.post("/createGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var additionalInfo = request.fields.additionalInfo;
			var coverPhoto = "";
			var area = request.fields.area; // nueva area
			var type = request.fields.type;
		  
			database.collection("users").findOne({
			  "accessToken": accessToken
			}, function (error, user) {
			  if (user == null) {
				result.json({
				  "status": "error",
				  "message": "User has been logged out. Please login again."
				});
			  } else {
				if (user.isBanned) {
				  result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				  });
				  return false;
				}
		  
				if (type == "ios") {
				  coverPhoto = `${request.files.coverPhoto.name}`;
		  
				  var base64Data = request.fields.imageData.replace(/^data:image\/jpeg;base64,/, "");
				  base64Data += base64Data.replace('+', ' ');
				  var binaryData = new Buffer(base64Data, 'base64').toString('binary');
				  fileSystem.writeFile(coverPhoto, function (err) {
					if (err) throw err;
		  
					database.collection("groups").insertOne({
					  "name": name,
					  "additionalInfo": additionalInfo,
					  "coverPhoto": coverPhoto,
					  "area": area,
					  "members": [{
						"_id": user._id,
						"name": user.name,
						"profileImage": user.profileImage,
						"status": "Accepted"
					  }],
					  "user": {
						"_id": user._id,
						"name": user.name,
						"profileImage": user.profileImage
					  }
					}, function (error, data) {
					  database.collection("users").updateOne({
						"accessToken": accessToken
					  }, {
						$push: {
						  "groups": {
							"_id": data.insertedId,
							"name": name,
							"coverPhoto": coverPhoto,
							"status": "Accepted"
						  }
						}
					  }, function (error, data) {
						result.json({
						  "status": "success",
						  "message": "Comunidad ha sido creada"
						});
					  });
					});
				  });
				} else {
					if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {
						coverPhoto = `${request.files.coverPhoto.name}`;
			  
						// Leer el archivo
						fs.readFile(request.files.coverPhoto.path, function (err, data) {
						  if (err) throw err;
			  
						  // Subir la coverPhoto al bucket de Google Cloud Storage
						  const file = storage.bucket(bucketName).file(coverPhoto);
						  const stream = file.createWriteStream({
							metadata: {
							  contentType: request.files.coverPhoto.type,
							},
						  });
						  stream.on('error', (err) => {
							console.error('Error al subir la coverPhoto:', err);
							result.json({
							  "status": "error",
							  "message": "Error al subir la cover photo."
							});
						  });
			  
						  stream.on('finish', () => {
							console.log('Cover photo subida exitosamente.');
			  
							// Eliminar el archivo temporal
							fs.unlink(request.files.coverPhoto.path, function (err) {
							  if (err) throw err;
							  console.log('Archivo temporal eliminado.');
							});
						  
		  
					  // Escribir el archivo
					  fileSystem.writeFile(coverPhoto, data, function (err) {
						if (err) throw err;
						console.log('File written!');
		  
						database.collection("groups").insertOne({
						  "name": name,
						  "additionalInfo": additionalInfo,
						  "coverPhoto": coverPhoto,
						  "area": area,
						  "members": [{
							"_id": user._id,
							"name": user.name,
							"profileImage": user.profileImage,
							"status": "Accepted"
						  }],
						  "user": {
							"_id": user._id,
							"name": user.name,
							"profileImage": user.profileImage
						  }
						}, function (error, data) {
						  database.collection("users").updateOne({
							"accessToken": accessToken
						  }, {
							$push: {
							  "groups": {
								"_id": data.insertedId,
								"name": name,
								"coverPhoto": coverPhoto,
								"status": "Accepted"
							  }
							}
						  }, function (error, data) {
							result.json({
							  "status": "success",
							  "message": "Comunidad ha sido creada",
							 
							});
						  });
						});
					  });
		  
					  // Eliminar el archivo temporal
					  fileSystem.unlink(request.files.coverPhoto.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					  });
					});
				  } else {
					result.json({
					  "status": "error",
					  "message": "Please select a cover photo."
					});
				  }
				}
			  }
			});
		  });
//		  

		app.get("/groups", function (request, result) {
			result.render("groups");
		});

		app.post("/getGroups", async function (request, result) {
			var accessToken = request.fields.accessToken

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return
			}

			const totalAds = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "groups"
				}, {
					status: "active"
				}]
			}).count()

			const randomAd = Math.floor(Math.random() * totalAds)

			const advertisements = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "groups"
				}, {
					status: "active"
				}]
			})
				.skip(randomAd)
				.limit(1)
				.toArray()

			const postIds = []
			for (let a = 0; a < advertisements.length; a++) {
				postIds.push(advertisements[a].post._id)
			}

			const ads = await database.collection("posts")
				.find({
					$and: [{
						_id: {
							$in: postIds
						}
					}, {
						isBoost: true
					}]
				})
				.sort({
					"createdAt": -1
				})
				.toArray()

			const data = await database.collection("groups").find({
				$or: [{
					"user._id": user._id
				}, {
					"members._id": user._id
				}]
			}).toArray()

			result.json({
				"status": "success",
				"message": "Record has been fetched.",
				"data": data,
				ads: ads
			})
		})

		app.get("/group/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("groups").findOne({
				"_id": ObjectId(_id)
			}, function (error, group) {
				if (group == null) {
					result.json({
						"status": "error",
						"message": "Group does not exist."
					});
				} else {
					result.render("singleGroup", {
						"_id": _id
					});
				}
			});
		});

		app.get("/edit-group/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("groups").findOne({
				"_id": ObjectId(_id)
			}, function (error, group) {
				if (group == null) {
					result.json({
						"status": "error",
						"message": "Group does not exist."
					});
				} else {
					result.render("editGroup", {
						"group": group
					});
				}
			});
		});

		app.post("/editGroup", function (request, result) {
			group.update(request, result);
		});

		app.post("/deleteGroup", function (request, result) {
			group.destroy(request, result);
		});

		app.post("/getGroupDetail", async function (request, result) {
			var _id = request.fields._id

			const group = await database.collection("groups").findOne({
				"_id": ObjectId(_id)
			})

			if (group == null) {
				result.json({
					"status": "error",
					"message": "Group does not exist."
				})

				return
			}

			let posts = await database.collection("posts").find({
				$and: [{
					"user._id": group._id
				}, {
					"type": "group_post"
				}]
			})
				.sort({
					"createdAt": -1
				})
				.toArray()

			const totalAds = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "groups"
				}, {
					status: "active"
				}]
			}).count()

			const randomAd = Math.floor(Math.random() * totalAds)

			const advertisements = await database.collection("advertisements").find({
				$and: [{
					whereToShow: "groups"
				}, {
					status: "active"
				}]
			})
				.skip(randomAd)
				.toArray()

			const postIds = []
			for (let a = 0; a < advertisements.length; a++) {
				postIds.push(advertisements[a].post._id)
				if (posts.length == 0) {
					break
				}
			}

			const boostedPosts = await database.collection("posts").find({
				$and: [{
					_id: {
						$in: postIds
					}
				}, {
					isBoost: true
				}]
			})
				.sort({
					"createdAt": -1
				})
				.toArray()

			for (let a = 0; a < boostedPosts.length; a++) {
				posts.push(boostedPosts[a])
			}

			posts = posts.sort(function (a, b) {
				return 0.5 - Math.random()
			})

			result.json({
				"status": "success",
				"message": "Record has been fetched.",
				"group": group,
				"data": posts
			})
		})

		app.post("/toggleJoinGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("groups").findOne({
						"_id": ObjectId(_id)
					}, function (error, group) {
						if (group == null) {
							result.json({
								"status": "error",
								"message": "Group does not exist."
							});
						} else {

							var isMember = false;
							for (var a = 0; a < group.members.length; a++) {
								var member = group.members[a];

								if (member._id.toString() == user._id.toString()) {
									isMember = true;
									break;
								}
							}

							if (isMember) {
								database.collection("groups").updateOne({
									"_id": ObjectId(_id)}, {
										$pull: {
											"members": {
												"_id": user._id,
											}
										}
									}, function (error, data) {

										database.collection("users").updateOne({
											"accessToken": accessToken}, {
												$pull: {
													"groups": {
														"_id": ObjectId(_id)
													}
												}
											}, function (error, data) {
												result.json({
													"status": "leaved",
													"message": "Group has been left."
												});
											});
									});
							} else {
								database.collection("groups").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"members": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
											"status": "Pending"
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"accessToken": accessToken
									}, {
										$push: {
											"groups": {
												"_id": group._id,
												"name": group.name,
												"coverPhoto": group.coverPhoto,
												"status": "Pending"
											}
										}
									}, function (error, data) {

										database.collection("users").updateOne({
											"_id": group.user._id
										}, {
											$push: {
												"notifications": {
													"_id": ObjectId(),
													"type": "group_join_request",
													"content": user.name + " envio una invitación para unirse a la comunidad.",
													"profileImage": user.profileImage,
													"groupId": group._id,
													"userId": user._id,
													"status": "Pending",
													"isRead": false,
													"createdAt": new Date().getTime()
												}
											}
										});

										result.json({
											"status": "success",
											"message": "Request to join group has been sent."
										});
									});
								});
							}
						}
					});
				}
			});
		});

		app.get("/notifications", function (request, result) {
			result.render("notifications");
		});

		app.post("/acceptRequestJoinGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var groupId = request.fields.groupId;
			var userId = request.fields.userId;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("groups").findOne({
						"_id": ObjectId(groupId)
					}, function (error, group) {
						if (group == null) {
							result.json({
								"status": "error",
								"message": "Group does not exist."
							});
						} else {

							if (group.user._id.toString() != user._id.toString()) {
								result.json({
									"status": "error",
									"message": "Sorry, you do not own this group."
								});
								return;
							}

							database.collection("groups").updateOne({
								$and: [{
									"_id": group._id
								}, {
									"members._id": ObjectId(userId)
								}]
							}, {
								$set: {
									"members.$.status": "Accepted"
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									$and: [{
										"accessToken": accessToken
									}, {
										"notifications.groupId": group._id
									}]
								}, {
									$set: {
										"notifications.$.status": "Accepted"
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										$and: [{
											"_id": ObjectId(userId)
										}, {
											"groups._id": group._id
										}]
									}, {
										$set: {
											"groups.$.status": "Accepted"
										}
									}, function (error, data) {

										result.json({
											"status": "success",
											"message": "Group join request has been accepted."
										});
									});
								});
							});
						}
					});
				}
			});
		});

		app.post("/markNotificationsAsRead", function (request, result) {
			var accessToken = request.fields.accessToken;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("users").updateMany({
						$and: [{
							"accessToken": accessToken
						}, {
							"notifications.isRead": false
						}]
					}, {
						$set: {
							"notifications.$.isRead": true
						}
					}, function (error, data) {
						result.json({
							"status": "success",
							"message": "Notifications has been marked as read."
						});
					});
				}
			});
		});

		app.post("/rejectRequestJoinGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var groupId = request.fields.groupId;
			var userId = request.fields.userId;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "Ha sido bloqueado"
						});
						return false;
					}

					database.collection("groups").findOne({
						"_id": ObjectId(groupId)
					}, function (error, group) {
						if (group == null) {
							result.json({
								"status": "error",
								"message": "Group does not exist."
							});
						} else {

							if (group.user._id.toString() != user._id.toString()) {
								result.json({
									"status": "error",
									"message": "Sorry, you do not own this group."
								});
								return;
							}

							database.collection("groups").updateOne({
								"_id": group._id
							}, {
								$pull: {
									"members": {
										"_id": ObjectId(userId)
									}
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									"accessToken": accessToken
								}, {
									$pull: {
										"notifications": {
											"groupId": group._id
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"_id": ObjectId(userId)
									}, {
										$pull: {
											"groups": {
												"_id": group._id
											}
										}
									}, function (error, data) {

										result.json({
											"status": "success",
											"message": "Group join request has been rejected."
										});
									});
								});
							});
						}
					});
				}
			});
		});

		app.post("/sharePost", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var type = "shared";
			var createdAt = new Date().getTime();

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}		

			const post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return
			}

			await database.collection("posts").updateOne({
				"_id": ObjectId(_id)
			}, {
				$push: {
					"shares": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			})

			await database.collection("posts").insertOne({
				"caption": post.caption,
				"image": post.image,
				"video": post.video,
				"savedPaths": post.savedPaths,
				"youtube_url": post.youtube_url,
				"type": type,
				"createdAt": createdAt,
				"likers": [],
				"comments": [],
				"shares": [],
				link: post.link,
				"user": {
					"_id": user._id,
					"name": user.name,
					"gender": user.gender,
					"profileImage": user.profileImage
				},
				originalPost: {
					_id: post._id,
					user: {
						_id: post.user._id,
						name: post.user.name,
						username: post.user.username
					}
				}
			})

			await database.collection("users").updateOne({
				$and: [{
					"_id": post.user._id
				}, {
					"posts._id": post._id
				}]
			}, {
				$push: {
					"posts.$[].shares": {
						"_id": user._id,
						"name": user.name,
						"profileImage": user.profileImage
					}
				}
			})

			if (user._id.toString() != post.user._id.toString()) {
				if (post.type == "page_post") {
					const page = await database.collection("pages").findOne({
		                _id: post.user._id
		            })

		            if (page != null) {
		            	await database.collection("users").updateOne({
							_id: page.user._id
						}, {
							$push: {
								notifications: {
									_id: ObjectId(),
									type: "post_shared",
									content: user.name + " has shared your post.",
									profileImage: user.profileImage,
									isRead: false,
									post: {
										_id: post._id
									},
									createdAt: new Date().getTime()
								}
							}
						})
		            }
				} else if (post.type == "group_post") {
					await database.collection("users").updateOne({
						"_id": post.uploader._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "post_shared",
								"content": user.name + " has shared your post.",
								"profileImage": user.profileImage,
								"isRead": false,
								"post": {
									"_id": post._id
								},
								"createdAt": new Date().getTime()
							}
						}
					})
				} else if (post.type == "post") {
					await database.collection("users").updateOne({
						"_id": post.user._id
					}, {
						$push: {
							"notifications": {
								"_id": ObjectId(),
								"type": "post_shared",
								"content": user.name + " has shared your post.",
								"profileImage": user.profileImage,
								"isRead": false,
								"post": {
									"_id": post._id
								},
								"createdAt": new Date().getTime()
							}
						}
					})
				}
			}

			result.json({
				"status": "success",
				"message": "Post has been shared."
			})
		})

		app.post("/sharePostInPage", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var pageId = request.fields.pageId;
			var postId = request.fields.postId;
			var type = "page_post";
			var createdAt = new Date().getTime();

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(postId)
			});
			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			var page = await database.collection("pages").findOne({
				"_id": ObjectId(pageId)
			});
			if (page == null) {
				result.json({
					"status": "error",
					"message": "Page does not exist."
				});
				return false;
			}

			if (page.user._id.toString() != user._id.toString()) {
				result.json({
					"status": "error",
					"message": "Sorry, you do not own this page."
				});
				return false;
			}

			/* insert in posts nested array */
			await database.collection("posts").findOneAndUpdate({
				"_id": post._id
			}, {
				$push: {
					"shares": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			})

			/* insert new document in posts collection */
			await database.collection("posts").insertOne({
				"caption": post.caption,
				"image": post.image,
				"video": post.video,
				"savedPaths": post.savedPaths,
				"youtube_url": post.youtube_url,
				"type": type,
				"createdAt": createdAt,
				"likers": [],
				"comments": [],
				"shares": [],
				link: post.link,
				"user": {
					"_id": page._id,
					"name": page.name,
					"username": page.username,
					"profileImage": page.coverPhoto
				},
				originalPost: {
					_id: post._id,
					user: {
						_id: post.user._id,
						name: post.user.name,
						username: post.user.username
					}
				}
			})

			result.json({
				"status": "success",
				"message": "Post has been shared in page '" + page.name + "'."
			})
		})

		app.post("/sharePostInGroup", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var groupId = request.fields.groupId;
			var postId = request.fields.postId;
			var type = "group_post";
			var createdAt = new Date().getTime();

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(postId)
			});
			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			var group = await database.collection("groups").findOne({
				"_id": ObjectId(groupId)
			});
			if (group == null) {
				result.json({
					"status": "error",
					"message": "Group does not exist."
				});
				return false;
			}

			var isMember = false;
			for (var a = 0; a < group.members.length; a++) {
				var member = group.members[a];

				if (member._id.toString() == user._id.toString() && member.status == "Accepted") {
					isMember = true;
					break;
				}
			}

			if (!isMember) {
				result.json({
					"status": "error",
					"message": "Sorry, you are not a member of this group."
				});
				return false;
			}

			/* insert in posts nested array */
			await database.collection("posts").findOneAndUpdate({
				"_id": post._id
			}, {
				$push: {
					"shares": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			});

			/* insert new document in posts collection */
			await database.collection("posts").insertOne({
				"caption": post.caption,
				"image": post.image,
				"video": post.video,
				"savedPaths": post.savedPaths,
				"youtube_url": post.youtube_url,
				"type": type,
				"createdAt": createdAt,
				"likers": [],
				"comments": [],
				"shares": [],
				link: post.link,
				"user": {
					"_id": group._id,
					"name": group.name,
					"username": group.name,
					"profileImage": group.coverPhoto
				},
				"uploader": {
					"_id": user._id,
					"name": user.name,
					"username": user.username,
					"profileImage": user.profileImage
				},
				originalPost: {
					_id: post._id,
					user: {
						_id: post.user._id,
						name: post.user.name,
						username: post.user.username
					}
				}
			});

			result.json({
				"status": "success",
				"message": "Post has been shared in group '" + group.name + "'."
			});
		});

		app.post("/getPostById", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"post": post
			});
		});

		app.post("/editPost", async function (request, result) {
			editPost.execute(request, result);
		});

		app.post("/deletePost", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			var isMyUploaded = false;

			if (post.type == "group_post") {
				isMyUploaded = (post.uploader._id.toString() == user._id.toString());
			} else {
				isMyUploaded = (post.user._id.toString() == user._id.toString());
			}

			if (!isMyUploaded) {
				result.json({
					"status": "error",
					"message": "Sorry, you do not own this post."
				});
				return false;
			}

			if (post.savedPaths != null) {
				for (let a = 0; a < post.savedPaths.length; a++) {
					fileSystem.unlink(post.savedPaths[a], function (error) {
						if (error) {
							console.error(error)
						}
					})
				}
			}

			if (post.image) {
				fileSystem.unlink(post.image, function (error) {
					if (error) {
						console.error(error)
					}
				})
			}

			if (post.video) {
				fileSystem.unlink(post.video, function (error) {
					if (error) {
						console.error(error)
					}
				})
			}

			if (post.audio) {
				fileSystem.unlink(post.audio, function (error) {
					if (error) {
						console.error(error)
					}
				})
			}

			if (post.document) {
				fileSystem.unlink(post.document, function (error) {
					if (error) {
						console.error(error)
					}
				})
			}

			await database.collection("posts").deleteOne({
				_id: post._id
			})

			result.json({
				status: "success",
				message: "Post has been deleted."
			})
		})

		app.post("/fetch-more-posts", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var start = parseInt(request.fields.start);

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var ids = [];
			ids.push(user._id);

			for (var a = 0; a < user.groups.length; a++) {
				if (user.groups[a].status == "Accepted") {
					ids.push(user.groups[a]._id);
				}
			}

			for (var a = 0; a < user.friends.length; a++) {
	            if (user.friends[a].status == "Accepted") {
					ids.push(user.friends[a]._id);
	            }
			}

			const posts = await database.collection("posts")
				.find({
					"user._id": {
						$in: ids
					}
				})
				.sort({
					"createdAt": -1
				})
				.skip(start)
				.limit(5)
				.toArray();

			result.json({
				"status": "success",
				"message": "Record has been fetched",
				"data": posts
			});
		});

		app.post("/showStoryDislikers", async function (request, result) {
			var accessToken = request.fields.accessToken
			var _id = request.fields._id

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return false
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			var post = await database.collection("stories").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Story does not exist."
				})

				return false
			}

			if (post.user._id.toString() != user._id.toString()) {
				result.json({
					"status": "error",
					"message": "Unauthorized."
				})

				return
			}

			const dislikers = post.dislikers || []

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": dislikers
			})
		})

		app.post("/showPostDislikers", async function (request, result) {
			var accessToken = request.fields.accessToken
			var _id = request.fields._id

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return false
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return false
			}

			const dislikers = post.dislikers || []

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": dislikers
			})
		})

		app.post("/showStoryLikers", async function (request, result) {
			var accessToken = request.fields.accessToken
			var _id = request.fields._id

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return false
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			var post = await database.collection("stories").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Story does not exist."
				})

				return false
			}

			if (post.user._id.toString() != user._id.toString()) {
				result.json({
					"status": "error",
					"message": "Unauthorized."
				})

				return
			}

			const likers = post.likers || []

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": likers
			})
		})

		app.post("/showPostLikers", async function (request, result) {
			var accessToken = request.fields.accessToken
			var _id = request.fields._id

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			})

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				})

				return false
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				})

				return false
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			})

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				})

				return false
			}

			const likers = post.likers || []

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": likers
			})
		})

		app.post("/showPostSharers", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": post.shares
			});
		});

		app.get("/customer-support", function (request, result) {
			result.render("customer-support");
		});

		app.post("/createTicket", async function (request, result) {
			var accessToken = request.fields.accessToken;
			const description = request.fields.description;
			var image = "";
			var video = "";
			const comments = [];
			var createdAt = new Date().getTime();

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
				image = "public/images/ticket-" + new Date().getTime() + "-" + request.files.image.name;

				// Read the file
				fileSystem.readFile(request.files.image.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(image, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.image.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			if (request.files.video.size > 0 && request.files.video.type.includes("video")) {
				video = "public/videos/ticket-" + new Date().getTime() + "-" + request.files.video.name;

				// Read the file
				fileSystem.readFile(request.files.video.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(video, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.video.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			const ticket = await database.collection("tickets").insertOne({
				"description": description,
				"user": {
					"_id": user._id,
					"name": user.name,
					"username": user.username,
					"profileImage": user.profileImage
				},
				"image": image,
				"video": video,
				"status": "open", // closed
				"comments": comments,
				"createdAt": createdAt
			});

			result.json({
				"status": "success",
				"message": "Ticket has been created. We will respond to your request soon.",
				"ticket": ticket.ops[0]
			});
		});

		app.post("/getMyAllTickets", async function (request, result) {
			var accessToken = request.fields.accessToken;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			var data = await database.collection("tickets").find({
				"user._id": user._id
			}).toArray();

			data = data.reverse();

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": data
			});
		});

		app.get("/editTicket/:_id", async function (request, result) {
			result.render("editTicket", {
				"_id": request.params._id
			});
		});

		app.post("/getTicket", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, you are not the owner of this ticket."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": data
			});
		});

		app.post("/editTicket/:_id", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.params._id;
			var description = request.fields.description;
			var image = "";
			var video = "";
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.render("editTicket", {
					"_id": request.params._id,
					"status": "error",
					"message": "User has been logged out. Please login again."
				});

				return false;
			}
			
			if (user.isBanned) {
				result.render("editTicket", {
					"_id": request.params._id,
					"status": "error",
					"message": "Ha sido bloqueado"
				});

				return false;
			}

			const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.render("editTicket", {
					"_id": request.params._id,
					"status": "error",
					"message": "Sorry, you are not the owner of this ticket."
				});

				return false;
			}

			image = data.image;
			video = data.video;

			if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
				image = "public/images/ticket-" + new Date().getTime() + "-" + request.files.image.name;

				fileSystem.unlink(data.image, function (error) {
					console.log("Preview image has been deleted: " + error);
				});

				// Read the file
				fileSystem.readFile(request.files.image.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(image, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.image.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			if (request.files.video.size > 0 && request.files.video.type.includes("video")) {
				video = "public/videos/ticket-" + new Date().getTime() + "-" + request.files.video.name;

				fileSystem.unlink(data.video, function (error) {
					console.log("Preview video has been deleted: " + error);
				});

				// Read the file
				fileSystem.readFile(request.files.video.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(video, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.video.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			await database.collection("tickets").findOneAndUpdate({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			}, {
				$set: {
					"description": description,
					"image": image,
					"video": video
				}
			});

			result.render("editTicket", {
				"_id": request.params._id,
				"status": "success",
				"message": "Ticket has been updated."
			});
		});

		app.post("/deleteTicket", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "Ha sido bloqueado"
				});
				return false;
			}

			const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, you are not the owner of this ticket."
				});
				return false;
			}

			if (data.image != "") {
				fileSystem.unlink(data.image, function (error) {
					console.log("Preview image has been deleted: " + error);
				});
			}

			if (data.video != "") {
				fileSystem.unlink(data.video, function (error) {
					console.log("Preview video has been deleted: " + error);
				});
			}

			await database.collection("tickets").findOneAndDelete({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			result.json({
				"status": "success",
				"message": "Ticket has been deleted."
			});
		});

		app.get("/tickets/detail/:_id", function (request, result) {
            const _id = request.params._id;

            result.render("tickets/detail", {
                "_id": _id
            });
        });
		
		app.post("/tickets/add-comment", async function (request, result) {
            var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});

				return false;
			}

            const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, you do not own this ticket."
				});

				return false;
			}

            if (data.status == "closed") {
                result.json({
					"status": "error",
					"message": "Sorry, the ticket is closed."
				});

				return false;
            }

            const commentObj = {
                "_id": ObjectId(),
                "user": {
                    "_id": user._id,
                    "name": user.name,
                    "username": user.username,
                    "profileImage": user.profileImage
                },
                "comment": comment,
                "createdAt": new Date().getTime()
            };

            await database.collection("tickets").findOneAndUpdate({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			}, {
				$push: {
					"comments": commentObj
				}
			});

            // send notification to the admin
            /*self.database.collection("users").updateOne({
                "_id": data.user._id
            }, {
                $push: {
                    "notifications": {
                        "_id": self.ObjectId(),
                        "type": "comment_on_ticket",
                        "content": "You have a new comment on your <a href='" + mainURL + "/tickets/detail/" + data._id + "' class='notification-link'>ticket</a>.",
                        "profileImage": "",
                        "isRead": false,
                        "createdAt": new Date().getTime()
                    }
                }
            });*/

            result.json({
                "status": "success",
				"message": "Comment has been added.",
                "comment": commentObj
            });
        });

	});
});
const { ObjectId } = require("mongodb");

module.exports = {

    database: null,
    bcrypt: null,
    jwt: null,
    ObjectId: null,
    fileSystem: null,
    mainURL: "",
    accessTokenSecret: "myAdminAccessTokenSecret1234567890",
    logoutMessage: "Admin has been logged out. Please login again.",

    init: function (app, express) {
        var self = this

//estadisticas
// Ruta para obtener las estadísticas mensuales
app.get("/admin/stats", async function (request, result) {
    var accessToken = request.query.accessToken;

    var admin = await self.database.collection("admins").findOne({
        "accessToken": accessToken
    });

    if (admin == null) {
        result.json({
            "status": "error",
            "message": self.logoutMessage
        });

        return false;
    }

    try {
        var monthlyStats = await self.getMonthlyStatistics();
        result.render("admin/stats", { stats: monthlyStats });
    } catch (error) {
        result.json({
            "status": "error",
            "message": "Failed to fetch monthly statistics."
        });
    }
});

// Función para obtener las estadísticas mensuales
async function getMonthlyStatistics() {
    var pipeline = [
        {
            $group: {
                _id: {
                    year: { $year: { $toDate: "$createdAt" } },
                    month: { $month: { $toDate: "$createdAt" } }
                },
                totalPosts: { $sum: 1 },
                uniqueUsers: { $addToSet: "$uploader.name" }
            }
        },
        {
            $project: {
                month: {
                    $dateToString: {
                        format: "%Y-%m",
                        date: {
                            $dateFromParts: {
                                year: "$_id.year",
                                month: "$_id.month"
                            }
                        }
                    }
                },
                totalPosts: 1,
                uniqueUsers: { $size: "$uniqueUsers" }
            }
        },
        {
            $sort: { month: 1 }
        }
    ];

    var stats = await self.database.collection("posts").aggregate(pipeline).toArray();
    return stats;
}
//
        const ticketsRouter = express.Router();
        ticketsRouter.get("/", function (request, result) {
            result.render("admin/tickets/index");
        });

        ticketsRouter.post("/fetch", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var skip = parseInt(request.fields.skip);
            var limit = parseInt(request.fields.limit);

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var tickets = await self.database.collection("tickets")
                .find({})
                .skip(skip)
                .limit(limit)
                .sort({
                    "_id": -1
                })
                .toArray();

            var totalPages = await self.database.collection("tickets").count() / limit;
            totalPages = Math.ceil(totalPages);

            result.json({
                "status": "success",
                "message": "Data has been fetched.",
                "data": tickets,
                "totalPages": totalPages
            });
        });

        ticketsRouter.get("/detail/:_id", function (request, result) {
            const _id = request.params._id;

            result.render("admin/tickets/detail", {
                "_id": _id
            });
        });

        ticketsRouter.post("/detail", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var ticket = await self.database.collection("tickets")
                .findOne({
                    "_id": ObjectId(_id)
                });

            if (ticket == null) {
                result.json({
                    "status": "error",
                    "message": "Ticket does not exist."
                });

                return false;
            }

            result.json({
                "status": "success",
                "message": "Data has been fetched.",
                "data": ticket
            });
        });

        ticketsRouter.post("/change-status", async function (request, result) {
            const accessToken = request.fields.accessToken;
            const status = request.fields.status;
            const _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var ticket = await self.database.collection("tickets")
                .findOne({
                    "_id": ObjectId(_id)
                });

            if (ticket == null) {
                result.json({
                    "status": "error",
                    "message": "Ticket does not exist."
                });

                return false;
            }

            ticket = await self.database.collection("tickets")
                .findOneAndUpdate({
                    "_id": ObjectId(_id)
                }, {
                    $set: {
                        "status": status
                    }
                }, {
                    returnOriginal: false
                });

            result.json({
                "status": "success",
                "message": "Status has been changed.",
                "data": ticket.value
            });
        });

        ticketsRouter.post("/add-comment", async function (request, result) {
            var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			
			const admin = await self.database.collection("admins").findOne({
				"accessToken": accessToken
			});
			
			if (admin == null) {
				result.json({
					"status": "error",
					"message": "Admin has been logged out. Please login again."
				});

				return false;
			}

            const data = await self.database.collection("tickets").findOne({
				"_id": self.ObjectId(_id)
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, ticket does not exist."
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
                "_id": self.ObjectId(),
                "user": {
                    "_id": admin._id,
                    "name": "Admin",
                    "username": "admin",
                    "profileImage": ""
                },
                "comment": comment,
                "createdAt": new Date().getTime()
            };

            await self.database.collection("tickets").findOneAndUpdate({
				"_id": self.ObjectId(_id)
			}, {
				$push: {
					"comments": commentObj
				}
			});

            // send notification to the user
            self.database.collection("users").updateOne({
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
            });

            result.json({
                "status": "success",
				"message": "Comment has been added.",
                "comment": commentObj
            });
        });

        app.use("/admin/tickets", ticketsRouter);

        var postsRouter = express.Router();
        postsRouter.get("/", function (request, result) {
            result.render("admin/posts");
        });

        postsRouter.post("/unban", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var post = await self.database.collection("posts").findOne({
                "_id": self.ObjectId(_id)
            });
            if (post == null) {
                result.json({
                    "status": "error",
                    "message": "Post does not exists."
                });

                return false;
            }

            await self.database.collection("posts").findOneAndUpdate({
                "_id": self.ObjectId(_id)
            }, {
                $set: {
                    "isBanned": false
                }
            });

            result.json({
                "status": "success",
                "message": "Publicación ha sido desbloqueada"
            });
        });

        postsRouter.post("/ban", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;
            var reasonToBan = request.fields.reasonToBan;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var post = await self.database.collection("posts").findOne({
                "_id": self.ObjectId(_id)
            });
            if (post == null) {
                result.json({
                    "status": "error",
                    "message": "Post does not exists."
                });

                return false;
            }

            await self.database.collection("posts").findOneAndUpdate({
                "_id": self.ObjectId(_id)
            }, {
                $set: {
                    "isBanned": true,
                    "reasonToBan": reasonToBan
                }
            });

            /* send notification to the user that his post has been banned */
            await self.database.collection("users").updateOne({
                "_id": post.user._id
            }, {
                $push: {
                    "notifications": {
                        "_id": self.ObjectId(),
                        "type": "post_banned",
                        "content": "Your <a href='" + self.mainURL + "/post/" + _id + "' class='btn btn-link'>Post</a> has been banned because '" + reasonToBan + "'.",
                        "isRead": false,
                        "createdAt": new Date().getTime()
                    }
                }
            });

            result.json({
                "status": "success",
                "message": "Publicación ha sido bloqueada"
            });
        });

        postsRouter.post("/delete", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var post = await self.database.collection("posts").findOne({
                "_id": self.ObjectId(_id)
            });
            if (post == null) {
                result.json({
                    "status": "error",
                    "message": "Post does not exists."
                });

                return false;
            }

            if (post.image != "") {
                self.fileSystem.unlink(post.image, function (error) {
                    console.log("error deleting file: " + error);
                });
            }

            if (post.video != "") {
                self.fileSystem.unlink(post.video, function (error) {
                    console.log("error deleting file: " + error);
                });
            }

            await self.database.collection("posts").deleteOne({
                "_id": self.ObjectId(_id)
            });

            result.json({
                "status": "success",
                "message": "Post has been deleted."
            });
        });

        postsRouter.post("/fetch", async function (request, result) {

            var accessToken = request.fields.accessToken;
            var skip = parseInt(request.fields.skip);
            var limit = parseInt(request.fields.limit);

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var posts = await self.database.collection("posts")
            .find({})
                .skip(skip)
                .limit(limit)
                .sort({
                    "_id": -1
                })
                .toArray();
            var totalPages = await self.database.collection("posts").count() / limit;
            totalPages = Math.ceil(totalPages);

            result.json({
                "status": "success",
                "message": "Data has been fetched.",
                "data": posts,
                "totalPages": totalPages
            });
        });

        app.use("/admin/posts", postsRouter);
//user
        var usersRouter = express.Router();
        usersRouter.get("/", function (request, result) {
            result.render("admin/users/index");
        });

        usersRouter.post("/unban", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var user = await self.database.collection("users").findOne({
                "_id": self.ObjectId(_id)
            });
            if (user == null) {
                result.json({
                    "status": "error",
                    "message": "User does not exists."
                });

                return false;
            }

            await self.database.collection("users").findOneAndUpdate({
                "_id": self.ObjectId(_id)
            }, {
                $set: {
                    "isBanned": false
                }
            });

            result.json({
                "status": "success",
                "message": "Usuario ha sido desbloqueado"
            });
        });

        usersRouter.post("/ban", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var user = await self.database.collection("users").findOne({
                "_id": self.ObjectId(_id)
            });
            if (user == null) {
                result.json({
                    "status": "error",
                    "message": "Usuario no existe."
                });

                return false;
            }

            await self.database.collection("users").findOneAndUpdate({
                "_id": self.ObjectId(_id)
            }, {
                $set: {
                    "isBanned": true
                }
            });

            result.json({
                "status": "success",
                "message": "Usuario ha sido bloqueado"
            });
        });

        usersRouter.post("/delete", async function (request, result) {
            var accessToken = request.fields.accessToken;
            var _id = request.fields._id;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var user = await self.database.collection("users").findOne({
                "_id": self.ObjectId(_id)
            });
            if (user == null) {
                result.json({
                    "status": "error",
                    "message": "User does not exists."
                });

                return false;
            }

            if (user.profileImage != "") {
                self.fileSystem.unlink(user.profileImage, function (error) {
                    console.log("error deleting file: " + error);
                });
            }

            if (user.coverPhoto != "") {
                self.fileSystem.unlink(user.coverPhoto, function (error) {
                    console.log("error deleting file: " + error);
                });
            }

            await self.database.collection("users").deleteOne({
                "_id": self.ObjectId(_id)
            });

            result.json({
                "status": "success",
                "message": "Usuario ha sido eliminado."
            });
        });

        usersRouter.post("/fetch", async function (request, result) {

  

            var accessToken = request.fields.accessToken;
            var skip = parseInt(request.fields.skip);
            var limit = parseInt(request.fields.limit);

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var users = await self.database.collection("users")
                .find({})
                .skip(skip)
                .limit(limit)
                .sort({
                    "_id": -1
                })
                .toArray();
                
            for (var a = 0; a < users.length; a++) {
                delete users[a].password;
            }

            var totalPages = await self.database.collection("users").count() / limit;
            totalPages = Math.ceil(totalPages);

            result.json({
                "status": "success",
                "message": "Data has been fetched.",
                "data": users,
                "totalPages": totalPages
            });
        });

        app.use("/admin/users", usersRouter);

        app.post("/admin/getDashboardData", async function (request, result) {

            var accessToken = request.fields.accessToken;

            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });
            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": self.logoutMessage
                });

                return false;
            }

            var users = await self.database.collection("users").count();
            var groups = await self.database.collection("groups").count();
            var posts = await self.database.collection("posts").count();
            var supportRequests = 0;

            result.json({
                "status": "success",
                "message": "Data has been fetched.",
                "users": users,
                "groups": groups,
                "posts": posts,
                "supportRequests": supportRequests
            });
        });

        app.get("/admin", function (request, result) {
            self.database.collection("admins").findOne({}, function (error, admin) {
                     });

            result.render("admin/index");
        });

        app.get("/admin/login", function (request, result) {
            result.render("admin/login");
        });

        app.post("/admin/login", async function (request, result) {

            var email = request.fields.email;
            var password = request.fields.password;

            var admin = await self.database.collection("admins").findOne({
                "email": email
            });

            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": "Correo no existe"
                });

                return

                //return false;
            }else{

                var accessToken = self.jwt.sign({ email: email}, "myAdminAccessTokenSecret1234567890");
                await self.database.collection("admins").findOneAndUpdate({
                    "email": email
                }, {
                    $set: {
                        accessToken: accessToken
                    }
                });

                // wait please

                result.json({
                    "status": "success",
                    "message": "Login successfully",
                    accessToken: accessToken
                });
            }

            /*self.bcrypt.compare(password, admin.password, async function (error, res) {
                if (res === true) {

                    var accessToken = self.jwt.sign({ email: email });
                    await self.database.collection("admins").findOneAndUpdate({
                        "email": email
                    });

                    result.json({
                        "status": "success",
                        "message": "Login successfully"
                    });
                    
                } else {
                    result.json({
                        "status": "error",
                        "message": "Contraseña no es correcta"
                    });
                }
            });*/
        });

        app.post("/admin/getAdmin", async function (request, result) {
            var accessToken = request.fields.accessToken;
            
            var admin = await self.database.collection("admins").findOne({
                "accessToken": accessToken
            });

            if (admin == null) {
                result.json({
                    "status": "error",
                    "message": "User has been logged out. Please login again."
                });

                return false;
            }

            result.json({
                "status": "success",
                "message": "Record has been fetched.",
                "data": admin
            });
        });
//estadisticas


    }




};
const fileSystem = require("fs")
const ObjectId = require("mongodb").ObjectId

module.exports = {

    database: null,
    functions: null,
    fileSystem: null,
    requestModule: null,
    filter: null,
    ObjectId: null,

    request: null,
    result: null,

    image: "",
    video: "",
    type: "",
    user: null,
    post: null,

    callbackFileUpload: function(files, index, savedPaths = [], success = null) {
        const self = this

        if (files.length > index) {

            fileSystem.readFile(files[index].path, function (error, data) {
                if (error) {
                    console.error(error)
                    return
                }

                if (files[index].size > 0) {
                    const filePath = "uploads/" + new Date().getTime() + "-" + files[index].name
                    const base64 = buffer=>{
                        let _buffer = new Buffer.from(buffer,'base64');
                        return _buffer.toString('base64')
                      };
{
                        fileSystem.writeFile(filePath, data, async function (error) {
                            if (error) {
                                console.error(error)
                                return
                            }

                            savedPaths.push(filePath)

                            if (index == (files.length - 1)) {
                                success(savedPaths)
                            } else {
                                index++
                                self.callbackFileUpload(files, index, savedPaths, success)
                            }
                        })

                        fileSystem.unlink(files[index].path, function (error) {
                            if (error) {
                                console.error(error)
                                return
                            }
                        })
                    }
                } else {
                    index++
                    self.callbackFileUpload(files, index, savedPaths, success)
                }
            })
        } else {
            success(savedPaths)
        }
    },

    execute: async function (request, result) {
        var accessToken = request.fields.accessToken
        var caption = request.fields.caption
        var _id = request.fields._id
        var image = ""
        var video = ""
        var type = request.fields.type
        var createdAt = new Date().getTime()
        var base64 = request.fields.imgData
        const youtube_url = request.fields.youtube_url

        this.image = ""
        this.video = ""
        this.audio = ""
        this.document = ""
        this.savedPaths = []

        var self = this

        this.type = type
        this.request = request
        this.result = result

        // in case of post in page or group
        var _id = request.fields._id
        this._id = _id

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

        if (this.filter.isProfane(caption)) {
            result.json({
                status: "error",
                message: "Su mensaje contiene lenguaje abusivo u ofensivo."
            })

            return
        }

        const post = await database.collection("posts").findOne({
            _id: ObjectId(_id)
        })

        if (post == null) {
            result.json({
                status: "error",
                message: "Post no existe."
            })

            return
        }

        if (type == "post") {
            if (post.user._id.toString() != user._id.toString()) {
                result.json({
                    status: "error",
                    message: "No le pertenece esta publicación."
                })

                return
            }
        } else if (type == "post") {
            const group = await database.collection("posts").findOne({
                _id: ObjectId(_id)
                
            })
            console.log(group);
            if (group == null) {
                result.json({
                    status: "error",
                    message: "Comunidad no existe."
                })

                return
            }

            var isMember = false
            for (var a = 0; a < group.members.length; a++) {
                var member = group.members[a]

                if (member._id.toString() == user._id.toString() && member.status == "Accepted") {
                    isMember = true
                    break
                }
            }

            if (!isMember) {
                result.json({
                    status: "error",
                    message: "Sorry, you are not a member of this group."
                })

                return
            }
        }

        this.user = user

        const files = []
        if (Array.isArray(request.files.files)) {
            for (let a = 0; a < request.files.files.length; a++) {
                files.push(request.files.files[a])
            }
        } else {
            files.push(request.files.files)
        }

        this.callbackFileUpload(files, 0, [], async function (savedPaths) {
            
            const videos = post.videos || []
            const postSavedPaths = post.savedPaths || []

            for (let a = 0; a < savedPaths.length; a++) {
                const parts = savedPaths[a].split(".")
                const extension = parts[parts.length - 1]
                if (extension == "mp4" || extension == "mov" || extension == "mkv") {
                    videos.push({
                        src: savedPaths[a],
                        viewers: []
                    })
                }
                postSavedPaths.push(savedPaths[a])
            }

            await database.collection("posts").findOneAndUpdate({
                _id: post._id
            }, {
                $set: {
                    caption: caption,
                    youtube_url: youtube_url,
                    videos: videos,
                    savedPaths: postSavedPaths
                }
            })

            const postObj = await database.collection("posts").findOne({
                _id: post._id
            })

            result.json({
                status: "success",
                message: "Se ha subido la publicación.",
                post: postObj
            })

            return
        })

        return

        /*var accessToken = request.fields.accessToken;
        var _id = request.fields._id;
        var caption = request.fields.caption;
        var type = request.fields.type;
        var createdAt = new Date().getTime();
        var base64 = request.fields.imgData;

        this.image = ""
        this.video = ""

        var self = this;

        this.request = request;
        this.result = result;

        var user = await this.database.collection("users").findOne({
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

        if (this.filter.isProfane(caption)) {
            result.json({
                "status": "error",
                "message": "Su mensaje contiene lenguaje abusivo u ofensivo."
            });

            return false;
        }

        var post = await this.database.collection("posts").findOne({
            "_id": this.ObjectId(_id)
        });

        if (post == null) {
            result.json({
                "status": "error",
                "message": "Post does not exist."
            });
            return false;
        }

        if (type == "post") {
            if (post.user._id.toString() != user._id.toString()) {
                result.json({
                    "status": "error",
                    "message": "Sorry, you do not own this post."
                });
                return false;
            }
        }

        this.user = user;
        this.post = post;

        var image = post.image;
        var video = post.video;

        if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
            image = "public/images/" + new Date().getTime() + "-" + request.files.image.name;
            this.image = image;

            this.requestModule.post("http://127.0.0.1:8888/scripts/social-networking-site/class.ImageFilter.php", {
                formData: {
                    "validate_image": 1,
                    "base_64": base64
                }
            }, function(err, res, body) {
                if (!err && res.statusCode === 200) {
                    // console.log(body);

                    if (body > 60) {
                        result.json({
                            "status": "error",
                            "message": "Image contains nudity."
                        });

                        return false;
                    } else {
                        self.moveForward();
                    }
                }
            });
        } else {
            self.moveForward();
        }*/
    },

    /*moveForward: async function () {

        var self = this;

        // Read the file
        if (this.request.files.image.size > 0 && this.request.files.image.type.includes("image")) {
            this.fileSystem.readFile(this.request.files.image.path, function (err, data) {
                if (err) throw err;
                console.log('File read!');

                // Write the file
                self.fileSystem.writeFile(self.image, data, function (err) {
                    if (err) throw err;
                    console.log('File written!');

                    self.fileUpload_moveForward();
                });

                // Delete the file
                self.fileSystem.unlink(self.request.files.image.path, function (err) {
                    if (err) throw err;
                    console.log('File deleted!');
                });
            });
        } else if (this.request.files.video.size > 0 && this.request.files.video.type.includes("video")) {
            this.video = "public/videos/" + new Date().getTime() + "-" + this.request.files.video.name;

            // Read the file
            this.fileSystem.readFile(this.request.files.video.path, function (err, data) {
                if (err) throw err;
                console.log('File read!');

                // Write the file
                self.fileSystem.writeFile(self.video, data, function (err) {
                    if (err) throw err;
                    console.log('File written!');

                    self.fileUpload_moveForward();
                });

                // Delete the file
                self.fileSystem.unlink(self.request.files.video.path, function (err) {
                    if (err) throw err;
                    console.log('File deleted!');
                });
            });
        } else {
            this.fileUpload_moveForward();
        }
    },

    fileUpload_moveForward: async function () {
        var updatedPost = await this.database.collection("posts").findOneAndUpdate({
            "_id": this.post._id
        }, {
            $set: {
                "caption": this.request.fields.caption,
                "image": this.image,
                "video": this.video
            }
        }, {
            returnOriginal: false
        });

        this.result.json({
            "status": "success",
            "message": "Post has been updated.",
            "post": updatedPost.value
        });

        return true;
    }*/
};
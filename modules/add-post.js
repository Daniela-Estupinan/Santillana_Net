const { buffer } = require("@tensorflow/tfjs");

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
    audio: "",
    document: "",
    savedPaths: [],
    type: "",
    user: null,
    _id: null,
    mainURL: "",

callbackFileUpload: function (files, index, savedPaths = [], success = null) {
    const self = this;
  
    if (files.length > index) {
      this.fileSystem.readFile(files[index].path, function (error, data) {
        if (error) {
          console.error(error);
          return;
        }
  
        if (files[index].size > 0) {
          
          const filePath = "uploads/" + new Date().getTime() + "-" + files[index].name
          //const base64 = buffer.toString("base64")
          const base64 = buffer=>{
            let _buffer = new Buffer.from(buffer,'base64');
            return _buffer.toString('base64')
          };
         {
            self.fileSystem.writeFile(filePath, data, async function (error) {
              if (error) {
                console.error(error);
                return;
              }
  
              savedPaths.push(filePath);
  
              if (index === files.length - 1) {
                success(savedPaths);
              } else {
                index++;
                self.callbackFileUpload(files, index, savedPaths, success);
              }
            });
  
            self.fileSystem.unlink(files[index].path, function (error) {
              if (error) {
                console.error(error);
                return;
              }
            });
          }
        } else {
          index++;
          self.callbackFileUpload(files, index, savedPaths, success);
        }
      });
    } else {
      success(savedPaths);
    }
  },
  
    execute: async function (request, result) {
        var accessToken = request.fields.accessToken;
        var caption = request.fields.caption;
        var image = "";
        var video = "";
        var type = request.fields.type;
        var createdAt = new Date().getTime();
        var base64 = request.fields.imgData;

        this.image = ""
        this.video = ""
        this.audio = ""
        this.document = ""
        this.savedPaths = []

        var self = this;

        this.type = type;
        this.request = request;
        this.result = result;

        // in case of post in page or group
        var _id = request.fields._id;
        this._id = _id;

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

        this.user = user;

        const files = []
        if (Array.isArray(request.files.files)) {
            for (let a = 0; a < request.files.files.length; a++) {
                files.push(request.files.files[a])
            }
        } else {
            files.push(request.files.files)
        }

        this.callbackFileUpload(files, 0, [], async function (savedPaths) {
            self.savedPaths = savedPaths
            self.fileUpload_moveForward()
        })
    },

    fileUpload_moveForward: async function () {
        var _id = this.ObjectId();
        var link = mainURL + "/post/" + _id;

        const youtube_url = this.request.fields.youtube_url

        const videos = []
        for (let a = 0; a < this.savedPaths.length; a++) {
            const parts = this.savedPaths[a].split(".")
            const extension = parts[parts.length - 1]
            if (extension == "mp4" || extension == "mov" || extension == "mkv") {
                videos.push({
                    src: this.savedPaths[a],
                    viewers: []
                })
            }
        }

        var postObj = {
            "_id": _id,
            "caption": this.request.fields.caption,
            "image": this.image,
            "video": this.video,
            "audio": this.audio,
            "document": this.document,
            "savedPaths": this.savedPaths,
            videos: videos,
            "youtube_url": youtube_url,
            "type": this.type,
            isBoost: false,
            "createdAt": new Date().getTime(),
            "likers": [],
            "dislikers": [],
            "comments": [],
            "shares": [],
            "link": link,
            "user": {
                "_id": this.user._id,
                "name": this.user.name,
                "username": this.user.username,
                "profileImage": this.user.profileImage
            }
        };

        if (this.type == "page_post") {

            var page = await this.database.collection("pages").findOne({
                "_id": this.ObjectId(this._id)
            });

            if (page == null) {
                this.result.json({
                    "status": "error",
                    "message": "Page does not exist."
                });
                return false;
            }

            if (page.user._id.toString() != this.user._id.toString()) {
                this.result.json({
                    "status": "error",
                    "message": "Sorry, you do not own this page."
                });
                return;
            }

            postObj.user = {
                "_id": page._id,
                "name": page.name,
                "username": page.name,
                "profileImage": page.coverPhoto
            }
        } else if (this.type == "group_post") {

            var group = await this.database.collection("groups").findOne({
                "_id": this.ObjectId(this._id)
            });

            if (group == null) {
                this.result.json({
                    "status": "error",
                    "message": "Group does not exist."
                });
                return false;
            }

            const isAdmin = group.user._id.toString() == this.user._id.toString()

            var isMember = false;
            for (var a = 0; a < group.members.length; a++) {
                var member = group.members[a];

                if (member._id.toString() == this.user._id.toString() && member.status == "Accepted") {
                    isMember = true;
                    break;
                }
            }

            if (!isMember && !isAdmin) {
                this.result.json({
                    "status": "error",
                    "message": "Sorry, you are not a member of this group."
                });
                return false;
            }

            postObj.user = {
                "_id": group._id,
                "name": group.name,
                "username": group.name,
                "profileImage": group.coverPhoto
            }

            postObj.uploader = {
                "_id": this.user._id,
                "name": this.user.name,
                "username": this.user.username,
                "profileImage": this.user.profileImage
            }

            // send notification to group admin if post is not by group admin himself
            if (this.user._id.toString() != group.user._id.toString()) {
                await this.database.collection("users").updateOne({
                    _id: group.user._id
                }, {
                    $push: {
                        "notifications": {
                            _id: ObjectId(),
                            type: "new_post_in_group",
                            content: this.user.name + " ha publicado algo nuevo en la comunidad",
                            profileImage: this.user.profileImage,
                            groupId: group._id,
                            userId: this.user._id,
                            post: {
                                _id: postObj._id
                            },
                            isRead: false,
                            createdAt: new Date().getTime()
                        }
                    }
                })
            }
        }

        await this.database.collection("posts").insertOne(postObj);

        this.result.json({
            "status": "success",
            "message": "Se ha subido la publicación.",
            "postObj": postObj
        });

        return true;
    }
};
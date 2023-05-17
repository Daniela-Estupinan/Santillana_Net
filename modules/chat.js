const fs = require("fs")

module.exports = {

    // from previous
    database: null,
    socketIO: null,
    users: [],
    ObjectId: null,
    fileSystem: null,
    cryptr: null,
    filter: null,

    // from this
    request: null,
    result: null,
    me: null,
    user: null,

    getFriendsChat: async function (request, result) {
        var accessToken = request.fields.accessToken;
        var _id = request.fields._id;

        var me = await this.database.collection("users").findOne({
            "accessToken": accessToken
        });

        if (me == null) {
            result.json({
                "status": "error",
                "message": "User has been logged out. Please login again."
            });

            return false;
        }

        if (me.isBanned) {
            result.json({
                "status": "error",
                "message": "You have been banned."
            });
            return false;
        }

        const user = await this.database.collection("users").findOne({
            _id: this.ObjectId(_id)
        })

        if (user == null) {
            result.json({
                "status": "error",
                "message": "User does not exists."
            })

            return
        }

        var index = me.friends.findIndex(function(friend) {
            return friend._id == _id
        });
        var inbox = me.friends[index].inbox;

        // updating logged in user's record
        await this.database.collection("users").updateOne({
            $and: [{
                "accessToken": accessToken
            }, {
                "friends._id": user._id
            }]
        }, {
            $set: {
                "friends.$.inbox.$[].is_read": true,
                "friends.$.unread": 0
            }
        });

        for (var a = 0; a < inbox.length; a++) {
            if (inbox[a].message != null) {
                inbox[a].message = this.cryptr.decrypt(inbox[a].message)
            }
        }

        result.json({
            "status": "success",
            "message": "Record has been fetched",
            "data": inbox,
            privateKey: JSON.parse(me.privateKey),
            publicKey: JSON.parse(user.publicKey)
        });
    },
    
    sendMessage: async function (request, result) {
        const self = this

        this.request = request
        this.result = result

        var attachedImages = request.fields.attachedImages;
        attachedImages = JSON.parse(attachedImages);

        var attachedVideos = request.fields.attachedVideos;
        attachedVideos = JSON.parse(attachedVideos);

        this.me = await this.database.collection("users").findOne({
            "accessToken": request.fields.accessToken
        });

        if (this.me == null) {
            result.json({
                "status": "error",
                "message": "User has been logged out. Please login again."
            });

            return false;
        }

        this.user = await this.database.collection("users").findOne({
            "_id": this.ObjectId(request.fields._id)
        });

        if (this.user == null) {
            result.json({
                "status": "error",
                "message": "User does not exist."
            });

            return false;
        }

        if (this.filter.isProfane(request.fields.message)) {
            result.json({
                "status": "error",
                "message": "Su mensaje contiene lenguaje abusivo u ofensivo."
            });

            return false;
        }

        var messageObj = {
            "_id": this.ObjectId(),
            "message": this.cryptr.encrypt(request.fields.message),
            "from": this.me._id,
            "is_read": false,
            "images": [],
            "videos": [],
            "is_deleted": false,
            createdAt: new Date().getTime()
        };

        if (attachedImages.length > 0 && attachedVideos.length == 0) {
            this.recursiveSaveImages(messageObj, attachedImages, 0, null);
        }

        if (attachedImages.length == 0 && attachedVideos.length > 0) {
            this.recursiveSaveVideos(messageObj, attachedVideos, 0, null);
        }

        if (attachedImages.length > 0 && attachedVideos.length > 0) {
            this.recursiveSaveImages(messageObj, attachedImages, 0, function (messageObj) {
                self.recursiveSaveVideos(messageObj, attachedVideos, 0, function (messageObj) {
                    self.saveMessage(messageObj);
                });
            });
        }

        if (attachedImages.length == 0 && attachedVideos.length == 0) {
            this.saveMessage(messageObj);
        }
    },

    recursiveSaveVideos: function (messageObj, attachedVideos, index, callback) {
        var self = this;
        var filePath = "public/videos/attachments/" + (new Date().getTime()) + "-" + (index + 1) + ".mp4";

        var base64Data = attachedVideos[index].replace(/^data:(.*?);base64,/, "");
        base64Data = base64Data.replace(/ /g, '+');

        this.fileSystem.writeFile(filePath, base64Data, 'base64', function(err) {
            if (err == null) {
                messageObj.videos.push(filePath);
                index++;
                
                if (index == attachedVideos.length) {
                    if (callback != null) {
                        callback(messageObj);
                    } else {
                        self.saveMessage(messageObj);
                    }
                } else {
                    self.recursiveSaveVideos(messageObj, attachedVideos, index);
                }
            } else {
                // console.log(err);
                self.result.json({
                    "status": "error",
                    "message": "Unable to upload videos. Try reducing the size of files."
                });
            }
        });
    },

    recursiveSaveImages: function (messageObj, attachedImages, index, callback) {
        var self = this;
        var filePath = "public/images/attachments/" + (new Date().getTime()) + "-" + (index + 1) + ".png";

        var base64Data = attachedImages[index].replace(/^data:image\/jpeg;base64,/, "");
        base64Data = base64Data.replace(/^data:image\/png;base64,/, "");

        this.fileSystem.writeFile(filePath, base64Data, 'base64', function(err) {
            if (err == null) {
                messageObj.images.push(filePath);
                index++;
                
                if (index == attachedImages.length) {
                    if (callback != null) {
                        callback(messageObj);
                    } else {
                        self.saveMessage(messageObj);
                    }
                } else {
                    self.recursiveSaveImages(messageObj, attachedImages, index);
                }
            } else {
                // console.log(err);
                self.result.json({
                    "status": "error",
                    "message": "Unable to upload images. Try reducing the size of files."
                });
            }
        });
    },

    sendVoiceNote: async function (request, result) {
        const base64 = request.fields.base64
        const accessToken = request.fields.accessToken
        const _id = request.fields._id

        this.me = await this.database.collection("users").findOne({
            "accessToken": accessToken
        });

        if (this.me == null) {
            result.json({
                "status": "error",
                "message": "User has been logged out. Please login again."
            });

            return false;
        }

        this.user = await this.database.collection("users").findOne({
            "_id": this.ObjectId(_id)
        });

        if (this.user == null) {
            result.json({
                "status": "error",
                "message": "User does not exist."
            });

            return false;
        }

        const buffer = Buffer.from(base64, "base64")
        const voiceNote = "voice-notes/" + new Date().getTime() + ".webm"
        const response = await fs.writeFileSync(voiceNote, buffer)

        const messageObj = {
            "_id": this.ObjectId(),
            "message": null,
            "from": this.me._id,
            "is_read": false,
            "images": [],
            "videos": [],
            "is_deleted": false,
            voiceNote: voiceNote,
            createdAt: new Date().getTime()
        }

        // Other user's data
        await this.database.collection("users").updateOne({
            $and: [{
                "_id": this.user._id
            }, {
                "friends._id": this.me._id
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
        await this.database.collection("users").updateOne({
            $and: [{
                "_id": this.me._id
            }, {
                "friends._id": this.user._id
            }]
        }, {
            $push: {
                "friends.$.inbox": messageObj
            }
        });

        // messageObj.message = this.cryptr.decrypt(messageObj.message);
        this.socketIO.to(this.users[this.user._id]).emit("messageReceived", messageObj);

        result.json({
            "status": "success",
            "message": "Message has been sent.",
            "data": messageObj
        })
    },

    saveMessage: async function (messageObj) {
        // Other user's data
        await this.database.collection("users").updateOne({
            $and: [{
                "_id": this.user._id
            }, {
                "friends._id": this.me._id
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
        await this.database.collection("users").updateOne({
            $and: [{
                "_id": this.me._id
            }, {
                "friends._id": this.user._id
            }]
        }, {
            $push: {
                "friends.$.inbox": messageObj
            }
        });

        messageObj.message = this.cryptr.decrypt(messageObj.message);
        this.socketIO.to(this.users[this.user._id]).emit("messageReceived", messageObj);

        this.result.json({
            "status": "success",
            "message": "Message has been sent.",
            "data": messageObj
        });
    },

    deleteMessage: async function (request, result) {
        var self = this;

        /* get all request fields */
        var _id = request.fields._id;
        var accessToken = request.fields.accessToken;

        /* check if user is logged in */
        var user = await this.database.collection("users").findOne({
            "accessToken": accessToken
        });

        if (user == null) {
            result.json({
                "status": "error",
                "message": "User has been logged out. Please login again."
            });
        }

        if (user.isBanned) {
            result.json({
                "status": "error",
                "message": "You have been banned."
            });
            return false;
        }

        var inbox = [];
        var friendId = "";

        /* check if the message is sent by the logged in user */
        var isSentByMe = false;
        for (var a = 0; a < user.friends.length; a++) {
            var friend = user.friends[a];
            for (var b = 0; b < friend.inbox.length; b++) {
                var message = friend.inbox[b];
                if (message._id.toString() == _id.toString()) {
                    if (message.from.toString() == user._id.toString()) {
                        isSentByMe = true;
                        inbox = friend.inbox;
                        friendId = friend._id.toString();
                        break;
                    }
                }
            }
            if (isSentByMe) {
                break;
            }
        }
        if (!isSentByMe) {
            result.json({
                "status": "error",
                "message": "Sorry, this message is not sent by you."
            });
            return false;
        }

        for (var a = 0; a < inbox.length; a++) {
            if (inbox[a]._id.toString() == _id.toString()) {
                inbox[a].is_deleted = true;
                break;
            }
        }

        /* change the is_deleted field to true in my document */
        await this.database.collection("users").findOneAndUpdate({
            $and: [{
                "_id": user._id
            }, {
                "friends._id": this.ObjectId(friendId)
            }]
        }, {
            $set: {
                "friends.$.inbox": inbox
            }
        });

        await this.database.collection("users").findOneAndUpdate({
            $and: [{
                "_id": this.ObjectId(friendId)
            }, {
                "friends._id": user._id
            }]
        }, {
            $set: {
                "friends.$.inbox": inbox
            }
        });

        /* send realtime event to the other person */
        this.socketIO.to(this.users[friendId]).emit("messageDeleted", {
            "_id": _id
        });

        /* send the response back to client */
        result.json({
            "status": "success",
            "message": "Message has been deleted."
        });
    }

};
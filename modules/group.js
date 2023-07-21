module.exports = {

    database: null,
    ObjectId: null,
    fileSystem: null,

    update: async function (request, result) {
        var accessToken = request.fields.accessToken;
        var name = request.fields.name;
        var additionalInfo = request.fields.additionalInfo;
        var coverPhoto = "";
        var area = request.fields.area; //add area to a community
        var type = request.fields.type;
        var imageData = request.fields.imageData;
        var _id = request.fields._id;

        var self = this;

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

        var group = await this.database.collection("groups").findOne({
            "_id": this.ObjectId(_id)
        });

        if (group == null) {
            result.json({
                "status": "error",
                "message": "Group does not exists."
            });

            return false;
        }

        /* check if the logged in user is the creator of this group */
        if (group.user._id.toString() != user._id.toString()) {
            result.json({
                "status": "error",
                "message": "Sorry, you are not the admin of this group."
            });

            return false;
        }

        if (request.files.coverPhoto.size > 0) {

            if (request.files.coverPhoto.type.includes("image")) {

                coverPhoto = `${request.files.coverPhoto.name}`;

                if (group.coverPhoto != "") {
                    this.fileSystem.unlink(group.coverPhoto, function (error) {
                        //
                    });
                }
                
                // Read the file
                this.fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
                    if (err) throw err;
                    console.log('File read!');

                    // Write the file
                    self.fileSystem.writeFile(coverPhoto, data, async function (err) {
                        if (err) throw err;
                        console.log('File written!');

                        await self.database.collection("groups").findOneAndUpdate({
                            "_id": self.ObjectId(_id)
                        }, {
                            $set: {
                                "name": name,
                                "additionalInfo": additionalInfo,
                                "coverPhoto": coverPhoto,
                                "area":area //area
                            }
                        });

                        result.json({
                            "status": "success",
                            "message": "Comunidad ha sido actualizada"
                        });
                    });

                    // Delete the file
                    self.fileSystem.unlink(request.files.coverPhoto.path, function (err) {
                        if (err) throw err;
                        console.log('File deleted!');
                    });
                });
            } else {
                result.json({
                    "status": "erorr",
                    "message": "Invalid image file."
                });
            }
        } else {
            await this.database.collection("groups").findOneAndUpdate({
                "_id": this.ObjectId(_id)
            }, {
                $set: {
                    "name": name,
                    "additionalInfo": additionalInfo,
                    "area":area //area
                }
            });

            result.json({
                "status": "success",
                "message": "Comunidad ha sido actualizada"
            });
        }
    },

    destroy: async function (request, result) {
        var _id = request.fields._id;
        var accessToken = request.fields.accessToken;
        
        var self = this;

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

        var group = await this.database.collection("groups").findOne({
            "_id": this.ObjectId(_id)
        });

        if (group == null) {
            result.json({
                "status": "error",
                "message": "Group does not exists."
            });

            return false;
        }

        /* check if the logged in user is the creator of this group */
        if (group.user._id.toString() != user._id.toString()) {
            result.json({
                "status": "error",
                "message": "Sorry, you are not the owner of this group."
            });

            return false;
        }

        if (group.coverPhoto != "") {
            this.fileSystem.unlink(group.coverPhoto, function (error) {
                //
            });
        }

        await this.database.collection("groups").deleteOne({
            "_id": this.ObjectId(_id)
        });

        result.json({
            "status": "success",
            "message": "Comunidad ha sido eliminada"
        });
    }
};
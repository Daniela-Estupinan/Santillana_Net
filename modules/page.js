module.exports = {

    database: null,
    ObjectId: null,
    fileSystem: null,

    update: async function (request, result) {
        var accessToken = request.fields.accessToken;
        var name = request.fields.name;
        var domainName = request.fields.domainName;
        var additionalInfo = request.fields.additionalInfo;
        var coverPhoto = "";
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

        var page = await this.database.collection("pages").findOne({
            "_id": this.ObjectId(_id)
        });

        if (page == null) {
            result.json({
                "status": "error",
                "message": "Page does not exists."
            });

            return false;
        }

        /* check if the logged in user is the creator of this page */
        if (page.user._id.toString() != user._id.toString()) {
            result.json({
                "status": "error",
                "message": "Sorry, you are not the owner of this page."
            });

            return false;
        }

        if (request.files.coverPhoto.size > 0) {

            if (request.files.coverPhoto.type.includes("image")) {

                coverPhoto = "public/images/" + new Date().getTime() + "-" + request.files.coverPhoto.name;

                if (page.coverPhoto != "") {
                    this.fileSystem.unlink(page.coverPhoto, function (error) {
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

                        await self.database.collection("pages").findOneAndUpdate({
                            "_id": self.ObjectId(_id)
                        }, {
                            $set: {
                                "name": name,
                                "domainName": domainName,
                                "additionalInfo": additionalInfo,
                                "coverPhoto": coverPhoto
                            }
                        });

                        result.json({
                            "status": "success",
                            "message": "Page has been updated."
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
            await this.database.collection("pages").findOneAndUpdate({
                "_id": this.ObjectId(_id)
            }, {
                $set: {
                    "name": name,
                    "domainName": domainName,
                    "additionalInfo": additionalInfo
                }
            });

            result.json({
                "status": "success",
                "message": "Page has been updated."
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

        var page = await this.database.collection("pages").findOne({
            "_id": this.ObjectId(_id)
        });

        if (page == null) {
            result.json({
                "status": "error",
                "message": "Page does not exists."
            });

            return false;
        }

        /* check if the logged in user is the creator of this page */
        if (page.user._id.toString() != user._id.toString()) {
            result.json({
                "status": "error",
                "message": "Sorry, you are not the owner of this page."
            });

            return false;
        }

        if (page.coverPhoto != "") {
            this.fileSystem.unlink(page.coverPhoto, function (error) {
                //
            });
        }

        await this.database.collection("pages").deleteOne({
            "_id": this.ObjectId(_id)
        });

        result.json({
            "status": "success",
            "message": "Page has been deleted."
        });
    }
};
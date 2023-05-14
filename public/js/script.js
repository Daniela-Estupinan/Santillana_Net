function readMore(self) {
	const parent = self.parentElement

	const ellipsis = parent.querySelector(".ellipsis")
	const readMoreText = parent.querySelector(".read-more-text")

	if (ellipsis.style.display == "") {
		ellipsis.style.display = "none"
		readMoreText.style.display = ""
	} else {
		ellipsis.style.display = ""
		readMoreText.style.display = "none"
	}

	if (self.innerHTML.trim() == "read more") {
		self.innerHTML = " read less"
	} else {
		self.innerHTML = " read more"
	}
}

function isAttachmentImage(attachment) {
	const parts = attachment.split("/");
	let filename = "";
	if (parts.length > 0) {
		filename = parts[parts.length - 1];
	}

	const filenameParts = filename.split(".");
	let extension = "";
	if (filenameParts.length > 0) {
		extension = filenameParts[filenameParts.length - 1];
	}
	extension = extension.toLowerCase();

    const acceptedImageTypes = ['gif', "jpg", 'jpeg', 'png'];
    return extension && acceptedImageTypes.includes(extension);
}

function getTimePassed(timestamp) {
	const currentTimestamp = new Date().getTime();
	const difference = currentTimestamp - timestamp;

	const seconds = Math.floor(difference / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		return hours + " hours ago";
	}
	if (minutes > 0) {
		return minutes + " minutes ago";
	}
	if (seconds > 0) {
		return seconds + " seconds ago";
	}

	return "";
}

function getProfileImage(user) {
	if (user.profileImage == "") {
		return mainURL + "/public/img/default_profile.jpg";
	}
	return mainURL + "/" + user.profileImage;
}

function showPostShares(self) {
	var _id = self.getAttribute("data-id");
	document.getElementById("post-sharers-modal").style.display = "block";

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/showPostSharers", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {

				response.data = response.data.reverse();
				
				var html = "<span class='close' onclick='this.parentElement.parentElement.style.display = \"none\";'>&times;</span>";
				for (var a = 0; a < response.data.length; a++) {
					const data = response.data[a];

					var createdDate = new Date(data.createdAt);
					var createdAt = createdDate.getDate() + " " + months[createdDate.getMonth() + 1] + ", " + createdDate.getFullYear();
					createdAt += " " + createdDate.getHours() + ":" + createdDate.getMinutes() + ":" + createdDate.getSeconds();

					html += `<div class="row" style="margin-top: 10px;">
						<div class="col-md-2">
							<figure>
								<a href="/user/` + data.username + `">
									<img src="` + mainURL + `/` + data.profileImage + `" onerror="this.src = '/public/img/default_profile.jpg';">
								</a>
							</figure>
						</div>

						<div class="col-md-10 pepl-info">
							<h4>
								<a href="/user/` + data.username + `">` + data.name + `</a>
							</h4>
							<p>` + createdAt + `</p>
						</div>
					</div>`;
				}
				document.querySelector("#post-sharers-modal .modal-content").innerHTML = html;
			}

			if (response.status == "error") {
				// swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function showPostDislikers(self) {
	var _id = self.getAttribute("data-id");
	document.getElementById("post-dislikers-modal").style.display = "block";

	var ajax = new XMLHttpRequest();
	if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
		ajax.open("POST", "/showStoryDislikers", true)
	} else {
		ajax.open("POST", "/showPostDislikers", true)
	}

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {

				response.data = response.data.reverse();

				var html = "<span class='close' onclick='this.parentElement.parentElement.style.display = \"none\";'>&times;</span>";
				for (var a = 0; a < response.data.length; a++) {
					const data = response.data[a];

					var createdDate = new Date(data.createdAt);
					var createdAt = createdDate.getDate() + " " + months[createdDate.getMonth() + 1] + ", " + createdDate.getFullYear();
					createdAt += " " + createdDate.getHours() + ":" + createdDate.getMinutes() + ":" + createdDate.getSeconds();

					html += `<div class="row" style="margin-top: 20px;">
						<div class="col-md-2">
							<figure>
								<a href="/user/` + data.username + `">
									<img src="` + mainURL + `/` + data.profileImage + `" onerror="this.src = '/public/img/default_profile.jpg';">
								</a>
							</figure>
						</div>

						<div class="col-md-10 pepl-info">
							<h4>
								<a href="/user/` + data.username + `">` + data.name + `</a>
							</h4>
							<p>` + createdAt + `</p>
						</div>
					</div>`;
				}
				document.querySelector("#post-dislikers-modal .modal-content").innerHTML = html;
			}

			if (response.status == "error") {
				document.getElementById("post-dislikers-modal").style.display = "none"
				// swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function showPostLikers(self) {
	var _id = self.getAttribute("data-id");
	document.getElementById("post-likers-modal").style.display = "block";

	var ajax = new XMLHttpRequest();
	if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
		ajax.open("POST", "/showStoryLikers", true)
	} else {
		ajax.open("POST", "/showPostLikers", true)
	}

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {

				response.data = response.data.reverse();

				var html = "<span class='close' onclick='this.parentElement.parentElement.style.display = \"none\";'>&times;</span>";
				for (var a = 0; a < response.data.length; a++) {
					const data = response.data[a];

					var createdDate = new Date(data.createdAt);
					var createdAt = createdDate.getDate() + " " + months[createdDate.getMonth() + 1] + ", " + createdDate.getFullYear();
					createdAt += " " + createdDate.getHours() + ":" + createdDate.getMinutes() + ":" + createdDate.getSeconds();

					html += `<div class="row" style="margin-top: 20px;">
						<div class="col-md-2">
							<figure>
								<a href="/user/` + data.username + `">
									<img src="` + mainURL + `/` + data.profileImage + `" onerror="this.src = '/public/img/default_profile.jpg';">
								</a>
							</figure>
						</div>

						<div class="col-md-10 pepl-info">
							<h4>
								<a href="/user/` + data.username + `">` + data.name + `</a>
							</h4>
							<p>` + createdAt + `</p>
						</div>
					</div>`;
				}
				document.querySelector("#post-likers-modal .modal-content").innerHTML = html;
			}

			if (response.status == "error") {
				document.getElementById("post-likers-modal").style.display = "none"
				// swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function deletePost(self) {
	var _id = self.getAttribute("data-id");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/deletePost", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {
				document.getElementById("delete-post-modal").style.display = "none";
				document.getElementById("post-" + _id).remove();
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function deletePostModal(self) {
	var _id = self.getAttribute("data-id");

	document.getElementById("delete-post-modal").querySelector("button").setAttribute("data-id", _id);
	document.getElementById("delete-post-modal").style.display = "block";
}

function doEditPost(form) {
	event.preventDefault()

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/editPost", true);

	form.submit.querySelector("i").style.display = "";
	form.submit.setAttribute("disabled", "disabled");

	ajax.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				// console.log(this.responseText);
				var response = JSON.parse(this.responseText);
				// console.log(response);

				form.submit.querySelector("i").style.display = "none";
				form.submit.removeAttribute("disabled");

				form.reset()

				if (response.status == "success") {
					document.getElementById("edit-post-modal").style.display = "none";

					const postNode = document.getElementById("post-" + response.post._id)
					const html = renderSinglePost(response.post)

					const doc = new DOMParser().parseFromString(html, "text/html")
					postNode.replaceWith(doc.firstChild)
					// postNode.parentElement.replaceChild(doc.firstChild, postNode)

					// re-initialize wavesurfer
					renderWaveSurfers()

					/*postNode.querySelector(".description p").innerHTML = response.post.caption;

					if (postNode.querySelector(".post-image") != null) {
						postNode.querySelector(".post-image").setAttribute("src", mainURL + "/" + response.post.image);
					}

					if (postNode.querySelector(".post-video") != null) {
						postNode.querySelector(".post-video").setAttribute("src", mainURL + "/" + response.post.video);
					}*/
				} else if (response.status == "error") {
					swal("Error", response.message, "error");
				}
			}

			if (this.status == 500) {
				console.log(this.responseText);
			}
		}
	};

	var formData = new FormData(form)
	formData.append("accessToken", localStorage.getItem("accessToken"))
	if (document.getElementById("edit-post-img-preview") != null) {
		formData.append("imgData", document.getElementById("edit-post-img-preview").getAttribute("src"))
	}
	ajax.send(formData)
}

function editPostModal(self) {
	var _id = self.getAttribute("data-id");
	
	var form = document.getElementById("form-edit-post");
	form._id.value = _id;

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/getPostById", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response.post);

			if (response.status == "success") {
				form.caption.value = response.post.caption;

				if (document.getElementById("edit-post-img-preview") != null) {
					if (response.post.image == "") {
						document.getElementById("edit-post-img-preview").style.display = "none"
						document.getElementById("edit-post-img-preview").setAttribute("src", "")
					} else {
						document.getElementById("edit-post-img-preview").style.display = ""
						document.getElementById("edit-post-img-preview").setAttribute("src", mainURL + "/" + response.post.image)
					}
				}

				if (document.getElementById("edit-post-video-preview") != null) {
					if (response.post.video == "") {
						document.getElementById("edit-post-video-preview").style.display = "none";
						document.getElementById("edit-post-video-preview").setAttribute("src", "");
					} else {
						document.getElementById("edit-post-video-preview").style.display = "";
						document.getElementById("edit-post-video-preview").setAttribute("src", mainURL + "/" + response.post.video);
					}
				}

				form.type.value = response.post.type;
				document.getElementById("edit-post-modal").style.display = "block";
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function closeModal(modalId) {
	document.getElementById(modalId).style.display = "none";
}

function onSearch(button) {
	window.location.href = "/search/" + button.previousElementSibling.value;
}

function renderWaveSurfers() {
	setTimeout(function () {
		window.wavesurfers = []
		let audios = document.querySelectorAll(".post-audio")
		for (let a = 0; a < audios.length; a++) {

			const wavesurfer = WaveSurfer.create({
			    container: '#' + audios[a].nextElementSibling.getAttribute("id"),
			    waveColor: 'violet',
			    progressColor: 'purple',
			    scrollParent: true
			})
			wavesurfer.load(audios[a].getAttribute("src"))
			wavesurfer.setMute(true)
			wavesurfer.toggleInteraction()

			/*wavesurfer.on("seek", function (progress) {
				const wavesurferId = wavesurfer.container.getAttribute("id")

				for (let b = 0; b < window.wavesurfers.length; b++) {
					if (window.wavesurfers[b].wavesurferId == wavesurferId) {
						const duration = document.getElementById(window.wavesurfers[b].audioId).duration
						console.log([duration, progress])
						document.getElementById(window.wavesurfers[b].audioId).currentTime = progress
					}
				}
			})*/

			wavesurfer.on('ready', function () {
				const wavesurferId = wavesurfer.container.getAttribute("id")

				for (let b = 0; b < window.wavesurfers.length; b++) {
					if (window.wavesurfers[b].wavesurferId == wavesurferId) {
						document.getElementById(window.wavesurfers[b].audioId).setAttribute("class", "post-audio")
					}
				}
			})

			audios[a].addEventListener("play", function () {
				const id = event.target.getAttribute("id")
				for (let b = 0; b < window.wavesurfers.length; b++) {
					if (window.wavesurfers[b].audioId == id) {
						window.wavesurfers[b].obj.play()
					}
				}
			})

			audios[a].addEventListener("pause", function () {
				const id = event.target.getAttribute("id")
				for (let b = 0; b < window.wavesurfers.length; b++) {
					if (window.wavesurfers[b].audioId == id) {
						window.wavesurfers[b].obj.pause()
					}
				}
			})

			audios[a].addEventListener("seeked", function () {
				const id = event.target.getAttribute("id")
				const duration = event.target.duration
				const currentTime = event.target.currentTime

				for (let b = 0; b < window.wavesurfers.length; b++) {
					if (window.wavesurfers[b].audioId == id) {
						window.wavesurfers[b].obj.seekTo((currentTime / duration))
					}
				}
			})

			window.wavesurfers.push({
				audioId: audios[a].getAttribute("id"),
				wavesurferId: audios[a].nextElementSibling.getAttribute("id"),
				obj: wavesurfer
			})
		}
	}, 1000)
}

function renderFeed(response) {
	var html = "";
	for (var a = 0; a < response.data.length; a++) {
		var data = response.data[a];
		html += renderSinglePost(data);
	}
	document.getElementById("newsfeed").innerHTML += html

	renderWaveSurfers()
}

function renderSinglePost(data) {

	if (data.isBanned) {
		return "";
	}

	var html = "";
	html += '<div class="central-meta item" id="post-' + data._id + '">';
		html += '<div class="user-post">';
			html += '<div class="friend-info">';

				if (data.isBoost) {
					html += `<p>Sponsored</p>`
				}

				html += '<figure>';
					html += '<img src="' + mainURL + "/" + (data.type == "group_post" ? data.uploader.profileImage : data.user.profileImage) + '" style="width: 45px; height: 45px; object-fit: cover;" onerror="this.src = \'/public/img/default_profile.jpg\';" />';
				html += '</figure>';

				html += '<div class="friend-name">';
					html += '<ins>';
						if (data.type == "post") {
							html += '<a href="/user/' + data.user.username + '">';
								html += data.user.name;
							html += '</a>';
						} else if (data.type == "group_post") {
							html += '<a href="/group/' + data.user._id + '">';
								html += data.user.name;
							html += '</a>';
						} else if (data.type == "page_post") {
							html += '<a href="/page/' + data.user._id + '">';
								html += data.user.name;
							html += '</a>';
						} else {
							html += data.user.name;
						}

						var isMyUploaded = false;
						if (data.type == "group_post") {
							if (data.uploader._id == window.user._id) {
								isMyUploaded = true
								html += `<i class="fa fa-trash delete-post" onclick="deletePostModal(this);" data-id="` + data._id + `"></i>`;
								html += `<i class="fa fa-pencil edit-post" onclick="editPostModal(this);" data-id="` + data._id + `"></i>`;
							}
						} else {
							if (data.user._id == window.user._id) {
								isMyUploaded = true
								html += `<i class="fa fa-trash delete-post" onclick="deletePostModal(this);" data-id="` + data._id + `"></i>`;
								html += `<i class="fa fa-pencil edit-post" onclick="editPostModal(this);" data-id="` + data._id + `"></i>`;
							}
							html += `<a href='` + data.link + `' class="detail-post"><i class="fa fa-eye"></i></a>`;
						}

					html += '</ins>';

					var createdAt = new Date(data.createdAt);
					var date = createdAt.getDate() + "";
					date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();

					html += '<span>Published: ' + date + '</span>'

					if (data.originalPost != null) {
						html += `<span>Original <a href='` + mainURL + `/post/` + data.originalPost._id + `'>post</a> by ` + data.originalPost.user.name + `</span>`
					}

				html += '</div>';

				html += '<div class="post-meta">';

					let caption = data.caption

					const maxLength = 140
					let result = caption.substring(0, maxLength)

					if (caption.length > maxLength) {
						const moreText = caption.substring(maxLength, caption.length)
						result += `<span style='display: contents;'><span class='ellipsis'> ...</span><span class='read-more-text' style='display: none;'>` + moreText + `</span><a href='javascript:void(0)' onclick='readMore(this)'> read more</a>
						</span>`
					}

					result = urlify(result)

					html += '<div class="description">';
						html += '<p>'
							html += result
							// html += caption
						html += '</p>'
					html += '</div>';

					if (data.savedPaths != null) {
						html += `<div class="gridAttachments">`
						for (let a = 0; a < data.savedPaths.length; a++) {
							
							if (a == 4) {
								break
							}

							const parts = data.savedPaths[a].split(".")
							const extension = parts[parts.length - 1]
							if (extension == "jpg" || extension == "jpeg" || extension == "png") {
								html += '<img class="post-image" src="' + mainURL + "/" + data.savedPaths[a] + '" />';
							} else if (extension == "mp4" || extension == "mov" || extension == "mkv") {
								html += '<video class="post-video" style="height: 359px; width: 100%;" controls src="' + mainURL + "/" + data.savedPaths[a] + '"></video>';
							} else if (extension == "mp3" || extension == "m4a" || extension == "aac") {
								html += '<audio class="post-audio" controls src="' + mainURL + "/" + data.savedPaths[a] + '" id="audio-post-' + data._id + '"></audio> <div id="waveform-post-' + data._id + '"></div>'
							}

							if (a == 3) {
								html += `<a style="display: contents;" href="` + mainURL + `/post/` + data._id + `">
									<div class="overlayAttachment">
										<div class="text">+</div>
									</div>
								</a>`
							}
						}
						html += `</div>`
					}

					/*html += '<img class="post-image ' + (data.image == "" ? "hide" : "") + '" src="' + mainURL + "/" + data.image + '">';
					html += '<video class="post-video ' + (data.video == "" ? "hide" : "") + '" style="height: 359px; width: 100%;" controls src="' + mainURL + "/" + data.video + '"></video>';

					if (data.audio && data.audio != "") {
						html += '<audio class="post-audio" controls src="' + mainURL + "/" + data.audio + '" id="audio-post-' + data._id + '"></audio> <div id="waveform-post-' + data._id + '"></div>'
					}*/

					if (data.youtube_url && data.youtube_url != "") {
						let youtube_url = data.youtube_url
						youtube_url = youtube_url.replace("watch?v=", "embed/")

						html += '<iframe width="560" height="315" src="' + youtube_url + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
					}

					if (data.document && data.document != "") {
						const nameParts = data.document.split(".")
						let extension = nameParts[nameParts.length - 1]
						
						html += `<a href="` + data.document + `" target="_blank">
							<i class='fa fa-file-` + extension + `-o' style='font-size: 50px;'></i>
						</a>`
					}

					html += createLikesSection(data);
				html += '</div>';
			html += '</div>';

			// html += "<div id='post-comments-" + data._id + "'>";
			// 	html += createCommentsSection(data);
			// html += "</div>";

			if (isMyUploaded) {
				html += "<div class='row'>"
					html += "<div class='offset-md-9 col-md-3'>"
						
					html += "</div>"
				html += "</div>"
			}

		html += '</div>';
	html += '</div>';
	return html;
}

function showCommentsModal(postId) {
	$("#postCommentsModal input[name=_id]").val(postId)
	$("#postCommentsModal").modal("show")

	const ajax = new XMLHttpRequest()
	if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
		ajax.open("POST", "/fetchCommentsByStory", true)
	} else {
		ajax.open("POST", "/fetchCommentsByPost", true)
	}

	ajax.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				const response = JSON.parse(this.responseText)
				if (response.status == "success") {
					let html = ""

					for (let a = 0; a < response.comments.length; a++) {
						const comment = response.comments[a]

						var createdAt = new Date(comment.createdAt)
						var date = createdAt.getDate() + ""
						date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear()

						html += `<div class="row" style="border: 1px solid lightgray; padding: 15px; margin-bottom: 20px; border-radius: 10px;">
							<div class="col-md-2">
								<a href="` + mainURL + `/user/` + comment.user._id + `">
									<img class="profile-image" style="width: 50px; height: 50px; object-fit: cover; display: block; border-radius: 50%;" src="` + mainURL + "/" + comment.user.profileImage +`" onerror="this.src = '/public/img/default_profile.jpg'" />

									` + comment.user.name + `
								</a>
							</div>

							<div class="col-md-10" style="background-color: #f5f5f5;
							    border-radius: 10px;
							    padding: 20px;">
								` + comment.comment + `
								<br />
								` + date + `
								<br />
								<button type="button" class="mtr-btn pull-right" onclick="doReply('` + postId + `', '` + comment._id + `')" style="margin-bottom: 20px;">
									<span>Reply</span>
								</button>

								<div data-id-replies="` + comment._id + `">`

								comment.replies.reverse()

								for (let b = 0; b < comment.replies.length; b++) {
									const reply = comment.replies[b]
									html += renderSingleReply(reply)
								}

						html += `<div>
							</div>
						</div>`

						/*html += `<tr>
							<td><a href="` + mainURL + `/user/` + comment.user._id + `">` + comment.user.name + `</a></td>
							<td>` + comment.comment + `</td>
							<td>` + date + `</td>
							<td>
								<button type="button" class="mtr-btn" onclick="doReply('` + postId + `', '` + comment._id + `')">
									<span>Reply</span>
								</button>
							</td>
						</tr>`*/
					}

					// $("#postCommentsModal tbody").html(html)
					$("#post-comments").html(html)
				}
			}

			if (this.status == 500) {
				console.log(this.responseText)
			}
		}
	}

	const formData = new FormData()
	formData.append("accessToken", localStorage.getItem("accessToken"))
	formData.append("_id", postId)
	ajax.send(formData)
}

function renderSingleReply(reply) {
	var createdAt = new Date(reply.createdAt)
	var replyDate = createdAt.getDate() + ""
	replyDate = replyDate.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear()

	let html = `<div class="row" style="clear: both; margin-top: 20px;">
			<div class="col-md-2">
				<a href="` + mainURL + `/user/` + reply.user._id + `">
					<img class="profile-image" style="width: 50px; height: 50px; object-fit: cover; display: block; border-radius: 50%;" src="` + mainURL + "/" + reply.user.profileImage +`" onerror="this.src = '/public/img/default_profile.jpg'" />

					` + reply.user.name + `
				</a>
			</div>

			<div class="col-md-10" style="background-color: #e9e9e9;
			    border-radius: 10px;
			    padding: 20px;">
				` + reply.reply + `
				<br />
				` + replyDate + `
			</div>
		</div>`
	return html
}

function promisePostReply(postId, _id, value) {
	return new Promise(function (callBack) {
		setTimeout(function () {
			var ajax = new XMLHttpRequest();
			ajax.open("POST", "/postReply", true);

			ajax.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					callBack(JSON.parse(this.responseText))
				}
			};

			var formData = new FormData()
			formData.append("accessToken", localStorage.getItem("accessToken"));
			formData.append("postId", postId)
			formData.append("commentId", _id)
			formData.append("reply", value)
			ajax.send(formData);
		}, 3000)
	})
}

function doReply(postId, _id) {
	swal({
	  text: 'Enter your reply',
	  content: "input",
	  button: {
	    text: "Post reply",
	    closeModal: false,
	  },
	})
	.then(value => {
	  if (!value) throw null;
	 
	  return promisePostReply(postId, _id, value)
	})
	.then(results => {
		return results

	  // return results.json();
	})
	.then(json => {

		if (json.status == "success") {
			let html = renderSingleReply(json.replyObj)
			document.querySelector("div[data-id-replies='" + _id + "']").innerHTML = html + document.querySelector("div[data-id-replies='" + _id + "']").innerHTML
		} else {
			swal("Error", json.message, "error")
		}

		swal.stopLoading()
	    swal.close()
	})
	.catch(err => {
		console.log(err)
	  if (err) {
	    swal("Error!", "The AJAX request failed!", "error");
	  } else {
	    swal.stopLoading();
	    swal.close();
	  }
	});
}

function createLikesSection(data, isMyStory = false) {

	var isLiked = false;
	const likers = data.likers || []
	for (var b = 0; b < likers.length; b++) {
		var liker = likers[b];
		if (liker._id == window.user._id) {
			isLiked = true;
			break;
		}
	}

	var isDisliked = false;
	const dislikers = data.dislikers || []
	for (var b = 0; b < dislikers; b++) {
		var disliker = dislikers[b];
		if (disliker._id == window.user._id) {
			isDisliked = true;
			break;
		}
	}

	const comments = data.comments || []
	const shares = data.shares || []
	
	var html = "";

	html += '<div class="we-video-info">';
		html += '<ul>';

			html += '<li>';

				var className = isLiked ? "like" : "none";

				html += '<span class="' + className + '" onclick="toggleLikePost(this);" data-id="' + data._id + '">';
					html += '<i class="ti-thumb-up"></i>';
				html += '</span>';

				html += '<ins class="likers-count" data-id="' + data._id + '" onclick="showPostLikers(this);">' + likers.length + '</ins>';

			html += '</li>';

			html += '<li>';


//descomentar
			html += `<li>
				<button type="button" onclick="showCommentsModal('` + data._id + `')" style='background: none; border: none;'>
					<span class="comment" title="Comments">
						<i class="fa fa-comments-o"></i>

						<ins id="count-post-comments-` + data._id + `">` + comments.length + `</ins>
					</span>
				</button>
			</li>`
			
			if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
				//
			} else {
				/*html += '<li>';
					html += '<span class="share" style="position: relative; top: 9px;">';
						html += `<div class="dropdown" style="position: relative; top: 20px;">
							<button class="dropdown-toggle" type="button" id="dropdownShare-` + data._id + `" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style='background: none; border: none;'>
								<i class="ti-share"></i>
							</button>
							<div class="dropdown-menu" aria-labelledby="dropdownShare-` + data._id + `">
								<a class="dropdown-item" href="javascript:void(0);" onclick="sharePost(this);" data-id="` + data._id + `">Share on your timeline</a>
								<a class="dropdown-item" href="javascript:void(0);" onclick="shareInPage(this);" data-id="` + data._id + `">Share on pages you manage</a>
								<a class="dropdown-item" href="javascript:void(0);" onclick="shareInGroup(this);" data-id="` + data._id + `">Share in groups</a>
							</div>
						</div>

						<ins class="shares-count" data-id="` + data._id + `" onclick="showPostShares(this);" id="shares-count-` + data._id + `">` + shares.length + `</ins>`;
					html += '</span>';
				html += '</li>';*/
			}

		html += '</ul>';
	html += '</div>';

	return html;
}

function shareInPage(self) {
	var _id = self.getAttribute("data-id");

	var html = "";
	for (var a = 0; a < window.user.pages.length; a++) {
		var page = window.user.pages[a];
		html += `<div class="row" style="margin-bottom: 20px;">
			<div class="col-md-4">
				<img src='` + mainURL + `/` + page.coverPhoto + `' style="width: 300px;" />
			</div>

			<div class="col-md-4">
				` + page.name + `
			</div>

			<div class="col-md-4">
				<form method="POST" onsubmit="return doSharePostInPage(this);">
					<input type="hidden" name="pageId" value="` + page._id + `">
					<input type="hidden" name="postId" value="` + _id + `">
					<input type="submit" name="submit" value="Share" class="btn-share" />
				</form>
			</div>
		</div>`;
	}
	document.querySelector("#shareInPagesModal .modal-body").innerHTML = html;

	$("#shareInPagesModal").modal("show");
}

function shareInGroup(self) {
	var _id = self.getAttribute("data-id");

	var html = "";
	for (var a = 0; a < window.user.groups.length; a++) {
		var group = window.user.groups[a];
		html += `<div class="row" style="margin-bottom: 20px;">
			<div class="col-md-4">
				<img src='` + mainURL + `/` + group.coverPhoto + `' style="width: 300px;" />
			</div>

			<div class="col-md-4">
				` + group.name + `
			</div>

			<div class="col-md-4">
				<form method="POST" onsubmit="return doSharePostInGroup(this);">
					<input type="hidden" name="groupId" value="` + group._id + `">
					<input type="hidden" name="postId" value="` + _id + `">
					<input type="submit" name="submit" value="Share" class="btn-share" />
				</form>
			</div>
		</div>`;
	}
	document.querySelector("#shareInGroupModal .modal-body").innerHTML = html;

	$("#shareInGroupModal").modal("show");
}

function doSharePostInPage(form) {
	form.submit.value = "Sharing...";
	form.submit.setAttribute("disabled", "disabled");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/sharePostInPage", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			form.submit.removeAttribute("disabled");
			form.submit.value = "Share";

			var response = JSON.parse(this.responseText);
			if (response.status == "success") {
				swal("Success", response.message, "success");
			} else {
				swal("Error", response.message, "error");
			}

			if (response.status == "success") {
				self.className = "like";

				var shares = parseInt(document.getElementById("shares-count-" + form.postId.value).innerHTML);
				shares++;
				document.getElementById("shares-count-" + form.postId.value).innerHTML = shares;

				form.remove();
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function doSharePostInGroup(form) {
	form.submit.value = "Sharing...";
	form.submit.setAttribute("disabled", "disabled");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/sharePostInGroup", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			form.submit.removeAttribute("disabled");
			form.submit.value = "Share";

			var response = JSON.parse(this.responseText);
			if (response.status == "success") {
				swal("Success", response.message, "success");
			} else {
				swal("Error", response.message, "error");
			}

			if (response.status == "success") {
				self.className = "like";

				var shares = parseInt(document.getElementById("shares-count-" + form.postId.value).innerHTML);
				shares++;
				document.getElementById("shares-count-" + form.postId.value).innerHTML = shares;

				form.remove();
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function sharePost(self) {

	swal({
		title: "Share post",
		text: "Are you sure you want to share this post on your timeline ?",
		icon: "warning",
		buttons: true,
		dangerMode: true,
	})
	.then((willDelete) => {
		if (willDelete) {
			var _id = self.getAttribute("data-id");

			var ajax = new XMLHttpRequest();
			ajax.open("POST", "/sharePost", true);

			ajax.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {

					var response = JSON.parse(this.responseText);
					if (response.status == "success") {
						swal("Success", response.message, "success");
					} else {
						swal("Error", response.message, "error");
					}

					if (response.status == "success") {
						self.className = "like";

						var shares = parseInt(document.getElementById("shares-count-" + _id).innerHTML);
						shares++;
						document.getElementById("shares-count-" + _id).innerHTML = shares;

						showNewsfeed();
					}
				}
			};

			var formData = new FormData();
			formData.append("accessToken", localStorage.getItem("accessToken"));
			formData.append("_id", _id);
			ajax.send(formData);
		}
	});
}

function toggleDislikePost(self) {
	var _id = self.getAttribute("data-id");

	var ajax = new XMLHttpRequest()
	if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
		ajax.open("POST", "/toggleDislikeStory", true)
	} else {
		ajax.open("POST", "/toggleDislikePost", true)
	}

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);

			if (response.status == "success") {
				self.className = "dislike";

				var dislikes = parseInt(self.nextElementSibling.innerHTML);
				dislikes++;
				self.nextElementSibling.innerHTML = dislikes;
			}
			if (response.status == "undisliked") {
				self.className = "none";

				var dislikes = parseInt(self.nextElementSibling.innerHTML);
				dislikes--;
				self.nextElementSibling.innerHTML = dislikes;
			}
			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("accessToken", localStorage.getItem("accessToken"));
	formData.append("_id", _id);
	ajax.send(formData);
}

function toggleLikePost(self) {
	var _id = self.getAttribute("data-id");

	var ajax = new XMLHttpRequest()
	if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
		ajax.open("POST", "/toggleLikeStory", true)
	} else {
		ajax.open("POST", "/toggleLikePost", true)
	}

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);

			if (response.status == "success") {
				self.className = "like";

				var likes = parseInt(self.nextElementSibling.innerHTML);
				likes++;
				self.nextElementSibling.innerHTML = likes;
			}
			if (response.status == "unliked") {
				self.className = "none";

				var likes = parseInt(self.nextElementSibling.innerHTML);
				likes--;
				self.nextElementSibling.innerHTML = likes;
			}
			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("accessToken", localStorage.getItem("accessToken"));
	formData.append("_id", _id);
	ajax.send(formData);
}

function createSingleReplySection(reply) {
	let html = ""
	html += '<li style="list-style-type: none;">';
		html += '<div class="comet-avatar">';
			html += '<img src="' + mainURL + '/' + reply.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
		html += '</div>';

		html += '<div class="we-comment">';
			html += '<div class="coment-head">';
				html += '<h5><a href="/">' + reply.user.name + '</a></h5>';

				var createdAt = new Date(reply.createdAt);
				var date = createdAt.getDate() + "";
				date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();

				html += '<span>' + date + '</span>';
			html += '</div>';
			html += '<p>' + reply.reply + '</p>';
		html += '</div>';
	html += '</li>';

	return html
}

function createSingleCommentSection(comment, data) {
	let html = ""
	html += '<li style="list-style-type: none;">';
		html += '<div class="comet-avatar">';
			html += '<img src="' + mainURL + '/' + comment.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
		html += '</div>';

		html += '<div class="we-comment">';
			html += '<div class="coment-head">';
				html += '<h5><a href="/">' + comment.user.name + '</a></h5>';

				var createdAt = new Date(comment.createdAt);
				var date = createdAt.getDate() + "";
				date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();

				html += '<span>' + date + '</span>';
				html += '<a class="we-reply" href="javascript:void(0);" data-post-id="' + data._id + '" data-comment-id="' + comment._id + '" onclick="prepareToReply(this);" title="Reply"><i class="fa fa-reply"></i></a>';
			html += '</div>';

			html += '<p>' + comment.comment + '</p>';
		html += '</div>';

		html += '<ul id="comment-' + comment._id + '">';

			comment.replies = comment.replies.reverse();

			for (var c = 0; c < comment.replies.length; c++) {
				var reply = comment.replies[c];

				html += createSingleReplySection(reply)
			}
			html += '</ul>';

	html += '</li>'
	return html
}

function createCommentsSection(data) {
	var html = "";

	html += '<div class="coment-area">';
		html += '<ul class="we-comet" style="max-height: 300px; overflow-y: scroll;">';

		data.comments = data.comments.reverse();
		for (var b = 0; b < data.comments.length; b++) {
			var comment = data.comments[b];

			html += createSingleCommentSection(comment, data)
		}
		html += '</ul>';

		html += '<ul class="we-comet" style="margin-bottom: 0px;">';
			html += '<li class="post-comment">';
				html += '<div class="comet-avatar">';
					html += '<img src="' + mainURL + '/' + window.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
				html += '</div>';
				html += '<div class="post-comt-box">';
					html += '<form method="post" onsubmit="return doPostComment(this);" style="margin-bottom: 0px;">';
						html += '<input type="hidden" name="_id" value="' + data._id + '">';
						html += '<textarea name="comment" placeholder="Post your comment"></textarea>';
						html += '<button type="submit" style="position: relative; left: 90%; bottom: 32px;">Post</button>';
					html += '</form>';
				html += '</div>';
			html += '</li>';
		html += '</ul>';

	html += '</div>';

	return html;
}

function doPostComment(form) {
	event.preventDefault()

	form.submit.setAttribute("disabled", "disabled")

	var ajax = new XMLHttpRequest();
	if (typeof onViewStoryPage !== "undefined" && onViewStoryPage) {
		ajax.open("POST", "/postCommentOnStory", true)
	} else {
		ajax.open("POST", "/postComment", true)
	}

	ajax.onreadystatechange = function() {
		if (this.readyState == 4) {

			if (this.status == 200) {
				form.submit.removeAttribute("disabled")

				var response = JSON.parse(this.responseText);
				if (response.status == "success") {
					swal("Success", response.message, "success")

					form.comment.value = "";

					// var commentsHtml = createCommentsSection(response.updatePost);
					// document.getElementById("post-comments-" + form._id.value).innerHTML = commentsHtml;

					var comments = parseInt(document.getElementById("count-post-comments-" + form._id.value).innerHTML);
					comments++;
					document.getElementById("count-post-comments-" + form._id.value).innerHTML = comments

					$("#postCommentsModal").modal("hide")
					$("#postCommentsModal input[name=_id]").val("")
				} else {
					swal("Error", response.message, "error")
				}
			}

			if (this.status == 500) {
				console.log(this.responseText)
			}
		}
	}

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function prepareToReply(self) {
	$("#replyModal input[name='postId']").val(self.getAttribute("data-post-id"));
	$("#replyModal input[name='commentId']").val(self.getAttribute("data-comment-id"));
	$("#replyModal").modal("show");
}



function showAddPost() {
	if (localStorage.getItem("accessToken")) {
		var html = "";

		html += '<div class="central-meta">';
			html += '<div class="new-postbox">';
				html += '<figure>';
					html += '<img src="' + mainURL + '/' + window.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
				html += '</figure>';

				html += '<div class="newpst-input">';
					html += '<form method="post" id="form-add-post" onsubmit="return doPost(this);" novalidate enctype="multipart/form-data">';

						html += '<input name="type" type="hidden" value="post" />';
						html += '<textarea rows="2" name="caption" placeholder="write something"></textarea>';
						html += '<div class="attachments">';
							html += '<ul>';


								html += '<li>';
									html += '<input type="file" multiple name="files" accept="image/*,audio/*,video/*" />';
								html += '</li>';

								html += '<li style="margin-right: 20px;">'
									html += '<i class="fa fa-youtube" onclick="showPopupYoutubeURL()" style="cursor: pointer; font-size: 30px;"></i>'
								html += '</li>'

								html += '<li>';
									html += '<button type="submit" name="submit">Post <i class="fa fa-spinner fa-spin" style="display: none;"></i></button>';
								html += '</li>';
							html += '</ul>';
						html += '</div>';
					html += '</form>';
				html += '</div>';
			html += '</div>';
		html += '</div>';
		document.getElementById("add-post-box").innerHTML = html;
	}
}

function showPopupYoutubeURL() {
	$("#modalYoutube").modal("show")
}

function previewPostAttachment(self, preview) {
	var file = self.files
	if (file.length > 0) {

		if (preview == "post-document-preview") {
			 document.getElementById(preview).innerHTML = file[0].name
		} else {
			var fileReader = new FileReader()
			fileReader.onload = function (event) {
				document.getElementById(preview).style.display = ""
				document.getElementById(preview).setAttribute("src", event.target.result)
			}
			fileReader.readAsDataURL(file[0])
		}
	}
}

function toggleLikePage(self) {
	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/toggleLikePage", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);

			if (response.status == "success") {
				self.className = "add-butn btn-unfriend";
				self.innerHTML = "Unlike";
			}

			if (response.status == "unliked") {
				self.className = "add-butn";
				self.innerHTML = "Like";
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("accessToken", localStorage.getItem("accessToken"));
	formData.append("_id", self.getAttribute("data-id"));
	ajax.send(formData);
}

jQuery(document).ready(function($) {
	
	"use strict";
	
//------- Notifications Dropdowns
  $('.top-area > .setting-area > li').on("click",function(){
	$(this).siblings().children('div').removeClass('active');
	$(this).children('div').addClass('active');
	return false;
  });
//------- remove class active on body
  $("body *").not('.top-area > .setting-area > li').on("click", function() {
	$(".top-area > .setting-area > li > div").removeClass('active');		
 });
	

//--- user setting dropdown on topbar	
$('.user-img').on('click', function() {
	$('.user-setting').toggleClass("active");
	return false;
});	
	
//--- side message box	
$('.friendz-list > li, .chat-users > li').on('click', function() {
	$('.chat-box').addClass("show");
	return false;
});	
	$('.close-mesage').on('click', function() {
		$('.chat-box').removeClass("show");
		return false;
	});	
	
//------ scrollbar plugin
	if ($.isFunction($.fn.perfectScrollbar)) {
		$('.dropdowns, .twiter-feed, .invition, .followers, .chatting-area, .peoples, #people-list, .chat-list > ul, .message-list, .chat-users, .left-menu').perfectScrollbar();
	}

/*--- socials menu scritp ---*/	
	$('.trigger').on("click", function() {
	    $(this).parent(".menu").toggleClass("active");
	  });
	
/*--- emojies show on text area ---*/	
	$('.add-smiles > span').on("click", function() {
	    $(this).parent().siblings(".smiles-bunch").toggleClass("active");
	  });

// delete notifications
$('.notification-box > ul li > i.del').on("click", function(){
    $(this).parent().slideUp();
	return false;
  }); 	

/*--- socials menu scritp ---*/	
	$('.f-page > figure i').on("click", function() {
	    $(".drop").toggleClass("active");
	  });

//===== Search Filter =====//
	(function ($) {
	// custom css expression for a case-insensitive contains()
	jQuery.expr[':'].Contains = function(a,i,m){
	  return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	function listFilter(searchDir, list) { 
	  var form = $("<form>").attr({"class":"filterform","action":"#"}),
	  input = $("<input>").attr({"class":"filterinput","type":"text","placeholder":"Search Contacts..."});
	  $(form).append(input).appendTo(searchDir);

	  $(input)
	  .change( function () {
		var filter = $(this).val();
		if(filter) {
		  $(list).find("li:not(:Contains(" + filter + "))").slideUp();
		  $(list).find("li:Contains(" + filter + ")").slideDown();
		} else {
		  $(list).find("li").slideDown();
		}
		return false;
	  })
	  .keyup( function () {
		$(this).change();
	  });
	}

//search friends widget
	$(function () {
	  listFilter($("#searchDir"), $("#people-list"));
	});
	}(jQuery));	

//progress line for page loader
	$('body').show();
	NProgress.start();
	setTimeout(function() { NProgress.done(); $('.fade').removeClass('out'); }, 2000);
	
//--- bootstrap tooltip	
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip();
	});
	
// Sticky Sidebar & header
	if($(window).width() < 769) {
		jQuery(".sidebar").children().removeClass("stick-widget");
	}

	if ($.isFunction($.fn.stick_in_parent)) {
		$('.stick-widget').stick_in_parent({
			parent: '#page-contents',
			offset_top: 60,
		});

		
		$('.stick').stick_in_parent({
		    parent: 'body',
            offset_top: 0,
		});
		
	}
	
/*--- topbar setting dropdown ---*/	
	$(".we-page-setting").on("click", function() {
	    $(".wesetting-dropdown").toggleClass("active");
	  });	
	  
/*--- topbar toogle setting dropdown ---*/	
$('#nightmode').on('change', function() {
    if ($(this).is(':checked')) {
        // Show popup window
        $(".theme-layout").addClass('black');	
    }
	else {
        $(".theme-layout").removeClass("black");
    }
});

//chosen select plugin
if ($.isFunction($.fn.chosen)) {
	$("select").chosen();
}

//----- add item plus minus button
if ($.isFunction($.fn.userincr)) {
	$(".manual-adjust").userincr({
		buttonlabels:{'dec':'-','inc':'+'},
	}).data({'min':0,'max':20,'step':1});
}	
	
/*if ($.isFunction($.fn.loadMoreResults)) {	
	$('.loadMore').loadMoreResults({
		displayedItems: 3,
		showItems: 1,
		button: {
		  'class': 'btn-load-more',
		  'text': 'Load More'
		}
	});	
}*/
	//===== owl carousel  =====//
	if ($.isFunction($.fn.owlCarousel)) {
		$('.sponsor-logo').owlCarousel({
			items: 6,
			loop: true,
			margin: 30,
			autoplay: true,
			autoplayTimeout: 1500,
			smartSpeed: 1000,
			autoplayHoverPause: true,
			nav: false,
			dots: false,
			responsiveClass:true,
				responsive:{
					0:{
						items:3,
					},
					600:{
						items:3,

					},
					1000:{
						items:6,
					}
				}

		});
	}
	
// slick carousel for detail page
	if ($.isFunction($.fn.slick)) {
	$('.slider-for-gold').slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,
		slide: 'li',
		fade: false,
		asNavFor: '.slider-nav-gold'
	});
	
	$('.slider-nav-gold').slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		asNavFor: '.slider-for-gold',
		dots: false,
		arrows: true,
		slide: 'li',
		vertical: true,
		centerMode: true,
		centerPadding: '0',
		focusOnSelect: true,
		responsive: [
		{
			breakpoint: 768,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: false,
				centerMode: true,
				dots: false,
				arrows: false
			}
		},
		{
			breakpoint: 641,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: true,
				centerMode: true,
				dots: false,
				arrows: false
			}
		},
		{
			breakpoint: 420,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: false,
				centerMode: true,
				dots: false,
				arrows: false
			}
		}	
		]
	});
}
	
//---- responsive header
	
$(function() {

	//	create the menus
	$('#menu').mmenu();
	$('#shoppingbag').mmenu({
		navbar: {
			title: 'General Setting'
		},
		offCanvas: {
			position: 'right'
		}
	});

	//	fire the plugin
	$('.mh-head.first').mhead({
		scroll: {
			hide: 200
		}
		
	});
	$('.mh-head.second').mhead({
		scroll: false
	});
	
});		

//**** Slide Panel Toggle ***//
	  $("span.main-menu").on("click", function(){
	     $(".side-panel").addClass('active');
		  $(".theme-layout").addClass('active');
		  return false;
	  });

	  $('.theme-layout').on("click",function(){
		  $(this).removeClass('active');
	     $(".side-panel").removeClass('active');
		  
	     
	  });

	  
// login & register form
	$('button.signup').on("click", function(){
		$('.login-reg-bg').addClass('show');
		return false;
	  });
	  
	  $('.already-have').on("click", function(){
		$('.login-reg-bg').removeClass('show');
		return false;
	  });
	
//----- count down timer		
	if ($.isFunction($.fn.downCount)) {
		$('.countdown').downCount({
			date: '11/12/2018 12:00:00',
			offset: +10
		});
	}
	
/** Post a Comment **/
jQuery(".post-comt-box textarea").on("keydown", function(event) {

	if (event.keyCode == 13) {
		var comment = jQuery(this).val();
		var parent = jQuery(".showmore").parent("li");
		var comment_HTML = '	<li><div class="comet-avatar"><img src="images/resources/comet-1.jpg" alt=""></div><div class="we-comment"><div class="coment-head"><h5><a href="time-line.html" title="">Jason borne</a></h5><span>1 year ago</span><a class="we-reply" href="#" title="Reply"><i class="fa fa-reply"></i></a></div><p>'+comment+'</p></div></li>';
		$(comment_HTML).insertBefore(parent);
		jQuery(this).val('');
	}
}); 
	
//inbox page 	
//***** Message Star *****//  
    $('.message-list > li > span.star-this').on("click", function(){
    	$(this).toggleClass('starred');
    });


//***** Message Important *****//
    $('.message-list > li > span.make-important').on("click", function(){
    	$(this).toggleClass('important-done');
    });

    

// Listen for click on toggle checkbox
	$('#select_all').on("click", function(event) {
	  if(this.checked) {
	      // Iterate each checkbox
	      $('input:checkbox.select-message').each(function() {
	          this.checked = true;
	      });
	  }
	  else {
	    $('input:checkbox.select-message').each(function() {
	          this.checked = false;
	      });
	  }
	});


	$(".delete-email").on("click",function(){
		$(".message-list .select-message").each(function(){
			  if(this.checked) {
			  	$(this).parent().slideUp();
			  }
		});
	});

// change background color on hover
	$('.category-box').hover(function () {
		$(this).addClass('selected');
		$(this).parent().siblings().children('.category-box').removeClass('selected');
	});
	
	
//------- offcanvas menu 

	const menu = document.querySelector('#toggle');  
	const menuItems = document.querySelector('#overlay');  
	const menuContainer = document.querySelector('.menu-container');  
	const menuIcon = document.querySelector('.canvas-menu i');  

	function toggleMenu(e) {
		menuItems.classList.toggle('open');
		menuContainer.classList.toggle('full-menu');
		menuIcon.classList.toggle('fa-bars');
		menuIcon.classList.add('fa-times');
		e.preventDefault();
	}

	if( menu ) {
		menu.addEventListener('click', toggleMenu, false);	
	}
	
// Responsive nav dropdowns
	$('.offcanvas-menu li.menu-item-has-children > a').on('click', function () {
		$(this).parent().siblings().children('ul').slideUp();
		$(this).parent().siblings().removeClass('active');
		$(this).parent().children('ul').slideToggle();
		$(this).parent().toggleClass('active');
		return false;
	});	
	


});//document ready end
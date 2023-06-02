var loadMore = {

    // Starting position to get new records
    start: 5,

    fetch: function () {
        // Creating a built-in AJAX object
        var ajax = new XMLHttpRequest();
 
        // Sending starting position
        ajax.open("POST", mainURL + "/fetch-more-posts", true);
 
        // Detecting request state change
        ajax.onreadystatechange = function () {
            // Called when the response is successfully received
            if (this.readyState == 4 && this.status == 200) {
                // For debugging purpose only
                // console.log(this.responseText);

                var response = JSON.parse(this.responseText);
                if (response.data == null) {
                    var p = document.createElement("p");
                    p.innerHTML = "Necesita iniciar sesión o registrarse";
                    p.style.textAlign = "center";
                    p.style.color = "black";
                    p.style.fontSize = "16px";
                    document.querySelector(".btn-load-more").replaceWith(p);
                    return false;
                }

                if (response.data.length == 0) {
                    var p = document.createElement("p");
                   // p.innerHTML = "No more posts to show.";
                    p.style.textAlign = "center";
                    p.style.color = "black";
                    p.style.fontSize = "16px";
                    document.querySelector(".btn-load-more").replaceWith(p);
                } else {
                    renderFeed(response);

                    // Incrementing the offset so you can get next records when that button is clicked
                    loadMore.start = loadMore.start + 5;
                }
            }
        };

        var formData = new FormData();
        formData.append("accessToken", localStorage.getItem("accessToken"));
        formData.append("start", this.start);

        // Actually sending the request
        ajax.send(formData);
    }
};
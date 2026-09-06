console.log("HOMEPAGE JS LOADED");

const startBtn = document.getElementById("startBtn");

if (startBtn) {
    startBtn.addEventListener("click", function () {
        console.log("START BUTTON CLICKED");

        window.location.href = "pages/login.html";
    });
} else {
    console.error("START BUTTON NOT FOUND");
}
const front = document.getElementById("front");
const splash = document.getElementById("splash");
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", function () {

    // Hide homepage
    front.style.display = "none";

    // Show splash animation
    splash.classList.add("active");

    // Start exit animation
    setTimeout(function () {
        splash.classList.add("exit");
    }, 2200);

    // Go to login page
    setTimeout(function () {
        window.location.href = "./pages/login.html";
    }, 3100);

});
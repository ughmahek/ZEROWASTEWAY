const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

console.log("auth.js loaded");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        console.log("Login button clicked");

        window.location.href = "dashboard.html";

    });

}

if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        console.log("Signup button clicked");

        window.location.href = "dashboard.html";

    });

}
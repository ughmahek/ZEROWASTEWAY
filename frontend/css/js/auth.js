const loginForm =
  document.getElementById("loginForm");

const signupForm =
  document.getElementById("signupForm");


if (loginForm) {

  loginForm.addEventListener("submit", (e) => {

    e.preventDefault();

    window.location.href = "dashboard.html";

  });

}


if (signupForm) {

  signupForm.addEventListener("submit", (e) => {

    e.preventDefault();

    window.location.href = "dashboard.html";

  });

}
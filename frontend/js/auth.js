console.log("AUTH JS LOADED");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const partnerLoginForm = document.getElementById("partnerLoginForm");
const partnerSignupForm = document.getElementById("partnerSignupForm");


/* =========================
   USER SIGN UP
========================= */

if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const fullname =
            signupForm.elements["fullname"].value.trim();

        const email =
            signupForm.elements["email"].value.trim();

        const password =
            signupForm.elements["newpass"].value;

        if (!fullname || !email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        const user = {
            fullname: fullname,
            email: email,
            password: password
        };

        localStorage.setItem(
            "zeroWasteUser",
            JSON.stringify(user)
        );

        alert("Account created successfully! Please log in.");

        window.location.href = "login.html";
    });
}


/* =========================
   USER LOGIN
========================= */

if (loginForm) {

    const savedUser =
        localStorage.getItem("zeroWasteUser");

    if (savedUser) {

        const user = JSON.parse(savedUser);

        const emailInput =
            loginForm.elements["email"];

        if (emailInput) {
            emailInput.value = user.email;
        }
    }

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            loginForm.elements["email"].value.trim();

        const password =
            loginForm.elements["password"].value;

        const savedUser =
            localStorage.getItem("zeroWasteUser");

        if (!savedUser) {

            alert(
                "No account found. Please create an account first."
            );

            return;
        }

        const user = JSON.parse(savedUser);

        if (
            email === user.email &&
            password === user.password
        ) {

            localStorage.setItem(
                "zeroWasteCurrentUser",
                JSON.stringify(user)
            );

            console.log("USER LOGIN SUCCESSFUL");

            window.location.href = "dashboard.html";

        } else {

            alert("Incorrect email or password.");

        }
    });
}


/* =========================
   PARTNER SIGN UP
========================= */

if (partnerSignupForm) {

    partnerSignupForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const partnerName =
                partnerSignupForm
                    .elements["partnerName"]
                    .value
                    .trim();

            const email =
                partnerSignupForm
                    .elements["email"]
                    .value
                    .trim();

            const password =
                partnerSignupForm
                    .elements["password"]
                    .value;

            if (!partnerName || !email || !password) {

                alert("Please fill in all fields.");

                return;
            }

            const partner = {

                partnerName: partnerName,
                email: email,
                password: password

            };

            localStorage.setItem(
                "zeroWastePartner",
                JSON.stringify(partner)
            );

            alert(
                "Partner account created successfully! Please log in."
            );

            window.location.href =
                "partner-login.html";
        }
    );
}


/* =========================
   PARTNER LOGIN
========================= */

if (partnerLoginForm) {

    const savedPartner =
        localStorage.getItem("zeroWastePartner");

    if (savedPartner) {

        const partner =
            JSON.parse(savedPartner);

        const emailInput =
            partnerLoginForm.elements["email"];

        if (emailInput) {
            emailInput.value = partner.email;
        }
    }

    partnerLoginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const email =
                partnerLoginForm
                    .elements["email"]
                    .value
                    .trim();

            const password =
                partnerLoginForm
                    .elements["password"]
                    .value;

            const savedPartner =
                localStorage.getItem("zeroWastePartner");

            if (!savedPartner) {

                alert(
                    "No partner account found. Please register your organization first."
                );

                return;
            }

            const partner =
                JSON.parse(savedPartner);

            if (
                email === partner.email &&
                password === partner.password
            ) {

                localStorage.setItem(
                    "zeroWasteCurrentPartner",
                    JSON.stringify(partner)
                );

                console.log("PARTNER LOGIN SUCCESSFUL");

               window.location.href =
    "waste-partner.html";

            } else {

                alert(
                    "Incorrect partner email or password."
                );

            }
        }
    );
}


/* =========================
   USER LOGOUT
========================= */

function logoutUser() {

    localStorage.removeItem(
        "zeroWasteCurrentUser"
    );

    window.location.href =
        "login.html";
}


/* =========================
   PARTNER LOGOUT
========================= */

function logoutPartner() {

    localStorage.removeItem(
        "zeroWasteCurrentPartner"
    );

    window.location.href =
        "partner-login.html";
}
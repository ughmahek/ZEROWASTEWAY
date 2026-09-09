// =====================================================
// REPORT TRASH - LOCATION AUTOCOMPLETE + BACKEND
// =====================================================

const reportForm = document.getElementById("trashReportForm");
const locationInput = document.getElementById("locationInput");
const locationSuggestions =
    document.getElementById("locationSuggestions");

// =====================================================
// GEOAPIFY API KEY
// =====================================================
// IMPORTANT:
// Put your existing Geoapify key here LOCALLY.
// DO NOT commit the key to GitHub.
//
// Example:
// const GEOAPIFY_API_KEY = "YOUR_KEY_HERE";

const GEOAPIFY_API_KEY = "YOUR_GEOAPIFY_API_KEY";

// =====================================================
// REMOVE NATIVE DATALIST
// =====================================================

if (locationInput) {
    locationInput.removeAttribute("list");
}

// =====================================================
// CREATE CUSTOM DROPDOWN
// =====================================================

let dropdown = document.getElementById("locationDropdown");

if (!dropdown && locationInput) {

    dropdown = document.createElement("div");

    dropdown.id = "locationDropdown";

    dropdown.style.position = "absolute";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.top = "100%";
    dropdown.style.backgroundColor = "white";
    dropdown.style.border = "1px solid #ddd";
    dropdown.style.borderRadius = "10px";
    dropdown.style.marginTop = "5px";
    dropdown.style.maxHeight = "320px";
    dropdown.style.overflowY = "auto";
    dropdown.style.zIndex = "99999";
    dropdown.style.display = "none";
    dropdown.style.boxShadow =
        "0 5px 15px rgba(0,0,0,0.15)";

    const row = locationInput.parentElement;

    if (row) {
        row.style.position = "relative";
        row.appendChild(dropdown);
    }
}

// =====================================================
// TIMER
// =====================================================

let searchTimer = null;

// =====================================================
// LOCATION INPUT
// =====================================================

if (locationInput) {

    locationInput.addEventListener(
        "input",
        function () {

            const query =
                locationInput.value.trim();

            clearTimeout(searchTimer);

            if (query.length < 2) {
                hideDropdown();
                return;
            }

            searchTimer = setTimeout(
                function () {
                    searchLocations(query);
                },
                350
            );
        }
    );

    locationInput.addEventListener(
        "focus",
        function () {

            const query =
                locationInput.value.trim();

            if (query.length >= 2) {
                searchLocations(query);
            }
        }
    );
}

// =====================================================
// SEARCH GEOAPIFY
// =====================================================

async function searchLocations(query) {

    if (!dropdown) {
        return;
    }

    if (
        !GEOAPIFY_API_KEY ||
        GEOAPIFY_API_KEY === "YOUR_GEOAPIFY_API_KEY"
    ) {
        console.error(
            "Geoapify API key is not configured."
        );
        hideDropdown();
        return;
    }

    try {

        showLoading();

        const url =
            "https://api.geoapify.com/v1/geocode/autocomplete?" +
            "text=" +
            encodeURIComponent(query) +
            "&limit=10" +
            "&format=json" +
            "&filter=countrycode:in" +
            "&apiKey=" +
            GEOAPIFY_API_KEY;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Geoapify API error: " +
                response.status
            );
        }

        const data =
            await response.json();

        displayLocations(
            data.results || []
        );

    } catch (error) {

        console.error(
            "Location search error:",
            error
        );

        hideDropdown();
    }
}

// =====================================================
// DISPLAY LOCATIONS
// =====================================================

function displayLocations(results) {

    if (!dropdown) {
        return;
    }

    dropdown.innerHTML = "";

    if (!results.length) {
        hideDropdown();
        return;
    }

    results.forEach(
        function (place) {

            const item =
                document.createElement("div");

            item.style.padding = "12px 15px";
            item.style.cursor = "pointer";
            item.style.borderBottom =
                "1px solid #eeeeee";
            item.style.backgroundColor =
                "white";

            // ---------------------------------------------
            // PLACE NAME
            // ---------------------------------------------

            const placeName =
                document.createElement("div");

            placeName.style.fontWeight = "600";
            placeName.style.fontSize = "15px";
            placeName.style.color = "#222";

            placeName.textContent =
                place.name ||
                place.address_line1 ||
                "Location";

            // ---------------------------------------------
            // ADDRESS
            // ---------------------------------------------

            const address =
                document.createElement("div");

            address.style.fontSize = "12px";
            address.style.color = "#777";
            address.style.marginTop = "4px";
            address.style.lineHeight = "1.4";

            address.textContent =
                place.formatted ||
                place.address_line2 ||
                "";

            item.appendChild(placeName);
            item.appendChild(address);

            // ---------------------------------------------
            // HOVER
            // ---------------------------------------------

            item.addEventListener(
                "mouseenter",
                function () {
                    item.style.backgroundColor =
                        "#f3f8f4";
                }
            );

            item.addEventListener(
                "mouseleave",
                function () {
                    item.style.backgroundColor =
                        "white";
                }
            );

            // ---------------------------------------------
            // SELECT LOCATION
            // ---------------------------------------------

            item.addEventListener(
                "mousedown",
                function (event) {

                    event.preventDefault();

                    if (locationInput) {

                        locationInput.value =
                            place.formatted ||
                            place.address_line1 ||
                            place.name ||
                            "";
                    }

                    hideDropdown();
                }
            );

            dropdown.appendChild(item);
        }
    );

    dropdown.style.display = "block";
}

// =====================================================
// LOADING
// =====================================================

function showLoading() {

    if (!dropdown) {
        return;
    }

    dropdown.innerHTML = "";

    const loading =
        document.createElement("div");

    loading.style.padding = "14px";
    loading.style.color = "#777";
    loading.style.fontSize = "14px";

    loading.textContent =
        "Searching locations...";

    dropdown.appendChild(loading);

    dropdown.style.display = "block";
}

// =====================================================
// HIDE DROPDOWN
// =====================================================

function hideDropdown() {

    if (!dropdown) {
        return;
    }

    dropdown.innerHTML = "";
    dropdown.style.display = "none";
}

// =====================================================
// CLICK OUTSIDE
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        if (
            locationInput &&
            dropdown &&
            !locationInput.contains(
                event.target
            ) &&
            !dropdown.contains(
                event.target
            )
        ) {

            hideDropdown();
        }
    }
);

// =====================================================
// SUBMIT TRASH REPORT
// =====================================================

if (reportForm) {

    reportForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            try {

                // -----------------------------------------
                // GET LOGGED-IN USER
                // -----------------------------------------

                const currentUser =
                    JSON.parse(
                        localStorage.getItem(
                            "zeroWasteCurrentUser"
                        )
                    );

                if (!currentUser) {

                    alert(
                        "Please log in before submitting a report."
                    );

                    return;
                }

                // -----------------------------------------
                // GET FORM ELEMENTS
                // -----------------------------------------

                const photoInput =
                    reportForm.querySelector(
                        'input[type="file"]'
                    );

                const descriptionInput =
                    reportForm.querySelector(
                        "textarea"
                    );

                if (!photoInput) {

                    alert(
                        "Photo upload field not found."
                    );

                    return;
                }

                if (!descriptionInput) {

                    alert(
                        "Description field not found."
                    );

                    return;
                }

                const photo =
                    photoInput.files[0];

                const location =
                    locationInput
                        ? locationInput.value.trim()
                        : "";

                const description =
                    descriptionInput.value.trim();

                // -----------------------------------------
                // VALIDATE PHOTO
                // -----------------------------------------

                if (!photo) {

                    alert(
                        "Please upload a photo of the trash."
                    );

                    return;
                }

                // -----------------------------------------
                // VALIDATE LOCATION
                // -----------------------------------------

                if (!location) {

                    alert(
                        "Please enter the location."
                    );

                    return;
                }

                // -----------------------------------------
                // VALIDATE DESCRIPTION
                // -----------------------------------------

                if (!description) {

                    alert(
                        "Please describe the problem."
                    );

                    return;
                }

                // -----------------------------------------
                // CREATE FORM DATA
                // -----------------------------------------

                const formData =
                    new FormData();

                formData.append(
                    "user_id",
                    currentUser.email
                );

                formData.append(
                    "before_photo",
                    photo
                );

                formData.append(
                    "location",
                    location
                );

                formData.append(
                    "description",
                    description
                );

                // -----------------------------------------
                // SEND TO FLASK BACKEND
                // -----------------------------------------

                const response =
                    await fetch(
                        "http://127.0.0.1:5000/api/reports",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                const result =
                    await response.json();

                // -----------------------------------------
                // HANDLE ERROR
                // -----------------------------------------

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Failed to submit report."
                    );
                }

                // -----------------------------------------
                // SUCCESS
                // -----------------------------------------

                console.log(
                    "Report created:",
                    result.report
                );

                alert(
                    "Your trash report has been submitted successfully!"
                );

                // -----------------------------------------
                // RESET FORM
                // -----------------------------------------

                reportForm.reset();

                hideDropdown();

                if (locationSuggestions) {

                    locationSuggestions.innerHTML =
                        "";
                }

            } catch (error) {

                console.error(
                    "Report submission error:",
                    error
                );

                alert(
                    "Could not submit the report. Please try again."
                );
            }
        }
    );
}
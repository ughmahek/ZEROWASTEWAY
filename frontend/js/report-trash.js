// =====================================================
// REPORT TRASH - LOCATION AUTOCOMPLETE
// =====================================================

const reportForm = document.getElementById("trashReportForm");
const locationInput = document.getElementById("locationInput");
const locationSuggestions = document.getElementById("locationSuggestions");

// -----------------------------------------------------
// PUT YOUR GEOAPIFY API KEY HERE
// -----------------------------------------------------

const GEOAPIFY_API_KEY = "7410ac3889984d47b420944876641dba";


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
    dropdown.style.boxShadow = "0 5px 15px rgba(0,0,0,0.15)";

    const row = locationInput.parentElement;

    row.style.position = "relative";

    row.appendChild(dropdown);
}


// =====================================================
// TIMER
// =====================================================

let searchTimer = null;


// =====================================================
// LOCATION INPUT
// =====================================================

if (locationInput) {

    locationInput.addEventListener("input", function () {

        const query = locationInput.value.trim();

        clearTimeout(searchTimer);

        if (query.length < 2) {

            hideDropdown();

            return;
        }


        searchTimer = setTimeout(function () {

            searchLocations(query);

        }, 350);

    });


    locationInput.addEventListener("focus", function () {

        const query = locationInput.value.trim();

        if (query.length >= 2) {

            searchLocations(query);

        }

    });

}


// =====================================================
// SEARCH GEOAPIFY
// =====================================================

async function searchLocations(query) {

    try {

        showLoading();


        const url =
            "https://api.geoapify.com/v1/geocode/autocomplete?" +
            "text=" + encodeURIComponent(query) +
            "&limit=10" +
            "&format=json" +
            "&filter=countrycode:in" +
            "&apiKey=" + GEOAPIFY_API_KEY;


        const response = await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Geoapify API error: " + response.status
            );

        }


        const data = await response.json();


        displayLocations(data.results || []);


    } catch (error) {

        console.error("Location search error:", error);

        hideDropdown();

    }

}


// =====================================================
// DISPLAY LOCATIONS
// =====================================================

function displayLocations(results) {

    dropdown.innerHTML = "";


    if (!results.length) {

        hideDropdown();

        return;

    }


    results.forEach(function (place) {

        const item = document.createElement("div");

        item.style.padding = "12px 15px";
        item.style.cursor = "pointer";
        item.style.borderBottom = "1px solid #eeeeee";
        item.style.backgroundColor = "white";


        // ---------------------------------------------
        // PLACE NAME
        // ---------------------------------------------

        const placeName = document.createElement("div");

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

        const address = document.createElement("div");

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

        item.addEventListener("mouseenter", function () {

            item.style.backgroundColor = "#f3f8f4";

        });


        item.addEventListener("mouseleave", function () {

            item.style.backgroundColor = "white";

        });


        // ---------------------------------------------
        // SELECT
        // ---------------------------------------------

        item.addEventListener("mousedown", function (event) {

            event.preventDefault();

            locationInput.value =
                place.formatted ||
                place.address_line1 ||
                place.name ||
                "";


            hideDropdown();

        });


        dropdown.appendChild(item);

    });


    dropdown.style.display = "block";

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    dropdown.innerHTML = "";


    const loading = document.createElement("div");

    loading.style.padding = "14px";
    loading.style.color = "#777";
    loading.style.fontSize = "14px";

    loading.textContent = "Searching locations...";


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

document.addEventListener("click", function (event) {

    if (
        locationInput &&
        dropdown &&
        !locationInput.contains(event.target) &&
        !dropdown.contains(event.target)
    ) {

        hideDropdown();

    }

});


// =====================================================
// FORM SUBMIT
// =====================================================

if (reportForm) {

    reportForm.addEventListener("submit", function (e) {

        e.preventDefault();


        alert("Your trash report has been submitted!");


        reportForm.reset();

        hideDropdown();

    });

}
const reportForm = 
  document.getElementById("trashReportForm"); 

const locationInput =
  document.getElementById("locationInput");

const locationSuggestions =
  document.getElementById("locationSuggestions");


let searchTimer = null;


if (locationInput && locationSuggestions) {

  locationInput.addEventListener("input", () => {

    const query = locationInput.value.trim();

    clearTimeout(searchTimer);

    if (query.length < 2) {
      locationSuggestions.innerHTML = "";
      return;
    }


    searchTimer = setTimeout(async () => {

      try {

        const url =
          "https://nominatim.openstreetmap.org/search?" +
          "format=json" +
          "&addressdetails=1" +
          "&limit=8" +
          "&countrycodes=in" +
          "&q=" +
          encodeURIComponent(query);


        const response = await fetch(url, {
          headers: {
            "Accept": "application/json"
          }
        });


        if (!response.ok) {
          throw new Error("Location search failed");
        }


        const locations = await response.json();


        locationSuggestions.innerHTML = "";


        locations.forEach((location) => {

          const option =
            document.createElement("option");

          option.value =
            location.display_name;

          locationSuggestions.appendChild(option);

        });

      }

      catch (error) {

        console.error(
          "Location suggestion error:",
          error
        );

      }

    }, 400);

  });

}


if (reportForm) { 

  reportForm.addEventListener("submit", (e) => { 

    e.preventDefault(); 

    alert( 
      "Your trash report has been submitted!" 
    ); 

    reportForm.reset(); 

    if (locationSuggestions) {
      locationSuggestions.innerHTML = "";
    }

  }); 

}
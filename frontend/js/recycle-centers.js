document.addEventListener("DOMContentLoaded", function () {

  // =========================================================
  // ZERO WASTE WAY - RECYCLING CENTER MAP
  // FREE VERSION
  // Leaflet + OpenStreetMap + Nominatim + Overpass
  // =========================================================

  const searchInput = document.getElementById("searchCenter");
  const wasteType = document.getElementById("wasteType");
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");

  const searchStatus = document.getElementById("searchStatus");
  const resultsSection = document.getElementById("resultsSection");
  const resultsGrid = document.getElementById("resultsGrid");
  const noResults = document.getElementById("noResults");

  const myLocationBtn = document.getElementById("myLocationBtn");
  const nearestCenter = document.getElementById("nearestCenter");
  const mapElement = document.getElementById("wasteMap");

  // =========================================================
  // CHECK HTML
  // =========================================================

  if (
    !searchInput ||
    !wasteType ||
    !searchBtn ||
    !clearBtn ||
    !searchStatus ||
    !resultsSection ||
    !resultsGrid ||
    !noResults ||
    !myLocationBtn ||
    !nearestCenter
  ) {
    console.error("❌ Required HTML element is missing.");
    return;
  }

  console.log("✅ ZeroWasteWay Recycling JS loaded");

  // =========================================================
  // MAP
  // =========================================================

  let map = null;
  let markerLayer = null;
  let userMarker = null;
  let searchMarker = null;

  if (typeof L !== "undefined" && mapElement) {

    map = L.map("wasteMap").setView(
      [18.5204, 73.8567],
      12
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors"
      }
    ).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    console.log("✅ Leaflet map loaded");

  } else {
    console.error("❌ Leaflet map not found");
  }

  // =========================================================
  // VARIABLES
  // =========================================================

  let currentResults = [];
  let currentSearchLocation = null;
  let currentUserLocation = null;

  // =========================================================
  // CONSTANTS
  // =========================================================

  const PRIMARY_RADIUS = 3000;   // 3 km
  const FALLBACK_RADIUS = 7000;  // maximum 7 km

  // =========================================================
  // INITIAL STATE
  // =========================================================

  resultsSection.style.display = "none";
  noResults.style.display = "none";

  searchStatus.innerHTML = "";

  nearestCenter.innerHTML =
    "Search for a center or area, or use your location to find nearby recycling and waste collection points.";

  // =========================================================
  // SEARCH BUTTON
  // =========================================================

  searchBtn.addEventListener("click", function (event) {

    event.preventDefault();

    performSearch();

  });

  // =========================================================
  // ENTER KEY
  // =========================================================

  searchInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

      event.preventDefault();

      performSearch();

    }

  });

  // =========================================================
  // WASTE FILTER CHANGE
  // =========================================================

  wasteType.addEventListener("change", function () {

    if (currentSearchLocation) {

      displayFilteredResults(
        currentSearchLocation,
        currentResults,
        wasteType.value
      );

    }

  });

  // =========================================================
  // CLEAR
  // =========================================================

  clearBtn.addEventListener("click", function (event) {

    event.preventDefault();

    searchInput.value = "";
    wasteType.value = "all";

    currentResults = [];
    currentSearchLocation = null;

    resultsGrid.innerHTML = "";

    resultsSection.style.display = "none";
    noResults.style.display = "none";

    searchStatus.innerHTML = "";

    nearestCenter.innerHTML =
      "Search for a center or area, or use your location to find nearby recycling and waste collection points.";

    if (markerLayer) {
      markerLayer.clearLayers();
    }

    if (searchMarker && map) {
      map.removeLayer(searchMarker);
      searchMarker = null;
    }

    if (userMarker && map) {
      map.removeLayer(userMarker);
      userMarker = null;
    }

    if (map) {

      map.setView(
        [18.5204, 73.8567],
        12
      );

    }

  });

  // =========================================================
  // MAIN SEARCH
  // =========================================================

  async function performSearch() {

    const searchText = searchInput.value.trim();
    const selectedWaste = wasteType.value;

    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!searchText) {

      searchStatus.innerHTML =
        "⚠️ Please enter an area, center or location.";

      resultsSection.style.display = "none";

      return;

    }

    // ---------------------------------------------------------
    // BUTTON
    // ---------------------------------------------------------

    searchBtn.disabled = true;
    searchBtn.innerHTML = "⏳ Searching...";

    searchStatus.innerHTML =
      "🔎 Finding your location...";

    resultsSection.style.display = "block";
    noResults.style.display = "none";
    resultsGrid.innerHTML = "";

    // ---------------------------------------------------------
    // CLEAR OLD MARKERS
    // ---------------------------------------------------------

    if (markerLayer) {
      markerLayer.clearLayers();
    }

    // ---------------------------------------------------------
    // SEARCH LOCATION
    // ---------------------------------------------------------

    try {

      const location =
        await geocodeLocation(searchText);

      if (!location) {

        searchStatus.innerHTML =
          `❌ Location "${escapeHTML(searchText)}" could not be found.`;

        noResults.style.display = "block";

        resultsGrid.innerHTML = "";

        return;

      }

      currentSearchLocation = location;

      console.log(
        "📍 Search location:",
        location
      );

      // -------------------------------------------------------
      // SHOW SEARCH LOCATION
      // -------------------------------------------------------

      showSearchLocation(location);

      // -------------------------------------------------------
      // SEARCH OSM / OVERPASS
      // -------------------------------------------------------

      searchStatus.innerHTML =
        `🔎 Searching recycling and waste points near ${escapeHTML(location.name)}...`;

      let results =
        await searchOverpass(
          location.lat,
          location.lon,
          PRIMARY_RADIUS
        );

      console.log(
        `📍 Results within 3 km: ${results.length}`
      );

      // -------------------------------------------------------
      // FALLBACK 7 KM
      // -------------------------------------------------------

      if (results.length === 0) {

        searchStatus.innerHTML =
          "🔎 No nearby points in 3 km. Checking up to 7 km...";

        results =
          await searchOverpass(
            location.lat,
            location.lon,
            FALLBACK_RADIUS
          );

        console.log(
          `📍 Results within 7 km: ${results.length}`
        );

      }

      // -------------------------------------------------------
      // CALCULATE DISTANCE
      // -------------------------------------------------------

      results = results.map(function (item) {

        item.distance =
          calculateDistance(
            location.lat,
            location.lon,
            item.lat,
            item.lon
          );

        return item;

      });

      // -------------------------------------------------------
      // STRICT DISTANCE LIMIT
      // -------------------------------------------------------

      results =
        results.filter(function (item) {

          return item.distance <= 7;

        });

      // -------------------------------------------------------
      // REMOVE DUPLICATES
      // -------------------------------------------------------

      results =
        removeDuplicates(results);

      // -------------------------------------------------------
      // SORT
      // -------------------------------------------------------

      results.sort(function (a, b) {

        return a.distance - b.distance;

      });

      // -------------------------------------------------------
      // SAVE ALL CURRENT RESULTS
      // -------------------------------------------------------

      currentResults = results;

      // -------------------------------------------------------
      // DISPLAY FILTERED RESULTS
      // -------------------------------------------------------

      displayFilteredResults(
        location,
        results,
        selectedWaste
      );

    }

    catch (error) {

      console.error(
        "❌ Search failed:",
        error
      );

      searchStatus.innerHTML =
        "❌ Unable to search right now. Please try again.";

      noResults.style.display = "block";

      resultsGrid.innerHTML = "";

    }

    finally {

      searchBtn.disabled = false;
      searchBtn.innerHTML = "🔍 Search";

    }

  }

  // =========================================================
  // GEOCODING
  // =========================================================

  async function geocodeLocation(query) {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(function () {

        controller.abort();

      }, 10000);

    try {

      // First search with Pune context
      const puneQuery =
        `${query}, Pune, Maharashtra, India`;

      let url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({

          q: puneQuery,
          format: "jsonv2",
          addressdetails: "1",
          limit: "5",
          countrycodes: "in"

        });

      let response =
        await fetch(
          url,
          {
            headers: {
              "Accept": "application/json"
            },
            signal: controller.signal
          }
        );

      if (!response.ok) {
        throw new Error(
          "Nominatim HTTP " +
          response.status
        );
      }

      let data =
        await response.json();

      // -------------------------------------------------------
      // IF NOTHING FOUND, TRY DIRECT QUERY
      // -------------------------------------------------------

      if (!data.length) {

        url =
          "https://nominatim.openstreetmap.org/search?" +
          new URLSearchParams({

            q: query,
            format: "jsonv2",
            addressdetails: "1",
            limit: "5",
            countrycodes: "in"

          });

        response =
          await fetch(
            url,
            {
              headers: {
                "Accept": "application/json"
              },
              signal: controller.signal
            }
          );

        if (!response.ok) {
          throw new Error(
            "Nominatim HTTP " +
            response.status
          );
        }

        data =
          await response.json();

      }

      if (!data.length) {

        return null;

      }

      // -------------------------------------------------------
      // PREFER PUNE RESULT
      // -------------------------------------------------------

      let selected =
        data.find(function (item) {

          const text =
            String(item.display_name || "")
              .toLowerCase();

          return (
            text.includes("pune") ||
            text.includes("maharashtra")
          );

        });

      if (!selected) {
        selected = data[0];
      }

      return {

        name:
          getReadableLocationName(selected, query),

        address:
          selected.display_name || query,

        lat:
          parseFloat(selected.lat),

        lon:
          parseFloat(selected.lon)

      };

    }

    finally {

      clearTimeout(timeout);

    }

  }

  // =========================================================
  // READABLE LOCATION NAME
  // =========================================================

  function getReadableLocationName(item, fallback) {

    if (
      item.address &&
      item.address.suburb
    ) {

      return item.address.suburb;

    }

    if (
      item.address &&
      item.address.neighbourhood
    ) {

      return item.address.neighbourhood;

    }

    if (
      item.address &&
      item.address.city_district
    ) {

      return item.address.city_district;

    }

    if (
      item.address &&
      item.address.city
    ) {

      return item.address.city;

    }

    if (item.name) {

      return item.name;

    }

    return fallback;

  }

  // =========================================================
  // OVERPASS SEARCH
  // =========================================================

  async function searchOverpass(
    lat,
    lon,
    radius
  ) {

    const query = `
[out:json][timeout:25];

(
  nwr["amenity"="recycling"](around:${radius},${lat},${lon});
  nwr["amenity"="waste_transfer_station"](around:${radius},${lat},${lon});
  nwr["amenity"="waste_disposal"](around:${radius},${lat},${lon});

  nwr["recycling_type"="centre"](around:${radius},${lat},${lon});
  nwr["recycling_type"="container"](around:${radius},${lat},${lon});

  nwr["shop"="scrap_yard"](around:${radius},${lat},${lon});

  nwr["craft"="recycling"](around:${radius},${lat},${lon});

  nwr["office"="waste_management"](around:${radius},${lat},${lon});
);

out center tags;
`;

    const endpoints = [

      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter"

    ];

    let lastError = null;

    for (
      const endpoint of endpoints
    ) {

      try {

        const controller =
          new AbortController();

        const timeout =
          setTimeout(function () {

            controller.abort();

          }, 30000);

        const response =
          await fetch(
            endpoint,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8"
              },

              body:
                "data=" +
                encodeURIComponent(query),

              signal:
                controller.signal
            }
          );

        clearTimeout(timeout);

        if (!response.ok) {

          throw new Error(
            "Overpass HTTP " +
            response.status
          );

        }

        const data =
          await response.json();

        return parseOverpassResults(
          data.elements || []
        );

      }

      catch (error) {

        lastError = error;

        console.warn(
          "Overpass endpoint failed:",
          endpoint,
          error
        );

      }

    }

    throw lastError ||
      new Error(
        "All Overpass servers failed."
      );

  }

  // =========================================================
  // PARSE OVERPASS
  // =========================================================

  function parseOverpassResults(elements) {

    const results = [];

    elements.forEach(function (element) {

      const tags =
        element.tags || {};

      let lat =
        element.lat;

      let lon =
        element.lon;

      // Ways/relations have center
      if (
        (!lat || !lon) &&
        element.center
      ) {

        lat =
          element.center.lat;

        lon =
          element.center.lon;

      }

      if (
        lat === undefined ||
        lon === undefined
      ) {

        return;

      }

      lat =
        parseFloat(lat);

      lon =
        parseFloat(lon);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {

        return;

      }

      const name =
        getOSMName(tags);

      const address =
        getOSMAddress(tags);

      const materials =
        getMaterials(tags);

      const category =
        getOSMCategory(tags);

      results.push({

        id:
          `${element.type}_${element.id}`,

        name:
          name,

        address:
          address,

        lat:
          lat,

        lon:
          lon,

        category:
          category,

        materials:
          materials,

        rawTags:
          tags

      });

    });

    return results;

  }

  // =========================================================
  // OSM NAME
  // =========================================================

  function getOSMName(tags) {

    const possibleNames = [

      tags.name,
      tags["name:en"],
      tags.operator,
      tags.brand

    ];

    for (
      const value of possibleNames
    ) {

      if (
        value &&
        String(value).trim()
      ) {

        return String(value).trim();

      }

    }

    // Don't use fake-looking "Recycling Center"
    // when no real name exists.

    if (
      tags.amenity ===
      "waste_transfer_station"
    ) {

      return "Waste Transfer Station";

    }

    if (
      tags.amenity ===
      "waste_disposal"
    ) {

      return "Waste Disposal Point";

    }

    if (
      tags.amenity ===
      "recycling"
    ) {

      return "Recycling Point";

    }

    if (
      tags.shop ===
      "scrap_yard"
    ) {

      return "Scrap Yard";

    }

    return "Waste / Recycling Point";

  }

  // =========================================================
  // ADDRESS
  // =========================================================

  function getOSMAddress(tags) {

    const parts = [];

    if (tags["addr:housenumber"]) {
      parts.push(tags["addr:housenumber"]);
    }

    if (tags["addr:street"]) {
      parts.push(tags["addr:street"]);
    }

    if (tags["addr:suburb"]) {
      parts.push(tags["addr:suburb"]);
    }

    if (tags["addr:city"]) {
      parts.push(tags["addr:city"]);
    }

    if (tags["addr:postcode"]) {
      parts.push(tags["addr:postcode"]);
    }

    if (parts.length) {

      return parts.join(", ");

    }

    if (tags.description) {

      return tags.description;

    }

    return "Address not specified on OpenStreetMap";

  }

  // =========================================================
  // CATEGORY
  // =========================================================

  function getOSMCategory(tags) {

    if (
      tags.amenity ===
      "recycling"
    ) {

      return "Recycling";

    }

    if (
      tags.amenity ===
      "waste_transfer_station"
    ) {

      return "Waste Transfer Station";

    }

    if (
      tags.amenity ===
      "waste_disposal"
    ) {

      return "Waste Disposal";

    }

    if (
      tags.recycling_type
    ) {

      return "Recycling " +
        tags.recycling_type;

    }

    if (
      tags.shop ===
      "scrap_yard"
    ) {

      return "Scrap Yard";

    }

    if (
      tags.craft ===
      "recycling"
    ) {

      return "Recycling";

    }

    return "Waste / Recycling";

  }

  // =========================================================
  // MATERIALS
  // =========================================================

  function getMaterials(tags) {

    const materials = [];

    const materialMap = {

      plastic:
        [
          "recycling:plastic",
          "recycling:plastic_packaging"
        ],

      "e-waste":
        [
          "recycling:electrical_items",
          "recycling:electronics",
          "recycling:computer",
          "recycling:small_electrical_appliances"
        ],

      paper:
        [
          "recycling:paper",
          "recycling:cardboard"
        ],

      glass:
        [
          "recycling:glass"
        ],

      metal:
        [
          "recycling:metal",
          "recycling:aluminium",
          "recycling:cans"
        ]

    };

    Object.keys(materialMap).forEach(
      function (type) {

        const keys =
          materialMap[type];

        keys.forEach(function (key) {

          const value =
            tags[key];

          if (
            value &&
            String(value).toLowerCase() !== "no"
          ) {

            materials.push(type);

          }

        });

      }
    );

    // Some OSM objects use generic recycling tag
    if (
      tags.recycling &&
      String(tags.recycling)
    ) {

      const text =
        String(tags.recycling)
          .toLowerCase();

      if (
        text.includes("plastic") &&
        !materials.includes("plastic")
      ) {

        materials.push("plastic");

      }

      if (
        (
          text.includes("electronic") ||
          text.includes("electrical") ||
          text.includes("e-waste")
        ) &&
        !materials.includes("e-waste")
      ) {

        materials.push("e-waste");

      }

      if (
        (
          text.includes("paper") ||
          text.includes("cardboard")
        ) &&
        !materials.includes("paper")
      ) {

        materials.push("paper");

      }

      if (
        text.includes("glass") &&
        !materials.includes("glass")
      ) {

        materials.push("glass");

      }

      if (
        (
          text.includes("metal") ||
          text.includes("aluminium") ||
          text.includes("aluminum")
        ) &&
        !materials.includes("metal")
      ) {

        materials.push("metal");

      }

    }

    return materials;

  }

  // =========================================================
  // FILTER RESULTS
  // =========================================================

  function filterResults(
    results,
    selectedWaste
  ) {

    if (
      selectedWaste === "all"
    ) {

      return results;

    }

    return results.filter(
      function (item) {

        // Exact material is known
        if (
          item.materials &&
          item.materials.includes(
            selectedWaste
          )
        ) {

          return true;

        }

        // Generic recycling/waste point:
        // include it because OSM may not specify material.
        //
        // Important: We do NOT claim that it accepts
        // that material. Card will show "Material not specified".

        const genericCategories = [

          "Recycling",
          "Recycling centre",
          "Recycling centre container",
          "Recycling container",
          "Waste Transfer Station",
          "Waste Disposal",
          "Scrap Yard",
          "Waste / Recycling"

        ];

        return genericCategories.includes(
          item.category
        );

      }
    );

  }

  // =========================================================
  // DISPLAY FILTERED RESULTS
  // =========================================================

  function displayFilteredResults(
    location,
    allResults,
    selectedWaste
  ) {

    const filtered =
      filterResults(
        allResults,
        selectedWaste
      );

    currentResults =
      filtered.slice();

    // -------------------------------------------------------
    // NO RESULTS
    // -------------------------------------------------------

    if (!filtered.length) {

      showNoResults(
        location,
        selectedWaste
      );

      return;

    }

    // -------------------------------------------------------
    // RESULTS
    // -------------------------------------------------------

    showResults(
      filtered,
      location,
      selectedWaste
    );

    showMarkers(
      filtered
    );

    updateNearest(
      filtered,
      location
    );

  }

  // =========================================================
  // SHOW RESULTS
  // =========================================================

  function showResults(
    results,
    location,
    selectedWaste
  ) {

    resultsGrid.innerHTML = "";

    resultsSection.style.display =
      "block";

    noResults.style.display =
      "none";

    searchStatus.innerHTML =
      `✅ Found ${results.length} nearby location(s) near <strong>${escapeHTML(location.name)}</strong>.`;

    results.forEach(
      function (item, index) {

        const card =
          document.createElement("div");

        card.className =
          "center-card";

        const distanceText =
          item.distance !== undefined
            ? `${item.distance.toFixed(1)} km away`
            : "";

        const materialText =
          getMaterialDisplayText(
            item,
            selectedWaste
          );

        card.innerHTML = `

          <h3>
            ♻️ ${escapeHTML(item.name)}
          </h3>

          <p>
            📍 ${escapeHTML(item.address)}
          </p>

          <p class="distance">
            📏 ${escapeHTML(distanceText)}
          </p>

          <p>
            ♻️ ${escapeHTML(materialText)}
          </p>

          <button
            class="btn view-location-btn"
            data-index="${index}"
          >
            🗺️ View Location
          </button>

        `;

        resultsGrid.appendChild(card);

      }
    );

    // -------------------------------------------------------
    // VIEW BUTTONS
    // -------------------------------------------------------

    const buttons =
      document.querySelectorAll(
        ".view-location-btn"
      );

    buttons.forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const index =
              parseInt(
                this.dataset.index
              );

            const location =
              currentResults[index];

            if (location) {

              focusOnLocation(
                location
              );

            }

          }
        );

      }
    );

  }

  // =========================================================
  // MATERIAL DISPLAY
  // =========================================================

  function getMaterialDisplayText(
    item,
    selectedWaste
  ) {

    if (
      item.materials &&
      item.materials.length
    ) {

      return (
        "Materials mapped: " +
        item.materials
          .map(formatWasteName)
          .join(", ")
      );

    }

    if (
      selectedWaste !== "all"
    ) {

      return (
        "Material accepted: Not specified on map data"
      );

    }

    return (
      "Materials: Not specified on map data"
    );

  }

  // =========================================================
  // FORMAT WASTE NAME
  // =========================================================

  function formatWasteName(type) {

    if (
      type === "e-waste"
    ) {

      return "E-Waste";

    }

    return (
      type.charAt(0).toUpperCase() +
      type.slice(1)
    );

  }

  // =========================================================
  // NO RESULTS
  // =========================================================

  function showNoResults(
    location,
    selectedWaste
  ) {

    resultsSection.style.display =
      "block";

    resultsGrid.innerHTML = "";

    noResults.style.display =
      "block";

    if (
      selectedWaste !== "all"
    ) {

      searchStatus.innerHTML =
        `❌ No mapped ${escapeHTML(formatWasteName(selectedWaste))} recycling/waste point found within 7 km of <strong>${escapeHTML(location.name)}</strong>.`;

    } else {

      searchStatus.innerHTML =
        `❌ No mapped recycling or waste point found within 7 km of <strong>${escapeHTML(location.name)}</strong>.`;

    }

    nearestCenter.innerHTML =
      `📍 Search area: <strong>${escapeHTML(location.name)}</strong><br>
       No mapped nearby recycling/waste location was found.`;

    if (markerLayer) {

      markerLayer.clearLayers();

    }

  }

  // =========================================================
  // SHOW SEARCH LOCATION
  // =========================================================

  function showSearchLocation(location) {

    if (!map) {
      return;
    }

    if (searchMarker) {

      map.removeLayer(
        searchMarker
      );

    }

    searchMarker =
      L.marker(
        [
          location.lat,
          location.lon
        ]
      );

    searchMarker
      .bindPopup(
        `
          <strong>📍 Search Location</strong>
          <br>
          ${escapeHTML(location.name)}
        `
      )
      .addTo(map);

    map.setView(
      [
        location.lat,
        location.lon
      ],
      14
    );

  }

  // =========================================================
  // MAP MARKERS
  // =========================================================

  function showMarkers(results) {

    if (
      !map ||
      !markerLayer
    ) {

      return;

    }

    markerLayer.clearLayers();

    const bounds = [];

    results.forEach(
      function (item, index) {

        const marker =
          L.marker(
            [
              item.lat,
              item.lon
            ]
          );

        const distance =
          item.distance !== undefined
            ? `${item.distance.toFixed(1)} km away`
            : "";

        marker.bindPopup(
          `
            <div>

              <strong>
                ♻️ ${escapeHTML(item.name)}
              </strong>

              <br><br>

              ${escapeHTML(item.address)}

              <br><br>

              📏 ${escapeHTML(distance)}

              <br><br>

              <button
                onclick="openDirections(
                  ${item.lat},
                  ${item.lon}
                )"
                style="
                  padding:8px 12px;
                  cursor:pointer;
                "
              >
                🚗 Get Directions
              </button>

            </div>
          `
        );

        marker.addTo(
          markerLayer
        );

        bounds.push(
          [
            item.lat,
            item.lon
          ]
        );

      }
    );

    // Include search point
    if (currentSearchLocation) {

      bounds.push(
        [
          currentSearchLocation.lat,
          currentSearchLocation.lon
        ]
      );

    }

    if (bounds.length === 1) {

      map.setView(
        bounds[0],
        16
      );

    }

    else if (bounds.length > 1) {

      map.fitBounds(
        bounds,
        {
          padding: [
            30,
            30
          ]
        }
      );

    }

  }

  // =========================================================
  // NEAREST CENTER
  // =========================================================

  function updateNearest(
    results,
    location
  ) {

    if (!results.length) {

      nearestCenter.innerHTML =
        "No nearby result.";

      return;

    }

    const nearest =
      results[0];

    nearestCenter.innerHTML =
      `
        🥇 <strong>Nearest Result:</strong>
        ${escapeHTML(nearest.name)}
        — ${nearest.distance.toFixed(1)} km away.
      `;

  }

  // =========================================================
  // VIEW LOCATION
  // =========================================================

  function focusOnLocation(
    location
  ) {

    if (!map) {
      return;
    }

    map.setView(
      [
        location.lat,
        location.lon
      ],
      17
    );

    // Find matching marker
    if (markerLayer) {

      markerLayer.eachLayer(
        function (layer) {

          if (
            layer.getLatLng &&
            Math.abs(
              layer.getLatLng().lat -
              location.lat
            ) < 0.00001 &&
            Math.abs(
              layer.getLatLng().lng -
              location.lon
            ) < 0.00001
          ) {

            layer.openPopup();

          }

        }
      );

    }

  }

  // =========================================================
  // DIRECTIONS
  // =========================================================

  window.openDirections =
    function (
      lat,
      lon
    ) {

      const url =
        "https://www.google.com/maps/dir/?api=1&destination=" +
        encodeURIComponent(
          `${lat},${lon}`
        );

      window.open(
        url,
        "_blank"
      );

    };

  // =========================================================
  // USE MY LOCATION
  // =========================================================

  myLocationBtn.addEventListener(
    "click",
    function () {

      if (
        !navigator.geolocation
      ) {

        nearestCenter.innerHTML =
          "❌ Geolocation is not supported by your browser.";

        return;

      }

      myLocationBtn.disabled =
        true;

      myLocationBtn.innerHTML =
        "⏳ Finding your location...";

      navigator.geolocation.getCurrentPosition(

        async function (position) {

          const lat =
            position.coords.latitude;

          const lon =
            position.coords.longitude;

          currentUserLocation = {
            lat: lat,
            lon: lon
          };

          // ---------------------------------------------------
          // USER MARKER
          // ---------------------------------------------------

          if (map) {

            if (userMarker) {

              map.removeLayer(
                userMarker
              );

            }

            userMarker =
              L.marker(
                [
                  lat,
                  lon
                ]
              );

            userMarker
              .bindPopup(
                "📍 You are here"
              )
              .addTo(map);

            map.setView(
              [
                lat,
                lon
              ],
              14
            );

          }

          // ---------------------------------------------------
          // SEARCH NEAR USER
          // ---------------------------------------------------

          searchStatus.innerHTML =
            "🔎 Finding nearby recycling and waste locations...";

          resultsSection.style.display =
            "block";

          noResults.style.display =
            "none";

          resultsGrid.innerHTML = "";

          try {

            let results =
              await searchOverpass(
                lat,
                lon,
                PRIMARY_RADIUS
              );

            if (!results.length) {

              results =
                await searchOverpass(
                  lat,
                  lon,
                  FALLBACK_RADIUS
                );

            }

            results =
              results.map(
                function (item) {

                  item.distance =
                    calculateDistance(
                      lat,
                      lon,
                      item.lat,
                      item.lon
                    );

                  return item;

                }
              );

            results =
              results.filter(
                function (item) {

                  return item.distance <= 7;

                }
              );

            results =
              removeDuplicates(
                results
              );

            results.sort(
              function (a, b) {

                return (
                  a.distance -
                  b.distance
                );

              }
            );

            currentResults =
              results;

            currentSearchLocation = {
              name: "Your Location",
              address: "Current location",
              lat: lat,
              lon: lon
            };

            displayFilteredResults(
              currentSearchLocation,
              results,
              wasteType.value
            );

          }

          catch (error) {

            console.error(
              "❌ Nearby search failed:",
              error
            );

            searchStatus.innerHTML =
              "❌ Unable to find nearby recycling locations.";

          }

          finally {

            myLocationBtn.disabled =
              false;

            myLocationBtn.innerHTML =
              "📍 Use My Location";

          }

        },

        function (error) {

          console.error(
            "Geolocation error:",
            error
          );

          nearestCenter.innerHTML =
            "❌ Unable to access your location. Please allow location permission and try again.";

          myLocationBtn.disabled =
            false;

          myLocationBtn.innerHTML =
            "📍 Use My Location";

        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }

      );

    }
  );

  // =========================================================
  // REMOVE DUPLICATES
  // =========================================================

  function removeDuplicates(
    results
  ) {

    const seen =
      new Set();

    return results.filter(
      function (item) {

        const key =
          item.lat.toFixed(5) +
          "," +
          item.lon.toFixed(5);

        if (
          seen.has(key)
        ) {

          return false;

        }

        seen.add(key);

        return true;

      }
    );

  }

  // =========================================================
  // DISTANCE
  // =========================================================

  function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    const R = 6371;

    const dLat =
      toRadians(
        lat2 - lat1
      );

    const dLon =
      toRadians(
        lon2 - lon1
      );

    const a =
      Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

      Math.cos(
        toRadians(lat1)
      ) *

      Math.cos(
        toRadians(lat2)
      ) *

      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;

  }

  // =========================================================
  // RADIANS
  // =========================================================

  function toRadians(
    degrees
  ) {

    return (
      degrees *
      Math.PI /
      180
    );

  }

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  function escapeHTML(
    text
  ) {

    return String(
      text ?? ""
    )

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }

  // =========================================================
  // READY
  // =========================================================

  console.log(
    "🌱 ZeroWasteWay FREE Recycling Map ready!"
  );

});
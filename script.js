const API_KEY = "49b717ebb265af1bee591ed16577c009";
let currentUnit = "C";
let currentLatitude = null;
let currentLongitude = null;
let myLatitude = null;
let myLongitude = null;
const API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast";
const GEOCODING_API_URL = "https://api.openweathermap.org/geo/1.0/direct";

const weatherResult = document.getElementById("weatherResult");
const forecastResult = document.getElementById("forecastResult");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationSuggestions = document.getElementById("locationSuggestions");
let suggestionTimer;
//const locationBtn = document.getElementById("locationBtn");

// const locationSearch = document.getElementById("locationSearch");
const mapLocationSuggestions = document.getElementById("mapLocationSuggestions");

searchBtn.addEventListener("click", async function () {

    const cityName = cityInput.value.trim();

    if (cityName === "") {
        weatherResult.innerHTML = `
            <p>❌ Please enter a city name.</p>
        `;
        forecastResult.innerHTML = "";
        return;
    }

    weatherResult.innerHTML = `
        <p>⏳ Loading weather...</p>
    `;

    forecastResult.innerHTML = "";

    try {

        // =====================================
        // 1. Find location coordinates
        // =====================================

        const geoURL =
            `${GEOCODING_API_URL}?q=${encodeURIComponent(cityName)}&limit=5&appid=${API_KEY}`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Location search failed");
        }

        const locations = await geoResponse.json();

        console.log("Geocoding Results:", locations);
        console.log("SEARCHED CITY:", cityName);
console.log("FIRST LOCATION:", locations[0]);

        if (!locations || locations.length === 0) {
            throw new Error("Location not found");
        }

        // First matching location
       const location = locations.find(
    item => item.name.toLowerCase() === cityName.toLowerCase()
) || locations[0];

const latitude = location.lat;
const longitude = location.lon;
currentLatitude = latitude;
currentLongitude = longitude;

        console.log("Selected Location:", location);
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);


        // =====================================
        // 2. Move map to selected location
        // =====================================

        map.setView([latitude, longitude], 12);

        mapMarker.setLatLng([latitude, longitude]);

        mapMarker
            .bindPopup(`
                <strong>${location.name}</strong><br>
                ${location.state || ""}<br>
                ${getCountryName(location.country)}
            `)
            .openPopup();


        // =====================================
        // 3. Get weather using coordinates
        // =====================================

        const weatherURL =
            `${API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

        const response = await fetch(weatherURL);

        if (!response.ok) {
            throw new Error("Weather not available");
        }

        const data = await response.json();
        const aqi = await getAQI(latitude, longitude);
        // Calculate Daylight Duration
const daylightSeconds = data.sys.sunset - data.sys.sunrise;

const daylightHours = Math.floor(daylightSeconds / 3600);

const daylightMinutes = Math.floor(
    (daylightSeconds % 3600) / 60
);
const daylightDuration =
    `${daylightHours}h ${daylightMinutes}m`;

        console.log("Weather Data:", data);
        console.log("Weather Location:", data.name);

        // =====================================
        // 4. Display weather
        // =====================================

        weatherResult.innerHTML = `
            <div id="weatherMain">

               <h2>${location.name}</h2>

                <p>
                    📍 ${location.name},
                    ${location.state || ""},
                    ${getCountryName(location.country)}
                </p>

                <p id="localTime">
                    🕐 Local Time: --:--:--
                </p>

                <img
                    src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png"
                >

                <h3>
                    ${convertTemperature(data.main.temp).toFixed(1)}°${currentUnit}
                </h3>

                <p>
                    ${data.weather[0].description}
                </p>

            </div>

            <div class="weather-details">

                <div class="detail-card">
                    <h4>Feels Like</h4>
                    <p>
                        ${convertTemperature(data.main.feels_like).toFixed(1)}°${currentUnit}
                    </p>
                </div>

                <div class="detail-card">
                    <h4>Humidity</h4>
                    <p>
                        ${data.main.humidity}%
                    </p>
                </div>

                <div class="detail-card">
                    <h4>Wind Speed</h4>
                    <p>
                        ${data.wind.speed} m/s
                    </p>
                </div>
  <div class="detail-card">

    <h4>🌫️ AQI</h4>

    <p>${aqi !== null ? aqi : "N/A"}</p>

</div>


<div class="detail-card">

    <h4>🌅 Sunrise</h4>

    <p>
        ${new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })}
    </p>

</div>


<!-- Sunset -->

<div class="detail-card">

    <h4>🌇 Sunset</h4>

    <p>
        ${new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })}
    </p>
</div>
<!-- Daylight Duration -->
<div class="detail-card">
    <h4>☀️ Daylight Duration</h4>
    <p>${daylightDuration}</p>
</div>




<!-- Moon Phase -->

<div class="detail-card moon-phase-card">

    <h4>🌙 Moon Phase</h4>

    <div class="moon-phase-display">

        <div
            id="weatherMoon"
            class="weather-moon"
        ></div>

        <div class="moon-phase-info">

            <strong id="weatherMoonPhase">
                Loading...
            </strong>

            <span id="weatherMoonPercentage">
                --% illuminated
            </span>

        </div>

    </div>

</div>


</div>

`;
                // Update Moon Phase in Weather Card
        calculateMoonPhase();


        // =====================================
        // 5. Existing weather features
        // =====================================

        changeWeatherBackground(data.weather[0].main);

        updateDayNight(data);

        updateMoon(data);

        updateLocalTime(data.timezone);

        saveSearchHistory(cityName);

        getForecast(data.name);


    } catch (error) {

        console.error("Weather Search Error:", error);

        weatherResult.innerHTML = `
            <p>❌ ${error.message}</p>
        `;

        forecastResult.innerHTML = "";

    }

});

cityInput.addEventListener("input", function () {

    const query = cityInput.value.trim();

    clearTimeout(suggestionTimer);

    if (query.length < 2) {
        locationSuggestions.innerHTML = "";
        return;
    }

    suggestionTimer = setTimeout(async function () {

        try {

            const url =
                `${GEOCODING_API_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Location search failed");
            }

            const locations = await response.json();

            locationSuggestions.innerHTML = "";

            locations.forEach(function (location) {

                const suggestion = document.createElement("div");

                suggestion.className = "location-suggestion";

                suggestion.innerHTML = `
                    <strong>${location.name}</strong>
                    ${location.state ? `, ${location.state}` : ""}
                    ${location.country ? `, ${getCountryName(location.country)}` : ""}
                `;

                suggestion.addEventListener("click", function () {

                    cityInput.value = location.name;

                    locationSuggestions.innerHTML = "";

                    searchBtn.click();

                });

                locationSuggestions.appendChild(suggestion);

            });

        } catch (error) {

            console.error("Suggestion Error:", error);

            locationSuggestions.innerHTML = "";

        }

    }, 400);

});

// Search when Enter key is pressed
cityInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        event.preventDefault();

        clearTimeout(suggestionTimer);
        locationSuggestions.innerHTML = "";

        searchBtn.click();
    }

});


// ================= MAP LOCATION SEARCH =================

// const locationSearch = document.getElementById("locationSearch");
// const mapLocationSuggestions = document.getElementById("mapLocationSuggestions");

let mapSearchTimeout;


// ================= MAP SEARCH INPUT =================

// locationSearch.addEventListener("input", function () {

//     clearTimeout(mapSearchTimeout);

//     const query = locationSearch.value.trim();

//     if (query.length < 2) {
//         mapLocationSuggestions.innerHTML = "";
//         return;
//     }

//     mapSearchTimeout = setTimeout(function () {

//         showMapLocationSuggestions(query);

//     }, 400);

// });


// ================= MAP SEARCH ENTER =================

// locationSearch.addEventListener("keydown", function (event) {

//     if (event.key === "Enter") {

//         event.preventDefault();

//         const query = locationSearch.value.trim();

//         if (query !== "") {

//             searchMapLocation(query);

//         }

//     }

// });


// ================= SHOW LOCATION SUGGESTIONS =================

async function showMapLocationSuggestions(query) {

    try {

        const response = await fetch(
            `${GEOCODING_API_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error("Location search failed");
        }

        const locations = await response.json();

        mapLocationSuggestions.innerHTML = "";

        if (locations.length === 0) {

            mapLocationSuggestions.innerHTML = `
                <div class="location-suggestion">
                    ❌ Location not found
                </div>
            `;

            return;
        }


        locations.forEach(function (location) {

            const suggestion = document.createElement("div");

            suggestion.className = "location-suggestion";


            const locationParts = [];

            if (location.name) {
                locationParts.push(location.name);
            }

            if (location.state) {
                locationParts.push(location.state);
            }

            if (location.country) {
                locationParts.push(location.country);
            }


            suggestion.textContent =
                locationParts.join(", ");


            suggestion.addEventListener("click", function () {

                selectMapLocation(location);

            });


            mapLocationSuggestions.appendChild(suggestion);

        });

    } catch (error) {

        console.error("Map location search error:", error);

    }

}


// ================= SELECT MAP LOCATION =================

async function selectMapLocation(location) {

    const latitude = location.lat;
    const longitude = location.lon;


    currentLatitude = latitude;
    currentLongitude = longitude;


    // Show complete location name in search box

    const locationParts = [];

    if (location.name) {
        locationParts.push(location.name);
    }

    if (location.state) {
        locationParts.push(location.state);
    }

    if (location.country) {
        locationParts.push(location.country);
    }

    // Update the main search box with the selected location
cityInput.value = locationParts.join(", ");


    // Remove suggestions

    mapLocationSuggestions.innerHTML = "";


    // Move map

    map.setView(
        [latitude, longitude],
        13
    );


    // Move marker

    mapMarker.setLatLng([
        latitude,
        longitude
    ]);


    // Popup

    mapMarker
        .bindPopup(`
            <strong>${location.name || "Selected Location"}</strong>
            ${location.state ? `<br>${location.state}` : ""}
            ${location.country ? `<br>${location.country}` : ""}
        `)
        .openPopup();


    // Get weather

    await getWeatherByLocation(
        latitude,
        longitude
    );

}


// // ================= SEARCH LOCATION BY ENTER =================
async function getForecast(cityName) {
try {
const url = `${FORECAST_API_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`;


    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Forecast data unavailable");
    }

    const data = await response.json();

    const dailyForecast = {};

    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        if (!dailyForecast[date]) {
            dailyForecast[date] = {
                display: item,
                rainChance: item.pop || 0,
                minTemp: item.main.temp_min,
                maxTemp: item.main.temp_max
            };
        } else {
            const day = dailyForecast[date];

            day.rainChance = Math.max(
                day.rainChance,
                item.pop || 0
            );

            day.minTemp = Math.min(
                day.minTemp,
                item.main.temp_min
            );

            day.maxTemp = Math.max(
                day.maxTemp,
                item.main.temp_max
            );

            if (item.dt_txt.includes("12:00:00")) {
                day.display = item;
            }
        }
    });

    const forecastDays = Object.entries(dailyForecast)
        .slice(0, 5)
        .map(([date, details]) => ({
            date,
            ...details
        }));
        // Get daily sunrise, sunset, moon phase and daylight duration
console.log("Forecast days before sunrise data:", forecastDays);

await Promise.all(
forecastDays.map(async day => {

    const sunTimes = await getSunTimes(
        data.city.coord.lat,
        data.city.coord.lon,
        day.date
    );

    day.moonPhase = getMoonPhaseForDate(day.date);

    if (sunTimes) {

        day.sunrise = formatLocalTime(
            sunTimes.sunrise,
            data.city.timezone
        );

        day.sunset = formatLocalTime(
            sunTimes.sunset,
            data.city.timezone
        );

        const sunriseTime = new Date(
            sunTimes.sunrise
        ).getTime();

        const sunsetTime = new Date(
            sunTimes.sunset
        ).getTime();

        const daylightSeconds =
            Math.max(0, (sunsetTime - sunriseTime) / 1000);

        const daylightHours = Math.floor(
            daylightSeconds / 3600
        );

        const daylightMinutes = Math.floor(
            (daylightSeconds % 3600) / 60
        );

        day.daylightDuration =
            `${daylightHours}h ${daylightMinutes}m`;

    } else {

        day.sunrise = "Unavailable";
        day.sunset = "Unavailable";
        day.daylightDuration = "Unavailable";

    }
})


);
console.log("Sunrise data:", forecastDays.map(day => ({
    date: day.date,
    sunrise: day.sunrise,
    sunset: day.sunset,
    moonPhase: day.moonPhase,
    daylightDuration: day.daylightDuration
})));

    if (forecastDays.length === 0) {
        forecastResult.innerHTML =
            "<p>No forecast data available.</p>";
        return;
    }

    const maxRainChance = Math.max(
        ...forecastDays.map(day => day.rainChance)
    );

    document.body.classList.toggle(
        "rain-possible",
        maxRainChance >= 0.5
    );

    let forecastHTML = `
        <h2>5-Day Forecast</h2>
        <div class="forecast-grid">
    `;

    forecastDays.forEach(day => {
        const item = day.display;
        const rainPercentage = Math.round(
            day.rainChance * 100
        );

        let rainStatus = "Low Chance";

        if (rainPercentage >= 70) {
            rainStatus = "High Chance 🌧️";
        } else if (rainPercentage >= 40) {
            rainStatus = "Moderate Chance 🌦️";
        }

        const formattedDate = new Date(
            `${day.date}T12:00:00`
        ).toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "short"
        });

        forecastHTML += `
            <div class="forecast-card">

                <h3>${formattedDate}</h3>

                <img
                    src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png"
                    alt="${item.weather[0].description}"
                >

                <h3>
                    ${convertTemperature(item.main.temp).toFixed(1)}°${currentUnit}
                </h3>

                <p>${item.weather[0].description}</p>

                <p>🌧️ Rain: ${rainPercentage}%</p>

                <button
                    type="button"
                    class="forecast-toggle"
                    aria-expanded="false"
                >
                    View Details +
                </button>

                <div class="forecast-details" hidden>
                    <h4>Weather Details</h4>

                    <p>📅 Date: ${day.date}</p>

                    <p>
                        🌡️ Temperature:
                        ${convertTemperature(item.main.temp).toFixed(1)}°${currentUnit}
                    </p>

                    <p>
                        🤔 Feels Like:
                        ${convertTemperature(item.main.feels_like).toFixed(1)}°${currentUnit}
                    </p>

                    <p>
                        🔺 Maximum:
                        ${convertTemperature(day.maxTemp).toFixed(1)}°${currentUnit}
                    </p>

                    <p>
                        🔻 Minimum:
                        ${convertTemperature(day.minTemp).toFixed(1)}°${currentUnit}
                    </p>

                    <p>💧 Humidity: ${item.main.humidity}%</p>

                    <p>🌧️ Rain Probability: ${rainPercentage}%</p>

                    <p>📊 ${rainStatus}</p>

                    <div class="rain-progress">
                        <div
                            class="rain-progress-fill"
                            style="width: ${rainPercentage}%">
                        </div>
                    </div>

                    <p>💨 Wind: ${item.wind.speed} m/s</p>

                    <p>🔽 Pressure: ${item.main.pressure} hPa</p>
                   
<p>🌅 Sunrise: ${day.sunrise || "Unavailable"}</p>

<p>🌇 Sunset: ${day.sunset || "Unavailable"}</p>

<p>🌙 Moon Phase: ${day.moonPhase || "Unavailable"}</p>

<p>☀️ Daylight Duration: ${day.daylightDuration || "Unavailable"}</p>


                </div>

            </div>
        `;
    });

    forecastHTML += `</div>`;

    forecastResult.innerHTML = forecastHTML;
    forecastResult.querySelectorAll(".forecast-details").forEach(details => {
    details.style.setProperty("color", "inherit", "important");
    details.style.setProperty("visibility", "visible", "important");
    details.style.setProperty("opacity", "1", "important");

    details.querySelectorAll("p").forEach(paragraph => {
        paragraph.style.setProperty("display", "block", "important");
        paragraph.style.setProperty("visibility", "visible", "important");
        paragraph.style.setProperty("opacity", "1", "important");
    });
});
    console.log(
    "Rendered Sunrise Details:",
    forecastResult.querySelector(".forecast-details")?.innerHTML
);

    const cards = forecastResult.querySelectorAll(
        ".forecast-card"
    );

    cards.forEach(card => {
        const button = card.querySelector(".forecast-toggle");
        const details = card.querySelector(".forecast-details");

        button.addEventListener("click", () => {
            const shouldOpen = details.hidden;

            cards.forEach(otherCard => {
                otherCard.classList.remove("expanded");

                otherCard.querySelector(
                    ".forecast-details"
                ).hidden = true;

                const otherButton = otherCard.querySelector(
                    ".forecast-toggle"
                );

                otherButton.textContent = "View Details +";
                otherButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });

            if (shouldOpen) {
                card.classList.add("expanded");
                details.hidden = false;
                details.style.display = "block";

                button.textContent = "Close Details −";
                button.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }



        });
    });

} catch (error) {
    console.error("Forecast Error:", error);

    forecastResult.innerHTML =
        "<p>Unable to load the weather forecast.</p>";
}
}

// Get Sunrise and Sunset for a particular date
async function getSunTimes(latitude, longitude, date) {
    try {
        const url =
            `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${date}&formatted=0`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to fetch sunrise and sunset");
        }

        const data = await response.json();

        if (data.status !== "OK") {
            throw new Error("Sunrise-sunset data unavailable");
        }

        return {
            sunrise: data.results.sunrise,
            sunset: data.results.sunset
        };

    } catch (error) {
        console.error("Sun Times Error:", error);
        return null;
    }
}


// Format time using the city's timezone offset
function formatLocalTime(utcTime, timezoneOffset) {
    const date = new Date(
        new Date(utcTime).getTime() + timezoneOffset * 1000
    );

    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    });
}


// Calculate Moon Phase for a particular date
function getMoonPhaseForDate(dateString) {
    const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
    const synodicMonth = 29.530588853;

    const targetDate = new Date(
        `${dateString}T12:00:00Z`
    ).getTime();

    const ageInDays =
        (targetDate - knownNewMoon) / 86400000;

    const phase =
        ((ageInDays % synodicMonth) + synodicMonth)
        % synodicMonth;

    if (phase < 1.85) return "🌑 New Moon";
    if (phase < 7.38) return "🌒 Waxing Crescent";
    if (phase < 9.23) return "🌓 First Quarter";
    if (phase < 14.77) return "🌔 Waxing Gibbous";
    if (phase < 16.61) return "🌕 Full Moon";
    if (phase < 22.15) return "🌖 Waning Gibbous";
    if (phase < 24.00) return "🌗 Last Quarter";

    return "🌘 Waning Crescent";
}
async function getWeatherByLocation(latitude, longitude) {
    try {
        currentLatitude = latitude;
        currentLongitude = longitude;

        const locationInfo = await getLocationName(latitude, longitude);
        console.log("Actual Location:", locationInfo);

        const url =
            `${API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather not available");
        }

        const data = await response.json();

        const aqi = await getAQI(latitude, longitude);
        // Calculate Daylight Duration
const daylightSeconds = data.sys.sunset - data.sys.sunrise;

const daylightHours = Math.floor(daylightSeconds / 3600);

const daylightMinutes = Math.floor(
    (daylightSeconds % 3600) / 60
);
const daylightDuration =
    `${daylightHours}h ${daylightMinutes}m`;

        console.log("Weather Data:", data);
        console.log("Weather Location:", data.name);
        console.log("AQI:", aqi);

        let fullLocation = data.name;

        if (locationInfo) {
            const locationParts = [];

            if (locationInfo.name) {
                locationParts.push(locationInfo.name);
            }

            if (locationInfo.state) {
                locationParts.push(locationInfo.state);
            }

            if (locationInfo.country) {
                locationParts.push(getCountryName(locationInfo.country));
            }

            fullLocation = locationParts.join(", ");
        }

        weatherResult.innerHTML = `
            <div id="weatherMain">

                <h2>${fullLocation}</h2>

                <p id="localTime">
                    🕐 Local Time: --:--:--
                </p>

                <img 
                    src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png"
                    alt="Weather"
                >

                <h3>
                    ${convertTemperature(data.main.temp).toFixed(1)}°${currentUnit}
                </h3>

                <p>
                    ${data.weather[0].description}
                </p>

            </div>

            <div class="weather-details">

                <!-- Feels Like -->
                <div class="detail-card">
                    <h4>Feels Like</h4>
                    <p>
                        ${convertTemperature(data.main.feels_like).toFixed(1)}°${currentUnit}
                    </p>
                </div>

                <!-- Humidity -->
                <div class="detail-card">
                    <h4>Humidity</h4>
                    <p>${data.main.humidity}%</p>
                </div>

                <!-- Wind Speed -->
                <div class="detail-card">
                    <h4>Wind Speed</h4>
                    <p>${data.wind.speed} m/s</p>
                </div>

                <!-- AQI -->
                <div class="detail-card">
                    <h4>🌫️ AQI</h4>
                    <p>${aqi !== null ? aqi : "N/A"}</p>
                </div>

                <!-- Sunrise -->
                <div class="detail-card">
                    <h4>🌅 Sunrise</h4>
                    <p>
                        ${new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                        })}
                    </p>
                </div>

                <!-- Sunset -->
                <div class="detail-card">
                    <h4>🌇 Sunset</h4>
                    <p>
                        ${new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                        })}
                    </p>
                </div>
                <!-- Daylight Duration -->
<div class="detail-card">
    <h4>☀️ Daylight Duration</h4>
    <p>${daylightDuration}</p>
</div>

                <!-- Moon Phase -->
                <div class="detail-card moon-phase-card">

                    <h4>🌙 Moon Phase</h4>

                    <div class="moon-phase-display">

                        <div 
                            id="weatherMoon" 
                            class="weather-moon">
                        </div>

                        <div class="moon-phase-info">

                            <strong id="weatherMoonPhase">
                                Loading...
                            </strong>

                            <span id="weatherMoonPercentage">
                                --% illuminated
                            </span>

                        </div>

                    </div>

                </div>

            </div>
        `;

        // ⭐ IMPORTANT
        // Moon Phase calculation
        calculateMoonPhase();

        // Weather background
        changeWeatherBackground(data.weather[0].main);

        // Day / Night
        updateDayNight(data);

        // Background Moon
        updateMoon(data);

        // Local time
        updateLocalTime(data.timezone);

        // Forecast
        getForecast(data.name);

    } catch (error) {

        console.error("Weather Location Error:", error);

        weatherResult.innerHTML = `
            <p>❌ Weather could not be loaded.</p>
        `;

        forecastResult.innerHTML = "";
    }
}
// ================= AQI =================

async function getAQI(latitude, longitude) {

    try {

        const url =
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("AQI data not available");
        }

        const data = await response.json();

        const aqi = data.list[0].main.aqi;
        console.log("AQI Full Data:", data);
console.log("AQI Value:", aqi);

        console.log("AQI:", aqi);

        return aqi;

    } catch (error) {

        console.error("AQI Error:", error);

        return null;

    }

}



fahrenheitBtn.addEventListener("click", function () {

    if (currentUnit === "F") {
        return;
    }

    currentUnit = "F";

    if (currentLatitude !== null && currentLongitude !== null) {
    getWeatherByLocation(currentLatitude, currentLongitude);
} else if (cityInput.value.trim() !== "") {
    searchBtn.click();
}

});

// ========================================
// Celsius Button Event Listener
// Purpose: Switch temperature back to Celsius
// ========================================
celsiusBtn.addEventListener("click", function () {

    // Stop if Celsius is already selected
    if (currentUnit === "C") {
        return;
    }

    // Change the temperature unit to Celsius
    currentUnit = "C";

    // Refresh weather data for the current location
    if (currentLatitude !== null && currentLongitude !== null) {
        getWeatherByLocation(currentLatitude, currentLongitude);
    } else if (cityInput.value.trim() !== "") {
        searchBtn.click();
    }

});


function convertTemperature(tempCelsius) {

    if (currentUnit === "F") {
        return (tempCelsius * 9 / 5) + 32;
    }

    return tempCelsius;
}
function changeWeatherBackground(weatherCondition) {

    document.body.classList.remove(
        "clear",
        "clouds",
        "rain",
        "thunderstorm",
        "snow",
        "mist"
        
    );

    const condition = weatherCondition.toLowerCase();

    if (condition === "clear") {

        document.body.classList.add("clear");

    }

    else if (condition === "clouds") {

        document.body.classList.add("clouds");

    }

    else if (condition === "rain" || condition === "drizzle") {

        document.body.classList.add("rain");

    }

    else if (condition === "thunderstorm") {

        document.body.classList.add("thunderstorm");

    }

    else if (condition === "snow") {

        document.body.classList.add("snow");

    }

    else {

        document.body.classList.add("mist");

    }
}

function saveSearchHistory(cityName) {

    let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

    history = history.filter(city => city.toLowerCase() !== cityName.toLowerCase());

    history.unshift(cityName);

    history = history.slice(0, 5);

    localStorage.setItem("weatherHistory", JSON.stringify(history));

    displaySearchHistory();
}


function displaySearchHistory() {

    const historyResult = document.getElementById("historyResult");

    let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

    if (history.length === 0) {
        historyResult.innerHTML = "";
        return;
    }

    let historyHTML = `
    <h2 class="history-title">Search History</h2>
    <button onclick="clearSearchHistory()">🗑️ Clear History</button>
`;

    history.forEach(city => {

        historyHTML += `
            <span class="history-city" onclick="searchHistoryCity('${city}')">
                ${city}
            </span>
        `;

    });

    historyResult.innerHTML = historyHTML;
}


function searchHistoryCity(city) {

    cityInput.value = city;

    searchBtn.click();
}


displaySearchHistory();
function clearSearchHistory() {

    localStorage.removeItem("weatherHistory");

    displaySearchHistory();

}
const themeBtn = document.getElementById("themeBtn");

if (localStorage.getItem("theme") === "dark") {

    document.body.classList.add("dark-mode");

    themeBtn.textContent = "☀️ Light Mode";

}

themeBtn.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {

        themeBtn.textContent = "☀️ Light Mode";

        localStorage.setItem("theme", "dark");

    } else {

        themeBtn.textContent = "🌙 Dark Mode";

        localStorage.setItem("theme", "light");

    }

});
function createRain() {

    const rain = document.getElementById("rain");

    rain.innerHTML = "";

    for (let i = 0; i < 80; i++) {

        const drop = document.createElement("div");

        drop.classList.add("raindrop");

        drop.style.left = Math.random() * 100 + "%";
        drop.style.top = Math.random() * 100 + "%";

        rain.appendChild(drop);
    }
}
createRain();
function createStars() {

    const stars = document.getElementById("stars");

    stars.innerHTML = "";

    for (let i = 0; i < 100; i++) {

        const star = document.createElement("div");

        star.classList.add("star");

        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";

        star.style.animationDelay =
            Math.random() * 2 + "s";

        stars.appendChild(star);
    }
}

createStars();
function updateDayNight(data) {

    const currentTime = Date.now() / 1000;

    const sunrise = data.sys.sunrise;
    const sunset = data.sys.sunset;

    if (currentTime >= sunrise && currentTime < sunset) {

        document.body.classList.add("day");
        document.body.classList.remove("night");

    } else {

        document.body.classList.add("night");
        document.body.classList.remove("day");

    }
}
function updateLocalTime(timezoneOffset) {

    const timeElement = document.getElementById("localTime");

    if (!timeElement) {
        return;
    }

    function showTime() {

        const utcTime = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);

        const locationTime = new Date(utcTime + (timezoneOffset * 1000));

        timeElement.textContent =
            "🕐 Local Time: " +
            locationTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
    }

    showTime();

    setInterval(showTime, 1000);
}
function getCountryName(countryCode) {

    const regionNames = new Intl.DisplayNames(
        ["en"],
        { type: "region" }
    );

    return regionNames.of(countryCode);
}
// ================= MOON PHASE =================

// ================= MOON PHASE CALCULATION =================

function calculateMoonPhase() {

    const now = new Date();

    const knownNewMoon =
        new Date("2000-01-06T18:14:00Z");

    const lunarCycle =
        29.530588853;

    const diffTime =
        now.getTime() -
        knownNewMoon.getTime();

    const days =
        diffTime /
        (1000 * 60 * 60 * 24);

    // Moon age
    const moonAge =
        ((days % lunarCycle) + lunarCycle) %
        lunarCycle;

    // Illumination percentage
    const illumination =
        (1 -
            Math.cos(
                (2 * Math.PI * moonAge) /
                lunarCycle
            )
        ) / 2;

    const percentage =
        Math.round(
            illumination * 100
        );

    console.log(
        "Moon Age:",
        moonAge.toFixed(2),
        "days"
    );

    console.log(
        "Moon Illumination:",
        percentage + "%"
    );

    // =====================================
    // Moon Phase Name
    // =====================================

    let phaseName;

    if (moonAge < 1.85) {

        phaseName = "🌑 New Moon";

    } else if (moonAge < 7.38) {

        phaseName = "🌒 Waxing Crescent";

    } else if (moonAge < 9.23) {

        phaseName = "🌓 First Quarter";

    } else if (moonAge < 14.77) {

        phaseName = "🌔 Waxing Gibbous";

    } else if (moonAge < 16.61) {

        phaseName = "🌕 Full Moon";

    } else if (moonAge < 22.15) {

        phaseName = "🌖 Waning Gibbous";

    } else if (moonAge < 23.99) {

        phaseName = "🌗 Last Quarter";

    } else {

        phaseName = "🌘 Waning Crescent";
    }

    // =====================================
    // Weather Card Moon
    // =====================================

    const moon =
        document.getElementById("weatherMoon");

    const phaseElement =
        document.getElementById("weatherMoonPhase");

    const percentageElement =
        document.getElementById(
            "weatherMoonPercentage"
        );

    if (!moon) return;

    // Display text
    if (phaseElement) {

        phaseElement.textContent =
            phaseName;
    }

    if (percentageElement) {

        percentageElement.textContent =
            percentage +
            "% illuminated";
    }

    // Store values
    moon.dataset.age =
        moonAge;

    moon.dataset.illumination =
        percentage;

    moon.dataset.phase =
        phaseName;

    // Update realistic moon
    updateMoonVisual(
        moonAge,
        percentage
    );
}
// ================= REALISTIC MOON VISUAL =================

function updateMoonVisual(moonAge, percentage) {

    const moon = document.getElementById("weatherMoon");

    if (!moon) return;

    const lunarCycle = 29.530588853;

    // Calculate illumination between 0 and 1
    const illumination = Math.max(
        0,
        Math.min(1, percentage / 100)
    );

    // Determine whether the moon is waxing or waning
    const waxing = moonAge < lunarCycle / 2;

    /*
       Calculate the moon-shadow displacement.

       0% illumination   = completely dark
       50% illumination  = half illuminated
       100% illumination = completely illuminated
    */

    let low = 0;
    let high = 1;
    let distance = 0;

    for (let i = 0; i < 40; i++) {

        distance = (low + high) / 2;

        const overlap =
            (2 / Math.PI) *
            (
                Math.acos(distance) -
                distance *
                Math.sqrt(
                    Math.max(0, 1 - distance * distance)
                )
            );

        const calculatedIllumination = 1 - overlap;

        if (calculatedIllumination < illumination) {

            low = distance;

        } else {

            high = distance;
        }
    }

    // Position the dark shadow
    const shadowPosition = waxing
        ? -distance * 100
        : distance * 100;

    moon.style.setProperty(
        "--shadow-x",
        shadowPosition + "%"
    );

    moon.style.setProperty(
        "--moon-illumination",
        percentage + "%"
    );

    moon.style.setProperty(
        "--moon-age",
        moonAge
    );

    moon.classList.toggle(
        "waxing",
        waxing
    );

    moon.classList.toggle(
        "waning",
        !waxing
    );

    moon.title = `${percentage}% illuminated`;
}
// Run Moon Phase
calculateMoonPhase();


// calculateMoonPhase();
// ================= MOON VISIBILITY =================

function updateMoon(data) {

    const moon =
        document.getElementById("moon");

    if (!moon) return;

    const latitude =
        data.coord.lat;

    const longitude =
        data.coord.lon;

    const now =
        new Date();

    const timezoneOffset =
        data.timezone;

    const utcTime =
        now.getTime() +
        (now.getTimezoneOffset() * 60000);

    const localTime =
        new Date(
            utcTime +
            (timezoneOffset * 1000)
        );

    console.log(
        "Moon Location:",
        latitude,
        longitude
    );

    console.log(
        "Location Local Time:",
        localTime.toLocaleString()
    );

    // Approximate moon visibility
    const knownNewMoon =
        new Date("2000-01-06T18:14:00Z");

    const lunarCycle =
        29.530588853;

    const diffTime =
        now.getTime() -
        knownNewMoon.getTime();

    const days =
        diffTime /
        (1000 * 60 * 60 * 24);

    const moonAge =
        ((days % lunarCycle) +
            lunarCycle) %
        lunarCycle;

    // Approximate moonrise and moonset
    const moonriseHour =
        (moonAge * 24 / lunarCycle) % 24;

    const moonsetHour =
        (moonriseHour + 12) % 24;

    const currentHour =
        localTime.getHours() +
        localTime.getMinutes() / 60;

    let moonVisible = false;

    if (moonriseHour < moonsetHour) {

        moonVisible =
            currentHour >= moonriseHour &&
            currentHour < moonsetHour;

    } else {

        moonVisible =
            currentHour >= moonriseHour ||
            currentHour < moonsetHour;
    }

    console.log(
        "Approx Moonrise:",
        moonriseHour.toFixed(2),
        "hours"
    );

    console.log(
        "Approx Moonset:",
        moonsetHour.toFixed(2),
        "hours"
    );

    console.log(
        "Moon Visible:",
        moonVisible
    );

    // Show moon only at night
    if (
        document.body.classList.contains("night") &&
        moonVisible
    ) {

        moon.style.display = "block";

    } else {

        moon.style.display = "none";
    }

    // Recalculate phase
    calculateMoonPhase();
}
// ========================================
// NATURAL DISASTERS 2016 - CURRENT YEAR
// GDACS Historical + Current Data
// ========================================

const GDACS_EVENT_TYPES =
    "EQ;TC;FL;VO;WF;DR;TS;FF;LS;ST;CW;HT";

const DISASTER_START_YEAR = 2016;


// ========================================
// Disaster Type
// ========================================

function getDisasterType(eventType) {

    const types = {

        "EQ": "🌍 Earthquake",
        "TC": "🌀 Tropical Cyclone",
        "FL": "🌊 Flood",
        "VO": "🌋 Volcano",
        "WF": "🔥 Wildfire",
        "DR": "☀️ Drought",
        "TS": "🌊 Tsunami",
        "FF": "🌊 Flash Flood",
        "LS": "⛰️ Landslide",
        "ST": "🌨️ Storm",
        "CW": "❄️ Cold Wave",
        "HT": "🔥 Heat Wave"

    };

    return types[eventType] ||
        "🌍 Natural Disaster";
}


// ========================================
// Load Disasters For One Year
// ========================================

async function loadDisastersForYear(year) {

    const currentYear =
        new Date().getFullYear();

    const fromDate =
        `${year}-01-01`;

    const toDate =
        year === currentYear
            ? new Date().toISOString().split("T")[0]
            : `${year}-12-31`;

    const apiURL =
        `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH` +
        `?eventlist=EQ;TC;FL;VO;WF;DR` +
        `&fromdate=${fromDate}` +
        `&todate=${toDate}`;

    console.log(
        `Loading GDACS data for ${year}...`
    );

    console.log(
        "GDACS URL:",
        apiURL
    );

    try {

        const response =
            await fetch(apiURL);

        if (!response.ok) {

            throw new Error(
                `GDACS API Error: ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log(
            `GDACS ${year} response:`,
            data
        );

        if (
            !data.features ||
            !Array.isArray(data.features)
        ) {

            console.warn(
                `No features found for ${year}`
            );

            return [];

        }

        console.log(
            `GDACS ${year}: ${data.features.length} events`
        );

        return data.features;

    } catch (error) {

        console.error(
            `GDACS ${year} Error:`,
            error
        );

        return [];

    }

}

// ========================================
// Load All Years
// ========================================

async function loadAllDisasters() {

    const container =
        document.getElementById(
            "disasterContainer"
        );


    if (!container) {

        console.error(
            "disasterContainer not found"
        );

        return;

    }


    container.innerHTML = `
        <p>
            ⏳ Loading disaster history...
        </p>
    `;


    const currentYear =
        new Date().getFullYear();


    const years = [];

for (let year = 2026; year >= 2016; year--) {
    years.push(year);
}


    const results =
        await Promise.all(

            years.map(
                async function(year) {

                    try {

                        const disasters =
                            await loadDisastersForYear(
                                year
                            );


                        return {
                            year: year,
                            disasters: disasters,
                            error: false
                        };

                    } catch (error) {

                        console.error(
                            `Error loading ${year}:`,
                            error
                        );


                        return {
                            year: year,
                            disasters: [],
                            error: true
                        };

                    }

                }
            )

        );


    let yearHTML = "";


    results.forEach(
        function(result) {

            const year =
                result.year;


            const disasters =
                result.disasters;


            yearHTML += `

                <div class="disaster-year">

                    <button
                        class="disaster-year-header"
                        onclick="toggleDisasterYear(${year})"
                    >

                        <span>
                            📅 ${year}
                        </span>

                        <span
                            class="year-count"
                        >
                            ${
                                disasters.length
                            }
                            events
                        </span>

                        <span
                            id="year-arrow-${year}"
                            class="year-arrow"
                        >
                            ▼
                        </span>

                    </button>


                    <div
                        id="year-content-${year}"
                        class="disaster-year-content"
                    >

                        ${
                            result.error

                                ? `
                                    <p class="no-disaster">
                                        ❌ Unable to load
                                        GDACS data for ${year}.
                                    </p>
                                `

                                : disasters.length > 0

                                ? createDisasterList(
                                    disasters,
                                    year
                                )

                                : `
                                    <p class="no-disaster">
                                        🌍 No disaster events
                                        found for ${year}.
                                    </p>
                                `
                        }

                    </div>

                </div>

            `;

        }
    );


    container.innerHTML =
        yearHTML;


    console.log(
        `GDACS disaster history loaded: ${DISASTER_START_YEAR}-${currentYear}`
    );

}


// ========================================
// Create Disaster List
// ========================================

function createDisasterList(
    disasters,
    year
) {

    let html = "";


    disasters.sort(
        function(a, b) {

            const dateA =
                new Date(
                    a.properties?.fromdate ||
                    a.properties?.todate ||
                    0
                );


            const dateB =
                new Date(
                    b.properties?.fromdate ||
                    b.properties?.todate ||
                    0
                );


            return dateB - dateA;

        }
    );


    disasters.forEach(
        function(feature, index) {

            const p =
                feature.properties || {};


            const eventName =
                p.eventname ||
                p.name ||
                "Natural Disaster";


            const disasterType =
                getDisasterType(
                    p.eventtype
                );


            html += `

                <div class="disaster-event">

                    <button
                        class="disaster-event-header"
                        onclick="toggleDisasterEvent(
                            '${year}-${index}'
                        )"
                    >

                        <span>
                            ${disasterType}
                            ${eventName}
                        </span>


                        <span
                            id="event-arrow-${year}-${index}"
                            class="event-arrow"
                        >
                            ▼
                        </span>

                    </button>


                    <div
                        id="event-details-${year}-${index}"
                        class="disaster-event-details"
                    >

                        ${createDisasterDetails(p)}

                    </div>

                </div>

            `;

        }
    );


    return html;

}


// ========================================
// Disaster Details
// ========================================

function createDisasterDetails(p) {

    const eventName =
        p.eventname ||
        p.name ||
        "Natural Disaster";


    const disasterType =
        getDisasterType(
            p.eventtype
        );


    const startDate =
        p.fromdate

            ? new Date(
                p.fromdate
            ).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )

            : "Not available";


    const endDate =
        p.todate

            ? new Date(
                p.todate
            ).toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )

            : null;


    const location =
        p.country ||
        "Location not available";


    const alertLevel =
        p.alertlevel ||
        "Not available";


    const description =
        p.description ||
        p.name ||
        "No description available";


    let severity =
        "Not available";


    if (
        p.severitydata &&
        p.severitydata.severitytext
    ) {

        severity =
            p.severitydata.severitytext;

    }


    const reportURL =
        p.url &&
        p.url.report
            ? p.url.report
            : null;


    return `

        <p>
            <strong>Event:</strong>
            ${eventName}
        </p>


        <p>
            <strong>Type:</strong>
            ${disasterType}
        </p>


        <p>
            <strong>📅 Date:</strong>
            ${startDate}

            ${
                endDate
                    ? ` — ${endDate}`
                    : ""
            }
        </p>


        <p>
            <strong>📍 Location:</strong>
            ${location}
        </p>


        <p>
            <strong>🚨 Alert Level:</strong>
            ${alertLevel}
        </p>


        <p>
            <strong>📊 Severity:</strong>
            ${severity}
        </p>


        <p>
            <strong>Impact:</strong>
            ${description}
        </p>


        ${
            reportURL

                ? `
                    <p>

                        <strong>
                            🔗 Source:
                        </strong>

                        <a
                            href="${reportURL}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View GDACS Report
                        </a>

                    </p>
                `

                : `
                    <p>
                        <strong>
                            Source:
                        </strong>

                        GDACS
                    </p>
                `
        }

    `;

}


// ========================================
// Toggle Year
// ========================================

function toggleDisasterYear(year) {

    const content =
        document.getElementById(
            `year-content-${year}`
        );


    const arrow =
        document.getElementById(
            `year-arrow-${year}`
        );


    if (!content || !arrow) {

        return;

    }


    if (
        content.classList.contains("open")
    ) {

        content.classList.remove(
            "open"
        );

        arrow.textContent = "▼";

    } else {

        content.classList.add(
            "open"
        );

        arrow.textContent = "▲";

    }

}


// ========================================
// Toggle Individual Disaster
// ========================================

function toggleDisasterEvent(id) {

    const details =
        document.getElementById(
            `event-details-${id}`
        );


    const arrow =
        document.getElementById(
            `event-arrow-${id}`
        );


    if (!details || !arrow) {

        return;

    }


    if (
        details.classList.contains("open")
    ) {

        details.classList.remove(
            "open"
        );

        arrow.textContent = "▼";

    } else {

        details.classList.add(
            "open"
        );

        arrow.textContent = "▲";

    }

}


// ========================================
// Initial Load
// ========================================

loadAllDisasters();


// ========================================
// Refresh Every 10 Minutes
// ========================================

setInterval(
    loadAllDisasters,
    10 * 60 * 1000
);
const map = L.map("map").setView([22.5726, 88.3639], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const mapMarker = L.marker([22.5726, 88.3639])
    .addTo(map)
    .bindPopup("Kolkata")
    .openPopup();


// ========================================
// Show Current Device Location On Map
// ========================================

if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log("Initial Device Location:");
            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            // Move map to current device location
            map.setView([latitude, longitude], 13);

            // Move marker
            mapMarker.setLatLng([latitude, longitude]);

            // Show popup
            mapMarker
                .bindPopup("📍 Your Current Location")
                .openPopup();

            // Get weather for current location
            getWeatherByLocation(latitude, longitude);

        },

        function (error) {

            console.log(
                "Could not get initial device location:",
                error.message
            );

            // If permission is denied,
            // map will remain on Kolkata.
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}

    async function getLocationName(latitude, longitude) {

    const url =
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=5&appid=${API_KEY}`;

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Location name not found");
        }

        const locations = await response.json();

        console.log("Reverse Geocoding:", locations);

        if (locations.length > 0) {
            return locations[0];
        }

        return null;

    } catch (error) {

        console.error("Reverse Geocoding Error:", error);
        return null;

    }
}
map.on("click", function (e) {

    const latitude = e.latlng.lat;
    const longitude = e.latlng.lng;

    console.log("Map Click Latitude:", latitude);
    console.log("Map Click Longitude:", longitude);

    mapMarker.setLatLng([latitude, longitude]);

    mapMarker
        .bindPopup(`
            <strong>Selected Location</strong><br>
            Latitude: ${latitude.toFixed(5)}<br>
            Longitude: ${longitude.toFixed(5)}
        `)
        .openPopup();

    getWeatherByLocation(latitude, longitude);

});
async function searchMapLocation(query) {

    try {

        const url = `${GEOCODING_API_URL}?q=${encodeURIComponent(query)}&limit=1&appid=${API_KEY}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Location not found");
        }

        const results = await response.json();

        if (results.length === 0) {
            mapLocationSuggestions.innerHTML = `
                <div class="location-suggestion">
                    Location not found
                </div>
            `;
            return;
        }

        const location = results[0];

        const latitude = location.lat;
        const longitude = location.lon;

        // Move map to searched location
        map.setView([latitude, longitude], 13);

        // Move marker
        mapMarker.setLatLng([latitude, longitude]);

        // Show location name on map
        mapMarker
            .bindPopup(`
                <strong>${location.name}</strong><br>
                ${location.state ? location.state + ", " : ""}
                ${location.country || ""}
            `)
            .openPopup();

        // Get weather for searched location
        await getWeatherByLocation(latitude, longitude);

        // Clear suggestions
        mapLocationSuggestions.innerHTML = "";

    } catch (error) {

        console.error("Map Search Error:", error);

        mapLocationSuggestions.innerHTML = `
            <div class="location-suggestion">
                ❌ Location not found
            </div>
        `;
    }
}
const myLocationBtn = document.getElementById("myLocationBtn");

if (myLocationBtn) {
myLocationBtn.addEventListener("click", function () {


    if (!navigator.geolocation) {
        alert("Your browser does not support location access.");
        return;
    }

    myLocationBtn.disabled = true;
    myLocationBtn.textContent = "📍 Finding Location...";

    navigator.geolocation.getCurrentPosition(
    async function (position) {

            myLatitude = position.coords.latitude;
            myLongitude = position.coords.longitude;

            // Save current device location separately
            console.log("My Latitude:", myLatitude);
            console.log("My Longitude:", myLongitude);

            // Move the map to your current location
            map.setView([myLatitude, myLongitude], 13);

            // Move the marker
            mapMarker.setLatLng([myLatitude, myLongitude]);

            mapMarker
                .bindPopup("📍 Your Current Location")
                .openPopup();
                // Load weather for current location
                await getWeatherByLocation(myLatitude, myLongitude);

            myLocationBtn.disabled = false;
            myLocationBtn.textContent = "📍 My Location";

        },

        function (error) {

            myLocationBtn.disabled = false;
            myLocationBtn.textContent = "📍 My Location";

            if (error.code === error.PERMISSION_DENIED) {
                alert("Please allow location access in your browser.");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                alert("Your current location is unavailable.");
            } else if (error.code === error.TIMEOUT) {
                alert("Location request timed out. Please try again.");
            } else {
                alert("Unable to get your current location.");
            }

            console.error("Geolocation Error:", error.message);
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );

});


}

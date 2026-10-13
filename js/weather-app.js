const BOOTLEG_WEATHER_CONFIG = {
  openWeatherMapKey: "da5c99b57df50207ade3b5f26dd561a7",
  newsDataKey: "pub_726ada68aaab4d7c91330b325aa2da6a"
};

const wx = {
  appStatus: document.getElementById("appStatus"),
  locationInput: document.getElementById("locationInput"),
  searchForm: document.getElementById("weather-search-advanced"),
  geoBtn: document.getElementById("geoBtn"),
  locationName: document.getElementById("locationName"),
  dateLine: document.getElementById("dateLine"),
  tempNow: document.getElementById("tempNow"),
  conditionText: document.getElementById("conditionText"),
  weatherIcon: document.getElementById("weatherIcon"),
  conditionCard: document.getElementById("conditionCard"),
  feelsLike: document.getElementById("feelsLike"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  pressure: document.getElementById("pressure"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  hourlyStrip: document.getElementById("hourlyStrip"),
  dailyForecast: document.getElementById("dailyForecast"),
  weatherNews: document.getElementById("weatherNews")
};

if (wx.searchForm) {
  let weatherMap;
  let weatherMarker;
  let currentWeatherLayer;
  let currentCoords = { lat: 53.6458, lon: -1.7850 };
  let currentLocationLabel = "Huddersfield, England";

  const weatherCodes = {
    0: ["Clear sky", "☀️", "🌙"],
    1: ["Mainly clear", "🌤️", "🌙"],
    2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"],
    45: ["Fog", "🌫️", "🌫️"],
    48: ["Rime fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"],
    53: ["Drizzle", "🌦️", "🌧️"],
    55: ["Heavy drizzle", "🌧️", "🌧️"],
    56: ["Freezing drizzle", "🌧️", "🌧️"],
    57: ["Freezing drizzle", "🌧️", "🌧️"],
    61: ["Light rain", "🌦️", "🌧️"],
    63: ["Rain", "🌧️", "🌧️"],
    65: ["Heavy rain", "🌧️", "🌧️"],
    66: ["Freezing rain", "🌧️", "🌧️"],
    67: ["Freezing rain", "🌧️", "🌧️"],
    71: ["Light snow", "🌨️", "🌨️"],
    73: ["Snow", "🌨️", "🌨️"],
    75: ["Heavy snow", "❄️", "❄️"],
    77: ["Snow grains", "❄️", "❄️"],
    80: ["Rain showers", "🌦️", "🌧️"],
    81: ["Rain showers", "🌧️", "🌧️"],
    82: ["Violent showers", "⛈️", "⛈️"],
    85: ["Snow showers", "🌨️", "🌨️"],
    86: ["Heavy snow showers", "❄️", "❄️"],
    95: ["Thunderstorm", "⛈️", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️", "⛈️"],
    99: ["Thunderstorm with hail", "⛈️", "⛈️"]
  };

  function setStatus(message) {
    wx.appStatus.textContent = message;
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function formatTime(value) {
    if (!value) return "--:--";
    const date = new Date(value);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatDay(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
  }

  function getWeatherInfo(code, isDay = 1) {
    const info = weatherCodes[code] || ["Unknown", "☁️", "☁️"];
    return { label: info[0], icon: isDay ? info[1] : info[2] };
  }

  function initMap() {
    if (weatherMap || !window.L) return;

    weatherMap = L.map("weatherMap", {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([currentCoords.lat, currentCoords.lon], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(weatherMap);

    weatherMarker = L.marker([currentCoords.lat, currentCoords.lon]).addTo(weatherMap);
    weatherMarker.bindPopup(currentLocationLabel);
    setWeatherLayer("precipitation_new");
  }

  function setWeatherLayer(layerName) {
    if (!weatherMap) return;
    if (currentWeatherLayer) weatherMap.removeLayer(currentWeatherLayer);

    currentWeatherLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${BOOTLEG_WEATHER_CONFIG.openWeatherMapKey}`,
      { opacity: 0.62, attribution: "Weather layers &copy; OpenWeatherMap" }
    ).addTo(weatherMap);
  }

  function updateMap(lat, lon, label) {
    initMap();
    if (!weatherMap) return;
    weatherMap.setView([lat, lon], 9);
    weatherMarker.setLatLng([lat, lon]);
    weatherMarker.bindPopup(label || "Weather location");
    setTimeout(() => weatherMap.invalidateSize(), 180);
  }

  async function reverseGeocode(lat, lon) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
      const response = await fetch(url);
      const data = await response.json();
      const place = data.results && data.results[0];

      if (!place) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
    } catch (error) {
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  }

  async function searchLocation(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || !data.results.length) {
      throw new Error("No matching location found.");
    }

    const place = data.results[0];
    return {
      lat: place.latitude,
      lon: place.longitude,
      label: [place.name, place.admin1, place.country].filter(Boolean).join(", ")
    };
  }

  async function fetchWeather(lat, lon, label) {
    setStatus("Loading weather data...");

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      timezone: "auto",
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "weather_code",
        "pressure_msl",
        "wind_speed_10m"
      ].join(","),
      hourly: ["temperature_2m", "precipitation_probability", "weather_code", "is_day"].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "sunrise",
        "sunset"
      ].join(","),
      forecast_days: "7"
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error("Weather forecast failed.");
    const data = await response.json();

    currentCoords = { lat, lon };
    currentLocationLabel = label || await reverseGeocode(lat, lon);

    // Let Boots reuse this page's fresh result and remember the chosen place.
    window.BOOTLEG_WEATHER_SNAPSHOT={data,label:currentLocationLabel,lat,lon,checkedAt:Date.now()};
    try{localStorage.setItem('bootlegWeatherPlace',JSON.stringify({lat,lon,label:currentLocationLabel,timezone:data.timezone}));}catch{}
    renderWeather(data, currentLocationLabel);
    updateMap(lat, lon, currentLocationLabel);
    fetchWeatherNews();
    setStatus(`Showing weather for ${currentLocationLabel}`);
  }

  function renderWeather(data, label) {
    const current = data.current;
    const info = getWeatherInfo(current.weather_code, current.is_day);

    wx.locationName.textContent = label;
    wx.dateLine.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long"
    });

    wx.tempNow.textContent = `${Math.round(current.temperature_2m)}°`;
    wx.conditionText.textContent = info.label;
    wx.weatherIcon.textContent = info.icon;
    wx.conditionCard.classList.toggle("is-night", !current.is_day);

    wx.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
    wx.humidity.textContent = `${current.relative_humidity_2m}%`;
    wx.wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    wx.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
    wx.sunrise.textContent = formatTime(data.daily.sunrise[0]);
    wx.sunset.textContent = formatTime(data.daily.sunset[0]);

    renderHourly(data.hourly);
    renderDaily(data.daily);
  }

  function renderHourly(hourly) {
    const now = new Date();
    const startIndex = Math.max(0, hourly.time.findIndex(time => new Date(time) >= now));

    wx.hourlyStrip.innerHTML = hourly.time.slice(startIndex, startIndex + 24).map((time, offset) => {
      const index = startIndex + offset;
      const info = getWeatherInfo(hourly.weather_code[index], hourly.is_day[index]);
      return `<article class="wx-hour-card">
        <strong>${offset === 0 ? "Now" : formatTime(time)}</strong>
        <div class="wx-hour-icon">${info.icon}</div>
        <span>${Math.round(hourly.temperature_2m[index])}°C</span>
        <small>${hourly.precipitation_probability[index] ?? 0}% rain</small>
      </article>`;
    }).join("");
  }

  function renderDaily(daily) {
    wx.dailyForecast.innerHTML = daily.time.map((date, index) => {
      const info = getWeatherInfo(daily.weather_code[index], 1);
      return `<article class="wx-day-card">
        <span class="wx-day-name">${index === 0 ? "Today" : formatDay(date)}</span>
        <div class="wx-day-icon">${info.icon}</div>
        <strong>${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°</strong>
        <small>${daily.precipitation_probability_max[index] ?? 0}% rain</small>
      </article>`;
    }).join("");
  }

  async function fetchWeatherNews() {
    wx.weatherNews.innerHTML = `<article class="wx-news-card"><h3>Loading weather stories...</h3><p>Checking NewsData for current weather articles.</p></article>`;

    try {
      const query = encodeURIComponent("weather OR storm OR rain OR snow OR heatwave OR flood");
      const url = `https://newsdata.io/api/1/latest?apikey=${BOOTLEG_WEATHER_CONFIG.newsDataKey}&q=${query}&language=en&category=environment`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("News request failed.");
      const data = await response.json();
      const articles = (data.results || []).filter(article => article.title && article.link).slice(0, 3);
      if (!articles.length) throw new Error("No articles returned.");

      wx.weatherNews.innerHTML = articles.map(article => `<a class="wx-news-card" href="${article.link}" target="_blank" rel="noopener noreferrer">
        ${article.image_url ? `<img src="${article.image_url}" alt="">` : ""}
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(truncateText(article.description || article.source_name || "Weather story", 220))}</p>
      </a>`).join("");
    } catch (error) {
      wx.weatherNews.innerHTML = `<article class="wx-news-card"><h3>Weather articles unavailable</h3><p>The NewsData feed did not return articles. The section is still wired and ready for live results.</p></article>
      <article class="wx-news-card"><h3>Fallback option</h3><p>This can be swapped to curated RSS/source links if the API blocks browser requests.</p></article>
      <article class="wx-news-card"><h3>Weather console online</h3><p>Forecast, map and current weather data continue working independently of article results.</p></article>`;
    }
  }

  function truncateText(value, max = 220) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[char]));
  }

  function handleError(error) {
    console.error(error);
    setStatus(error.message || "Something went wrong loading the weather app.");
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported. Showing Huddersfield fallback.");
      fetchWeather(currentCoords.lat, currentCoords.lon, currentLocationLabel).catch(handleError);
      return;
    }

    setStatus("Requesting location permission...");
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const label = await reverseGeocode(lat, lon);
          await fetchWeather(lat, lon, label);
        } catch (error) {
          handleError(error);
        }
      },
      () => {
        setStatus("Location blocked or unavailable. Showing Huddersfield fallback.");
        fetchWeather(currentCoords.lat, currentCoords.lon, currentLocationLabel).catch(handleError);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 600000 }
    );
  }

  wx.searchForm.addEventListener("submit", async event => {
    event.preventDefault();
    const query = wx.locationInput.value.trim();
    if (!query) return;

    try {
      setStatus(`Searching for ${query}...`);
      const place = await searchLocation(query);
      await fetchWeather(place.lat, place.lon, place.label);
    } catch (error) {
      handleError(error);
    }
  });

  wx.geoBtn.addEventListener("click", useBrowserLocation);

  document.querySelectorAll(".layer-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".layer-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      setWeatherLayer(button.dataset.layer);
    });
  });

  initMap();
  useBrowserLocation();
}

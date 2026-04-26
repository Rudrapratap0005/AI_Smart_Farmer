import { fetchCropRecommendationRequest, fetchPredictionHistoryRequest, fetchWeatherRequest } from "./api.js";
import { logout, populateUserUI, requireAuth } from "./auth.js";
import { initTheme } from "./theme.js";

let latestWeather = null;
let latestLocation = null;
let farmMap = null;
let farmMarker = null;
let yieldChart = null;

const soilTips = [
  {
    title: "Balance organic matter",
    content: "Add compost or decomposed manure before sowing season to improve structure, water retention, and microbial activity.",
  },
  {
    title: "Monitor pH before fertilizing",
    content: "A pH check helps you avoid nutrient lockout and adjust lime or sulfur applications before crop stress appears.",
  },
  {
    title: "Avoid over-irrigation",
    content: "Heavy irrigation can compact topsoil and wash nutrients deeper than root level. Use shorter intervals and inspect drainage channels.",
  },
  {
    title: "Rotate crops strategically",
    content: "Alternate cereals with legumes to support nitrogen recovery and reduce pest pressure in the next planting cycle.",
  },
];

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

function setLoading(button, loading, idleLabel, busyLabel) {
  if (!button) {
    return;
  }

  button.dataset.loading = loading ? "true" : "false";
  button.disabled = loading;
  button.innerHTML = loading ? `<span class="loading-spinner"></span> ${busyLabel}` : idleLabel;
}

function bindProfileMenu() {
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");

  profileButton?.addEventListener("click", () => {
    const expanded = profileButton.getAttribute("aria-expanded") === "true";
    profileButton.setAttribute("aria-expanded", String(!expanded));
    profileDropdown.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".profile-menu")) {
      profileButton?.setAttribute("aria-expanded", "false");
      profileDropdown?.classList.remove("open");
    }
  });

  document.getElementById("logoutButton")?.addEventListener("click", logout);
}

function renderSoilTips() {
  const container = document.getElementById("soilTips");
  container.innerHTML = soilTips.map((tip, index) => `
    <div class="accordion-item ${index === 0 ? "open" : ""}">
      <button class="accordion-trigger" type="button">${tip.title}</button>
      <div class="accordion-content">${tip.content}</div>
    </div>
  `).join("");

  container.querySelectorAll(".accordion-item").forEach((item) => {
    item.querySelector(".accordion-trigger").addEventListener("click", () => {
      item.classList.toggle("open");
    });
  });
}

function initializeMap(lat = 20.5937, lon = 78.9629, label = "India overview") {
  if (!window.L) {
    return;
  }

  if (!farmMap) {
    farmMap = window.L.map("farmMap", {
      zoomControl: false,
    }).setView([lat, lon], 5);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(farmMap);

    window.L.control.zoom({ position: "bottomright" }).addTo(farmMap);
  } else {
    farmMap.setView([lat, lon], 12);
  }

  if (!farmMarker) {
    farmMarker = window.L.marker([lat, lon]).addTo(farmMap);
  } else {
    farmMarker.setLatLng([lat, lon]);
  }

  farmMarker.bindPopup(label).openPopup();
}

function renderWeather(data) {
  latestWeather = data;

  const weatherResults = document.getElementById("weatherResults");
  const current = data.current;
  const cards = [
    {
      label: "Location",
      value: current.name,
      note: `${current.sys?.country || ""} ${current.weather?.[0]?.main || ""}`.trim(),
    },
    {
      label: "Temperature",
      value: `${Math.round(current.main?.temp || 0)}°C`,
      note: `Feels like ${Math.round(current.main?.feels_like || 0)}°C`,
    },
    {
      label: "Humidity",
      value: `${current.main?.humidity || 0}%`,
      note: "Relative humidity",
    },
    {
      label: "Wind",
      value: `${Math.round((current.wind?.speed || 0) * 3.6)} km/h`,
      note: "Surface wind speed",
    },
  ];

  weatherResults.innerHTML = cards.map((card) => `
    <div class="result-card">
      <span class="result-label">${card.label}</span>
      <strong>${card.value}</strong>
      <small>${card.note}</small>
    </div>
  `).join("");

  const alertsContainer = document.getElementById("alertsContainer");
  alertsContainer.innerHTML = data.alerts.map((alert) => `
    <div class="alert-chip" data-level="${alert.level}">
      <strong>${alert.title}</strong>
      <div class="muted">${alert.description}</div>
    </div>
  `).join("");

  document.getElementById("heroWeatherStatus").textContent = current.weather?.[0]?.description || "Updated";
  document.getElementById("locationInsight").textContent = `Weather synced for ${current.name}`;

  document.getElementById("temperatureInput").value = current.main?.temp ?? "";
  document.getElementById("humidityInput").value = current.main?.humidity ?? "";

  if (current.coord?.lat && current.coord?.lon) {
    initializeMap(current.coord.lat, current.coord.lon, current.name);
    document.getElementById("locationCoords").textContent = `${current.coord.lat.toFixed(4)}, ${current.coord.lon.toFixed(4)}`;
    document.getElementById("locationMeta").textContent = `${current.name}, ${current.sys?.country || ""}`;
  }

  renderActionCenter();
}

function renderRecommendation(result, temperature, humidity) {
  const card = document.getElementById("recommendationResult");
  card.innerHTML = `
    <span class="result-label">Recommendation</span>
    <strong>${result.crop}</strong>
    <small>Generated from ${temperature}°C temperature and ${humidity}% humidity. Prediction id: ${result.id}</small>
  `;

  document.getElementById("heroCropStatus").textContent = result.crop;
}

function renderDiseaseResult(message, tone) {
  const card = document.getElementById("diseaseResult");
  card.innerHTML = `
    <span class="result-label">Detection result</span>
    <strong>${tone}</strong>
    <small>${message}</small>
  `;
}

function renderHistory(items) {
  const historyList = document.getElementById("historyList");

  if (!items.length) {
    historyList.innerHTML = `
      <div class="mini-panel">
        <strong>No prediction history yet</strong>
        <small>Run crop recommendations to build a prediction timeline.</small>
      </div>
    `;
    return;
  }

  historyList.innerHTML = items.slice(0, 6).map((item) => `
    <div class="mini-panel">
      <strong>${item.crop}</strong>
      <small>${item.temperature}°C, ${item.humidity}% humidity</small>
    </div>
  `).join("");
}

function renderActionCenter() {
  const actionCenter = document.getElementById("actionCenter");
  const alerts = latestWeather?.alerts || [];
  const forecast = latestWeather?.forecast || [];
  const topForecast = forecast[0];

  const items = [
    {
      title: latestLocation ? "GPS connected" : "GPS recommended",
      detail: latestLocation ? "Live coordinates are active for weather and map context." : "Enable location to improve field-specific weather insights.",
    },
    {
      title: alerts[0]?.title || "No active alert",
      detail: alerts[0]?.description || "Weather conditions are currently stable.",
    },
    {
      title: topForecast ? `Next forecast: ${Math.round(topForecast.main?.temp || 0)}°C` : "Forecast ready",
      detail: topForecast ? topForecast.weather?.[0]?.description || "Latest forecast loaded." : "Search for a city to load forecast blocks.",
    },
  ];

  actionCenter.innerHTML = items.map((item) => `
    <div class="mini-panel">
      <strong>${item.title}</strong>
      <small>${item.detail}</small>
    </div>
  `).join("");
}

function renderChart() {
  const canvas = document.getElementById("yieldChart");

  if (!canvas || !window.Chart) {
    return;
  }

  if (yieldChart) {
    yieldChart.destroy();
  }

  yieldChart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      datasets: [
        {
          label: "Yield (tons)",
          data: [12, 15, 14, 19, 22, 24, 23, 28],
          fill: true,
          borderColor: "#2e7d32",
          backgroundColor: "rgba(102, 187, 106, 0.2)",
          tension: 0.38,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1b5e20",
        },
      ],
    },
    options: {
      animation: {
        duration: 900,
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          grid: {
            color: "rgba(110, 140, 117, 0.15)",
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

async function detectLocation() {
  const button = document.getElementById("detectLocationBtn");
  setLoading(button, true, "Use my location", "Locating");

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
      });
    });

    latestLocation = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };

    initializeMap(latestLocation.lat, latestLocation.lon, "Your farm location");
    document.getElementById("locationCoords").textContent = `${latestLocation.lat.toFixed(4)}, ${latestLocation.lon.toFixed(4)}`;
    document.getElementById("locationMeta").textContent = "Location captured from your device";
    document.getElementById("locationInsight").textContent = "Field coordinates synced successfully";
    showToast("Location detected successfully.", "success");

    await loadWeather({ lat: latestLocation.lat, lon: latestLocation.lon });
  } catch (error) {
    showToast("Unable to access location. You can still search by city.", "error");
  } finally {
    setLoading(button, false, "Use my location", "Locating");
  }
}

async function loadWeather(params) {
  const button = document.getElementById("weatherSubmitBtn");
  setLoading(button, true, "Check weather", "Loading");

  try {
    const data = await fetchWeatherRequest(params);
    renderWeather(data);
    showToast("Weather updated.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false, "Check weather", "Loading");
  }
}

async function handleWeatherSubmit(event) {
  event.preventDefault();
  const city = document.getElementById("cityInput").value.trim();

  if (!city && latestLocation) {
    await loadWeather(latestLocation);
    return;
  }

  if (!city) {
    showToast("Enter a city or enable your location first.", "error");
    return;
  }

  await loadWeather({ city });
}

async function handleRecommendation() {
  const button = document.getElementById("recommendBtn");
  const temperature = Number(document.getElementById("temperatureInput").value);
  const humidity = Number(document.getElementById("humidityInput").value);

  if (Number.isNaN(temperature) || Number.isNaN(humidity)) {
    showToast("Provide temperature and humidity values to generate a recommendation.", "error");
    return;
  }

  setLoading(button, true, "Generate recommendation", "Analyzing");

  try {
    const result = await fetchCropRecommendationRequest({ temperature, humidity });
    renderRecommendation(result, temperature, humidity);
    showToast(`Recommended crop: ${result.crop}`, "success");

    const history = await fetchPredictionHistoryRequest();
    renderHistory(history);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false, "Generate recommendation", "Analyzing");
  }
}

function handleImagePreview(event) {
  const file = event.target.files[0];
  const image = document.getElementById("imagePreview");
  const placeholder = document.getElementById("imagePreviewPlaceholder");

  if (!file) {
    image.style.display = "none";
    image.removeAttribute("src");
    placeholder.style.display = "grid";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    image.src = reader.result;
    image.style.display = "block";
    placeholder.style.display = "none";
  };
  reader.readAsDataURL(file);
}

function handleDiseaseAnalysis() {
  const button = document.getElementById("analyzeCropBtn");
  const file = document.getElementById("imageUpload").files[0];

  if (!file) {
    showToast("Upload a crop image before running analysis.", "error");
    return;
  }

  setLoading(button, true, "Analyze image", "Analyzing");

  window.setTimeout(() => {
    const name = file.name.toLowerCase();
    const tone = name.includes("spot") || name.includes("rust") ? "Possible leaf spot detected" : "No critical disease detected";
    const message = name.includes("spot") || name.includes("rust")
      ? "Mock AI flagged visual symptoms that resemble leaf spot. Inspect leaf edges and apply preventive treatment if the spread increases."
      : "Mock AI found healthy-looking foliage. Continue monitoring moisture and canopy airflow over the next 48 hours.";

    renderDiseaseResult(message, tone);
    showToast("Crop image analysis completed.", "success");
    setLoading(button, false, "Analyze image", "Analyzing");
  }, 1200);
}

async function loadHistory() {
  try {
    const history = await fetchPredictionHistoryRequest();
    renderHistory(history);
  } catch (error) {
    renderHistory([]);
  }
}

function bindEvents() {
  document.getElementById("detectLocationBtn").addEventListener("click", detectLocation);
  document.getElementById("weatherForm").addEventListener("submit", handleWeatherSubmit);
  document.getElementById("recommendBtn").addEventListener("click", handleRecommendation);
  document.getElementById("imageUpload").addEventListener("change", handleImagePreview);
  document.getElementById("analyzeCropBtn").addEventListener("click", handleDiseaseAnalysis);
  document.getElementById("refreshAlertsBtn").addEventListener("click", () => {
    renderActionCenter();
    showToast("Action center refreshed.", "info");
  });
  document.getElementById("heroWeatherAction").addEventListener("click", () => {
    if (latestLocation) {
      loadWeather(latestLocation);
      return;
    }

    const city = document.getElementById("cityInput").value.trim();
    if (city) {
      loadWeather({ city });
      return;
    }

    showToast("Use your location or search for a city first.", "info");
  });
}

async function init() {
  initTheme();

  const session = await requireAuth();
  if (!session) {
    return;
  }

  populateUserUI(session.user);
  bindProfileMenu();
  renderSoilTips();
  renderChart();
  initializeMap();
  renderActionCenter();
  bindEvents();
  await loadHistory();
}

init();

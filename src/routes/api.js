import express from "express";
import crypto from "crypto";
import Crop from "../../models/CropData.js";
import { isDatabaseReady } from "../config/db.js";
import { loadEnvironment } from "../config/env.js";
import { readPredictions, writePredictions } from "../lib/localStore.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, database: isDatabaseReady() ? "connected" : "fallback-local-storage" });
});

function buildWeatherAlerts(current, forecastItems = []) {
  const alerts = [];
  const hourlyBlocks = forecastItems.slice(0, 8);
  const rainChance = hourlyBlocks.some((item) => (item.pop || 0) >= 0.5);
  const stormRisk = hourlyBlocks.some((item) => {
    const label = item.weather?.[0]?.main?.toLowerCase() || "";
    return label.includes("thunderstorm");
  });
  const highWind = hourlyBlocks.some((item) => (item.wind?.speed || 0) >= 10);
  const heatStress = (current.main?.temp || 0) >= 35;

  if (stormRisk) {
    alerts.push({
      level: "high",
      title: "Thunderstorm risk",
      description: "Field work and spraying should be postponed due to possible thunderstorms.",
    });
  }

  if (highWind) {
    alerts.push({
      level: "medium",
      title: "High wind speeds",
      description: "Protect light structures and postpone delicate irrigation cycles if possible.",
    });
  }

  if (rainChance) {
    alerts.push({
      level: "medium",
      title: "Rain expected",
      description: "Rain is likely in the next few hours. Review drainage and irrigation plans.",
    });
  }

  if (heatStress) {
    alerts.push({
      level: "medium",
      title: "Heat stress warning",
      description: "High temperatures may increase crop water demand during the day.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "low",
      title: "Conditions stable",
      description: "No immediate weather-related farm risks were detected from the latest forecast.",
    });
  }

  return alerts;
}

function describeWeatherCode(code) {
  const codes = {
    0: { main: "Clear", description: "clear sky" },
    1: { main: "Clear", description: "mainly clear" },
    2: { main: "Clouds", description: "partly cloudy" },
    3: { main: "Clouds", description: "overcast" },
    45: { main: "Mist", description: "fog" },
    48: { main: "Mist", description: "depositing rime fog" },
    51: { main: "Drizzle", description: "light drizzle" },
    53: { main: "Drizzle", description: "moderate drizzle" },
    55: { main: "Drizzle", description: "dense drizzle" },
    61: { main: "Rain", description: "slight rain" },
    63: { main: "Rain", description: "moderate rain" },
    65: { main: "Rain", description: "heavy rain" },
    71: { main: "Snow", description: "slight snow fall" },
    73: { main: "Snow", description: "moderate snow fall" },
    75: { main: "Snow", description: "heavy snow fall" },
    80: { main: "Rain", description: "rain showers" },
    81: { main: "Rain", description: "moderate rain showers" },
    82: { main: "Rain", description: "violent rain showers" },
    95: { main: "Thunderstorm", description: "thunderstorm" },
    96: { main: "Thunderstorm", description: "thunderstorm with slight hail" },
    99: { main: "Thunderstorm", description: "thunderstorm with heavy hail" },
  };

  return codes[code] || { main: "Clouds", description: "variable conditions" };
}

async function fetchOpenMeteoWeather({ city, lat, lon }) {
  let locationName = city || "Farm location";
  let latitude = Number(lat);
  let longitude = Number(lon);
  let countryCode = "IN";

  if ((!latitude || !longitude) && city) {
    const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geocodeData = await geocodeResponse.json();
    const match = geocodeData.results?.[0];

    if (!geocodeResponse.ok || !match) {
      throw new Error("Unable to locate that city");
    }

    latitude = match.latitude;
    longitude = match.longitude;
    locationName = match.name || city;
    countryCode = match.country_code || countryCode;
  }

  if (!latitude || !longitude) {
    throw new Error("Latitude and longitude are required");
  }

  const forecastResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability&forecast_days=2&timezone=auto`
  );
  const forecastData = await forecastResponse.json();

  if (!forecastResponse.ok) {
    throw new Error("Unable to fetch fallback weather");
  }

  const currentWeather = describeWeatherCode(forecastData.current?.weather_code);
  const current = {
    name: locationName,
    coord: {
      lat: latitude,
      lon: longitude,
    },
    sys: {
      country: countryCode,
    },
    weather: [currentWeather],
    main: {
      temp: forecastData.current?.temperature_2m ?? 0,
      feels_like: forecastData.current?.apparent_temperature ?? forecastData.current?.temperature_2m ?? 0,
      humidity: forecastData.current?.relative_humidity_2m ?? 0,
    },
    wind: {
      speed: (forecastData.current?.wind_speed_10m ?? 0) / 3.6,
    },
  };

  const hourlyTimes = forecastData.hourly?.time || [];
  const hourlyTemps = forecastData.hourly?.temperature_2m || [];
  const hourlyHumidity = forecastData.hourly?.relative_humidity_2m || [];
  const hourlyCodes = forecastData.hourly?.weather_code || [];
  const hourlyWind = forecastData.hourly?.wind_speed_10m || [];
  const hourlyPrecip = forecastData.hourly?.precipitation_probability || [];

  const forecast = hourlyTimes.slice(0, 8).map((time, index) => ({
    dt: new Date(time).getTime(),
    main: {
      temp: hourlyTemps[index] ?? current.main.temp,
      humidity: hourlyHumidity[index] ?? current.main.humidity,
    },
    weather: [describeWeatherCode(hourlyCodes[index])],
    wind: {
      speed: (hourlyWind[index] ?? 0) / 3.6,
    },
    pop: Math.max(0, Math.min(1, (hourlyPrecip[index] ?? 0) / 100)),
  }));

  return {
    current,
    forecast,
    alerts: buildWeatherAlerts(current, forecast),
    meta: {
      source: "open-meteo",
      fallbackReason: "OpenWeather API key was rejected.",
    },
  };
}

router.get("/weather", async (req, res, next) => {
  try {
    let apiKey = process.env.OPENWEATHER_API_KEY;
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const lat = typeof req.query.lat === "string" ? req.query.lat.trim() : "";
    const lon = typeof req.query.lon === "string" ? req.query.lon.trim() : "";

    if (!apiKey) {
      loadEnvironment();
      apiKey = process.env.OPENWEATHER_API_KEY;
    }

    if (!apiKey) {
      return res.status(503).json({ message: "OPENWEATHER_API_KEY is not configured" });
    }

    if (!city && (!lat || !lon)) {
      return res.status(400).json({ message: "Provide either a city or latitude and longitude" });
    }

    const currentUrl = city
      ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`;

    const currentResponse = await fetch(currentUrl);
    const current = await currentResponse.json();

    if (!currentResponse.ok) {
      if (currentResponse.status === 401) {
        const fallbackWeather = await fetchOpenMeteoWeather({ city, lat, lon });
        return res.json(fallbackWeather);
      }

      return res.status(currentResponse.status).json({ message: current.message || "Unable to fetch weather" });
    }

    const coords = current.coord || {};
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(coords.lat)}&lon=${encodeURIComponent(coords.lon)}&appid=${apiKey}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);
    const forecast = await forecastResponse.json();

    const forecastItems = forecastResponse.ok ? (forecast.list || []) : [];
    const alerts = buildWeatherAlerts(current, forecastItems);

    return res.json({
      current,
      forecast: forecastItems.slice(0, 8),
      alerts,
      meta: {
        source: "openweather",
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/predict", async (req, res, next) => {
  try {
    const temperature = Number(req.body.temperature);
    const humidity = Number(req.body.humidity);

    if (Number.isNaN(temperature) || Number.isNaN(humidity)) {
      return res.status(400).json({ message: "Temperature and humidity must be valid numbers" });
    }

    let crop = "Wheat";

    if (temperature > 30 && humidity > 60) {
      crop = "Rice";
    } else if (temperature < 20) {
      crop = "Barley";
    }

    let savedPrediction;

    if (isDatabaseReady()) {
      savedPrediction = await Crop.create({
        temperature,
        humidity,
        crop,
      });
    } else {
      const predictions = await readPredictions();
      savedPrediction = {
        _id: crypto.randomUUID(),
        temperature,
        humidity,
        crop,
        date: new Date().toISOString(),
      };
      predictions.unshift(savedPrediction);
      await writePredictions(predictions.slice(0, 20));
    }

    return res.json({
      crop,
      id: savedPrediction._id,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    let history;

    if (isDatabaseReady()) {
      history = await Crop.find().sort({ date: -1 }).limit(20);
    } else {
      history = await readPredictions();
    }

    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

export default router;

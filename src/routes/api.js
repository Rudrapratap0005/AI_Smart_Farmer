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

function buildDemoWeatherPayload({ city, lat, lon }) {
  const fallbackName = city || "Farm location";
  const latitude = Number(lat) || 31.326;
  const longitude = Number(lon) || 75.5762;
  const current = {
    name: fallbackName,
    coord: {
      lat: latitude,
      lon: longitude,
    },
    sys: {
      country: "IN",
    },
    weather: [
      {
        main: "Clouds",
        description: "demo forecast data",
      },
    ],
    main: {
      temp: 29,
      feels_like: 32,
      humidity: 64,
    },
    wind: {
      speed: 4.2,
    },
  };

  const forecast = Array.from({ length: 8 }, (_, index) => ({
    dt: Date.now() + (index + 1) * 10800000,
    main: {
      temp: 28 + (index % 3),
      humidity: 60 + (index % 8),
    },
    weather: [
      {
        main: index > 4 ? "Rain" : "Clouds",
        description: index > 4 ? "light rain expected" : "scattered clouds",
      },
    ],
    wind: {
      speed: 4 + index * 0.4,
    },
    pop: index > 4 ? 0.58 : 0.18,
  }));

  return {
    current,
    forecast,
    alerts: buildWeatherAlerts(current, forecast),
    meta: {
      source: "demo",
      fallbackReason: "OpenWeather API key is invalid or inactive.",
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
        return res.json(buildDemoWeatherPayload({ city, lat, lon }));
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

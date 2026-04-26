import express from "express";
import crypto from "crypto";
import Crop from "../../models/CropData.js";
import { isDatabaseReady } from "../config/db.js";
import { readPredictions, writePredictions } from "../lib/localStore.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, database: isDatabaseReady() ? "connected" : "fallback-local-storage" });
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

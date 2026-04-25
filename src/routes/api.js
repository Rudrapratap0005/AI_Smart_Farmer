import express from "express";
import Crop from "../../models/CropData.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
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

    const savedPrediction = await Crop.create({
      temperature,
      humidity,
      crop,
    });

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
    const history = await Crop.find().sort({ date: -1 }).limit(20);
    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

export default router;

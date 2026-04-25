import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  crop: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("Crop", cropSchema);
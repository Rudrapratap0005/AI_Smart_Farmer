import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    default: "",
  },
  avatarUrl: {
    type: String,
    default: "",
  },
  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  firebaseUid: {
    type: String,
    default: "",
  },
  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    locale: {
      type: String,
      default: "en",
    },
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);

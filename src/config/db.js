import mongoose from "mongoose";

export async function connectToDatabase() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI");
  }

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
}

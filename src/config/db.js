import mongoose from "mongoose";

let isConnecting = false;

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function connectToDatabase() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI");
  }

  if (isDatabaseReady()) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return mongoose.connection;
  }

  isConnecting = true;

  try {
    await mongoose.connect(MONGO_URI);
  } finally {
    isConnecting = false;
  }

  console.log("MongoDB connected");

  return mongoose.connection;
}

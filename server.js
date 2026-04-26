import "./src/config/bootstrapEnv.js";
import app from "./src/app.js";
import { connectToDatabase } from "./src/config/db.js";

const PORT = Number(process.env.PORT) || 5000;
const requiredEnvVars = ["JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

if (!process.env.JWT_SECRET && !process.env.MONGO_URI && !process.env.OPENWEATHER_API_KEY) {
  console.warn("No .env file was found.");
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function connectWithRetry() {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is missing. Running with local JSON storage.");
    return;
  }

  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Failed to connect to MongoDB. Using local JSON storage for now.", error);
  }
}

server.on("error", (error) => {
  console.error("Failed to start HTTP server", error);
  process.exit(1);
});

connectWithRetry();

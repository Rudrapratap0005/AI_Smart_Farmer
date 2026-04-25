import dotenv from "dotenv";
import app from "./src/app.js";
import { connectToDatabase } from "./src/config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

async function connectWithRetry() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Failed to connect to MongoDB. Retrying in 5 seconds.", error);
    setTimeout(connectWithRetry, 5000);
  }
}

server.on("error", (error) => {
  console.error("Failed to start HTTP server", error);
  process.exit(1);
});

connectWithRetry();

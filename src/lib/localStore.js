import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJson(fileName, fallbackValue) {
  await ensureDataDir();
  const filePath = path.join(dataDir, fileName);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeJson(fileName, fallbackValue);
      return fallbackValue;
    }

    throw error;
  }
}

async function writeJson(fileName, value) {
  await ensureDataDir();
  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function readUsers() {
  return readJson("users.json", []);
}

export async function writeUsers(users) {
  return writeJson("users.json", users);
}

export async function readPredictions() {
  return readJson("predictions.json", []);
}

export async function writePredictions(predictions) {
  return writeJson("predictions.json", predictions);
}

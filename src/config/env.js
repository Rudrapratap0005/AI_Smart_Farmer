import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const rootDir = process.cwd();

export function loadEnvironment() {
  const envFile = path.join(rootDir, ".env");

  if (!fs.existsSync(envFile)) {
    return null;
  }

  dotenv.config({
    path: envFile,
    override: false,
  });

  return envFile;
}

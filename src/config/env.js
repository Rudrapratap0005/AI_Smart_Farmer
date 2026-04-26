import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const rootDir = process.cwd();

function resolveEnvFiles() {
  const nodeEnv = process.env.NODE_ENV?.trim();
  const candidates = [
    nodeEnv ? `.env.${nodeEnv}.local` : null,
    ".env.local",
    nodeEnv ? `.env.${nodeEnv}` : null,
    ".env",
  ].filter(Boolean);

  return candidates
    .map((fileName) => path.join(rootDir, fileName))
    .filter((filePath) => fs.existsSync(filePath));
}

export function loadEnvironment() {
  const envFiles = resolveEnvFiles();

  envFiles.forEach((filePath) => {
    dotenv.config({
      path: filePath,
      override: false,
    });
  });

  return envFiles;
}

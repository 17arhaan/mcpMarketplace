import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".mcp");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface CliConfig {
  apiKey?: string;
  apiUrl: string;
}

const DEFAULTS: CliConfig = {
  apiUrl: "http://localhost:8000",
};

export function loadConfig(): CliConfig {
  if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config: Partial<CliConfig>): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const current = loadConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...config }, null, 2));
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

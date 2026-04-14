import axios, { AxiosInstance } from "axios";
import { loadConfig } from "./config";

export function createClient(): AxiosInstance {
  const config = loadConfig();
  return axios.create({
    baseURL: config.apiUrl,
    headers: config.apiKey ? { "X-API-Key": config.apiKey } : {},
  });
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  latest_version: string | null;
  install_count: number;
  avg_rating: number | null;
  status: string;
}

export interface ToolManifest {
  slug: string;
  version: string;
  mcp_schema: Record<string, unknown>;
  checksum: string;
  download_url: string;
}

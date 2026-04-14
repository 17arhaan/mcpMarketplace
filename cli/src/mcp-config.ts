import fs from "fs";
import path from "path";
import os from "os";

const MCP_CONFIG_PATHS = [
  path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json"),
  path.join(os.homedir(), ".config", "claude", "claude_desktop_config.json"),
  path.join(process.cwd(), "mcp.json"),
];

export interface McpServerEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerEntry>;
}

export function findMcpConfigPath(): string {
  for (const p of MCP_CONFIG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  // Default to local mcp.json
  return path.join(process.cwd(), "mcp.json");
}

export function loadMcpConfig(configPath?: string): McpConfig {
  const p = configPath || findMcpConfigPath();
  if (!fs.existsSync(p)) return { mcpServers: {} };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { mcpServers: {} };
  }
}

export function saveMcpConfig(config: McpConfig, configPath?: string): void {
  const p = configPath || findMcpConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2));
}

export function addServerEntry(slug: string, entry: McpServerEntry, configPath?: string): void {
  const config = loadMcpConfig(configPath);
  config.mcpServers[slug] = entry;
  saveMcpConfig(config, configPath);
}

export function removeServerEntry(slug: string, configPath?: string): void {
  const config = loadMcpConfig(configPath);
  delete config.mcpServers[slug];
  saveMcpConfig(config, configPath);
}

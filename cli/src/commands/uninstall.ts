import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import os from "os";
import { removeServerEntry } from "../mcp-config";

const TOOLS_DIR = path.join(os.homedir(), ".mcp", "tools");

export const uninstallCommand = new Command("uninstall")
  .description("Remove an installed MCP tool")
  .argument("<slug>", "Tool slug to uninstall")
  .action((slug: string) => {
    const toolDir = path.join(TOOLS_DIR, slug);

    if (fs.existsSync(toolDir)) {
      fs.rmSync(toolDir, { recursive: true, force: true });
    }

    removeServerEntry(slug);
    console.log(chalk.green(`Uninstalled ${chalk.cyan(slug)} and removed from mcp.json`));
  });

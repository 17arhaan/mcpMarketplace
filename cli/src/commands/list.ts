import { Command } from "commander";
import chalk from "chalk";
import { loadMcpConfig } from "../mcp-config";

export const listCommand = new Command("list")
  .alias("ls")
  .description("List installed MCP tools")
  .action(() => {
    const config = loadMcpConfig();
    const servers = Object.entries(config.mcpServers);

    if (servers.length === 0) {
      console.log(chalk.yellow("No tools installed. Run: mcp-get install <slug>"));
      return;
    }

    console.log(chalk.bold(`\nInstalled tools (${servers.length}):\n`));
    for (const [slug, entry] of servers) {
      console.log(`  ${chalk.cyan(slug.padEnd(25))} ${chalk.gray(entry.args.join(" "))}`);
    }
    console.log();
  });

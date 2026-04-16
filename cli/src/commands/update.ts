import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadMcpConfig } from "../mcp-config";
import { createClient } from "../api";
import { installCommand } from "./install";

export const updateCommand = new Command("update")
  .description("Update all installed tools to their latest versions")
  .action(async () => {
    const config = loadMcpConfig();
    const slugs = Object.keys(config.mcpServers);

    if (slugs.length === 0) {
      console.log(chalk.yellow("No tools installed."));
      return;
    }

    const client = createClient();
    const spinner = ora("Checking for updates...").start();
    let updated = 0;

    for (const slug of slugs) {
      try {
        const res = await client.get(`/tools/${slug}/latest`);
        const latest = res.data;
        spinner.text = `Updating ${chalk.cyan(slug)} to v${latest.version}...`;
        await installCommand.parseAsync([slug], { from: "user" });
        updated++;
      } catch {
        spinner.text = `Skipping ${slug} — not found in registry`;
      }
    }

    spinner.stop();
    if (updated > 0) {
      console.log(chalk.green(`Updated ${updated} tool(s) to latest versions.`));
    } else {
      console.log(chalk.gray("All tools are up to date."));
    }
  });

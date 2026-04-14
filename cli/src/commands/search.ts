import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { createClient, Tool } from "../api";

export const searchCommand = new Command("search")
  .description("Search for MCP tools")
  .argument("<query>", "Search query")
  .option("--tag <tag>", "Filter by tag")
  .option("--sort <sort>", "Sort by: installs, rating, newest", "installs")
  .option("--limit <n>", "Results per page", "10")
  .action(async (query: string, opts) => {
    const client = createClient();
    const spinner = ora("Searching...").start();

    try {
      const res = await client.get("/tools", {
        params: { q: query, tag: opts.tag, sort: opts.sort, limit: opts.limit },
      });
      spinner.stop();

      const { tools, total }: { tools: Tool[]; total: number } = res.data;

      if (tools.length === 0) {
        console.log(chalk.yellow("No tools found."));
        return;
      }

      console.log(chalk.bold(`\nFound ${total} tool(s):\n`));
      for (const tool of tools) {
        const rating = tool.avg_rating ? chalk.yellow(`★ ${tool.avg_rating.toFixed(1)}`) : chalk.gray("no ratings");
        console.log(
          `${chalk.cyan(tool.slug.padEnd(25))} ${chalk.white(tool.name.padEnd(30))} ` +
          `${chalk.gray(tool.install_count + " installs")}  ${rating}`
        );
        console.log(`  ${chalk.gray(tool.description)}\n`);
      }
    } catch (err: unknown) {
      spinner.fail(chalk.red("Search failed"));
      process.exit(1);
    }
  });

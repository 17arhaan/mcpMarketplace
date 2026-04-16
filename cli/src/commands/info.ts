import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { createClient } from "../api";

export const infoCommand = new Command("info")
  .description("Show full details for a tool")
  .argument("<slug>", "Tool slug")
  .action(async (slug: string) => {
    const client = createClient();
    const spinner = ora(`Fetching ${slug}...`).start();

    try {
      const res = await client.get(`/tools/${slug}`);
      spinner.stop();
      const tool = res.data;

      console.log();
      console.log(chalk.bold.cyan(tool.slug) + chalk.gray(` — ${tool.name}`));
      console.log(chalk.white(tool.description));
      console.log();
      console.log(`  ${chalk.gray("Status:")}    ${statusColor(tool.status)}`);
      console.log(`  ${chalk.gray("Version:")}   ${tool.latest_version || "none"}`);
      console.log(`  ${chalk.gray("Installs:")}  ${tool.install_count.toLocaleString()}`);
      console.log(`  ${chalk.gray("Rating:")}    ${tool.avg_rating ? `★ ${tool.avg_rating.toFixed(1)}` : "no ratings"}`);
      console.log();

      if (tool.versions && tool.versions.length > 0) {
        console.log(chalk.bold("  Versions:"));
        for (const v of tool.versions) {
          const badge = sandboxBadge(v.sandbox_status);
          const date = new Date(v.published_at).toLocaleDateString();
          console.log(`    ${chalk.white(`v${v.version}`.padEnd(12))} ${badge}  ${chalk.gray(date)}`);
        }
        console.log();
      }

      console.log(chalk.gray(`  Install: mcp-get install ${tool.slug}`));
      console.log();
    } catch {
      spinner.fail(chalk.red(`Tool "${slug}" not found`));
      process.exit(1);
    }
  });

function statusColor(status: string): string {
  const colors: Record<string, (s: string) => string> = {
    active: chalk.green,
    draft: chalk.yellow,
    deprecated: chalk.red,
    removed: chalk.gray,
  };
  return (colors[status] || chalk.white)(status);
}

function sandboxBadge(status: string): string {
  const badges: Record<string, string> = {
    passed: chalk.green("✓ passed"),
    failed: chalk.red("✗ failed"),
    pending: chalk.yellow("● pending"),
    running: chalk.blue("◉ running"),
  };
  return badges[status] || chalk.gray(status);
}

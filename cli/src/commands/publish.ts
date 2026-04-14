import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import tar from "tar";
import os from "os";
import { loadConfig } from "../config";

export const publishCommand = new Command("publish")
  .description("Publish an MCP tool to the marketplace")
  .argument("[dir]", "Tool directory", ".")
  .action(async (dir: string) => {
    const toolDir = path.resolve(dir);
    const manifestPath = path.join(toolDir, "mcp.json");

    if (!fs.existsSync(manifestPath)) {
      console.error(chalk.red(`No mcp.json found in ${toolDir}`));
      process.exit(1);
    }

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      console.error(chalk.red("Invalid mcp.json"));
      process.exit(1);
    }

    const required = ["name", "version", "description"];
    for (const field of required) {
      if (!manifest[field]) {
        console.error(chalk.red(`mcp.json is missing required field: ${field}`));
        process.exit(1);
      }
    }

    const slug = (manifest.name as string).toLowerCase().replace(/\s+/g, "-");
    const spinner = ora(`Packaging ${chalk.cyan(slug)}@${manifest.version}...`).start();

    // Tarball the directory
    const tmpTarball = path.join(os.tmpdir(), `mcp-publish-${slug}.tar.gz`);
    await tar.create(
      {
        gzip: true,
        file: tmpTarball,
        cwd: toolDir,
        filter: (p) => !p.includes("node_modules") && !p.includes(".git"),
      },
      ["."]
    );

    spinner.text = `Uploading ${chalk.cyan(slug)}@${manifest.version}...`;
    const config = loadConfig();

    if (!config.apiKey) {
      spinner.fail(chalk.red("Not logged in. Run: mcp-get login"));
      process.exit(1);
    }

    const form = new FormData();
    form.append("name", manifest.name as string);
    form.append("slug", manifest.slug as string || slug);
    form.append("description", manifest.description as string);
    form.append("version", manifest.version as string);
    form.append("mcp_schema", JSON.stringify(manifest));
    form.append("tarball", fs.createReadStream(tmpTarball), {
      filename: "tool.tar.gz",
      contentType: "application/gzip",
    });

    try {
      await axios.post(`${config.apiUrl}/tools`, form, {
        headers: { ...form.getHeaders(), "X-API-Key": config.apiKey },
      });
      fs.unlinkSync(tmpTarball);
      spinner.succeed(
        chalk.green(`Published! Your tool is being validated by the sandbox.`) +
        chalk.gray("\nRun: mcp-get info " + slug + " to check status.")
      );
    } catch (err: unknown) {
      fs.unlinkSync(tmpTarball);
      spinner.fail(chalk.red("Publish failed"));
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data?.detail ?? err.message);
      }
      process.exit(1);
    }
  });

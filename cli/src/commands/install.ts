import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import tar from "tar";
import { createClient, ToolManifest } from "../api";
import { addServerEntry } from "../mcp-config";

const TOOLS_DIR = path.join(os.homedir(), ".mcp", "tools");

export const installCommand = new Command("install")
  .description("Install an MCP tool")
  .argument("<slug[@version]>", "Tool slug, optionally with version pin e.g. weather@1.0.0")
  .action(async (slugArg: string) => {
    const [slug, version] = slugArg.split("@");
    const client = createClient();
    const spinner = ora(`Fetching manifest for ${chalk.cyan(slug)}...`).start();

    let manifest: ToolManifest;
    try {
      const endpoint = version ? `/tools/${slug}/${version}` : `/tools/${slug}/latest`;
      const res = await client.get(endpoint);
      manifest = res.data;
    } catch {
      spinner.fail(chalk.red(`Tool "${slug}" not found`));
      process.exit(1);
    }

    // Log the install
    try {
      await client.post("/installs", { tool_id: manifest.slug, version: manifest.version }).catch(() => {});
    } catch {}

    spinner.text = `Downloading ${chalk.cyan(slug)}@${manifest.version}...`;

    // Download tarball from presigned URL
    const tmpPath = path.join(os.tmpdir(), `mcp-${slug}-${manifest.version}.tar.gz`);
    try {
      const dlRes = await axios.get(manifest.download_url, { responseType: "arraybuffer" });
      fs.writeFileSync(tmpPath, Buffer.from(dlRes.data));
    } catch {
      spinner.fail(chalk.red("Download failed"));
      process.exit(1);
    }

    // Verify checksum
    spinner.text = "Verifying checksum...";
    const actualChecksum = crypto.createHash("sha256").update(fs.readFileSync(tmpPath)).digest("hex");
    if (actualChecksum !== manifest.checksum) {
      spinner.fail(chalk.red("Checksum mismatch — aborting install"));
      fs.unlinkSync(tmpPath);
      process.exit(1);
    }

    // Extract
    const installDir = path.join(TOOLS_DIR, slug);
    fs.mkdirSync(installDir, { recursive: true });
    spinner.text = "Extracting...";
    await tar.extract({ file: tmpPath, cwd: installDir, strip: 1 });
    fs.unlinkSync(tmpPath);

    // Detect entry point and inject into mcp.json
    const schema = manifest.mcp_schema as { entry?: string };
    const entry = schema.entry || "server.js";
    const entryPath = path.join(installDir, entry);
    const isPython = entry.endsWith(".py");
    const command = isPython ? "python" : "node";

    addServerEntry(slug, { command, args: [entryPath] });

    spinner.succeed(
      chalk.green(`Installed ${chalk.cyan(slug)}@${manifest.version}`) +
      chalk.gray(" → injected into mcp.json")
    );
    console.log(chalk.gray(`  Entry: ${entryPath}`));
  });

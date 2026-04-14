import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import axios from "axios";
import { loadConfig, saveConfig } from "../config";

export const loginCommand = new Command("login")
  .description("Authenticate and generate an API key")
  .action(async () => {
    const config = loadConfig();

    const { email, password } = await inquirer.prompt([
      { name: "email", type: "input", message: "Email:" },
      { name: "password", type: "password", message: "Password:" },
    ]);

    const spinner = ora("Logging in...").start();
    try {
      const loginRes = await axios.post(`${config.apiUrl}/auth/login`, { email, password });
      const { jwt } = loginRes.data;

      spinner.text = "Generating API key...";
      const keyRes = await axios.post(
        `${config.apiUrl}/auth/api-key`,
        {},
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const { api_key } = keyRes.data;

      saveConfig({ apiKey: api_key });
      spinner.succeed(chalk.green("Logged in successfully. API key saved to ~/.mcp/config.json"));
    } catch (err: unknown) {
      spinner.fail(chalk.red("Login failed"));
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data?.detail ?? err.message);
      }
      process.exit(1);
    }
  });

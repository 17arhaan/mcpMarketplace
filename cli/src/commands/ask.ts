import { Command } from "commander";
import Anthropic from "@anthropic-ai/sdk";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { createClient } from "../api";
import { loadConfig } from "../config";

const SYSTEM_PROMPT = `You are a helpful assistant for the MCP Marketplace — a registry of Model Context Protocol tools that give AI agents pluggable capabilities.

When a user describes what they need, use the search_tools function to find relevant tools in the registry. Then recommend the best match and explain why it fits their use case. Keep responses concise and practical.

If no tools match well, say so honestly. Do not invent tools that don't exist in the registry.`;

export const askCommand = new Command("ask")
  .description("Describe what you need — AI finds and installs the right tool")
  .argument("<query>", "What capability do you need? e.g. 'query my postgres database'")
  .option("--no-install", "Just recommend, don't offer to install")
  .action(async (query: string, opts) => {
    const cliConfig = loadConfig();

    if (!process.env.AI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.error(chalk.red("AI_API_KEY environment variable not set."));
      process.exit(1);
    }

    const anthropic = new Anthropic();
    const registryClient = createClient();

    const tools: Anthropic.Tool[] = [
      {
        name: "search_tools",
        description: "Search the MCP Marketplace registry for tools matching a query. Returns a list of available tools with name, description, and install count.",
        input_schema: {
          type: "object" as const,
          properties: {
            query: {
              type: "string",
              description: "Search terms to find relevant tools",
            },
            sort: {
              type: "string",
              enum: ["installs", "rating", "newest"],
              description: "How to sort results",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_tool_detail",
        description: "Get full details about a specific tool including its versions and MCP schema.",
        input_schema: {
          type: "object" as const,
          properties: {
            slug: {
              type: "string",
              description: "The tool's slug identifier e.g. 'weather' or 'postgres-query'",
            },
          },
          required: ["slug"],
        },
      },
    ];

    const spinner = ora("Thinking...").start();

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: query },
    ];

    let recommendedSlug: string | null = null;

    // Agentic loop — searches the registry until it has enough info
    while (true) {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      if (response.stop_reason === "end_turn") {
        spinner.stop();
        for (const block of response.content) {
          if (block.type === "text") {
            console.log("\n" + chalk.white(block.text));
          }
        }
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          let result: string;

          if (toolUse.name === "search_tools") {
            const input = toolUse.input as { query: string; sort?: string };
            spinner.text = `Searching for "${input.query}"...`;
            try {
              const res = await registryClient.get("/tools", {
                params: { q: input.query, sort: input.sort || "installs", limit: 5 },
              });
              const { tools: found, total } = res.data;
              if (found.length === 0) {
                result = "No tools found for this query.";
              } else {
                result = `Found ${total} tool(s):\n` + found.map((t: {
                  slug: string;
                  name: string;
                  description: string;
                  install_count: number;
                  avg_rating: number | null;
                }) =>
                  `- ${t.slug}: ${t.description} (${t.install_count} installs${t.avg_rating ? `, ★${t.avg_rating}` : ""})`
                ).join("\n");
                // Track the first result as a likely recommendation
                if (!recommendedSlug && found.length > 0) {
                  recommendedSlug = found[0].slug;
                }
              }
            } catch {
              result = "Registry search failed. API may not be running.";
            }
          } else if (toolUse.name === "get_tool_detail") {
            const input = toolUse.input as { slug: string };
            spinner.text = `Getting details for ${input.slug}...`;
            try {
              const res = await registryClient.get(`/tools/${input.slug}`);
              const tool = res.data;
              recommendedSlug = tool.slug;
              result = JSON.stringify({
                slug: tool.slug,
                name: tool.name,
                description: tool.description,
                latest_version: tool.latest_version,
                install_count: tool.install_count,
                avg_rating: tool.avg_rating,
                versions: tool.versions?.length ?? 0,
              });
            } catch {
              result = `Tool "${input.slug}" not found.`;
            }
          } else {
            result = "Unknown tool.";
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unexpected stop reason
      spinner.stop();
      break;
    }

    // Offer to install the recommended tool
    if (opts.install && recommendedSlug && cliConfig.apiKey) {
      const { shouldInstall } = await inquirer.prompt([
        {
          name: "shouldInstall",
          type: "confirm",
          message: `Install ${chalk.cyan(recommendedSlug)} now?`,
          default: true,
        },
      ]);

      if (shouldInstall) {
        const { installCommand } = await import("./install");
        await installCommand.parseAsync([recommendedSlug], { from: "user" });
      }
    } else if (opts.install && recommendedSlug && !cliConfig.apiKey) {
      console.log(chalk.gray(`\nTo install: mcp-get install ${recommendedSlug}`));
    }
  });

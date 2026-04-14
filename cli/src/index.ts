#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { searchCommand } from "./commands/search";
import { installCommand } from "./commands/install";
import { publishCommand } from "./commands/publish";
import { listCommand } from "./commands/list";

const program = new Command();

program
  .name("mcp-get")
  .description("MCP Tool Marketplace CLI")
  .version("0.1.0");

program.addCommand(loginCommand);
program.addCommand(searchCommand);
program.addCommand(installCommand);
program.addCommand(publishCommand);
program.addCommand(listCommand);

program.parse(process.argv);

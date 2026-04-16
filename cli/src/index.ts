#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login";
import { searchCommand } from "./commands/search";
import { installCommand } from "./commands/install";
import { uninstallCommand } from "./commands/uninstall";
import { publishCommand } from "./commands/publish";
import { listCommand } from "./commands/list";
import { infoCommand } from "./commands/info";
import { updateCommand } from "./commands/update";
import { askCommand } from "./commands/ask";

const program = new Command();

program
  .name("mcp-get")
  .description("MCP Tool Marketplace CLI")
  .version("0.1.0");

program.addCommand(loginCommand);
program.addCommand(searchCommand);
program.addCommand(installCommand);
program.addCommand(uninstallCommand);
program.addCommand(publishCommand);
program.addCommand(listCommand);
program.addCommand(infoCommand);
program.addCommand(updateCommand);
program.addCommand(askCommand);

program.parse(process.argv);

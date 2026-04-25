# mcp-get

CLI for the [MCP Tool Marketplace](https://github.com/17arhaan/mcpMarketplace) — discover, install, and publish Model Context Protocol tools.

## Install

```bash
npm install -g mcp-get
```

## Usage

```bash
# Authenticate
mcp-get login

# Browse the registry
mcp-get search weather
mcp-get info weather

# Install a tool (downloads, verifies checksum, injects into mcp.json)
mcp-get install weather
mcp-get install weather@1.0.0    # specific version

# Manage installed tools
mcp-get list
mcp-get update
mcp-get uninstall weather

# Publish your own tool
mcp-get publish ./my-tool

# AI-powered discovery (requires AI_API_KEY)
mcp-get ask "I need a tool to query databases"
```

## Configuration

Config is stored at `~/.mcp/config.json`. The CLI reads your `mcp.json` to manage installed tool entries.

## Publishing a tool

Your tool directory needs an `mcp.json` manifest:

```json
{
  "name": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py"
}
```

Run `mcp-get publish ./my-tool` — the tool is packaged, uploaded, and validated in a Docker sandbox before going live.

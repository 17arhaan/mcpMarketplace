# MCP Marketplace

> The registry for [Model Context Protocol](https://modelcontextprotocol.io) tools — discover, publish, and install MCP servers that give your AI agents real capabilities.
---

## What it is

MCP Marketplace is a platform where developers publish MCP servers as versioned, sandboxed packages — and where AI builders find and install the exact tool their agent needs.

Every tool published here is automatically validated in an isolated Docker container before going live. No broken packages, no surprises.

---

## Features

**For AI builders**
- Browse and search hundreds of MCP tools
- AI-powered discovery — describe what you need in plain English, get the right tool
- One-command install via the CLI
- Star ratings and community reviews on every tool

**For MCP developers**
- Publish from the browser or CLI
- Automatic sandbox validation (Docker, 256 MB limit, no network, 30s timeout)
- Versioned releases with SHA-256 checksums
- Instant listing after sandbox passes

**Platform**
- Supabase Auth — login with email, session auto-refresh
- Username shown across the platform
- All interactive features gated behind auth
- Full-text search with Postgres `tsvector`
- Redis-backed caching

---

## CLI

```bash
npm install -g mcp-get
```

| Command | What it does |
|---|---|
| `mcp-get login` | Authenticate with your account |
| `mcp-get search <query>` | Search the registry |
| `mcp-get install <slug>` | Install a tool |
| `mcp-get uninstall <slug>` | Remove a tool |
| `mcp-get update` | Update all installed tools |
| `mcp-get publish <dir>` | Publish a tool to the registry |
| `mcp-get info <slug>` | View tool details and sandbox status |
| `mcp-get list` | List installed tools |
| `mcp-get ask "<query>"` | AI-powered tool discovery |

---

## AI Discovery

```bash
mcp-get ask "I need to query a Postgres database"
mcp-get ask "Find me a tool to search GitHub repos"
mcp-get ask "What tools can fetch web pages?"
```

Also available at [/discover](https://mcpmarketplace-six.vercel.app/discover) — requires login.

Powered by Claude with tool-use — searches the live registry, evaluates options, and recommends the best match with an install command.

---

## Publishing a tool

```bash
# 1. create your MCP server
# 2. add mcp.json to the root:
{
  "name": "my-tool",
  "slug": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py"
}

# 3. publish
mcp-get publish ./my-tool
```

Or publish directly from the browser at [/publish](https://mcpmarketplace-six.vercel.app/publish).

Every submission goes through an isolated Docker sandbox. Status is visible via `mcp-get info <slug>`.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, Redis |
| Auth | Supabase Auth + custom JWT exchange |
| Storage | Supabase S3-compatible storage |
| Sandbox | Docker (isolated, network-disabled, memory-limited) |
| AI | Anthropic Claude, tool-use agentic loop |
| Deploy | Vercel (web) · Railway (api) |

---

## License

[AGPL-3.0](LICENSE) — use it, modify it, but keep it open. Any hosted version must publish its source.

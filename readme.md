# MCP Marketplace

A registry for [Model Context Protocol](https://modelcontextprotocol.io) tools. Publish, discover, and install MCP servers with a single command.

```bash
mcp-get install weather
mcp-get ask "I need a tool to query databases"
```

---

## Stack

FastAPI | TypeScript CLI | Next.js 16 | PostgreSQL | Redis | S3 | Docker Sandbox

---

## Quick start

### Prerequisites

- Docker Desktop
- Python 3.12+
- Node.js 20+

### 1. Infrastructure

```bash
cd infra && docker compose up -d
```

### 2. API

```bash
cd api
cp .env.example .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

### 3. Web UI

```bash
cd web && npm install && npm run dev
```

### 4. CLI

```bash
cd cli && npm install && npm run build && npm link
```

### 5. Try it

```bash
mcp-get login
mcp-get publish ./tools/weather
mcp-get search weather
mcp-get install weather
```

---

## CLI

| Command | Description |
|---|---|
| `mcp-get login` | Authenticate |
| `mcp-get search <query>` | Search the registry |
| `mcp-get install <slug>` | Install a tool |
| `mcp-get uninstall <slug>` | Remove a tool |
| `mcp-get update` | Update all tools |
| `mcp-get publish <dir>` | Publish a tool |
| `mcp-get info <slug>` | Tool details |
| `mcp-get list` | Installed tools |
| `mcp-get ask "<query>"` | AI-powered discovery |

---

## AI Discovery

Describe what you need in plain English — an agentic AI loop searches the registry, evaluates tools, and recommends the best fit.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
mcp-get ask "I need to search GitHub repositories"
```

Also available at `http://localhost:3000/discover`.

---

## Publishing

Add `mcp.json` to your tool directory:

```json
{
  "name": "my-tool",
  "slug": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py"
}
```

```bash
mcp-get publish ./my-tool
```

Tools are validated in an isolated Docker sandbox before going live.

---

## Testing

```bash
./scripts/e2e-test.sh
```

---

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

You may use, modify, and distribute this software, but any modified version — including use over a network (e.g., as a hosted service) — must also be released under AGPL-3.0 with full source code.

See [LICENSE](LICENSE) for full terms.

# MCP Marketplace

An npm-style registry for [Model Context Protocol](https://modelcontextprotocol.io) tools — the emerging standard for giving AI agents pluggable capabilities. Developers publish MCP servers to the registry; others discover and install them with a CLI.

```
mcp-get search weather
mcp-get install weather
mcp-get publish ./my-tool
```

---

## What is this?

MCP (Model Context Protocol) lets AI agents like Claude call external tools — search GitHub, query a database, fetch a URL. But there's no central place to share them. MCP Marketplace fills that gap: a registry where developers publish tool servers and anyone can install them with one command.

Every published tool runs in an isolated Docker sandbox before going live. No broken tools, no malicious code.

---

## Stack

| Layer | Tech |
|---|---|
| Registry API | FastAPI (Python) |
| CLI | TypeScript + commander.js |
| Web UI | Next.js 16 (App Router) |
| Database | PostgreSQL + `pg_trgm` for full-text search |
| Cache / rate limiting | Redis |
| Object storage | S3-compatible (MinIO locally, AWS S3 in prod) |
| Sandbox | Docker — isolated, network-disabled, 30s timeout |
| Auth | JWT (web) + API keys (CLI) |

---

## Project structure

```
mcp-marketplace/
├── api/                  # FastAPI backend
│   ├── routers/          # tools, auth, installs, ratings
│   ├── models/           # SQLAlchemy ORM
│   ├── schemas/          # Pydantic request/response
│   └── services/         # auth, storage (S3), sandbox (Docker)
├── cli/                  # mcp-get CLI (TypeScript)
│   └── src/commands/     # install, publish, search, login, list, info, update, uninstall, ask
├── web/                  # Next.js browse UI
│   └── app/
│       ├── page.tsx              # search + browse
│       ├── tools/[slug]/page.tsx # tool detail + versions
│       ├── discover/page.tsx     # AI-powered tool discovery chat
│       └── publish/page.tsx      # publish guide
├── infra/
│   ├── docker-compose.yml        # local Postgres + Redis + MinIO
│   ├── init.sql                  # schema + indexes
│   ├── Dockerfile.sandbox        # tool validation container
│   ├── Dockerfile.api            # production API image
│   └── runner.py                 # sandbox runner script
└── tools/
    ├── weather/                  # weather lookup (Open-Meteo, no key)
    ├── calculator/               # math expression evaluator
    ├── web-fetch/                # fetch & extract web page text
    └── github-search/            # search GitHub repos & code
```

---

## Quick start

### Prerequisites

- Docker Desktop
- Python 3.11+
- Node.js 20+

### 1. Start local infrastructure

```bash
cd infra
docker compose up -d
```

This starts Postgres on `5432`, Redis on `6379`, and MinIO on `9000` (console at `9001`).

### 2. Start the API

```bash
cd api
cp .env.example .env
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Start the web UI

```bash
cd web
npm install
npm run dev
```

Opens at `http://localhost:3000`.

### 4. Set up the CLI

```bash
cd cli
npm install
npm run build
npm link          # makes mcp-get available globally
```

### 5. Try it

```bash
mcp-get login
mcp-get publish ./tools/weather
mcp-get search weather
mcp-get install weather
mcp-get list
```

---

## CLI commands

| Command | Description |
|---|---|
| `mcp-get login` | Authenticate and save API key to `~/.mcp/config.json` |
| `mcp-get search <query>` | Full-text search the registry |
| `mcp-get install <slug>` | Download, verify, extract, and inject into `mcp.json` |
| `mcp-get install <slug@version>` | Install a specific version |
| `mcp-get publish <dir>` | Package and publish a tool from a directory |
| `mcp-get list` | Show all installed tools |
| `mcp-get uninstall <slug>` | Remove a tool from `mcp.json` and delete local files |
| `mcp-get update` | Update all installed tools to their latest versions |
| `mcp-get info <slug>` | Full tool detail — versions, ratings, sandbox status |
| `mcp-get ask "<query>"` | AI-powered discovery — describe what you need in natural language |

---

## AI-powered tool discovery

Describe what your agent needs in plain English — Claude searches the registry, evaluates the results, and recommends the best tool:

**CLI:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
mcp-get ask "I need to query my Postgres database"
# → Recommends postgres-query, explains why, offers to install
```

**Web UI:** Visit `http://localhost:3000/discover` for a chat interface that does the same thing.

Under the hood, Claude uses tool-use to call the registry's search and detail APIs in an agentic loop — searching, reading tool schemas, and reasoning about which tool best fits your use case before recommending it.

---

## Publishing a tool

Add `mcp.json` to your tool directory:

```json
{
  "name": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.js",
  "tools": [
    {
      "name": "my_function",
      "description": "What this function does",
      "inputSchema": {
        "type": "object",
        "properties": {
          "param": { "type": "string" }
        },
        "required": ["param"]
      }
    }
  ]
}
```

Then:

```bash
mcp-get login
mcp-get publish ./my-tool
```

Your tool enters a Docker sandbox — no network access, 256 MB RAM, 30-second timeout. If it passes, it goes live automatically.

---

## API reference

Full OpenAPI docs at `http://localhost:8000/docs` when running locally.

| Endpoint | Description |
|---|---|
| `GET /tools?q=&sort=&tag=` | Browse and search tools |
| `GET /tools/tags` | List all available tags |
| `GET /tools/{slug}` | Tool detail + all versions |
| `GET /tools/{slug}/latest` | Manifest + presigned download URL |
| `GET /tools/{slug}/{version}` | Specific version manifest + download URL |
| `POST /tools` | Publish a new tool (multipart: tarball + metadata) |
| `POST /tools/{slug}/versions` | Publish a new version of an existing tool |
| `DELETE /tools/{slug}` | Deprecate a tool (author only) |
| `POST /auth/register` | Create account |
| `POST /auth/login` | Returns JWT |
| `POST /auth/api-key` | Generate CLI API key (returned once) |
| `POST /installs` | Log an install |
| `POST /ratings` | Rate a tool (1–5, one per user) |

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://mcp:mcp@localhost:5432/mcp` | Postgres connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `S3_BUCKET` | `mcp-tools-dev` | Bucket for tool tarballs |
| `S3_ENDPOINT` | `http://localhost:9000` | MinIO endpoint (local) |
| `S3_ACCESS_KEY` | `minioadmin` | S3 access key |
| `S3_SECRET_KEY` | `minioadmin` | S3 secret key |
| `JWT_SECRET` | — | Random 32-byte hex string |
| `DOCKER_HOST` | `unix:///var/run/docker.sock` | Docker socket for sandbox |

---

## Build phases

- [x] **Phase 1** — FastAPI skeleton, auth, tool CRUD, local infra
- [x] **Phase 2** — S3 upload/download, CLI install & publish, checksum verification
- [x] **Phase 3** — Docker sandbox validation pipeline, status updates, seed tools
- [x] **Phase 4** — Full-text search (pg_trgm), Redis caching, rate limiting, ratings, tag filtering
- [ ] **Phase 5** — CI/CD pipeline, npm publish prep, end-to-end testing

See [GitHub Issues](https://github.com/17arhaan/mcpMarketplace/issues) for detailed task breakdowns.

---

## Security

- Tool packages are **never executed on the API server**. All validation runs inside a Docker container.
- Containers have no network access, read-only filesystem (except `/tmp`), 256 MB memory cap, and run as a non-root user.
- API keys are stored as SHA-256 hashes. The raw key is returned exactly once and never logged.
- Passwords are bcrypt-hashed.

# MCP Tool Marketplace
### Architecture & Design Reference

> Complete technical documentation for building the MCP ecosystem's tool registry — npm for AI agent capabilities.

| Build time | Stack | Resume impact |
|---|---|---|
| 4–6 weeks | FastAPI · TypeScript · PostgreSQL | Very high |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [API Contract](#4-api-contract)
5. [Auth Service](#5-auth-service)
6. [CLI Design](#6-cli-design)
7. [Docker Sandbox](#7-docker-sandbox)
8. [Folder Structure](#8-folder-structure)
9. [Build Phases](#9-build-phases)
10. [Resume & Interview Framing](#10-resume--interview-framing)
11. [Quick Start](#11-quick-start)

---

## 1. Project Overview

MCP Tool Marketplace is an npm-style registry for Model Context Protocol tools — the emerging standard for giving AI agents pluggable capabilities. Developers publish MCP servers (tools) to the registry; other developers discover and install them with a CLI. The result is a growing ecosystem of reusable agent capabilities.

> **Why now?** MCP was open-sourced in late 2024 and adoption is growing rapidly. There is no centralised registry yet. This project fills that gap before the ecosystem matures.

### Core user flows

- **Publish:** `mcp-get publish` → backend validates → Docker sandbox runs it → listed publicly
- **Install:** `mcp-get install github-search` → manifest downloaded → injected into `mcp.json` → tool available to agent
- **Browse:** web UI with search, tags, install count, and ratings

### Technology choices

| Component | Choice & rationale |
|---|---|
| Registry API | FastAPI (Python) — async, fast, great OpenAPI generation |
| CLI | TypeScript + commander.js — familiar to npm users, typed API client |
| Database | PostgreSQL with `pg_trgm` extension for full-text search |
| Cache & rate limit | Redis — install counts, search result caching |
| Object storage | S3-compatible (AWS S3 or MinIO locally) |
| Sandbox | Docker — isolated, time-limited tool validation |
| Web UI | Next.js — SSR for SEO, fast browse experience |
| Auth | JWT for web, API keys for CLI (SHA-256 hashed in DB) |

---

## 2. System Architecture

Three layers: the developer's local machine running the CLI, the hosted registry API, and backend storage + sandbox infrastructure.

```
┌─────────────────────────┐     ┌────────────────────────────┐     ┌───────────────────────┐
│     Developer machine   │     │        Registry API         │     │       Storage         │
│                         │     │        (FastAPI)             │     │                       │
│  mcp-get CLI ───────────┼────▶│  Publish service            │────▶│  PostgreSQL           │
│                         │     │  Search service             │────▶│  S3 / object store    │
│  mcp.json ◀─────────────┼─────│  Install service            │────▶│  Redis                │
│                         │     │  Auth service               │     └───────────────────────┘
│  Tool server (local)    │     └────────────────────────────┘
│  AI agent (Claude/etc.) │                  │                       ┌───────────────────────┐
└─────────────────────────┘                  │                       │    Docker Sandbox     │
                                             └──────────────────────▶│  Tool validator       │
                                                                      └───────────────────────┘
```

### Layer 1 — Developer machine

- **mcp-get CLI:** the primary developer interface. Handles `login`, `publish`, `install`, `search`, `list` commands.
- **mcp.json:** local config file that Claude Desktop and other MCP hosts read to discover available tool servers.
- **Tool server process:** the installed MCP tool running as a local server the AI agent connects to over stdio or HTTP.
- **AI agent:** Claude, GPT, or any LLM runtime that supports MCP. Calls tool servers when it needs external capabilities.

### Layer 2 — Registry API

- **Publish service:** receives tool packages, validates MCP schema, queues for sandbox, stores to S3.
- **Search service:** full-text search over tool names and descriptions using PostgreSQL `pg_trgm`. Returns ranked results.
- **Install service:** resolves slug to latest (or pinned) version, returns presigned S3 URL and manifest.
- **Auth service:** handles registration, login, JWT issuance, and API key management for CLI use.

### Layer 3 — Infrastructure

- **PostgreSQL:** source of truth for all tool metadata, users, installs, ratings.
- **S3:** stores tool package tarballs and computed checksums. Tools are never served directly from the API.
- **Redis:** caches search results (5-minute TTL), install counts, and enforces rate limits on publish.
- **Docker sandbox:** spins up an isolated container for each newly published tool, calls its declared tools with synthetic inputs, verifies output matches declared schema. Marks tool as `active` or `failed`.

> **Security note:** Tool packages are never executed on the API server itself. All validation happens inside a Docker container with no network access, CPU/memory limits, and a 30-second timeout. The sandbox result is written back to `tool_versions.sandbox_status`.

---

## 3. Database Schema

Seven tables covering users, tools, versioning, installs, ratings, and tagging. Designed for read-heavy workloads — tools are browsed far more than published.

### `users`

| Column | Type & notes |
|---|---|
| `id` | `uuid PRIMARY KEY` |
| `username` | `varchar(50) UNIQUE NOT NULL` |
| `email` | `varchar(255) UNIQUE NOT NULL` |
| `password_hash` | `varchar(255) NOT NULL` — bcrypt |
| `api_key_hash` | `varchar(255)` — SHA-256 of API key, nullable until generated |
| `created_at` | `timestamptz DEFAULT now()` |

### `tools`

| Column | Type & notes |
|---|---|
| `id` | `uuid PRIMARY KEY` |
| `author_id` | `uuid FK → users.id` |
| `name` | `varchar(100) NOT NULL` — display name |
| `slug` | `varchar(100) UNIQUE NOT NULL` — CLI identifier e.g. `github-search` |
| `description` | `text NOT NULL` |
| `latest_version` | `varchar(20)` — denormalised from `tool_versions` for fast reads |
| `install_count` | `integer DEFAULT 0` — incremented by install service |
| `avg_rating` | `numeric(3,2)` — recomputed on new rating |
| `status` | `enum: draft \| active \| deprecated \| removed` |
| `created_at` | `timestamptz DEFAULT now()` |

### `tool_versions`

Separate from `tools` to support semver, pinned installs, and per-version sandbox status.

| Column | Type & notes |
|---|---|
| `id` | `uuid PRIMARY KEY` |
| `tool_id` | `uuid FK → tools.id` |
| `version` | `varchar(20) NOT NULL` — semver e.g. `1.2.0` |
| `s3_key` | `varchar(500)` — path in S3 bucket |
| `checksum` | `varchar(64)` — SHA-256 of tarball |
| `mcp_schema` | `jsonb` — full MCP manifest JSON |
| `sandbox_status` | `enum: pending \| running \| passed \| failed` |
| `sandbox_log` | `text` — error output if failed |
| `published_at` | `timestamptz DEFAULT now()` |

### `installs`

| Column | Type & notes |
|---|---|
| `id` | `uuid PRIMARY KEY` |
| `user_id` | `uuid FK → users.id` — nullable for anonymous installs |
| `tool_id` | `uuid FK → tools.id` |
| `version` | `varchar(20)` — version installed |
| `installed_at` | `timestamptz DEFAULT now()` |

### `ratings`

| Column | Type & notes |
|---|---|
| `id` | `uuid PRIMARY KEY` |
| `user_id` | `uuid FK → users.id` |
| `tool_id` | `uuid FK → tools.id` |
| `score` | `smallint CHECK (score BETWEEN 1 AND 5)` |
| `review` | `text` — optional freetext |
| `created_at` | `timestamptz DEFAULT now()` |

`UNIQUE` constraint on `(user_id, tool_id)` — one rating per user per tool.

### `tags` & `tool_tags`

Simple many-to-many. Tags are predefined: `filesystem`, `web`, `database`, `communication`, `code`, `data`, `ai`, `utilities`.

| Table | Schema |
|---|---|
| `tags` | `id uuid PK, name varchar(50), slug varchar(50)` |
| `tool_tags` | `tool_id FK, tag_id FK` — composite PK |

### Key indexes

```sql
CREATE INDEX tools_search_idx ON tools
  USING gin(to_tsvector('english', name || ' ' || description));

CREATE INDEX tools_slug_idx ON tools(slug);
CREATE INDEX tool_versions_tool_id ON tool_versions(tool_id);
CREATE INDEX installs_tool_id ON installs(tool_id);
CREATE INDEX ratings_tool_id ON ratings(tool_id);
```

---

## 4. API Contract

RESTful API served by FastAPI. All responses in JSON. Auth via `Bearer` JWT or `X-API-Key` header. Rate limits enforced by Redis.

### Tools endpoints

| Endpoint | Parameters | Description |
|---|---|---|
| `GET /tools` | `?q, tag, sort, page, limit` | Search + browse tools |
| `GET /tools/{slug}` | — | Tool detail + all versions |
| `GET /tools/{slug}/latest` | — | Manifest for latest version |
| `GET /tools/{slug}/{version}` | — | Manifest for specific version |
| `POST /tools` | Auth required. Multipart: tarball + metadata JSON | Publish new tool |
| `POST /tools/{slug}/versions` | Auth required. Multipart: tarball | Publish new version |
| `DELETE /tools/{slug}` | Auth required. Author only | Mark tool as deprecated |

### Install & rating endpoints

| Endpoint | Parameters | Description |
|---|---|---|
| `POST /installs` | `{ tool_id, version }` — auth optional | Log an install, bump count |
| `GET /installs/me` | Auth required | Tools installed by current user |
| `POST /ratings` | `{ tool_id, score, review }` — auth required | Rate a tool (one per user) |
| `GET /ratings/{tool_id}` | `?page, limit` | Paginated ratings for a tool |

### Auth endpoints

| Endpoint | Parameters | Description |
|---|---|---|
| `POST /auth/register` | `{ username, email, password }` | Create account |
| `POST /auth/login` | `{ email, password }` | Returns `{ jwt, expires_at }` |
| `GET /auth/me` | Auth required | Current user profile |
| `POST /auth/api-key` | Auth required | Generate API key — returned once |
| `DELETE /auth/api-key` | Auth required | Revoke current API key |

### MCP manifest schema

Every published tool must include a valid `mcp_schema`. The sandbox uses this to call each tool and validate the response.

```json
{
  "name": "github-search",
  "version": "1.2.0",
  "description": "Search GitHub repos, issues, and PRs",
  "entry": "server.js",
  "tools": [
    {
      "name": "search_repos",
      "description": "Search GitHub repositories",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "language": { "type": "string" }
        },
        "required": ["query"]
      }
    }
  ]
}
```

---

## 5. Auth Service

Handles two concerns: **identity** (who are you?) and **access** (are you allowed to do this?). Minimal by design — no OAuth in v1, just email/password + API keys.

### Two auth modes

| Mode | How it works |
|---|---|
| JWT (web UI) | Short-lived (1hr). Issued on login. Web UI attaches as `Authorization: Bearer <token>`. Not recommended for CLI use. |
| API key (CLI) | Long-lived. Generated after first login. Stored as SHA-256 hash in DB — raw key returned exactly once and never stored. CLI saves to `~/.mcp/config.json`. |

### FastAPI auth dependency

A single dependency handles both modes. Any route needing auth just injects it with `user: User = Depends(get_current_user)`.

```python
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = db.query(User).filter(
            User.api_key_hash == sha256(api_key)
        ).first()
        if user:
            return user

    token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    if token:
        payload = decode_jwt(token)  # raises if expired
        return db.query(User).get(payload["sub"])

    raise HTTPException(status_code=401)
```

### CLI login flow

```bash
# Step 1: login
mcp-get login
  -> POST /auth/login  { email, password }
  <- { jwt, expires_at }

# Step 2: generate API key (once)
  -> POST /auth/api-key  Authorization: Bearer <jwt>
  <- { api_key: "sk_live_..." }   # returned once only
  -> CLI stores in ~/.mcp/config.json

# Step 3: all future CLI calls use the key
mcp-get publish ./my-tool
  -> POST /tools  X-API-Key: sk_live_...
```

> **API key format:** Prefix with `sk_live_` for production and `sk_test_` for sandbox. Store only the SHA-256 hash in the database. Never log raw keys. If the user loses their key, they rotate — no recovery.

---

## 6. CLI Design

Built in TypeScript with `commander.js`. Published to npm as `mcp-get`. Feels like npm — short commands, clear output, sensible defaults.

### Commands

| Command | Description |
|---|---|
| `mcp-get install <slug>` | Download + inject tool into `mcp.json`. Supports `@version` pin. |
| `mcp-get uninstall <slug>` | Remove tool from `mcp.json` and delete local files. |
| `mcp-get search <query>` | Full-text search. Returns name, description, install count. |
| `mcp-get list` | Show installed tools and their versions. |
| `mcp-get publish <dir>` | Package and publish a tool. Reads `mcp.json` manifest in dir. |
| `mcp-get login` | Authenticate and generate API key. |
| `mcp-get info <slug>` | Show full tool detail including all versions and ratings. |
| `mcp-get update` | Update all installed tools to latest versions. |

### `install` flow — step by step

1. CLI calls `GET /tools/{slug}/latest` — receives manifest + `s3_key` + checksum
2. CLI calls `POST /installs` — logs the install (can be anonymous)
3. CLI fetches presigned S3 URL and downloads the tarball
4. CLI verifies SHA-256 checksum — aborts if mismatch
5. CLI extracts to `~/.mcp/tools/{slug}/`
6. CLI reads `mcp.json`, adds a new `mcpServers` entry pointing to the installed tool
7. CLI prints success with usage instructions

### `publish` flow — step by step

1. CLI reads manifest from `mcp.json` in the target directory
2. CLI validates manifest schema locally before uploading
3. CLI tarballs the directory (excluding `node_modules`, `.git`)
4. CLI POSTs multipart form to `/tools` with tarball + metadata
5. API stores to S3, creates `tool_versions` row with `status=pending`
6. Docker sandbox spins up, runs the tool, updates status to `passed` or `failed`
7. If passed: `tool.status` set to `active` and appears in search

### `mcp.json` structure

```json
{
  "mcpServers": {
    "github-search": {
      "command": "node",
      "args": ["~/.mcp/tools/github-search/server.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    },
    "postgres-query": {
      "command": "python",
      "args": ["~/.mcp/tools/postgres-query/server.py"]
    }
  }
}
```

---

## 7. Docker Sandbox

The sandbox is what separates this from a static registry. Every published tool is actually run in an isolated container before it goes live. This catches broken tools, schema mismatches, and malicious code before users install them.

### Validation steps

1. Download tarball from S3 into a temp container volume
2. Install dependencies (`npm install` or `pip install`) inside container
3. Start the MCP server process
4. For each tool declared in `mcp_schema`, call it with synthetic inputs derived from its `inputSchema`
5. Validate response structure against the declared output type
6. Kill container, write result (`passed`/`failed` + log) to `tool_versions`

### Container constraints

| Constraint | Value |
|---|---|
| Network | Disabled — `no_new_privs`, `network=none` |
| CPU | 0.5 CPU shares |
| Memory | 256 MB limit |
| Timeout | 30 seconds hard kill |
| Filesystem | Read-only except `/tmp` — tmpfs mount |
| User | Non-root (uid 1001) |

### Core sandbox code

```python
# services/sandbox.py
def run_sandbox(s3_key: str, mcp_schema: dict) -> SandboxResult:
    with tempfile.TemporaryDirectory() as tmpdir:
        download_from_s3(s3_key, tmpdir)
        result = docker.containers.run(
            image="mcp-sandbox:latest",
            command=f"python /runner.py {tmpdir}",
            network_disabled=True,
            mem_limit="256m",
            cpu_shares=512,
            read_only=True,
            tmpfs={"/tmp": ""},
            remove=True,
            timeout=30
        )
    return parse_result(result.logs())
```

---

## 8. Folder Structure

```
mcp-marketplace/
│
├── api/                          # FastAPI backend
│   ├── routers/
│   │   ├── tools.py              # CRUD + publish + search
│   │   ├── installs.py           # log installs, get user history
│   │   ├── ratings.py            # rate + review
│   │   └── auth.py               # register, login, API keys
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── tool.py
│   │   ├── tool_version.py
│   │   ├── install.py
│   │   └── rating.py
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── services/
│   │   ├── sandbox.py            # Docker runner + result parser
│   │   ├── storage.py            # S3 upload/download/presign
│   │   ├── search.py             # pg_trgm full-text queries
│   │   └── auth.py               # JWT + API key hashing
│   ├── db.py                     # session factory
│   ├── config.py                 # env-based settings (pydantic-settings)
│   └── main.py                   # app factory + middleware
│
├── cli/                          # TypeScript CLI (mcp-get)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── install.ts
│   │   │   ├── publish.ts
│   │   │   ├── search.ts
│   │   │   ├── list.ts
│   │   │   └── login.ts
│   │   ├── config.ts             # read/write ~/.mcp/config.json
│   │   ├── api.ts                # typed API client (axios)
│   │   ├── mcp-config.ts         # read/write mcp.json
│   │   └── index.ts              # CLI entry point
│   ├── package.json
│   └── tsconfig.json
│
├── web/                          # Next.js browse UI
│   └── app/
│       ├── page.tsx              # search + browse
│       ├── tools/[slug]/page.tsx # tool detail
│       └── publish/page.tsx      # publish guide
│
└── infra/
    ├── docker-compose.yml        # local dev (postgres, redis, minio)
    ├── Dockerfile.sandbox        # tool validation container
    ├── Dockerfile.api            # production API image
    └── init.sql                  # Postgres schema + indexes
```

---

## 9. Build Phases

Estimated 4–6 weeks for a working v1. Each phase is independently demoable.

| Phase | Duration | Deliverable |
|---|---|---|
| Phase 1 | Week 1–2 | Postgres schema, FastAPI skeleton, auth endpoints, basic tool CRUD. Can register, login, publish tool metadata (no sandbox yet). |
| Phase 2 | Week 2–3 | S3 integration, tarball upload/download, presigned URLs, checksum verification. CLI `install` + `publish` commands working end-to-end. |
| Phase 3 | Week 3–4 | Docker sandbox: runner image, tool execution, schema validation, status updates. First tool goes through full publish → validate → list flow. |
| Phase 4 | Week 4–5 | Full-text search with `pg_trgm`, Redis caching, rate limiting, ratings endpoint. CLI `search` command. Seed 4–5 real tools. |
| Phase 5 | Week 5–6 | Next.js web UI: browse, search, tool detail pages. Polish CLI output with `chalk`/`ora`. Write README with GIF demo. Publish CLI to npm. |

### Seed tools to build (Phase 4)

- `github-search` — search repos, issues, PRs via GitHub API
- `web-fetch` — fetch and parse a URL, return cleaned markdown
- `postgres-query` — run a SELECT query on a user's DB (connection string from env)
- `weather` — get current weather for a city via OpenWeatherMap
- `calculator` — evaluate mathematical expressions safely

---

## 10. Resume & Interview Framing

### One-liner

> Built MCP Tool Marketplace — an npm-style registry for Model Context Protocol tools, featuring a TypeScript CLI, FastAPI registry backend, Docker sandbox for tool validation, and a Next.js browse UI.

### Resume bullet points

- Designed and built a full-stack tool registry for MCP (Model Context Protocol), enabling developers to publish, discover, and install AI agent capabilities via a CLI
- Implemented a Docker-based sandboxing system that validates every submitted tool in an isolated container before public listing, preventing broken or malicious tools
- Built a TypeScript CLI (`mcp-get`) that resolves tool manifests, verifies SHA-256 checksums, and injects server configs into MCP client configuration files
- Designed a PostgreSQL schema with full-text search using `pg_trgm`, Redis caching for install counts, and S3 for package storage

### Interview talking points

| Topic | What to say |
|---|---|
| Why MCP? | Explain MCP as the emerging standard for giving LLMs pluggable capabilities. The registry solves the distribution problem — there's no npm equivalent yet. |
| Hardest part | The Docker sandbox. You have to actually execute submitted code safely — network disabled, memory-limited, 30s timeout, non-root user. Gets into security-aware systems design. |
| Schema design | Separating `tool_versions` from `tools` enables semver and pinned installs. `avg_rating` is denormalised for read performance. `pg_trgm` for search avoids an extra service. |
| At scale | Redis for install counts (no write to Postgres on every install), CDN in front of S3 for package delivery, read replicas for search queries. |

---

## 11. Quick Start

### Local development

```bash
# Clone and set up
git clone https://github.com/you/mcp-marketplace
cd mcp-marketplace

# Start local infra (Postgres, Redis, MinIO)
docker compose up -d

# Set up API
cd api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head       # run migrations
uvicorn main:app --reload

# Set up CLI (separate terminal)
cd cli
npm install
npm run build
npm link                   # makes mcp-get available globally

# Try it
mcp-get login
mcp-get search weather
mcp-get install weather
```

### Environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/mcp` |
| `REDIS_URL` | `redis://localhost:6379` |
| `S3_BUCKET` | `mcp-tools-dev` |
| `S3_ENDPOINT` | `http://localhost:9000` (MinIO for local dev) |
| `JWT_SECRET` | random 32-byte hex string |
| `DOCKER_HOST` | `unix:///var/run/docker.sock` |

> **First milestone:** Get the full publish → sandbox → install loop working with a single real tool (e.g. a weather tool). Once that works end-to-end, everything else is polish.

---

*MCP Marketplace · Architecture & Design Reference*
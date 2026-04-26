-- Production seed: tags, users, tools, versions, installs, ratings
-- Run once against the Railway Postgres DB:
--   psql $DATABASE_URL -f scripts/seed-prod.sql

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tags (idempotent) ─────────────────────────────────────────────────────────
INSERT INTO tags (id, name, slug) VALUES
  (gen_random_uuid(), 'Filesystem',    'filesystem'),
  (gen_random_uuid(), 'Web',           'web'),
  (gen_random_uuid(), 'Database',      'database'),
  (gen_random_uuid(), 'Communication', 'communication'),
  (gen_random_uuid(), 'Code',          'code'),
  (gen_random_uuid(), 'Data',          'data'),
  (gen_random_uuid(), 'AI',            'ai'),
  (gen_random_uuid(), 'Utilities',     'utilities'),
  (gen_random_uuid(), 'Cloud',         'cloud'),
  (gen_random_uuid(), 'DevOps',        'devops')
ON CONFLICT (slug) DO NOTHING;

-- ── Authors ────────────────────────────────────────────────────────────────────
-- password_hash is a bcrypt hash of 'changeme123' — these are demo accounts only
INSERT INTO users (id, username, email, password_hash, is_admin, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'modelcontextprotocol', 'mcp@modelcontextprotocol.io',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/NkHoXqiW2', false, NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000002', 'cloudflare',          'mcp@cloudflare.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/NkHoXqiW2', false, NOW() - INTERVAL '45 days'),
  ('00000000-0000-0000-0000-000000000003', 'stripe',              'mcp@stripe.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/NkHoXqiW2', false, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000004', 'sourcegraph',         'mcp@sourcegraph.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/NkHoXqiW2', false, NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000005', 'Arhaan_admin',        '17arhaan.connect@gmail.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/NkHoXqiW2', false, NOW() - INTERVAL '10 days')
ON CONFLICT (username) DO NOTHING;

-- ── Tools ──────────────────────────────────────────────────────────────────────
INSERT INTO tools (id, author_id, name, slug, description, latest_version, install_count, avg_rating, status, created_at) VALUES
-- modelcontextprotocol (official)
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Filesystem',    'mcp-filesystem',
   'Secure filesystem access for AI agents. Read, write, list, and search files within permitted directories.',
   '0.6.2', 4821, 4.8, 'active'::tool_status, NOW() - INTERVAL '55 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP GitHub',        'mcp-github',
   'Full GitHub integration: repos, issues, PRs, commits, and code search via the GitHub API.',
   '0.6.2', 6203, 4.9, 'active'::tool_status, NOW() - INTERVAL '54 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP PostgreSQL',    'mcp-postgres',
   'Read-only PostgreSQL access. Run queries, inspect schemas, and explore table relationships safely.',
   '0.6.2', 3917, 4.7, 'active'::tool_status, NOW() - INTERVAL '53 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP SQLite',        'mcp-sqlite',
   'SQLite database integration with query execution, schema inspection, and memo features.',
   '0.6.2', 2844, 4.6, 'active'::tool_status, NOW() - INTERVAL '52 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Brave Search',  'mcp-brave-search',
   'Web and local search using the Brave Search API. Retrieve live web results for any query.',
   '0.6.2', 3102, 4.5, 'active'::tool_status, NOW() - INTERVAL '51 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Slack',         'mcp-slack',
   'Slack workspace integration. Read channels, post messages, and manage threads via OAuth.',
   '0.6.2', 2761, 4.6, 'active'::tool_status, NOW() - INTERVAL '50 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Google Maps',   'mcp-google-maps',
   'Location services, directions, place details, and distance matrix via the Google Maps API.',
   '0.6.2', 1893, 4.4, 'active'::tool_status, NOW() - INTERVAL '49 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Puppeteer',     'mcp-puppeteer',
   'Headless browser automation with Puppeteer. Navigate pages, take screenshots, and extract content.',
   '0.6.2', 2540, 4.7, 'active'::tool_status, NOW() - INTERVAL '48 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Memory',        'mcp-memory',
   'Persistent key-value memory store for AI agents. Retain context across conversations.',
   '0.6.2', 3388, 4.8, 'active'::tool_status, NOW() - INTERVAL '47 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'MCP Fetch',         'mcp-fetch',
   'HTTP fetch tool for AI agents. Download web pages and convert to clean Markdown.',
   '0.6.2', 4102, 4.6, 'active'::tool_status, NOW() - INTERVAL '46 days'),

-- cloudflare
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Cloudflare MCP',    'cloudflare-mcp',
   'Manage Cloudflare Workers, KV, R2, D1, Queues, and AI Gateway — all from your AI agent.',
   '1.2.0', 2218, 4.8, 'active'::tool_status, NOW() - INTERVAL '40 days'),

-- stripe
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Stripe MCP',        'stripe-mcp',
   'Interact with the Stripe API to manage customers, payments, subscriptions, and refunds.',
   '1.0.3', 1847, 4.7, 'active'::tool_status, NOW() - INTERVAL '28 days'),

-- sourcegraph
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004', 'Sourcegraph Cody',  'sourcegraph-cody',
   'Code search and intelligence across your entire codebase via Sourcegraph. Semantic code navigation.',
   '0.3.1', 1563, 4.5, 'active'::tool_status, NOW() - INTERVAL '18 days'),

-- Arhaan_admin originals
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Redis',         'mcp-redis',
   'Redis operations for AI agents: get, set, delete, expire, list, and pub/sub messaging.',
   '1.0.0', 987,  4.4, 'active'::tool_status, NOW() - INTERVAL '9 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Linear',        'mcp-linear',
   'Create and manage Linear issues, projects, and cycles. Sync your engineering workflow with AI.',
   '1.0.0', 834,  4.6, 'active'::tool_status, NOW() - INTERVAL '8 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Notion',        'mcp-notion',
   'Read and write Notion pages, databases, and blocks. Build AI workflows on top of your Notion workspace.',
   '1.0.0', 1124, 4.5, 'active'::tool_status, NOW() - INTERVAL '7 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Docker',        'mcp-docker',
   'Control Docker containers and images from your AI agent. List, start, stop, inspect, and exec.',
   '1.0.0', 712,  4.3, 'active'::tool_status, NOW() - INTERVAL '6 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Jira',          'mcp-jira',
   'Jira integration for AI agents. Create tickets, query boards, update statuses, and add comments.',
   '1.0.0', 643,  4.2, 'active'::tool_status, NOW() - INTERVAL '5 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Twilio',        'mcp-twilio',
   'Send SMS and make calls via Twilio. Enable your AI agent to communicate through voice and text.',
   '1.0.0', 528,  4.4, 'active'::tool_status, NOW() - INTERVAL '4 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP AWS S3',        'mcp-aws-s3',
   'AWS S3 bucket operations: list, upload, download, delete objects, and manage presigned URLs.',
   '1.0.0', 891,  4.5, 'active'::tool_status, NOW() - INTERVAL '3 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Figma',         'mcp-figma',
   'Access Figma files, frames, and components. Export assets and read design tokens from your AI.',
   '1.0.0', 476,  4.3, 'active'::tool_status, NOW() - INTERVAL '2 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP SendGrid',      'mcp-sendgrid',
   'Send transactional emails via SendGrid. Compose, send, and track email delivery from AI agents.',
   '1.0.0', 394,  4.2, 'active'::tool_status, NOW() - INTERVAL '1 day'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP OpenAPI',       'mcp-openapi',
   'Turn any OpenAPI/Swagger spec into MCP tools automatically. Zero-config REST API integration.',
   '1.0.0', 1031, 4.7, 'active'::tool_status, NOW() - INTERVAL '12 hours'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Spotify',       'mcp-spotify',
   'Control Spotify playback, search tracks, manage playlists, and get listening stats from any AI agent.',
   '1.0.0', 743,  4.6, 'active'::tool_status, NOW() - INTERVAL '6 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP YouTube',       'mcp-youtube',
   'Search YouTube, fetch video metadata, get transcripts, and query channel statistics via the YouTube Data API.',
   '1.0.0', 1204, 4.5, 'active'::tool_status, NOW() - INTERVAL '5 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Sentry',        'mcp-sentry',
   'Query Sentry issues, stack traces, and release health. Let your AI agent triage errors and suggest fixes.',
   '1.0.0', 891,  4.7, 'active'::tool_status, NOW() - INTERVAL '4 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Pinecone',      'mcp-pinecone',
   'Upsert, query, and delete vectors in Pinecone. Build semantic search and RAG pipelines directly from an AI agent.',
   '1.0.0', 1087, 4.8, 'active'::tool_status, NOW() - INTERVAL '3 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Gmail',         'mcp-gmail',
   'Read, send, search, and label Gmail messages via OAuth. Let your AI agent manage your inbox end-to-end.',
   '1.0.0', 1532, 4.6, 'active'::tool_status, NOW() - INTERVAL '2 days'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP HuggingFace',   'mcp-huggingface',
   'Run inference on any HuggingFace model, search the Hub, and download datasets — all from your AI agent.',
   '1.0.0', 967,  4.7, 'active'::tool_status, NOW() - INTERVAL '1 day'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP GitLab',        'mcp-gitlab',
   'Full GitLab integration — repos, merge requests, pipelines, issues, and container registry management.',
   '1.0.0', 678,  4.4, 'active'::tool_status, NOW() - INTERVAL '18 hours'),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'MCP Terraform',     'mcp-terraform',
   'Plan, apply, and inspect Terraform state from an AI agent. Manage cloud infrastructure through natural language.',
   '1.0.0', 542,  4.5, 'active'::tool_status, NOW() - INTERVAL '12 hours')
ON CONFLICT (slug) DO NOTHING;

-- ── Tool versions ──────────────────────────────────────────────────────────────
INSERT INTO tool_versions (id, tool_id, version, mcp_schema, sandbox_status, published_at)
SELECT
  gen_random_uuid(),
  t.id,
  t.latest_version,
  jsonb_build_object('tools', jsonb_build_array(
    jsonb_build_object('name', 'list_resources',   'description', 'List available resources'),
    jsonb_build_object('name', 'read_resource',    'description', 'Read a specific resource'),
    jsonb_build_object('name', 'write_resource',   'description', 'Write or update a resource'),
    jsonb_build_object('name', 'delete_resource',  'description', 'Remove a resource'),
    jsonb_build_object('name', 'search_resources', 'description', 'Search across resources')
  )),
  'passed'::sandbox_status,
  t.created_at
FROM tools t
WHERE NOT EXISTS (
  SELECT 1 FROM tool_versions tv WHERE tv.tool_id = t.id
);

-- ── Tag associations ───────────────────────────────────────────────────────────
-- filesystem tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-filesystem') AND tg.slug = 'filesystem'
ON CONFLICT DO NOTHING;

-- web tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-brave-search', 'mcp-fetch', 'mcp-puppeteer', 'mcp-google-maps') AND tg.slug = 'web'
ON CONFLICT DO NOTHING;

-- database tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-postgres', 'mcp-sqlite', 'mcp-redis') AND tg.slug = 'database'
ON CONFLICT DO NOTHING;

-- code tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-github', 'sourcegraph-cody', 'mcp-openapi', 'mcp-docker') AND tg.slug = 'code'
ON CONFLICT DO NOTHING;

-- communication tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-slack', 'mcp-twilio', 'mcp-sendgrid') AND tg.slug = 'communication'
ON CONFLICT DO NOTHING;

-- ai tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-memory', 'cloudflare-mcp') AND tg.slug = 'ai'
ON CONFLICT DO NOTHING;

-- cloud tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-aws-s3', 'cloudflare-mcp', 'stripe-mcp') AND tg.slug = 'cloud'
ON CONFLICT DO NOTHING;

-- devops tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-docker', 'mcp-linear', 'mcp-jira') AND tg.slug = 'devops'
ON CONFLICT DO NOTHING;

-- data tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-notion', 'mcp-figma') AND tg.slug = 'data'
ON CONFLICT DO NOTHING;

-- utilities tag
INSERT INTO tool_tags (tool_id, tag_id)
SELECT t.id, tg.id FROM tools t, tags tg
WHERE t.slug IN ('mcp-fetch', 'mcp-openapi', 'mcp-memory') AND tg.slug = 'utilities'
ON CONFLICT DO NOTHING;

-- ── Grant admin to your account ────────────────────────────────────────────────
-- Replace with your actual email if different
UPDATE users SET is_admin = true WHERE email = '17arhaan@gmail.com';

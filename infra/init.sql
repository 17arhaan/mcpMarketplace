-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE tool_status AS ENUM ('draft', 'active', 'deprecated', 'removed');
CREATE TYPE sandbox_status AS ENUM ('pending', 'running', 'passed', 'failed');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    latest_version VARCHAR(20),
    install_count INTEGER DEFAULT 0,
    avg_rating NUMERIC(3,2),
    status tool_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool versions
CREATE TABLE tool_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    s3_key VARCHAR(500),
    checksum VARCHAR(64),
    mcp_schema JSONB,
    sandbox_status sandbox_status DEFAULT 'pending',
    sandbox_log TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tool_id, version)
);

-- Installs
CREATE TABLE installs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    version VARCHAR(20),
    installed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tool_id)
);

-- Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE tool_tags (
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, tag_id)
);

-- Indexes
CREATE INDEX tools_search_idx ON tools
    USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX tools_slug_idx ON tools(slug);
CREATE INDEX tools_status_idx ON tools(status);
CREATE INDEX tool_versions_tool_id ON tool_versions(tool_id);
CREATE INDEX installs_tool_id ON installs(tool_id);
CREATE INDEX ratings_tool_id ON ratings(tool_id);

-- Seed tags
INSERT INTO tags (name, slug) VALUES
    ('Filesystem', 'filesystem'),
    ('Web', 'web'),
    ('Database', 'database'),
    ('Communication', 'communication'),
    ('Code', 'code'),
    ('Data', 'data'),
    ('AI', 'ai'),
    ('Utilities', 'utilities');

#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

green() { printf "\033[32m✓ %s\033[0m\n" "$1"; }
red()   { printf "\033[31m✗ %s\033[0m\n" "$1"; }

check() {
  local desc="$1"; shift
  if "$@" > /dev/null 2>&1; then
    green "$desc"; ((PASS++))
  else
    red "$desc"; ((FAIL++))
  fi
}

echo "=== MCP Marketplace Integrity Check ==="
echo ""

# License presence
echo "--- License & Attribution ---"
check "LICENSE file exists" test -f "$ROOT/LICENSE"
check "LICENSE is AGPL-3.0" grep -q "GNU AFFERO GENERAL PUBLIC LICENSE" "$ROOT/LICENSE"

# Core files exist
echo ""
echo "--- Core Files ---"
check "API entry point" test -f "$ROOT/api/main.py"
check "API config" test -f "$ROOT/api/config.py"
check "CLI entry point" test -f "$ROOT/cli/src/index.ts"
check "Web app entry" test -f "$ROOT/web/app/page.tsx"
check "Docker compose" test -f "$ROOT/infra/docker-compose.yml"
check "DB schema" test -f "$ROOT/infra/init.sql"
check "Sandbox Dockerfile" test -f "$ROOT/infra/Dockerfile.sandbox"

# Python syntax
echo ""
echo "--- Python Integrity ---"
for f in $(find "$ROOT/api" "$ROOT/tools" -name "*.py" 2>/dev/null); do
  check "$(basename $f)" python3 -m py_compile "$f"
done

# TypeScript
echo ""
echo "--- CLI Integrity ---"
if [ -d "$ROOT/cli/node_modules" ]; then
  check "TypeScript compiles" bash -c "cd '$ROOT/cli' && npx tsc --noEmit"
else
  red "CLI node_modules missing — run npm install"
  ((FAIL++))
fi

# Manifest validation
echo ""
echo "--- Tool Manifests ---"
for f in $(find "$ROOT/tools" -name "mcp.json" 2>/dev/null); do
  check "$(dirname $f | xargs basename)/mcp.json" python3 -c "import json; d=json.load(open('$f')); assert 'name' in d and 'version' in d"
done

# Security checks
echo ""
echo "--- Security ---"
check "No .env files committed" bash -c "! find '$ROOT' -name '.env' -not -path '*/node_modules/*' -not -name '.env.example' | grep -q '.'"
check "No hardcoded secrets in config" bash -c "! grep -r 'sk-ant-api\|AKIA[0-9A-Z]\{16\}\|BEGIN RSA PRIVATE\|BEGIN PRIVATE KEY' '$ROOT/api/' '$ROOT/cli/src/' 2>/dev/null | grep -v node_modules | grep -qv '.example'"
check "API keys hashed not stored raw" grep -q "sha256" "$ROOT/api/services/auth.py"
check "Rate limiting enabled" grep -q "check_rate_limit" "$ROOT/api/routers/tools.py"
check "Sandbox runs non-root" grep -q "USER" "$ROOT/infra/Dockerfile.sandbox"
check "Sandbox network disabled" grep -q "network_mode.*none\|network_disabled.*True" "$ROOT/api/services/sandbox.py"

# Checksum generation for core files
echo ""
echo "--- File Checksums ---"
CHECKSUM_FILE="$ROOT/.integrity"
{
  echo "# MCP Marketplace integrity checksums"
  echo "# Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo ""
  find "$ROOT/api" "$ROOT/cli/src" "$ROOT/infra" -type f \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.sql" -o -name "*.yml" -o -name "Dockerfile.*" \) \
    -not -path "*/node_modules/*" -not -path "*/__pycache__/*" \
    | sort \
    | while read -r file; do
        rel="${file#$ROOT/}"
        hash=$(shasum -a 256 "$file" | cut -d' ' -f1)
        echo "$hash  $rel"
      done
} > "$CHECKSUM_FILE"
green "Checksums written to .integrity ($(wc -l < "$CHECKSUM_FILE" | tr -d ' ') files)"
((PASS++))

# Summary
echo ""
echo "=============================="
TOTAL=$((PASS + FAIL))
echo "Results: $PASS/$TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
  red "$FAIL check(s) failed"
  exit 1
else
  green "All checks passed!"
fi

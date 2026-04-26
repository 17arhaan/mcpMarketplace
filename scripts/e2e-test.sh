#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="http://localhost:8000"
PASS=0
FAIL=0

green() { printf "\033[32m✓ %s\033[0m\n" "$1"; }
red()   { printf "\033[31m✗ %s\033[0m\n" "$1"; }

check() {
  local desc="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    green "$desc"
    ((PASS++))
  else
    red "$desc"
    ((FAIL++))
  fi
}

echo "=== MCP Marketplace E2E Tests ==="
echo ""

# --- Health check ---
echo "--- API Health ---"
check "API is running" curl -sf "$API_URL/health"

# --- Auth ---
echo ""
echo "--- Auth Flow ---"

REGISTER=$(curl -sf -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"e2euser_$$\",\"email\":\"e2e_$$@test.com\",\"password\":\"testpass123\"}" 2>/dev/null || echo "")

if [ -n "$REGISTER" ]; then
  green "Register user"
  ((PASS++))
else
  red "Register user"
  ((FAIL++))
fi

LOGIN=$(curl -sf -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e_$$@test.com\",\"password\":\"testpass123\"}" 2>/dev/null || echo "")

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['jwt'])" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
  green "Login and get JWT"
  ((PASS++))
else
  red "Login and get JWT"
  ((FAIL++))
fi

check "Get current user" curl -sf "$API_URL/auth/me" -H "Authorization: Bearer $TOKEN"

API_KEY_RESP=$(curl -sf -X POST "$API_URL/auth/api-key" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "")
API_KEY=$(echo "$API_KEY_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['api_key'])" 2>/dev/null || echo "")

if [ -n "$API_KEY" ]; then
  green "Generate API key"
  ((PASS++))
else
  red "Generate API key"
  ((FAIL++))
fi

check "Auth via API key" curl -sf "$API_URL/auth/me" -H "X-API-Key: $API_KEY"

# --- Tools ---
echo ""
echo "--- Tool Operations ---"

SLUG="e2e-test-tool-$$"
TOOL_DIR=$(mktemp -d)
cat > "$TOOL_DIR/server.py" << 'PYEOF'
import json, sys
def handle(req):
    return {"jsonrpc": "2.0", "id": req.get("id"), "result": {"tools": []}}
for line in sys.stdin:
    if line.strip():
        print(json.dumps(handle(json.loads(line))), flush=True)
PYEOF

cat > "$TOOL_DIR/mcp.json" << JSONEOF
{"name":"$SLUG","version":"1.0.0","description":"E2E test tool","entry":"server.py"}
JSONEOF

cd "$TOOL_DIR" && tar czf tool.tar.gz server.py mcp.json

PUBLISH=$(curl -sf -X POST "$API_URL/tools" \
  -H "X-API-Key: $API_KEY" \
  -F "name=$SLUG" \
  -F "slug=$SLUG" \
  -F "description=E2E test tool" \
  -F "version=1.0.0" \
  -F "mcp_schema={\"tools\":[]}" \
  -F "tarball=@tool.tar.gz" 2>/dev/null || echo "")

if echo "$PUBLISH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['slug']=='$SLUG'" 2>/dev/null; then
  green "Publish tool"
  ((PASS++))
else
  red "Publish tool"
  ((FAIL++))
fi

check "Search tools" curl -sf "$API_URL/tools?q=test"
check "Get tool by slug" curl -sf "$API_URL/tools/$SLUG"
check "List tags" curl -sf "$API_URL/tools/tags"

# --- Publish version ---
PUBLISH_V2=$(curl -sf -X POST "$API_URL/tools/$SLUG/versions" \
  -H "X-API-Key: $API_KEY" \
  -F "version=1.1.0" \
  -F "mcp_schema={\"tools\":[]}" \
  -F "tarball=@tool.tar.gz" 2>/dev/null || echo "")

if [ -n "$PUBLISH_V2" ]; then
  green "Publish new version"
  ((PASS++))
else
  red "Publish new version"
  ((FAIL++))
fi

# --- Deprecate ---
DEP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/tools/$SLUG" \
  -H "X-API-Key: $API_KEY" 2>/dev/null || echo "0")

if [ "$DEP_STATUS" = "204" ]; then
  green "Deprecate tool"
  ((PASS++))
else
  red "Deprecate tool (got $DEP_STATUS)"
  ((FAIL++))
fi

# --- Cleanup ---
rm -rf "$TOOL_DIR"

# --- Summary ---
echo ""
echo "=============================="
TOTAL=$((PASS + FAIL))
echo "Results: $PASS/$TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
  red "$FAIL test(s) failed"
  exit 1
else
  green "All tests passed!"
fi

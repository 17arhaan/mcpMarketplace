"""
MCP server — GitHub search tool using the public API (no auth required for basic search).
Communicates over stdio using the MCP JSON-RPC protocol.
"""

import json
import sys
import urllib.request


def search_repos(query: str, max_results: int = 5) -> list[dict]:
    url = f"https://api.github.com/search/repositories?q={urllib.request.quote(query)}&per_page={max_results}&sort=stars"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "mcp-github-search/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())

    return [
        {
            "name": item["full_name"],
            "description": item.get("description", ""),
            "stars": item["stargazers_count"],
            "language": item.get("language"),
            "url": item["html_url"],
        }
        for item in data.get("items", [])
    ]


def search_code(query: str, max_results: int = 5) -> list[dict]:
    url = f"https://api.github.com/search/code?q={urllib.request.quote(query)}&per_page={max_results}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "mcp-github-search/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())

    return [
        {
            "file": item["name"],
            "path": item["path"],
            "repository": item["repository"]["full_name"],
            "url": item["html_url"],
        }
        for item in data.get("items", [])
    ]


TOOLS = [
    {
        "name": "search_repos",
        "description": "Search GitHub repositories by keyword. Returns name, description, stars, language, and URL.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "max_results": {
                    "type": "integer",
                    "description": "Max results (default 5, max 30)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_code",
        "description": "Search GitHub code by keyword. Returns file name, path, repository, and URL.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Code search query"},
                "max_results": {
                    "type": "integer",
                    "description": "Max results (default 5, max 30)",
                },
            },
            "required": ["query"],
        },
    },
]


def handle(request: dict) -> dict:
    method = request.get("method")
    req_id = request.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": "github-search", "version": "1.0.0"},
                "capabilities": {"tools": {}},
            },
        }

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        params = request.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        try:
            if name == "search_repos":
                result = search_repos(args["query"], args.get("max_results", 5))
            elif name == "search_code":
                result = search_code(args["query"], args.get("max_results", 5))
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Unknown tool: {name}"},
                }
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": json.dumps(result)}]},
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32000, "message": str(e)},
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": "Method not found"},
    }


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = handle(req)
            print(json.dumps(resp), flush=True)
        except json.JSONDecodeError:
            pass


if __name__ == "__main__":
    main()

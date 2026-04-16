"""
MCP server — web-fetch tool for retrieving web page content.
Communicates over stdio using the MCP JSON-RPC protocol.
"""
import json
import sys
import urllib.request
import html.parser


class TextExtractor(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self._text = []
        self._skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self._skip = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self._skip = False

    def handle_data(self, data):
        if not self._skip:
            text = data.strip()
            if text:
                self._text.append(text)

    def get_text(self) -> str:
        return "\n".join(self._text)


def fetch_url(url: str, max_length: int = 5000) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "mcp-web-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        content_type = r.headers.get("Content-Type", "")
        body = r.read().decode("utf-8", errors="replace")

    if "html" in content_type:
        parser = TextExtractor()
        parser.feed(body)
        text = parser.get_text()
    else:
        text = body

    if len(text) > max_length:
        text = text[:max_length] + f"\n... (truncated at {max_length} chars)"

    return {"url": url, "content_type": content_type, "text": text}


TOOLS = [
    {
        "name": "fetch",
        "description": "Fetch a web page and extract its text content. HTML is stripped to plain text.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "URL to fetch"},
                "max_length": {"type": "integer", "description": "Max characters to return (default 5000)"},
            },
            "required": ["url"],
        },
    }
]


def handle(request: dict) -> dict:
    method = request.get("method")
    req_id = request.get("id")

    if method == "initialize":
        return {"jsonrpc": "2.0", "id": req_id, "result": {
            "protocolVersion": "2024-11-05",
            "serverInfo": {"name": "web-fetch", "version": "1.0.0"},
            "capabilities": {"tools": {}},
        }}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        params = request.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        if name == "fetch":
            try:
                result = fetch_url(args["url"], args.get("max_length", 5000))
                return {"jsonrpc": "2.0", "id": req_id, "result": {
                    "content": [{"type": "text", "text": json.dumps(result)}]
                }}
            except Exception as e:
                return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32000, "message": str(e)}}

    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": "Method not found"}}


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

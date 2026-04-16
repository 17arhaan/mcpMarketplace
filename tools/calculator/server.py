"""
MCP server — calculator tool for basic math expressions.
Communicates over stdio using the MCP JSON-RPC protocol.
"""
import json
import sys
import math


def evaluate(expression: str) -> float:
    allowed_names = {
        "abs": abs, "round": round, "min": min, "max": max,
        "sqrt": math.sqrt, "pow": pow, "log": math.log,
        "sin": math.sin, "cos": math.cos, "tan": math.tan,
        "pi": math.pi, "e": math.e,
    }
    return float(eval(expression, {"__builtins__": {}}, allowed_names))


TOOLS = [
    {
        "name": "calculate",
        "description": "Evaluate a mathematical expression. Supports basic arithmetic, sqrt, pow, log, trig functions, pi, e.",
        "inputSchema": {
            "type": "object",
            "properties": {"expression": {"type": "string", "description": "Math expression to evaluate, e.g. 'sqrt(144) + 2 * pi'"}},
            "required": ["expression"],
        },
    }
]


def handle(request: dict) -> dict:
    method = request.get("method")
    req_id = request.get("id")

    if method == "initialize":
        return {"jsonrpc": "2.0", "id": req_id, "result": {
            "protocolVersion": "2024-11-05",
            "serverInfo": {"name": "calculator", "version": "1.0.0"},
            "capabilities": {"tools": {}},
        }}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        params = request.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        if name == "calculate":
            try:
                result = evaluate(args["expression"])
                return {"jsonrpc": "2.0", "id": req_id, "result": {
                    "content": [{"type": "text", "text": json.dumps({"expression": args["expression"], "result": result})}]
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

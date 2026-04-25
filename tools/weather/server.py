"""
Minimal MCP server — weather tool using Open-Meteo (no API key needed).
Communicates over stdio using the MCP JSON-RPC protocol.
"""

import json
import sys
import urllib.request


def geocode(city: str) -> tuple[float, float]:
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.request.quote(city)}&count=1"
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read())
    results = data.get("results", [])
    if not results:
        raise ValueError(f"City not found: {city}")
    return results[0]["latitude"], results[0]["longitude"]


def get_weather(city: str) -> dict:
    lat, lon = geocode(city)
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current_weather=true"
    )
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read())
    cw = data["current_weather"]
    return {
        "city": city,
        "temperature_c": cw["temperature"],
        "wind_speed_kmh": cw["windspeed"],
        "weather_code": cw["weathercode"],
    }


TOOLS = [
    {
        "name": "get_weather",
        "description": "Get current temperature and conditions for a city",
        "inputSchema": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
        },
    }
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
                "serverInfo": {"name": "weather", "version": "1.0.0"},
                "capabilities": {"tools": {}},
            },
        }

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        params = request.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        if name == "get_weather":
            try:
                result = get_weather(args["city"])
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": json.dumps(result)}]
                    },
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

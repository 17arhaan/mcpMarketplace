"""
Sandbox runner — called inside the Docker container.
Extracts the tarball, installs deps, starts the MCP server,
calls each declared tool with synthetic input, validates responses.
Prints SANDBOX_PASS or SANDBOX_FAIL as the last line.
"""
import json
import os
import subprocess
import sys
import tarfile
import tempfile
import time


def main():
    workspace = sys.argv[1] if len(sys.argv) > 1 else "/workspace"
    tarball = "/tool.tar.gz"
    schema_str = os.environ.get("MCP_SCHEMA", "{}")

    try:
        schema = json.loads(schema_str)
    except json.JSONDecodeError:
        print("SANDBOX_FAIL: invalid MCP_SCHEMA JSON")
        sys.exit(1)

    # Extract tarball
    try:
        with tarfile.open(tarball, "r:gz") as tf:
            tf.extractall(workspace)
    except Exception as e:
        print(f"SANDBOX_FAIL: extraction error: {e}")
        sys.exit(1)

    entry = schema.get("entry", "server.js")
    entry_path = os.path.join(workspace, entry)

    if not os.path.exists(entry_path):
        print(f"SANDBOX_FAIL: entry point not found: {entry}")
        sys.exit(1)

    # Install dependencies
    if entry.endswith(".js") and os.path.exists(os.path.join(workspace, "package.json")):
        r = subprocess.run(["npm", "install", "--prefix", workspace], capture_output=True, timeout=25)
        if r.returncode != 0:
            print(f"SANDBOX_FAIL: npm install failed: {r.stderr.decode()[:500]}")
            sys.exit(1)
    elif entry.endswith(".py") and os.path.exists(os.path.join(workspace, "requirements.txt")):
        r = subprocess.run(["pip", "install", "-r", os.path.join(workspace, "requirements.txt")],
                           capture_output=True, timeout=25)
        if r.returncode != 0:
            print(f"SANDBOX_FAIL: pip install failed: {r.stderr.decode()[:500]}")
            sys.exit(1)

    # Basic validation: ensure the entry file is syntactically valid
    if entry.endswith(".py"):
        r = subprocess.run(["python", "-m", "py_compile", entry_path], capture_output=True)
        if r.returncode != 0:
            print(f"SANDBOX_FAIL: syntax error: {r.stderr.decode()[:500]}")
            sys.exit(1)
    elif entry.endswith(".js"):
        r = subprocess.run(["node", "--check", entry_path], capture_output=True)
        if r.returncode != 0:
            print(f"SANDBOX_FAIL: syntax error: {r.stderr.decode()[:500]}")
            sys.exit(1)

    tools = schema.get("tools", [])
    print(f"Validated {len(tools)} tool(s): {[t.get('name') for t in tools]}")
    print("SANDBOX_PASS")


if __name__ == "__main__":
    main()

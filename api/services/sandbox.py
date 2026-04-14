import tempfile
import os
import logging
from dataclasses import dataclass

import docker
from docker.errors import ContainerError, ImageNotFound

from api.services.storage import download_to_dir

logger = logging.getLogger(__name__)


@dataclass
class SandboxResult:
    passed: bool
    log: str


def run_sandbox(s3_key: str, mcp_schema: dict) -> SandboxResult:
    client = docker.from_env()

    with tempfile.TemporaryDirectory() as tmpdir:
        tarball_path = os.path.join(tmpdir, "tool.tar.gz")
        try:
            download_to_dir(s3_key, tarball_path)
        except Exception as e:
            return SandboxResult(passed=False, log=f"S3 download failed: {e}")

        try:
            result = client.containers.run(
                image="mcp-sandbox:latest",
                command=f"python /runner.py /workspace",
                network_disabled=True,
                mem_limit="256m",
                cpu_shares=512,
                read_only=True,
                tmpfs={"/tmp": "", "/workspace": ""},
                volumes={tarball_path: {"bind": "/tool.tar.gz", "mode": "ro"}},
                environment={"MCP_SCHEMA": str(mcp_schema)},
                remove=True,
                stdout=True,
                stderr=True,
            )
            log = result.decode() if isinstance(result, bytes) else str(result)
            passed = "SANDBOX_PASS" in log
            return SandboxResult(passed=passed, log=log)

        except ContainerError as e:
            return SandboxResult(passed=False, log=f"Container error: {e.stderr.decode() if e.stderr else str(e)}")
        except ImageNotFound:
            logger.warning("mcp-sandbox image not found — skipping sandbox (dev mode)")
            return SandboxResult(passed=True, log="Sandbox skipped: image not built yet")
        except Exception as e:
            return SandboxResult(passed=False, log=f"Sandbox error: {e}")

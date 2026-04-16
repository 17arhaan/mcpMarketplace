import json
import redis
from api.config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def cache_get(key: str) -> dict | list | None:
    r = get_redis()
    val = r.get(key)
    if val:
        return json.loads(val)
    return None


def cache_set(key: str, value: dict | list, ttl: int = 300) -> None:
    r = get_redis()
    r.setex(key, ttl, json.dumps(value, default=str))


def cache_delete_pattern(pattern: str) -> None:
    r = get_redis()
    for key in r.scan_iter(match=pattern):
        r.delete(key)


def increment_install_count(tool_id: str) -> int:
    r = get_redis()
    key = f"install_count:{tool_id}"
    return r.incr(key)


def get_install_count(tool_id: str) -> int | None:
    r = get_redis()
    val = r.get(f"install_count:{tool_id}")
    return int(val) if val else None

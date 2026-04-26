import json
import logging

import redis
from api.config import settings

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def cache_get(key: str) -> dict | list | None:
    try:
        r = get_redis()
        val = r.get(key)
        if val:
            return json.loads(val)
    except Exception as e:
        logger.warning("cache_get failed: %s", e)
    return None


def cache_set(key: str, value: dict | list, ttl: int = 300) -> None:
    try:
        r = get_redis()
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning("cache_set failed: %s", e)


def cache_delete_pattern(pattern: str) -> None:
    try:
        r = get_redis()
        for key in r.scan_iter(match=pattern):
            r.delete(key)
    except Exception as e:
        logger.warning("cache_delete_pattern failed: %s", e)


def increment_install_count(tool_id: str) -> int:
    try:
        r = get_redis()
        key = f"install_count:{tool_id}"
        return r.incr(key)
    except Exception as e:
        logger.warning("increment_install_count failed: %s", e)
        return 1


def get_install_count(tool_id: str) -> int | None:
    try:
        r = get_redis()
        val = r.get(f"install_count:{tool_id}")
        return int(val) if val else None
    except Exception as e:
        logger.warning("get_install_count failed: %s", e)
        return None

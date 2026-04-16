import time
from fastapi import HTTPException
from api.services.cache import get_redis


def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    r = get_redis()
    redis_key = f"ratelimit:{key}"
    now = time.time()
    window_start = now - window_seconds

    pipe = r.pipeline()
    pipe.zremrangebyscore(redis_key, 0, window_start)
    pipe.zadd(redis_key, {str(now): now})
    pipe.zcard(redis_key)
    pipe.expire(redis_key, window_seconds)
    results = pipe.execute()

    count = results[2]
    if count > max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds}s.",
        )

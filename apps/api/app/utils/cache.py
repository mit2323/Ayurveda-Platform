"""Redis cache service — typed wrappers around raw redis commands."""
import json
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings


class CacheService:
    def __init__(self, redis: aioredis.Redis) -> None:
        self.redis = redis
        self.default_ttl = settings.CACHE_TTL_SECONDS

    async def get(self, key: str) -> str | None:
        return await self.redis.get(key)

    async def get_json(self, key: str) -> Any | None:
        raw = await self.redis.get(key)
        return json.loads(raw) if raw else None

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        await self.redis.set(key, value, ex=ttl or self.default_ttl)

    async def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        await self.redis.set(key, json.dumps(value, default=str), ex=ttl or self.default_ttl)

    async def delete(self, key: str) -> None:
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str) -> None:
        """Delete all keys matching a glob pattern (use sparingly in prod)."""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

    async def exists(self, key: str) -> bool:
        return bool(await self.redis.exists(key))

    async def increment(self, key: str, ttl: int | None = None) -> int:
        count = await self.redis.incr(key)
        if count == 1 and ttl:
            await self.redis.expire(key, ttl)
        return count

    # ── Rate limiting helpers ─────────────────────────────────────────────────
    async def check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int
    ) -> tuple[bool, int]:
        """
        Sliding-window rate limit check.
        Returns (allowed: bool, remaining: int).
        """
        count = await self.increment(key, ttl=window_seconds)
        allowed = count <= max_requests
        remaining = max(0, max_requests - count)
        return allowed, remaining

    # ── Cart in Redis ─────────────────────────────────────────────────────────
    CART_TTL = 60 * 60 * 24 * 7  # 7 days

    def _cart_key(self, user_id: int) -> str:
        return f"cart:{user_id}"

    async def get_cart(self, user_id: int) -> dict[str, Any]:
        raw = await self.redis.get(self._cart_key(user_id))
        return json.loads(raw) if raw else {"items": {}}

    async def set_cart(self, user_id: int, cart: dict[str, Any]) -> None:
        await self.redis.set(
            self._cart_key(user_id),
            json.dumps(cart, default=str),
            ex=self.CART_TTL,
        )

    async def clear_cart(self, user_id: int) -> None:
        await self.redis.delete(self._cart_key(user_id))
import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null | undefined;
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    console.warn("[Redis] REDIS_URL is not set — rate limiting and velocity checks will be skipped.");
    return null;
  }

  // Guard against the REDIS_URL being set to a CLI invocation string
  // (e.g. "redis-cli -u redis://...") instead of a bare URL.
  if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
    console.error(
      "[Redis] REDIS_URL does not look like a valid Redis URL (must start with redis:// or rediss://). " +
      "Rate limiting will be skipped. Current value starts with: " + url.slice(0, 20)
    );
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      connectTimeout: 5000,
      tls: url.startsWith("rediss://") ? {} : undefined,
      retryStrategy(times) {
        // Stop retrying immediately on auth errors — avoids WRONGPASS log spam
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });

    client.on("error", (err: Error & { command?: unknown }) => {
      const msg = err.message || "";
      if (msg.includes("WRONGPASS") || msg.includes("NOAUTH")) {
        console.error("[Redis] Auth failed — check REDIS_URL password in env vars.");
      } else {
        console.error("[Redis] connection error:", err);
      }
    });

    return client;
  } catch (err) {
    console.error("[Redis] Failed to create client — rate limiting will be skipped:", err);
    return null;
  }
}

export const redis: Redis | null =
  process.env.NODE_ENV === "production"
    ? createRedisClient()
    : (globalThis.__redis !== undefined
        ? globalThis.__redis
        : (globalThis.__redis = createRedisClient()));

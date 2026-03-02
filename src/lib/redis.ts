import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null | undefined;
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Redis] REDIS_URL is not set — rate limiting and velocity checks will be skipped.");
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: false,
    connectTimeout: 5000,
    tls: url.startsWith("rediss://") ? {} : undefined,
  });

  client.on("error", (err) => {
    console.error("[Redis] connection error:", err);
  });

  return client;
}

export const redis: Redis | null =
  process.env.NODE_ENV === "production"
    ? createRedisClient()
    : (globalThis.__redis !== undefined
        ? globalThis.__redis
        : (globalThis.__redis = createRedisClient()));

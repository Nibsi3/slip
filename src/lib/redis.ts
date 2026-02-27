import Redis from "ioredis";

const getRedisUrl = (): string => {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("FATAL: REDIS_URL environment variable is not set.");
  }
  return url;
};

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  });

  client.on("error", (err) => {
    console.error("[Redis] connection error:", err);
  });

  return client;
}

export const redis: Redis =
  process.env.NODE_ENV === "production"
    ? createRedisClient()
    : (globalThis.__redis ?? (globalThis.__redis = createRedisClient()));

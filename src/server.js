const express = require("express");
const { createClient } = require("redis");
const { createApp } = require("./app");

const PORT = Number(process.env.PORT || 3000);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CACHE_TTL_SECONDS = Math.max(1, Number(process.env.CACHE_TTL_SECONDS || 60));

async function main() {
  const redisClient = createClient({ url: REDIS_URL });

  redisClient.on("error", error => {
    console.error("Redis client error:", error.message);
  });

  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.warn("Could not connect to Redis. API will run without cache:", error.message);
  }

  const app = createApp({ redisClient, ttlSeconds: CACHE_TTL_SECONDS });
  const server = app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/products`);
  });

  async function shutdown() {
    server.close();
    if (redisClient.isOpen) {
      try { await redisClient.quit(); } catch (_) {}
    }
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

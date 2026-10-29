const express = require("express");
const { createProductCache } = require("./cache");

const sampleProducts = [
  { id: 1, name: "Keyboard", price: 899 },
  { id: 2, name: "Mouse", price: 499 },
  { id: 3, name: "Monitor", price: 7999 },
  { id: 4, name: "USB-C Cable", price: 299 },
  { id: 5, name: "Laptop Stand", price: 1199 }
];

function createApp({ redisClient, ttlSeconds = 60, loadProducts } = {}) {
  const app = express();
  app.use(express.json());

  // Simulates a slow database call. Replace this with a real database later.
  const fetchProducts = loadProducts || (async () => {
    await new Promise(resolve => setTimeout(resolve, 700));
    return sampleProducts;
  });

  const getProducts = createProductCache({
    redisClient,
    ttlSeconds,
    loadProducts: fetchProducts
  });

  app.get("/products", async (req, res) => {
    try {
      const result = await getProducts();
      res.json({
        ...result,
        cacheTtlSeconds: ttlSeconds
      });
    } catch (error) {
      console.error("Failed to load products:", error);
      res.status(500).json({ error: "Could not load products" });
    }
  });

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      redis: redisClient?.isReady ? "connected" : "unavailable"
    });
  });

  return app;
}

module.exports = { createApp };

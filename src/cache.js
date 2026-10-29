function createProductCache({ redisClient, ttlSeconds = 60, loadProducts }) {
  return async function getProducts() {
    const key = "products:v1";

    // If Redis is unavailable, fall back to the data source.
    try {
      if (redisClient?.isReady) {
        const cached = await redisClient.get(key);
        if (cached !== null) {
          return { products: JSON.parse(cached), source: "cache" };
        }
      }
    } catch (error) {
      console.warn("Redis read failed; using data source:", error.message);
    }

    const products = await loadProducts();

    try {
      if (redisClient?.isReady) {
        await redisClient.set(key, JSON.stringify(products), {
          EX: ttlSeconds
        });
      }
    } catch (error) {
      console.warn("Redis write failed; returning data source result:", error.message);
    }

    return { products, source: "database" };
  };
}

module.exports = { createProductCache };

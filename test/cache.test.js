const test = require("node:test");
const assert = require("node:assert/strict");
const { createProductCache } = require("../src/cache");

function fakeRedis() {
  const store = new Map();
  return {
    isReady: true,
    store,
    async get(key) { return store.has(key) ? store.get(key).value : null; },
    async set(key, value, options) {
      store.set(key, { value, ttl: options.EX });
    }
  };
}

test("first request loads data; second request uses cache", async () => {
  const redisClient = fakeRedis();
  let calls = 0;
  const getProducts = createProductCache({
    redisClient,
    ttlSeconds: 60,
    loadProducts: async () => {
      calls++;
      return [{ id: 1, name: "Keyboard" }];
    }
  });

  const first = await getProducts();
  const second = await getProducts();

  assert.equal(first.source, "database");
  assert.equal(second.source, "cache");
  assert.equal(calls, 1);
  assert.equal(redisClient.store.get("products:v1").ttl, 60);
});

test("falls back to data source when Redis is unavailable", async () => {
  const redisClient = {
    isReady: false,
    async get() { throw new Error("Should not be called"); },
    async set() { throw new Error("Should not be called"); }
  };
  const getProducts = createProductCache({
    redisClient,
    loadProducts: async () => [{ id: 2, name: "Mouse" }]
  });

  const result = await getProducts();
  assert.equal(result.source, "database");
  assert.equal(result.products[0].name, "Mouse");
});

test("falls back when Redis read fails", async () => {
  const redisClient = {
    isReady: true,
    async get() { throw new Error("Redis down"); },
    async set() { throw new Error("Redis down"); }
  };
  const getProducts = createProductCache({
    redisClient,
    loadProducts: async () => [{ id: 3, name: "Monitor" }]
  });

  const result = await getProducts();
  assert.equal(result.source, "database");
  assert.equal(result.products[0].name, "Monitor");
});

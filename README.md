# Redis Cache Practice

A small Express API that caches a simulated product data source in Redis for 60 seconds.

## Requirements

- Node.js 22 or newer
- Docker Desktop running (for Redis), or a Redis server installed locally

## 1. Install dependencies

From this folder:

```bash
npm install
```

This creates `package-lock.json` and `node_modules/`. Commit `package-lock.json` to Git.

## 2. Start Redis

```bash
docker compose up -d
```

Check Redis:

```bash
docker compose ps
docker exec -it redis-cache-practice redis-cli ping
```

Expected response: `PONG`.

## 3. Configure environment

Copy `.env.example` to `.env` if you want to keep a local record of the settings. This project uses environment variables supplied by your shell; it does not automatically load `.env`. You can set the values directly in PowerShell:

```powershell
$env:PORT="3000"
$env:REDIS_URL="redis://localhost:6379"
$env:CACHE_TTL_SECONDS="60"
```

## 4. Run the API

```bash
npm start
```

Open `http://localhost:3000/products` twice.

- First response: `"source": "database"` — simulated data source was called and result stored in Redis.
- Second response: `"source": "cache"` — result came from Redis.
- Wait 60 seconds and call again; the cache entry should have expired and the simulated source will be called again.

The data source is deliberately simulated with a 700 ms delay; this is not a real database.

## 5. Run tests

In another terminal:

```bash
npm test
```

Tests cover cache miss/hit behavior and fallback when Redis is unavailable or read fails. The TTL is configured in Redis; the tests verify the TTL setting but do not wait a full 60 seconds to test real-time expiration.

## 6. Stop Redis

```bash
docker compose down
```

## Dependency concepts

- `express`: creates HTTP routes such as `GET /products`.
- `redis`: lets Node.js read and write cached values in Redis.
- `dependencies`: libraries required to run the application.
- `package-lock.json`: records the resolved versions for repeatable installs.
- `npm ci`: installs exactly from the lockfile and fails if it disagrees with `package.json`.
- Cache miss: the key is not present or has expired, so load from the data source.
- Cache hit: the key exists, so return the cached value.
- TTL: time to live; this project's cache entries expire after 60 seconds.

## CI/CD

The GitHub Actions workflow in `.github/workflows/ci.yml` installs dependencies with `npm ci` and runs tests on pushes and pull requests to `main`. It does not deploy to AWS yet: first get the local project and CI checks working. Deployment can be added as a second learning step.

## Troubleshooting

- `ECONNREFUSED localhost:6379`: start Docker Desktop, then run `docker compose up -d`.
- `npm ci` says lockfile is missing: run `npm install` once, then commit `package-lock.json`.
- `source` always says `database`: verify Redis is running and the second request occurs within 60 seconds.



Testing CI from redis-cache branch.
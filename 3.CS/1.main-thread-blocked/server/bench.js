import { performance } from "perf_hooks"; // 고정밀 시간 측정에 사용

const URL = "http://localhost:3000/";
const CONCURRENCY = 20;
const TOTAL = 400;

async function one() {
  const t0 = performance.now();
  const r = await fetch(URL);
  await r.text();
  return performance.now() - t0;
}

function percentile(arr, p) {
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.floor((p / 100) * a.length));
  return a[idx];
}

async function main() {
  const lat = [];
  let i = 0;

  async function worker() {
    while (true) {
      const k = i++;
      if (k >= TOTAL) break;
      lat.push(await one());
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log({
    total: TOTAL,
    concurrency: CONCURRENCY,
    p50_ms: percentile(lat, 50).toFixed(1),
    p95_ms: percentile(lat, 95).toFixed(1),
    p99_ms: percentile(lat, 99).toFixed(1),
  });
}

main();
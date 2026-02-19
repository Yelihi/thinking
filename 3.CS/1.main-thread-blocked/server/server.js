import http from "http";
import fs from "fs";

const port = 3000;

// 토글: true=요청마다 sync I/O(느림), false=캐시(개선)
const USE_SLOW = true;
const USE_ASYNC_READ_FILE = true;

const cached = fs.readFileSync("./server.js", "utf8");

function asyncReadFile(req, res) {
  const t0 = performance.now()

  fs.readFile("./server.js", "utf8", (err, data) => {
    const t1 = performance.now();

    if (err) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: err.message }));
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, bytes: data.length, io_ms: +(t1 - t0).toFixed(2) }));
  })
}

function slow(req, res) {
  const t0 = performance.now();

  const data = fs.readFileSync("./server.js", "utf8");
  const t1 = performance.now();
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, bytes: data.length, io_ms: +(t1 - t0).toFixed(2) }));

}

function fast(req, res) {
  const t0 = performance.now();
  // 필요하면 CPU 병목 비교를 위해 아래 주석 해제
  // let x = 0; for (let i = 0; i < 2_000_000; i++) x += i % 7;
  const t1 = performance.now();
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, bytes: cached.length, cpu_ms: +(t1 - t0).toFixed(2) }));
}

http.createServer((req, res) => {
  if (req.url === "/health") return res.end("ok");
  return (USE_SLOW ? slow : USE_ASYNC_READ_FILE ? asyncReadFile : fast)(req, res);
}).listen(port, () => console.log(`http://localhost:${port} USE_SLOW=${USE_SLOW}`));
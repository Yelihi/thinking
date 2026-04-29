import { useState, useRef, useEffect, useMemo } from 'react'

// type
import type { FromWorker, ToWorker } from './workers/types'

// worker
function createWorker() {
  const worker = new Worker(new URL('./workers/worker.ts', import.meta.url), { type: 'module' })
  return worker
}


function App() {
  const workerRef = useRef<Worker | null>(null)

  const [query, setQuery] = useState("");
  const [size, setSize] = useState(0)
  const [ready, setReady] = useState(true)
  const [status, setStatus] = useState('Idle')
  const [count, setCount] = useState(0)

  // 결과 indices는 Uint32Array로 유지(불필요한 변환 비용 방지)
  const [indices, setIndices] = useState<Uint32Array>(new Uint32Array());

  const pageSize = 50;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(indices.length / pageSize));
  const startAt = page * pageSize;

  const requestIdRef = useRef(0);
  const latestIdRef = useRef(0);

  const items = useMemo(() => {
    const N = 2_000_000;
    return Array.from({ length: N }, (_, i) => `item-${i}-react-worker-cancel-strategy`);
  }, [])

  const view = useMemo(() => {
    const out: string[] = [];
    const end = Math.min(startAt + pageSize, indices.length);
    for (let i = startAt; i < end; i++) {
      out.push(items[indices[i]]);
    }
    return out.length === 0 ? items.slice(0, pageSize) : out;
  }, [indices, startAt, pageSize, items]);

  function start(q: string) {
    if (!ready || !workerRef.current) return;

    const id = ++requestIdRef.current;
    latestIdRef.current = id;

    setStatus(`Start id=${id}`);
    console.log(`[main] t=${performance.now().toFixed(1)} START id=${id} q="${q}"`);

    const msg: ToWorker = { type: "START", requestId: id, query: q };
    workerRef.current.postMessage(msg);
  }

  function cancelLatest() {
    if (!ready || !workerRef.current) return;

    const id = latestIdRef.current;
    console.log(`[main] t=${performance.now().toFixed(1)} CANCEL id=${id}`);

    const msg: ToWorker = { type: "CANCEL", requestId: id };
    workerRef.current.postMessage(msg);
  }

  useEffect(() => {
    const worker = createWorker();
    workerRef.current = worker;

    // message 등록
    workerRef.current.onmessage = (e: MessageEvent<FromWorker>) => {
      const msg = e.data;
      const t = performance.now().toFixed(1);

      switch (msg.type) {
        case 'READY': {
          setReady(true);
          setSize(msg.size);
          console.log(`[main] t=${t} READY size=${msg.size}`);
          return;
        }
        case 'PROGRESS': {
          if (msg.requestId !== latestIdRef.current) return;
          setStatus('progress');
          console.log(`[main] t=${t} PROGRESS id=${msg.requestId} ${msg.done}/${msg.total}`);
          return;
        }
        case 'RESULT': {
          if (msg.requestId !== latestIdRef.current) {
            console.log(`[main] t=${t} RESULT id=${msg.requestId} dropped`);
            return;
          }
          console.log(`[main] t=${t} RESULT id=${msg.requestId} applied count=${msg.indices.length}`);
          setIndices(msg.indices);
          setCount(msg.indices.length);
          setStatus(`Done id=${msg.requestId}`);
          return
        }
        case 'CANCELED': {
          if (msg.requestId !== latestIdRef.current) return;
          setStatus(`Canceled id=${msg.requestId}`);
          console.log(`[main] t=${t} CANCELED id=${msg.requestId}`);
          return;
        }
        case 'ERROR': {
          setStatus(`Error: ${msg.message}`);
          return;
        }
      }
    }

    const initMessage: ToWorker = {
      type: "INIT",
      list: items
    }

    workerRef.current.postMessage(initMessage)

    return () => {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [])

  useEffect(() => {
    if (workerRef.current && items.length > 0) {
      workerRef.current.postMessage({
        type: 'INIT', list: items
      })
    }

  }, [items])


  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <h2>Worker Cancel Strategy (MessageChannel Yield)</h2>

      <div style={{ marginBottom: 8 }}>
        <b>Ready:</b> {String(ready)} / <b>Items:</b> {size.toLocaleString()}
      </div>

      <input
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          // 실전에서는 debounce 가능. 오늘은 "연속 START" 재현이 목적이라 즉시 start를 걸어도 됨.
          start(v);
        }}
        placeholder="Type to start jobs quickly..."
        style={{ padding: 10, fontSize: 16, width: 520 }}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={() => start(query)} disabled={!ready} style={{ padding: "8px 12px" }}>
          Start
        </button>
        <button onClick={cancelLatest} disabled={!ready} style={{ padding: "8px 12px", marginLeft: 8 }}>
          Cancel latest
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <b>Status:</b> {status} &nbsp; | &nbsp; <b>Result count:</b> {count.toLocaleString()}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          Prev
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {page + 1} / {totalPages}
        </span>
        <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
          Next
        </button>
      </div>

      <ul style={{ marginTop: 12 }}>
        {view.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>

      <p style={{ marginTop: 10, color: "#6b7280" }}>
        Tip: DevTools Performance로 worker yield 전/후 cancel 반영 속도를 비교하세요. 콘솔 로그에 타임스탬프가 찍힙니다.
      </p>
    </div>
  )
}

export default App

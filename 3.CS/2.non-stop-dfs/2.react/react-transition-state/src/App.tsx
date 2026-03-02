import { useState, useMemo, useTransition, useEffect, useDeferredValue } from 'react'

import { makeArrayItems } from './shared/utils'

import type { PostFilterMessage } from './shared/workers/filterItems.worker'

function useDebounce<T>(value: T, ms: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, ms)
    return () => clearTimeout(handler)
  }, [value])

  return debouncedValue
}

const BIG = makeArrayItems(10000000)
const initialIndices = Array.from({ length: BIG.length }, (_, i) => i)
const worker = new Worker(new URL("./shared/workers/filterItems.worker.ts", import.meta.url), { type: "module" })

worker.postMessage({
  type: 'init',
  list: BIG
})


function App() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [indices, setIndices] = useState<number[]>(initialIndices)
  const [working, setWorking] = useState(false);
  // const [isPending, startTransition] = useTransition();

  worker.onmessage = (e: MessageEvent<PostFilterMessage>) => {
    setWorking(false);
    const { type, indices } = e.data;

    if (type === "Ready") {
      console.log("worker ready")
    }

    if (type === "Error") {
      console.log("worker error")
    }

    if (type === "Result") {
      const newIndices = Array.from(indices)
      setIndices(newIndices)
    }
  }

  const immediateCount = useMemo(() => {
    return query.length;
  }, [query])

  useEffect(() => {
    setWorking(true);
    worker.postMessage({
      type: "query",
      query: query,
    })
  }, [query])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;


    // 즉각 처리될 작업
    setQuery(next);
    // const q = next.toLocaleLowerCase()
    // const filtered = BIG.filter((item) => item.includes(q))
    // setFiltered(filtered)

    // 비싼 작업이기에 분할하여 처리될 작업
    // startTransition(() => {
    //   const q = next.toLocaleLowerCase()
    //   const filtered = BIG.filter((item) => item.includes(q))
    //   setFiltered(filtered)
    // })

  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui' }}>
      <input value={query} onChange={onChange} placeholder='type 0 - 30000 number' style={{ padding: 10, fontSize: 16, width: 420 }} />

      <div style={{ marginTop: 12 }}>
        <b>Immediate:</b> query length = {immediateCount}
        <span style={{ marginLeft: 12, color: working ? "#b45309" : "#047857" }}>
          {working ? "worker pending..." : "Idle"}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <b>Results:</b> {indices.length}
      </div>

      <ul style={{ marginTop: 12, maxHeight: 360, overflow: "auto", border: "1px solid #eee", padding: 10 }}>
        {indices.slice(0, 300).map((x) => (
          <li key={x}>{BIG[x]}</li>
        ))}
      </ul>

      <p style={{ marginTop: 10, color: "#6b7280" }}>
        Tip: 결과 리스트는 일부만 렌더(slice)해서 렌더 비용을 분리하고, filter 비용만 크게 유지해도 차이를 체감할 수 있어요.
      </p>
    </div>
  )
}

export default App

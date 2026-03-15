import { useState, useRef, useEffect } from "react"
import { items } from "../data/items";

import type { WorkerResponse } from "../workers/interface";
import { PER_PAGE } from "../data/const";

export const WorkerLine = () => {
    const [query, setQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [resultIndices, setResultIndices] = useState<Uint32Array | null>(null);
    const worker = useRef(new Worker(new URL("../workers/filter.worker.ts", import.meta.url), { type: "module" }))
    const requestId = useRef(0);

    const start = page * PER_PAGE;
    const end = start + PER_PAGE;
    const viewIndices = resultIndices?.slice(start, end);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        // worker 에 해당 query 전달
        const currentId = ++requestId.current;
        worker.current.postMessage({ type: "QUERY", query: inputValue, requestId: currentId })
        setQuery(event.target.value);
    }

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
        const { type } = event.data;

        switch (type) {
            case "READY":
                console.log("Worker is Ready")
                return;
            case "ERROR":
                setError(event.data.message)
                console.log("error cause: " + event.data.message)
                return;
            case "RESULT":
                const { requestId: receivedRequestId, indices } = event.data;

                if (receivedRequestId !== requestId.current) {
                    return;
                }

                setResultIndices(indices);
                setError(null);
                return;
            default:
                const _exhaustive: never = type;
                return _exhaustive;
        }
    }

    useEffect(() => {
        worker.current.postMessage({ type: "INIT", list: items })
        worker.current.onmessage = onMessage;
        return () => {
            worker.current.onmessage = null;
        }
    }, [])


    return (
        <main className="app-shell">
            <section className="hero">
                <p className="eyebrow">실험군</p>
                <h1>worker + paging + profiler</h1>
                <p className="intro">
                    worker 에서 query 를 전달받아 indices 를 반환하여 전달해주기
                </p>
            </section>

            <section className="panel">
                <label className="field">
                    <span>Query</span>
                    <input
                        value={query}
                        onChange={onChange}
                        placeholder="여기에 검색어를 입력해주세요"
                    />
                    <div style={{ display: "flex", gap: "1rem", width: "100%", justifyContent: "center" }}>
                        <button onClick={() => setPage((prev) => prev > 0 ? prev - 1 : 0)}>Previous</button>
                        <button onClick={() => setPage((prev) => prev + 1)}>Next</button>
                    </div>
                </label>

                <div className="stats">
                    {error && <article>
                        <span>Error</span>
                        <strong>{error}</strong>
                    </article>}
                    <article>
                        <span>Total items</span>
                        <strong>{items.length}</strong>
                    </article>
                    <article>
                        <span>Matched items</span>
                        <strong>{resultIndices?.length ?? 0}</strong>
                    </article>
                </div>
            </section>

            <section className="results">
                <div className="results-header">
                    <h2>Preview</h2>
                    <p>Showing the first 12 matches resolved from worker-provided indices.</p>
                </div>

                <ul className="result-list">
                    {Array.from(viewIndices ?? []).map((index) => {
                        const item = items[index];
                        if (!item) return null;
                        return (
                            <li key={item.id} className="result-card">
                                <h3>{item.title}</h3>
                            </li>
                        );
                    })}
                    {resultIndices?.length === 0 ? (
                        <li className="empty-state">No matches for the current query.</li>
                    ) : null}
                </ul>
            </section>
        </main>
    )
}
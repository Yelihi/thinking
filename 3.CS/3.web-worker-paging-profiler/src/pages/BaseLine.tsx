import { useState } from "react"

import { items } from "../data/items"
import { PER_PAGE } from "../data/const"


export const BaseLine = () => {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);

    const start = page * PER_PAGE;
    const end = start + PER_PAGE;

    const resultIndices = items.filter((item) => item.title.toLowerCase().includes(query.toLocaleLowerCase())).slice(start, end);

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    }

    return (
        <main className="app-shell">
            <section className="hero">
                <p className="eyebrow">대조군</p>
                <h1>메인스레드에서 query 입력 시 바로 filtering</h1>
                <p className="intro">
                    This starter keeps filtering off the UI thread and renders matched rows from returned
                    indices only. Paging and profiler comparisons can layer on top next.
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
                    <article>
                        <span>Total items</span>
                        <strong>{items.length}</strong>
                    </article>
                    <article>
                        <span>Matched items</span>
                        <strong>{resultIndices.length}</strong>
                    </article>
                </div>
            </section>

            <section className="results">
                <div className="results-header">
                    <h2>Preview</h2>
                    <p>Showing the first 12 matches resolved from worker-provided indices.</p>
                </div>

                <ul className="result-list">
                    {resultIndices.map((item) => (
                        <li key={item.id} className="result-card">
                            <h3>{item.title}</h3>
                        </li>
                    ))}
                    {resultIndices.length === 0 ? (
                        <li className="empty-state">No matches for the current query.</li>
                    ) : null}
                </ul>
            </section>
        </main>
    )
}
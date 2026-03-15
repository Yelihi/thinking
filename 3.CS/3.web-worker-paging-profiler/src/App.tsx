import { useEffect, useRef, useState } from 'react';
import './styles.css';

// pages
import { BaseLine } from './pages/BaseLine';
import { WorkerLine } from './pages/WorkerLine';

export default function App() {
  const [mode, setMode] = useState<'baseline' | 'worker'>('baseline');

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">woker + paging + profiler</p>
        <h1>Paging Profiler</h1>
        <p className="intro">
          query 를 통한 대규모 데이터 렌더링 시 worker 의 효과가 어느정도일지 React Profiler 로 체크
        </p>
      </header>

      <section className="panel">
        <div className="field">
          <span>Select Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'baseline' | 'worker')}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid rgba(155, 168, 171, 0.28)',
              borderRadius: '16px',
              background: 'rgba(6, 20, 27, 0.7)',
              color: 'inherit',
              font: 'inherit'
            }}
          >
            <option value="baseline">Baseline (Main Thread)</option>
            <option value="worker">Worker (Web Worker)</option>
          </select>
        </div>
      </section>

      <main>
        {mode === 'baseline' ? <BaseLine /> : <WorkerLine />}
      </main>
    </div>
  );
}

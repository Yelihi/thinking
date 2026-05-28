import { useState } from 'react'

import Select from '../components/Select';
import { RendererHost } from "../renderers/RendererHost";
import { rendererModes, markerCounts, distributions, scaffoldMetrics } from "./config";
import type {
  BenchmarkControls,
  MarkerCountOption,

} from "./types";


export function BenchmarkPage() {
  const [controls, setControls] = useState<BenchmarkControls>({
    rendererMode: "dom",
    markerCount: 100000,
    distribution: "uniform",
  })

  const changeControls = (newControls: BenchmarkControls) => {
    setControls(newControls);
  }

  return (
    <main className="app-shell">
      <section className="toolbar" aria-label="Benchmark controls">
        <div>
          <p className="eyebrow">React Map Benchmark</p>
          <h1>10만+ 마커 렌더링 실험</h1>
        </div>
        <div className="toolbar-grid">
          <fieldset>
            <legend>Renderer</legend>
            <div className="segmented-control">
              {rendererModes.map((renderer) => (
                <button
                  aria-pressed={renderer.mode === controls.rendererMode}
                  key={renderer.mode}
                  type="button"
                  onClick={() => changeControls({ ...controls, rendererMode: renderer.mode })}
                >
                  {renderer.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Marker Count
            <Select
              defaultValue={controls.markerCount}
              onChange={(e) => changeControls({ ...controls, markerCount: Number(e.target.value) as MarkerCountOption })}
              options={markerCounts}
            >
              {(options) => options.map((count) => (
                <option key={count} value={count}>
                  {count.toLocaleString("ko-KR")}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Distribution
            <Select defaultValue={controls.distribution} options={distributions}>
              {(options) => options.map((distribution) => (
                <option key={distribution.value} value={distribution.value}>
                  {distribution.label}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </section>

      <section className="workspace">
        <RendererHost controls={controls} />
        <aside className="metrics-panel" aria-label="Benchmark metrics">
          <h2>Metrics</h2>
          <dl>
            {scaffoldMetrics.map((metric) => (
              <div data-tone={metric.tone ?? "neutral"} key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      {/* <section className="manual-boundary" aria-label="Manual implementation boundary">
        <h2>수동 구현 경계</h2>
        <ul>
          <li>benchmark state model 정의</li>
          <li>React state와 renderer 내부 state의 책임 분리 판단</li>
          <li>renderer 선택을 공통 renderer boundary에 연결</li>
        </ul>
      </section> */}
    </main>
  );
}

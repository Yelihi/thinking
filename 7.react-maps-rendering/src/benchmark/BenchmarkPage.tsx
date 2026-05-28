import { useState, useCallback } from 'react'

import Select from '../components/Select';
import { RendererHost } from "../renderers/RendererHost";
import { rendererModes, markerCounts, distributions, scaffoldMetrics } from "./config";
import type {
  BenchmarkControls,
  MarkerCountOption,
  MarkerDistribution,
  RendererMode,
} from "./types";


const formatMarkerCount = (count: number) => count.toLocaleString("ko-KR");


export function BenchmarkPage() {
  const [controls, setControls] = useState<BenchmarkControls>({
    rendererMode: "dom",
    markerCount: 100000,
    distribution: "uniform",
  })

  const defaultMarkerCount = controls.markerCount;
  const defaultDistribution = controls.distribution;

  const handleMarkerCountChange = useCallback((newCount: MarkerCountOption) => {
    setControls((prev) => ({ ...prev, markerCount: newCount }));
  }, []);

  const handleDistributionChange = useCallback((newDistribution: typeof distributions[number]) => {
    setControls((prev) => ({ ...prev, distribution: newDistribution.value }));
  }, []);

  const changeRendererMode = useCallback((newMode: RendererMode) => {
    setControls((prev) => ({ ...prev, rendererMode: newMode }));
  }, []);


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
                  onClick={() => changeRendererMode(renderer.mode)}
                >
                  {renderer.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Marker Count
            <Select<MarkerCountOption>
              defaultValue={defaultMarkerCount}
              onChange={handleMarkerCountChange}
              options={markerCounts}
              getOptionLabel={formatMarkerCount}
            />
          </label>
          <label>
            Distribution
            <Select<typeof distributions[number]> defaultValue={defaultDistribution} options={distributions} onChange={handleDistributionChange} />
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

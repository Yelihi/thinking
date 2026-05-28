import { useCallback, useState } from "react";

import Select from "../components/Select";
import { RendererHost } from "../renderers/RendererHost";
import { rendererModes, markerCounts, distributions, scaffoldMetrics } from "./config";
import { createInitialBenchmarkState, setBenchmarkControls, setViewport } from "./state";
import type {
  BenchmarkViewport,
  MarkerCountOption,
  RendererMode,
} from "./types";


const formatMarkerCount = (count: number) => count.toLocaleString("ko-KR");

const viewportStep = 80;
const zoomStep = 0.25;
const minZoom = 0.5;
const maxZoom = 4;

function clampZoom(zoom: number) {
  return Math.min(maxZoom, Math.max(minZoom, Number(zoom.toFixed(2))));
}

export function BenchmarkPage() {
  const [benchmarkState, setBenchmarkState] = useState(createInitialBenchmarkState);

  const { controls, viewport } = benchmarkState;

  const updateViewport = useCallback((nextViewport: BenchmarkViewport) => {
    setBenchmarkState((prev) => setViewport(prev, nextViewport));
  }, []);

  const handleMarkerCountChange = useCallback((newCount: MarkerCountOption) => {
    setBenchmarkState((prev) => setBenchmarkControls(prev, { markerCount: newCount }));
  }, []);

  const handleDistributionChange = useCallback((newDistribution: typeof distributions[number]) => {
    setBenchmarkState((prev) => setBenchmarkControls(prev, { distribution: newDistribution.value }));
  }, []);

  const changeRendererMode = useCallback((newMode: RendererMode) => {
    setBenchmarkState((prev) => setBenchmarkControls(prev, { rendererMode: newMode }));
  }, []);

  const panViewport = useCallback((deltaX: number, deltaY: number) => {
    setBenchmarkState((prev) =>
      setViewport(prev, {
        ...prev.viewport,
        centerX: prev.viewport.centerX + deltaX,
        centerY: prev.viewport.centerY + deltaY,
      }),
    );
  }, []);

  const changeZoom = useCallback((nextZoom: number) => {
    setBenchmarkState((prev) =>
      setViewport(prev, {
        ...prev.viewport,
        zoom: clampZoom(nextZoom),
      }),
    );
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
              value={controls.markerCount}
              onChange={handleMarkerCountChange}
              options={markerCounts}
              getOptionLabel={formatMarkerCount}
            />
          </label>
          <label>
            Distribution
            <Select<typeof distributions[number]>
              value={controls.distribution}
              options={distributions}
              onChange={handleDistributionChange}
            />
          </label>
        </div>
      </section>

      <section className="workspace">
        <RendererHost
          controls={controls}
          viewport={viewport}
          onViewportChange={updateViewport}
        />
        <aside className="metrics-panel" aria-label="Benchmark metrics">
          <h2>Metrics</h2>
          <dl>
            {scaffoldMetrics.map((metric) => (
              <div data-tone={metric.tone ?? "neutral"} key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
            <div data-tone="success">
              <dt>Viewport</dt>
              <dd>
                {viewport.centerX}, {viewport.centerY} / {viewport.zoom.toFixed(2)}x
              </dd>
            </div>
          </dl>
          <section className="viewport-controls" aria-label="Viewport controls">
            <h2>Viewport</h2>
            <div className="pan-grid">
              <button type="button" onClick={() => panViewport(0, -viewportStep)}>N</button>
              <button type="button" onClick={() => panViewport(-viewportStep, 0)}>W</button>
              <button type="button" onClick={() => panViewport(viewportStep, 0)}>E</button>
              <button type="button" onClick={() => panViewport(0, viewportStep)}>S</button>
            </div>
            <label>
              Zoom
              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step={zoomStep}
                value={viewport.zoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => updateViewport({ centerX: 0, centerY: 0, zoom: 1 })}
            >
              Reset
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}

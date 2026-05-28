import type { BenchmarkRendererProps } from "../../benchmark/types";

export function DomRendererPlaceholder({ controls, viewport }: BenchmarkRendererProps) {
  return (
    <section className="map-surface" aria-label="DOM marker renderer placeholder">
      <div
        className="map-grid"
        style={{
          transform: `translate(${-viewport.centerX}px, ${-viewport.centerY}px) scale(${viewport.zoom})`,
        }}
      />
      <div className="renderer-card">
        <p className="eyebrow">DOM Marker Baseline</p>
        <h2>{controls.markerCount.toLocaleString("ko-KR")}개 marker</h2>
        <p>
          Viewport {viewport.centerX}, {viewport.centerY} / {viewport.zoom.toFixed(2)}x
        </p>
        <p>SDK 유사 DOM marker baseline 구현 전 placeholder입니다.</p>
      </div>
    </section>
  );
}

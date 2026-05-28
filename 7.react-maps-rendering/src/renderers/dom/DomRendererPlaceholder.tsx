import type { RendererHostProps } from "../../benchmark/types";

export function DomRendererPlaceholder({ controls }: RendererHostProps) {
  return (
    <section className="map-surface" aria-label="DOM marker renderer placeholder">
      <div className="map-grid" />
      <div className="renderer-card">
        <p className="eyebrow">DOM Marker Baseline</p>
        <h2>{controls.markerCount.toLocaleString("ko-KR")}개 marker</h2>
        <p>SDK 유사 DOM marker baseline 구현 전 placeholder입니다.</p>
      </div>
    </section>
  );
}

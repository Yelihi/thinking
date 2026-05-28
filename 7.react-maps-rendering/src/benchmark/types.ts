export type RendererMode = "dom" | "canvas" | "webgl";

export type MarkerDistribution = "uniform" | "clustered" | "hotspot";

export type MarkerCountOption = 10000 | 50000 | 100000 | 300000;

export interface BenchmarkControls {
  rendererMode: RendererMode;
  markerCount: MarkerCountOption;
  distribution: MarkerDistribution;
}

export interface BenchmarkMetric {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success";
}

export interface RendererHostProps {
  controls: BenchmarkControls;
}

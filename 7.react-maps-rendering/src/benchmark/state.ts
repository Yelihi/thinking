import type { BenchmarkControls, BenchmarkState, BenchmarkViewport } from "./types";

export const initialBenchmarkControls: BenchmarkControls = {
  rendererMode: "dom",
  markerCount: 100000,
  distribution: "uniform",
};

export const initialBenchmarkViewport: BenchmarkViewport = {
  centerX: 0,
  centerY: 0,
  zoom: 1,
};

export function createInitialBenchmarkState(): BenchmarkState {
  return {
    controls: initialBenchmarkControls,
    viewport: initialBenchmarkViewport,
  };
}

export function setBenchmarkControls(
  state: BenchmarkState,
  controls: Partial<BenchmarkControls>,
): BenchmarkState {
  return {
    ...state,
    controls: {
      ...state.controls,
      ...controls,
    },
  };
}

export function setViewport(
  state: BenchmarkState,
  viewport: BenchmarkViewport,
): BenchmarkState {
  return {
    ...state,
    viewport,
  };
}

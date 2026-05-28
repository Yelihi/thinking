import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialBenchmarkState,
  setBenchmarkControls,
  setViewport,
} from "../src/benchmark/state.ts";

test("creates benchmark state with controls and mock viewport defaults", () => {
  const state = createInitialBenchmarkState();

  assert.deepEqual(state.controls, {
    rendererMode: "dom",
    markerCount: 100000,
    distribution: "uniform",
  });
  assert.deepEqual(state.viewport, {
    centerX: 0,
    centerY: 0,
    zoom: 1,
  });
});

test("updates controls without dropping viewport state", () => {
  const state = setViewport(createInitialBenchmarkState(), {
    centerX: 120,
    centerY: -80,
    zoom: 2,
  });

  const next = setBenchmarkControls(state, {
    distribution: "hotspot",
    markerCount: 300000,
  });

  assert.equal(next.controls.distribution, "hotspot");
  assert.equal(next.controls.markerCount, 300000);
  assert.deepEqual(next.viewport, state.viewport);
});

test("updates viewport without dropping control state", () => {
  const state = setBenchmarkControls(createInitialBenchmarkState(), {
    rendererMode: "webgl",
    distribution: "clustered",
  });

  const next = setViewport(state, {
    centerX: -40,
    centerY: 64,
    zoom: 1.5,
  });

  assert.deepEqual(next.controls, state.controls);
  assert.deepEqual(next.viewport, {
    centerX: -40,
    centerY: 64,
    zoom: 1.5,
  });
});

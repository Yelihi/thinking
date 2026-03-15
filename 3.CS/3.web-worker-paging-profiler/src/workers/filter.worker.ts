/// <reference lib="webworker" />

import { createWorkerHandler } from "./filter.handler";

import type { SearchItem } from '../data/interface';
import type { WorkerRequest, WorkerResponse, InitQueryMessage, QueryMessage, ResultMessage } from './interface';

declare const self: DedicatedWorkerGlobalScope;

let items: SearchItem[] | null = null;

const handlers = createWorkerHandler(items);

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type } = event.data;
  const handler = handlers[type];

  if (!handler) {
    self.postMessage({ type: "ERROR", message: "Unknown message type" })
    return;
  }

  handler(event.data as any)
};

import { setupWorker } from "msw/browser";

import { hotelHandlerMap } from "./handlers";

export const createWorker = () => {
  const handlers = Object.values(hotelHandlerMap).flat();

  return setupWorker(...handlers);
};

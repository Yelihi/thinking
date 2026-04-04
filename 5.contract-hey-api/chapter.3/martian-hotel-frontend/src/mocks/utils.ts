import { delay } from "msw";

export const randomDelay = async (
  minMilliseconds: number,
  maxMilliseconds: number,
): Promise<void> => {
  const delayDuration =
    minMilliseconds + Math.random() * (maxMilliseconds - minMilliseconds);

  return delay(delayDuration);
};

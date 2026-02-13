export interface LongTaskSample {
  id: string
  name: string
  duration: number
}

/**
 * @description 모니터링 도구입니다. 50ms 이상의 작업을 모니터링합니다.
 * @param onSample 샘플을 처리하는 함수입니다.
 */
export const observeLongTasks = (onSample: (sample: LongTaskSample) => void) => {
  // Long Tasks API: PerformanceLongTaskTiming (50ms+)
  if (typeof PerformanceObserver === 'undefined') return () => {}

  let obs: PerformanceObserver | null = null
  try {
    obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // entry 의 경우 PerformanceEntry 타입입니다.
        onSample({
          id: crypto.randomUUID(),
          name: entry.name ?? 'longtask', // 작업의 이름
          duration: entry.duration, // 작업의 시작부터 끝까지의 시간
        })
      }
    })
    obs.observe({ entryTypes: ['longtask'] }) // longtask 이라는 이벤트 타입을 관찰합니다.
  } catch {
    // chrome 을 제외한 브라우저에서는 지원하지 않기에
    return () => {}
  }

  return () => obs?.disconnect()
}

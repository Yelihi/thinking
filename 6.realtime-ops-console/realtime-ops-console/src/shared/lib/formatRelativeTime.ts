
// 현 시점을 now 로 주입받는 방향으로 진행
// 내부에서 Date.now 를 호출하게 되면 호출 시점에 따른 일관성 문제 발생
export function formatRelativeTime(t: number, now: number): string {
    const diff = Math.max(0, now - t);
    if (diff < 1000) return 'just now';
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
}
import { STALE_THRESHOLD_MS } from '@/shared/config/constants';
import type { NodeSnapshot, NodeStatus, EventLevel } from '@/entities/node/models/entities';

export function isStale(
    node: NodeSnapshot,
    now: number,
    thresholdMs: number = STALE_THRESHOLD_MS,
): boolean {
    return now - node.lastUpdatedAt > thresholdMs;
}

export function deriveStatus(cpu: number, memory: number): NodeStatus {
    const max = Math.max(cpu, memory);
    if (max >= 85) return 'critical';
    if (max >= 65) return 'warning';
    return 'healthy';
}

export function statusToEventLevel(status: NodeStatus): EventLevel {
    if (status === 'critical') return 'critical';
    if (status === 'warning') return 'warning';
    return 'info';
}
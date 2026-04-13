import { useEffect, useState } from 'react';

// shared
import { pushBound } from '@/shared/lib/ringBuffer';
import { METRIC_BUFFER_SIZE } from '@/shared/config/constants';

// entities
import type { NodeSnapshot, NodeMetricPoint } from '@/entities/node/models/entities';


export function useMetricBuffer(
    selectedSnapshot: NodeSnapshot | null,
    maxLen: number = METRIC_BUFFER_SIZE,
): NodeMetricPoint[] {
    const [buffer, setBuffer] = useState<NodeMetricPoint[]>([]);

    // 노드가 바뀌면 버퍼 초기화
    useEffect(() => {
        setBuffer([]);
    }, [selectedSnapshot?.id]);

    // 선택된 노드의 데이터가 갱신될 때만 push
    useEffect(() => {
        if (!selectedSnapshot) return;
        const point: NodeMetricPoint = {
            nodeId: selectedSnapshot.id,
            t: selectedSnapshot.lastUpdatedAt,
            cpu: selectedSnapshot.cpu,
            memory: selectedSnapshot.memory,
        };
        setBuffer((prev) => pushBound(prev, point, maxLen));
    }, [
        selectedSnapshot?.id,
        selectedSnapshot?.lastUpdatedAt,
        selectedSnapshot?.cpu,
        selectedSnapshot?.memory,
        maxLen,
    ]);

    return buffer;
}
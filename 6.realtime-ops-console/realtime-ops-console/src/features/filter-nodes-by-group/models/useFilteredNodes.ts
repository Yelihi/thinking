import { useMemo } from 'react';
import type { NodeSnapshot } from '@/entities/node'

export function useFilteredNodes(
    nodes: Map<string, NodeSnapshot>,
    groupId: string | null
): NodeSnapshot[] {

    return useMemo(() => {
        const allNodes = Array.from(nodes.values());

        if (!groupId || groupId === 'root') return allNodes

        return allNodes.filter((node) => node.groupId === groupId);
    }, [nodes, groupId])
}
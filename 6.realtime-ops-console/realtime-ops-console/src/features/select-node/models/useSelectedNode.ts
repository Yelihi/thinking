import { useState, useCallback } from 'react'

interface UseSelectedNodeReturn {
    selectedNodeId: string | null;
    selectNode: (id: string) => void;
    clearSelection: () => void;
}

export function useSelectedNode(): UseSelectedNodeReturn {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

    const selectNode = useCallback((id: string) => setSelectedNodeId(id), [])
    const clearSelection = useCallback(() => setSelectedNodeId(null), [])

    return {
        selectedNodeId,
        selectNode,
        clearSelection
    }
}
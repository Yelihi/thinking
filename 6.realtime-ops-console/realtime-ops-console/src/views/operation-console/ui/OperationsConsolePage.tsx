import { useState } from 'react';

// shared
import { useNowTicker } from '@/shared/hooks/useNowTicker';

// entities
import { useRealtimeNodes, useMetricBuffer } from '@/entities/node';
import { MOCK_GROUPS } from '@/entities/org-group/models/mockGroups';

// features
import { useSelectedNode } from '@/features/select-node/models/useSelectedNode';
import { useFilteredNodes } from '@/features/filter-nodes-by-group/models/useFilteredNodes';

// widgets
import { OrgTree, NodeGrid, NodeDetailPanel, ConnectionStatusBar } from '@/widgets';

export function OperationsConsolePage() {
    // 1. 데이터 소스
    const { nodes, eventByNode, connection } = useRealtimeNodes();
    const now = useNowTicker();

    // 2. UI 상태
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>('root');
    const { selectedNodeId, selectNode } = useSelectedNode();

    // 3. 파생 데이터
    const filteredNodes = useFilteredNodes(nodes, selectedGroupId);
    const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) ?? null : null;
    const metricBuffer = useMetricBuffer(selectedNode);
    const selectedEvents = selectedNodeId
        ? eventByNode.get(selectedNodeId) ?? []
        : [];

    // 4. 조립
    return (
        <div className="grid h-screen bg-slate-100 grid-rows-[56px_1fr] grid-cols-[240px_1fr_360px]">
            <header className="col-span-3 flex items-center justify-between px-4 bg-white border-b border-slate-200">
                <h1 className="text-base font-semibold text-slate-800">Operations Console</h1>
                <ConnectionStatusBar connection={connection} />
            </header>

            <aside className="bg-white border-r border-slate-200 overflow-auto">
                <OrgTree
                    groups={MOCK_GROUPS}
                    selectedGroupId={selectedGroupId}
                    onSelect={setSelectedGroupId}
                />
            </aside>

            <main className="overflow-hidden bg-white">
                <NodeGrid
                    nodes={filteredNodes}
                    selectedNodeId={selectedNodeId}
                    now={now}
                    onSelect={selectNode}
                />
            </main>

            <section className="p-3 overflow-hidden">
                <NodeDetailPanel
                    node={selectedNode}
                    metricBuffer={metricBuffer}
                    events={selectedEvents}
                    now={now}
                />
            </section>
        </div>
    );
}
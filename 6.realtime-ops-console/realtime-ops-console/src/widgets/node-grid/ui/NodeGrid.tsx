import { container } from 'tsyringe'

// entities
import { NodeBehavior } from '@/entities/node';
import type { NodeSnapshot } from '@/entities/node';

import { NodeRow } from './NodeRow';

interface NodeGridProps {
    nodes: NodeSnapshot[];
    selectedNodeId: string | null;
    now: number;
    onSelect: (id: string) => void;
}

export function NodeGrid({ nodes, selectedNodeId, now, onSelect }: NodeGridProps) {
    const nodeBehavior = container.resolve<NodeBehavior>(NodeBehavior)


    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-slate-400">
                선택된 그룹에 노드가 없습니다
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Group</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">CPU</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Memory</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Updated</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {nodes.map((node) => (
                        <NodeRow
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            isStale={nodeBehavior.checkNodeStale(node, now)}
                            now={now}
                            onSelect={onSelect}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
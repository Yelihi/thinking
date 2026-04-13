import type { NodeSnapshot, NodeStatus } from '@/entities/node';
import { Badge } from '@/shared/components/ui/badge/Badge';
import { formatRelativeTime } from '@/shared/lib/formatRelativeTime';

interface NodeRowProps {
    node: NodeSnapshot;
    isSelected: boolean;
    isStale: boolean;
    now: number;
    onSelect: (id: string) => void;
}

const statusToTone = (status: NodeStatus) => {
    switch (status) {
        case 'healthy': return 'success';
        case 'warning': return 'warning';
        case 'critical': return 'critical';
        default: return 'neutral';
    }
};

export function NodeRow({ node, isSelected, isStale, now, onSelect }: NodeRowProps) {
    const rowClass = [
        'cursor-pointer transition-colors',
        'hover:bg-slate-50',
        isSelected && 'bg-blue-50 hover:bg-blue-50',
        isStale && 'opacity-60 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.03)_8px,rgba(0,0,0,0.03)_16px)]',
    ].filter(Boolean).join(' ');

    return (
        <tr className={rowClass} onClick={() => onSelect(node.id)}>
            <td className="px-3 py-2 text-sm font-mono text-slate-700">{node.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{node.groupId}</td>
            <td className="px-3 py-2">
                <Badge tone={statusToTone(node.status)}>
                    {isStale ? `${node.status} (stale)` : node.status}
                </Badge>
            </td>
            <td className="px-3 py-2 text-sm text-right tabular-nums">{node.cpu.toFixed(0)}%</td>
            <td className="px-3 py-2 text-sm text-right tabular-nums">{node.memory.toFixed(0)}%</td>
            <td className="px-3 py-2 text-xs text-slate-500">
                {formatRelativeTime(node.lastUpdatedAt, now)}
            </td>
        </tr>
    );
}
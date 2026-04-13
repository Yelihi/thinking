import { container } from 'tsyringe'

// shared
import { Panel, Badge } from '@/shared/components/ui';
import { formatRelativeTime } from '@/shared/lib/formatRelativeTime';

// entities
import type { NodeSnapshot, NodeEvent, NodeMetricPoint } from '@/entities/node';
import { NodeBehavior } from '@/entities/node';

// widgets
import { MetricChart } from '@/widgets/node-detail-panel/ui/MetricChart';
import { EventList } from '@/widgets/node-detail-panel/ui/EventList';

interface NodeDetailPanelProps {
    node: NodeSnapshot | null;
    metricBuffer: NodeMetricPoint[];
    events: NodeEvent[];
    now: number;
}

export function NodeDetailPanel({ node, metricBuffer, events, now }: NodeDetailPanelProps) {
    const nodeBehavior = container.resolve<NodeBehavior>(NodeBehavior);


    if (!node) {
        return (
            <Panel title="Node Detail">
                <div className="flex items-center justify-center h-full text-sm text-slate-400">
                    노드를 선택하세요
                </div>
            </Panel>
        );
    }

    const stale = nodeBehavior.checkNodeStale(node, now);

    return (
        <Panel title={node.name}>
            <div className="flex flex-col gap-4">
                <header className="flex items-center justify-between">
                    <Badge tone={stale ? 'muted' : 'success'}>
                        {stale ? 'STALE' : 'LIVE'}
                    </Badge>
                    <span className="text-xs text-slate-500 tabular-nums">
                        {formatRelativeTime(node.lastUpdatedAt, now)}
                    </span>
                </header>

                <section className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-md">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">CPU</div>
                        <div className="text-2xl font-semibold tabular-nums text-slate-800">
                            {node.cpu.toFixed(0)}<span className="text-base text-slate-400">%</span>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-md">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Memory</div>
                        <div className="text-2xl font-semibold tabular-nums text-slate-800">
                            {node.memory.toFixed(0)}<span className="text-base text-slate-400">%</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        CPU Trend
                    </h4>
                    <div className="h-32">
                        <MetricChart points={metricBuffer} />
                    </div>
                </section>

                <section>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Recent Events
                    </h4>
                    <EventList events={events.slice(-3).reverse()} now={now} />
                </section>
            </div>
        </Panel>
    );
}
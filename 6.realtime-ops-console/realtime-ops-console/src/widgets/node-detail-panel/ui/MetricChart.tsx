import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { NodeMetricPoint } from '@/entities/node';

interface MetricChartProps {
    points: NodeMetricPoint[];
}

export function MetricChart({ points }: MetricChartProps) {
    if (points.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
                데이터 수집 중...
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    labelFormatter={() => ''}
                />
                <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
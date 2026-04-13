import type { NodeEvent, EventLevel } from '@/entities/node';
import { formatRelativeTime } from '@/shared/lib/formatRelativeTime';

interface EventListProps {
    events: NodeEvent[];
    now: number;
}

const levelDot: Record<EventLevel, string> = {
    info: 'bg-slate-400',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
};

export function EventList({ events, now }: EventListProps) {
    if (events.length === 0) {
        return <div className="text-xs text-slate-400">최근 이벤트 없음</div>;
    }

    return (
        <ul className="flex flex-col gap-1.5">
            {events.map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-xs">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${levelDot[e.level]}`} />
                    <div className="flex-1 min-w-0">
                        <div className="text-slate-700 truncate">{e.message}</div>
                        <div className="text-slate-400 tabular-nums">
                            {formatRelativeTime(e.t, now)}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
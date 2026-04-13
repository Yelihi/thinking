// shared
import { Badge } from '@/shared/components/ui/badge/Badge';

// entities
import type { ConnectionState } from '@/entities/node';

interface Props {
    connection: ConnectionState;
}

const stateToTone = (s: ConnectionState) => {
    if (s === 'connected') return 'success';
    if (s === 'reconnecting') return 'warning';
    return 'critical';
};

export function ConnectionStatusBar({ connection }: Props) {
    return (
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connection === 'connected' ? 'bg-emerald-500 animate-pulse'
                : connection === 'reconnecting' ? 'bg-amber-500 animate-pulse'
                    : 'bg-red-500'
                }`} />
            <Badge tone={stateToTone(connection)}>{connection.toUpperCase()}</Badge>
        </div>
    );
}
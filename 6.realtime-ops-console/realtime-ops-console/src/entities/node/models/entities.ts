// status 는 해당 cpu, memory 사용에 따른 도메인적 해석 상태
export type NodeStatus = "healthy" | "warning" | "critical" | "unknown";
// 클라이언트와 서버간의 연결 상태
export type ConnectionState = "connected" | "reconnecting" | "disconnected";
export type EventLevel = 'info' | 'warning' | 'critical';

export interface NodeSnapshot {
    id: string;
    name: string;
    groupId: string;
    status: NodeStatus;
    cpu: number; // 0~100
    memory: number; // 0~100
    // stale 판정은 노드별로 다르고, "데이터가 없음" 과 "오래됨" 은 다름
    lastUpdatedAt: number; // ms
}

// 한 순간의 metric
export interface NodeMetricPoint {
    nodeId: string;
    t: number;
    cpu: number;
    memory: number;
}

export interface NodeEvent {
    id: string;
    nodeId: string;
    t: number;
    level: EventLevel;
    message: string;
}
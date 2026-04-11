import { injectable } from "tsyringe";

import { STALE_THRESHOLD_MS } from "@/shared/config/constants";
import type { NodeSnapshot, EventLevel, NodeStatus } from "../entities";

/**
 * status를 결정하는 단일 진실의 원천(SSOT)**입니다. 
 * 서버에서 status가 내려온다면 클라이언트에서는 이걸 안 씁니다. 
 * 지금은 mock이므로 클라에서 결정하는데, 이걸 한 함수로 모아두면 나중에 서버 권한으로 옮길 때 호출 지점만 지우면 됩니다. 
 */
@injectable()
export class NodeBehavior {
    checkNodeStale(node: NodeSnapshot, now: number): boolean {
        return now - node.lastUpdatedAt > STALE_THRESHOLD_MS
    }

    deriveNodeStatus(cpu: number, memory: number): NodeStatus {
        const max = Math.max(cpu, memory)
        if (max >= 85) return 'critical'
        if (max >= 65) return 'warning'
        return 'healthy'
    }

    mappingEventLevel(cpu: number, memory: number): EventLevel {
        const status = this.deriveNodeStatus(cpu, memory)
        if (status === 'critical') return 'critical'
        if (status === 'warning') return 'warning'
        return 'info'
    }
}


import { useEffect, useState, useRef } from 'react'
import { container } from 'tsyringe';

// shared
import { pushBound } from '@/shared/lib/ringBuffer';
import { MAX_EVENTS_PER_NODE } from '@/shared/config/constants';

// entities
import { MockNodeStream } from '@/entities/node/services/service/mockStream';
import { NodeBehavior } from '@/entities/node/models/behavior/NodeBehavior';
import type { ConnectionState, NodeEvent, NodeSnapshot } from '@/entities/node/models/entities'



const makeEventId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * 첫째, 이전 snapshot을 ref로 보관합니다. 
 * 이전 답변에서는 setState 콜백 안에서 또 다른 setState를 호출했는데, 
 * 그건 동작은 하지만 React에서는 안티패턴에 가깝습니다(렌더 도중 다른 컴포넌트에 영향). 
 * ref로 빼면 비교 로직이 setState 바깥에 있어 깔끔하고, 면접에서도 "왜 setState 안에 setState를 안 넣었냐"는 질문에 답할 수 있습니다.
 * 둘째, 연결 상태 타이머를 별도로 분리했습니다. 
 * 데이터 흐름과 전송 상태가 서로 독립적이라는 걸 코드 구조로 표현한 것입니다.
 * 
 */
export function useRealtimeNodes() {
    const [nodes, setNodes] = useState<Map<string, NodeSnapshot>>(new Map());
    const [eventByNode, setEventByNode] = useState<Map<string, NodeEvent[]>>(new Map());
    const [connection, setConnection] = useState<ConnectionState>('connected');

    // snapshot (이전 snapshot을 ref로 보관)
    const prevNodesRef = useRef<Map<string, NodeSnapshot>>(new Map());

    // repository
    const nodeStreamRepository = container.resolve<MockNodeStream>(MockNodeStream)
    const nodeBehavior = container.resolve<NodeBehavior>(NodeBehavior)

    useEffect(() => {
        const unsubscribe = nodeStreamRepository.subscribe((next) => {
            const prevNode = prevNodesRef.current.get(next.id);

            // 기존 nodes 에 next 추가
            setNodes((curr) => {
                const updated = new Map(curr);
                updated.set(next.id, next);
                return updated
            })

            // 상태가 변화하였다면 이벤트 발생
            if (prevNode && prevNode.status !== next.status) {
                const event: NodeEvent = {
                    id: makeEventId(),
                    nodeId: next.id,
                    t: next.lastUpdatedAt,
                    level: nodeBehavior.mappingEventLevel(next.cpu, next.memory),
                    message: `Status가 변경되었습니다: ${prevNode.status} -> ${next.status}`,
                };

                setEventByNode((curr) => {
                    const updated = new Map(curr);
                    const eventListById = updated.get(next.id) ?? [];
                    updated.set(next.id, pushBound(eventListById, event, MAX_EVENTS_PER_NODE))
                    return updated;
                })
            }

            const nextNodesRef = new Map(prevNodesRef.current)
            nextNodesRef.set(next.id, next)
            prevNodesRef.current = nextNodesRef
        })

        return () => {
            unsubscribe()
        }
    }, [])

    useEffect(() => {
        const connectionTimer = setInterval(() => {
            setConnection((curr) => {
                if (curr === 'connected' && Math.random() < 0.1) return 'reconnecting';
                if (curr === 'reconnecting') return 'connected'
                return curr;
            })
        }, 5000)

        return () => clearInterval(connectionTimer)
    }, [])


    return { nodes, eventByNode, connection }

}
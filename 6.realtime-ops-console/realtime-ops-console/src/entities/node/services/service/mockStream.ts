import { singleton, inject } from 'tsyringe';

import { NodeBehavior } from '@/entities/node/models/behavior/NodeBehavior';
import type { NodeSnapshot } from '@/entities/node/models/entities';
import type { NodeStreamRepository } from '@/entities/node/models/repository';
import { STREAM_TICK_MS } from '@/shared/config/constants';

type SnapshotListener = (snap: NodeSnapshot) => void;

const GROUP_IDS = ['web', 'db', 'batch'];

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

@singleton()
export class MockNodeStream implements NodeStreamRepository {
    private listeners = new Set<SnapshotListener>();
    private timer: number | null = null;
    private nodes: NodeSnapshot[];

    constructor(
        @inject(NodeBehavior) private readonly nodeBehavior: NodeBehavior
    ) {
        this.nodes = this.createInitialNodes();
    }

    private createInitialNodes(): NodeSnapshot[] {
        return Array.from({ length: 12 }, (_, i) => {
            const cpu = randomBetween(10, 50);
            const memory = randomBetween(20, 60);
            return {
                id: `node-${i + 1}`,
                name: `NODE-${String(i + 1).padStart(3, '0')}`,
                groupId: GROUP_IDS[i % GROUP_IDS.length],
                cpu,
                memory,
                status: this.nodeBehavior.deriveNodeStatus(cpu, memory),
                lastUpdatedAt: Date.now(),
            };
        });
    }

    private createNextSnapshot(prev: NodeSnapshot): NodeSnapshot {
        const cpu = clamp(prev.cpu + randomBetween(-12, 12), 0, 100);
        const memory = clamp(prev.memory + randomBetween(-8, 8), 0, 100);
        return {
            ...prev,
            cpu,
            memory,
            status: this.nodeBehavior.deriveNodeStatus(cpu, memory),
            lastUpdatedAt: Date.now(),
        };
    }


    subscribe(listener: SnapshotListener): () => void {
        this.listeners.add(listener);

        // 신규 구독자에게는 현재 상태를 즉시 한 번 전달 (initial sync)
        // 이걸 안 하면 첫 tick(1초)까지 화면이 비어있게 됨
        queueMicrotask(() => {
            this.nodes.forEach((node) => listener(node));
        });

        if (!this.timer) this.start();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) this.stop();
        };
    }

    private start(): void {
        this.timer = window.setInterval(() => {
            this.nodes = this.nodes.map(this.createNextSnapshot);
            this.nodes.forEach((node) => {
                this.listeners.forEach((listener) => listener(node));
            });
        }, STREAM_TICK_MS);
    }

    private stop(): void {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
}

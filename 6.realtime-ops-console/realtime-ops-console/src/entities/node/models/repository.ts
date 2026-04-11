import type { NodeSnapshot } from "./entities";

export interface NodeStreamRepository {
    subscribe(listener: (snapshot: NodeSnapshot) => void): () => void;
}
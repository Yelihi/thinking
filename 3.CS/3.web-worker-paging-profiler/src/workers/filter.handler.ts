import { SearchItem } from "../data/interface";
import type { InitQueryMessage, QueryMessage, ResultMessage, ErrorMessage } from "./interface";

export const createWorkerHandler = (items: SearchItem[] | null) => {
    return {
        "INIT": (payload: InitQueryMessage) => {
            items = payload.list;
            self.postMessage({ type: "READY" })
            return;
        },

        "QUERY": (payload: QueryMessage) => {
            if (!items) {
                self.postMessage({ type: "ERROR", message: "Worker is not initialized" })
                return;
            }

            const { requestId, query } = payload;
            const lowerCaseQuery = query.trim().toLowerCase();

            const matchedIndices = items.filter((item) => item.title.toLowerCase().includes(lowerCaseQuery)).map((item) => item.id);
            const indices = Uint32Array.from(matchedIndices);

            const message: ResultMessage = {
                type: "RESULT",
                indices,
                requestId,
            }

            self.postMessage(message, [indices.buffer]); // transfer
        }
    }
}


/// <reference lib="webworker" />

export interface ReceiveFilterMessage {
    type: "init" | "query";
    query: string;
    list: string[]
}

export interface PostFilterMessage {
    type: "Ready" | "Result" | "Error";
    indices: Uint32Array;
}

let items: string[] | null = null

self.onmessage = (e: MessageEvent<ReceiveFilterMessage>) => {
    const { type, query, list } = e.data;

    if (type === "init") {
        items = list;
        const readyMsg: PostFilterMessage = {
            type: "Ready",
            indices: new Uint32Array([])
        }

        self.postMessage(readyMsg)
        return;
    }

    if (type === 'query') {
        if (!items) {
            const errorMsg: PostFilterMessage = {
                type: "Error",
                indices: new Uint32Array([])
            }
            self.postMessage(errorMsg)
            return;
        }

        const q = query.toLocaleLowerCase();
        const indices: number[] = items.map((item, index) => ({ item, index })).filter((obj) => obj.item.includes(q)).map((obj) => obj.index)

        const unitArray = new Uint32Array(indices);

        const resultMsg: PostFilterMessage = {
            type: 'Result',
            indices: unitArray
        }

        self.postMessage(resultMsg, [unitArray.buffer])
        return;
    }
}
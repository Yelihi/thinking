class MainWorkerController {
    requestId: number;
    latestId: number;

    constructor() {
        this.requestId = 0
        this.latestId = 0
    }

    start = (query: string) => {
        const newId = ++this.requestId;
        this.latestId = newId; // 가장 최신의 id 

        return { type: "START", requestId: newId, query }
    }

    cancel = () => {
        const stopId = this.latestId;

        return { type: "CANCEL", requestId: stopId }

    }
}

export const mainWorkerController = Object.freeze(new MainWorkerController());
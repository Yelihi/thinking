import type { SearchItem } from '../data/interface';

export type QueryMessage = {
    type: 'QUERY';
    query: string;
    requestId: number;
};

export type InitQueryMessage = {
    type: "INIT";
    list: SearchItem[];
}

export type ReadyMessage = {
    type: "READY";
}

export type ErrorMessage = {
    type: "ERROR";
    message: string;

}

export type ResultMessage = {
    type: 'RESULT';
    indices: Uint32Array;
    requestId: number;
};

export type WorkerRequest = QueryMessage | InitQueryMessage;
export type WorkerResponse = ReadyMessage | ErrorMessage | ResultMessage;
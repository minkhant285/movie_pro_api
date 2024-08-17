import { Response } from "express";

export const enum STATUS_MESSAGE {
    SUCCESS = 'SUCCESS',
    FAIL = 'FAIL'
}
export interface IReturnPayload {
    status_code: number;
    status_message: STATUS_MESSAGE;
    message: string;
    result?: Object | null;
    error?: unknown;
}

export function ReturnPayload(payload: IReturnPayload): IReturnPayload {
    return {
        ...payload
    }
}
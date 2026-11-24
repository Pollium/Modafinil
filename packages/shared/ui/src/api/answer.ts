import { ApiError as ApiErrorPayload, ApiResponse } from '@pollium/readable-contracts/http';
import { ApiError } from '../services/ApiError';

export const NETWORK_FAILED = 'Network request failed';

const SUCCESS_FLOOR = 200;
const SUCCESS_CEILING = 300;

export const answerOf = (status: number, statusText: string, payload: unknown): unknown => {
    if(status >= SUCCESS_FLOOR && status < SUCCESS_CEILING) return (payload as ApiResponse<unknown> | undefined)?.data;

    throw new ApiError(status, (payload as ApiErrorPayload | undefined)?.error ?? statusText);
};

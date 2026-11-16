import adapterFetch from 'alova/fetch';
import { ApiError } from '../services/ApiError';
import { answerOf, NETWORK_FAILED } from './answer';
import { createAlova } from 'alova';

export const alova = createAlova({
    baseURL: window.location.origin,
    requestAdapter: adapterFetch(),
    cacheFor: {
        GET: 30_000
    },

    responded: {
        async onSuccess(response){
            const payload = await response.json().catch(() => undefined);

            return answerOf(response.status, response.statusText, payload);
        },

        onError(error){
            if(error instanceof ApiError) throw error;
            throw new ApiError(0, NETWORK_FAILED, { cause: error });
        }
    }
});

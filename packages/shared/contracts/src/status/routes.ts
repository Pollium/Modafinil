import { get } from '@pollium/readable-contracts/routing';
import { Board } from './domain';

export const statusRoutes = {
    board: get<Board>('/status'),
    health: get<{ status: 'ok' }>('/health')
};

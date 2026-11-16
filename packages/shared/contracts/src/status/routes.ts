import { get } from '../shared/routing';
import { Board } from './domain';

export const statusRoutes = {
    board: get<Board>('/status'),
    health: get<{ status: 'ok' }>('/health')
};

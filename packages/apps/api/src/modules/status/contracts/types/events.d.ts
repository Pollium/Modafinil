import { BoardRefreshedPayload } from '../domain/events';

declare global{
    interface EventMap{
        'status.board.refreshed': BoardRefreshedPayload;
    }
}

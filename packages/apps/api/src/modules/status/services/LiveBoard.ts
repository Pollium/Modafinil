import StatusBoard, { boardOf } from './StatusBoard';
import { eventBus } from '@pollium/readable/events/EventBus';

class LiveBoard{
    #board = boardOf([], new Date());
    #reader = new StatusBoard();

    get board(){
        return this.#board;
    }

    listen(){
        eventBus.on('status.board.refreshed', ({ board }) => {
            this.#board = board;
        });
    }

    async hydrate(){
        this.#board = await this.#reader.read();
    }
}

export const liveBoard = new LiveBoard();

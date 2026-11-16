import BaseGateway from '@readable/gateway/BaseGateway';
import { Channel } from '@readable/decorators/gateway/Channel';
import { OnConnect } from '@readable/decorators/gateway/Gateway';
import { Socket } from '@readable/decorators/gateway/Params';
import { eventBus } from '@readable/events/EventBus';
import { Board } from '@modafinil/contracts/status/domain';
import { statusGateway, BoardFrame } from '@modafinil/contracts/status/gateway';
import { liveBoard } from '../services/LiveBoard';
import { WebSocket } from '@fastify/websocket';

const boardFrame = (board: Board): BoardFrame => ({
    type: 'status.board',
    data: board
});

@Channel(statusGateway.channel)
export default class StatusGateway extends BaseGateway{
    constructor(){
        super();

        eventBus.on('status.board.refreshed', ({ board }) => {
            this.connections.broadcast(boardFrame(board));
        });
    }

    @OnConnect()
    connected(@Socket() socket: WebSocket){
        this.connections.sendTo(socket, boardFrame(liveBoard.board));
    }
}

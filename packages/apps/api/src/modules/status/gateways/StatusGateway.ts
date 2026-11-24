import BaseGateway, { Channel, OnConnect, Socket } from '@pollium/readable/gateway/Gateway';
import { eventBus } from '@pollium/readable/events/EventBus';
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

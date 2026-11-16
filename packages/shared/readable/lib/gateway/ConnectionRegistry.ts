import { OutboundMessage } from '../contracts/gateway';
import { WebSocket } from '@fastify/websocket';

export default class ConnectionsRegistry{
    #sockets = new Set<WebSocket>();

    add(socket: WebSocket){
        this.#sockets.add(socket);
    }

    remove(socket: WebSocket){
        this.#sockets.delete(socket);
    }

    broadcast(message: OutboundMessage<unknown>){
        this.#send(this.#sockets, message);
    }

    sendTo(socket: WebSocket, message: OutboundMessage<unknown>){
        this.#send([socket], message);
    }

    #send(sockets: Iterable<WebSocket>, message: OutboundMessage<unknown>){
        const raw = JSON.stringify(message);
        for(const socket of sockets) socket.send(raw);
    }
}

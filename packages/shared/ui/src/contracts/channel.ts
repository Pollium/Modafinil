import SocketChannel from '../services/socket/SocketChannel';

export interface OutboundFrame{
    type?: string;
    data?: unknown;
}

export type MessageHandler<T> = (data: T) => void;

export interface ChannelHandlers{
    [type: string]: MessageHandler<unknown>;
}

export interface ChannelMap{}

export type HandlersFor<P extends string> = P extends keyof ChannelMap
    ? { [K in keyof ChannelMap[P]]?: MessageHandler<ChannelMap[P][K]> }
    : ChannelHandlers;

export interface PoolEntry{
    channel: SocketChannel;
    refs: number;
}

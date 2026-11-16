import { ChannelHandlers, HandlersFor } from '../../contracts/channel';
import { channelPool } from '../../services/socket/ChannelPool';
import { useEffect, useRef } from 'react';

export const useChannel = <P extends string>(path: P, handlers: HandlersFor<P>) => {
    const handlersRef = useRef(handlers);
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const channel = channelPool.acquire(path);

        const offs = Object.keys(handlersRef.current as ChannelHandlers).map((type) =>
            channel.on(type, (data) => (handlersRef.current as ChannelHandlers)[type]?.(data))
        );

        return () => {
            offs.forEach((off) => off());
            channelPool.release(path);
        };
    }, [path]);
};

export interface OutboundMessage<T>{
    type: string;
    data: T;
}

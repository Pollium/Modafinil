import { MessageHandler, OutboundFrame } from '../../contracts/channel';

const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 10_000;

export default class SocketChannel{
    readonly #path: string;
    #socket: WebSocket | null = null;
    #attempts = 0;
    #reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    #released = false;

    readonly #listeners = new Map<string, Set<MessageHandler<unknown>>>();

    constructor(path: string){
        this.#path = path;
        this.#bindNetworkRecovery();
        this.#connect();
    }

    on(type: string, handler: MessageHandler<unknown>): () => void{
        const handlers = this.#listeners.get(type) ?? new Set<MessageHandler<unknown>>();
        handlers.add(handler);
        this.#listeners.set(type, handlers);
        return () => {
            handlers.delete(handler);
            if(handlers.size === 0) this.#listeners.delete(type);
        };
    }

    close(){
        this.#released = true;
        this.#clearReconnect();
        this.#unbindNetworkRecovery();
        this.#socket?.close();
        this.#socket = null;
    }

    #connect(){
        this.#clearReconnect();

        const socket = new WebSocket(`${window.location.origin.replace(/^http/, 'ws')}${this.#path}`);
        this.#socket = socket;

        socket.onopen = () => {
            this.#attempts = 0;
        };
        socket.onmessage = (event: MessageEvent<string>) => this.#dispatch(event.data);
        socket.onclose = () => this.#onClose();
    }

    #onClose(){
        this.#socket = null;
        if(this.#released) return;
        this.#scheduleReconnect();
    }

    #scheduleReconnect(){
        const delay = this.#backoffDelay();
        this.#attempts += 1;
        this.#reconnectTimer = setTimeout(() => this.#connect(), delay);
    }

    #backoffDelay(): number{
        const ceiling = Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * 2 ** this.#attempts);
        return ceiling / 2 + Math.random() * (ceiling / 2);
    }

    #clearReconnect(){
        if(this.#reconnectTimer === null) return;
        clearTimeout(this.#reconnectTimer);
        this.#reconnectTimer = null;
    }

    #dispatch(raw: string){
        const frame = JSON.parse(raw) as OutboundFrame;
        if(frame.type === undefined) return;

        this.#listeners.get(frame.type)?.forEach((handler) => handler(frame.data));
    }

    #bindNetworkRecovery(){
        window.addEventListener('online', this.#recover);
        document.addEventListener('visibilitychange', this.#onVisibility);
    }

    #unbindNetworkRecovery(){
        window.removeEventListener('online', this.#recover);
        document.removeEventListener('visibilitychange', this.#onVisibility);
    }

    #onVisibility = () => {
        if(document.visibilityState === 'visible') this.#recover();
    };

    #recover = () => {
        if(this.#released) return;
        const state = this.#socket?.readyState;
        if(state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
        this.#attempts = 0;
        this.#connect();
    };
}

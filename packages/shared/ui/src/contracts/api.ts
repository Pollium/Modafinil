export type Request<O> = () => PromiseLike<O>;

export interface Query<T>{
    data: T | null;
    loading: boolean;
    error: Error | undefined;
    reload: () => void;
}

export interface QuerySnapshot<O>{
    status: 'loading' | 'success' | 'error';
    data: O | null;
    error: Error | undefined;
}

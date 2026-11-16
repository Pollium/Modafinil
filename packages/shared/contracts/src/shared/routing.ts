export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface Endpoint<Input = never, Output = void>{
    readonly method: HttpMethod;
    readonly path: string;
    readonly __io?: (input: Input) => Output;
}

export const get = <Output>(path: string): Endpoint<never, Output> => ({ method: 'GET', path });

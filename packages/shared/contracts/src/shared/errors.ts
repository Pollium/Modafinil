export interface ErrorTable{
    readonly domain: string;
    readonly causes: Readonly<Record<string, number>>;
}

export const GatewayErrors = {
    domain: 'Gateway',
    causes: {
        MissingChannel: 500,
        Internal: 500
    }
} as const satisfies ErrorTable;

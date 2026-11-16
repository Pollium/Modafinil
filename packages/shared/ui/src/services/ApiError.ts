export class ApiError extends Error{
    readonly status: number;

    constructor(status: number, message: string, options?: ErrorOptions){
        super(message, options);
        this.name = 'ApiError';
        this.status = status;
    }
}

type IPromise<T> = T extends Promise<infer U> ? Promise<U> : Promise<T>;
type messageType = {
    type: 'event';
    data: any[];
} | {
    id: string;
    type: 'call';
    data: any[];
} | {
    id: string;
    type: 'result';
    data: {
        status: 'success' | 'error';
        data: any;
    };
};
type message = ({
    __ProtocolChannel: string;
} & messageType) | {};
declare namespace RpcDispatch {
    export type args = any[];
    export type call = (...args: any[]) => any;
    type omitNever<T extends Record<string, args | call>> = Omit<T, {
        [K in keyof T]: T[K] extends never ? K : never;
    }[keyof T]>;
    export type getArgs<T extends Record<string, args | call>> = omitNever<{
        [K in keyof T]: T[K] extends args ? T[K] : never;
    }>;
    export type getCall<T extends Record<string, args | call>> = omitNever<{
        [K in keyof T]: T[K] extends call ? T[K] : never;
    }>;
    export {};
}
declare class RpcDispatch<T extends {
    send: Record<string, any[]>;
    on: Record<string, any[]>;
    handle: Record<string, (...args: any) => any>;
    invoke: Record<string, (...args: any) => any>;
}> {
    private listeners;
    private handler;
    private callback;
    private _onMessage?;
    protected onMessage(callback: (message: message, ex?: any) => void): void;
    private fire;
    protected emit(data: any, ex?: any): void;
    protected error(err: any): void;
    send<K extends keyof T['send']>(channel: K, ...data: T['send'][K]): void;
    on<K extends keyof T['on']>(channel: K, listener: (...data: T['on'][K]) => void): () => void;
    off<K extends keyof T['on']>(channel: K, listener: (...data: T['on'][K]) => void): void;
    handle<K extends keyof T['handle']>(channel: K, callback: T['handle'][K]): void;
    invoke<K extends keyof T['invoke']>(channel: K, ...data: Parameters<T['invoke'][K]>): IPromise<ReturnType<T["invoke"][K]>>;
    private _beforeDestroy;
    beforeDestroy(callback: () => void): void;
    destroy(): void;
}
export default RpcDispatch;

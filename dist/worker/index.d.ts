/// <reference types="node" />
/// <reference types="node" />
import type { Worker, WorkerOptions } from 'worker_threads';
import RpcDispatch from '../rpc-dispatch';
type TDefault = {
    data?: any;
    main: Record<string, RpcDispatch.args | RpcDispatch.call>;
    child: Record<string, RpcDispatch.args | RpcDispatch.call>;
};
type TProtocol = {
    data?: any;
    on: Record<string, RpcDispatch.args>;
    send: Record<string, RpcDispatch.args>;
    invoke: Record<string, RpcDispatch.call>;
    handle: Record<string, RpcDispatch.call>;
};
type known = string | number | boolean | null | object | Object | Array<any>;
type toOptions<T extends TDefault> = T['data'] extends known ? Omit<WorkerOptions, 'workerData'> & {
    workerData: T['data'];
} : (WorkerOptions | void);
type toMain<T extends TDefault> = {
    send: RpcDispatch.getArgs<T['main']>;
    on: RpcDispatch.getArgs<T['child']>;
    invoke: RpcDispatch.getCall<T['main']>;
    handle: RpcDispatch.getCall<T['child']>;
};
type toChild<T extends TDefault> = {
    data: T['data'];
    send: RpcDispatch.getArgs<T['child']>;
    on: RpcDispatch.getArgs<T['main']>;
    invoke: RpcDispatch.getCall<T['child']>;
    handle: RpcDispatch.getCall<T['main']>;
};
declare class WorkerRpcProtocol<T extends TDefault> {
    private filename;
    Nullable?: Main<toMain<T>>;
    constructor(filename: string | URL);
    main(options: toOptions<T>): Main<toMain<T>>;
    child(): Child<toChild<T>>;
}
declare class Main<T extends TProtocol> extends RpcDispatch<T> {
    private worker;
    constructor(worker: Worker);
    get stdout(): import("stream").Readable;
    get stderr(): import("stream").Readable;
    get stdin(): import("stream").Writable | null;
}
declare class Child<T extends TProtocol> extends RpcDispatch<T> {
    constructor();
    get data(): T['data'] extends known ? T['data'] : never;
}
export default WorkerRpcProtocol;

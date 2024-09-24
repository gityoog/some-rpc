/// <reference types="node" />
/// <reference types="node" />
import type { ChildProcess, ForkOptions } from 'child_process';
import RpcDispatch from '../rpc-dispatch';
type TDefault = {
    main: Record<string, RpcDispatch.args | RpcDispatch.call>;
    child: Record<string, RpcDispatch.args | RpcDispatch.call>;
};
type TProtocol = {
    on: Record<string, RpcDispatch.args>;
    send: Record<string, RpcDispatch.args>;
    invoke: Record<string, RpcDispatch.call>;
    handle: Record<string, RpcDispatch.call>;
};
type toMain<T extends TDefault> = {
    send: RpcDispatch.getArgs<T['main']>;
    on: RpcDispatch.getArgs<T['child']>;
    invoke: RpcDispatch.getCall<T['main']>;
    handle: RpcDispatch.getCall<T['child']>;
};
type toChild<T extends TDefault> = {
    send: RpcDispatch.getArgs<T['child']>;
    on: RpcDispatch.getArgs<T['main']>;
    invoke: RpcDispatch.getCall<T['child']>;
    handle: RpcDispatch.getCall<T['main']>;
};
declare class ForkRpcProtocol<T extends TDefault> {
    private modulePath;
    private args?;
    Nullable?: Main<toMain<T>>;
    constructor(modulePath: string, args?: readonly string[] | undefined);
    main(options: ForkOptions): Main<toMain<T>>;
    child(): Child<toChild<T>>;
}
declare class Main<T extends TProtocol> extends RpcDispatch<T> {
    private child;
    constructor(child: ChildProcess);
    get stdout(): import("stream").Readable | null;
    get stderr(): import("stream").Readable | null;
    get stdin(): import("stream").Writable | null;
}
declare class Child<T extends TProtocol> extends RpcDispatch<T> {
    constructor();
}
export default ForkRpcProtocol;

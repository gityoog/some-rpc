import type { WebContents } from "electron";
import RpcDispatch from '../rpc-dispatch';
type TDefault = {
    main: Record<string, RpcDispatch.args | RpcDispatch.call>;
    renderer: Record<string, RpcDispatch.args | RpcDispatch.call>;
};
type TProtocol = {
    on: Record<string, RpcDispatch.args>;
    send: Record<string, RpcDispatch.args>;
    invoke: Record<string, RpcDispatch.call>;
    handle: Record<string, RpcDispatch.call>;
};
type toMain<T extends TDefault> = {
    send: RpcDispatch.getArgs<T['main']>;
    on: RpcDispatch.getArgs<T['renderer']>;
    invoke: RpcDispatch.getCall<T['main']>;
    handle: RpcDispatch.getCall<T['renderer']>;
};
type toRenderer<T extends TDefault> = {
    send: RpcDispatch.getArgs<T['renderer']>;
    on: RpcDispatch.getArgs<T['main']>;
    invoke: RpcDispatch.getCall<T['renderer']>;
    handle: RpcDispatch.getCall<T['main']>;
};
declare class ElectronRpcProtocol<T extends TDefault> {
    Nullable?: Main<toMain<T>>;
    Renderer?: Renderer<toRenderer<T>>;
    Main?: Main<toMain<T>>;
    private name;
    constructor(name: string);
    main(webContents?: WebContents): Main<toMain<T>>;
    preload(): Preload;
    renderer(): Renderer<toRenderer<T>>;
}
declare class Main<T extends TProtocol> extends RpcDispatch<T> {
    constructor(channel: string, webContents?: WebContents);
}
declare class Preload {
    private channel;
    constructor(channel: string);
}
declare class Renderer<T extends TProtocol> extends RpcDispatch<T> {
    private channel;
    constructor(channel: string);
}
declare namespace ElectronRpcProtocol {
    type Default = TDefault;
}
export default ElectronRpcProtocol;

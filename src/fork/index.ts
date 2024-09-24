import type { fork, ChildProcess, ForkOptions } from 'child_process'
import RpcDispatch from '../rpc-dispatch'

type TDefault = {
  main: Record<string, RpcDispatch.args | RpcDispatch.call>
  child: Record<string, RpcDispatch.args | RpcDispatch.call>
}
type TProtocol = {
  on: Record<string, RpcDispatch.args>
  send: Record<string, RpcDispatch.args>
  invoke: Record<string, RpcDispatch.call>
  handle: Record<string, RpcDispatch.call>
}
type toMain<T extends TDefault> = {
  send: RpcDispatch.getArgs<T['main']>
  on: RpcDispatch.getArgs<T['child']>
  invoke: RpcDispatch.getCall<T['main']>
  handle: RpcDispatch.getCall<T['child']>
}
type toChild<T extends TDefault> = {
  send: RpcDispatch.getArgs<T['child']>
  on: RpcDispatch.getArgs<T['main']>
  invoke: RpcDispatch.getCall<T['child']>
  handle: RpcDispatch.getCall<T['main']>
}

class ForkRpcProtocol<T extends TDefault> {
  declare Nullable?: Main<toMain<T>>
  constructor(private modulePath: string, private args?: readonly string[]) { }
  main(options: ForkOptions) {
    return new Main<toMain<T>>(
      (eval('require')('child_process').fork as typeof fork)(this.modulePath, this.args, options)
    )
  }
  child() {
    return new Child<toChild<T>>()
  }
}

class Main<T extends TProtocol> extends RpcDispatch<T> {
  constructor(private child: ChildProcess) {
    super()
    child.on('message', message => this.emit(message))
    child.on('error', error => this.error(error))
    this.onMessage(message => child.send(message))
    this.beforeDestroy(() => {
      child.disconnect()
    })
  }
  get stdout() {
    return this.child.stdout
  }
  get stderr() {
    return this.child.stderr
  }
  get stdin() {
    return this.child.stdin
  }
}

class Child<T extends TProtocol> extends RpcDispatch<T> {
  constructor() {
    super()
    process.on('message', message => this.emit(message))
    process.on('error', error => this.error(error))
    this.onMessage(message => process.send!(message))
  }
}

export default ForkRpcProtocol
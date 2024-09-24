import type { Worker, WorkerOptions, MessagePort } from 'worker_threads'
import RpcDispatch from '../rpc-dispatch'

type TDefault = {
  data?: any
  main: Record<string, RpcDispatch.args | RpcDispatch.call>
  child: Record<string, RpcDispatch.args | RpcDispatch.call>
}
type TProtocol = {
  data?: any
  on: Record<string, RpcDispatch.args>
  send: Record<string, RpcDispatch.args>
  invoke: Record<string, RpcDispatch.call>
  handle: Record<string, RpcDispatch.call>
}
type known = string | number | boolean | null | object | Object | Array<any>
type toOptions<T extends TDefault> = T['data'] extends known ? Omit<WorkerOptions, 'workerData'> & { workerData: T['data'] } : (WorkerOptions | void)
type toMain<T extends TDefault> = {
  send: RpcDispatch.getArgs<T['main']>
  on: RpcDispatch.getArgs<T['child']>
  invoke: RpcDispatch.getCall<T['main']>
  handle: RpcDispatch.getCall<T['child']>
}
type toChild<T extends TDefault> = {
  data: T['data']
  send: RpcDispatch.getArgs<T['child']>
  on: RpcDispatch.getArgs<T['main']>
  invoke: RpcDispatch.getCall<T['child']>
  handle: RpcDispatch.getCall<T['main']>
}

class WorkerRpcProtocol<T extends TDefault> {
  declare Nullable?: Main<toMain<T>>
  constructor(private filename: string | URL) { }
  main(options: toOptions<T>) {
    return new Main<toMain<T>>(
      new (eval('require')('worker_threads').Worker as typeof Worker)(this.filename, options as WorkerOptions | undefined)
    )
  }
  child() {
    return new Child<toChild<T>>()
  }
}

class Main<T extends TProtocol> extends RpcDispatch<T> {
  constructor(private worker: Worker) {
    super()
    this.worker.on('message', message => this.emit(message))
    this.worker.on('error', error => this.error(error))
    this.onMessage(message => this.worker.postMessage(message))

    this.beforeDestroy(() => {
      this.worker.terminate()
    })
  }
  get stdout() {
    return this.worker.stdout
  }
  get stderr() {
    return this.worker.stderr
  }
  get stdin() {
    return this.worker.stdin
  }
}

class Child<T extends TProtocol> extends RpcDispatch<T> {
  constructor() {
    const parentPort = eval('require')('worker_threads').parentPort as MessagePort | undefined
    const isMainThread = eval('require')('worker_threads').isMainThread as boolean
    if (isMainThread || !parentPort) {
      throw new Error('cannot run in main thread')
    }
    super()
    parentPort.on('message', message => this.emit(message))
    parentPort.on('error', error => this.error(error))
    this.onMessage(message => parentPort!.postMessage(message))
  }
  get data(): T['data'] extends known ? T['data'] : never {
    return eval('require')('worker_threads').workerData
  }
}

export default WorkerRpcProtocol
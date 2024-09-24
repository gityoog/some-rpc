type listener = (...args: any[]) => void
type asyncFn = (...args: any[]) => Promise<any>
type callback = (result: {
  status: 'success' | 'error'
  data: any
}) => void
type IPromise<T> = T extends Promise<infer U> ? Promise<U> : Promise<T>
type messageType = {
  type: 'event'
  data: any[]
} | {
  id: string
  type: 'call'
  data: any[]
} | {
  id: string
  type: 'result'
  data: {
    status: 'success' | 'error'
    data: any
  }
}

type message = ({
  __ProtocolChannel: string
} & messageType) | {}

namespace RpcDispatch {
  export type args = any[]
  export type call = (...args: any[]) => any
  type omitNever<T extends Record<string, args | call>> = Omit<T, {
    [K in keyof T]: T[K] extends never ? K : never
  }[keyof T]>
  export type getArgs<T extends Record<string, args | call>> = omitNever<{
    [K in keyof T]: T[K] extends args ? T[K] : never
  }>
  export type getCall<T extends Record<string, args | call>> = omitNever<{
    [K in keyof T]: T[K] extends call ? T[K] : never
  }>
}

class RpcDispatch<T extends {
  send: Record<string, any[]>
  on: Record<string, any[]>
  handle: Record<string, (...args: any) => any>
  invoke: Record<string, (...args: any) => any>
}> {
  private listeners: Record<any, listener[]> = {}
  private handler: Record<any, asyncFn> = {}
  private callback: Record<any, callback> = {}

  private _onMessage?: (message: message, ex?: any) => void
  protected onMessage(callback: (message: message, ex?: any) => void) {
    if (this._onMessage) throw new Error('onMessage already exists')
    this._onMessage = callback
  }

  private fire(message: messageType & { channel: string | number | symbol }, ex?: any) {
    const content = {
      __ProtocolChannel: message.channel,
      ...message,
      channel: undefined
    }
    delete content.channel
    if (!this._onMessage) {
      throw new Error('onMessage not exists')
    }
    this._onMessage(content, ex)
  }

  protected emit(data: any, ex?: any) {
    const message = data as message
    if ('__ProtocolChannel' in message) {
      const channel = message.__ProtocolChannel
      const type = message.type
      if (type === 'event') {
        if (this.listeners[channel]) {
          this.listeners[channel].forEach(callback => callback(...message.data))
        } else {
          console.warn('no listener for event', channel)
        }
      }
      else if (type === 'call') {
        const id = message.id
        if (channel in this.handler) {
          this.handler[channel](...message.data)
            .then((result) => {
              this.fire({
                channel,
                type: 'result',
                id,
                data: {
                  status: 'success',
                  data: result
                }
              }, ex)
            }).catch((err) => {
              const error = new Error(getErrorMsg(err))
              error.stack = err?.stack
              this.fire({
                channel,
                type: 'result',
                id,
                data: {
                  status: 'error',
                  data: error
                }
              }, ex)
            })
        } else {
          console.warn('no handler for call', channel)
        }
      }
      else if (type === 'result') {
        const { id, data } = message
        if (id in this.callback) {
          this.callback[id](data)
          delete this.callback[id]
        } else {
          console.warn('no callback for result', id)
        }
      }
    }
    else {
      console.warn('unknown message', message)
    }
  }

  protected error(err: any) {
    console.error(err)
  }

  send<K extends keyof T['send']>(channel: K, ...data: T['send'][K]) {
    return this.fire({
      channel,
      type: 'event',
      data
    })
  }
  on<K extends keyof T['on']>(channel: K, listener: (...data: T['on'][K]) => void) {
    this.listeners[channel] = this.listeners[channel] || []
    this.listeners[channel].push(listener)
    return () => this.off(channel, listener)
  }
  off<K extends keyof T['on']>(channel: K, listener: (...data: T['on'][K]) => void) {
    if (channel in this.listeners) {
      this.listeners[channel] = this.listeners[channel].filter(cb => cb !== listener)
    }
  }
  handle<K extends keyof T['handle']>(channel: K, callback: T['handle'][K]) {
    if (channel in this.handler) {
      throw new Error('handler already exists')
    }
    this.handler[channel] = async function () {
      return callback(...arguments)
    }
  }
  invoke<K extends keyof T['invoke']>(channel: K, ...data: Parameters<T['invoke'][K]>) {
    return new Promise<any>((resolve, reject) => {
      const id = Math.random().toString(36).substring(7)
      this.callback[id] = (result) => {
        if (result.status === 'success') {
          resolve(result.data)
        } else {
          reject(result.data)
        }
      }
      this.fire({
        channel,
        type: 'call',
        id,
        data
      })
    }) as IPromise<ReturnType<T['invoke'][K]>>
  }
  private _beforeDestroy: (() => void)[] = []
  beforeDestroy(callback: () => void) {
    this._beforeDestroy.push(callback)
  }
  destroy() {
    this._beforeDestroy.forEach(fn => fn())
    this._beforeDestroy = []
    this.listeners = null!
    this.handler = null!
    this.callback = null!
  }
}

function getErrorMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object' && 'message' in e) return (e as { message: string }).message
  return 'unknown error'
}

export default RpcDispatch
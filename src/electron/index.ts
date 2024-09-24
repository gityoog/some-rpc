import type { IpcRendererEvent, WebContents, ContextBridge, IpcMain, IpcRenderer } from "electron"
import RpcDispatch from '../rpc-dispatch'
type Iknown = any
type TDefault = {
  main: Record<string, RpcDispatch.args | RpcDispatch.call>
  renderer: Record<string, RpcDispatch.args | RpcDispatch.call>
}
type TProtocol = {
  on: Record<string, RpcDispatch.args>
  send: Record<string, RpcDispatch.args>
  invoke: Record<string, RpcDispatch.call>
  handle: Record<string, RpcDispatch.call>
}
type toMain<T extends TDefault> = {
  send: RpcDispatch.getArgs<T['main']>
  on: RpcDispatch.getArgs<T['renderer']>
  invoke: RpcDispatch.getCall<T['main']>
  handle: RpcDispatch.getCall<T['renderer']>
}
type toRenderer<T extends TDefault> = {
  send: RpcDispatch.getArgs<T['renderer']>
  on: RpcDispatch.getArgs<T['main']>
  invoke: RpcDispatch.getCall<T['renderer']>
  handle: RpcDispatch.getCall<T['main']>
}

class ElectronRpcProtocol<T extends TDefault> {
  declare Nullable?: Main<toMain<T>>
  declare Renderer?: Renderer<toRenderer<T>>
  declare Main?: Main<toMain<T>>
  private name
  constructor(name: string) {
    this.name = '_ElectronRpcProtocol_' + name
  }
  main(webContents?: WebContents) {
    return new Main<toMain<T>>(this.name, webContents)
  }
  preload() {
    return new Preload(this.name)
  }
  renderer() {
    return new Renderer<toRenderer<T>>(this.name)
  }
}

class Main<T extends TProtocol> extends RpcDispatch<T> {
  constructor(channel: string, webContents?: WebContents) {
    super()
    if (!webContents) {
      const ipcMain = eval("require")("electron").ipcMain as IpcMain
      ipcMain.on(channel, (event, message) => this.emit(message, event.sender))
      this.onMessage((message, sender?: WebContents) => {
        if (sender) {
          sender.send(channel, message)
        }
      })
      this.beforeDestroy(() => {
        ipcMain.removeAllListeners(channel)
      })
    } else {
      const listener = (_: unknown, channel_: string, message: any) => {
        if (channel === channel_) {
          this.emit(message)
        }
      }
      webContents.on('ipc-message', listener)
      this.onMessage((message) => webContents.send(channel, message))
      this.beforeDestroy(() => {
        webContents.removeListener('ipc-message', listener)
      })
    }
  }
}

type Api = {
  emit: (message: any) => void
  on: (callback: (message: any) => void) => string
  off: (id: string) => void
}

class Preload {
  constructor(private channel: string) {
    const event: Record<string, any> = {}
    const ipcRenderer = eval("require")("electron").ipcRenderer as IpcRenderer
    const api: Api = {
      emit: (message) => {
        ipcRenderer.send(channel, message)
      },
      on: (callback) => {
        const id = Math.random().toString(36).slice(2)
        event[id] = (event: IpcRendererEvent, message: any) => callback(message)
        ipcRenderer.on(channel, event[id])
        return id
      },
      off: (id) => {
        if (event[id]) {
          ipcRenderer.off(channel, event[id])
          delete event[id]
        }
      }
    }

    if (process.contextIsolated) {
      (eval('require')('electron').contextBridge as ContextBridge).exposeInMainWorld(this.channel, api)
    } else {
      window[this.channel as Iknown] = api as Iknown
    }
  }
}

class Renderer<T extends TProtocol> extends RpcDispatch<T> {
  constructor(private channel: string) {
    super()
    if (typeof window === 'undefined') {
      throw new Error('must be called in renderer process')
    }
    if (!(this.channel in window)) {
      if ('require' in window) {
        new Preload(this.channel)
      } else {
        throw new Error('not expose api in preload script')
      }
    }
    const api = (window as Record<string, any>)[this.channel] as Api
    const callback = (message: any) => this.emit(message)
    const id = api.on(callback)
    this.onMessage((message) => api.emit(message))
    this.beforeDestroy(() => {
      api.off(id)
    })
  }
}
namespace ElectronRpcProtocol {
  export type Default = TDefault
}

export default ElectronRpcProtocol
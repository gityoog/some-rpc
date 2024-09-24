# SomeRpc

#### demo for electron
```typescript
import ElectronRpcProtocol from 'some-rpc/electron'
import { BrowserWindow } from 'electron'

const TestRpc = new ElectronRpcProtocol<{
  main: {
    logout(): Promise<void>  
    cpu: [usage: number] 
  },
  renderer: {
    login(data: { username: string, password: string }): Promise<boolean> 
    min: () => void
  }
}>("test")
export default TestRpc

// in main
const win = new BrowserWindow({})
const mainRpc = TestRpc.main(win.webContents)
mainRpc.handle('min', () => win.minimize())
mainRpc.handle('login', async ({ username, password }) => { /*do login*/ return true })
const timer = setInterval(() => {
  mainRpc.send('cpu', process.getCPUUsage().percentCPUUsage)
}, 1000)
win.on('closed', () => {
  clearInterval(timer)
})

// in preload, optional if nodeIntegration is enabled
TestRpc.preload() 

// in renderer 
const rendererRpc = TestRpc.renderer()
rendererRpc.invoke('login', { username: 'admin', password: 'admin' })
rendererRpc.on('cpu', (usage) => console.log('cpu usage:', usage))
rendererRpc.handle('logout', async () => { /*do logout*/ })
```

#### demo for node worker or fork
```typescript
const TestWorkerRpc = new WorkerRpcProtocol<{
  main: {
    calcPI: () => string
  },
  child: {}
}>(
  "path/to/worker.js"
)
export default TestWorkerRpc

// in worker
const workerRpc = TestWorkerRpc.child()
workerRpc.handle('calcPI', () => {
  let pi = 0
  for (let i = 0; i < 100000; i++) {
    pi += (i % 2 === 0 ? 1 : -1) / (2 * i + 1)
  }
  return (pi * 4).toString()
})

// in main
const mainRpc = TestWorkerRpc.main({ /*worker options*/ })
mainRpc.invoke('calcPI')
```
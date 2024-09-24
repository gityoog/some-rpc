"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_dispatch_1 = __importDefault(require("../rpc-dispatch"));
class WorkerRpcProtocol {
    constructor(filename) {
        this.filename = filename;
    }
    main(options) {
        return new Main(new (eval('require')('worker_threads').Worker)(this.filename, options));
    }
    child() {
        return new Child();
    }
}
class Main extends rpc_dispatch_1.default {
    constructor(worker) {
        super();
        this.worker = worker;
        this.worker.on('message', message => this.emit(message));
        this.worker.on('error', error => this.error(error));
        this.onMessage(message => this.worker.postMessage(message));
        this.beforeDestroy(() => {
            this.worker.terminate();
        });
    }
    get stdout() {
        return this.worker.stdout;
    }
    get stderr() {
        return this.worker.stderr;
    }
    get stdin() {
        return this.worker.stdin;
    }
}
class Child extends rpc_dispatch_1.default {
    constructor() {
        const parentPort = eval('require')('worker_threads').parentPort;
        const isMainThread = eval('require')('worker_threads').isMainThread;
        if (isMainThread || !parentPort) {
            throw new Error('cannot run in main thread');
        }
        super();
        parentPort.on('message', message => this.emit(message));
        parentPort.on('error', error => this.error(error));
        this.onMessage(message => parentPort.postMessage(message));
    }
    get data() {
        return eval('require')('worker_threads').workerData;
    }
}
exports.default = WorkerRpcProtocol;

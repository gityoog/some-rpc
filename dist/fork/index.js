"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_dispatch_1 = __importDefault(require("../rpc-dispatch"));
class ForkRpcProtocol {
    constructor(modulePath, args) {
        this.modulePath = modulePath;
        this.args = args;
    }
    main(options) {
        return new Main(eval('require')('child_process').fork(this.modulePath, this.args, options));
    }
    child() {
        return new Child();
    }
}
class Main extends rpc_dispatch_1.default {
    constructor(child) {
        super();
        this.child = child;
        child.on('message', message => this.emit(message));
        child.on('error', error => this.error(error));
        this.onMessage(message => child.send(message));
        this.beforeDestroy(() => {
            child.disconnect();
        });
    }
    get stdout() {
        return this.child.stdout;
    }
    get stderr() {
        return this.child.stderr;
    }
    get stdin() {
        return this.child.stdin;
    }
}
class Child extends rpc_dispatch_1.default {
    constructor() {
        super();
        process.on('message', message => this.emit(message));
        process.on('error', error => this.error(error));
        this.onMessage(message => process.send(message));
    }
}
exports.default = ForkRpcProtocol;

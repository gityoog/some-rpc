"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class RpcDispatch {
    constructor() {
        this.listeners = {};
        this.handler = {};
        this.callback = {};
        this._beforeDestroy = [];
    }
    onMessage(callback) {
        if (this._onMessage)
            throw new Error('onMessage already exists');
        this._onMessage = callback;
    }
    fire(message, ex) {
        const content = Object.assign(Object.assign({ __ProtocolChannel: message.channel }, message), { channel: undefined });
        delete content.channel;
        if (!this._onMessage) {
            throw new Error('onMessage not exists');
        }
        this._onMessage(content, ex);
    }
    emit(data, ex) {
        const message = data;
        if ('__ProtocolChannel' in message) {
            const channel = message.__ProtocolChannel;
            const type = message.type;
            if (type === 'event') {
                if (this.listeners[channel]) {
                    this.listeners[channel].forEach(callback => callback(...message.data));
                }
                else {
                    console.warn('no listener for event', channel);
                }
            }
            else if (type === 'call') {
                const id = message.id;
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
                        }, ex);
                    }).catch((err) => {
                        const error = new Error(getErrorMsg(err));
                        error.stack = err === null || err === void 0 ? void 0 : err.stack;
                        this.fire({
                            channel,
                            type: 'result',
                            id,
                            data: {
                                status: 'error',
                                data: error
                            }
                        }, ex);
                    });
                }
                else {
                    console.warn('no handler for call', channel);
                }
            }
            else if (type === 'result') {
                const { id, data } = message;
                if (id in this.callback) {
                    this.callback[id](data);
                    delete this.callback[id];
                }
                else {
                    console.warn('no callback for result', id);
                }
            }
        }
        else {
            console.warn('unknown message', message);
        }
    }
    error(err) {
        console.error(err);
    }
    send(channel, ...data) {
        return this.fire({
            channel,
            type: 'event',
            data
        });
    }
    on(channel, listener) {
        this.listeners[channel] = this.listeners[channel] || [];
        this.listeners[channel].push(listener);
        return () => this.off(channel, listener);
    }
    off(channel, listener) {
        if (channel in this.listeners) {
            this.listeners[channel] = this.listeners[channel].filter(cb => cb !== listener);
        }
    }
    handle(channel, callback) {
        if (channel in this.handler) {
            throw new Error('handler already exists');
        }
        this.handler[channel] = function () {
            var arguments_1 = arguments;
            return __awaiter(this, void 0, void 0, function* () {
                return callback(...arguments_1);
            });
        };
    }
    invoke(channel, ...data) {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            this.callback[id] = (result) => {
                if (result.status === 'success') {
                    resolve(result.data);
                }
                else {
                    reject(result.data);
                }
            };
            this.fire({
                channel,
                type: 'call',
                id,
                data
            });
        });
    }
    beforeDestroy(callback) {
        this._beforeDestroy.push(callback);
    }
    destroy() {
        this._beforeDestroy.forEach(fn => fn());
        this._beforeDestroy = [];
        this.listeners = null;
        this.handler = null;
        this.callback = null;
    }
}
function getErrorMsg(e) {
    if (e instanceof Error)
        return e.message;
    if (typeof e === 'string')
        return e;
    if (e && typeof e === 'object' && 'message' in e)
        return e.message;
    return 'unknown error';
}
exports.default = RpcDispatch;

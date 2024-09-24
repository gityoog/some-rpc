"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerRpcProtocol = exports.ForkRpcProtocol = exports.ElectronRpcProtocol = void 0;
var electron_1 = require("./electron");
Object.defineProperty(exports, "ElectronRpcProtocol", { enumerable: true, get: function () { return __importDefault(electron_1).default; } });
var fork_1 = require("./fork");
Object.defineProperty(exports, "ForkRpcProtocol", { enumerable: true, get: function () { return __importDefault(fork_1).default; } });
var worker_1 = require("./worker");
Object.defineProperty(exports, "WorkerRpcProtocol", { enumerable: true, get: function () { return __importDefault(worker_1).default; } });

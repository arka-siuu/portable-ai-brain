"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadataViaWs = getMetadataViaWs;
exports.getRpcMethodsViaWs = getRpcMethodsViaWs;
exports.getRuntimeVersionViaWs = getRuntimeVersionViaWs;
const decorateMethod_1 = require("@polkadot/api/promise/decorateMethod");
const types_1 = require("@polkadot/types");
const util_1 = require("@polkadot/util");
const x_ws_1 = require("@polkadot/x-ws");
async function getWsData(endpoint, method, params) {
    return new Promise((resolve, reject) => {
        const tracker = (0, decorateMethod_1.promiseTracker)(resolve, reject);
        try {
            const websocket = new x_ws_1.WebSocket(endpoint);
            websocket.onclose = (event) => {
                if (event.code !== 1000) {
                    tracker.reject(new Error(`disconnected, code: '${event.code}' reason: '${event.reason}'`));
                }
            };
            websocket.onerror = (event) => {
                tracker.reject(new Error(`WebSocket error:: ${(0, util_1.stringify)(event)}`));
            };
            websocket.onopen = () => {
                console.log('connected');
                params
                    ? websocket.send(`{"id":"1","jsonrpc":"2.0","method":"${method}","params":[${params.map((param) => `"${param}"`).join(',')}]}`)
                    : websocket.send(`{"id":"1","jsonrpc":"2.0","method":"${method}","params":[]}`);
            };
            websocket.onmessage = (message) => {
                try {
                    tracker.resolve(JSON.parse(message.data).result);
                }
                catch (error) {
                    tracker.reject(error);
                }
                websocket.close();
            };
        }
        catch (error) {
            tracker.reject(error);
        }
    });
}
async function getMetadataViaWs(endpoint, metadataVer) {
    const registry = new types_1.TypeRegistry();
    if (metadataVer) {
        return await getWsData(endpoint, 'state_call', ['Metadata_metadata_at_version', (0, util_1.u8aToHex)(registry.createType('u32', metadataVer).toU8a())]);
    }
    else {
        return await getWsData(endpoint, 'state_getMetadata');
    }
}
async function getRpcMethodsViaWs(endpoint) {
    const result = await getWsData(endpoint, 'rpc_methods');
    return result.methods;
}
async function getRuntimeVersionViaWs(endpoint) {
    const result = await getWsData(endpoint, 'state_getRuntimeVersion');
    return result.apis;
}

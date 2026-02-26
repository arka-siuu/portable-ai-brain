import { promiseTracker } from '@polkadot/api/promise/decorateMethod';
import { TypeRegistry } from '@polkadot/types';
import { stringify, u8aToHex } from '@polkadot/util';
import { WebSocket } from '@polkadot/x-ws';
async function getWsData(endpoint, method, params) {
    return new Promise((resolve, reject) => {
        const tracker = promiseTracker(resolve, reject);
        try {
            const websocket = new WebSocket(endpoint);
            websocket.onclose = (event) => {
                if (event.code !== 1000) {
                    tracker.reject(new Error(`disconnected, code: '${event.code}' reason: '${event.reason}'`));
                }
            };
            websocket.onerror = (event) => {
                tracker.reject(new Error(`WebSocket error:: ${stringify(event)}`));
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
export async function getMetadataViaWs(endpoint, metadataVer) {
    const registry = new TypeRegistry();
    if (metadataVer) {
        return await getWsData(endpoint, 'state_call', ['Metadata_metadata_at_version', u8aToHex(registry.createType('u32', metadataVer).toU8a())]);
    }
    else {
        return await getWsData(endpoint, 'state_getMetadata');
    }
}
export async function getRpcMethodsViaWs(endpoint) {
    const result = await getWsData(endpoint, 'rpc_methods');
    return result.methods;
}
export async function getRuntimeVersionViaWs(endpoint) {
    const result = await getWsData(endpoint, 'state_getRuntimeVersion');
    return result.apis;
}

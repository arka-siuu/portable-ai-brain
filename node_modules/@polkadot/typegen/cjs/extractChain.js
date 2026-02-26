"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tslib_1 = require("tslib");
const node_process_1 = tslib_1.__importDefault(require("node:process"));
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const api_1 = require("@polkadot/api");
/** @internal */
async function run(ws) {
    const provider = new api_1.WsProvider(ws);
    const api = await api_1.ApiPromise.create({ provider, throwOnConnect: true });
    const [chain, props] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.properties()
    ]);
    // output the chain info, for easy re-use
    console.error(`// Generated via 'yarn run chain:info ${ws}'\n\nexport default {\n  chain: '${chain.toString()}',\n  genesisHash: '${api.genesisHash.toHex()}',\n  specVersion: ${api.runtimeVersion.specVersion.toNumber()},\n  ss58Format: ${props.ss58Format.unwrapOr(42).toString()},\n  tokenDecimals: ${props.tokenDecimals.unwrapOr(0).toString()},\n  tokenSymbol: '${props.tokenSymbol.unwrapOr('UNIT').toString()}',\n  metaCalls: '${Buffer.from(api.runtimeMetadata.asCallsOnly.toU8a()).toString('base64')}'\n};`);
    // show any missing types
    api.runtimeMetadata.getUniqTypes(false);
}
function main() {
    // retrieve and parse arguments - we do this globally, since this is a single command
    const { ws } = (0, yargs_1.default)((0, helpers_1.hideBin)(node_process_1.default.argv))
        .usage('Usage: [options]')
        .wrap(120)
        .strict()
        .options({
        ws: {
            default: 'ws://127.0.0.1:9944',
            description: 'The API endpoint to connect to, e.g. wss://kusama-rpc.polkadot.io',
            required: true,
            type: 'string'
        }
    }).argv;
    run(ws)
        .then(() => {
        node_process_1.default.exit(0);
    })
        .catch((error) => {
        console.error('FATAL:', error.message);
        node_process_1.default.exit(-1);
    });
}

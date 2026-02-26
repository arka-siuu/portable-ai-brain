import process from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ApiPromise, WsProvider } from '@polkadot/api';
/** @internal */
async function run(ws) {
    const provider = new WsProvider(ws);
    const api = await ApiPromise.create({ provider, throwOnConnect: true });
    const [chain, props] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.properties()
    ]);
    // output the chain info, for easy re-use
    console.error(`// Generated via 'yarn run chain:info ${ws}'\n\nexport default {\n  chain: '${chain.toString()}',\n  genesisHash: '${api.genesisHash.toHex()}',\n  specVersion: ${api.runtimeVersion.specVersion.toNumber()},\n  ss58Format: ${props.ss58Format.unwrapOr(42).toString()},\n  tokenDecimals: ${props.tokenDecimals.unwrapOr(0).toString()},\n  tokenSymbol: '${props.tokenSymbol.unwrapOr('UNIT').toString()}',\n  metaCalls: '${Buffer.from(api.runtimeMetadata.asCallsOnly.toU8a()).toString('base64')}'\n};`);
    // show any missing types
    api.runtimeMetadata.getUniqTypes(false);
}
export function main() {
    // retrieve and parse arguments - we do this globally, since this is a single command
    const { ws } = yargs(hideBin(process.argv))
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
        process.exit(0);
    })
        .catch((error) => {
        console.error('FATAL:', error.message);
        process.exit(-1);
    });
}

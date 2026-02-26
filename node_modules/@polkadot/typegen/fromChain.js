import fs from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { formatNumber, isHex } from '@polkadot/util';
import { generateDefaultConsts, generateDefaultErrors, generateDefaultEvents, generateDefaultQuery, generateDefaultRpc, generateDefaultRuntime, generateDefaultTx } from './generate/index.js';
import { assertDir, assertFile, getMetadataViaWs, HEADER, writeFile } from './util/index.js';
async function generate(metaHex, pkg, output, isStrict) {
    console.log(`Generating from metadata, ${formatNumber((metaHex.length - 2) / 2)} bytes`);
    const outputPath = assertDir(path.join(process.cwd(), output));
    let extraTypes = {};
    let customLookupDefinitions = { rpc: {}, types: {} };
    if (pkg) {
        try {
            const defCont = await import(assertFile(path.join(outputPath, 'definitions.ts')));
            extraTypes = {
                [pkg]: defCont
            };
        }
        catch (error) {
            console.error('ERROR: No custom definitions found:', error.message);
        }
    }
    try {
        const lookCont = await import(assertFile(path.join(outputPath, 'lookup.ts')));
        customLookupDefinitions = {
            rpc: {},
            types: lookCont.default
        };
    }
    catch (error) {
        console.error('ERROR: No lookup definitions found:', error.message);
    }
    generateDefaultConsts(path.join(outputPath, 'augment-api-consts.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    generateDefaultErrors(path.join(outputPath, 'augment-api-errors.ts'), metaHex, extraTypes, isStrict);
    generateDefaultEvents(path.join(outputPath, 'augment-api-events.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    generateDefaultQuery(path.join(outputPath, 'augment-api-query.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    generateDefaultRpc(path.join(outputPath, 'augment-api-rpc.ts'), extraTypes);
    generateDefaultRuntime(path.join(outputPath, 'augment-api-runtime.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    generateDefaultTx(path.join(outputPath, 'augment-api-tx.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    writeFile(path.join(outputPath, 'augment-api.ts'), () => [
        HEADER('chain'),
        ...[
            ...['consts', 'errors', 'events', 'query', 'tx', 'rpc', 'runtime']
                .filter((key) => !!key)
                .map((key) => `./augment-api-${key}.js`)
        ].map((path) => `import '${path}';\n`)
    ].join(''));
    process.exit(0);
}
async function mainPromise() {
    const { endpoint, output, package: pkg, strict: isStrict } = yargs(hideBin(process.argv)).strict().options({
        endpoint: {
            description: 'The endpoint to connect to (e.g. wss://kusama-rpc.polkadot.io) or relative path to a file containing the JSON output of an RPC state_getMetadata call',
            required: true,
            type: 'string'
        },
        output: {
            description: 'The target directory to write the data to',
            required: true,
            type: 'string'
        },
        package: {
            description: 'Optional package in output location (for extra definitions)',
            type: 'string'
        },
        strict: {
            description: 'Turns on strict mode, no output of catch-all generic versions',
            type: 'boolean'
        }
    }).argv;
    let metaHex;
    if (endpoint.startsWith('wss://') || endpoint.startsWith('ws://')) {
        metaHex = await getMetadataViaWs(endpoint);
    }
    else {
        metaHex = JSON.parse(fs.readFileSync(assertFile(path.join(process.cwd(), endpoint)), 'utf-8')).result;
        if (!isHex(metaHex)) {
            throw new Error('Invalid metadata file');
        }
    }
    await generate(metaHex, pkg, output, isStrict);
}
export function main() {
    mainPromise().catch((error) => {
        console.error();
        console.error(error);
        console.error();
        process.exit(1);
    });
}

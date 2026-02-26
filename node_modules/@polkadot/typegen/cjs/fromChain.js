"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tslib_1 = require("tslib");
const node_fs_1 = tslib_1.__importDefault(require("node:fs"));
const node_path_1 = tslib_1.__importDefault(require("node:path"));
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const util_1 = require("@polkadot/util");
const index_js_1 = require("./generate/index.js");
const index_js_2 = require("./util/index.js");
async function generate(metaHex, pkg, output, isStrict) {
    console.log(`Generating from metadata, ${(0, util_1.formatNumber)((metaHex.length - 2) / 2)} bytes`);
    const outputPath = (0, index_js_2.assertDir)(node_path_1.default.join(process.cwd(), output));
    let extraTypes = {};
    let customLookupDefinitions = { rpc: {}, types: {} };
    if (pkg) {
        try {
            const defCont = await import((0, index_js_2.assertFile)(node_path_1.default.join(outputPath, 'definitions.ts')));
            extraTypes = {
                [pkg]: defCont
            };
        }
        catch (error) {
            console.error('ERROR: No custom definitions found:', error.message);
        }
    }
    try {
        const lookCont = await import((0, index_js_2.assertFile)(node_path_1.default.join(outputPath, 'lookup.ts')));
        customLookupDefinitions = {
            rpc: {},
            types: lookCont.default
        };
    }
    catch (error) {
        console.error('ERROR: No lookup definitions found:', error.message);
    }
    (0, index_js_1.generateDefaultConsts)(node_path_1.default.join(outputPath, 'augment-api-consts.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    (0, index_js_1.generateDefaultErrors)(node_path_1.default.join(outputPath, 'augment-api-errors.ts'), metaHex, extraTypes, isStrict);
    (0, index_js_1.generateDefaultEvents)(node_path_1.default.join(outputPath, 'augment-api-events.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    (0, index_js_1.generateDefaultQuery)(node_path_1.default.join(outputPath, 'augment-api-query.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    (0, index_js_1.generateDefaultRpc)(node_path_1.default.join(outputPath, 'augment-api-rpc.ts'), extraTypes);
    (0, index_js_1.generateDefaultRuntime)(node_path_1.default.join(outputPath, 'augment-api-runtime.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    (0, index_js_1.generateDefaultTx)(node_path_1.default.join(outputPath, 'augment-api-tx.ts'), metaHex, extraTypes, isStrict, customLookupDefinitions);
    (0, index_js_2.writeFile)(node_path_1.default.join(outputPath, 'augment-api.ts'), () => [
        (0, index_js_2.HEADER)('chain'),
        ...[
            ...['consts', 'errors', 'events', 'query', 'tx', 'rpc', 'runtime']
                .filter((key) => !!key)
                .map((key) => `./augment-api-${key}.js`)
        ].map((path) => `import '${path}';\n`)
    ].join(''));
    process.exit(0);
}
async function mainPromise() {
    const { endpoint, output, package: pkg, strict: isStrict } = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).strict().options({
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
        metaHex = await (0, index_js_2.getMetadataViaWs)(endpoint);
    }
    else {
        metaHex = JSON.parse(node_fs_1.default.readFileSync((0, index_js_2.assertFile)(node_path_1.default.join(process.cwd(), endpoint)), 'utf-8')).result;
        if (!(0, util_1.isHex)(metaHex)) {
            throw new Error('Invalid metadata file');
        }
    }
    await generate(metaHex, pkg, output, isStrict);
}
function main() {
    mainPromise().catch((error) => {
        console.error();
        console.error(error);
        console.error();
        process.exit(1);
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tslib_1 = require("tslib");
const node_fs_1 = tslib_1.__importDefault(require("node:fs"));
const node_path_1 = tslib_1.__importDefault(require("node:path"));
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const substrateDefs = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const util_1 = require("@polkadot/util");
const index_js_1 = require("./generate/index.js");
const interfaceRegistry_js_1 = require("./generate/interfaceRegistry.js");
const tsDef_js_1 = require("./generate/tsDef.js");
const index_js_2 = require("./util/index.js");
async function mainPromise() {
    const { endpoint, input, package: pkg } = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).strict().options({
        endpoint: {
            description: 'The endpoint to connect to (e.g. wss://kusama-rpc.polkadot.io) or relative path to a file containing the JSON output of an RPC state_getMetadata call',
            type: 'string'
        },
        input: {
            description: 'The directory to use for the user definitions',
            required: true,
            type: 'string'
        },
        package: {
            description: 'The package name & path to use for the user types',
            required: true,
            type: 'string'
        }
    }).argv;
    const inputPath = (0, index_js_2.assertDir)(node_path_1.default.join(process.cwd(), input));
    let userDefs = {};
    try {
        const defCont = await import((0, index_js_2.assertFile)(node_path_1.default.join(inputPath, 'definitions.ts')));
        userDefs = defCont;
    }
    catch (error) {
        console.error('ERROR: Unable to load user definitions:', error.message);
    }
    const userKeys = Object.keys(userDefs);
    const filteredBase = Object
        .entries(substrateDefs)
        .filter(([key]) => {
        if (userKeys.includes(key)) {
            console.warn(`Override found for ${key} in user types, ignoring in @polkadot/types`);
            return false;
        }
        return true;
    })
        .reduce((defs, [key, value]) => {
        defs[key] = value;
        return defs;
    }, {});
    const allDefs = {
        '@polkadot/types/interfaces': filteredBase,
        [pkg]: userDefs
    };
    (0, tsDef_js_1.generateTsDef)(allDefs, inputPath, pkg);
    (0, interfaceRegistry_js_1.generateInterfaceTypes)(allDefs, node_path_1.default.join(inputPath, 'augment-types.ts'));
    if (endpoint) {
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
        (0, index_js_1.generateDefaultLookup)(inputPath, metaHex);
    }
}
function main() {
    mainPromise().catch((error) => {
        console.error();
        console.error(error);
        console.error();
        process.exit(1);
    });
}

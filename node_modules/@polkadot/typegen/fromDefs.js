import fs from 'node:fs';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as substrateDefs from '@polkadot/types/interfaces/definitions';
import { isHex } from '@polkadot/util';
import { generateDefaultLookup } from './generate/index.js';
import { generateInterfaceTypes } from './generate/interfaceRegistry.js';
import { generateTsDef } from './generate/tsDef.js';
import { assertDir, assertFile, getMetadataViaWs } from './util/index.js';
async function mainPromise() {
    const { endpoint, input, package: pkg } = yargs(hideBin(process.argv)).strict().options({
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
    const inputPath = assertDir(path.join(process.cwd(), input));
    let userDefs = {};
    try {
        const defCont = await import(assertFile(path.join(inputPath, 'definitions.ts')));
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
    generateTsDef(allDefs, inputPath, pkg);
    generateInterfaceTypes(allDefs, path.join(inputPath, 'augment-types.ts'));
    if (endpoint) {
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
        generateDefaultLookup(inputPath, metaHex);
    }
}
export function main() {
    mainPromise().catch((error) => {
        console.error();
        console.error(error);
        console.error();
        process.exit(1);
    });
}

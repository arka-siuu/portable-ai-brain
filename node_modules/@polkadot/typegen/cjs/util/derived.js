"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSimilarTypes = getSimilarTypes;
const generic_1 = require("@polkadot/types/generic");
const definitions_1 = require("@polkadot/types/interfaces/democracy/definitions");
const types_codec_1 = require("@polkadot/types-codec");
const types_create_1 = require("@polkadot/types-create");
const util_1 = require("@polkadot/util");
const formatting_js_1 = require("./formatting.js");
const imports_js_1 = require("./imports.js");
function arrayToStrType(arr) {
    return `${arr.map((c) => `'${c}'`).join(' | ')}`;
}
const voteConvictions = arrayToStrType(definitions_1.AllConvictions);
/** @internal */
function getSimilarTypes(registry, definitions, _type, imports) {
    const typeParts = _type.split('::');
    const type = typeParts[typeParts.length - 1];
    const possibleTypes = [(0, formatting_js_1.formatType)(registry, definitions, type, imports)];
    if (type === 'Extrinsic') {
        (0, imports_js_1.setImports)(definitions, imports, ['IExtrinsic']);
        return ['Extrinsic', 'IExtrinsic', 'string', 'Uint8Array'];
    }
    else if (type === 'Keys') {
        // This one is weird... surely it should popup as a Tuple? (but either way better as defined hex)
        return ['Keys', 'string', 'Uint8Array'];
    }
    else if (type === 'StorageKey') {
        // TODO We can do better
        return ['StorageKey', 'string', 'Uint8Array', 'any'];
    }
    else if (type === '()') {
        return ['null'];
    }
    const Clazz = registry.createClass(type);
    if ((0, util_1.isChildClass)(types_codec_1.Vec, Clazz)) {
        const vecDef = (0, types_create_1.getTypeDef)(type);
        const subDef = (vecDef.sub);
        // this could be that we define a Vec type and refer to it by name
        if (subDef) {
            if (subDef.info === types_create_1.TypeDefInfo.Plain) {
                possibleTypes.push(`(${getSimilarTypes(registry, definitions, subDef.type, imports).join(' | ')})[]`);
            }
            else if (subDef.info === types_create_1.TypeDefInfo.Tuple) {
                const subs = subDef.sub.map(({ type }) => getSimilarTypes(registry, definitions, type, imports).join(' | '));
                possibleTypes.push(`([${subs.join(', ')}])[]`);
            }
            else if (subDef.info === types_create_1.TypeDefInfo.Option || subDef.info === types_create_1.TypeDefInfo.Vec || subDef.info === types_create_1.TypeDefInfo.VecFixed) {
                // TODO: Add possibleTypes so imports work
            }
            else if (subDef.info === types_create_1.TypeDefInfo.Struct) {
                // TODO: Add possibleTypes so imports work
            }
            else {
                throw new Error(`Unhandled subtype in Vec, ${(0, util_1.stringify)(subDef)}`);
            }
        }
    }
    else if ((0, util_1.isChildClass)(types_codec_1.Enum, Clazz)) {
        const { defKeys, isBasic } = new Clazz(registry);
        const keys = defKeys.filter((v) => !v.startsWith('__Unused'));
        if (isBasic) {
            possibleTypes.push(arrayToStrType(keys), 'number');
        }
        else {
            // TODO We don't really want any here, these should be expanded
            possibleTypes.push(...keys.map((k) => `{ ${k}: any }`), 'string');
        }
        possibleTypes.push('Uint8Array');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.AbstractInt, Clazz) || (0, util_1.isChildClass)(types_codec_1.Compact, Clazz)) {
        possibleTypes.push('AnyNumber', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(generic_1.GenericLookupSource, Clazz)) {
        possibleTypes.push('Address', 'AccountId', 'AccountIndex', 'LookupSource', 'string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(generic_1.GenericAccountId, Clazz)) {
        possibleTypes.push('string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(generic_1.GenericCall, Clazz)) {
        possibleTypes.push('IMethod', 'string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.bool, Clazz)) {
        possibleTypes.push('boolean', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.Null, Clazz)) {
        possibleTypes.push('null');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.Struct, Clazz)) {
        const s = new Clazz(registry);
        const obj = s.defKeys.map((key) => `${key}?: any`).join('; ');
        possibleTypes.push(`{ ${obj} }`, 'string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.Option, Clazz)) {
        possibleTypes.push('null', 'Uint8Array');
        const optDef = (0, types_create_1.getTypeDef)(type);
        const subDef = (optDef.sub);
        if (subDef) {
            possibleTypes.push(...getSimilarTypes(registry, definitions, subDef.type, imports));
        }
        else {
            possibleTypes.push('object', 'string');
        }
    }
    else if ((0, util_1.isChildClass)(generic_1.GenericVote, Clazz)) {
        possibleTypes.push(`{ aye: boolean; conviction?: ${voteConvictions} | number }`, 'boolean', 'string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.WrapperKeepOpaque, Clazz) || (0, util_1.isChildClass)(types_codec_1.WrapperOpaque, Clazz)) {
        // TODO inspect container
        possibleTypes.push('object', 'string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(Uint8Array, Clazz)) {
        possibleTypes.push('string', 'Uint8Array');
    }
    else if ((0, util_1.isChildClass)(String, Clazz)) {
        possibleTypes.push('string');
    }
    else if ((0, util_1.isChildClass)(types_codec_1.Tuple, Clazz)) {
        const tupDef = (0, types_create_1.getTypeDef)(type);
        const subDef = tupDef.sub;
        // this could be that we define a Tuple type and refer to it by name
        if (Array.isArray(subDef)) {
            const subs = subDef.map(({ type }) => getSimilarTypes(registry, definitions, type, imports).join(' | '));
            possibleTypes.push(`[${subs.join(', ')}]`);
        }
    }
    return [...new Set(possibleTypes)];
}

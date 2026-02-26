"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCallTypes = generateCallTypes;
exports.generateDefaultRuntime = generateDefaultRuntime;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const defaultDefs = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const definitions_1 = tslib_1.__importDefault(require("@polkadot/types-augment/lookup/definitions"));
const util_1 = require("@polkadot/util");
const util_crypto_1 = require("@polkadot/util-crypto");
const index_js_1 = require("../util/index.js");
const types_js_1 = require("./types.js");
const generateCallsTypesTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('calls'));
const aliases = {
    AssetHubKusamaRuntimeRuntimeCall: 'RuntimeCall',
    AssetHubPolkadotRuntimeRuntimeCall: 'RuntimeCall',
    KitchensinkRuntimeRuntimeCall: 'RuntimeCall',
    OpaqueValue: 'Bytes',
    PolkadotParachainPrimitivesPrimitivesId: 'ParaId',
    PolkadotParachainPrimitivesPrimitivesValidationCodeHash: 'ValidationCodeHash',
    PolkadotPrimitivesV7SlashingOpaqueKeyOwnershipProof: 'OpaqueKeyOwnershipProof',
    PolkadotPrimitivesV8SlashingOpaqueKeyOwnershipProof: 'OpaqueKeyOwnershipProof',
    PolkadotRuntimeRuntimeCall: 'RuntimeCall',
    PrimitiveTypesH160: 'H160',
    PrimitiveTypesH256: 'H256',
    PrimitiveTypesU256: 'U256',
    SpConsensusBabeOpaqueKeyOwnershipProof: 'OpaqueKeyOwnershipProof',
    SpConsensusSlotsSlot: 'Slot',
    SpConsensusSlotsSlotDuration: 'SlotDuration',
    SpCoreCryptoAccountId32: 'AccountId32',
    SpCoreOpaqueMetadata: 'OpaqueMetadata',
    SpRuntimeOpaqueValue: 'Bytes',
    SpRuntimeUncheckedExtrinsic: 'Extrinsic',
    StagingKusamaRuntimeRuntimeCall: 'RuntimeCall'
};
const getTypesViaAlias = (registry, id) => {
    const typeName = registry.lookup.getName(id) || registry.lookup.getTypeDef(id).type;
    if (aliases[typeName]) {
        return aliases[typeName];
    }
    return typeName;
};
/** @internal */
function getMethods(registry, methods) {
    const result = {};
    methods.forEach((m) => {
        const { deprecationInfo, docs, inputs, name, output } = m;
        let description = docs.map((d) => d.toString()).join();
        if (!deprecationInfo.isNotDeprecated) {
            const deprecationNotice = (0, types_js_1.getDeprecationNotice)(deprecationInfo, (0, util_1.stringCamelCase)(name));
            const notice = description.length ? `\n * ${deprecationNotice}` : ` * ${deprecationNotice}`;
            description += notice;
        }
        result[name.toString()] = {
            description,
            params: inputs.map(({ name, type }) => {
                return { name: name.toString(), type: getTypesViaAlias(registry, type) };
            }),
            type: getTypesViaAlias(registry, output)
        };
    });
    return result;
}
/** @internal */
function getRuntimeDefViaMetadata(registry) {
    const result = {};
    const { apis } = registry.metadata;
    for (let i = 0, count = apis.length; i < count; i++) {
        const { methods, name } = apis[i];
        result[name.toString()] = [{
                methods: getMethods(registry, methods),
                // We set the version to 0 here since it will not be relevant when we are grabbing the runtime apis
                // from the Metadata.
                version: 0
            }];
    }
    return Object.entries(result);
}
/** @internal */
function getDefs(apis, defs, registry) {
    const named = {};
    const all = Object.values(defs);
    const isApiInMetadata = registry.metadata.apis.length > 0;
    if (isApiInMetadata) {
        const sections = getRuntimeDefViaMetadata(registry);
        for (let j = 0, jcount = sections.length; j < jcount; j++) {
            const [_section, secs] = sections[j];
            const sec = secs[0];
            const sectionHash = (0, util_crypto_1.blake2AsHex)(_section, 64);
            const section = (0, util_1.stringCamelCase)(_section);
            const methods = Object.entries(sec.methods);
            if (!named[section]) {
                named[section] = {};
            }
            for (let m = 0, mcount = methods.length; m < mcount; m++) {
                const [_method, def] = methods[m];
                const method = (0, util_1.stringCamelCase)(_method);
                named[section][method] = (0, util_1.objectSpread)({ method, name: `${_section}_${_method}`, section, sectionHash }, def);
            }
        }
    }
    else {
        for (let j = 0, jcount = all.length; j < jcount; j++) {
            const set = all[j].runtime;
            if (set) {
                const sections = Object.entries(set);
                for (let i = 0, scount = sections.length; i < scount; i++) {
                    const [_section, sec] = sections[i];
                    const sectionHash = (0, util_crypto_1.blake2AsHex)(_section, 64);
                    const api = apis?.find(([h]) => h === sectionHash);
                    if (api) {
                        const ver = sec.find(({ version }) => version === api[1]);
                        if (ver) {
                            const methods = Object.entries(ver.methods);
                            const mcount = methods.length;
                            if (mcount) {
                                const section = (0, util_1.stringCamelCase)(_section);
                                if (!named[section]) {
                                    named[section] = {};
                                }
                                for (let m = 0; m < mcount; m++) {
                                    const [_method, def] = methods[m];
                                    const method = (0, util_1.stringCamelCase)(_method);
                                    named[section][method] = (0, util_1.objectSpread)({ method, name: `${_section}_${method}`, section, sectionHash, version: ver.version }, def);
                                }
                            }
                        }
                        else {
                            console.warn(`Unable to find matching version for runtime ${_section}, expected ${api[1]}`);
                        }
                    }
                }
            }
        }
    }
    return named;
}
/** @internal */
function generateCallTypes(registry, meta, dest, extraTypes, isStrict, customLookupDefinitions) {
    (0, index_js_1.writeFile)(dest, () => {
        const allTypes = {
            '@polkadot/types-augment': {
                lookup: {
                    ...definitions_1.default,
                    ...customLookupDefinitions
                }
            },
            '@polkadot/types/interfaces': defaultDefs,
            ...extraTypes
        };
        const imports = (0, index_js_1.createImports)(allTypes);
        // find the system.Version in metadata
        let apis = null;
        const sysp = meta.asLatest.pallets.find(({ name }) => name.eq('System'));
        if (sysp) {
            const verc = sysp.constants.find(({ name }) => name.eq('Version'));
            if (verc) {
                apis = registry.createType('RuntimeVersion', verc.value).apis.map(([k, v]) => [k.toHex(), v.toNumber()]);
            }
            else {
                console.error('Unable to find System.Version pallet, skipping API extraction');
            }
        }
        else {
            console.error('Unable to find System pallet, skipping API extraction');
        }
        const allDefs = Object.entries(allTypes).reduce((defs, [path, obj]) => {
            return Object.entries(obj).reduce((defs, [key, value]) => ({ ...defs, [`${path}/${key}`]: value }), defs);
        }, {});
        const definitions = getDefs(apis, imports.definitions, registry);
        const callKeys = Object.keys(definitions);
        const modules = callKeys.map((section) => {
            const calls = definitions[section];
            const allMethods = Object.keys(calls).sort().map((methodName) => {
                const def = calls[methodName];
                (0, index_js_1.setImports)(allDefs, imports, [def.type]);
                const args = def.params.map((param) => {
                    const similarTypes = (0, index_js_1.getSimilarTypes)(registry, imports.definitions, param.type, imports);
                    (0, index_js_1.setImports)(allDefs, imports, [param.type, ...similarTypes]);
                    return `${param.name}: ${similarTypes.join(' | ')}`;
                });
                return {
                    args: args.join(', '),
                    docs: [def.description],
                    name: methodName,
                    sectionHash: def.sectionHash,
                    sectionName: def.section,
                    sectionVersion: def.version,
                    type: (0, index_js_1.formatType)(registry, allDefs, def.type, imports)
                };
            }).sort((a, b) => a.name.localeCompare(b.name));
            return {
                items: allMethods,
                name: section || 'unknown',
                sectionHash: allMethods.length && allMethods[0].sectionHash,
                sectionName: allMethods.length && allMethods[0].sectionName,
                sectionVersion: allMethods.length && allMethods[0].sectionVersion
            };
        }).filter(({ items }) => items.length).sort((a, b) => a.name.localeCompare(b.name));
        if (modules.length) {
            imports.typesTypes['Observable'] = true;
        }
        return generateCallsTypesTemplate({
            headerType: 'chain',
            imports,
            isStrict,
            modules,
            types: [
                ...Object.keys(imports.localTypes).sort().map((packagePath) => ({
                    file: packagePath.replace('@polkadot/types-augment', '@polkadot/types'),
                    types: Object.keys(imports.localTypes[packagePath])
                })),
                {
                    file: '@polkadot/api-base/types',
                    types: ['ApiTypes', 'AugmentedCall', 'DecoratedCallBase']
                }
            ]
        });
    });
}
function generateDefaultRuntime(dest, data, extraTypes = {}, isStrict = false, customLookupDefinitions) {
    const { metadata, registry } = (0, index_js_1.initMeta)(data, extraTypes);
    generateCallTypes(registry, metadata, dest, extraTypes, isStrict, customLookupDefinitions);
}

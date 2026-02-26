"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tslib_1 = require("tslib");
const comment_parser_1 = require("comment-parser");
const node_fs_1 = tslib_1.__importDefault(require("node:fs"));
const node_path_1 = tslib_1.__importStar(require("node:path"));
const node_process_1 = tslib_1.__importDefault(require("node:process"));
const node_url_1 = require("node:url");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const api_derive_1 = require("@polkadot/api-derive");
const types_1 = require("@polkadot/types");
const definitions = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const getStorage_1 = require("@polkadot/types/metadata/decorate/storage/getStorage");
const util_1 = require("@polkadot/types/util");
const asset_hub_kusama_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-kusama-hex"));
const asset_hub_kusama_rpc_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-kusama-rpc"));
const asset_hub_kusama_ver_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-kusama-ver"));
const asset_hub_polkadot_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-polkadot-hex"));
const asset_hub_polkadot_rpc_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-polkadot-rpc"));
const asset_hub_polkadot_ver_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/asset-hub-polkadot-ver"));
const kusama_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/kusama-hex"));
const kusama_rpc_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/kusama-rpc"));
const kusama_ver_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/kusama-ver"));
const polkadot_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/polkadot-hex"));
const polkadot_rpc_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/polkadot-rpc"));
const polkadot_ver_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/polkadot-ver"));
const substrate_hex_1 = tslib_1.__importDefault(require("@polkadot/types-support/metadata/v15/substrate-hex"));
const util_2 = require("@polkadot/util");
const util_crypto_1 = require("@polkadot/util-crypto");
const index_js_1 = require("./util/index.js");
const headerFn = (runtimeDesc) => `\n\n(NOTE: These were generated from a static/snapshot view of a recent ${runtimeDesc}. Some items may not be available in older nodes, or in any customized implementations.)`;
const ALL_STATIC = {
    'asset-hub-kusama': {
        meta: asset_hub_kusama_hex_1.default,
        rpc: asset_hub_kusama_rpc_1.default,
        ver: asset_hub_kusama_ver_1.default
    },
    'asset-hub-polkadot': {
        meta: asset_hub_polkadot_hex_1.default,
        rpc: asset_hub_polkadot_rpc_1.default,
        ver: asset_hub_polkadot_ver_1.default
    },
    kusama: {
        meta: kusama_hex_1.default,
        rpc: kusama_rpc_1.default,
        ver: kusama_ver_1.default
    },
    polkadot: {
        meta: polkadot_hex_1.default,
        rpc: polkadot_rpc_1.default,
        ver: polkadot_ver_1.default
    },
    substrate: {
        meta: substrate_hex_1.default
    }
};
/** @internal */
function docsVecToMarkdown(docLines, indent = 0) {
    const md = docLines
        .map((docLine) => docLine
        .toString()
        .trimStart()
        .replace(/^r"/g, '')
        .trimStart())
        .reduce((md, docLine) => // generate paragraphs
     !docLine.length
        ? `${md}\n\n` // empty line
        : /^[*-]/.test(docLine.trimStart()) && !md.endsWith('\n\n')
            ? `${md}\n\n${docLine}` // line calling for a preceding linebreak
            : `${md} ${docLine.replace(/^#{1,3} /, '#### ')} `, '')
        .replace(/#### <weight>/g, '<weight>')
        .replace(/<weight>(.|\n)*?<\/weight>/g, '')
        .replace(/#### Weight:/g, 'Weight:');
    // prefix each line with indentation
    return md?.split('\n\n').map((line) => `${' '.repeat(indent)}${line}`).join('\n\n');
}
function renderPage(page) {
    let md = `---\ntitle: ${page.title}\n---\n\n`;
    if (page.description) {
        md += `${page.description}\n\n`;
    }
    // index
    page.sections.forEach((section) => {
        md += `- **[${(0, util_2.stringCamelCase)(section.name)}](#${(0, util_2.stringCamelCase)(section.name).toLowerCase()})**\n\n`;
    });
    // contents
    page.sections.forEach((section) => {
        md += '\n___\n\n\n';
        md += section.link
            ? `<h2 id="#${section.link}">${section.name}</h2>\n`
            : `## ${section.name}\n`;
        if (section.description) {
            md += `\n_${section.description}_\n`;
        }
        section.items.forEach((item) => {
            md += ' \n';
            md += item.link
                ? `<h3 id="#${item.link}">${item.name}</h3>`
                : `### ${item.name}`;
            Object
                .keys(item)
                .filter((key) => !['link', 'name'].includes(key))
                .forEach((bullet) => {
                md += `\n- **${bullet}**: ${
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                item[bullet] instanceof types_1.Vec
                    ? docsVecToMarkdown(item[bullet], 2).toString()
                    : item[bullet]}`;
            });
            md += '\n';
        });
    });
    return md;
}
function sortByName(a, b) {
    // case insensitive (all-uppercase) sorting
    return a.name.toString().toUpperCase().localeCompare(b.name.toString().toUpperCase());
}
function getSiName(lookup, type) {
    const typeDef = lookup.getTypeDef(type);
    return typeDef.lookupName || typeDef.type;
}
/** @internal */
function addRpc(_runtimeDesc, rpcMethods) {
    return renderPage({
        description: 'The following sections contain known RPC methods that may be available on specific nodes (depending on configuration and available pallets) and allow you to interact with the actual node, query, and submit.',
        sections: Object
            .keys(definitions)
            .filter((key) => Object.keys(definitions[key].rpc || {}).length !== 0)
            .sort()
            .reduce((all, _sectionName) => {
            const section = definitions[_sectionName];
            Object
                .keys(section.rpc || {})
                .sort()
                .forEach((methodName) => {
                const method = section.rpc?.[methodName];
                if (!method) {
                    throw new Error(`No ${methodName} RPC found in ${_sectionName}`);
                }
                const sectionName = method.aliasSection || _sectionName;
                const jsonrpc = (method.endpoint || `${sectionName}_${methodName}`);
                if (rpcMethods) {
                    // if we are passing the rpcMethods params and we cannot find this method, skip it
                    if (jsonrpc !== 'rpc_methods' && !rpcMethods.includes(jsonrpc)) {
                        return;
                    }
                }
                const topName = method.aliasSection ? `${_sectionName}/${method.aliasSection}` : _sectionName;
                let container = all.find(({ name }) => name === topName);
                if (!container) {
                    container = { items: [], name: topName };
                    all.push(container);
                }
                const args = method.params.map(({ isOptional, name, type }) => {
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    return name + (isOptional ? '?' : '') + ': `' + type + '`';
                }).join(', ');
                const type = '`' + method.type + '`';
                container.items.push({
                    interface: '`' + `api.rpc.${sectionName}.${methodName}` + '`',
                    jsonrpc: '`' + jsonrpc + '`',
                    // link: jsonrpc,
                    name: `${methodName}(${args}): ${type}`,
                    ...((method.description && { summary: method.description }) || {}),
                    ...((method.deprecated && { deprecated: method.deprecated }) || {}),
                    ...((method.isUnsafe && { unsafe: 'This method is only active with appropriate flags' }) || {})
                });
            });
            return all;
        }, []).sort(sortByName),
        title: 'JSON-RPC'
    });
}
/** @internal */
function getMethods(registry, methods) {
    const result = {};
    methods.forEach((m) => {
        const { docs, inputs, name, output } = m;
        result[name.toString()] = {
            description: docs.map((d) => d.toString()).join(),
            params: inputs.map(({ name, type }) => {
                return { name: name.toString(), type: registry.lookup.getName(type) || registry.lookup.getTypeDef(type).type };
            }),
            type: registry.lookup.getName(output) || registry.lookup.getTypeDef(output).type
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
function runtimeSections(registry) {
    const sections = getRuntimeDefViaMetadata(registry);
    const all = [];
    for (let j = 0, jcount = sections.length; j < jcount; j++) {
        const [_section, secs] = sections[j];
        const sec = secs[0];
        const section = (0, util_2.stringCamelCase)(_section);
        const methods = Object.entries(sec.methods);
        const container = { items: [], name: section };
        all.push(container);
        methods
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([methodName, { description, params, type }]) => {
            const args = params.map(({ name, type }) => {
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                return name + ': `' + type + '`';
            }).join(', ');
            container.items.push({
                interface: '`' + `api.call.${(0, util_2.stringCamelCase)(section)}.${(0, util_2.stringCamelCase)(methodName)}` + '`',
                name: `${(0, util_2.stringCamelCase)(methodName)}(${args}): ${'`' + type + '`'}`,
                runtime: '`' + `${section}_${methodName}` + '`',
                summary: description
            });
        });
    }
    return all.sort(sortByName);
}
/** @internal */
function addRuntime(_runtimeDesc, registry) {
    return renderPage({
        description: 'The following section contains known runtime calls that may be available on specific runtimes (depending on configuration and available pallets). These call directly into the WASM runtime for queries and operations.',
        sections: runtimeSections(registry),
        title: 'Runtime'
    });
}
/** @internal */
function addLegacyRuntime(_runtimeDesc, _registry, apis) {
    return renderPage({
        description: 'The following section contains known runtime calls that may be available on specific runtimes (depending on configuration and available pallets). These call directly into the WASM runtime for queries and operations.',
        sections: Object
            .keys(definitions)
            .filter((key) => Object.keys(definitions[key].runtime || {}).length !== 0)
            .sort()
            .reduce((all, _sectionName) => {
            Object
                .entries(definitions[_sectionName].runtime || {})
                .forEach(([apiName, versions]) => {
                versions
                    .sort((a, b) => b.version - a.version)
                    .forEach(({ methods, version }, index) => {
                    if (apis) {
                        // if we are passing the api hashes and we cannot find this one, skip it
                        const apiHash = (0, util_crypto_1.blake2AsHex)(apiName, 64);
                        const api = apis.find(([hash]) => hash === apiHash);
                        if (!api || api[1] !== version) {
                            return;
                        }
                    }
                    else if (index) {
                        // we only want the highest version
                        return;
                    }
                    const container = { items: [], name: apiName };
                    all.push(container);
                    Object
                        .entries(methods)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .forEach(([methodName, { description, params, type }]) => {
                        const args = params.map(({ name, type }) => {
                            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                            return name + ': `' + type + '`';
                        }).join(', ');
                        container.items.push({
                            interface: '`' + `api.call.${(0, util_2.stringCamelCase)(apiName)}.${(0, util_2.stringCamelCase)(methodName)}` + '`',
                            name: `${(0, util_2.stringCamelCase)(methodName)}(${args}): ${'`' + type + '`'}`,
                            runtime: '`' + `${apiName}_${methodName}` + '`',
                            summary: description
                        });
                    });
                });
            });
            return all;
        }, []).sort(sortByName),
        title: 'Runtime'
    });
}
/** @internal */
function addConstants(runtimeDesc, { lookup, pallets }) {
    return renderPage({
        description: `The following sections contain the module constants, also known as parameter types. These can only be changed as part of a runtime upgrade. On the api, these are exposed via \`api.consts.<module>.<method>\`. ${headerFn(runtimeDesc)}`,
        sections: pallets
            .sort(sortByName)
            .filter(({ constants }) => !constants.isEmpty)
            .map(({ constants, name }) => {
            const sectionName = (0, util_2.stringLowerFirst)(name);
            return {
                items: constants
                    .sort(sortByName)
                    .map(({ docs, name, type }) => {
                    const methodName = (0, util_2.stringCamelCase)(name);
                    return {
                        interface: '`' + `api.consts.${sectionName}.${methodName}` + '`',
                        name: `${methodName}: ` + '`' + getSiName(lookup, type) + '`',
                        ...(docs.length && { summary: docs })
                    };
                }),
                name: sectionName
            };
        }),
        title: 'Constants'
    });
}
/** @internal */
function addStorage(runtimeDesc, { lookup, pallets, registry }) {
    const { substrate } = (0, getStorage_1.getStorage)(registry);
    const moduleSections = pallets
        .sort(sortByName)
        .filter((moduleMetadata) => !moduleMetadata.storage.isNone)
        .map((moduleMetadata) => {
        const sectionName = (0, util_2.stringLowerFirst)(moduleMetadata.name);
        return {
            items: moduleMetadata.storage.unwrap().items
                .sort(sortByName)
                .map((func) => {
                let arg = '';
                if (func.type.isMap) {
                    const { hashers, key } = func.type.asMap;
                    arg = '`' + (hashers.length === 1
                        ? getSiName(lookup, key)
                        : lookup.getSiType(key).def.asTuple.map((t) => getSiName(lookup, t)).join(', ')) + '`';
                }
                const methodName = (0, util_2.stringLowerFirst)(func.name);
                const outputType = (0, util_1.unwrapStorageType)(registry, func.type, func.modifier.isOptional);
                return {
                    interface: '`' + `api.query.${sectionName}.${methodName}` + '`',
                    name: `${methodName}(${arg}): ` + '`' + outputType + '`',
                    ...(func.docs.length && { summary: func.docs })
                };
            }),
            name: sectionName
        };
    });
    return renderPage({
        description: `The following sections contain Storage methods are part of the ${runtimeDesc}. On the api, these are exposed via \`api.query.<module>.<method>\`. ${headerFn(runtimeDesc)}`,
        sections: moduleSections.concat([{
                description: 'These are well-known keys that are always available to the runtime implementation of any Substrate-based network.',
                items: Object.entries(substrate).map(([name, { meta }]) => {
                    const arg = meta.type.isMap
                        ? ('`' + getSiName(lookup, meta.type.asMap.key) + '`')
                        : '';
                    const methodName = (0, util_2.stringLowerFirst)(name);
                    const outputType = (0, util_1.unwrapStorageType)(registry, meta.type, meta.modifier.isOptional);
                    return {
                        interface: '`' + `api.query.substrate.${methodName}` + '`',
                        name: `${methodName}(${arg}): ` + '`' + outputType + '`',
                        summary: meta.docs
                    };
                }),
                name: 'substrate'
            }]).sort(sortByName),
        title: 'Storage'
    });
}
/** @internal */
function addExtrinsics(runtimeDesc, { lookup, pallets }) {
    return renderPage({
        description: `The following sections contain Extrinsics methods are part of the ${runtimeDesc}. On the api, these are exposed via \`api.tx.<module>.<method>\`. ${headerFn(runtimeDesc)}`,
        sections: pallets
            .sort(sortByName)
            .filter(({ calls }) => calls.isSome)
            .map(({ calls, name }) => {
            const sectionName = (0, util_2.stringCamelCase)(name);
            return {
                items: lookup.getSiType(calls.unwrap().type).def.asVariant.variants
                    .sort(sortByName)
                    .map(({ docs, fields, name }, index) => {
                    const methodName = (0, util_2.stringCamelCase)(name);
                    const args = fields.map(({ name, type }) => `${name.isSome ? name.toString() : `param${index}`}: ` + '`' + getSiName(lookup, type) + '`').join(', ');
                    return {
                        interface: '`' + `api.tx.${sectionName}.${methodName}` + '`',
                        name: `${methodName}(${args})`,
                        ...(docs.length && { summary: docs })
                    };
                }),
                name: sectionName
            };
        }),
        title: 'Extrinsics'
    });
}
/** @internal */
function addEvents(runtimeDesc, { lookup, pallets }) {
    return renderPage({
        description: `Events are emitted for certain operations on the runtime. The following sections describe the events that are part of the ${runtimeDesc}. ${headerFn(runtimeDesc)}`,
        sections: pallets
            .sort(sortByName)
            .filter(({ events }) => events.isSome)
            .map((meta) => ({
            items: lookup.getSiType(meta.events.unwrap().type).def.asVariant.variants
                .sort(sortByName)
                .map(({ docs, fields, name }) => {
                const methodName = name.toString();
                const args = fields.map(({ type }) => '`' + getSiName(lookup, type) + '`').join(', ');
                return {
                    interface: '`' + `api.events.${(0, util_2.stringCamelCase)(meta.name)}.${methodName}.is` + '`',
                    name: `${methodName}(${args})`,
                    ...(docs.length && { summary: docs })
                };
            }),
            name: (0, util_2.stringCamelCase)(meta.name)
        })),
        title: 'Events'
    });
}
/** @internal */
function addErrors(runtimeDesc, { lookup, pallets }) {
    return renderPage({
        description: `This page lists the errors that can be encountered in the different modules. ${headerFn(runtimeDesc)}`,
        sections: pallets
            .sort(sortByName)
            .filter(({ errors }) => errors.isSome)
            .map((moduleMetadata) => ({
            items: lookup.getSiType(moduleMetadata.errors.unwrap().type).def.asVariant.variants
                .sort(sortByName)
                .map((error) => ({
                interface: '`' + `api.errors.${(0, util_2.stringCamelCase)(moduleMetadata.name)}.${error.name.toString()}.is` + '`',
                name: error.name.toString(),
                ...(error.docs.length && { summary: error.docs })
            })),
            name: (0, util_2.stringLowerFirst)(moduleMetadata.name)
        })),
        title: 'Errors'
    });
}
function getDependencyBasePath(moduleName) {
    const modulePath = import.meta.resolve(moduleName);
    return (0, node_path_1.resolve)((0, node_path_1.dirname)((0, node_url_1.fileURLToPath)(modulePath)));
}
const BASE_DERIVE_PATH = getDependencyBasePath('@polkadot/api-derive');
const obtainDeriveFiles = (deriveModule) => {
    const filePath = `${BASE_DERIVE_PATH}/${deriveModule}`;
    const files = node_fs_1.default.readdirSync(filePath);
    return files
        .filter((file) => file.endsWith('.js'))
        .map((file) => `${deriveModule}/${file}`);
};
function extractDeriveDescription(tags, name) {
    const descriptionTag = tags.find((tag) => tag.tag === name);
    return descriptionTag
        ? `${descriptionTag.name ?? ''} ${descriptionTag.description ?? ''}`.trim()
        : null;
}
function extractDeriveParams(tags) {
    const descriptionTag = tags
        .filter((tag) => tag.tag === 'param')
        .map((param) => {
        return {
            description: param.description ?? null,
            name: param.name ?? null,
            type: param.type ?? null
        };
    });
    return descriptionTag;
}
function extractDeriveExample(tags) {
    const exampleTag = tags.find((tag) => tag.tag === 'example');
    if (!exampleTag) {
        return null;
    }
    let example = '';
    const inCodeBlock = { done: false, found: false };
    // Obtain code block from example tag.
    exampleTag.source.forEach((line) => {
        if (inCodeBlock.done) {
            return;
        }
        if (line.source.indexOf('```') !== -1 && !inCodeBlock.found) {
            inCodeBlock.found = true;
        }
        else if (line.source.indexOf('```') !== -1 && inCodeBlock.found) {
            inCodeBlock.done = true;
        }
        if (!inCodeBlock.found) {
            return;
        }
        example += line.source.slice(2, line.source.length);
        if (!inCodeBlock.done) {
            example += '\n';
        }
    });
    return example;
}
const getDeriveDocs = (metadata, file) => {
    const filePath = `${BASE_DERIVE_PATH}/${file}`;
    const deriveModule = file.split('/')[0];
    const fileContent = node_fs_1.default.readFileSync(filePath, 'utf8');
    const comments = (0, comment_parser_1.parse)(fileContent);
    const docs = comments
        .filter((comment) => comment.tags)
        .map((comment) => {
        return {
            description: extractDeriveDescription(comment.tags, 'description'),
            example: extractDeriveExample(comment.tags),
            name: comment.tags.find((tag) => tag.tag === 'name')?.name || null,
            params: extractDeriveParams(comment.tags),
            returns: extractDeriveDescription(comment.tags, 'returns')
        };
    });
    metadata[deriveModule]
        ? (metadata[deriveModule] = [...metadata[deriveModule], ...docs])
        : (metadata[deriveModule] = [...docs]);
};
function renderDerives(metadata) {
    let md = '---\ntitle: Derives\n---\n\nThis page lists the derives that can be encountered in the different modules. Designed to simplify the process of querying complex on-chain data by combining multiple RPC calls, storage queries, and runtime logic into a single, callable function. \n\nInstead of manually fetching and processing blockchain data, developers can use `api.derive.<module>.<method>()` to retrieve information.\n\n';
    const deriveModules = Object.keys(metadata).filter((d) => metadata[d].length !== 0);
    // index
    deriveModules.forEach((deriveModule) => {
        md += `- **[${deriveModule}](#${deriveModule})**\n\n`;
    });
    // contents
    deriveModules.forEach((deriveModule) => {
        md += `\n___\n## ${deriveModule}\n`;
        metadata[deriveModule]
            .filter((item) => item.name)
            .forEach((item) => {
            const { description, example, name, params, returns } = item;
            md += ` \n### [${name}](#${name})`;
            if (description) {
                md += `\n${description}`;
            }
            md += `\n- **interface**: \`api.derive.${deriveModule}.${name}\``;
            if (params.length) {
                md += '\n- **params**:\n';
                params.forEach((param) => (md += `  - ${param.name} \`${param.type}\`: ${param.description}\n`));
            }
            if (returns) {
                md += `\n- **returns**: ${returns}`;
            }
            if (example) {
                md += `\n- **example**: \n${example}`;
            }
        });
    });
    return md;
}
function generateDerives() {
    let fileList = [];
    Object.keys(api_derive_1.derive).forEach((deriveModule) => {
        fileList = [...fileList, ...obtainDeriveFiles(deriveModule)];
    });
    const metadata = {};
    fileList.forEach((file) => {
        getDeriveDocs(metadata, file);
    });
    return renderDerives(metadata);
}
/** @internal */
function writeFile(name, ...chunks) {
    const writeStream = node_fs_1.default.createWriteStream(name, { encoding: 'utf8', flags: 'w' });
    writeStream.on('finish', () => {
        console.log(`Completed writing ${name}`);
    });
    chunks.forEach((chunk) => {
        writeStream.write(chunk);
    });
    writeStream.end();
}
async function mainPromise() {
    const { chain, endpoint, metadataVer } = (0, yargs_1.default)((0, helpers_1.hideBin)(node_process_1.default.argv)).strict().options({
        chain: {
            description: 'The chain name to use for the output (defaults to "Substrate")',
            type: 'string'
        },
        endpoint: {
            description: 'The endpoint to connect to (e.g. wss://kusama-rpc.polkadot.io) or relative path to a file containing the JSON output of an RPC state_getMetadata call',
            type: 'string'
        },
        metadataVer: {
            description: 'The metadata version to use for generating type information. This will use state_call::Metadata_metadata_at_version to query metadata',
            type: 'number'
        }
    }).argv;
    /**
     * This is unique to when the endpoint arg is used. Since the endpoint requires us to query the chain, it may query the chains
     * rpc state_getMetadata method to get metadata, but this restricts us to v14 only. Therefore we must also check if the `metadataVer` is passed
     * in as well. These checks will help us decide if we are using v14 or newer.
     */
    const useV14Metadata = endpoint && ((metadataVer && metadataVer < 15) || !metadataVer);
    const chainName = chain || 'Substrate';
    let metaHex;
    let rpcMethods;
    let runtimeApis;
    if (endpoint) {
        if (endpoint.startsWith('wss://') || endpoint.startsWith('ws://')) {
            metaHex = await (0, index_js_1.getMetadataViaWs)(endpoint, metadataVer);
            rpcMethods = await (0, index_js_1.getRpcMethodsViaWs)(endpoint);
            runtimeApis = await (0, index_js_1.getRuntimeVersionViaWs)(endpoint);
        }
        else {
            metaHex = JSON.parse(node_fs_1.default.readFileSync((0, index_js_1.assertFile)(node_path_1.default.join(node_process_1.default.cwd(), endpoint)), 'utf-8')).result;
            if (!(0, util_2.isHex)(metaHex)) {
                throw new Error('Invalid metadata file');
            }
        }
    }
    else if (ALL_STATIC[chainName.toLowerCase()]) {
        metaHex = ALL_STATIC[chainName.toLowerCase()].meta;
        rpcMethods = ALL_STATIC[chainName.toLowerCase()].rpc?.methods;
    }
    else {
        metaHex = substrate_hex_1.default;
    }
    let metadata;
    const registry = new types_1.TypeRegistry();
    if (useV14Metadata) {
        metadata = new types_1.Metadata(registry, metaHex);
    }
    else {
        const opaqueMetadata = registry.createType('Option<OpaqueMetadata>', registry.createType('Raw', metaHex).toU8a()).unwrap();
        metadata = new types_1.Metadata(registry, opaqueMetadata.toHex());
    }
    registry.setMetadata(metadata);
    const latest = metadata.asLatest;
    const runtimeDesc = `default ${chainName} runtime`;
    const docRoot = `docs/${chainName.toLowerCase()}`;
    writeFile(`${docRoot}/rpc.md`, addRpc(runtimeDesc, rpcMethods));
    useV14Metadata
        ? writeFile(`${docRoot}/runtime.md`, addLegacyRuntime(runtimeDesc, registry, runtimeApis))
        : writeFile(`${docRoot}/runtime.md`, addRuntime(runtimeDesc, registry));
    writeFile(`${docRoot}/constants.md`, addConstants(runtimeDesc, latest));
    writeFile(`${docRoot}/storage.md`, addStorage(runtimeDesc, latest));
    writeFile(`${docRoot}/extrinsics.md`, addExtrinsics(runtimeDesc, latest));
    writeFile(`${docRoot}/events.md`, addEvents(runtimeDesc, latest));
    writeFile(`${docRoot}/errors.md`, addErrors(runtimeDesc, latest));
    if (chainName === 'Substrate') {
        writeFile('docs/derives/derives.md', generateDerives());
    }
}
function main() {
    mainPromise().catch((error) => {
        console.error();
        console.error(error);
        console.error();
        node_process_1.default.exit(1);
    });
}

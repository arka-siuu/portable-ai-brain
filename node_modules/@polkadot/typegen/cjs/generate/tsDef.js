"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeEncoders = void 0;
exports.createGetter = createGetter;
exports.generateTsDefFor = generateTsDefFor;
exports.generateTsDef = generateTsDef;
exports.generateDefaultTsDef = generateDefaultTsDef;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const node_path_1 = tslib_1.__importDefault(require("node:path"));
const create_1 = require("@polkadot/types/create");
const defaultDefinitions = tslib_1.__importStar(require("@polkadot/types/interfaces/definitions"));
const types_create_1 = require("@polkadot/types-create");
const util_1 = require("@polkadot/util");
const index_js_1 = require("../util/index.js");
const generateTsDefIndexTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('tsDef/index'));
const generateTsDefModuleTypesTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('tsDef/moduleTypes'));
const generateTsDefTypesTemplate = handlebars_1.default.compile((0, index_js_1.readTemplate)('tsDef/types'));
/** @internal */
function createGetter(definitions, name = '', type, imports) {
    (0, index_js_1.setImports)(definitions, imports, [type]);
    return `  readonly ${name}: ${type};\n`;
}
/** @internal */
function errorUnhandled(_, _definitions, def, _imports) {
    throw new Error(`Generate: ${def.name || ''}: Unhandled type ${types_create_1.TypeDefInfo[def.info]}`);
}
/** @internal */
function tsExport(registry, definitions, def, imports) {
    return (0, index_js_1.exportInterface)(def.lookupIndex, def.name, (0, index_js_1.formatType)(registry, definitions, def, imports, false));
}
/** @internal */
function tsEnum(registry, definitions, { lookupIndex, name: enumName, sub }, imports, withShortcut = false) {
    (0, index_js_1.setImports)(definitions, imports, ['Enum']);
    const indent = withShortcut ? '  ' : '';
    const named = sub.filter(({ name }) => !!name && !name.startsWith('__Unused'));
    const keys = named.map((def) => {
        const { info, lookupName, name = '', sub, type } = def;
        const getter = (0, util_1.stringPascalCase)(name.replace(' ', '_'));
        const isComplex = [types_create_1.TypeDefInfo.Option, types_create_1.TypeDefInfo.Range, types_create_1.TypeDefInfo.RangeInclusive, types_create_1.TypeDefInfo.Result, types_create_1.TypeDefInfo.Struct, types_create_1.TypeDefInfo.Tuple, types_create_1.TypeDefInfo.Vec, types_create_1.TypeDefInfo.VecFixed].includes(info);
        let extractedLookupName;
        // When the parent type does not have a lookupName, and the sub type is the same
        // type as the parent we can take the lookupName from the sub.
        // This is specific to `StagingXcmV4Junction`.
        // see: https://github.com/polkadot-js/api/pull/5812
        if (sub && !Array.isArray(sub) && type.includes(`${sub.type};`)) {
            if (sub.lookupName === 'StagingXcmV4Junction') {
                extractedLookupName = sub.lookupName;
            }
            else if (sub.lookupName === 'StagingXcmV5Junction') {
                extractedLookupName = `Vec<${sub.lookupName}>`;
            }
        }
        const asGetter = type === 'Null' || info === types_create_1.TypeDefInfo.DoNotConstruct
            ? ''
            : createGetter(definitions, `as${getter}`, lookupName || extractedLookupName || (isComplex ? (0, index_js_1.formatType)(registry, definitions, info === types_create_1.TypeDefInfo.Struct ? def : type, imports, withShortcut) : type), imports);
        const isGetter = info === types_create_1.TypeDefInfo.DoNotConstruct
            ? ''
            : createGetter(definitions, `is${getter}`, 'boolean', imports);
        switch (info) {
            case types_create_1.TypeDefInfo.Compact:
            case types_create_1.TypeDefInfo.Plain:
            case types_create_1.TypeDefInfo.Range:
            case types_create_1.TypeDefInfo.RangeInclusive:
            case types_create_1.TypeDefInfo.Result:
            case types_create_1.TypeDefInfo.Si:
            case types_create_1.TypeDefInfo.Struct:
            case types_create_1.TypeDefInfo.Tuple:
            case types_create_1.TypeDefInfo.Vec:
            case types_create_1.TypeDefInfo.BTreeMap:
            case types_create_1.TypeDefInfo.BTreeSet:
            case types_create_1.TypeDefInfo.Option:
            case types_create_1.TypeDefInfo.VecFixed:
            case types_create_1.TypeDefInfo.WrapperKeepOpaque:
            case types_create_1.TypeDefInfo.WrapperOpaque:
                return `${indent}${isGetter}${indent}${asGetter}`;
            case types_create_1.TypeDefInfo.DoNotConstruct:
            case types_create_1.TypeDefInfo.Null:
                return `${indent}${isGetter}`;
            default:
                throw new Error(`Enum: ${enumName || 'undefined'}: Unhandled type ${types_create_1.TypeDefInfo[info]}, ${(0, util_1.stringify)(def)}`);
        }
    });
    return (0, index_js_1.exportInterface)(lookupIndex, enumName, 'Enum', `${keys.join('')}  ${indent}readonly type: ${named.map(({ name = '' }) => `'${(0, util_1.stringPascalCase)(name.replace(' ', '_'))}'`).join(' | ')};\n`, withShortcut);
}
function tsInt(_, definitions, def, imports, type = 'Int') {
    (0, index_js_1.setImports)(definitions, imports, [type]);
    return (0, index_js_1.exportInterface)(def.lookupIndex, def.name, type);
}
/** @internal */
function tsNull(_registry, definitions, { lookupIndex = -1, name }, imports) {
    (0, index_js_1.setImports)(definitions, imports, ['Null']);
    // * @description extends [[${base}]]
    const doc = `/** @name ${name || ''}${lookupIndex !== -1 ? ` (${lookupIndex})` : ''} */\n`;
    return `${doc}export type ${name || ''} = Null;`;
}
/** @internal */
function tsResultGetter(registry, definitions, resultName = '', getter, def, imports) {
    const { info, lookupName, type } = def;
    const asGetter = type === 'Null'
        ? ''
        : createGetter(definitions, `as${getter}`, lookupName || (info === types_create_1.TypeDefInfo.Tuple ? (0, index_js_1.formatType)(registry, definitions, def, imports, false) : type), imports);
    const isGetter = createGetter(definitions, `is${getter}`, 'boolean', imports);
    switch (info) {
        case types_create_1.TypeDefInfo.Option:
        case types_create_1.TypeDefInfo.Plain:
        case types_create_1.TypeDefInfo.Si:
        case types_create_1.TypeDefInfo.Tuple:
        case types_create_1.TypeDefInfo.Vec:
        case types_create_1.TypeDefInfo.BTreeMap:
        case types_create_1.TypeDefInfo.BTreeSet:
        case types_create_1.TypeDefInfo.WrapperKeepOpaque:
        case types_create_1.TypeDefInfo.WrapperOpaque:
            return `${isGetter}${asGetter}`;
        case types_create_1.TypeDefInfo.Null:
            return `${isGetter}`;
        default:
            throw new Error(`Result: ${resultName}: Unhandled type ${types_create_1.TypeDefInfo[info]}, ${(0, util_1.stringify)(def)}`);
    }
}
/** @internal */
function tsResult(registry, definitions, def, imports) {
    const [okDef, errorDef] = def.sub;
    const inner = [
        tsResultGetter(registry, definitions, def.name, 'Err', errorDef, imports),
        tsResultGetter(registry, definitions, def.name, 'Ok', okDef, imports)
    ].join('');
    (0, index_js_1.setImports)(definitions, imports, [def.type]);
    const fmtType = def.lookupName && def.name !== def.lookupName
        ? def.lookupName
        : (0, index_js_1.formatType)(registry, definitions, def, imports, false);
    return (0, index_js_1.exportInterface)(def.lookupIndex, def.name, fmtType, inner);
}
/** @internal */
function tsSi(_registry, _definitions, typeDef, _imports) {
    // FIXME
    return `// SI: ${(0, util_1.stringify)(typeDef)}`;
}
/** @internal */
function tsSet(_, definitions, { lookupIndex, name: setName, sub }, imports) {
    (0, index_js_1.setImports)(definitions, imports, ['Set']);
    const types = sub.map(({ name }) => {
        (0, util_1.assert)(name, 'Invalid TypeDef found, no name specified');
        return createGetter(definitions, `is${name}`, 'boolean', imports);
    });
    return (0, index_js_1.exportInterface)(lookupIndex, setName, 'Set', types.join(''));
}
/** @internal */
function tsStruct(registry, definitions, { lookupIndex, name: structName, sub }, imports) {
    (0, index_js_1.setImports)(definitions, imports, ['Struct']);
    const keys = sub.map((def) => {
        const fmtType = def.lookupName && def.name !== def.lookupName
            ? def.lookupName
            : def.info === types_create_1.TypeDefInfo.Enum
                ? `${tsEnum(registry, definitions, def, imports, true)} & Enum`
                : (0, index_js_1.formatType)(registry, definitions, def, imports, false);
        return createGetter(definitions, def.name, fmtType, imports);
    });
    return (0, index_js_1.exportInterface)(lookupIndex, structName, 'Struct', keys.join(''));
}
/** @internal */
function tsUInt(registry, definitions, def, imports) {
    return tsInt(registry, definitions, def, imports, 'UInt');
}
/** @internal */
function tsVec(registry, definitions, def, imports) {
    const type = def.sub.type;
    if (type === 'u8') {
        if (def.info === types_create_1.TypeDefInfo.VecFixed) {
            (0, index_js_1.setImports)(definitions, imports, ['U8aFixed']);
            return (0, index_js_1.exportInterface)(def.lookupIndex, def.name, 'U8aFixed');
        }
        else {
            (0, index_js_1.setImports)(definitions, imports, ['Bytes']);
            return (0, index_js_1.exportInterface)(def.lookupIndex, def.name, 'Bytes');
        }
    }
    const fmtType = def.lookupName && def.name !== def.lookupName
        ? def.lookupName
        : (0, index_js_1.formatType)(registry, definitions, def, imports, false);
    return (0, index_js_1.exportInterface)(def.lookupIndex, def.name, fmtType);
}
exports.typeEncoders = {
    [types_create_1.TypeDefInfo.BTreeMap]: tsExport,
    [types_create_1.TypeDefInfo.BTreeSet]: tsExport,
    [types_create_1.TypeDefInfo.Compact]: tsExport,
    [types_create_1.TypeDefInfo.DoNotConstruct]: tsExport,
    [types_create_1.TypeDefInfo.Enum]: tsEnum,
    [types_create_1.TypeDefInfo.HashMap]: tsExport,
    [types_create_1.TypeDefInfo.Int]: tsInt,
    [types_create_1.TypeDefInfo.Linkage]: errorUnhandled,
    [types_create_1.TypeDefInfo.Null]: tsNull,
    [types_create_1.TypeDefInfo.Option]: tsExport,
    [types_create_1.TypeDefInfo.Plain]: tsExport,
    [types_create_1.TypeDefInfo.Range]: tsExport,
    [types_create_1.TypeDefInfo.RangeInclusive]: tsExport,
    [types_create_1.TypeDefInfo.Result]: tsResult,
    [types_create_1.TypeDefInfo.Set]: tsSet,
    [types_create_1.TypeDefInfo.Si]: tsSi,
    [types_create_1.TypeDefInfo.Struct]: tsStruct,
    [types_create_1.TypeDefInfo.Tuple]: tsExport,
    [types_create_1.TypeDefInfo.UInt]: tsUInt,
    [types_create_1.TypeDefInfo.Vec]: tsVec,
    [types_create_1.TypeDefInfo.VecFixed]: tsVec,
    [types_create_1.TypeDefInfo.WrapperKeepOpaque]: tsExport,
    [types_create_1.TypeDefInfo.WrapperOpaque]: tsExport
};
/** @internal */
function generateInterfaces(registry, definitions, { types }, imports) {
    return Object.entries(types).map(([name, type]) => {
        const def = (0, types_create_1.getTypeDef)((0, util_1.isString)(type) ? type : (0, util_1.stringify)(type), { name });
        return [name, exports.typeEncoders[def.info](registry, definitions, def, imports)];
    });
}
/** @internal */
function generateTsDefFor(registry, importDefinitions, defName, { types }, outputDir) {
    const imports = { ...(0, index_js_1.createImports)(importDefinitions, { types }), interfaces: [] };
    const definitions = imports.definitions;
    const interfaces = generateInterfaces(registry, definitions, { types }, imports);
    const items = interfaces.sort((a, b) => a[0].localeCompare(b[0])).map(([, definition]) => definition);
    (0, index_js_1.writeFile)(node_path_1.default.join(outputDir, defName, 'types.ts'), () => generateTsDefModuleTypesTemplate({
        headerType: 'defs',
        imports,
        items,
        name: defName,
        types: [
            ...Object.keys(imports.localTypes).sort().map((packagePath) => ({
                file: packagePath.replace('@polkadot/types/augment', '@polkadot/types'),
                types: Object.keys(imports.localTypes[packagePath])
            }))
        ]
    }), true);
    (0, index_js_1.writeFile)(node_path_1.default.join(outputDir, defName, 'index.ts'), () => generateTsDefIndexTemplate({ headerType: 'defs' }), true);
}
/** @internal */
function generateTsDef(importDefinitions, outputDir, generatingPackage) {
    const registry = new create_1.TypeRegistry();
    (0, index_js_1.writeFile)(node_path_1.default.join(outputDir, 'types.ts'), () => {
        const definitions = importDefinitions[generatingPackage];
        Object.entries(definitions).forEach(([defName, obj]) => {
            console.log(`\tExtracting interfaces for ${defName}`);
            generateTsDefFor(registry, importDefinitions, defName, obj, outputDir);
        });
        return generateTsDefTypesTemplate({
            headerType: 'defs',
            items: Object.keys(definitions)
        });
    });
    (0, index_js_1.writeFile)(node_path_1.default.join(outputDir, 'index.ts'), () => generateTsDefIndexTemplate({ headerType: 'defs' }), true);
}
/** @internal */
function generateDefaultTsDef() {
    generateTsDef({ '@polkadot/types/interfaces': defaultDefinitions }, 'packages/types/src/interfaces', '@polkadot/types/interfaces');
}

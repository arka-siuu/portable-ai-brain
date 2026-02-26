"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEADER = void 0;
exports.exportInterface = exportInterface;
exports.formatType = formatType;
const tslib_1 = require("tslib");
const handlebars_1 = tslib_1.__importDefault(require("handlebars"));
const typesCodec = tslib_1.__importStar(require("@polkadot/types-codec"));
const types_create_1 = require("@polkadot/types-create");
const util_1 = require("@polkadot/util");
const file_js_1 = require("./file.js");
const imports_js_1 = require("./imports.js");
const NO_CODEC = ['Tuple', 'VecFixed'];
const ON_CODEC = Object.keys(typesCodec);
const ON_CODEC_TYPES = ['Codec', 'AnyJson', 'AnyFunction', 'AnyNumber', 'AnyString', 'AnyTuple', 'AnyU8a', 'ICompact', 'IEnum', 'IMap', 'INumber', 'IOption', 'IResult', 'ISet', 'IStruct', 'ITuple', 'IU8a', 'IVec', 'IMethod'];
const HEADER = (type) => `// Auto-generated via \`yarn polkadot-types-from-${type}\`, do not edit\n/* eslint-disable */\n\n`;
exports.HEADER = HEADER;
function extractImports({ imports, types }) {
    const toplevel = [
        ...Object.keys(imports.codecTypes),
        ...Object.keys(imports.extrinsicTypes),
        ...Object.keys(imports.genericTypes),
        ...Object.keys(imports.metadataTypes),
        ...Object.keys(imports.primitiveTypes)
    ];
    return [
        {
            file: '@polkadot/types',
            types: toplevel.filter((n) => !NO_CODEC.includes(n) && !ON_CODEC.includes(n))
        },
        {
            file: '@polkadot/types/lookup',
            types: Object.keys(imports.lookupTypes)
        },
        {
            file: '@polkadot/types/types',
            types: Object.keys(imports.typesTypes).filter((n) => !ON_CODEC_TYPES.includes(n))
        },
        {
            file: '@polkadot/types-codec',
            types: toplevel.filter((n) => !NO_CODEC.includes(n) && ON_CODEC.includes(n))
        },
        {
            file: '@polkadot/types-codec/types',
            types: Object.keys(imports.typesTypes).filter((n) => ON_CODEC_TYPES.includes(n))
        },
        ...types
    ]
        .filter(({ types }) => types.length)
        .sort(({ file }, b) => file.localeCompare(b.file))
        .map(({ file, types }) => `import type { ${types.sort().join(', ')} } from '${file}';`);
}
handlebars_1.default.registerPartial({
    header: handlebars_1.default.compile((0, file_js_1.readTemplate)('header'))
});
handlebars_1.default.registerHelper({
    importsAll() {
        return extractImports(this)
            .join('\n');
    },
    importsPackage() {
        return extractImports(this)
            .filter((l) => !l.includes("from '."))
            .join('\n  ');
    },
    importsRelative() {
        return extractImports(this)
            .filter((l) => l.includes("from '."))
            .join('\n');
    },
    trim(options) {
        return options.fn(this).trim();
    },
    upper(options) {
        return options.fn(this).toUpperCase();
    }
});
/** @internal */
function exportInterface(lookupIndex = -1, name = '', base, body = '', withShortcut = false) {
    // * @description extends [[${base}]]
    const doc = withShortcut
        ? ''
        : `/** @name ${name}${lookupIndex !== -1 ? ` (${lookupIndex})` : ''} */\n`;
    return `${doc}${withShortcut ? '' : `export interface ${name} extends ${base} `}{${body.length ? '\n' : ''}${body}${withShortcut ? '  ' : ''}}`;
}
function singleParamNotation(registry, wrapper, typeDef, definitions, imports, withShortcut) {
    const sub = typeDef.sub;
    (0, imports_js_1.setImports)(definitions, imports, [wrapper, sub.lookupName]);
    return (0, types_create_1.paramsNotation)(wrapper, sub.lookupName || formatType(registry, definitions, sub.type, imports, withShortcut));
}
function dualParamsNotation(registry, wrapper, typeDef, definitions, imports, withShortcut) {
    const [a, b] = typeDef.sub;
    (0, imports_js_1.setImports)(definitions, imports, [wrapper, a.lookupName, b.lookupName]);
    return (0, types_create_1.paramsNotation)(wrapper, [
        a.lookupName || formatType(registry, definitions, a.type, imports, withShortcut),
        b.lookupName || formatType(registry, definitions, b.type, imports, withShortcut)
    ]);
}
const formatters = {
    [types_create_1.TypeDefInfo.Compact]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'Compact', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.DoNotConstruct]: (_registry, _typeDef, definitions, imports, _withShortcut) => {
        (0, imports_js_1.setImports)(definitions, imports, ['DoNotConstruct']);
        return 'DoNotConstruct';
    },
    [types_create_1.TypeDefInfo.Enum]: (_registry, typeDef, _definitions, _imports, _withShortcut) => {
        if (typeDef.lookupName) {
            return typeDef.lookupName;
        }
        throw new Error(`TypeDefInfo.Enum: Parameter formatting not implemented on ${(0, util_1.stringify)(typeDef)}`);
    },
    [types_create_1.TypeDefInfo.Int]: (_registry, typeDef, _definitions, _imports, _withShortcut) => {
        throw new Error(`TypeDefInfo.Int: Parameter formatting not implemented on ${(0, util_1.stringify)(typeDef)}`);
    },
    [types_create_1.TypeDefInfo.UInt]: (_registry, typeDef, _definitions, _imports, _withShortcut) => {
        throw new Error(`TypeDefInfo.UInt: Parameter formatting not implemented on ${(0, util_1.stringify)(typeDef)}`);
    },
    [types_create_1.TypeDefInfo.Null]: (_registry, _typeDef, definitions, imports, _withShortcut) => {
        (0, imports_js_1.setImports)(definitions, imports, ['Null']);
        return 'Null';
    },
    [types_create_1.TypeDefInfo.Option]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'Option', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.Plain]: (_registry, typeDef, definitions, imports, _withShortcut) => {
        (0, imports_js_1.setImports)(definitions, imports, [typeDef.type]);
        return typeDef.type;
    },
    [types_create_1.TypeDefInfo.Range]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'Range', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.RangeInclusive]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'RangeInclusive', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.Set]: (_registry, typeDef, _definitions, _imports, _withShortcut) => {
        throw new Error(`TypeDefInfo.Set: Parameter formatting not implemented on ${(0, util_1.stringify)(typeDef)}`);
    },
    [types_create_1.TypeDefInfo.Si]: (registry, typeDef, definitions, imports, withShortcut) => {
        return formatType(registry, definitions, registry.lookup.getTypeDef(typeDef.type), imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.Struct]: (registry, typeDef, definitions, imports, withShortcut) => {
        if (typeDef.lookupName) {
            return typeDef.lookupName;
        }
        const sub = typeDef.sub;
        (0, imports_js_1.setImports)(definitions, imports, ['Struct', ...sub.map(({ lookupName }) => lookupName)]);
        return `{${withShortcut ? ' ' : '\n'}${sub.map(({ lookupName, name, type }, index) => [
            name || `unknown${index}`,
            lookupName || formatType(registry, definitions, type, imports, withShortcut)
        ]).map(([k, t]) => `${withShortcut ? '' : '    readonly '}${k}: ${t};`).join(withShortcut ? ' ' : '\n')}${withShortcut ? ' ' : '\n  '}} & Struct`;
    },
    [types_create_1.TypeDefInfo.Tuple]: (registry, typeDef, definitions, imports, withShortcut) => {
        const sub = typeDef.sub;
        (0, imports_js_1.setImports)(definitions, imports, ['ITuple', ...sub.map(({ lookupName }) => lookupName)]);
        // `(a,b)` gets transformed into `ITuple<[a, b]>`
        return (0, types_create_1.paramsNotation)('ITuple', `[${sub.map(({ lookupName, type }) => lookupName || formatType(registry, definitions, type, imports, withShortcut)).join(', ')}]`);
    },
    [types_create_1.TypeDefInfo.Vec]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'Vec', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.VecFixed]: (registry, typeDef, definitions, imports, withShortcut) => {
        const sub = typeDef.sub;
        if (sub.type === 'u8') {
            (0, imports_js_1.setImports)(definitions, imports, ['U8aFixed']);
            return 'U8aFixed';
        }
        return singleParamNotation(registry, 'Vec', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.BTreeMap]: (registry, typeDef, definitions, imports, withShortcut) => {
        return dualParamsNotation(registry, 'BTreeMap', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.BTreeSet]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'BTreeSet', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.HashMap]: (registry, typeDef, definitions, imports, withShortcut) => {
        return dualParamsNotation(registry, 'HashMap', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.Linkage]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'Linkage', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.Result]: (registry, typeDef, definitions, imports, withShortcut) => {
        return dualParamsNotation(registry, 'Result', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.WrapperKeepOpaque]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'WrapperKeepOpaque', typeDef, definitions, imports, withShortcut);
    },
    [types_create_1.TypeDefInfo.WrapperOpaque]: (registry, typeDef, definitions, imports, withShortcut) => {
        return singleParamNotation(registry, 'WrapperOpaque', typeDef, definitions, imports, withShortcut);
    }
};
/**
 * Correctly format a given type
 */
/** @internal */
function formatType(registry, definitions, type, imports, withShortcut = false) {
    let typeDef;
    if ((0, util_1.isString)(type)) {
        const _type = type.toString();
        // If type is "unorthodox" (i.e. `{ something: any }` for an Enum input or `[a | b | c, d | e | f]` for a Tuple's similar types),
        // we return it as-is
        if (withShortcut && /(^{.+:.+})|^\([^,]+\)|^\(.+\)\[\]|^\[.+\]/.exec(_type) && !/\[\w+;\w+\]/.exec(_type)) {
            return _type;
        }
        typeDef = (0, types_create_1.getTypeDef)(type);
    }
    else {
        typeDef = type;
    }
    (0, imports_js_1.setImports)(definitions, imports, [typeDef.lookupName || typeDef.type]);
    return formatters[typeDef.info](registry, typeDef, definitions, imports, withShortcut);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setImports = setImports;
exports.createImports = createImports;
const tslib_1 = require("tslib");
const codecClasses = tslib_1.__importStar(require("@polkadot/types/codec"));
const extrinsicClasses = tslib_1.__importStar(require("@polkadot/types/extrinsic"));
const genericClasses = tslib_1.__importStar(require("@polkadot/types/generic"));
const primitiveClasses = tslib_1.__importStar(require("@polkadot/types/primitive"));
const types_create_1 = require("@polkadot/types-create");
function splitAlternatives(type) {
    const alternatives = [];
    let beginOfAlternative = 1;
    let level = 0;
    // we assume that the string starts with '['
    for (let i = 1, count = type.length; i < count; i++) {
        if (level === 0) {
            switch (type[i]) {
                case ']':
                case ',':
                case '|':
                    alternatives.push(type.substring(beginOfAlternative, i).trim());
                    beginOfAlternative = i + 1;
                    break;
            }
        }
        switch (type[i]) {
            case '[':
            case '(':
            case '<':
                level++;
                break;
            case ']':
            case ')':
            case '>':
                level--;
                break;
        }
    }
    return alternatives;
}
/** @internal */
function setImports(allDefs, imports, types) {
    const { codecTypes, extrinsicTypes, genericTypes, ignoredTypes, localTypes, metadataTypes, primitiveTypes, typesTypes } = imports;
    types.filter((t) => !!t).forEach((type) => {
        if (ignoredTypes.includes(type)) {
            // do nothing
        }
        else if (['AnyNumber', 'CallFunction', 'Codec', 'IExtrinsic', 'IMethod', 'ITuple'].includes(type)) {
            typesTypes[type] = true;
        }
        else if (['Metadata', 'PortableRegistry'].includes(type)) {
            metadataTypes[type] = true;
        }
        else if (codecClasses[type]) {
            codecTypes[type] = true;
        }
        else if (extrinsicClasses[type]) {
            extrinsicTypes[type] = true;
        }
        else if (genericClasses[type]) {
            genericTypes[type] = true;
        }
        else if (primitiveClasses[type]) {
            primitiveTypes[type] = true;
        }
        else if (type.startsWith('[') && type.includes('|')) {
            const splitTypes = splitAlternatives(type);
            setImports(allDefs, imports, splitTypes);
        }
        else if (type.includes('<') || type.includes('(') || type.includes('[')) {
            // If the type is a bit special (tuple, fixed u8, nested type...), then we
            // need to parse it with `getTypeDef`.
            const typeDef = (0, types_create_1.getTypeDef)(type);
            setImports(allDefs, imports, [types_create_1.TypeDefInfo[typeDef.info]]);
            // TypeDef.sub is a `TypeDef | TypeDef[]`
            if (Array.isArray(typeDef.sub)) {
                typeDef.sub.forEach((subType) => setImports(allDefs, imports, [subType.lookupName || subType.type]));
            }
            else if (typeDef.sub && (typeDef.info !== types_create_1.TypeDefInfo.VecFixed || typeDef.sub.type !== 'u8')) {
                // typeDef.sub is a TypeDef in this case
                setImports(allDefs, imports, [typeDef.sub.lookupName || typeDef.sub.type]);
            }
        }
        else {
            // find this module inside the exports from the rest
            const [moduleName] = Object.entries(allDefs).find(([, { types }]) => Object.keys(types).includes(type)) || [null];
            if (moduleName) {
                localTypes[moduleName][type] = true;
            }
        }
    });
}
/** @internal */
function createImports(importDefinitions, { types } = { types: {} }) {
    const definitions = {};
    const typeToModule = {};
    Object.entries(importDefinitions).forEach(([packagePath, packageDef]) => {
        Object.entries(packageDef).forEach(([name, moduleDef]) => {
            const fullName = `${packagePath}/${name}`;
            definitions[fullName] = moduleDef;
            Object.keys(moduleDef.types).forEach((type) => {
                if (typeToModule[type]) {
                    console.warn(`\t\tWARN: Overwriting duplicated type '${type}' ${typeToModule[type]} -> ${fullName}`);
                }
                typeToModule[type] = fullName;
            });
        });
    });
    return {
        codecTypes: {},
        definitions,
        extrinsicTypes: {},
        genericTypes: {},
        ignoredTypes: Object.keys(types),
        localTypes: Object.keys(definitions).reduce((local, mod) => {
            local[mod] = {};
            return local;
        }, {}),
        lookupTypes: {},
        metadataTypes: {},
        primitiveTypes: {},
        typeToModule,
        typesTypes: {}
    };
}

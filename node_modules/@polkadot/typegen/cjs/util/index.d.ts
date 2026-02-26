export * from './assert.js';
export * from './derived.js';
export * from './docs.js';
export * from './file.js';
export * from './formatting.js';
export * from './imports.js';
export * from './initMeta.js';
export * from './register.js';
export * from './wsMeta.js';
interface Cmp {
    name: {
        toString(): string;
    };
}
export declare function compareName(a: Cmp, b: Cmp): number;

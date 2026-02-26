"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareName = compareName;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./assert.js"), exports);
tslib_1.__exportStar(require("./derived.js"), exports);
tslib_1.__exportStar(require("./docs.js"), exports);
tslib_1.__exportStar(require("./file.js"), exports);
tslib_1.__exportStar(require("./formatting.js"), exports);
tslib_1.__exportStar(require("./imports.js"), exports);
tslib_1.__exportStar(require("./initMeta.js"), exports);
tslib_1.__exportStar(require("./register.js"), exports);
tslib_1.__exportStar(require("./wsMeta.js"), exports);
function compareName(a, b) {
    return a.name.toString().localeCompare(b.name.toString());
}

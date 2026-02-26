"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDir = assertDir;
exports.assertFile = assertFile;
const tslib_1 = require("tslib");
const node_fs_1 = tslib_1.__importDefault(require("node:fs"));
const util_1 = require("@polkadot/util");
function assertDir(path) {
    (0, util_1.assert)(node_fs_1.default.existsSync(path) && node_fs_1.default.lstatSync(path).isDirectory(), `${path} is not a directory`);
    return path;
}
function assertFile(path) {
    (0, util_1.assert)(node_fs_1.default.existsSync(path) && node_fs_1.default.lstatSync(path).isFile(), `${path} is not a file`);
    return path;
}

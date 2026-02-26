"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sr25519DeriveSoft = void 0;
const tslib_1 = require("tslib");
const sr25519 = tslib_1.__importStar(require("@scure/sr25519"));
const derive_js_1 = require("./derive.js");
exports.sr25519DeriveSoft = (0, derive_js_1.createDeriveFn)(sr25519.HDKD.secretSoft);

import * as sr25519 from '@scure/sr25519';
import { createDeriveFn } from './derive.js';
export const sr25519DeriveSoft = /*#__PURE__*/ createDeriveFn(sr25519.HDKD.secretSoft);

import fs from 'node:fs';
import { assert } from '@polkadot/util';
export function assertDir(path) {
    assert(fs.existsSync(path) && fs.lstatSync(path).isDirectory(), `${path} is not a directory`);
    return path;
}
export function assertFile(path) {
    assert(fs.existsSync(path) && fs.lstatSync(path).isFile(), `${path} is not a file`);
    return path;
}

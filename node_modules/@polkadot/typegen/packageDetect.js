import { packageInfo as apiInfo } from '@polkadot/api/packageInfo';
import { packageInfo as providerInfo } from '@polkadot/rpc-provider/packageInfo';
import { packageInfo as typesInfo } from '@polkadot/types/packageInfo';
import { detectPackage } from '@polkadot/util';
import { packageInfo } from './packageInfo.js';
detectPackage(packageInfo, null, [apiInfo, providerInfo, typesInfo]);

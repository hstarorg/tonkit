import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { WalletVersionEnum } from './enums';

export const WalletContractMap: Record<
  WalletVersionEnum,
  typeof WalletContractV4 | typeof WalletContractV5R1
> = {
  V4: WalletContractV4,
  V5R1: WalletContractV5R1,
};

export const APIV2Endpoints = {
  TONCENTER_MAINNET: 'https://toncenter.com/api/v2/jsonRPC',
  TONCENTER_TESTNET: 'https://testnet.toncenter.com/api/v2/jsonRPC',
};
